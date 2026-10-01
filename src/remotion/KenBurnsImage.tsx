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
     * Professional documentary motion has two layers:
     * 1) a very fast editorial punch right at the scene entrance;
     * 2) continuous camera movement for the rest of the shot.
     *
     * The second layer is intentionally made from several slow keyframes
     * instead of one long Ken-Burns interpolation. This prevents a 5-10s
     * still image from looking frozen after the transition.
     */
    const easeOut = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const baseX = kb.startX;
    const baseY = kb.startY;
    const targetX = kb.endX;
    const targetY = kb.endY;

    let x: number;
    let y: number;
    let scale: number;

    if (p < 0.12) {
      // Fast entrance punch: immediate zoom/camera snap.
      const t = easeOut(p / 0.12);
      x = lerp(baseX, targetX, t);
      y = lerp(baseY, targetY, t);
      scale = lerp(Math.max(1.02, kb.startScale), Math.max(1.06, kb.endScale + 0.035), t);
    } else {
      // Continuous mid-shot camera choreography.
      const q = (p - 0.12) / 0.88;
      const isZoomOut = kb.direction.startsWith('zoom-out');
      const isPan = kb.direction.includes('pan-');

      // Four editorial keyframes. Values are deliberately small; safeTransform
      // below clamps them against the available overscan.
      const k1 = { x: targetX, y: targetY, s: isZoomOut ? 1.045 : 1.12 };
      const k2 = {
        x: targetX * -0.72,
        y: targetY * -0.55,
        s: isZoomOut ? 1.085 : 1.065,
      };
      const k3 = {
        x: targetX * 0.52,
        y: targetY * 0.36,
        s: isZoomOut ? 1.025 : 1.135,
      };
      const k4 = {
        x: targetX * -0.25,
        y: targetY * -0.18,
        s: isZoomOut ? 1.055 : 1.105,
      };

      let a = k1;
      let b = k2;
      let local = 0;

      if (q < 0.34) {
        local = easeOut(q / 0.34);
        a = k1; b = k2;
      } else if (q < 0.67) {
        local = easeOut((q - 0.34) / 0.33);
        a = k2; b = k3;
      } else {
        local = easeOut((q - 0.67) / 0.33);
        a = k3; b = k4;
      }

      x = lerp(a.x, b.x, local);
      y = lerp(a.y, b.y, local);
      scale = lerp(a.s, b.s, local);

      // Tiny handheld/editorial micro-movement keeps long shots alive without
      // becoming distracting or looking like a camera shake effect.
      const micro = Math.sin(q * Math.PI * 4) * 0.006;
      const microY = Math.sin(q * Math.PI * 3 + 1.2) * 0.004;
      x += micro;
      y += microY;

      // A subtle breathing pulse gives long stills a natural slow push/pull.
      // It is intentionally below 2% so the image never feels over-animated.
      const breathe = Math.sin(q * Math.PI * 2) * (isPan ? 0.010 : 0.015);
      scale += breathe;

      // For a plain pan, keep the camera slightly more restrained.
      if (isPan) scale = Math.min(scale, 1.12);
    }

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
  const motion = getSafeTransform(scene.kenBurns, progress, fastMotion);\n  const { scale, x, y } = clampSafeTransform(motion);
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
