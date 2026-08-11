import { Img, OffthreadVideo, staticFile, useRemotionEnvironment } from "remotion";
import { Video } from "@remotion/media";
import { memo } from "react";
import type { TimelineScene, EditSettings, ColorGradePreset } from "@/types";
import { KenBurnsImage } from "./KenBurnsImage";
import { Caption } from "./Caption";
import { MotionGraphics } from "./MotionGraphics";

const COLOR_GRADES: Record<ColorGradePreset, { contrast: number; saturation: number; brightness: number; sepia: number; hueRotate: number; vignette: number }> = {
  none: { contrast: 1, saturation: 1, brightness: 1, sepia: 0, hueRotate: 0, vignette: 0 },
  cinematic: { contrast: 1.15, saturation: 1.1, brightness: 0.95, sepia: 0, hueRotate: 0, vignette: 0.4 },
  warm: { contrast: 1.05, saturation: 1.2, brightness: 1.03, sepia: 0.15, hueRotate: 0, vignette: 0.2 },
  cool: { contrast: 1.1, saturation: 0.95, brightness: 0.98, sepia: 0, hueRotate: 200, vignette: 0.25 },
  vintage: { contrast: 1.1, saturation: 0.8, brightness: 1.05, sepia: 0.3, hueRotate: 0, vignette: 0.35 },
  vivid: { contrast: 1.2, saturation: 1.35, brightness: 1.02, sepia: 0, hueRotate: 0, vignette: 0.15 },
};

const Vignette: React.FC<{ intensity: number }> = memo(({ intensity }) => {
  if (intensity <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${intensity}) 75%)`, pointerEvents: "none" }} />
  );
});

const FILM_GRAIN_RECTS = Array.from({ length: 180 }, (_, i) => {
  const x = (i * 37) % 200;
  const y = (i * 83) % 200;
  const opacity = ((i * 17) % 60 + 20) / 100;
  const size = i % 5 === 0 ? 2 : 1;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" opacity="${opacity}"/>`;
}).join("");
const FILM_GRAIN_IMAGE = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">${FILM_GRAIN_RECTS}</svg>`)}")`;

const FilmGrain: React.FC<{ amount: number }> = memo(({ amount }) => {
  if (amount <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: amount * 0.25, backgroundImage: FILM_GRAIN_IMAGE, backgroundRepeat: "repeat", pointerEvents: "none", mixBlendMode: "overlay" }} />
  );
});

export const SceneComponent: React.FC<{ scene: TimelineScene; settings: EditSettings }> = memo(({ scene, settings }) => {
  const preset = COLOR_GRADES[settings.colorGrade];
  const manual = settings.manualColorGrade;
  const contrast = preset.contrast * manual.contrast;
  const saturation = preset.saturation * manual.saturation;
  const brightness = preset.brightness * manual.brightness;
  const vignette = Math.min(1, preset.vignette + manual.vignette);
  const filterStr = `contrast(${contrast}) saturate(${saturation}) brightness(${brightness}) sepia(${preset.sepia}) hue-rotate(${preset.hueRotate}deg)`;
  const mediaUrl = scene.media.url.startsWith("worker-asset:") ? staticFile(scene.media.url.slice("worker-asset:".length)) : scene.media.url;
  const hasColorGrade = contrast !== 1 || saturation !== 1 || brightness !== 1 || preset.sepia !== 0 || preset.hueRotate !== 0;
  const env = useRemotionEnvironment();

  const media = scene.media.kind === "image" ? (
    scene.kenBurns.enabled ? <KenBurnsImage scene={scene} /> : <Img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  ) : env.isRendering ? (
    <Video src={mediaUrl} style={{ width: "100%", height: "100%" }} objectFit="cover" muted />
  ) : (
    <OffthreadVideo src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
  );

  // A tiny overscan prevents sub-pixel transform/transition edges from exposing
  // the black scene background. It is intentionally small enough to be invisible
  // in normal framing while eliminating the thick black seams seen during slides
  // and zoom transitions.
  const mediaLayerStyle: React.CSSProperties = {
    position: "absolute",
    inset: "-1%",
    width: "102%",
    height: "102%",
  };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#000" }}>
      {hasColorGrade ? (
        <div style={{ ...mediaLayerStyle, filter: filterStr }}>{media}</div>
      ) : (
        <div style={mediaLayerStyle}>{media}</div>
      )}
      <Vignette intensity={vignette} />
      <FilmGrain amount={manual.filmGrain} />
      <Caption scene={scene} settings={settings} />
      <MotionGraphics scene={scene} settings={settings} />
    </div>
  );
});
