import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/seo";
import { boardPages, boardSlug } from "@/lib/board-pages";
import { EXAM_DETAILS } from "@/lib/entrance-exam-details";
import { importantStates, noticeSlug, slugify, stateSlug, universitySlug } from "@/lib/seo-pages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "hourly" as const },
    { path: "/blog", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/universities", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/notices", priority: 0.95, changeFrequency: "hourly" as const },
    { path: "/entrance", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/board", priority: 0.85, changeFrequency: "daily" as const },
  ];

  const staticRoutes = routes.map((route) => ({
    url: new URL(route.path, siteConfig.url).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const [posts, universities, notices, stateGroups] = await Promise.all([
      db.blogPost.findMany({
        where: { isPublished: true, isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      db.university.findMany({
        where: { isActive: true },
        select: { shortName: true, name: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      db.notice.findMany({
        select: { id: true, title: true, updatedAt: true },
        orderBy: { datePublished: "desc" },
        take: 1000,
      }),
      db.university.groupBy({
        by: ["state"],
        where: { isActive: true },
        _max: { updatedAt: true },
      }),
    ]);
    const dynamicStates = Array.from(new Map(
      [...importantStates.map((state) => ({ state, updatedAt: now })), ...stateGroups.map((item) => ({
        state: item.state,
        updatedAt: item._max.updatedAt || now,
      }))].map((item) => [stateSlug(item.state), item]),
    ).values());

    return [
      ...staticRoutes,
      ...dynamicStates.map((item) => ({
        url: new URL(`/states/${stateSlug(item.state)}`, siteConfig.url).toString(),
        lastModified: item.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      ...universities.map((university) => ({
        url: new URL(`/universities/${universitySlug(university)}`, siteConfig.url).toString(),
        lastModified: university.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.82,
      })),
      ...notices.map((notice) => ({
        url: new URL(`/notices/${noticeSlug(notice)}`, siteConfig.url).toString(),
        lastModified: notice.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.78,
      })),
      ...Object.keys(EXAM_DETAILS).slice(0, 80).map((exam) => ({
        url: new URL(`/entrance/${slugify(exam)}`, siteConfig.url).toString(),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.76,
      })),
      ...boardPages.map((board) => ({
        url: new URL(`/board/${boardSlug(board)}`, siteConfig.url).toString(),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.74,
      })),
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
