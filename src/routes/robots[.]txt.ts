import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => new Response(
        [
          "User-agent: *",
          "Allow: /",
          "",
          "User-agent: Googlebot",
          "Allow: /",
          "",
          "User-agent: Bingbot",
          "Allow: /",
          "",
          "User-agent: GPTBot",
          "Allow: /",
          "",
          "User-agent: ClaudeBot",
          "Allow: /",
          "",
          "User-agent: PerplexityBot",
          "Allow: /",
          "",
          "User-agent: Google-Extended",
          "Allow: /",
          "",
          `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
          "",
        ].join("\n"),
        { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } },
      ),
    },
  },
});
