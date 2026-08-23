import { createFileRoute } from "@tanstack/react-router";
import { HowItWorksPage } from "@/components/MarketingBlocks";
import { pageSeo } from "@/lib/site";
export const Route = createFileRoute("/how-it-works")({ head: () => pageSeo({ title: "How It Works — Auto Edit", description: "See how Auto Edit turns media, a complete voiceover and timing data into a previewable, render-ready video timeline.", path: "/how-it-works" }), component: HowItWorksPage });
