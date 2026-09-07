import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";
import { EditorGuide } from "@/components/EditorGuide";
import { pageSeo } from "@/lib/site";

export const Route = createFileRoute("/editor")({
  head: () => pageSeo({
    title: "Auto Edit Studio — AI Video Editor",
    description: "Edit videos with AI in your browser. Auto Edit Studio is a fast, simple, and creative AI video editor.",
    path: "/editor",
    type: "website",
  }),
  component: () => <><App /><EditorGuide /></>,
});
