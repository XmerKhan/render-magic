import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/StaticPage";
import { pageSeo } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => pageSeo({
    title: "About Us — Editsfield AI",
    description: "Learn about Editsfield AI, a browser-based video editor built to make script-driven editing, timing, captions and rendering easier for creators.",
    path: "/about",
  }),
  component: AboutPage,
});
