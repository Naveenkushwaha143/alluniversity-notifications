import { NextResponse } from 'next/server';
import { seedUniversities } from '@/lib/seed';

// GET /api/seed - Seed universities into the database
export async function GET() {
  try {
    await seedUniversities();
    return NextResponse.json({
      success: true,
      message: "Universities seeded successfully!"
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to seed universities", error: String(error) },
      { status: 500 }
    );
  }
}
