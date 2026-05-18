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
  'programme',
  'program',
  'practical',
  'selection',
  'cutoff',
  'cut-off',
  'interview',
  'admit card',
  'marksheet',
  'migration',
  'degree',
  'semester',
  'ug',
  'pg',
];

const CANDIDATE_PATHS = [
  '/',
  '/notice',
  '/notices',
  '/notice-board',
  '/noticeboard',
  '/notice-board/',
  '/notices-and-circulars',
  '/notification',
  '/notifications',
  '/notification/categories/examination',
  '/notification/categories/admission',
  '/notification/categories/degree-programs',
  '/notification/categories/pg-programs',
  '/notification/categories/b-ed',
  '/notification/categories/ph-d',
  '/notification/categories/marksheets',
  '/notification/categories/certificates',
  '/notification-and-circular',
  '/circular',
  '/circulars',
  '/announcement',
  '/announcements',
  '/news',
  '/latest-news',
  '/latest-update',
  '/latest-updates',
  '/examination',
  '/examinations',
  '/exam',
  '/exam-notice',
  '/exam-notices',
  '/examination-notice',
  '/result',
  '/results',
  '/admission',
  '/admissions',
  '/student-notice',
  '/student-corner',
  '/students-corner',
  '/students',
  '/download',
  '/downloads',
  '/academic',
  '/academics',
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
  if (/^(click here|read more|read more\s+\d+|view|view more|download|details|share|home)$/i.test(title.trim())) score -= 8;

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

async function fetchJson(url: string, timeoutMs: number): Promise<any | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; UniUpdatesScraper/1.0)',
        accept: 'application/json,text/plain,*/*',
      },
      redirect: 'follow',
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function absoluteUrl(rawUrl: string | null | undefined, baseUrl: string): string {
  if (!rawUrl) return baseUrl;
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

async function scrapeBnmuWebsite(options: { maxResults: number; timeoutMs: number }): Promise<ScrapedNoticeItem[]> {
  const endpoints = [
    {
      url: 'https://bnmu.ac.in/api/v1/front/announcement-notice/?is_draft=false',
      key: 'AnnouncementNotices',
      label: 'Announcement & Notice',
    },
    {
      url: 'https://bnmu.ac.in/api/v1/front/student-notice?is_draft=false',
      key: 'studentNotices',
      label: 'News & Events',
    },
  ];
  const notices: ScrapedNoticeItem[] = [];

  for (const endpoint of endpoints) {
    const json = await fetchJson(endpoint.url, options.timeoutMs);
    const rows = json?.data?.[endpoint.key];
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      const title = cleanText(String(row?.title || ''));
      if (!title || title.length < 5) continue;

      const rawLink = row?.fileUrl || row?.link || row?.url || '';
      const url = absoluteUrl(String(rawLink), 'https://bnmu.ac.in/');
      const categories = Array.isArray(row?.category) ? row.category.filter(Boolean).join(', ') : endpoint.label;
      const createdAt = row?.createdAt ? new Date(row.createdAt) : null;

      notices.push({
        name: title.substring(0, 220),
        url,
        snippet: `${endpoint.label}${categories ? ` - ${categories}` : ''}`,
        date: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null,
      });
    }
  }

  const byUrl = new Map<string, ScrapedNoticeItem>();
  for (const item of notices) {
    byUrl.set(item.url.split('#')[0], item);
  }

  return [...byUrl.values()].slice(0, options.maxResults);
}

function extractFirstHref(html: string | null | undefined): string {
  if (!html) return '';
  const match = String(html).match(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/i);
  return match ? decodeHtml(match[1]) : '';
}

function parseKsdsuDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function scrapeKsdsuWebsite(options: { maxResults: number; timeoutMs: number }): Promise<ScrapedNoticeItem[]> {
  const siteUrl = 'https://ksdsu.bihar.gov.in/';
  const endpoints = [
    {
      url: 'https://ksdsu.bihar.gov.in/api/Mediaheading',
      label: 'Latest Notice',
    },
    {
      url: 'https://ksdsu.bihar.gov.in/api/Examination',
      label: 'Examination',
    },
    {
      url: 'https://ksdsu.bihar.gov.in/api/Whatsnew',
      label: "What's New",
    },
  ];
  const notices: ScrapedNoticeItem[] = [];

  for (const endpoint of endpoints) {
    const json = await fetchJson(endpoint.url, options.timeoutMs);
    const rows = Array.isArray(json) ? json : Array.isArray(json?.value) ? json.value : [];
    if (!rows.length) continue;

    for (const row of rows) {
      const title = cleanText(String(row?.u_news_tittle || row?.u_title || ''));
      if (!title || title.length < 4) continue;

      const htmlLink = extractFirstHref(row?.u_html);
      const rawLink = htmlLink || row?.u_external_file || row?.u_file || row?.u_internale_file || '';
      const url = absoluteUrl(String(rawLink), siteUrl);
      const date = parseKsdsuDate(row?.u_startdate || row?.created_at || row?.updated_at);

      notices.push({
        name: title.substring(0, 220),
        url,
        snippet: `Found on ksdsu.bihar.gov.in - ${endpoint.label}`,
        date,
      });
    }
  }

  const byKey = new Map<string, ScrapedNoticeItem>();
  for (const item of notices) {
    const key = item.url && item.url !== siteUrl ? item.url.split('#')[0] : item.name.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, item);
  }

  return [...byKey.values()]
    .sort((a, b) => {
      const aTime = a.date?.getTime() ?? 0;
      const bTime = b.date?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, options.maxResults);
}

async function scrapeLnmuWebsite(options: { maxResults: number; timeoutMs: number }): Promise<ScrapedNoticeItem[]> {
  const siteUrl = 'https://mail.lnmu.ac.in/';
  const pages = [
    'https://mail.lnmu.ac.in/document-notice',
    'https://mail.lnmu.ac.in/all-notices',
    'https://mail.lnmu.ac.in/exam-home',
  ];
  const notices: ScrapedNoticeItem[] = [];

  for (const page of pages) {
    const html = await fetchHtml(page, options.timeoutMs);
    if (!html) continue;

    const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowPattern.exec(html)) !== null) {
      const rowHtml = rowMatch[1];
      const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
      if (cells.length < 3) continue;

      const title = cleanText(cells[1]);
      if (!title || title.length < 5 || /^(title|date|download)$/i.test(title)) continue;

      const dateText = cleanText(cells[2]);
      const hrefMatch = rowHtml.match(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/i);
      const url = absoluteUrl(hrefMatch ? decodeHtml(hrefMatch[1]) : page, siteUrl);

      notices.push({
        name: title.substring(0, 220),
        url,
        snippet: `Found on LNMU official notice board${dateText ? ` - ${dateText}` : ''}`,
        date: parseDate(dateText),
      });
    }

    for (const link of extractLinks(html, page, new URL(siteUrl))) {
      notices.push({
        name: link.name,
        url: link.url,
        snippet: 'Found on LNMU official website',
        date: link.date,
      });
    }
  }

  const byKey = new Map<string, ScrapedNoticeItem>();
  for (const item of notices) {
    const key = item.url && item.url !== siteUrl ? item.url.split('#')[0] : item.name.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, item);
  }

  return [...byKey.values()]
    .sort((a, b) => {
      const aTime = a.date?.getTime() ?? 0;
      const bTime = b.date?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, options.maxResults);
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
    if (
      url.pathname.includes('/notification/categories/') ||
      url.pathname.includes('/profile/')
    ) {
      continue;
    }

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
  const urls = new Set<string>([baseUrl.toString()]);

  for (const path of CANDIDATE_PATHS) {
    urls.add(new URL(path, baseUrl).toString());
    if (baseUrl.pathname !== '/') {
      const localPath = path === '/' ? '.' : path.replace(/^\//, '');
      urls.add(new URL(localPath, baseUrl).toString());
    }
  }

  return [...urls];
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

  if (baseUrl.hostname.includes('bnmu.ac.in')) {
    return scrapeBnmuWebsite({ maxResults, timeoutMs });
  }

  if (baseUrl.hostname.includes('ksdsu.in') || baseUrl.hostname.includes('ksdsu.bihar.gov.in')) {
    return scrapeKsdsuWebsite({ maxResults, timeoutMs });
  }

  if (baseUrl.hostname.includes('lnmu.ac.in')) {
    return scrapeLnmuWebsite({ maxResults, timeoutMs });
  }

  const scrapeBaseUrl = baseUrl.hostname === 'tmbu.ac.in'
    ? new URL('https://www.tmbuniv.ac.in/public/')
    : baseUrl;
  const pages = candidateUrls(scrapeBaseUrl).slice(0, pageLimit);
  const byUrl = new Map<string, RankedLink>();

  for (const page of pages) {
    const html = await fetchHtml(page, timeoutMs);
    if (!html) continue;

    for (const link of extractLinks(html, page, scrapeBaseUrl)) {
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
