import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/blog/posts/public - Published blog posts only (for home page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = { isPublished: true, isActive: true };
    if (category && category !== 'all') where.category = category;

    const posts = await db.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      total: posts.length,
      data: posts,
    });
  } catch (error) {
    console.error('Error fetching public blog posts:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch posts' }, { status: 500 });
  }
}
