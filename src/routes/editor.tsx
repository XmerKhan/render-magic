import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";
import { pageSeo } from "@/lib/site";

export const Route = createFileRoute("/editor")({
  head: () => pageSeo({
    title: "Editsfield AI — AI Video Editor",
    description: "Edit videos with AI in your browser. Editsfield AI is a fast, simple, and creative AI video editor.",
    path: "/editor",
    type: "website",
  }),
  component: App,
});
