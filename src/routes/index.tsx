import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoCut Studio — Automatic Video Editor in Your Browser" },
      {
        name: "description",
        content:
          "Drop in clips, photos, voiceover and music. AutoCut Studio cuts to the beat with Ken Burns motion, transitions, captions and color grading, then exports a high-quality MP4.",
      },
      { property: "og:title", content: "AutoCut Studio — Automatic Video Editor" },
      {
        property: "og:description",
        content:
          "Auto-edit your footage with beat-matched cuts, Ken Burns motion, captions and color grading. Export a downloadable MP4.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});
