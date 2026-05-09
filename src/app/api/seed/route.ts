import { NextResponse } from 'next/server';
import { seedUniversities } from '@/lib/seed';
import { cleanupOldBlogPosts } from '@/lib/blog-cleanup';

// GET /api/seed - Seed universities into the database
export async function GET() {
  try {
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
