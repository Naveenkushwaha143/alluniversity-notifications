import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/api-guard';

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { key: 'admin-post:likes', limit: 30, windowMs: 60_000 });
    if (limited) return limited;

    const body = await request.json();
    const postId = String(body.postId || '').trim();

    if (!postId) {
      return NextResponse.json({ success: false, message: 'Post ID is required' }, { status: 400 });
    }

    const existingPost = await db.adminPost.findFirst({
      where: { id: postId, isActive: true },
      select: { id: true },
    });

    if (!existingPost) {
      return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
    }

    const post = await db.adminPost.update({
      where: { id: existingPost.id },
      data: { likes: { increment: 1 } },
      select: { id: true, likes: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Post liked',
      data: post,
    });
  } catch (error) {
    console.error('Error liking admin post:', error);
    return NextResponse.json({ success: false, message: 'Failed to like post' }, { status: 500 });
  }
}
