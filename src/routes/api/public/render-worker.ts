import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  ASSET_PLACEHOLDER_PREFIX,
  chunkFrameRange,
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
          .select("id, access_token, status, payload, total_frames, chunk_count, chunk_progress")
          .eq("id", parsed.jobId)
          .maybeSingle();

        if (error) {
          console.error("[render-worker] lookup failed", error);
          return json({ error: "Job lookup failed" }, 500);
        }
        if (!job || job.access_token !== parsed.jobToken) {
          return json({ error: "Job not found" }, 404);
        }
        if (job.status === "done") {
          return json({ error: "Job already finished" }, 409);
        }

        const payload = job.payload as unknown as RenderJobPayload;

        if (parsed.action === "claim") {
          // First chunk to reach us flips the job into "rendering" and pins
          // chunk_count / initializes the per-chunk progress array. Later
          // chunks (or a retried dispatch) see it already set and skip this -
          // re-running it would reset progress other chunks already reported.
          if (job.status === "queued" || job.status === "dispatched") {
            await supabaseAdmin
              .from("render_jobs")
              .update({
                status: "rendering",
                progress: 5,
                message: "Preparing render",
                chunk_count: parsed.chunkCount,
                chunk_progress: Array(parsed.chunkCount).fill(0),
              })
              .eq("id", job.id);
          }

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

          const [frameFrom, frameTo] = chunkFrameRange(
            parsed.chunkIndex,
            parsed.chunkCount,
            job.total_frames,
          );

          return json({
            timeline: resolved.timeline,
            settings: resolved.settings,
            width: payload.width,
            height: payload.height,
            fps: payload.fps,
            durationInFrames: payload.durationInFrames,
            frameRange: [frameFrom, frameTo],
            outputUploadUrl: outputUpload.signedUrl,
            uploadUrlTtlSeconds: OUTPUT_UPLOAD_TTL,
          });
        }

        if (parsed.action === "progress") {
          const progressArray: number[] = Array.isArray(job.chunk_progress)
            ? [...(job.chunk_progress as number[])]
            : [];
          while (progressArray.length < parsed.chunkCount) progressArray.push(0);
          progressArray[parsed.chunkIndex] = Math.min(100, Math.max(0, parsed.progress));

          const overall = progressArray.reduce((sum, p) => sum + p, 0) / progressArray.length;

          await supabaseAdmin
            .from("render_jobs")
            .update({
              status: parsed.status ?? "rendering",
              // Reserve the last few points for the stitch step.
              progress: Math.min(94, Math.round(overall)),
              message: parsed.message ?? "Rendering",
              rendered_frames: parsed.renderedFrames ?? 0,
              chunk_progress: progressArray,
            })
            .eq("id", job.id);
          return json({ ok: true });
        }

        if (parsed.action === "stitch-claim") {
          const chunkUrls: string[] = [];
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
