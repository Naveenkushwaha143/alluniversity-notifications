import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cleanupStoredNotifications } from '@/lib/notification-cleanup';

// GET /api/notices - Get notices with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId');
    const category = searchParams.get('category');
    const state = searchParams.get('state');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (universityId) {
      where.universityId = universityId;
    } else if (state) {
      where.university = { state };
    }

    if (category) where.category = category;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [notices, total] = await Promise.all([
      db.notice.findMany({
        where,
        include: {
          university: {
            select: {
              id: true,
              name: true,
              shortName: true,
              color: true,
              logo: true,
              state: true,
              district: true,
            }
          }
        },
        orderBy: { datePublished: 'desc' },
        take: limit,
        skip,
      }),
      db.notice.count({ where }),
    ]);

    // Get unique categories
    const categories = await db.notice.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      success: true,
      message: "Notices fetched successfully!",
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      categories: categories.map(c => c.category),
      data: notices
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notices", error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/notices - Clean up old notices
export async function DELETE() {
  try {
    const cleanupResult = await cleanupStoredNotifications();

    return NextResponse.json({
      success: true,
      message: `Cleanup complete! Deleted ${cleanupResult.totalDeleted} old notifications.`,
      ...cleanupResult,
    });
  } catch (error) {
    console.error("Error cleaning up notices:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cleanup notices", error: String(error) },
      { status: 500 }
    );
  }
}
