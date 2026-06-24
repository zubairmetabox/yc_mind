import type { MetadataRoute } from "next";

// No auth on this app and it holds Zubair's personal curation data — block
// crawlers entirely rather than relying on the noindex meta tag alone.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
