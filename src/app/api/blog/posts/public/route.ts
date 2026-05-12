import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MAX_STORED_BLOG_POSTS } from '@/lib/blog-cleanup';
import { boundedInt, publicCacheHeaders } from '@/lib/api-guard';

// GET /api/blog/posts/public - Published blog posts only (for home page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = boundedInt(searchParams.get('limit'), MAX_STORED_BLOG_POSTS, 1, MAX_STORED_BLOG_POSTS);

    const where: Record<string, unknown> = { isPublished: true, isActive: true };
    if (category && category !== 'all') where.category = category;

    const posts = await db.blogPost.findMany({
      where,
      include: {
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      total: posts.length,
      data: posts.map((post) => ({
        ...post,
        commentsCount: post._count.comments,
      })),
    }, {
      headers: publicCacheHeaders(45, 180),
    });
  } catch (error) {
    console.error('Error fetching public blog posts:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch posts' }, { status: 500 });
  }
}
