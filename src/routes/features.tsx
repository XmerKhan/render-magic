import { createFileRoute } from "@tanstack/react-router";
import { FeaturesPage } from "@/components/MarketingBlocks";
import { pageSeo } from "@/lib/site";
export const Route = createFileRoute("/features")({ head: () => pageSeo({ title: "Features — Auto Edit", description: "Explore Auto Edit's script-driven cuts, Ken Burns motion, transitions, captions, audio controls, color grading and export options.", path: "/features" }), component: FeaturesPage });
