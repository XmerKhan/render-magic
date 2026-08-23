import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";
import { pageSeo } from "@/lib/site";

export const Route = createFileRoute("/editor")({
  head: () => pageSeo({ title: "Editor — AutoCut Studio", description: "Open the AutoCut Studio browser editor and build a narration-led video from your media, voiceover and timing script.", path: "/editor", noindex: true }),
  component: App,
});
