import { db } from '@/lib/db';

export const MAX_STORED_NOTIFICATIONS = 50;

export async function cleanupOldUniversityNotices(universityId?: string): Promise<number> {
  const universities = universityId
    ? [{ id: universityId }]
    : await db.university.findMany({ select: { id: true } });

  let totalDeleted = 0;

  for (const university of universities) {
    const notices = await db.notice.findMany({
      where: { universityId: university.id },
      orderBy: [{ datePublished: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });

    if (notices.length <= MAX_STORED_NOTIFICATIONS) continue;

    const oldNoticeIds = notices
      .slice(MAX_STORED_NOTIFICATIONS)
      .map((notice) => notice.id);

    const result = await db.notice.deleteMany({
      where: { id: { in: oldNoticeIds } },
    });

    totalDeleted += result.count;
  }

  return totalDeleted;
}

export async function cleanupOldExamNotifications(): Promise<number> {
  const exams = await db.examNotification.findMany({
    orderBy: [{ createdAt: 'desc' }],
    select: { id: true },
  });

  if (exams.length <= MAX_STORED_NOTIFICATIONS) return 0;

  const oldExamIds = exams
    .slice(MAX_STORED_NOTIFICATIONS)
    .map((exam) => exam.id);

  const result = await db.examNotification.deleteMany({
    where: { id: { in: oldExamIds } },
  });

  return result.count;
}

export async function cleanupStoredNotifications(universityId?: string) {
  const [noticesDeleted, examNotificationsDeleted] = await Promise.all([
    cleanupOldUniversityNotices(universityId),
    cleanupOldExamNotifications(),
  ]);

  return {
    maxStored: MAX_STORED_NOTIFICATIONS,
    noticesDeleted,
    examNotificationsDeleted,
    totalDeleted: noticesDeleted + examNotificationsDeleted,
  };
}
