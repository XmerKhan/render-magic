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
/** A worker is dead only when its server heartbeat is stale, not because a long render is slow. */
const STALE_HEARTBEAT_MS = 15 * 60 * 1000;

export interface ExportOptions {
  timeline: TimelineData;
  settings: EditSettings;
  assets: MediaAsset[];
  voiceoverFile: File | null;
  musicFile: File | null;
  onProgress: (progress: number, message: string, state?: RenderProgressDetails) => void;
  signal?: AbortSignal;
}

export interface RenderProgressDetails {
  currentChunk: number | null;
  completedChunks: number;
  totalChunks: number;
  elapsedSeconds: number;
  etaSeconds: number | null;
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

/**
 * The timeline holds live `File` handles (and possibly blob URLs / DOM objects).
 * Those cannot cross the server-function boundary — the RPC serializer throws a
 * cryptic "Seroval Error (step: N)". Reduce the payload to plain JSON first.
 */
function toJsonSafe<T>(value: T, label: string): Record<string, unknown> {
  try {
    return JSON.parse(
      JSON.stringify(value, (key, val) => {
        if (key === "file") return undefined;
        if (typeof File !== "undefined" && val instanceof File) return undefined;
        if (typeof Blob !== "undefined" && val instanceof Blob) return undefined;
        if (typeof val === "function") return undefined;
        return val;
      }),
    ) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`Could not prepare the ${label} for rendering: ${(e as Error).message}`);
  }
}

export async function exportVideo(opts: ExportOptions): Promise<string> {
  const { assets, voiceoverFile, musicFile, onProgress, signal } = opts;

  throwIfAborted(signal);
  onProgress(1, "Preparing timeline...");

  const prepared = prepareTimeline(opts.timeline, assets, voiceoverFile, musicFile);
  const settings: EditSettings = { ...opts.settings, musicUrl: prepared.timeline.musicUrl };
  const config = getCompositionConfig(prepared.timeline, settings);

  let job: Awaited<ReturnType<typeof createRenderJob>>;
  try {
    job = await createRenderJob({
      data: {
        timeline: toJsonSafe(prepared.timeline, "timeline"),
        settings: toJsonSafe(settings, "settings"),
        width: config.width,
        height: config.height,
        fps: config.fps,
        durationInFrames: config.durationInFrames,
        uploads: prepared.uploads.map((u) => ({ ...u })),
      },
    });
  } catch (e) {
    throw new Error(`Could not create the render job: ${(e as Error).message}`);
  }


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

    if (
      state.lastHeartbeatAt &&
      (state.status === "rendering" || state.status === "retrying" || state.status === "encoding") &&
      Date.now() - new Date(state.lastHeartbeatAt).getTime() > STALE_HEARTBEAT_MS
    ) {
      throw new Error(`Render heartbeat was lost while processing chunk ${(state.currentChunk ?? 0) + 1}/${state.totalChunks}. Completed chunks are saved; retrying the workflow will resume them.`);
    }

    if (state.status === "done") {
      if (!state.downloadUrl) throw new Error("The render finished but no download link was returned");
      onProgress(100, "Render complete");
      return state.downloadUrl;
    }

    const chunkDetail = state.totalChunks > 1
      ? ` · ${state.completedChunks}/${state.totalChunks} chunks · ${formatDuration(state.elapsedSeconds)} elapsed${state.etaSeconds === null ? "" : ` · ~${formatDuration(state.etaSeconds)} left`}`
      : "";
    lastMessage = `${state.message || "Rendering..."}${chunkDetail}`;
    // Map worker progress (0-100) onto the 13-99 range we own.
    onProgress(13 + (state.progress / 100) * 86, lastMessage, {
      currentChunk: state.currentChunk,
      completedChunks: state.completedChunks,
      totalChunks: state.totalChunks,
      elapsedSeconds: state.elapsedSeconds,
      etaSeconds: state.etaSeconds,
    });
  }
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}
