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
function getSafeTransform(kb: KenBurnsConfig, progress: number) {
  if (kb.direction === 'static') {
    return { scale: 1, x: 0, y: 0 };
  }

  const eased = easeInOutCubic(Math.max(0, Math.min(1, progress)));
  const requestedScale = kb.startScale + (kb.endScale - kb.startScale) * eased;
  const scale = Math.max(1.02, Number.isFinite(requestedScale) ? requestedScale : 1.02);

  const requestedX = kb.startX + (kb.endX - kb.startX) * eased;
  const requestedY = kb.startY + (kb.endY - kb.startY) * eased;

  // For a centered image scaled to S, the safe translation range is
  // approximately +/- (S - 1) / 2. Clamp both axes independently so no edge
  // of the media can ever uncover the black parent background.
  const safeOffset = Math.max(0, (scale - 1) / 2 - 0.006);
  const x = Math.max(-safeOffset, Math.min(safeOffset, Number.isFinite(requestedX) ? requestedX : 0));
  const y = Math.max(-safeOffset, Math.min(safeOffset, Number.isFinite(requestedY) ? requestedY : 0));

  return { scale, x, y };
}

export const KenBurnsImage: React.FC<{ scene: TimelineScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = durationInFrames > 1 ? frame / (durationInFrames - 1) : 0;
  const { scale, x, y } = getSafeTransform(scene.kenBurns, progress);
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
