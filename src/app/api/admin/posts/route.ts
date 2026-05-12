import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthenticated } from '@/lib/admin-auth';
import { boundedInt, publicCacheHeaders } from '@/lib/api-guard';

// Helper to check admin auth for mutation endpoints
async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  if (!isAuthenticated(request.headers.get('cookie'))) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  return null;
}

// GET /api/admin/posts - List posts (admin view or public view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';
    const category = searchParams.get('category');
    const limit = boundedInt(searchParams.get('limit'), 50, 1, 100);

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (!showAll) where.isActive = true;

    const posts = await db.adminPost.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      include: {
        _count: {
          select: { comments: true },
        },
      },
    });

    // Only include admin-only fields when authenticated
    const isAuth = isAuthenticated(request.headers.get('cookie'));

    const sanitizedPosts = posts.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category,
          sourceUrl: post.sourceUrl,
          imageUrl: post.imageUrl,
          likes: post.likes,
          commentsCount: post._count.comments,
          ...(isAuth ? {
            isPinned: post.isPinned,
            isActive: post.isActive,
          } : {}),
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        }));

    return NextResponse.json({
      success: true,
      message: 'Posts fetched successfully',
      total: sanitizedPosts.length,
      data: sanitizedPosts,
    }, {
      headers: isAuth ? undefined : publicCacheHeaders(30, 120),
    });
  } catch (error) {
    console.error('Error fetching admin posts:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch posts', error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/admin/posts - Create new post (admin only)
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { title, content, category, sourceUrl, imageUrl, isPinned } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
      );
    }

    const post = await db.adminPost.create({
      data: {
        title: title.trim(),
        content: content?.trim() || null,
        category: category?.trim() || 'General',
        sourceUrl: sourceUrl?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        isPinned: Boolean(isPinned),
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      data: post,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin post:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create post', error: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/admin/posts - Update post (toggle isActive, isPinned)
export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { id, isActive, isPinned } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Post ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (typeof isPinned === 'boolean') updateData.isPinned = isPinned;

    // Also allow updating other fields
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.content !== undefined) updateData.content = body.content?.trim() || null;
    if (body.category !== undefined) updateData.category = body.category.trim();
    if (body.sourceUrl !== undefined) updateData.sourceUrl = body.sourceUrl?.trim() || null;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields to update' },
        { status: 400 }
      );
    }

    const post = await db.adminPost.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully',
      data: post,
    });
  } catch (error) {
    console.error('Error updating admin post:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update post', error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/posts - Delete post by id (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Post ID is required (query param ?id=xxx)' },
        { status: 400 }
      );
    }

    await db.adminPost.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting admin post:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete post', error: String(error) },
      { status: 500 }
    );
  }
}
