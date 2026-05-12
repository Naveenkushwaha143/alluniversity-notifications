import { NextRequest, NextResponse } from 'next/server';
import { seedUniversities } from '@/lib/seed';
import { cleanupOldBlogPosts } from '@/lib/blog-cleanup';
import { isAuthenticated } from '@/lib/admin-auth';
import { noStoreHeaders, rateLimit } from '@/lib/api-guard';

// GET /api/seed - Seed universities into the database
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' || !isAuthenticated(request.headers.get('cookie'))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401, headers: noStoreHeaders() },
      );
    }

    const limited = rateLimit(request, { key: 'seed:get', limit: 1, windowMs: 60_000 });
    if (limited) return limited;

    const result = await seedUniversities();
    const deletedOldBlogPosts = await cleanupOldBlogPosts();
    return NextResponse.json({
      success: true,
      message: "Universities and demo blog posts seeded successfully!",
      deletedOldBlogPosts,
      ...result,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to seed universities", error: String(error) },
      { status: 500 }
    );
  }
}
