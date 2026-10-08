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
    /*
     * Professional documentary motion:
     * - a short entrance punch
     * - then one continuous, eased camera path
     *
     * The old implementation chained several independent easeOut segments.
     * Each segment restarted its velocity at the next keyframe, which made
     * long scenes visibly jerk or suddenly accelerate in the middle. Keeping
     * one continuous eased curve removes those speed discontinuities.
     */
    const easeOut = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const baseX = kb.startX;
    const baseY = kb.startY;
    const targetX = kb.endX;
    const targetY = kb.endY;
    const startScale = Math.max(1.02, kb.startScale);
    const finalScale = Math.max(1.02, kb.endScale);

    if (p < 0.10) {
      // One quick but smooth entrance punch. No sudden frame-to-frame jump.
      const t = easeOut(p / 0.10);
      return {
        scale: lerp(startScale, finalScale + 0.025, t),
        x: lerp(baseX, targetX, t),
        y: lerp(baseY, targetY, t),
      };
    }

    // After the punch, keep a single continuous curve for the whole shot.
    const q = (p - 0.10) / 0.90;
    const smooth = easeInOutCubic(q);
    const isZoomOut = kb.direction.startsWith('zoom-out');
    const isPan = kb.direction.includes('pan-');

    // Drift gently back toward the starting camera position. The arc is
    // deliberately small so it reads as a camera move rather than a shake.
    const driftAmount = isPan ? 0.14 : 0.20;
    const x = lerp(targetX, targetX + (baseX - targetX) * driftAmount, smooth);
    const y = lerp(targetY, targetY + (baseY - targetY) * driftAmount, smooth);

    // Keep the professional zoom subtle after the entrance punch.
    const settleScale = isZoomOut ? Math.max(1.02, finalScale) : Math.max(1.02, finalScale);
    const breathing = Math.sin(smooth * Math.PI) * (isPan ? 0.004 : 0.007);
    const scale = lerp(finalScale + 0.025, settleScale, smooth) + breathing;

    return {
      scale: Math.max(1.02, scale),
      x,
      y,
    };
  }

  const eased = easeInOutCubic(p);
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
