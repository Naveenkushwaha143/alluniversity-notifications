import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "hourly" as const },
    { path: "/?view=universities", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/?view=notices", priority: 0.95, changeFrequency: "hourly" as const },
    { path: "/?view=entrance", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/?view=board", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/?state=Bihar", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/?state=Uttar%20Pradesh", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/?state=Haryana", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/?state=Delhi", priority: 0.8, changeFrequency: "daily" as const },
  ];

  return routes.map((route) => ({
    url: new URL(route.path, siteConfig.url).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
