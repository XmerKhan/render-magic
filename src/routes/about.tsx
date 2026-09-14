import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/StaticPage";
import { pageSeo } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => pageSeo({
    title: "About Us — Auto Edit Studio",
    description: "Learn about Auto Edit Studio, a browser-based video editor built to make script-driven editing, timing, captions and rendering easier for creators.",
    path: "/about",
  }),
  component: AboutPage,
});
