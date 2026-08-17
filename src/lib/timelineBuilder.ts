import type {
  ScriptSegment,
  MediaAsset,
  TimelineData,
  TimelineScene,
  EditSettings,
  KenBurnsConfig,
  KenBurnsDirection,
  TransitionType,
  TransitionPack,
} from '@/types';

const TRANSITION_POOLS: Record<TransitionPack, TransitionType[]> = {
  mixed: ['crossfade', 'slide-left', 'slide-right', 'whip-pan', 'zoom-blur', 'hard-cut', 'wipe-left', 'iris-wipe', 'clock-wipe', 'blur-dissolve'],
  smooth: ['crossfade', 'crossfade', 'zoom-blur', 'blur-dissolve', 'wipe-left'],
  dynamic: ['whip-pan', 'slide-left', 'slide-right', 'hard-cut', 'push-left', 'iris-wipe'],
  minimal: ['crossfade', 'hard-cut'],
};

function pickTransition(
  pack: TransitionPack,
  index: number,
  _total: number,
): TransitionType {
  const pool = TRANSITION_POOLS[pack];
  if (pack === 'minimal') {
    return index === 0 ? 'hard-cut' : 'crossfade';
  }
  return pool[index % pool.length];
}

const KB_DIRECTIONS: KenBurnsDirection[] = [
  'zoom-in', 'zoom-out', 'pan-left', 'pan-right',
  'zoom-in-pan-left', 'zoom-in-pan-right',
  'zoom-out-pan-left', 'zoom-out-pan-right',
];

function buildKenBurns(durationSec: number, seed: number): KenBurnsConfig {
  const pseudo = (n: number) => {
    const x = Math.sin(seed * 9999 + n * 137.5) * 10000;
    return x - Math.floor(x);
  };

  const direction = KB_DIRECTIONS[Math.floor(pseudo(0) * KB_DIRECTIONS.length)];
  const intensity = 0.08 + pseudo(4) * 0.06;

  const zoomIn = direction.startsWith('zoom-in') || direction === 'pan-left' || direction === 'pan-right';
  const zoomOut = direction.startsWith('zoom-out');
  const startScale = zoomOut ? 1.15 : 1.0;
  const endScale = zoomOut ? 1.0 : zoomIn ? 1.15 : 1.0;

  const panX = direction.includes('pan-left') ? -intensity : direction.includes('pan-right') ? intensity : (pseudo(2) - 0.5) * intensity;
  const panY = direction.includes('pan-up') ? -intensity * 0.7 : direction.includes('pan-down') ? intensity * 0.7 : (pseudo(3) - 0.5) * intensity * 0.7;

  return {
    enabled: true,
    direction,
    intensity,
    startX: -panX / 2,
    startY: -panY / 2,
    startScale,
    endX: panX / 2,
    endY: panY / 2,
    endScale,
  };
}

export function buildTimeline(
  segments: ScriptSegment[],
  mediaMap: Map<string, MediaAsset>,
  voiceoverUrl: string | null,
  voiceoverDurationSec: number,
  settings: EditSettings,
  musicUrl: string | null = null,
): TimelineData {
  const { fps } = settings;

  const nameMap = new Map<string, MediaAsset>();
  for (const asset of mediaMap.values()) {
    nameMap.set(asset.name, asset);
  }
  const resolveMedia = (id: string) => mediaMap.get(id) ?? nameMap.get(id);

  // JSON/script timestamps are authoritative for scene boundaries. The audio
  // file duration is also considered, but a shorter browser/media measurement
  // must never remove the final timestamped scenes.
  const sorted = [...segments]
    .filter((seg) => Number.isFinite(seg.startTime) && Number.isFinite(seg.endTime) && seg.endTime > seg.startTime)
    .sort((a, b) => a.startTime - b.startTime);

  const scriptEndTime = sorted.length > 0
    ? Math.max(...sorted.map((seg) => seg.endTime).filter(Number.isFinite))
    : 0;
  const effectiveVoiceoverDurationSec = Math.max(
    Number.isFinite(voiceoverDurationSec) ? voiceoverDurationSec : 0,
    scriptEndTime,
  );

  const scenes: TimelineScene[] = [];

  sorted.forEach((seg, index) => {
    const media = resolveMedia(seg.mediaId);
    if (!media) {
      // Never silently drop a JSON scene. Validation normally catches this,
      // but throwing here prevents a partially-rendered timeline if state races.
      throw new Error(`Scene "${seg.sceneId}" references media "${seg.mediaId}" which is not loaded.`);
    }

    const nextStartTime = sorted[index + 1]?.startTime;
    const effectiveEndTime = nextStartTime != null
      ? Math.max(seg.startTime, nextStartTime)
      : Math.max(seg.endTime, effectiveVoiceoverDurationSec, seg.startTime);

    const startFrame = Math.max(0, Math.round(seg.startTime * fps));
    const endFrame = Math.max(startFrame + 1, Math.round(effectiveEndTime * fps));
    const durationFrames = endFrame - startFrame;
    const durationSec = durationFrames / fps;

    scenes.push({
      id: seg.sceneId,
      media,
      startFrame,
      endFrame,
      durationFrames,
      durationSec,
      text: seg.text,
      callout: seg.callout,
      location: seg.location,
      date: seg.date,
      quote: seg.quote,
      lowerThird: seg.lowerThird,
      transitionIn: pickTransition(settings.transitionPack, index, sorted.length),
      transitionOut: pickTransition(settings.transitionPack, index + 1, sorted.length),
      kenBurns: buildKenBurns(durationSec, index + 1),
    });
  });

  // The effective audio endpoint includes the final JSON timestamp. This is
  // critical when a VBR/browser duration measurement is shorter than the
  // timestamped voiceover; otherwise the editor and render would stop early.
  const lastSceneEndFrame = scenes.length > 0
    ? scenes[scenes.length - 1]!.endFrame
    : 0;
  const voiceoverFrames = Math.max(0, Math.round(effectiveVoiceoverDurationSec * fps));
  const totalFrames = Math.max(lastSceneEndFrame, voiceoverFrames);

  return {
    scenes,
    totalFrames,
    totalDurationSec: totalFrames / fps,
    fps,
    voiceoverUrl,
    voiceoverDurationSec: effectiveVoiceoverDurationSec,
    musicUrl,
    settings,
  };
}

export function frameToTime(frame: number, fps: number): string {
  const totalSec = frame / fps;
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60);
  const frames = Math.floor(frame % fps);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

export function secondsToTimecode(sec: number): string {
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  const tenths = Math.floor((sec % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}
