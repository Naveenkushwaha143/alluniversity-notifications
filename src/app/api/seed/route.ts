import { NextResponse } from 'next/server';
import { seedUniversities } from '@/lib/seed';

// GET /api/seed - Seed universities into the database
export async function GET() {
  try {
    const result = await seedUniversities();
    return NextResponse.json({
      success: true,
      message: "Universities and demo blog posts seeded successfully!",
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
