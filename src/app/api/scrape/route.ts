import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeUniversityWebsite, type ScraperUniversity } from '@/lib/website-scraper';
import { scrapeAndStoreExamNotifications } from '@/lib/exam-scraper';
import { cleanupOldUniversityNotices } from '@/lib/notification-cleanup';

// ── Global Rate Limit Cooldown ──
// Shared across bulk + single scrape to prevent API exhaustion
let globalRateLimitUntil = 0;
const COOLDOWN_DURATION = 10 * 60 * 1000; // 10 minutes
const OFFICIAL_SITE_MESSAGE = 'Please click the official website.';
const BULK_SCRAPE_CONCURRENCY = 15;
const BULK_SCRAPE_DELAY_MS = 100;

type ScrapeOptions = {
  maxResults?: number;
  pageLimit?: number;
  timeoutMs?: number;
};

function getGlobalCooldownRemaining(): number {
  return Math.max(0, globalRateLimitUntil - Date.now());
}

function setGlobalCooldown() {
  globalRateLimitUntil = Date.now() + COOLDOWN_DURATION;
}

// Emit notification to WebSocket service (fire-and-forget)
function emitNotification(data: Record<string, unknown>) {
  fetch('http://127.0.0.1:3003/emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...data,
    }),
  }).catch(() => { /* ignore */ });
}

// POST /api/scrape - Trigger scraping (bulk / cron)
export async function POST(request: NextRequest) {
  try {
    // Check global cooldown first
    const cooldownRemaining = getGlobalCooldownRemaining();
    if (cooldownRemaining > 0) {
      const waitMin = Math.ceil(cooldownRemaining / 60000);
      return NextResponse.json({
        success: false,
        message: `API cooldown is active. Automatic refresh will try again after ${waitMin} minutes.`,
        rateLimited: true,
        cooldownRemaining,
        cooldownMinutes: waitMin,
      });
    }

    const body = await request.json().catch(() => ({})) as { includeExams?: boolean; limit?: number };
    const limit = Number.isFinite(Number(body.limit))
      ? Math.max(1, Math.min(Number(body.limit), 300))
      : undefined;
    const includeExams = body.includeExams === true;

    const universities = await db.university.findMany({
      where: {
        isActive: true,
        website: { not: '' },
      },
      orderBy: [{ state: 'asc' }, { district: 'asc' }, { name: 'asc' }],
      ...(limit ? { take: limit } : {}),
    });

    if (universities.length === 0) {
      return NextResponse.json(
        { success: false, message: "No active universities found!" },
        { status: 404 }
      );
    }

    // Bulk refresh checks every active university with a website.

    const batch = universities;

    let totalNewNotices = 0;
    let rateLimited = false;
    let universitiesScraped = 0;
    let failedUniversities = 0;
    const universityResults: Array<{
      id: string;
      name: string;
      shortName: string;
      newNotices: number;
      error?: string;
    }> = [];

    for (let start = 0; start < batch.length; start += BULK_SCRAPE_CONCURRENCY) {
      if (getGlobalCooldownRemaining() > 0) {
        console.log(`Cooldown active, stopping at ${universitiesScraped}/${batch.length}`);
        rateLimited = true;
        break;
      }

      const chunk = batch.slice(start, start + BULK_SCRAPE_CONCURRENCY);
      const results = await Promise.all(chunk.map(async (university) => {
        try {
          const newCount = await scrapeUniversity(university, {
            maxResults: 3,
            pageLimit: 3,
            timeoutMs: 3000,
          });
          return {
            id: university.id,
            name: university.name,
            shortName: university.shortName,
            newNotices: newCount,
          };
        } catch (error: any) {
          const msg = String(error?.message || error || '');
          if (msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit')) {
            setGlobalCooldown();
          }
          console.error(`Error scraping ${university.name}:`, error);
          return {
            id: university.id,
            name: university.name,
            shortName: university.shortName,
            newNotices: 0,
            error: msg,
          };
        }
      }));

      for (const result of results) {
        universityResults.push(result);
        totalNewNotices += result.newNotices;
        if (result.error) failedUniversities++;
        else universitiesScraped++;
      }

      if (getGlobalCooldownRemaining() > 0) {
        rateLimited = true;
        break;
      }

      if (start + BULK_SCRAPE_CONCURRENCY < batch.length) {
        await new Promise(r => setTimeout(r, BULK_SCRAPE_DELAY_MS));
      }
    }

    const examResult = includeExams
      ? await scrapeAndStoreExamNotifications('ALL', {
        limit: 4,
        maxResultsPerTarget: 1,
      })
      : { newCount: 0, targetsChecked: 0 };

    let noticesDeleted = 0;
    for (const result of universityResults) {
      if (result.newNotices > 0) {
        noticesDeleted += await cleanupOldUniversityNotices(result.id);
      }
    }
    const cleanupResult = {
      totalDeleted: noticesDeleted,
      noticesDeleted,
      examNotificationsDeleted: 0,
      maxStored: 50,
    };

    // Auto-create admin posts from best new notices
    let autoPostCount = 0;
    if (totalNewNotices > 0 || examResult.newCount > 0) {
      autoPostCount = await autoCreateAdminPosts();
    }

    return NextResponse.json({
      success: true,
      message: `All University refresh complete! ${rateLimited ? '(Rate limit - cooldown set) ' : ''}Checked ${universitiesScraped}/${batch.length} universities, failed ${failedUniversities}, found ${totalNewNotices} university notices, ${examResult.newCount} exam notifications, created ${autoPostCount} admin posts. ${OFFICIAL_SITE_MESSAGE}`,
      newNotices: totalNewNotices,
      newExamNotifications: examResult.newCount,
      newAdminPosts: autoPostCount,
      deletedNotifications: cleanupResult.totalDeleted,
      deletedNotices: cleanupResult.noticesDeleted,
      deletedExamNotifications: cleanupResult.examNotificationsDeleted,
      maxStoredNotifications: cleanupResult.maxStored,
      universitiesScraped,
      failedUniversities,
      examTargetsChecked: examResult.targetsChecked,
      batchTotal: batch.length,
      totalUniversities: universities.length,
      universities: universityResults,
      rateLimited,
      cooldownActive: rateLimited,
      cooldownMinutes: rateLimited ? 10 : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { success: false, message: "Refresh failed", error: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/scrape - Check cooldown status
export async function GET() {
  const remaining = getGlobalCooldownRemaining();
  return NextResponse.json({
    cooldownActive: remaining > 0,
    cooldownRemaining: remaining,
    cooldownMinutes: Math.ceil(remaining / 60000),
    message: remaining > 0
      ? `API cooldown is active. Refresh will be available after ${Math.ceil(remaining / 60000)} minutes.`
      : 'Refresh available - ready to go!',
  });
}

// Individual university scraper with retry
async function scrapeUniversity(
  university: ScraperUniversity,
  options: ScrapeOptions = {},
) {
  const results = await scrapeUniversityWebsite(university, {
    maxResults: options.maxResults ?? 5,
    pageLimit: options.pageLimit ?? 8,
    timeoutMs: options.timeoutMs ?? 8000,
  });

  if (!Array.isArray(results) || results.length === 0) {
    return 0;
  }

  let newCount = 0;

  for (const item of results) {
    // Skip duplicates by URL
    if (item.url) {
      const existing = await db.notice.findFirst({
        where: { sourceUrl: item.url }
      });
      if (existing) continue;
    }

    // Skip duplicates by title (first 40 chars)
    const titleText = (item.name || '').substring(0, 40);
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
    const category = detectCategory((item.name || '') + ' ' + (item.snippet || ''));

    await db.notice.create({
      data: {
        universityId: university.id,
        title: item.name || 'Untitled Notice',
        description,
        sourceUrl: item.url,
        datePublished: publishedDate,
        category,
        isImportant: category === 'Exam' || category === 'Result' || category === 'Admission',
      }
    });

    // Emit real-time notification
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

  console.log(`✅ ${university.shortName}: ${newCount} new`);
  return newCount;
}

// Detect notice category
function detectCategory(text: string): string {
  const t = text.toLowerCase();

  if (t.includes('result') || t.includes('merit') || t.includes('marksheet')) return 'Result';
  if (t.includes('exam') || t.includes('examination') || t.includes('date sheet') || t.includes('schedule') || t.includes('timetable')) return 'Exam';
  if (t.includes('admission') || t.includes('enrollment') || t.includes('registration') || t.includes('apply')) return 'Admission';
  if (t.includes('holiday') || t.includes('vacation') || t.includes('closure')) return 'Holiday';
  if (t.includes('fee') || t.includes('payment') || t.includes('scholarship')) return 'Fee';
  if (t.includes('recruitment') || t.includes('job') || t.includes('vacancy')) return 'Recruitment';
  if (t.includes('tender') || t.includes('procurement') || t.includes('quotation')) return 'Tender';
  if (t.includes('syllabus') || t.includes('curriculum')) return 'Academic';
  if (t.includes('convocation') || t.includes('degree')) return 'Convocation';

  return 'General';
}

// Auto-create admin posts from latest scraped notices
async function autoCreateAdminPosts(): Promise<number> {
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const recentNotices = await db.notice.findMany({
      where: {
        datePublished: { gte: twoDaysAgo },
        isImportant: true,
      },
      include: { university: true },
      orderBy: { datePublished: 'desc' },
      take: 20,
    });

    if (recentNotices.length === 0) return 0;

    const existingPosts = await db.adminPost.findMany({
      select: { sourceUrl: true },
    });
    const existingUrls = new Set(existingPosts.map(p => p.sourceUrl).filter(Boolean));

    const PIN_CATEGORIES = ['Result', 'Exam'];
    const CATEGORY_EMOJI: Record<string, string> = {
      Result: '📊', Exam: '📝', Admission: '🎓', Holiday: '🏖️',
      Fee: '💰', Recruitment: '💼', General: '📋',
    };

    let created = 0;

    for (const notice of recentNotices) {
      if (notice.sourceUrl && existingUrls.has(notice.sourceUrl)) continue;
      if (existingUrls.has(notice.id)) continue;

      const emoji = CATEGORY_EMOJI[notice.category] || '📋';
      const title = `${emoji} ${notice.university.shortName}: ${notice.title}`;
      const shouldPin = PIN_CATEGORIES.includes(notice.category);

      await db.adminPost.create({
        data: {
          title: title.substring(0, 200),
          content: notice.description ? notice.description.substring(0, 500) : null,
          category: notice.category,
          sourceUrl: notice.sourceUrl || notice.id,
          isPinned: shouldPin,
          isActive: true,
        },
      });

      existingUrls.add(notice.sourceUrl || notice.id);
      created++;
      if (created >= 5) break;
    }

    // Keep only last 15 active
    const allPosts = await db.adminPost.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
    if (allPosts.length > 15) {
      const toDeactivate = allPosts.slice(15).map(p => p.id);
      await db.adminPost.updateMany({
        where: { id: { in: toDeactivate } },
        data: { isActive: false, isPinned: false },
      });
    }

    return created;
  } catch (error) {
    console.error('Error auto-creating admin posts:', error);
    return 0;
  }
}
