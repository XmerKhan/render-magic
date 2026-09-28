import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/components/StaticPage";
import { pageSeo } from "@/lib/site";
export const Route = createFileRoute("/privacy-policy")({ head: () => pageSeo({ title: "Privacy Policy — Editsfield AI", description: "Read the Editsfield AI privacy policy covering media processing, operational information and third-party services.", path: "/privacy-policy" }), component: PrivacyPage });
