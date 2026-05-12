import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cleanupStoredNotifications } from '@/lib/notification-cleanup';
import { boundedInt, publicCacheHeaders, rateLimit } from '@/lib/api-guard';
import { getCachedResponse, setCachedResponse } from '@/lib/response-cache';

// GET /api/notices - Get notices with filtering
export async function GET(request: NextRequest) {
  const cacheKey = `notices:${request.nextUrl.search}`;

  try {
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId');
    const category = searchParams.get('category');
    const state = searchParams.get('state');
    const search = searchParams.get('search');
    const limit = boundedInt(searchParams.get('limit'), 50, 1, 100);
    const page = boundedInt(searchParams.get('page'), 1, 1, 1000);
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

    const [notices, total, categories] = await Promise.all([
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
      db.notice.findMany({
        select: { category: true },
        distinct: ['category'],
      }),
    ]);

    const payload = {
      success: true,
      message: "Notices fetched successfully!",
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      categories: categories.map(c => c.category),
      data: notices
    };
    setCachedResponse(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: publicCacheHeaders(45, 180),
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          ...publicCacheHeaders(30, 180),
          'X-Data-Source': 'stale-cache',
        },
      });
    }
    return NextResponse.json(
      { success: false, message: "Failed to fetch notices", error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/notices - Clean up old notices
export async function DELETE(request: NextRequest) {
  try {
    const limited = rateLimit(request, { key: 'notices:delete', limit: 2, windowMs: 60_000 });
    if (limited) return limited;

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
