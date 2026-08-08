import type { EditSettings, MediaAsset, TimelineData } from "@/types";
import { getCompositionConfig } from "@/remotion/config";
import { assetPlaceholder, type RenderUploadRequest } from "@/lib/renderTypes";
import { createRenderJob, dispatchRenderJob, getRenderJob } from "@/lib/render.functions";
import { supabase } from "@/integrations/supabase/client";

const ASSETS_BUCKET = "render-assets";

/** Polling cadence and tolerance for transient network/API failures. */
const POLL_INTERVAL_MS = 2000;
const POLL_BACKOFF_MAX_MS = 15000;
const MAX_CONSECUTIVE_POLL_FAILURES = 8;
/** Safety net so a runner that dies silently doesn't hang the UI forever. */
const POLL_TIMEOUT_MS = 45 * 60 * 1000;

export interface ExportOptions {
  timeline: TimelineData;
  settings: EditSettings;
  assets: MediaAsset[];
  voiceoverFile: File | null;
  musicFile: File | null;
  onProgress: (progress: number, message: string) => void;
  signal?: AbortSignal;
}

class CancelledError extends Error {
  constructor() {
    super("Render cancelled");
    this.name = "CancelledError";
  }
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new CancelledError();
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new CancelledError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function extensionFor(file: File): string {
  const dot = file.name.lastIndexOf(".");
  return dot > 0 ? file.name.slice(dot) : "";
}

/**
 * Rewrites the timeline so every media URL becomes a `job-asset:<key>`
 * placeholder, and returns the matching upload manifest.
 *
 * Assets are keyed by their stable asset id rather than by filename, so two
 * files with the same name (or an asset that was renamed) can never be mapped to
 * the wrong scene.
 */
function prepareTimeline(
  timeline: TimelineData,
  assets: MediaAsset[],
  voiceoverFile: File | null,
  musicFile: File | null,
): { timeline: TimelineData; uploads: RenderUploadRequest[]; files: Map<string, File> } {
  const files = new Map<string, File>();
  const uploads: RenderUploadRequest[] = [];
  const assetById = new Map(assets.map((a) => [a.id, a]));

  const addUpload = (key: string, file: File, fallbackType: string) => {
    if (files.has(key)) return;
    files.set(key, file);
    uploads.push({
      key,
      filename: file.name || `${key}${extensionFor(file)}`,
      contentType: file.type || fallbackType,
      sizeBytes: file.size,
    });
  };

  const scenes = timeline.scenes.map((scene) => {
    const asset = assetById.get(scene.media.id);
    if (!asset?.file) {
      throw new Error(
        `Scene "${scene.id}" references media "${scene.media.name}" that is no longer loaded. Re-add the file and try again.`,
      );
    }
    const key = `asset-${asset.id}`;
    addUpload(key, asset.file, asset.kind === "video" ? "video/mp4" : "image/jpeg");
    return { ...scene, media: { ...scene.media, url: assetPlaceholder(key) } };
  });

  let voiceoverUrl = timeline.voiceoverUrl;
  if (voiceoverFile) {
    addUpload("voiceover", voiceoverFile, "audio/mpeg");
    voiceoverUrl = assetPlaceholder("voiceover");
  } else if (voiceoverUrl?.startsWith("blob:")) {
    // A blob URL is meaningless on the render worker.
    voiceoverUrl = null;
  }

  let musicUrl = timeline.musicUrl;
  if (musicFile) {
    addUpload("music", musicFile, "audio/mpeg");
    musicUrl = assetPlaceholder("music");
  } else if (musicUrl?.startsWith("blob:")) {
    musicUrl = null;
  }

  const settings: EditSettings = { ...timeline.settings, musicUrl };

  return {
    timeline: { ...timeline, scenes, voiceoverUrl, musicUrl, settings },
    uploads,
    files,
  };
}

export async function exportVideo(opts: ExportOptions): Promise<string> {
  const { assets, voiceoverFile, musicFile, onProgress, signal } = opts;

  throwIfAborted(signal);
  onProgress(1, "Preparing timeline...");

  const prepared = prepareTimeline(opts.timeline, assets, voiceoverFile, musicFile);
  const settings: EditSettings = { ...opts.settings, musicUrl: prepared.timeline.musicUrl };
  const config = getCompositionConfig(prepared.timeline, settings);

  const job = await createRenderJob({
    data: {
      timeline: prepared.timeline as unknown as Record<string, unknown>,
      settings: settings as unknown as Record<string, unknown>,
      width: config.width,
      height: config.height,
      fps: config.fps,
      durationInFrames: config.durationInFrames,
      uploads: prepared.uploads,
    },
  });

  // --- Upload media -------------------------------------------------------
  const total = job.uploads.length;
  for (let i = 0; i < total; i += 1) {
    throwIfAborted(signal);
    const target = job.uploads[i]!;
    const file = prepared.files.get(target.key);
    if (!file) throw new Error(`Internal error: no file for upload key ${target.key}`);

    onProgress(
      1 + ((i + 1) / Math.max(1, total)) * 11,
      `Uploading ${file.name} (${i + 1}/${total})...`,
    );

    const { error } = await supabase.storage
      .from(ASSETS_BUCKET)
      .uploadToSignedUrl(target.path, target.token, file, {
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      throw new Error(`Upload failed for ${file.name}: ${error.message}`);
    }
  }

  // --- Dispatch the render worker ----------------------------------------
  throwIfAborted(signal);
  onProgress(13, "Starting the render worker...");
  await dispatchRenderJob({ data: { jobId: job.jobId, token: job.token } });

  // --- Poll ---------------------------------------------------------------
  const startedAt = Date.now();
  let consecutiveFailures = 0;
  let lastMessage = "Waiting for the render worker...";

  for (;;) {
    throwIfAborted(signal);
    await sleep(
      consecutiveFailures === 0
        ? POLL_INTERVAL_MS
        : Math.min(POLL_BACKOFF_MAX_MS, POLL_INTERVAL_MS * 2 ** consecutiveFailures),
      signal,
    );

    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      throw new Error(
        "The render worker stopped responding. Check the render workflow run, then try again.",
      );
    }

    let state: Awaited<ReturnType<typeof getRenderJob>>;
    try {
      state = await getRenderJob({ data: { jobId: job.jobId, token: job.token } });
      consecutiveFailures = 0;
    } catch (err) {
      // A single failed poll must never abort a render that is still running.
      consecutiveFailures += 1;
      if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
        throw new Error(
          `Lost contact with the render service: ${
            err instanceof Error ? err.message : "unknown error"
          }`,
        );
      }
      onProgress(-1, `${lastMessage} (reconnecting ${consecutiveFailures}/${MAX_CONSECUTIVE_POLL_FAILURES})`);
      continue;
    }

    if (state.status === "failed") {
      throw new Error(state.error ?? "The render failed on the worker");
    }

    if (state.status === "done") {
      if (!state.downloadUrl) throw new Error("The render finished but no download link was returned");
      onProgress(100, "Render complete");
      return state.downloadUrl;
    }

    lastMessage = state.message || "Rendering...";
    // Map worker progress (0-100) onto the 13-99 range we own.
    onProgress(13 + (state.progress / 100) * 86, lastMessage);
  }
}
