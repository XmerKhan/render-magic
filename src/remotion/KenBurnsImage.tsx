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
  const eased = easeInOutCubic(p);

  // Professional mode is intentionally punchy: the camera makes the main
  // move in roughly the first 12-16% of the scene, then settles. This avoids
  // the slow 3-4 second Ken Burns drift that reads like a slideshow.
  const punchProgress = Math.min(1, p / 0.14);
  const punchEased = 1 - Math.pow(1 - punchProgress, 3);
  const settleProgress = Math.max(0, Math.min(1, (p - 0.14) / 0.86));
  const settleEased = 1 - Math.pow(1 - settleProgress, 3);

  let requestedScale: number;
  let requestedX: number;
  let requestedY: number;

  if (fastMotion) {
    const panTargetX = kb.endX;
    const panTargetY = kb.endY;
    const isZoomOut = kb.direction.startsWith('zoom-out');
    const isPan = kb.direction.includes('pan-') || kb.direction === 'pan-left' || kb.direction === 'pan-right';

    if (isZoomOut) {
      // Snap from a slightly closer frame back to a comfortable framing.
      requestedScale = 1.16 - 0.13 * punchEased;
    } else if (isPan) {
      // Fast camera move first, tiny settle afterwards.
      requestedScale = 1.04 + 0.05 * punchEased - 0.01 * settleEased;
    } else {
      // Crash/punch zoom: fast 1.02 -> ~1.16, then a small settle.
      requestedScale = 1.02 + 0.14 * punchEased - 0.02 * settleEased;
    }

    requestedX = kb.startX + (panTargetX - kb.startX) * punchEased;
    requestedY = kb.startY + (panTargetY - kb.startY) * punchEased;
  } else {
    requestedScale = kb.startScale + (kb.endScale - kb.startScale) * eased;
    requestedX = kb.startX + (kb.endX - kb.startX) * eased;
    requestedY = kb.startY + (kb.endY - kb.startY) * eased;
  }

  // For a centered image scaled to S, the safe translation range is
  // approximately +/- (S - 1) / 2. Clamp both axes independently so no edge
  // of the media can ever uncover the black parent background.
  const safeOffset = Math.max(0, (scale - 1) / 2 - 0.006);
  const x = Math.max(-safeOffset, Math.min(safeOffset, Number.isFinite(requestedX) ? requestedX : 0));
  const y = Math.max(-safeOffset, Math.min(safeOffset, Number.isFinite(requestedY) ? requestedY : 0));

  return { scale, x, y };
}

export const KenBurnsImage: React.FC<{ scene: TimelineScene; fastMotion?: boolean }> = ({ scene, fastMotion = false }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = durationInFrames > 1 ? frame / (durationInFrames - 1) : 0;
  const { scale, x, y } = getSafeTransform(scene.kenBurns, progress, fastMotion);
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
