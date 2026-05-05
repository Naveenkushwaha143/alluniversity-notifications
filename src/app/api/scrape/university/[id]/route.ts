import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeUniversityWebsite } from '@/lib/website-scraper';
import { MAX_STORED_NOTIFICATIONS, cleanupOldUniversityNotices } from '@/lib/notification-cleanup';

let globalRateLimitUntil = 0;
const COOLDOWN_DURATION = 10 * 60 * 1000;

function getGlobalCooldownRemaining(): number {
  return Math.max(0, globalRateLimitUntil - Date.now());
}

function setGlobalCooldown() {
  globalRateLimitUntil = Date.now() + COOLDOWN_DURATION;
}

const scrapeAttempts: Record<string, { count: number; firstAt: number }> = {};
const RATE_LIMIT_WINDOW = 60000;
const MAX_ATTEMPTS_PER_WINDOW = 3;

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

export async function GET() {
  const cooldownRemaining = getGlobalCooldownRemaining();
  return NextResponse.json({
    cooldownActive: cooldownRemaining > 0,
    cooldownRemaining,
    cooldownMinutes: Math.ceil(cooldownRemaining / 60000),
    message: cooldownRemaining > 0
      ? `API cooldown mein hai. ${Math.ceil(cooldownRemaining / 60000)} minute baad try karein.`
      : 'Scrape ready!',
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cooldownRemaining = getGlobalCooldownRemaining();
    if (cooldownRemaining > 0) {
      const waitMin = Math.ceil(cooldownRemaining / 60000);
      return NextResponse.json({
        success: false,
        message: `API cooldown chal raha hai! ${waitMin} minute baad try karein.`,
        rateLimited: true,
        cooldownActive: true,
        cooldownRemaining,
        cooldownMinutes: waitMin,
      });
    }

    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    if (scrapeAttempts[clientIp] && now - scrapeAttempts[clientIp].firstAt > RATE_LIMIT_WINDOW) {
      delete scrapeAttempts[clientIp];
    }

    if ((scrapeAttempts[clientIp]?.count || 0) >= MAX_ATTEMPTS_PER_WINDOW) {
      const waitSec = Math.max(
        1,
        Math.ceil((RATE_LIMIT_WINDOW - (now - scrapeAttempts[clientIp].firstAt)) / 1000)
      );
      return NextResponse.json({
        success: false,
        message: `Bahut zyada requests! ${waitSec} second baad try karein.`,
        rateLimited: true,
        retryAfter: `${waitSec}s`,
      });
    }

    scrapeAttempts[clientIp] = scrapeAttempts[clientIp]
      ? { ...scrapeAttempts[clientIp], count: scrapeAttempts[clientIp].count + 1 }
      : { count: 1, firstAt: now };

    const university = await db.university.findUnique({
      where: { id },
    });

    if (!university) {
      return NextResponse.json(
        { success: false, message: 'University not found' },
        { status: 404 }
      );
    }

    console.log(`Scraping: ${university.name}`);

    const results = await scrapeUniversityWebsite(university, {
      maxResults: 5,
      pageLimit: 8,
      timeoutMs: 9000,
    });

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        message: `${university.shortName} ke liye koi naya notification nahi mila.`,
        newNotices: 0,
        universityName: university.name,
      });
    }

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

      const description = item.snippet || null;
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
        message: item.snippet || '',
        source: university.name,
        category,
        state: university.state,
        url: item.url,
        universityId: university.id,
      });

      newCount++;
    }

    const deletedOldNotices = await cleanupOldUniversityNotices(university.id);
    const totalNotices = await db.notice.count({ where: { universityId: university.id } });

    return NextResponse.json({
      success: true,
      message: newCount > 0
        ? `${university.shortName}: ${newCount} naye notifications mile!`
        : `${university.shortName}: Already up to date!`,
      newNotices: newCount,
      deletedOldNotices,
      maxStoredNotifications: MAX_STORED_NOTIFICATIONS,
      universityName: university.name,
      universityId: university.id,
      totalNotices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = String(error);
    if (message.includes('429') || message.includes('rate limit')) {
      setGlobalCooldown();
    }

    console.error('Single scrape error:', error);
    return NextResponse.json(
      { success: false, message: 'Scraping mein error aaya. Thodi der baad try karein.', error: message },
      { status: 500 }
    );
  }
}

function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('result') || t.includes('merit') || t.includes('marksheet')) return 'Result';
  if (t.includes('exam') || t.includes('examination') || t.includes('date sheet') || t.includes('schedule') || t.includes('timetable')) return 'Exam';
  if (t.includes('admission') || t.includes('enrollment') || t.includes('registration') || t.includes('apply online') || t.includes('application form')) return 'Admission';
  if (t.includes('holiday') || t.includes('vacation') || t.includes('closure') || t.includes('closed')) return 'Holiday';
  if (t.includes('fee') || t.includes('payment') || t.includes('scholarship') || t.includes('challan')) return 'Fee';
  if (t.includes('recruitment') || t.includes('job') || t.includes('vacancy') || t.includes('walk-in')) return 'Recruitment';
  if (t.includes('tender') || t.includes('procurement') || t.includes('quotation')) return 'Tender';
  if (t.includes('syllabus') || t.includes('curriculum') || t.includes('course')) return 'Academic';
  if (t.includes('convocation') || t.includes('degree') || t.includes('certificate')) return 'Convocation';
  if (t.includes('notification') || t.includes('notice') || t.includes('circular')) return 'Notification';
  return 'General';
}
