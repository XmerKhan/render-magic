import { Sequence, useVideoConfig, useCurrentFrame, interpolate } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import type { TimelineData, EditSettings } from "@/types";
import { SceneComponent } from "./SceneComponent";
import { IntroOutro } from "./IntroOutro";
import { getTransition, totalTransitionShrinkFrames } from "./transitions";

export const VideoComposition: React.FC<{
  timeline: TimelineData;
  settings: EditSettings;
}> = ({ timeline, settings }) => {
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const introFrames = settings.showIntro ? Math.round(3 * fps) : 0;
  const outroFrames = settings.showOutro ? Math.round(3 * fps) : 0;
  // <TransitionSeries> overlaps consecutive scenes during each transition, so
  // its real rendered length is shorter than the naive sum of scene durations
  // - see totalTransitionShrinkFrames(). Everything below that positions
  // content relative to "where the scenes actually end" must use this, not
  // timeline.totalFrames, or the outro/ducking/outer-Sequence math drifts out
  // of sync with what TransitionSeries is actually showing.
  const scenesFrames = Math.max(
    0,
    timeline.totalFrames -
      totalTransitionShrinkFrames(timeline.scenes, fps, settings.transitionDuration),
  );

  // Voiceover fade in/out
  const fadeInFrames = Math.round(settings.voiceFadeInSec * fps);
  const fadeOutFrames = Math.round(settings.voiceFadeOutSec * fps);
  const voiceoverVolume =
    timeline.voiceoverUrl && timeline.voiceoverDurationSec > 0
      ? interpolate(
          frame,
          [0, fadeInFrames, durationInFrames - fadeOutFrames, durationInFrames],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 0;

  // Auto-ducking: lower music when voiceover is playing
  const voiceoverActive = frame >= introFrames && frame < introFrames + scenesFrames;
  const duckedMusicVolume = settings.autoDuck
    ? voiceoverActive
      ? settings.musicVolume * 0.2
      : settings.musicVolume
    : settings.musicVolume;

  // Music fade out at end
  const musicEndFade = interpolate(
    frame,
    [durationInFrames - fps * 2, durationInFrames],
    [duckedMusicVolume, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <>
      {timeline.voiceoverUrl && <Audio src={timeline.voiceoverUrl} volume={voiceoverVolume} />}

      {timeline.musicUrl && <Audio src={timeline.musicUrl} volume={musicEndFade} loop />}

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

      <Sequence from={introFrames} durationInFrames={scenesFrames}>
        <TransitionSeries>
          {timeline.scenes.map((scene, i) => {
            const items: React.ReactNode[] = [];

            items.push(
              <TransitionSeries.Sequence key={scene.id} durationInFrames={scene.durationFrames}>
                <SceneComponent scene={scene} settings={settings} />
              </TransitionSeries.Sequence>,
            );

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

      {settings.showOutro && (
        <Sequence from={introFrames + scenesFrames} durationInFrames={outroFrames}>
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
