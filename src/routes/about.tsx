import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/MarketingBlocks";
import { pageSeo } from "@/lib/site";
export const Route = createFileRoute("/about")({ head: () => pageSeo({ title: "About — Auto Edit", description: "Learn what Auto Edit is designed to do and why its workflow is built around explicit media and timing data.", path: "/about" }), component: AboutPage });
