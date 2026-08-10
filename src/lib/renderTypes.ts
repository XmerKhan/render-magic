import type { EditSettings, TimelineData } from "@/types";

/**
 * Placeholder scheme used inside a stored render payload.
 *
 * The browser never knows the storage paths or signed URLs, so every media URL
 * in the timeline it submits is replaced with `job-asset:<key>`. The server
 * resolves those placeholders to short-lived signed URLs when the render worker
 * claims the job.
 */
export const ASSET_PLACEHOLDER_PREFIX = "job-asset:";

export function assetPlaceholder(key: string): string {
  return `${ASSET_PLACEHOLDER_PREFIX}${key}`;
}

export interface RenderUploadRequest {
  /** Stable key referenced by the timeline placeholders. */
  key: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface RenderUploadTarget {
  key: string;
  path: string;
  /** Signed upload URL (PUT) valid for a short window. */
  signedUrl: string;
  token: string;
}

export interface RenderJobPayload {
  timeline: TimelineData;
  settings: EditSettings;
  /** Placeholder key -> storage object path inside the `render-assets` bucket. */
  assetPaths: Record<string, string>;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  outputPath: string;
}

/**
 * Long timelines are split into parallel chunks so each GitHub Actions matrix
 * job only has to render a couple of minutes on its 2 vCPUs, instead of one
 * job rendering the entire video serially against the 60-minute job timeout.
 */
export const CHUNK_TARGET_SECONDS = 45;
export const CHUNK_MAX_COUNT = 15;

export function computeChunkCount(durationInFrames: number, fps: number): number {
  const framesPerChunk = Math.max(1, Math.round(CHUNK_TARGET_SECONDS * fps));
  const byDuration = Math.ceil(durationInFrames / framesPerChunk);
  return Math.max(1, Math.min(CHUNK_MAX_COUNT, byDuration));
}

/** Inclusive [from, to] frame range for one chunk, given the same chunkCount used to dispatch. */
export function chunkFrameRange(
  chunkIndex: number,
  chunkCount: number,
  durationInFrames: number,
): [number, number] {
  const framesPerChunk = Math.ceil(durationInFrames / chunkCount);
  const from = chunkIndex * framesPerChunk;
  const to = Math.min(from + framesPerChunk, durationInFrames) - 1;
  return [from, to];
}

/** Storage path of one chunk's rendered segment before it is stitched together. */
export function chunkOutputPath(jobId: string, chunkIndex: number): string {
  return `${jobId}/chunks/chunk-${chunkIndex}.mp4`;
}

export type RenderJobStatus =
  "queued" | "dispatched" | "rendering" | "encoding" | "stitching" | "done" | "failed";

export interface RenderJobState {
  jobId: string;
  status: RenderJobStatus;
  progress: number;
  message: string;
  error: string | null;
  downloadUrl: string | null;
  renderedFrames: number;
  totalFrames: number;
}
