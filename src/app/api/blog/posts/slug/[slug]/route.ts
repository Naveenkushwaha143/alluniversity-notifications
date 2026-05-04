import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/blog/posts/slug/[slug] - Get single blog post by slug + increment views
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await db.blogPost.findFirst({
      where: { slug, isActive: true, isPublished: true },
    });

    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
    }

    // Increment views
    await db.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: { ...post, views: post.views + 1 },
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch post' }, { status: 500 });
  }
}
