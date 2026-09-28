import { createFileRoute } from "@tanstack/react-router";
import { HomePageWithPopular } from "@/components/HomePageWithPopular";
import { jsonLd, pageSeo, site, breadcrumbLd } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageSeo({ title: `${site.name} — ${site.tagline}`, description: site.description, path: "/" }),
    scripts: [
      jsonLd({ "@context": "https://schema.org", "@type": "Organization", name: site.name, url: site.url, logo: site.logo }),
      jsonLd({ "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: site.url, description: site.description }),
      jsonLd({ "@context": "https://schema.org", "@type": "WebApplication", name: site.name, applicationCategory: "MultimediaApplication", applicationSubCategory: "Video editing", operatingSystem: "Web browser", browserRequirements: "Requires a modern browser with JavaScript", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, featureList: ["Script-driven scene timing from JSON or SRT", "Voiceover sync", "Ken Burns motion", "Transitions", "Auto captions", "Background music auto-ducking", "Color grading", "16:9, 9:16, 1:1 and 4:5 aspect ratios", "MP4 export up to 4K"], description: site.description, url: `${site.url}/editor`, image: site.socialImage, screenshot: site.socialImage }),
      jsonLd(breadcrumbLd([{ name: "Home", path: "/" }])),
    ],
  }),
  component: HomePageWithPopular,
});
