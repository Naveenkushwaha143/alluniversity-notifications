import { db } from '@/lib/db';

export const MAX_STORED_BLOG_POSTS = 15;

export async function cleanupOldBlogPosts(): Promise<number> {
  const posts = await db.blogPost.findMany({
    orderBy: [{ createdAt: 'desc' }],
    select: { id: true },
  });

  if (posts.length <= MAX_STORED_BLOG_POSTS) return 0;

  const oldPostIds = posts.slice(MAX_STORED_BLOG_POSTS).map((post) => post.id);
  const result = await db.blogPost.deleteMany({
    where: { id: { in: oldPostIds } },
  });

  return result.count;
}
