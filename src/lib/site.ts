/**
 * Centralized site configuration.
 * Set VITE_SITE_URL to the production custom domain before deploying so that
 * canonical URLs, Open Graph URLs and sitemap.xml all use one canonical host.
 */
const FALLBACK_SITE_URL = "https://autoeditors.lovable.app";
export const SITE_URL = ((import.meta.env["VITE_SITE_URL"] as string | undefined) || FALLBACK_SITE_URL).replace(/\/+$/, "");
export const site = {
  name: "Auto Edit",
  tagline: "The Online Free Video Editing Tool & Software for Creators",
  shortDescription: "Free online video editing software for creators.",
  description: "Edit videos online for free with Auto Edit. Cut clips, add captions, transitions, music and more directly in your browser.",
  url: SITE_URL,
  socialImage: `${SITE_URL}/og-image.svg`,
  contactEmail: (import.meta.env["VITE_CONTACT_EMAIL"] as string | undefined) || null,
} as const;
export function absoluteUrl(path: string): string { if (path === "/") return `${SITE_URL}/`; return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`; }
type MetaEntry = Record<string, string>;
export interface PageSeoOptions { title: string; description: string; path: string; type?: "website" | "article"; image?: string; noindex?: boolean; publishedTime?: string; modifiedTime?: string; }
export function pageSeo(options: PageSeoOptions): { meta: MetaEntry[]; links: MetaEntry[] } {
  const url = absoluteUrl(options.path); const image = options.image ?? site.socialImage;
  const meta: MetaEntry[] = [{ title: options.title }, { name: "description", content: options.description }, { property: "og:site_name", content: site.name }, { property: "og:title", content: options.title }, { property: "og:description", content: options.description }, { property: "og:type", content: options.type ?? "website" }, { property: "og:url", content: url }, { property: "og:image", content: image }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:title", content: options.title }, { name: "twitter:description", content: options.description }, { name: "twitter:image", content: image }];
  if (options.publishedTime) meta.push({ property: "article:published_time", content: options.publishedTime });
  if (options.modifiedTime) meta.push({ property: "article:modified_time", content: options.modifiedTime });
  if (options.noindex) meta.push({ name: "robots", content: "noindex, follow" });
  return { meta, links: [{ rel: "canonical", href: url }] };
}
export function jsonLd(data: unknown) { return { type: "application/ld+json", children: JSON.stringify(data) }; }
export function breadcrumbLd(items: { name: string; path: string }[]) { return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) }; }
