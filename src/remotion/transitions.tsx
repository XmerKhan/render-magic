import type { TransitionType } from '@/types';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { iris } from '@remotion/transitions/iris';
import { linearBlur } from '@remotion/transitions/linear-blur';
import { zoomBlur } from '@remotion/transitions/zoom-blur';
import { pushCut } from '@remotion/transitions/push-cut';
import { dissolve } from '@remotion/transitions/dissolve';
import { linearTiming } from '@remotion/transitions';
import type { TransitionPresentation, TransitionTiming } from '@remotion/transitions';
import { AbsoluteFill } from 'remotion';

/**
 * A white flash between scenes: the outgoing scene blows out to white, the
 * incoming scene fades up out of it. Remotion ships no such presentation, so it
 * is implemented here rather than aliased to a plain crossfade.
 */
const flashWhite = (): TransitionPresentation<Record<string, never>> => ({
  component: ({ children, presentationProgress, presentationDirection }) => {
    // Peaks at the midpoint of the transition.
    const flash = Math.sin(presentationProgress * Math.PI);
    const opacity =
      presentationDirection === 'exiting' ? 1 : presentationProgress;
    return (
      <AbsoluteFill style={{ opacity }}>
        {children}
        <AbsoluteFill
          style={{ backgroundColor: 'white', opacity: flash, pointerEvents: 'none' }}
        />
      </AbsoluteFill>
    );
  },
  props: {},
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTransition(
  type: TransitionType,
  fps: number,
  transitionDurationSec: number,
  width = 1920,
  height = 1080,
): { presentation: any; timing: TransitionTiming } {
  const durationInFrames = Math.max(1, Math.round(transitionDurationSec * fps));
  const timing = linearTiming({ durationInFrames });

  switch (type) {
    case 'crossfade':
      return { presentation: fade({}), timing };
    case 'slide-left':
      return { presentation: slide({ direction: 'from-left' }), timing };
    case 'slide-right':
      return { presentation: slide({ direction: 'from-right' }), timing };
    case 'slide-up':
      return { presentation: slide({ direction: 'from-top' }), timing };
    case 'slide-down':
      return { presentation: slide({ direction: 'from-bottom' }), timing };
    case 'whip-pan':
      // A whip pan is a very fast slide, so it uses a shortened timing.
      return {
        presentation: slide({ direction: 'from-right' }),
        timing: linearTiming({
          durationInFrames: Math.max(1, Math.round(durationInFrames * 0.5)),
        }),
      };
    case 'zoom-blur':
      return { presentation: zoomBlur({}), timing };
    case 'hard-cut':
      // A hard cut is an instant change, not a short crossfade.
      return { presentation: fade({}), timing: linearTiming({ durationInFrames: 1 }) };
    case 'wipe':
    case 'wipe-left':
      return { presentation: wipe({ direction: 'from-left' }), timing };
    case 'wipe-right':
      return { presentation: wipe({ direction: 'from-right' }), timing };
    case 'wipe-up':
      return { presentation: wipe({ direction: 'from-top' }), timing };
    case 'wipe-down':
      return { presentation: wipe({ direction: 'from-bottom' }), timing };
    case 'iris-wipe':
      return { presentation: iris({ width, height }), timing };
    case 'glitch':
      return { presentation: dissolve({}), timing };
    case 'flash-white':
      return { presentation: flashWhite(), timing };
    case 'push':
    case 'push-left':
      return { presentation: pushCut({ direction: 'from-left' }), timing };
    case 'push-right':
      return { presentation: pushCut({ direction: 'from-right' }), timing };
    case 'push-up':
      return { presentation: pushCut({ direction: 'from-top' }), timing };
    case 'push-down':
      return { presentation: pushCut({ direction: 'from-bottom' }), timing };
    case 'blur-dissolve':
      return { presentation: linearBlur({}), timing };
    case 'star-wipe':
      return { presentation: wipe({ direction: 'from-top-left' }), timing };
    case 'clock-wipe':
      return { presentation: clockWipe({ width, height }), timing };
    default:
      return { presentation: fade({}), timing };
  }
}
