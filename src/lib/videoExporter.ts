import type { EditSettings, MediaAsset, TimelineData } from "@/types";
import { getAuthoritativeTimelineFrames, getCompositionConfig } from "@/remotion/config";
import { assetPlaceholder, type RenderUploadRequest } from "@/lib/renderTypes";
import { createRenderJob, dispatchRenderJob, getRenderJob } from "@/lib/render.functions";
import { supabase } from "@/integrations/supabase/client";

const ASSETS_BUCKET = "render-assets";
const POLL_INTERVAL_MS = 2000;
const POLL_BACKOFF_MAX_MS = 15000;
const MAX_CONSECUTIVE_POLL_FAILURES = 8;
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
  const preparedTimeline: TimelineData = {
    ...timeline,
    scenes,
    voiceoverUrl,
    musicUrl,
    settings,
  };

  // Recompute from every scene boundary and the measured audio duration. This
  // prevents a stale totalFrames field from truncating the final chunks.
  preparedTimeline.totalFrames = getAuthoritativeTimelineFrames(preparedTimeline);
  preparedTimeline.totalDurationSec = preparedTimeline.totalFrames / preparedTimeline.fps;

  return { timeline: preparedTimeline, uploads, files };
}

function assertTimelineIntegrity(timeline: TimelineData, fps: number): void {
  if (!timeline.voiceoverUrl) throw new Error("A voiceover is required for timestamp-based rendering.");
  if (!timeline.scenes.length) throw new Error("The timeline contains no scenes.");

  const authoritativeFrames = getAuthoritativeTimelineFrames(timeline);
  if (timeline.totalFrames < authoritativeFrames) {
    throw new Error("The render timeline duration is inconsistent with its scene boundaries.");
  }

  let previousStart = -1;
  for (let i = 0; i < timeline.scenes.length; i += 1) {
    const scene = timeline.scenes[i]!;
    if (scene.startFrame < 0 || scene.endFrame <= scene.startFrame) {
      throw new Error(`Invalid timing for scene "${scene.id}".`);
    }
    if (scene.startFrame < previousStart) {
      throw new Error(`Scene timestamps are not ordered around "${scene.id}".`);
    }
    const next = timeline.scenes[i + 1];
    if (next && next.startFrame < scene.startFrame) {
      throw new Error(`Scene timestamps are out of order between "${scene.id}" and "${next.id}".`);
    }
    previousStart = scene.startFrame;
  }

  const last = timeline.scenes[timeline.scenes.length - 1]!;
  const requiredEnd = Math.max(
    last.endFrame,
    Math.round((Number(timeline.voiceoverDurationSec) || 0) * fps),
  );
  if (timeline.totalFrames < requiredEnd) {
    throw new Error("The final scene/audio endpoint is outside the render duration.");
  }
}

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
  assertTimelineIntegrity(prepared.timeline, config.fps);

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

    if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
  }

  throwIfAborted(signal);
  onProgress(13, "Starting the render worker...");
  await dispatchRenderJob({ data: { jobId: job.jobId, token: job.token } });

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
      consecutiveFailures += 1;
      if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
        throw new Error(`Lost contact with the render service: ${err instanceof Error ? err.message : "unknown error"}`);
      }
      onProgress(-1, `${lastMessage} (reconnecting ${consecutiveFailures}/${MAX_CONSECUTIVE_POLL_FAILURES})`);
      continue;
    }

    if (state.status === "failed") throw new Error(state.error ?? "The render failed on the worker");

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
