import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

const privatePaths = [
  "/api/",
  "/admin",
  "/admin/",
  "/*?view=*",
  "/*?state=*",
  "/*?search=*",
  "/*?universityId=*",
  "/*?category=*",
  "/*?page=*",
  "/*?limit=*",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: ["Twitterbot", "facebookexternalhit"],
        allow: "/",
        disallow: ["/api/", "/admin", "/admin/"],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
    host: siteConfig.url,
  };
}
