import { createFileRoute } from "@tanstack/react-router";
import { CookiePage } from "@/components/StaticPage";
import { pageSeo } from "@/lib/site";
export const Route = createFileRoute("/cookie-policy")({ head: () => pageSeo({ title: "Cookie Policy — Editsfield AI", description: "Learn how Editsfield AI may use browser storage, cookies and optional third-party services.", path: "/cookie-policy" }), component: CookiePage });
