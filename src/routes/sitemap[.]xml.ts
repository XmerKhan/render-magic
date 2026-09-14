import { createFileRoute } from "@tanstack/react-router";
import { posts } from "@/lib/blog";
import { supportPosts } from "@/lib/supportPosts";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const staticPaths = [
          "/",
          "/features",
          "/how-it-works",
          "/about",
          "/contact",
          "/editor",
          "/blog",
          "/privacy-policy",
          "/terms",
          "/cookie-policy",
        ];
        const allPosts = [...posts, ...supportPosts];
        const urls = [...staticPaths, ...allPosts.map((post) => `/blog/${post.slug}`)];
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${escapeXml(absoluteUrl(path))}</loc></url>`).join("")}</urlset>`;
        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
