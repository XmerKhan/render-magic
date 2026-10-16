import type { TimelineData, EditSettings } from "@/types";
import { VideoComposition } from "@/remotion/VideoComposition";
import { ASPECT_RATIOS, getCompositionConfig } from "@/remotion/config";

export interface QuickDownloadOptions {
  timeline: TimelineData;
  settings: EditSettings;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
  outputWritable?: WritableStream<Uint8Array>;
}

function even(value: number) {
  return Math.max(2, Math.round(value / 2) * 2);
}

export async function quickDownloadVideo({
  timeline,
  settings,
  signal,
  onProgress,
  outputWritable,
}: QuickDownloadOptions): Promise<Blob | null> {
  if (typeof window === "undefined" || !("VideoEncoder" in window) || !("VideoDecoder" in window)) {
    throw new Error(
      "Quick Download needs a modern browser with WebCodecs. Please use the latest Chrome or Edge, or use High Quality Render & Download.",
    );
  }

  // Load the browser-only renderer only when the user starts a browser export.
  // This prevents browser-only APIs from being evaluated during server rendering.
  const { renderMediaOnWeb } = await import("@remotion/web-renderer");

  const config = getCompositionConfig(timeline, settings);
  // Quick Download is the speed-first path. Rendering every frame at 1080p
  // is expensive on typical laptops, so cap this path at 720p while preserving
  // the selected aspect ratio. Use High Quality Render & Download for 1080p/4K.
  const aspectRatio = ASPECT_RATIOS[settings.aspectRatio];
  const scale = 1280 / Math.max(aspectRatio.width, aspectRatio.height);
  const width = even(aspectRatio.width * scale);
  const height = even(aspectRatio.height * scale);

  const result = await renderMediaOnWeb({
    composition: {
      component: VideoComposition,
      durationInFrames: config.durationInFrames,
      fps: config.fps,
      width,
      height,
      id: "EditsfieldAIQuickDownload",
    },
    inputProps: { timeline, settings },
    container: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    // A moderate 720p bitrate reduces encoder load and file size for quick exports.
    videoBitrate: 4_500_000,
    audioBitrate: 192_000,
    hardwareAcceleration: "prefer-hardware",
    pageResponsiveness: "disabled",
    keyframeIntervalInSeconds: 4,
    signal,
    outputWritable,
    onProgress: ({ progress }) => onProgress?.(Math.max(0, Math.min(1, progress))),
  });

  return outputWritable ? null : result.getBlob();
}

export async function saveQuickDownload(blob: Blob, fileName: string): Promise<void> {
  const extension = ".mp4";

  if ("showSaveFilePicker" in window) {
    try {
      const picker = (window as Window & {
        showSaveFilePicker?: (options?: unknown) => Promise<{
          createWritable: () => Promise<WritableStream>;
        }>;
      }).showSaveFilePicker;

      if (picker) {
        const handle = await picker({
          suggestedName: fileName.endsWith(extension) ? fileName : fileName + extension,
          types: [{ description: "MP4 video", accept: { "video/mp4": [extension] } }],
        });
        const writable = await handle.createWritable();
        const writer = writable as unknown as WritableStreamDefaultWriter<Uint8Array>;
        const reader = blob.stream().getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await writer.write(value);
          }
        } finally {
          reader.releaseLock();
          await writer.close();
        }
        return;
      }
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(extension) ? fileName : fileName + extension;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
