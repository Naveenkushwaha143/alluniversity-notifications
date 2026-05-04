import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/posts/public - Return only active admin posts, ordered by pinned first then createdAt desc
export async function GET() {
  try {
    const posts = await db.adminPost.findMany({
      where: { isActive: true },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    });

    // Strip admin-only fields
    const publicPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      sourceUrl: post.sourceUrl,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      message: 'Public posts fetched successfully',
      total: publicPosts.length,
      data: publicPosts,
    });
  } catch (error) {
    console.error('Error fetching public posts:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch posts', error: String(error) },
      { status: 500 }
    );
  }
}
