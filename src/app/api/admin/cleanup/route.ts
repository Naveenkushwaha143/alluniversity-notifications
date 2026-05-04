import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthenticated } from '@/lib/admin-auth';

// GET /api/admin/cleanup - Delete old admin posts and notices
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    if (!isAuthenticated(request.headers.get('cookie'))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    let adminPostsDeleted = 0;
    let noticesDeleted = 0;

    // Delete admin posts older than 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oldAdminPosts = await db.adminPost.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });
    adminPostsDeleted = oldAdminPosts.count;

    // Delete notices with category Exam/Result/Admission older than 60 days
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const oldNotices = await db.notice.deleteMany({
      where: {
        createdAt: { lt: sixtyDaysAgo },
        category: { in: ['Exam', 'Result', 'Admission'] },
      },
    });
    noticesDeleted = oldNotices.count;

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: {
        adminPostsDeleted,
        noticesDeleted,
        totalDeleted: adminPostsDeleted + noticesDeleted,
        cleanupDate: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { success: false, message: 'Cleanup failed', error: String(error) },
      { status: 500 }
    );
  }
}
