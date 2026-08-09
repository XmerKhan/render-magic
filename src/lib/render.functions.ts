import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RenderJobPayload, RenderJobState, RenderUploadTarget } from "./renderTypes";
import { computeChunkCount } from "./renderTypes";

const ASSETS_BUCKET = "render-assets";
const OUTPUT_BUCKET = "renders";

/** Uploads are large; give the browser a generous window. */
const UPLOAD_URL_TTL = 60 * 60;
const DOWNLOAD_URL_TTL = 60 * 60 * 6;

const uploadRequestSchema = z.object({
  key: z.string().min(1).max(120),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(120),
  sizeBytes: z
    .number()
    .int()
    .nonnegative()
    .max(500 * 1024 * 1024),
});

const createSchema = z.object({
  // The timeline/settings shapes are large and app-owned; validate structurally
  // and let the render worker fail loudly on anything genuinely malformed.
  timeline: z.record(z.string(), z.unknown()),
  settings: z.record(z.string(), z.unknown()),
  width: z.number().int().min(16).max(4096),
  height: z.number().int().min(16).max(4096),
  fps: z.number().int().min(1).max(120),
  durationInFrames: z
    .number()
    .int()
    .min(1)
    .max(60 * 60 * 30),
  uploads: z.array(uploadRequestSchema).max(500),
});

const jobRefSchema = z.object({
  jobId: z.string().uuid(),
  token: z.string().uuid(),
});

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  return cleaned.length > 0 ? cleaned : "file";
}

/**
 * Creates a render job row and hands the browser one signed upload URL per media
 * file. Nothing is dispatched until `dispatchRenderJob` is called, so an aborted
 * upload just leaves an orphaned `queued` row.
 */
export const createRenderJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const jobId = crypto.randomUUID();
    const outputPath = `${jobId}/autocut-${jobId}.mp4`;

    const assetPaths: Record<string, string> = {};
    const targets: RenderUploadTarget[] = [];

    for (const upload of data.uploads) {
      const path = `${jobId}/${upload.key}-${sanitizeFilename(upload.filename)}`;
      assetPaths[upload.key] = path;

      const { data: signed, error } = await supabaseAdmin.storage
        .from(ASSETS_BUCKET)
        .createSignedUploadUrl(path, { upsert: true });

      if (error || !signed) {
        console.error("[createRenderJob] signed upload url failed", error);
        throw new Error(`Could not prepare upload for ${upload.filename}`);
      }

      targets.push({
        key: upload.key,
        path,
        signedUrl: signed.signedUrl,
        token: signed.token,
      });
    }

    const payload: RenderJobPayload = {
      timeline: data.timeline as unknown as RenderJobPayload["timeline"],
      settings: data.settings as unknown as RenderJobPayload["settings"],
      assetPaths,
      width: data.width,
      height: data.height,
      fps: data.fps,
      durationInFrames: data.durationInFrames,
      outputPath,
    };

    const { data: job, error: insertError } = await supabaseAdmin
      .from("render_jobs")
      .insert({
        id: jobId,
        payload: JSON.parse(JSON.stringify(payload)),
        total_frames: data.durationInFrames,
        status: "queued",
        message: "Uploading media",
      })
      .select("id, access_token")
      .single();

    if (insertError || !job) {
      console.error("[createRenderJob] insert failed", insertError);
      throw new Error("Could not create the render job");
    }

    return {
      jobId: job.id,
      token: job.access_token,
      uploads: targets,
      uploadUrlTtlSeconds: UPLOAD_URL_TTL,
    };
  });

/**
 * Triggers the GitHub Actions render workflow for an already-uploaded job.
 *
 * The workflow runner is the render farm: a free-tier runner gets 2 vCPUs and
 * ~7GB RAM, which is enough for Remotion but too slow to render a long video
 * serially in one job. So the timeline is split into `chunkCount` frame
 * ranges and rendered as parallel matrix jobs, then stitched together — see
 * computeChunkCount() and .github/workflows/render.yml.
 */
export const dispatchRenderJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => jobRefSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: job, error } = await supabaseAdmin
      .from("render_jobs")
      .select("id, access_token, status, payload, total_frames")
      .eq("id", data.jobId)
      .maybeSingle();

    if (error) {
      console.error("[dispatchRenderJob] lookup failed", error);
      throw new Error("Could not look up the render job");
    }
    if (!job || job.access_token !== data.token) {
      throw new Error("Render job not found");
    }
    if (job.status !== "queued") {
      // Idempotent: a retried dispatch must not start a second render.
      return { dispatched: false, status: job.status };
    }

    const payload = job.payload as unknown as RenderJobPayload;
    const chunkCount = computeChunkCount(job.total_frames, payload.fps);

    const token = process.env["GITHUB_RENDER_TOKEN"];
    const repo = process.env["GITHUB_RENDER_REPO"];
    const workflow = process.env["GITHUB_RENDER_WORKFLOW"] ?? "render.yml";
    const ref = process.env["GITHUB_RENDER_REF"] ?? "main";
    const appUrl = process.env["RENDER_CALLBACK_URL"] ?? process.env["APP_URL"];

    if (!token || !repo) {
      throw new Error(
        "The render farm is not configured yet. Add GITHUB_RENDER_TOKEN and GITHUB_RENDER_REPO, then try again.",
      );
    }
    if (!appUrl) {
      throw new Error(
        "The render farm has no callback URL. Add RENDER_CALLBACK_URL (your published app URL), then try again.",
      );
    }

    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
          // GitHub rejects API requests without a User-Agent with a 403.
          "User-Agent": "AutoCut-Render-Dispatcher",
        },

        body: JSON.stringify({
          ref,
          inputs: {
            job_id: data.jobId,
            job_token: data.token,
            app_url: appUrl.replace(/\/+$/, ""),
            chunk_count: String(chunkCount),
          },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`[dispatchRenderJob] github dispatch failed [${res.status}]: ${body}`);
      const hint =
        res.status === 404
          ? ` The repo "${repo}", the branch "${ref}", or the workflow "${workflow}" could not be found with the configured token. Make sure this project's code (including .github/workflows/${workflow}) is pushed to that repo on branch "${ref}", and that the token has Actions: Read and write on it.`
          : res.status === 403
            ? " GitHub refused the request — check that the token is valid and has Actions: Read and write on the repo."
            : "";
      const detail = `Could not start the render worker (GitHub returned ${res.status}).${hint}`;
      await supabaseAdmin
        .from("render_jobs")
        .update({
          status: "failed",
          error: detail,
          message: "Failed to start",
        })
        .eq("id", data.jobId);
      throw new Error(`${detail} ${body.slice(0, 300)}`);
    }

    await supabaseAdmin
      .from("render_jobs")
      .update({ status: "dispatched", progress: 5, message: "Render worker starting up" })
      .eq("id", data.jobId);

    return { dispatched: true, status: "dispatched" as const };
  });

/** Polled by the browser. Returns a signed download URL once the render is done. */
export const getRenderJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => jobRefSchema.parse(input))
  .handler(async ({ data }): Promise<RenderJobState> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: job, error } = await supabaseAdmin
      .from("render_jobs")
      .select(
        "id, access_token, status, progress, message, error, output_path, rendered_frames, total_frames",
      )
      .eq("id", data.jobId)
      .maybeSingle();

    if (error) {
      console.error("[getRenderJob] lookup failed", error);
      throw new Error("Could not read the render status");
    }
    if (!job || job.access_token !== data.token) {
      throw new Error("Render job not found");
    }

    let downloadUrl: string | null = null;
    if (job.status === "done" && job.output_path) {
      const { data: signed, error: signError } = await supabaseAdmin.storage
        .from(OUTPUT_BUCKET)
        .createSignedUrl(job.output_path, DOWNLOAD_URL_TTL, {
          download: `autocut-${job.id}.mp4`,
        });
      if (signError || !signed) {
        console.error("[getRenderJob] signing download failed", signError);
        throw new Error("The video finished rendering but the download link could not be created");
      }
      downloadUrl = signed.signedUrl;
    }

    return {
      jobId: job.id,
      status: job.status as RenderJobState["status"],
      progress: job.progress,
      message: job.message,
      error: job.error,
      downloadUrl,
      renderedFrames: job.rendered_frames,
      totalFrames: job.total_frames,
    };
  });
