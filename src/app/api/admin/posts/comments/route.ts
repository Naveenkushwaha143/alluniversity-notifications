import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function cleanText(value: unknown, maxLength: number) {
  return String(value || '').trim().slice(0, maxLength);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = cleanText(searchParams.get('postId'), 120);

    if (!postId) {
      return NextResponse.json({ success: false, message: 'Post ID is required' }, { status: 400 });
    }

    const comments = await db.adminPostComment.findMany({
      where: { postId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      total: comments.length,
      data: comments,
    });
  } catch (error) {
    console.error('Error fetching admin post comments:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postId = cleanText(body.postId, 120);
    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 120);
    const message = cleanText(body.message, 1000);

    if (!postId) {
      return NextResponse.json({ success: false, message: 'Post ID is required' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Valid email is required' }, { status: 400 });
    }
    if (message.length < 3) {
      return NextResponse.json({ success: false, message: 'Comment is too short' }, { status: 400 });
    }

    const post = await db.adminPost.findFirst({
      where: { id: postId, isActive: true },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
    }

    const comment = await db.adminPostComment.create({
      data: {
        postId: post.id,
        name,
        email: email || null,
        message,
        isApproved: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Comment posted successfully',
      data: comment,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin post comment:', error);
    return NextResponse.json({ success: false, message: 'Failed to post comment' }, { status: 500 });
  }
}
