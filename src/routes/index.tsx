import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/MarketingBlocks";
import { jsonLd, pageSeo, site, breadcrumbLd } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageSeo({ title: `${site.name} — ${site.tagline}`, description: site.description, path: "/" }),
    scripts: [
      jsonLd({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: site.name, applicationCategory: "MultimediaApplication", operatingSystem: "Web", description: site.description, url: site.url }),
      jsonLd(breadcrumbLd([{ name: "Home", path: "/" }])),
    ],
  }),
  component: HomePage,
});
