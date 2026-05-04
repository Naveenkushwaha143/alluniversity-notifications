export type ScraperUniversity = {
  id: string;
  name: string;
  shortName: string;
  website: string;
  state: string;
};

export type ScrapedNoticeItem = {
  name: string;
  url: string;
  snippet: string | null;
  date: Date | null;
};

type RankedLink = ScrapedNoticeItem & {
  score: number;
};

const NOTICE_KEYWORDS = [
  'notice',
  'notification',
  'circular',
  'announcement',
  'exam',
  'examination',
  'result',
  'admission',
  'date sheet',
  'datesheet',
  'time table',
  'timetable',
  'schedule',
  'merit',
  'registration',
  'scholarship',
  'fee',
  'tender',
  'recruitment',
  'vacancy',
  'syllabus',
];

const CANDIDATE_PATHS = [
  '/',
  '/notice',
  '/notices',
  '/notice-board',
  '/notification',
  '/notifications',
  '/circular',
  '/circulars',
  '/announcement',
  '/announcements',
  '/news',
  '/latest-news',
  '/examination',
  '/examinations',
  '/student-notice',
  '/students',
];

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function cleanText(text: string): string {
  return decodeHtml(text)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeWebsite(website: string): URL | null {
  try {
    const withProtocol = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

function sameSite(url: URL, base: URL): boolean {
  return url.hostname === base.hostname || url.hostname.endsWith(`.${base.hostname}`);
}

function isSkippableUrl(rawHref: string): boolean {
  const href = rawHref.trim().toLowerCase();
  return (
    !href ||
    href.startsWith('#') ||
    href.startsWith('javascript:') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.includes('facebook.com') ||
    href.includes('twitter.com') ||
    href.includes('x.com/') ||
    href.includes('instagram.com') ||
    href.includes('youtube.com') ||
    href.includes('linkedin.com') ||
    href.includes('/login') ||
    href.includes('/admin')
  );
}

function scoreNotice(title: string, url: string): number {
  const haystack = `${title} ${url}`.toLowerCase();
  let score = 0;

  for (const keyword of NOTICE_KEYWORDS) {
    if (haystack.includes(keyword)) score += keyword.length > 8 ? 4 : 3;
  }

  if (/\.(pdf|doc|docx|xls|xlsx)$/i.test(url)) score += 5;
  if (/20(2[4-9]|3[0-9])/.test(haystack)) score += 2;
  if (title.length >= 12 && title.length <= 180) score += 2;
  if (/^(click here|read more|view|download|details)$/i.test(title.trim())) score -= 4;

  return score;
}

function parseDate(text: string): Date | null {
  const patterns = [
    /\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/,
    /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/,
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(20\d{2})\b/i,
  ];

  const numeric = text.match(patterns[0]);
  if (numeric) {
    const date = new Date(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const iso = text.match(patterns[1]);
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const word = text.match(patterns[2]);
  if (word) {
    const date = new Date(`${word[1]} ${word[2]} ${word[3]}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

async function fetchHtml(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; UniUpdatesScraper/1.0)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml'))) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractLinks(html: string, pageUrl: string, baseUrl: URL): RankedLink[] {
  const links: RankedLink[] = [];
  const anchorPattern = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) !== null) {
    const rawHref = decodeHtml(match[1]);
    if (isSkippableUrl(rawHref)) continue;

    let url: URL;
    try {
      url = new URL(rawHref, pageUrl);
    } catch {
      continue;
    }

    if (!sameSite(url, baseUrl)) continue;

    const title = cleanText(match[2]);
    if (!title || title.length < 4) continue;

    const absoluteUrl = url.toString();
    const score = scoreNotice(title, absoluteUrl);
    if (score < 3) continue;

    links.push({
      name: title.substring(0, 220),
      url: absoluteUrl,
      snippet: `Found on ${baseUrl.hostname}`,
      date: parseDate(`${title} ${absoluteUrl}`),
      score,
    });
  }

  return links;
}

function candidateUrls(baseUrl: URL): string[] {
  return CANDIDATE_PATHS.map((path) => new URL(path, baseUrl).toString());
}

export async function scrapeUniversityWebsite(
  university: ScraperUniversity,
  options: { maxResults?: number; pageLimit?: number; timeoutMs?: number } = {}
): Promise<ScrapedNoticeItem[]> {
  const baseUrl = normalizeWebsite(university.website);
  if (!baseUrl) return [];

  const maxResults = options.maxResults ?? 5;
  const pageLimit = options.pageLimit ?? 6;
  const timeoutMs = options.timeoutMs ?? 9000;
  const pages = candidateUrls(baseUrl).slice(0, pageLimit);
  const byUrl = new Map<string, RankedLink>();

  for (const page of pages) {
    const html = await fetchHtml(page, timeoutMs);
    if (!html) continue;

    for (const link of extractLinks(html, page, baseUrl)) {
      const key = link.url.split('#')[0];
      const existing = byUrl.get(key);
      if (!existing || link.score > existing.score) {
        byUrl.set(key, link);
      }
    }
  }

  return [...byUrl.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ score: _score, ...item }) => item);
}
