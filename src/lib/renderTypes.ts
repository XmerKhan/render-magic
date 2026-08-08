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

export type RenderJobStatus =
  | "queued"
  | "dispatched"
  | "rendering"
  | "encoding"
  | "done"
  | "failed";

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
