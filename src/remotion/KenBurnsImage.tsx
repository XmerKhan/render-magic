import { Img, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import type { TimelineScene, KenBurnsConfig } from '@/types';

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Ken Burns transforms must never move a 100%-sized image far enough that its
 * edge becomes visible. A translation of 10% is safe only when the image has
 * enough overscan (roughly scale >= 1.20). Older timelines could contain a
 * pan with scale ~= 1, which exposed the black composition background on the
 * left/right/top/bottom during the animation.
 *
 * Instead of changing the user's requested zoom, clamp the pan to the amount
 * that the current scale can safely support. A tiny minimum scale also makes
 * sub-pixel rounding safe at the edges.
 */
function getSafeTransform(kb: KenBurnsConfig, progress: number, fastMotion = false) {
  if (kb.direction === 'static') {
    return { scale: 1, x: 0, y: 0 };
  }

  const p = Math.max(0, Math.min(1, progress));

  if (fastMotion) {
    // Professional mode should feel like a controlled camera move, not a
    // fast punch followed by a reversal. Use one continuous ease curve for
    // scale and position across the entire shot so velocity ramps smoothly
    // at the beginning and end with no mid-shot speed discontinuity.
    const startScale = Math.max(1.02, kb.startScale);
    const endScale = Math.max(1.02, kb.endScale);
    const scale = startScale + (endScale - startScale) * eased;
    const x = kb.startX + (kb.endX - kb.startX) * eased;
    const y = kb.startY + (kb.endY - kb.startY) * eased;
    const gentleBreathing = Math.sin(p * Math.PI) * 0.0025;

    return {
      scale: Math.max(1.02, scale + gentleBreathing),
      x,
      y,
    };
  }

  const eased = easeInOutCubic(p);;
  const scale = Math.max(
    1.02,
    Number.isFinite(kb.startScale + (kb.endScale - kb.startScale) * eased)
      ? kb.startScale + (kb.endScale - kb.startScale) * eased
      : 1.02,
  );
  return {
    scale,
    x: kb.startX + (kb.endX - kb.startX) * eased,
    y: kb.startY + (kb.endY - kb.startY) * eased,
  };
}

function clampSafeTransform(
  transform: { scale: number; x: number; y: number },
) {
  const scale = Math.max(1.02, Number.isFinite(transform.scale) ? transform.scale : 1.02);
  // For a centered image scaled to S, the safe translation range is
  // approximately +/- (S - 1) / 2. Keep a small safety margin for rounding.
  const safeOffset = Math.max(0, (scale - 1) / 2 - 0.006);
  return {
    scale,
    x: Math.max(-safeOffset, Math.min(safeOffset, Number.isFinite(transform.x) ? transform.x : 0)),
    y: Math.max(-safeOffset, Math.min(safeOffset, Number.isFinite(transform.y) ? transform.y : 0)),
  };
}

export const KenBurnsImage: React.FC<{ scene: TimelineScene; fastMotion?: boolean }> = ({ scene, fastMotion = false }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = durationInFrames > 1 ? frame / (durationInFrames - 1) : 0;
  const motion = getSafeTransform(scene.kenBurns, progress, fastMotion);
  const { scale, x, y } = clampSafeTransform(motion);
  const mediaUrl = scene.media.url.startsWith('worker-asset:')
    ? staticFile(scene.media.url.slice('worker-asset:'.length))
    : scene.media.url;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
      }}
    >
      <Img
        src={mediaUrl}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translate(${x * 100}%, ${y * 100}%) scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      />
    </div>
  );
};
