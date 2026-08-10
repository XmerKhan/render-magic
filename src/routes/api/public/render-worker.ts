import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  ASSET_PLACEHOLDER_PREFIX,
  chunkOutputPath,
  type RenderJobPayload,
} from "@/lib/renderTypes";

const ASSETS_BUCKET = "render-assets";
const OUTPUT_BUCKET = "renders";

/** A cold GitHub runner plus a long render needs long-lived asset URLs. */
const ASSET_URL_TTL = 60 * 60 * 6;
const OUTPUT_UPLOAD_TTL = 60 * 60 * 6;

const chunkRefSchema = z.object({
  jobId: z.string().uuid(),
  jobToken: z.string().uuid(),
  chunkIndex: z.number().int().nonnegative(),
  chunkCount: z.number().int().min(1).max(64),
});

const bodySchema = z.discriminatedUnion("action", [
  // Called once per render chunk (one per GitHub Actions matrix job).
  chunkRefSchema.extend({ action: z.literal("claim") }),
  chunkRefSchema.extend({
    action: z.literal("progress"),
    progress: z.number().min(0).max(100),
    message: z.string().max(300).optional(),
    status: z.enum(["rendering", "encoding"]).optional(),
    renderedFrames: z.number().int().nonnegative().optional(),
  }),
  chunkRefSchema.extend({
    action: z.literal("heartbeat"),
    progress: z.number().min(0).max(100),
    renderedFrames: z.number().int().nonnegative().optional(),
    cpuPercent: z.number().nonnegative().optional(),
    memoryMb: z.number().nonnegative().optional(),
  }),
  chunkRefSchema.extend({ action: z.literal("complete-chunk") }),
  chunkRefSchema.extend({
    action: z.literal("chunk-fail"),
    error: z.string().max(2000),
    final: z.boolean().default(false),
  }),
  // Called once by the stitch job, after every chunk has rendered.
  z.object({
    action: z.literal("stitch-claim"),
    jobId: z.string().uuid(),
    jobToken: z.string().uuid(),
    chunkCount: z.number().int().min(1).max(64),
  }),
  z.object({
    action: z.literal("complete"),
    jobId: z.string().uuid(),
    jobToken: z.string().uuid(),
  }),
  z.object({
    action: z.literal("fail"),
    jobId: z.string().uuid(),
    jobToken: z.string().uuid(),
    error: z.string().max(2000),
  }),
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Callback endpoint for the GitHub Actions render worker.
 *
 * A render job is split into `chunk_count` parallel chunks (matrix jobs), each
 * of which claims its own frame range, renders it, and uploads a segment. A
 * final stitch job (see .github/workflows/render.yml) concatenates the
 * segments with ffmpeg once every chunk job has succeeded, and calls
 * "complete" with the final MP4 in place.
 *
 * Authentication is the per-job `access_token`, which the app passes to the
 * workflow at dispatch time. A leaked token grants access to exactly one job's
 * media and output, and nothing else in the project.
 */
export const Route = createFileRoute("/api/public/render-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch (err) {
          console.error("[render-worker] invalid body", err);
          return json({ error: "Invalid request body" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: job, error } = await supabaseAdmin
          .from("render_jobs")
          .select("id, access_token, status, payload, total_frames, chunk_count, chunk_progress, started_at")
          .eq("id", parsed.jobId)
          .maybeSingle();

        if (error) {
          console.error("[render-worker] lookup failed", error);
          return json({ error: "Job lookup failed" }, 500);
        }
        if (!job || job.access_token !== parsed.jobToken) {
          return json({ error: "Job not found" }, 404);
        }
        if (job.status === "done" || job.status === "completed") {
          return json({ error: "Job already finished" }, 409);
        }

        const payload = job.payload as unknown as RenderJobPayload;

        if (parsed.action === "claim") {
          // First chunk to reach us flips the job into "rendering" and pins
          // chunk_count / initializes the per-chunk progress array. Later
          // chunks (or a retried dispatch) see it already set and skip this -
          // re-running it would reset progress other chunks already reported.
          const { data: checkpoint } = await supabaseAdmin
            .from("render_job_chunks")
            .select("status, attempt, frame_from, frame_to, output_path")
            .eq("job_id", job.id)
            .eq("chunk_index", parsed.chunkIndex)
            .maybeSingle();
          if (!checkpoint) return json({ error: "Chunk checkpoint not found" }, 404);
          if (checkpoint.status === "completed") return json({ alreadyCompleted: true });

          if (job.status === "queued" || job.status === "dispatched") {
            await supabaseAdmin
              .from("render_jobs")
              .update({
                status: "rendering",
                progress: 5,
                message: "Preparing render",
                chunk_count: parsed.chunkCount,
                started_at: new Date().toISOString(),
                last_heartbeat_at: new Date().toISOString(),
              })
              .eq("id", job.id);
          }

          const attempt = checkpoint.attempt + 1;
          await supabaseAdmin
            .from("render_job_chunks")
            .update({
              status: attempt > 1 ? "retrying" : "rendering",
              attempt,
              error: null,
              started_at: checkpoint.status === "queued" ? new Date().toISOString() : undefined,
              last_heartbeat_at: new Date().toISOString(),
            })
            .eq("job_id", job.id)
            .eq("chunk_index", parsed.chunkIndex);

          // Resolve every `job-asset:<key>` placeholder into a signed URL.
          const signedByKey: Record<string, string> = {};
          for (const [key, path] of Object.entries(payload.assetPaths ?? {})) {
            const { data: signed, error: signError } = await supabaseAdmin.storage
              .from(ASSETS_BUCKET)
              .createSignedUrl(path, ASSET_URL_TTL);
            if (signError || !signed) {
              console.error(`[render-worker] could not sign asset ${path}`, signError);
              return json({ error: `Missing media file for "${key}"` }, 500);
            }
            signedByKey[key] = signed.signedUrl;
          }

          const resolved = JSON.parse(
            JSON.stringify({ timeline: payload.timeline, settings: payload.settings }),
            (_key, value) => {
              if (typeof value === "string" && value.startsWith(ASSET_PLACEHOLDER_PREFIX)) {
                const assetKey = value.slice(ASSET_PLACEHOLDER_PREFIX.length);
                return signedByKey[assetKey] ?? null;
              }
              return value;
            },
          ) as { timeline: unknown; settings: unknown };

          const outputPath = chunkOutputPath(job.id, parsed.chunkIndex);
          const { data: outputUpload, error: uploadError } = await supabaseAdmin.storage
            .from(OUTPUT_BUCKET)
            .createSignedUploadUrl(outputPath, { upsert: true });

          if (uploadError || !outputUpload) {
            console.error("[render-worker] chunk upload url failed", uploadError);
            return json({ error: "Could not create the chunk upload URL" }, 500);
          }

          return json({
            timeline: resolved.timeline,
            settings: resolved.settings,
            width: payload.width,
            height: payload.height,
            fps: payload.fps,
            durationInFrames: payload.durationInFrames,
            frameRange: [checkpoint.frame_from, checkpoint.frame_to],
            outputUploadUrl: outputUpload.signedUrl,
            uploadUrlTtlSeconds: OUTPUT_UPLOAD_TTL,
            attempt,
            signedAssets: signedByKey,
          });
        }

        if (parsed.action === "progress" || parsed.action === "heartbeat") {
          const now = new Date();
          await supabaseAdmin
            .from("render_job_chunks")
            .update({
              status: "rendering",
              progress: parsed.progress,
              last_heartbeat_at: now.toISOString(),
            })
            .eq("job_id", job.id)
            .eq("chunk_index", parsed.chunkIndex);

          const { data: chunks } = await supabaseAdmin
            .from("render_job_chunks")
            .select("progress, status, frame_from, frame_to")
            .eq("job_id", job.id)
            .order("chunk_index");
          const safeChunks = chunks ?? [];
          const overall = safeChunks.length
            ? safeChunks.reduce((sum, chunk) => sum + chunk.progress, 0) / safeChunks.length
            : 0;
          const completed = safeChunks.filter((chunk) => chunk.status === "completed").length;
          const startedAt = job.status === "dispatched" ? now : new Date(job.started_at ?? now);
          const elapsedSeconds = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 1000));
          const etaSeconds = overall > 0 ? Math.max(0, Math.round(elapsedSeconds * (100 - overall) / overall)) : null;
          const renderedFrames = safeChunks.reduce((sum, chunk) => {
            const frames = chunk.frame_to - chunk.frame_from + 1;
            return sum + Math.round(frames * chunk.progress / 100);
          }, 0);
          await supabaseAdmin
            .from("render_jobs")
            .update({
              status: "rendering",
              // Reserve the last few points for the stitch step.
              progress: Math.min(94, Math.round(overall)),
              message: parsed.action === "progress" ? parsed.message ?? "Rendering" : `Rendering chunk ${parsed.chunkIndex + 1}/${parsed.chunkCount}`,
              rendered_frames: renderedFrames,
              chunk_progress: safeChunks.map((chunk) => chunk.progress),
              completed_chunks: completed,
              current_chunk: parsed.chunkIndex,
              last_heartbeat_at: now.toISOString(),
              started_at: startedAt.toISOString(),
              elapsed_seconds: elapsedSeconds,
              eta_seconds: etaSeconds,
            })
            .eq("id", job.id);
          return json({ ok: true });
        }

        if (parsed.action === "complete-chunk") {
          const outputPath = chunkOutputPath(job.id, parsed.chunkIndex);
          const slash = outputPath.lastIndexOf("/");
          const folder = outputPath.slice(0, slash);
          const name = outputPath.slice(slash + 1);
          const { data: listed } = await supabaseAdmin.storage.from(OUTPUT_BUCKET).list(folder, { search: name });
          if (!listed?.some((file) => file.name === name)) return json({ error: "Uploaded chunk was not found" }, 400);
          await supabaseAdmin
            .from("render_job_chunks")
            .update({ status: "completed", progress: 100, output_path: outputPath, completed_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString(), error: null })
            .eq("job_id", job.id)
            .eq("chunk_index", parsed.chunkIndex);
          const { count } = await supabaseAdmin
            .from("render_job_chunks")
            .select("chunk_index", { count: "exact", head: true })
            .eq("job_id", job.id)
            .eq("status", "completed");
          await supabaseAdmin.from("render_jobs").update({
            status: "rendering",
            completed_chunks: count ?? 0,
            message: `Completed ${count ?? 0}/${parsed.chunkCount} chunks`,
            last_heartbeat_at: new Date().toISOString(),
          }).eq("id", job.id);
          return json({ ok: true });
        }

        if (parsed.action === "chunk-fail") {
          await supabaseAdmin.from("render_job_chunks").update({
            status: parsed.final ? "failed" : "retrying",
            error: parsed.error,
            last_heartbeat_at: new Date().toISOString(),
          }).eq("job_id", job.id).eq("chunk_index", parsed.chunkIndex);
          await supabaseAdmin.from("render_jobs").update({
            status: parsed.final ? "failed" : "retrying",
            error: parsed.final ? parsed.error : null,
            message: parsed.final ? `Chunk ${parsed.chunkIndex + 1} failed` : `Retrying chunk ${parsed.chunkIndex + 1}/${parsed.chunkCount}`,
            current_chunk: parsed.chunkIndex,
            last_heartbeat_at: new Date().toISOString(),
          }).eq("id", job.id);
          return json({ ok: true });
        }

        if (parsed.action === "stitch-claim") {
          const chunkUrls: string[] = [];
          const { data: completedChunks } = await supabaseAdmin
            .from("render_job_chunks")
            .select("chunk_index, output_path, status")
            .eq("job_id", job.id)
            .order("chunk_index");
          if (!completedChunks || completedChunks.length !== parsed.chunkCount || completedChunks.some((chunk) => chunk.status !== "completed")) {
            return json({ error: "Not all chunks have completed" }, 409);
          }
          for (let i = 0; i < parsed.chunkCount; i += 1) {
            const { data: signed, error: signError } = await supabaseAdmin.storage
              .from(OUTPUT_BUCKET)
              .createSignedUrl(chunkOutputPath(job.id, i), ASSET_URL_TTL);
            if (signError || !signed) {
              console.error(`[render-worker] could not sign chunk ${i}`, signError);
              return json({ error: `Missing rendered chunk ${i}` }, 500);
            }
            chunkUrls.push(signed.signedUrl);
          }

          const { data: outputUpload, error: uploadError } = await supabaseAdmin.storage
            .from(OUTPUT_BUCKET)
            .createSignedUploadUrl(payload.outputPath, { upsert: true });
          if (uploadError || !outputUpload) {
            console.error("[render-worker] output upload url failed", uploadError);
            return json({ error: "Could not create the output upload URL" }, 500);
          }

          await supabaseAdmin
            .from("render_jobs")
            .update({ status: "stitching", progress: 95, message: "Combining chunks" })
            .eq("id", job.id);

          return json({
            chunkUrls,
            outputUploadUrl: outputUpload.signedUrl,
            uploadUrlTtlSeconds: OUTPUT_UPLOAD_TTL,
            totalFrames: job.total_frames,
            fps: payload.fps,
          });
        }

        if (parsed.action === "complete") {
          // Trust nothing: verify the object actually landed in storage.
          const slash = payload.outputPath.lastIndexOf("/");
          const folder = slash === -1 ? "" : payload.outputPath.slice(0, slash);
          const name = payload.outputPath.slice(slash + 1);
          const { data: listed } = await supabaseAdmin.storage
            .from(OUTPUT_BUCKET)
            .list(folder, { search: name });
          const uploaded = listed?.find((f) => f.name === name);

          if (!uploaded) {
            await supabaseAdmin
              .from("render_jobs")
              .update({
                status: "failed",
                error: "The render finished but the video file was not uploaded.",
                message: "Upload missing",
              })
              .eq("id", job.id);
            return json({ error: "Output file not found in storage" }, 400);
          }

          await supabaseAdmin
            .from("render_jobs")
            .update({
              status: "done",
              progress: 100,
              message: "Render complete",
              output_path: payload.outputPath,
              rendered_frames: job.total_frames,
              error: null,
            })
            .eq("id", job.id);

          // Best-effort cleanup of the intermediate per-chunk files.
          const chunkPaths = Array.from({ length: job.chunk_count || 1 }, (_, i) =>
            chunkOutputPath(job.id, i),
          );
          await supabaseAdmin.storage.from(OUTPUT_BUCKET).remove(chunkPaths);

          return json({ ok: true });
        }

        await supabaseAdmin
          .from("render_jobs")
          .update({ status: "failed", error: parsed.error, message: "Render failed" })
          .eq("id", job.id);
        return json({ ok: true });
      },
    },
  },
});
