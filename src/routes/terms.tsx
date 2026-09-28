import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/components/StaticPage";
import { pageSeo } from "@/lib/site";
export const Route = createFileRoute("/terms")({ head: () => pageSeo({ title: "Terms of Use — Editsfield AI", description: "Read the Editsfield AI terms governing acceptable use, user content and service availability.", path: "/terms" }), component: TermsPage });
