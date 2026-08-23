import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/StaticPage";
import { pageSeo } from "@/lib/site";
export const Route = createFileRoute("/contact")({ head: () => pageSeo({ title: "Contact — Auto Edit", description: "Contact Auto Edit with product feedback, support questions or partnership enquiries.", path: "/contact" }), component: ContactPage });
