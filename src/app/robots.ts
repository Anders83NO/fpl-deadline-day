import { MetadataRoute } from "next";

// Search engines and AI crawlers (GPTBot, ClaudeBot, PerplexityBot…) are all welcome on public pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/reset-password", "/settings"],
      },
    ],
    sitemap: "https://fpldeadlineday.com/sitemap.xml",
    host: "https://fpldeadlineday.com",
  };
}
