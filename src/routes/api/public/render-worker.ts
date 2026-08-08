import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ASSET_PLACEHOLDER_PREFIX, type RenderJobPayload } from "@/lib/renderTypes";

const ASSETS_BUCKET = "render-assets";
const OUTPUT_BUCKET = "renders";

/** A cold GitHub runner plus a long render needs long-lived asset URLs. */
const ASSET_URL_TTL = 60 * 60 * 6;
const OUTPUT_UPLOAD_TTL = 60 * 60 * 6;

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("claim"),
    jobId: z.string().uuid(),
    jobToken: z.string().uuid(),
  }),
  z.object({
    action: z.literal("progress"),
    jobId: z.string().uuid(),
    jobToken: z.string().uuid(),
    progress: z.number().min(0).max(100),
    message: z.string().max(300).optional(),
    status: z.enum(["rendering", "encoding"]).optional(),
    renderedFrames: z.number().int().nonnegative().optional(),
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
          .select("id, access_token, status, payload, total_frames")
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

          const { data: outputUpload, error: uploadError } = await supabaseAdmin.storage
            .from(OUTPUT_BUCKET)
            .createSignedUploadUrl(payload.outputPath, { upsert: true });

          if (uploadError || !outputUpload) {
            console.error("[render-worker] output upload url failed", uploadError);
            return json({ error: "Could not create the output upload URL" }, 500);
          }

          await supabaseAdmin
            .from("render_jobs")
            .update({ status: "rendering", progress: 8, message: "Preparing render" })
            .eq("id", job.id);

          return json({
            timeline: resolved.timeline,
            settings: resolved.settings,
            width: payload.width,
            height: payload.height,
            fps: payload.fps,
            durationInFrames: payload.durationInFrames,
            outputUploadUrl: outputUpload.signedUrl,
            uploadUrlTtlSeconds: OUTPUT_UPLOAD_TTL,
          });
        }

        if (parsed.action === "progress") {
          await supabaseAdmin
            .from("render_jobs")
            .update({
              status: parsed.status ?? "rendering",
              // Reserve the last few points for upload + link creation.
              progress: Math.min(95, Math.round(parsed.progress)),
              message: parsed.message ?? "Rendering",
              rendered_frames: parsed.renderedFrames ?? 0,
            })
            .eq("id", job.id);
          return json({ ok: true });
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
