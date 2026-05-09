import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postId = String(body.postId || '').trim();

    if (!postId) {
      return NextResponse.json({ success: false, message: 'Post ID is required' }, { status: 400 });
    }

    const existingPost = await db.blogPost.findFirst({
      where: { id: postId, isActive: true, isPublished: true },
      select: { id: true },
    });

    if (!existingPost) {
      return NextResponse.json({ success: false, message: 'Blog post not found' }, { status: 404 });
    }

    const post = await db.blogPost.update({
      where: { id: existingPost.id },
      data: { likes: { increment: 1 } },
      select: { id: true, likes: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Blog post liked',
      data: post,
    });
  } catch (error) {
    console.error('Error liking blog post:', error);
    return NextResponse.json({ success: false, message: 'Failed to like blog post' }, { status: 500 });
  }
}
