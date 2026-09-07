import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => new Response(
        [
          "User-agent: *",
          "Allow: /",
          "Disallow: /editor",
          "",
          "User-agent: Googlebot",
          "Allow: /",
          "Disallow: /editor",
          "",
          "User-agent: Bingbot",
          "Allow: /",
          "Disallow: /editor",
          "",
          "User-agent: GPTBot",
          "Allow: /",
          "Disallow: /editor",
          "",
          "User-agent: ClaudeBot",
          "Allow: /",
          "Disallow: /editor",
          "",
          "User-agent: PerplexityBot",
          "Allow: /",
          "Disallow: /editor",
          "",
          "User-agent: Google-Extended",
          "Allow: /",
          "Disallow: /editor",
          "",
          `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
          "",
        ].join("\n"),
        { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } },
      ),
    },
  },
});
