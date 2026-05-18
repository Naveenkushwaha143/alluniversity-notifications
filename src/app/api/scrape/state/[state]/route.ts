import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeUniversityWebsite } from '@/lib/website-scraper';
import { MAX_STORED_NOTIFICATIONS, cleanupOldUniversityNotices } from '@/lib/notification-cleanup';

const OFFICIAL_SITE_MESSAGE = 'Please click the official website.';

function emitNotification(data: Record<string, unknown>) {
  fetch('http://127.0.0.1:3003/emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...data,
    }),
  }).catch(() => {});
}

function normalizeState(value: string): string {
  const decoded = decodeURIComponent(value).trim().toLowerCase();
  if (decoded === 'up' || decoded === 'uttar-pradesh') return 'Uttar Pradesh';
  if (decoded === 'bihar') return 'Bihar';
  if (decoded === 'delhi') return 'Delhi';
  if (decoded === 'haryana') return 'Haryana';
  return decoded
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('result') || t.includes('merit') || t.includes('marksheet')) return 'Result';
  if (t.includes('exam') || t.includes('examination') || t.includes('date sheet') || t.includes('schedule') || t.includes('timetable') || t.includes('admit card')) return 'Exam';
  if (t.includes('admission') || t.includes('enrollment') || t.includes('registration') || t.includes('apply online') || t.includes('application form')) return 'Admission';
  if (t.includes('holiday') || t.includes('vacation') || t.includes('closure') || t.includes('closed')) return 'Holiday';
  if (t.includes('fee') || t.includes('payment') || t.includes('scholarship') || t.includes('challan')) return 'Fee';
  if (t.includes('recruitment') || t.includes('job') || t.includes('vacancy') || t.includes('walk-in')) return 'Recruitment';
  if (t.includes('tender') || t.includes('procurement') || t.includes('quotation')) return 'Tender';
  if (t.includes('syllabus') || t.includes('curriculum') || t.includes('course') || t.includes('semester')) return 'Academic';
  if (t.includes('convocation') || t.includes('degree') || t.includes('certificate') || t.includes('migration')) return 'Convocation';
  if (t.includes('notification') || t.includes('notice') || t.includes('circular')) return 'Notification';
  return 'General';
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  try {
    const { state: rawState } = await params;
    const state = normalizeState(rawState);
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(Number(limitParam), 300)) : undefined;

    const universities = await db.university.findMany({
      where: {
        isActive: true,
        state,
        website: { not: '' },
      },
      orderBy: [
        { district: 'asc' },
        { name: 'asc' },
      ],
      ...(limit ? { take: limit } : {}),
    });

    if (universities.length === 0) {
      return NextResponse.json(
        { success: false, message: `No active universities were found for ${state}.` },
        { status: 404 }
      );
    }

    let totalNewNotices = 0;
    let checkedUniversities = 0;
    const universityResults: Array<{
      id: string;
      name: string;
      shortName: string;
      found: number;
      newNotices: number;
      error?: string;
    }> = [];

    for (const university of universities) {
      try {
        const results = await scrapeUniversityWebsite(university, {
          maxResults: 6,
          pageLimit: 20,
          timeoutMs: 9000,
        });

        let newCount = 0;

        for (const item of results) {
          const existing = await db.notice.findFirst({
            where: { sourceUrl: item.url },
          });
          if (existing) continue;

          const titleText = item.name.substring(0, 40);
          if (titleText.length > 5) {
            const titleExists = await db.notice.findFirst({
              where: { universityId: university.id, title: { contains: titleText } },
            });
            if (titleExists) continue;
          }

          const description = item.snippet
            ? `${item.snippet} ${OFFICIAL_SITE_MESSAGE}`
            : OFFICIAL_SITE_MESSAGE;
          const publishedDate = item.date && !Number.isNaN(item.date.getTime()) ? item.date : new Date();
          const category = detectCategory(`${item.name} ${item.snippet || ''}`);

          await db.notice.create({
            data: {
              universityId: university.id,
              title: item.name || 'Untitled Notice',
              description,
              sourceUrl: item.url,
              datePublished: publishedDate,
              category,
              isImportant: category === 'Exam' || category === 'Result' || category === 'Admission',
            },
          });

          emitNotification({
            title: `${university.shortName}: ${item.name || 'New Notice'}`,
            message: description,
            source: university.name,
            category,
            state: university.state,
            url: item.url,
            universityId: university.id,
          });

          newCount++;
        }

        if (newCount > 0) {
          await cleanupOldUniversityNotices(university.id);
        }

        checkedUniversities++;
        totalNewNotices += newCount;
        universityResults.push({
          id: university.id,
          name: university.name,
          shortName: university.shortName,
          found: results.length,
          newNotices: newCount,
        });
      } catch (error) {
        universityResults.push({
          id: university.id,
          name: university.name,
          shortName: university.shortName,
          found: 0,
          newNotices: 0,
          error: String(error),
        });
      }

      await wait(350);
    }

    emitNotification({
      title: `${state} Live Refresh Complete`,
      message: `${checkedUniversities} universities checked, ${totalNewNotices} new notices found. ${OFFICIAL_SITE_MESSAGE}`,
      source: 'All University Updates',
      category: totalNewNotices > 0 ? 'Notification' : 'General',
      state,
      url: '/',
    });

    return NextResponse.json({
      success: true,
      message: `${state}: ${checkedUniversities} universities refreshed, ${totalNewNotices} new notices found. ${OFFICIAL_SITE_MESSAGE}`,
      state,
      checkedUniversities,
      totalUniversities: universities.length,
      newNotices: totalNewNotices,
      maxStoredNotifications: MAX_STORED_NOTIFICATIONS,
      universities: universityResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('State scrape error:', error);
    return NextResponse.json(
      { success: false, message: 'State refresh failed. Please try again shortly.', error: String(error) },
      { status: 500 }
    );
  }
}
