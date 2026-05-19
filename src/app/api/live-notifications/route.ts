import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MAX_STORED_NOTIFICATIONS } from '@/lib/notification-cleanup';
import { boundedInt, publicCacheHeaders } from '@/lib/api-guard';
import { getCachedResponse, setCachedResponse } from '@/lib/response-cache';

const LIVE_NOTIFICATION_TIMEOUT_MS = 4500;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Live notifications query timed out')), timeoutMs);
    }),
  ]);
}

export async function GET(request: NextRequest) {
  const cacheKey = `live-notifications:${request.nextUrl.search}`;

  try {
    const { searchParams } = new URL(request.url);
    const limit = boundedInt(searchParams.get('limit'), MAX_STORED_NOTIFICATIONS, 1, MAX_STORED_NOTIFICATIONS);

    const [notices, exams] = await withTimeout(Promise.all([
      db.notice.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          createdAt: true,
          sourceUrl: true,
          universityId: true,
          university: {
            select: {
              id: true,
              name: true,
              shortName: true,
              state: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.examNotification.findMany({
        where: { isActive: true },
        select: {
          id: true,
          examName: true,
          title: true,
          description: true,
          boardName: true,
          category: true,
          state: true,
          createdAt: true,
          sourceUrl: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]), LIVE_NOTIFICATION_TIMEOUT_MS);

    const liveItems = [
      ...notices.map((notice) => ({
        id: `notice-${notice.id}`,
        title: `${notice.university.shortName}: ${notice.title}`,
        message: notice.description || '',
        source: notice.university.name,
        category: notice.category || 'Notification',
        state: notice.university.state,
        timestamp: notice.createdAt.toISOString(),
        url: notice.sourceUrl || undefined,
        universityId: notice.universityId,
        kind: 'university',
      })),
      ...exams.map((exam) => ({
        id: `exam-${exam.id}`,
        title: `[${exam.examName}] ${exam.title}`,
        message: exam.description || '',
        source: exam.boardName || exam.examName,
        category: exam.category || 'Notification',
        state: exam.state || 'National',
        timestamp: exam.createdAt.toISOString(),
        url: exam.sourceUrl || undefined,
        examId: exam.id,
        kind: 'exam',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    const payload = {
      success: true,
      total: liveItems.length,
      data: liveItems,
    };
    setCachedResponse(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: publicCacheHeaders(20, 120),
    });
  } catch (error) {
    console.error('Error fetching live notifications:', error);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          ...publicCacheHeaders(15, 120),
          'X-Data-Source': 'stale-cache',
        },
      });
    }
    return NextResponse.json(
      { success: true, total: 0, data: [], message: 'Latest notifications are temporarily unavailable.' },
      {
        headers: {
          ...publicCacheHeaders(5, 30),
          'X-Data-Source': 'empty-fallback',
        },
      }
    );
  }
}
