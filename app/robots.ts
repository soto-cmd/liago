import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin/", "/auth/", "/onboarding/"],
    },
    sitemap: "https://liago.vercel.app/sitemap.xml",
    host: "https://liago.vercel.app",
  };
}
