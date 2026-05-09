import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MAX_STORED_NOTIFICATIONS } from '@/lib/notification-cleanup';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(MAX_STORED_NOTIFICATIONS)),
      MAX_STORED_NOTIFICATIONS
    );

    const [notices, exams] = await Promise.all([
      db.notice.findMany({
        include: {
          university: {
            select: {
              id: true,
              name: true,
              shortName: true,
              state: true,
            },
          },
        },
        orderBy: { datePublished: 'desc' },
        take: limit,
      }),
      db.examNotification.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const liveItems = [
      ...notices.map((notice) => ({
        id: `notice-${notice.id}`,
        title: `${notice.university.shortName}: ${notice.title}`,
        message: notice.description || '',
        source: notice.university.name,
        category: notice.category || 'Notification',
        state: notice.university.state,
        timestamp: notice.datePublished.toISOString(),
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

    return NextResponse.json({
      success: true,
      total: liveItems.length,
      data: liveItems,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching live notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch live notifications', error: String(error) },
      { status: 500 }
    );
  }
}
