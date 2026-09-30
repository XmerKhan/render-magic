import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RenderJobPayload, RenderJobState, RenderUploadTarget } from "./renderTypes";
import { chunkFrameRange, chunkOutputPath, computeChunkCount } from "./renderTypes";

const ASSETS_BUCKET = "render-assets";
const OUTPUT_BUCKET = "renders";
const DEFAULT_RENDER_REPO = "XmerKhan/render-magic";
const DEFAULT_RENDER_WORKFLOW = "render.yml";
const DEFAULT_RENDER_REF = "main";
const DEFAULT_CALLBACK_URL = "https://www.editsfieldai.online";

async function ensureStorageBucket(
  supabaseAdmin: typeof import("@/integrations/supabase/client.server").supabaseAdmin,
  bucketId: string,
): Promise<void> {
  const { data: existing } = await supabaseAdmin.storage.getBucket(bucketId);
  if (existing) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucketId, {
    public: false,
  });

  if (createError && !/already exists|duplicate|409/i.test(createError.message)) {
    throw new Error(
      `Could not create Supabase Storage bucket "${bucketId}": ${createError.message}`,
    );
  }
}

/** Uploads are large; give the browser a generous window. */
const UPLOAD_URL_TTL = 60 * 60;

const uploadRequestSchema = z.object({
  key: z.string().min(1).max(120),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().nonnegative().max(500 * 1024 * 1024),
});

const createSchema = z.object({
  timeline: z.record(z.string(), z.unknown()),
  settings: z.record(z.string(), z.unknown()),
  width: z.number().int().min(16).max(4096),
  height: z.number().int().min(16).max(4096),
  fps: z.number().int().min(1).max(120),
  durationInFrames: z.number().int().min(1).max(60 * 60 * 30),
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

export const createRenderJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const jobId = crypto.randomUUID();
    const outputPath = `${jobId}/editsfield-ai-${jobId}.mp4`;

    await ensureStorageBucket(supabaseAdmin, ASSETS_BUCKET);
    await ensureStorageBucket(supabaseAdmin, OUTPUT_BUCKET);

    const assetPaths: Record<string, string> = {};
    const targets: RenderUploadTarget[] = [];

    for (const upload of data.uploads) {
      const path = `${jobId}/${upload.key}-${sanitizeFilename(upload.filename)}`;
      assetPaths[upload.key] = path;

      const { data: signed, error } = await supabaseAdmin.storage
        .from(ASSETS_BUCKET)
        .createSignedUploadUrl(path, { upsert: true });

      if (error || !signed) {
        console.error("[createRenderJob] signed upload url failed", {
          filename: upload.filename,
          path,
          error,
        });
        throw new Error(
          `Could not prepare upload for ${upload.filename}: ${error?.message ?? "Supabase did not return a signed upload URL"}`,
        );
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
      throw new Error(
        `Could not create the render job: ${insertError?.message ?? "Supabase did not return the created job"}`,
      );
    }

    return {
      jobId: job.id,
      token: job.access_token,
      uploads: targets,
      uploadUrlTtlSeconds: UPLOAD_URL_TTL,
    };
  });

export const cleanupRenderOutput = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => jobRefSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: job, error } = await supabaseAdmin
      .from("render_jobs")
      .select("id, access_token, output_path")
      .eq("id", data.jobId)
      .maybeSingle();

    if (error || !job || job.access_token !== data.token) {
      throw new Error("Render job not found");
    }

    if (!job.output_path || !job.output_path.includes(".blob.vercel-storage.com/")) {
      return { cleaned: false };
    }

    const blobToken = process.env["BLOB_READ_WRITE_TOKEN"];
    if (!blobToken) {
      throw new Error("Vercel Blob is not configured for cleanup");
    }

    const response = await fetch("https://vercel.com/api/blob/delete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${blobToken}`,
        "Content-Type": "application/json",
        "x-api-version": "12",
      },
      body: JSON.stringify({ urls: [job.output_path] }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Could not delete temporary video [${response.status}]: ${body.slice(0, 300)}`);
    }

    await supabaseAdmin
      .from("render_jobs")
      .update({ output_path: null })
      .eq("id", job.id);

    return { cleaned: true };
  });

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
      return { dispatched: false, status: job.status };
    }

    const payload = job.payload as unknown as RenderJobPayload;
    const chunkCount = computeChunkCount(job.total_frames, payload.fps);

    const chunks = Array.from({ length: chunkCount }, (_, chunkIndex) => {
      const [frameFrom, frameTo] = chunkFrameRange(chunkIndex, chunkCount, job.total_frames);
      return {
        job_id: job.id,
        chunk_index: chunkIndex,
        frame_from: frameFrom,
        frame_to: frameTo,
        status: "queued",
        progress: 0,
        output_path: chunkOutputPath(job.id, chunkIndex),
      };
    });

    const { error: chunkError } = await supabaseAdmin
      .from("render_job_chunks")
      .upsert(chunks, { onConflict: "job_id,chunk_index", ignoreDuplicates: true });

    if (chunkError) {
      console.error("[dispatchRenderJob] chunk checkpoint creation failed", chunkError);
      throw new Error(`Could not prepare resumable render chunks: ${chunkError.message}`);
    }

    const token = process.env["GITHUB_RENDER_TOKEN"];
    const repo = process.env["GITHUB_RENDER_REPO"] ?? DEFAULT_RENDER_REPO;
    const workflow = process.env["GITHUB_RENDER_WORKFLOW"] ?? DEFAULT_RENDER_WORKFLOW;
    const ref = process.env["GITHUB_RENDER_REF"] ?? DEFAULT_RENDER_REF;
    const appUrl =
      process.env["RENDER_CALLBACK_URL"] ??
      process.env["APP_URL"] ??
      DEFAULT_CALLBACK_URL;

    if (!token) {
      throw new Error(
        "The render farm token is missing. Add GITHUB_RENDER_TOKEN to the Vercel Production environment, then redeploy.",
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
          "User-Agent": "EditsfieldAI-Render-Dispatcher",
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
          ? ` The repository "${repo}", branch "${ref}", or workflow "${workflow}" was not found with the configured token. Check that the token has Actions: Read and write access to this repository.`
          : res.status === 403
            ? " GitHub refused the request. Check that GITHUB_RENDER_TOKEN is valid and has Actions: Read and write access to the repository."
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
      .update({
        status: "dispatched",
        progress: 5,
        message: "Render workers starting",
        chunk_count: chunkCount,
        chunk_progress: Array(chunkCount).fill(0),
        chunk_attempts: Array(chunkCount).fill(0),
        completed_chunks: 0,
        current_chunk: null,
        last_heartbeat_at: new Date().toISOString(),
      })
      .eq("id", data.jobId);

    return { dispatched: true, status: "dispatched" as const };
  });

export const getRenderJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => jobRefSchema.parse(input))
  .handler(async ({ data }): Promise<RenderJobState> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: job, error } = await supabaseAdmin
      .from("render_jobs")
      .select(
        "id, access_token, status, progress, message, error, output_path, rendered_frames, total_frames, current_chunk, completed_chunks, chunk_count, elapsed_seconds, eta_seconds, last_heartbeat_at",
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
    if ((job.status === "done" || job.status === "completed") && job.output_path) {
      downloadUrl = job.output_path.includes("?")
        ? job.output_path
        : `${job.output_path}?download=1`;
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
      currentChunk: job.current_chunk,
      completedChunks: job.completed_chunks,
      totalChunks: job.chunk_count,
      elapsedSeconds: job.elapsed_seconds,
      etaSeconds: job.eta_seconds,
      lastHeartbeatAt: job.last_heartbeat_at,
    };
  });
