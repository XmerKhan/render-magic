import { Freeze, Sequence, useVideoConfig, useCurrentFrame, interpolate, staticFile, AbsoluteFill } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import type { TimelineData, EditSettings } from "@/types";
import { SceneComponent } from "./SceneComponent";
import { IntroOutro } from "./IntroOutro";
import { getTransition } from "./transitions";

function resolveAudioSource(url?: string | null) {
  if (!url) return url;
  if (url.startsWith("worker-asset:")) {
    return staticFile(url.slice("worker-asset:".length).replace(/^\/+/, ""));
  }
  return url;
}

export const VideoComposition: React.FC<{
  timeline: TimelineData;
  settings: EditSettings;
}> = ({ timeline, settings }) => {
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const introFrames = settings.showIntro ? Math.round(3 * fps) : 0;
  const outroFrames = settings.showOutro ? Math.round(3 * fps) : 0;

  // timeline.totalFrames is based on the absolute script timestamps and is also
  // extended to the real voiceover duration. This prevents the renderer from
  // cutting off the final spoken words when the last scene timestamp is short.
  const scenesFrames = Math.max(0, timeline.totalFrames);

  const voiceoverFrames = Math.max(
    0,
    Math.round((timeline.voiceoverDurationSec || 0) * fps),
  );
  const voiceoverEndFrame = Math.min(
    durationInFrames,
    introFrames + voiceoverFrames,
  );
  const fadeInFrames = Math.max(0, Math.round(settings.voiceFadeInSec * fps));
  const fadeOutFrames = Math.max(0, Math.round(settings.voiceFadeOutSec * fps));
  const voiceoverVolume =
    timeline.voiceoverUrl && voiceoverFrames > 0
      ? interpolate(
          frame,
          [
            introFrames,
            introFrames + fadeInFrames,
            Math.max(introFrames + fadeInFrames, voiceoverEndFrame - fadeOutFrames),
            voiceoverEndFrame,
          ],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 0;

  const voiceoverActive =
    frame >= introFrames && frame < voiceoverEndFrame;
  const duckedMusicVolume = settings.autoDuck
    ? voiceoverActive
      ? settings.musicVolume * 0.2
      : settings.musicVolume
    : settings.musicVolume;

  const musicEndFade = interpolate(
    frame,
    [Math.max(0, durationInFrames - fps * 2), durationInFrames],
    [duckedMusicVolume, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const voiceoverSrc = resolveAudioSource(timeline.voiceoverUrl);
  const musicSrc = resolveAudioSource(timeline.musicUrl);

  return (
    <>
      {voiceoverSrc && (
        <Sequence from={introFrames} durationInFrames={voiceoverFrames}>
          <Audio src={voiceoverSrc} volume={voiceoverVolume} />
        </Sequence>
      )}

      {musicSrc && <Audio src={musicSrc} volume={musicEndFade} loop />}

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
          {/* Preserve any intentional silence before the first timestamp. */}
          {timeline.scenes.length > 0 && timeline.scenes[0]!.startFrame > 0 && (
            <TransitionSeries.Sequence
              durationInFrames={timeline.scenes[0]!.startFrame}
            >
              <AbsoluteFill style={{ backgroundColor: "#000" }} />
            </TransitionSeries.Sequence>
          )}

          {timeline.scenes.map((scene, i) => {
            const isLast = i === timeline.scenes.length - 1;
            const nextScene = timeline.scenes[i + 1];
            const nextStartFrame = nextScene?.startFrame;
            const naturalGapFrames = nextStartFrame == null
              ? Math.max(0, scenesFrames - scene.endFrame)
              : Math.max(0, nextStartFrame - scene.endFrame);

            const transitionMaxFrames = !isLast && nextScene
              ? Math.max(1, Math.min(scene.durationFrames, nextScene.durationFrames))
              : undefined;

            const transitionHoldFrames = isLast
              ? 0
              : getTransition(
                  scene.transitionOut,
                  fps,
                  settings.transitionDuration,
                  width,
                  height,
                  transitionMaxFrames,
                ).timing.getDurationInFrames({ fps });

            // TransitionSeries subtracts transition duration from the overall
            // sequence. Adding the transition hold back onto the outgoing scene
            // therefore preserves the exact absolute timestamp. The natural gap
            // is frozen on the outgoing frame before the transition begins.
            const frozenTailFrames = naturalGapFrames + transitionHoldFrames;
            const sequenceDuration = scene.durationFrames + frozenTailFrames;

            const items: React.ReactNode[] = [];
            items.push(
              <TransitionSeries.Sequence key={scene.id} durationInFrames={sequenceDuration}>
                <Sequence durationInFrames={scene.durationFrames}>
                  <SceneComponent scene={scene} settings={settings} />
                </Sequence>
                {frozenTailFrames > 0 && (
                  <Sequence from={scene.durationFrames} durationInFrames={frozenTailFrames}>
                    <Freeze frame={scene.durationFrames - 1}>
                      <SceneComponent scene={scene} settings={settings} />
                    </Freeze>
                  </Sequence>
                )}
              </TransitionSeries.Sequence>,
            );

            if (!isLast) {
              const { presentation, timing } = getTransition(
                scene.transitionOut,
                fps,
                settings.transitionDuration,
                width,
                height,
                transitionMaxFrames,
              );
              items.push(
                <TransitionSeries.Transition
                  key={`trans-${scene.id}`}
                  presentation={presentation}
                  timing={timing}
                />
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
