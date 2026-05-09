import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthenticated } from '@/lib/admin-auth';
import { MAX_STORED_BLOG_POSTS, cleanupOldBlogPosts } from '@/lib/blog-cleanup';

// Helper: require admin auth
async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  if (!isAuthenticated(request.headers.get('cookie'))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// Helper: generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80) + '-' + Date.now().toString(36);
}

// GET /api/blog/posts - List all blog posts (admin sees all, public sees published only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const requestedLimit = parseInt(searchParams.get('limit') || String(MAX_STORED_BLOG_POSTS));
    const limit = Math.min(requestedLimit, MAX_STORED_BLOG_POSTS);
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    if (all) {
      const authError = await requireAuth(request);
      if (authError) return authError;
    }

    const where: Record<string, unknown> = {};
    if (!all) {
      where.isPublished = true;
      where.isActive = true;
    }
    if (category && category !== 'all') where.category = category;
    if (tag) where.tags = { contains: tag };

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        include: {
          _count: {
            select: { comments: true },
          },
        },
        orderBy: [{ isPublished: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip,
      }),
      db.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: posts.map((post) => ({
        ...post,
        commentsCount: post._count.comments,
      })),
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST /api/blog/posts - Create new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { title, excerpt, content, coverImage, author, tags, category, readTime, isPublished } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ success: false, message: 'Content is required' }, { status: 400 });
    }

    const slug = generateSlug(title);

    const post = await db.blogPost.create({
      data: {
        title: title.trim(),
        slug,
        excerpt: excerpt?.trim() || null,
        content: content.trim(),
        coverImage: coverImage?.trim() || null,
        author: author?.trim() || 'Admin',
        tags: tags || '',
        category: category?.trim() || 'Education',
        readTime: readTime || estimateReadTime(content),
        isPublished: Boolean(isPublished),
        isActive: true,
      },
    });

    const deletedOldPosts = await cleanupOldBlogPosts();

    return NextResponse.json({
      success: true,
      message: 'Blog post created',
      deletedOldPosts,
      maxStoredBlogPosts: MAX_STORED_BLOG_POSTS,
      data: post,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ success: false, message: 'Failed to create post' }, { status: 500 });
  }
}

// PUT /api/blog/posts - Update blog post (admin only)
export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { id, title, excerpt, content, coverImage, author, tags, category, readTime, isPublished, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Post ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (excerpt !== undefined) updateData.excerpt = excerpt?.trim() || null;
    if (content !== undefined) {
      updateData.content = content.trim();
      updateData.readTime = readTime || estimateReadTime(content);
    }
    if (coverImage !== undefined) updateData.coverImage = coverImage?.trim() || null;
    if (author !== undefined) updateData.author = author?.trim() || 'Admin';
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category.trim();
    if (readTime !== undefined) updateData.readTime = readTime;
    if (typeof isPublished === 'boolean') updateData.isPublished = isPublished;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const post = await db.blogPost.update({ where: { id }, data: updateData });
    const deletedOldPosts = await cleanupOldBlogPosts();

    return NextResponse.json({
      success: true,
      message: 'Blog post updated',
      deletedOldPosts,
      maxStoredBlogPosts: MAX_STORED_BLOG_POSTS,
      data: post,
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ success: false, message: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE /api/blog/posts - Delete blog post (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Post ID is required' }, { status: 400 });
    }

    await db.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Blog post deleted' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete post' }, { status: 500 });
  }
}

// Estimate read time from content
function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}
