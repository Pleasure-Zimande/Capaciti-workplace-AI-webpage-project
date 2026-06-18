import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/email", changefreq: "monthly", priority: "0.8" },
          { path: "/notes", changefreq: "monthly", priority: "0.8" },
          { path: "/planner", changefreq: "monthly", priority: "0.8" },
          { path: "/research", changefreq: "monthly", priority: "0.8" },
          { path: "/chat", changefreq: "monthly", priority: "0.8" },
        ];
        const urls = entries
          .map(
            (e) => `  <url>
    <loc>${BASE_URL}${e.path}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
