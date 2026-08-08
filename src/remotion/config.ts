import type { TimelineData, EditSettings, AspectRatio } from '@/types';

export const RESOLUTIONS: Record<string, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 },
};

export const ASPECT_RATIOS: Record<
  AspectRatio,
  { width: number; height: number; label: string; desc: string }
> = {
  '16:9': { width: 1920, height: 1080, label: '16:9', desc: 'YouTube long-form' },
  '9:16': { width: 1080, height: 1920, label: '9:16', desc: 'Shorts / Reels / TikTok' },
  '1:1': { width: 1080, height: 1080, label: '1:1', desc: 'Square / Feed' },
  '4:5': { width: 1080, height: 1350, label: '4:5', desc: 'Instagram Portrait' },
};

export interface CompositionProps {
  timeline: TimelineData;
  settings: EditSettings;
}

/** Long-edge pixel target for each export resolution. */
const RESOLUTION_LONG_EDGE: Record<string, number> = {
  '720p': 1280,
  '1080p': 1920,
  '4k': 3840,
};

/** h264 requires even dimensions. */
function even(n: number) {
  return Math.max(2, Math.round(n / 2) * 2);
}

export function getCompositionConfig(
  timeline: TimelineData,
  settings: EditSettings,
) {
  const ar = ASPECT_RATIOS[settings.aspectRatio];
  const fps = timeline.fps;
  const introFrames = settings.showIntro ? Math.round(3 * fps) : 0;
  const outroFrames = settings.showOutro ? Math.round(3 * fps) : 0;
  const durationInFrames = timeline.totalFrames + introFrames + outroFrames;

  // The aspect-ratio table is authored at a 1920 long edge; scale it so the
  // exportResolution setting actually changes the output size.
  const longEdge = RESOLUTION_LONG_EDGE[settings.exportResolution] ?? 1920;
  const scale = longEdge / Math.max(ar.width, ar.height);

  return {
    width: even(ar.width * scale),
    height: even(ar.height * scale),
    fps,
    durationInFrames: Math.max(1, durationInFrames),
  };
}

