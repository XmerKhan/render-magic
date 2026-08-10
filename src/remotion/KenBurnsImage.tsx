import { Img, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import type { TimelineScene, KenBurnsConfig } from '@/types';

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function getTransform(kb: KenBurnsConfig, progress: number) {
  if (kb.direction === 'static') {
    return { scale: 1, x: 0, y: 0 };
  }

  const eased = easeInOutCubic(progress);
  const scale = kb.startScale + (kb.endScale - kb.startScale) * eased;
  const x = kb.startX + (kb.endX - kb.startX) * eased;
  const y = kb.startY + (kb.endY - kb.startY) * eased;

  return { scale, x, y };
}

export const KenBurnsImage: React.FC<{ scene: TimelineScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = durationInFrames > 0 ? frame / durationInFrames : 0;
  const { scale, x, y } = getTransform(scene.kenBurns, progress);
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
      }}
    >
      <Img
        src={mediaUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${x * 100}%, ${y * 100}%)`,
          transformOrigin: 'center',
        }}
      />
    </div>
  );
};
