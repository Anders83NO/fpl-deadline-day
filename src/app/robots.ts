import { MetadataRoute } from "next";

// Search engines and AI crawlers (GPTBot, ClaudeBot, PerplexityBot…) are all welcome on public pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api/ must stay crawlable: Googlebot renders pages like /live that load their data from it
        disallow: ["/reset-password", "/settings"],
      },
    ],
    sitemap: "https://www.fpldeadlineday.com/sitemap.xml",
    host: "https://www.fpldeadlineday.com",
  };
}
