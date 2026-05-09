import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "hourly" as const },
    { path: "/blog", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/?view=universities", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/?view=notices", priority: 0.95, changeFrequency: "hourly" as const },
    { path: "/?view=entrance", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/?view=board", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/?state=Bihar", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/?state=Uttar%20Pradesh", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/?state=Haryana", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/?state=Delhi", priority: 0.8, changeFrequency: "daily" as const },
  ];

  const staticRoutes = routes.map((route) => ({
    url: new URL(route.path, siteConfig.url).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const posts = await db.blogPost.findMany({
      where: { isPublished: true, isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });

    return [
      ...staticRoutes,
      ...posts.map((post) => ({
        url: new URL(`/blog/${post.slug}`, siteConfig.url).toString(),
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
