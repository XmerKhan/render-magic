import type { TimelineData, EditSettings, AspectRatio } from "@/types";

export const RESOLUTIONS: Record<string, { width: number; height: number }> = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4k": { width: 3840, height: 2160 },
};

export const ASPECT_RATIOS: Record<
  AspectRatio,
  { width: number; height: number; label: string; desc: string }
> = {
  "16:9": { width: 1920, height: 1080, label: "16:9", desc: "YouTube long-form" },
  "9:16": { width: 1080, height: 1920, label: "9:16", desc: "Shorts / Reels / TikTok" },
  "1:1": { width: 1080, height: 1080, label: "1:1", desc: "Square / Feed" },
  "4:5": { width: 1080, height: 1350, label: "4:5", desc: "Instagram Portrait" },
};

export interface CompositionProps {
  timeline: TimelineData;
  settings: EditSettings;
}

const RESOLUTION_LONG_EDGE: Record<string, number> = {
  "720p": 1280,
  "1080p": 1920,
  "4k": 3840,
};

function even(n: number) {
  return Math.max(2, Math.round(n / 2) * 2);
}

/**
 * Derive duration from the actual scene boundaries instead of trusting a cached
 * totalFrames value. This is important for long JSON timelines: if a stale or
 * truncated totalFrames value is carried into the render job, Remotion will
 * legitimately stop at that frame and the remaining scenes/audio disappear.
 */
export function getAuthoritativeTimelineFrames(timeline: TimelineData): number {
  const fps = timeline.fps || 30;
  const sceneEnd = timeline.scenes.reduce(
    (max, scene) => Math.max(max, Number(scene.endFrame) || 0),
    0,
  );
  const voiceoverEnd = Math.max(
    0,
    Math.round((Number(timeline.voiceoverDurationSec) || 0) * fps),
  );
  return Math.max(1, sceneEnd, voiceoverEnd, Number(timeline.totalFrames) || 0);
}

export function getCompositionConfig(timeline: TimelineData, settings: EditSettings) {
  const ar = ASPECT_RATIOS[settings.aspectRatio];
  const fps = timeline.fps;
  const introFrames = settings.showIntro ? Math.round(3 * fps) : 0;
  const outroFrames = settings.showOutro ? Math.round(3 * fps) : 0;

  // Scene end frames are authoritative. We deliberately take the maximum of
  // all scene boundaries and the measured voiceover duration so the preview,
  // render payload, chunk ranges and final stitch all use the same duration.
  const scenesFrames = getAuthoritativeTimelineFrames(timeline);
  const durationInFrames = scenesFrames + introFrames + outroFrames;

  const longEdge = RESOLUTION_LONG_EDGE[settings.exportResolution] ?? 1920;
  const scale = longEdge / Math.max(ar.width, ar.height);

  return {
    width: even(ar.width * scale),
    height: even(ar.height * scale),
    fps,
    durationInFrames: Math.max(1, durationInFrames),
  };
}
