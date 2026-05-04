import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeAndStoreExamNotifications } from '@/lib/exam-scraper';

// GET /api/exams - List exam notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const state = searchParams.get('state');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.examType = type.toUpperCase();
    if (category) where.category = category;
    if (state) where.state = state;

    const exams = await db.examNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      message: 'Exam notifications fetched successfully',
      total: exams.length,
      data: exams,
    });
  } catch (error) {
    console.error('Error fetching exam notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch exam notifications', error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/exams - Fetch exam notifications from official exam/board websites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    const examType = (type || 'ALL').toUpperCase();
    const validTypes = ['NTA', 'BOARD', 'ALL'];
    if (!validTypes.includes(examType)) {
      return NextResponse.json(
        { success: false, message: `Invalid type: ${type}. Use NTA, BOARD, or ALL` },
        { status: 400 }
      );
    }

    const result = await scrapeAndStoreExamNotifications(examType, {
      limit: examType === 'ALL' ? 8 : 6,
      maxResultsPerTarget: 3,
    });

    return NextResponse.json({
      success: true,
      message: `Fetched and stored ${result.newCount} new exam notifications`,
      newNotifications: result.newCount,
      targetsChecked: result.targetsChecked,
    });
  } catch (error) {
    console.error('Error fetching exam notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch exam notifications', error: String(error) },
      { status: 500 }
    );
  }
}
