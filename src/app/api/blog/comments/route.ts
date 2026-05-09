import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendBlogCommentEmail } from '@/lib/comment-email';

function cleanText(value: unknown, maxLength: number) {
  return String(value || '').trim().slice(0, maxLength);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ success: false, message: 'Post ID is required' }, { status: 400 });
    }

    const comments = await db.blogComment.findMany({
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
    console.error('Error fetching blog comments:', error);
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

    const post = await db.blogPost.findFirst({
      where: { id: postId, isActive: true, isPublished: true },
      select: { id: true, title: true, slug: true },
    });

    if (!post) {
      return NextResponse.json({ success: false, message: 'Blog post not found' }, { status: 404 });
    }

    const comment = await db.blogComment.create({
      data: {
        postId: post.id,
        name,
        email: email || null,
        message,
        isApproved: true,
      },
    });

    const emailResult = await sendBlogCommentEmail({
      postTitle: post.title,
      postSlug: post.slug,
      name,
      email: email || null,
      message,
    });

    return NextResponse.json({
      success: true,
      message: 'Comment posted successfully',
      emailSent: emailResult.sent,
      data: comment,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog comment:', error);
    return NextResponse.json({ success: false, message: 'Failed to post comment' }, { status: 500 });
  }
}
