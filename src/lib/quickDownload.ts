import { renderMediaOnWeb } from "@remotion/web-renderer";
import type { TimelineData, EditSettings } from "@/types";
import { VideoComposition } from "@/remotion/VideoComposition";
import { getCompositionConfig } from "@/remotion/config";

export interface QuickDownloadOptions {
  timeline: TimelineData;
  settings: EditSettings;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

export async function quickDownloadVideo({
  timeline,
  settings,
  signal,
  onProgress,
}: QuickDownloadOptions): Promise<Blob> {
  if (!("VideoEncoder" in window) || !("VideoDecoder" in window)) {
    throw new Error(
      "Quick Download needs a modern browser with WebCodecs. Please use the latest Chrome or Edge, or use High Quality Render & Download.",
    );
  }

  const config = getCompositionConfig(timeline, settings);

  const result = await renderMediaOnWeb({
    composition: {
      component: VideoComposition,
      durationInFrames: config.durationInFrames,
      fps: config.fps,
      width: config.width,
      height: config.height,
      id: "EditsfieldAIQuickDownload",
    },
    inputProps: { timeline, settings },
    container: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    videoBitrate: "medium",
    audioBitrate: "high",
    hardwareAcceleration: "prefer-software",
    keyframeIntervalInSeconds: 4,
    signal,
    onProgress: ({ progress }) => onProgress?.(Math.max(0, Math.min(1, progress))),
  });

  return result.getBlob();
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
