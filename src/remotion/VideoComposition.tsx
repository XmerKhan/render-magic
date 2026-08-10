import { Sequence, useVideoConfig, useCurrentFrame, interpolate, staticFile } from 'remotion';
import { Audio } from '@remotion/media';
import { TransitionSeries } from '@remotion/transitions';
import { useMemo } from 'react';
import type { TimelineData, EditSettings } from '@/types';
import { SceneComponent } from './SceneComponent';
import { IntroOutro } from './IntroOutro';
import { getTransition } from './transitions';

export const VideoComposition: React.FC<{
  timeline: TimelineData;
  settings: EditSettings;
}> = ({ timeline, settings }) => {
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const introFrames = settings.showIntro ? Math.round(3 * fps) : 0;
  const outroFrames = settings.showOutro ? Math.round(3 * fps) : 0;
  const resolveAsset = (url: string) => url.startsWith('worker-asset:')
    ? staticFile(url.slice('worker-asset:'.length))
    : url;

  const fadeInFrames = Math.round(settings.voiceFadeInSec * fps);
  const fadeOutFrames = Math.round(settings.voiceFadeOutSec * fps);
  const voiceoverVolume =
    timeline.voiceoverUrl && timeline.voiceoverDurationSec > 0
      ? interpolate(
          frame,
          [0, fadeInFrames, durationInFrames - fadeOutFrames, durationInFrames],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        )
      : 0;

  const voiceoverActive = frame >= introFrames && frame < introFrames + timeline.totalFrames;
  const duckedMusicVolume = settings.autoDuck
    ? voiceoverActive
      ? settings.musicVolume * 0.2
      : settings.musicVolume
    : settings.musicVolume;

  const musicEndFade = interpolate(
    frame,
    [durationInFrames - fps * 2, durationInFrames],
    [duckedMusicVolume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Timeline/settings remain stable during a render. Avoid reconstructing the
  // entire TransitionSeries and all scene elements on every frame. Components
  // that consume Remotion frame context still update normally.
  const sceneTimeline = useMemo(() => (
    <Sequence from={introFrames} durationInFrames={timeline.totalFrames}>
      <TransitionSeries>
        {timeline.scenes.flatMap((scene, i) => {
          const items: React.ReactNode[] = [
            <TransitionSeries.Sequence
              key={scene.id}
              durationInFrames={scene.durationFrames}
            >
              <SceneComponent scene={scene} settings={settings} />
            </TransitionSeries.Sequence>,
          ];

          if (i < timeline.scenes.length - 1) {
            const { presentation, timing } = getTransition(
              scene.transitionOut,
              fps,
              settings.transitionDuration,
              width,
              height,
            );
            items.push(
              <TransitionSeries.Transition
                key={`trans-${scene.id}`}
                presentation={presentation}
                timing={timing}
              />,
            );
          }

          return items;
        })}
      </TransitionSeries>
    </Sequence>
  ), [timeline.scenes, timeline.totalFrames, settings, introFrames, fps, width, height]);

  return (
    <>
      {timeline.voiceoverUrl && (
        <Audio src={resolveAsset(timeline.voiceoverUrl)} volume={voiceoverVolume} />
      )}

      {timeline.musicUrl && (
        <Audio src={resolveAsset(timeline.musicUrl)} volume={musicEndFade} loop />
      )}

      {settings.showIntro && (
        <Sequence from={0} durationInFrames={introFrames}>
          <IntroOutro
            text={settings.introText}
            subtitle={settings.introSubtitle}
            isIntro
            style={settings.introOutroStyle}
          />
        </Sequence>
      )}

      {sceneTimeline}

      {settings.showOutro && (
        <Sequence
          from={introFrames + timeline.totalFrames}
          durationInFrames={outroFrames}
        >
          <IntroOutro
            text={settings.outroText}
            subtitle={settings.channelName}
            isIntro={false}
            style={settings.introOutroStyle}
          />
        </Sequence>
      )}
    </>
  );
};
