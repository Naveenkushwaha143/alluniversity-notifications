import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeUniversityWebsite, type ScraperUniversity } from '@/lib/website-scraper';
import { scrapeAndStoreExamNotifications } from '@/lib/exam-scraper';

// ── Global Rate Limit Cooldown ──
// Shared across bulk + single scrape to prevent API exhaustion
let globalRateLimitUntil = 0;
const COOLDOWN_DURATION = 10 * 60 * 1000; // 10 minutes

export function getGlobalCooldownRemaining(): number {
  return Math.max(0, globalRateLimitUntil - Date.now());
}

export function setGlobalCooldown() {
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
export async function POST() {
  try {
    // Check global cooldown first
    const cooldownRemaining = getGlobalCooldownRemaining();
    if (cooldownRemaining > 0) {
      const waitMin = Math.ceil(cooldownRemaining / 60000);
      return NextResponse.json({
        success: false,
        message: `API cooldown chal raha hai. ${waitMin} minute baad automatic try hoga.`,
        rateLimited: true,
        cooldownRemaining,
        cooldownMinutes: waitMin,
      });
    }

    const universities = await db.university.findMany({
      where: { isActive: true }
    });

    if (universities.length === 0) {
      return NextResponse.json(
        { success: false, message: "No active universities found!" },
        { status: 404 }
      );
    }

    // ── SMART SCRAPE: Only scrape a small random batch ──
    // Reduced from 25 to 8 to avoid hitting rate limit
    const shuffled = universities.sort(() => Math.random() - 0.5);
    const batch = shuffled.slice(0, 8);

    let totalNewNotices = 0;
    let rateLimited = false;
    let universitiesScraped = 0;

    for (let i = 0; i < batch.length; i++) {
      try {
        // 5-second delay between each university (up from 2s)
        if (i > 0) {
          await new Promise(r => setTimeout(r, 5000));
        }

        // Re-check cooldown before each university
        if (getGlobalCooldownRemaining() > 0) {
          console.log(`⏸️ Cooldown active, stopping at ${i}/${batch.length}`);
          rateLimited = true;
          break;
        }

        const newCount = await scrapeUniversity(batch[i]);
        totalNewNotices += newCount;
        universitiesScraped++;
      } catch (error: any) {
        const msg = String(error?.message || error || '');
        if (msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit')) {
          console.log(`⚠️ Rate limit hit after ${universitiesScraped} universities. Setting 10-min cooldown.`);
          setGlobalCooldown();
          rateLimited = true;
          break;
        }
        console.error(`Error scraping ${batch[i].name}:`, error);
      }
    }

    // After scraping, cleanup old notices (keep only 30 per university)
    const cleanupResult = await cleanupOldNotices();

    const examResult = await scrapeAndStoreExamNotifications('ALL', {
      limit: 6,
      maxResultsPerTarget: 2,
    });

    // Auto-create admin posts from best new notices
    let autoPostCount = 0;
    if (totalNewNotices > 0 || examResult.newCount > 0) {
      autoPostCount = await autoCreateAdminPosts();
    }

    return NextResponse.json({
      success: true,
      message: `Scraping complete! ${rateLimited ? '(Rate limit - cooldown set) ' : ''}Scraped ${universitiesScraped}/${batch.length} universities, found ${totalNewNotices} university notices, ${examResult.newCount} exam notifications, created ${autoPostCount} admin posts.`,
      newNotices: totalNewNotices,
      newExamNotifications: examResult.newCount,
      newAdminPosts: autoPostCount,
      deletedNotices: cleanupResult,
      universitiesScraped,
      examTargetsChecked: examResult.targetsChecked,
      batchTotal: batch.length,
      totalUniversities: universities.length,
      rateLimited,
      cooldownActive: rateLimited,
      cooldownMinutes: rateLimited ? 10 : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { success: false, message: "Scraping failed", error: String(error) },
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
      ? `API cooldown mein hai. ${Math.ceil(remaining / 60000)} minute baad scrape available hai.`
      : 'Scrape available - ready to go!',
  });
}

// Individual university scraper with retry
async function scrapeUniversity(
  university: ScraperUniversity
) {
  const results = await scrapeUniversityWebsite(university, {
    maxResults: 3,
    pageLimit: 5,
    timeoutMs: 8000,
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

    const description = item.snippet || null;
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
      message: item.snippet || '',
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

// Cleanup old notices - keep only 30 per university
async function cleanupOldNotices(): Promise<number> {
  const MAX_NOTICES = 30;
  const universities = await db.university.findMany({
    select: { id: true, name: true }
  });

  let totalDeleted = 0;

  for (const uni of universities) {
    const allNotices = await db.notice.findMany({
      where: { universityId: uni.id },
      orderBy: { datePublished: 'desc' },
      select: { id: true }
    });

    if (allNotices.length > MAX_NOTICES) {
      const toDelete = allNotices.slice(MAX_NOTICES).map(n => n.id);
      const result = await db.notice.deleteMany({
        where: { id: { in: toDelete } }
      });
      totalDeleted += result.count;
    }
  }

  return totalDeleted;
}
