import { Composition } from "remotion";
import { VideoComposition } from "@/remotion/VideoComposition";
import { getCompositionConfig } from "@/remotion/config";
import type { EditSettings, TimelineData } from "@/types";

type Props = {
  timeline: TimelineData;
  settings: EditSettings;
};

/**
 * The worker renders exactly one composition. Its dimensions, fps and duration
 * come from the same `getCompositionConfig` the app preview uses, so the export
 * cannot drift from what the user saw.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="main"
      component={VideoComposition as React.FC<Props>}
      // Placeholders; calculateMetadata derives the real values from inputProps.
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={30}
      defaultProps={{} as Props}
      calculateMetadata={({ props }) => {
        if (!props?.timeline || !props?.settings) {
          throw new Error("The render job is missing its timeline or settings payload");
        }
        const config = getCompositionConfig(props.timeline, props.settings);
        return {
          width: config.width,
          height: config.height,
          fps: config.fps,
          durationInFrames: config.durationInFrames,
          props,
        };
      }}
    />
  );
};
