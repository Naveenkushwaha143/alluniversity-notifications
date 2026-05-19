import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

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

type RankedSectionUrl = {
  url: string;
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
  '/latest',
  '/whats-new',
  '/what-s-new',
  '/notice',
  '/notices',
  '/notice-board',
  '/noticeboard',
  '/notice-board/',
  '/notice-and-announcement',
  '/notice-and-announcements',
  '/notices-circulars',
  '/circulars-notices',
  '/notices-and-circulars',
  '/Common/Notice',
  '/Common/Notice/ViewNotice',
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
  '/news-events',
  '/news-and-events',
  '/events',
  '/latest-news',
  '/latest-update',
  '/latest-updates',
  '/student-zone',
  '/student-section',
  '/students-section',
  '/student-services',
  '/students-notice-board',
  '/office-orders-and-circulars',
  '/examination',
  '/examinations',
  '/exam',
  '/exam-notice',
  '/exam-notices',
  '/examination-notice',
  '/examination-notices',
  '/result',
  '/results',
  '/result-notice',
  '/result-notices',
  '/admission',
  '/admissions',
  '/advertisement',
  '/advertisements',
  '/student-notice',
  '/student-corner',
  '/students-corner',
  '/students',
  '/download',
  '/downloads',
  '/downloads/notice',
  '/important-links',
  '/academic',
  '/academic-calendar',
  '/academics',
  '/jobs',
  '/job',
  '/career',
  '/careers',
  '/recruitment',
  '/tender',
  '/tenders',
  '/tender-notice',
  '/tender-notices',
  '/press-release',
  '/press-releases',
];

const SECTION_KEYWORDS = [
  'notice',
  'notification',
  'circular',
  'announcement',
  'latest',
  'whats new',
  "what's new",
  'news',
  'event',
  'student',
  'exam',
  'examination',
  'result',
  'admission',
  'download',
  'academic calendar',
  'recruitment',
  'career',
  'job',
  'tender',
];

const PAGE_FETCH_CONCURRENCY = 4;

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

function canonicalHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

function sameSite(url: URL, base: URL): boolean {
  const urlHost = canonicalHost(url.hostname);
  const baseHost = canonicalHost(base.hostname);
  return urlHost === baseHost || urlHost.endsWith(`.${baseHost}`);
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

function getAttribute(attributes: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = attributes.match(new RegExp(`${escapedName}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match ? decodeHtml(match[1]) : '';
}

function anchorLabel(innerHtml: string, attributes: string): string {
  return cleanText(innerHtml) ||
    cleanText(getAttribute(attributes, 'aria-label')) ||
    cleanText(getAttribute(attributes, 'title'));
}

function isHtmlPageUrl(url: URL): boolean {
  return !/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|jpg|jpeg|png|gif|webp|svg|css|js)$/i.test(url.pathname);
}

function textKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function readStringExpression(expression: string): string {
  const tokenPattern = /String\.fromCharCode\((\d+)\)|'([^']*)'|"([^"]*)"/g;
  let value = '';
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(expression)) !== null) {
    if (match[1]) value += String.fromCharCode(Number(match[1]));
    else value += match[2] ?? match[3] ?? '';
  }

  return value;
}

function parseSucuriCookie(html: string): string | null {
  const encoded = html.match(/\bS='([^']+)'/)?.[1];
  if (!encoded) return null;

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const valueMatch = decoded.match(/\b([a-zA-Z_$][\w$]*)=([\s\S]*?);document\.cookie=/);
    if (!valueMatch) return null;

    const variableName = valueMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const valueExpression = valueMatch[2];
    const nameExpression = decoded.match(new RegExp(`document\\.cookie=([\\s\\S]*?)\\+\\s*['"]=['"]\\s*\\+\\s*${variableName}`))?.[1];
    if (!valueExpression || !nameExpression) return null;

    const name = readStringExpression(nameExpression);
    const value = readStringExpression(valueExpression);
    return name && value ? `${name}=${value}` : null;
  } catch {
    return null;
  }
}

async function fetchHtmlWithNodeRequest(
  url: string,
  timeoutMs: number,
  retryCookie?: string,
  redirects = 0
): Promise<string | null> {
  return new Promise((resolve) => {
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      resolve(null);
      return;
    }

    const request = target.protocol === 'http:' ? httpRequest : httpsRequest;
    const req = request(
      target,
      {
        method: 'GET',
        timeout: timeoutMs,
        rejectUnauthorized: false,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; UniUpdatesScraper/1.0)',
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          ...(retryCookie ? { cookie: retryCookie } : {}),
        },
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const location = response.headers.location;
        if (statusCode >= 300 && statusCode < 400 && location && redirects < 4) {
          response.resume();
          resolve(fetchHtmlWithNodeRequest(new URL(location, target).toString(), timeoutMs, retryCookie, redirects + 1));
          return;
        }

        const contentType = String(response.headers['content-type'] || '');
        if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
          response.resume();
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const html = Buffer.concat(chunks).toString('utf8');
          if (statusCode >= 200 && statusCode < 300) {
            resolve(html);
            return;
          }

          if (!retryCookie) {
            const sucuriCookie = parseSucuriCookie(html);
            if (sucuriCookie) {
              resolve(fetchHtmlWithNodeRequest(url, timeoutMs, sucuriCookie, redirects));
              return;
            }
          }

          resolve(null);
        });
      }
    );

    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
    req.end();
  });
}

function scoreNotice(title: string, url: string): number {
  const haystack = `${title} ${url}`.toLowerCase();
  let score = 0;

  for (const keyword of NOTICE_KEYWORDS) {
    if (haystack.includes(keyword)) score += keyword.length > 8 ? 4 : 3;
  }

  if (/\.(pdf|doc|docx|xls|xlsx)$/i.test(url)) score += 5;
  if (/\b(result|marksheet|admit card|exam form|examination form|provisional certificate)\b/i.test(title)) score += 12;
  if (/20(2[4-9]|3[0-9])/.test(haystack)) score += 2;
  if (title.length >= 12 && title.length <= 180) score += 2;
  if (/^(click here\b.*|read more|read more\s+\d+|view|view more|view notice|view attached notice|attached notice|download|download now|download notice|notice pdf|details|share|home)$/i.test(title.trim())) score -= 16;
  if (/\b(view attached notice|attached notice|download notice|notice pdf)\b/i.test(title)) score -= 20;
  if (/\b(applicant login|college login|instructions for|online admission process|admission rules|important dates|seats availability|make payment)\b/i.test(title)) score -= 12;

  return score;
}

function scoreSectionUrl(title: string, url: string): number {
  const normalizedTitle = title.toLowerCase().replace(/[-_/]+/g, ' ');
  const normalizedUrl = url.toLowerCase().replace(/[-_/]+/g, ' ');
  const haystack = `${normalizedTitle} ${normalizedUrl}`;
  let score = 0;

  for (const keyword of SECTION_KEYWORDS) {
    if (haystack.includes(keyword)) score += keyword.length > 7 ? 5 : 3;
  }

  if (/\b(notice|notification|circular|announcement|result|admission|exam|examination)\b/.test(haystack)) score += 8;
  if (/\b(latest|student|download|whats new|what's new)\b/.test(haystack)) score += 4;
  if (/\b(about|contact|gallery|photo|video|faculty|department|committee|privacy|terms|login|admin|profile|alumni)\b/.test(haystack)) score -= 12;
  if (url.includes('#')) score -= 2;

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

async function fetchHtml(url: string, timeoutMs: number, retryCookie?: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; UniUpdatesScraper/1.0)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(retryCookie ? { cookie: retryCookie } : {}),
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null;
    }

    const html = await response.text();
    if (response.ok) {
      try {
        const hostname = new URL(url).hostname;
        if (hostname.includes('beu-bih.ac.in') && html.length < 1200) {
          return fetchHtmlWithNodeRequest(url, timeoutMs, retryCookie);
        }
      } catch {}
      return html;
    }

    try {
      const hostname = new URL(url).hostname;
      if (hostname.includes('beu-bih.ac.in')) {
        return fetchHtmlWithNodeRequest(url, timeoutMs, retryCookie);
      }
    } catch {}

    if (!retryCookie) {
      const sucuriCookie = parseSucuriCookie(html);
      if (sucuriCookie) return fetchHtml(url, timeoutMs, sucuriCookie);
    }

    return null;
  } catch {
    try {
      const hostname = new URL(url).hostname;
      if (hostname.includes('patna.amity.edu') || hostname.includes('beu-bih.ac.in')) {
        return fetchHtmlWithNodeRequest(url, timeoutMs, retryCookie);
      }
    } catch {}
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

async function scrapePurneaWebsite(options: { maxResults: number; timeoutMs: number }): Promise<ScrapedNoticeItem[]> {
  const pages = [
    { url: 'https://purneau.ac.in/news/examination', label: 'Examination' },
    { url: 'https://purneau.ac.in/news/notice', label: 'Notice' },
  ];
  const notices: ScrapedNoticeItem[] = [];

  for (const page of pages) {
    const html = await fetchHtml(page.url, options.timeoutMs);
    if (!html) continue;

    const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowPattern.exec(html)) !== null) {
      const rowHtml = rowMatch[1];
      const cells = [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
        .map((match) => cleanText(match[1]));
      if (cells.length < 3) continue;

      const title = cells[1]?.trim();
      const dateText = cells[2]?.trim();
      if (!title || title.length < 5 || /notice title/i.test(title)) continue;

      const hrefMatch = rowHtml.match(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/i);
      const url = absoluteUrl(hrefMatch ? decodeHtml(hrefMatch[1]) : page.url, page.url);

      notices.push({
        name: title.substring(0, 220),
        url,
        snippet: `Found on Purnea University official ${page.label} page${dateText ? ` - ${dateText}` : ''}`,
        date: parseDate(dateText || title),
      });
    }
  }

  const byKey = new Map<string, ScrapedNoticeItem>();
  for (const item of notices) {
    const key = item.url && item.url !== 'https://purneau.ac.in/' ? item.url.split('#')[0] : item.name.toLowerCase();
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

function cleanAmityPatnaTitle(text: string): string {
  return cleanText(text)
    .replace(/^\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+20\d{2}\s*[-–]?\s*/i, '')
    .replace(/^(?:patna|hybrid|hybrid mode)\s+/i, '')
    .replace(/^(?:[^,]{2,90},\s*)?Amity University Patna(?: Campus)?\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function scrapeAmityPatnaWebsite(options: { maxResults: number; timeoutMs: number }): Promise<ScrapedNoticeItem[]> {
  const pages = [
    { url: 'https://patna.amity.edu/event-list.aspx', label: 'Events' },
    { url: 'https://patna.amity.edu/upcomingevent.aspx', label: 'Announcements' },
    { url: 'https://patna.amity.edu/media-coverage.aspx', label: 'Media Coverage' },
    { url: 'https://patna.amity.edu/', label: 'Home' },
  ];
  const byUrl = new Map<string, ScrapedNoticeItem>();

  for (const page of pages) {
    const html = await fetchHtml(page.url, options.timeoutMs);
    if (!html) continue;

    const anchorPattern = /<a\b([^>]*)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = anchorPattern.exec(html)) !== null) {
      const rawHref = decodeHtml(match[2]);
      if (isSkippableUrl(rawHref)) continue;

      const label = anchorLabel(match[4], `${match[1]} ${match[3]}`);
      const url = absoluteUrl(rawHref, page.url);
      const haystack = `${label} ${url}`.toLowerCase();
      const isEventLink = /event-detail-normal\.aspx|\/upcoming-event\//i.test(url);
      const isUsefulPdf = /\.pdf(?:$|\?)/i.test(url) &&
        /\b(academic|examination|exam|result|notice|prospectus|fee|anti ragging|grievance|mandatory|disclosure|student|placed|convocation|ordinance|rti)\b/i.test(label);

      if (!isEventLink && !isUsefulPdf) continue;
      if (/\b(apply now|login|alumni portal|placement portal|parents section)\b/i.test(haystack)) continue;

      const title = cleanAmityPatnaTitle(label);
      if (!title || title.length < 5) continue;

      byUrl.set(url.split('#')[0], {
        name: title.substring(0, 220),
        url,
        snippet: `Found on Amity University Patna official ${page.label} page`,
        date: parseDate(label),
      });
    }
  }

  return [...byUrl.values()]
    .sort((a, b) => {
      const aTime = a.date?.getTime() ?? 0;
      const bTime = b.date?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, options.maxResults);
}

async function scrapeBasuWebsite(options: { maxResults: number; timeoutMs: number }): Promise<ScrapedNoticeItem[]> {
  const pages = [
    { url: 'https://basu.org.in/results/', label: 'Results' },
    { url: 'https://basu.org.in/notice-for-students/', label: 'Student Notices' },
    { url: 'https://basu.org.in/important-circulars/', label: 'Important Circulars' },
    { url: 'https://basu.org.in/circular/', label: 'Circulars' },
    { url: 'https://basu.org.in/recruitments/', label: 'Recruitments' },
    { url: 'https://basu.org.in/admission/admission-notice/', label: 'Admission Notices' },
    { url: 'https://basu.org.in/', label: 'Latest Notifications' },
  ];
  const byUrl = new Map<string, ScrapedNoticeItem>();

  for (const page of pages) {
    const html = await fetchHtml(page.url, options.timeoutMs);
    if (!html) continue;

    const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowPattern.exec(html)) !== null) {
      const rowHtml = rowMatch[1];
      const cells = [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
        .map((match) => cleanText(match[1]))
        .filter(Boolean);
      if (cells.length < 2) continue;

      const dateText =
        cells.find((cell) => /^\d{1,2}[-/.]\d{1,2}[-/.]20\d{2}$/.test(cell)) ||
        cells.find((cell) => /\b\d{1,2}[-/.]\d{1,2}[-/.]20\d{2}\b/.test(cell)) ||
        '';
      const title = cells
        .filter((cell) => cell !== dateText)
        .find((cell) =>
          cell.length >= 5 &&
          !/^\d{1,2}[-/.]\d{1,2}[-/.]20\d{2}$/.test(cell) &&
          !/^(title|date|issue date|archive|download|view)$/i.test(cell) &&
          scoreNotice(cell, page.url) >= 3
        );
      if (!title) continue;

      const hrefMatch = rowHtml.match(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/i);
      const url = absoluteUrl(hrefMatch ? decodeHtml(hrefMatch[1]) : page.url, page.url);

      byUrl.set(url.split('#')[0], {
        name: title.substring(0, 220),
        url,
        snippet: `Found on Bihar Animal Sciences University official ${page.label} page${dateText ? ` - ${dateText}` : ''}`,
        date: parseDate(dateText || title),
      });
    }
  }

  return [...byUrl.values()]
    .sort((a, b) => {
      const aTime = a.date?.getTime() ?? 0;
      const bTime = b.date?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, options.maxResults);
}

function titleFromFileUrl(rawUrl: string): string {
  try {
    const { pathname } = new URL(rawUrl);
    const file = pathname.split('/').pop() || '';
    if (!file) return '';
    const decoded = decodeURIComponent(file);
    return cleanText(decoded)
      .replace(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();
  } catch {
    return '';
  }
}

function extractPdfLinks(html: string, pageUrl: string, baseUrl: URL): ScrapedNoticeItem[] {
  const items: ScrapedNoticeItem[] = [];
  const anchorPattern = /<a\b([^>]*)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) !== null) {
    const rawHref = decodeHtml(match[2]);
    if (isSkippableUrl(rawHref)) continue;

    let url: URL;
    try {
      url = new URL(rawHref, pageUrl);
    } catch {
      continue;
    }

    if (!sameSite(url, baseUrl)) continue;
    if (!/\.(pdf|doc|docx)$/i.test(url.pathname)) continue;

    const href = url.toString();
    const label = anchorLabel(match[4], `${match[1]} ${match[3]}`);
    const title = cleanText(label) || titleFromFileUrl(href);
    if (!title || title.length < 5) continue;

    items.push({
      name: title.substring(0, 220),
      url: href,
      snippet: 'Found on BEU official website',
      date: parseDate(`${title} ${href}`),
    });
  }

  return items;
}

function extractPdfUrlsFromHtml(html: string, baseUrl: URL): ScrapedNoticeItem[] {
  const items: ScrapedNoticeItem[] = [];
  const seen = new Set<string>();
  const urlPattern = /(?:https?:\/\/[^\s"'<>]+|\/[^\s"'<>]+)\.pdf(?:\?[^\s"'<>]*)?/gi;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(html)) !== null) {
    const rawUrl = decodeHtml(match[0]);
    let absolute: string;
    try {
      absolute = new URL(rawUrl, baseUrl).toString();
    } catch {
      continue;
    }

    if (!sameSite(new URL(absolute), baseUrl)) continue;
    const key = absolute.split('#')[0];
    if (seen.has(key)) continue;
    seen.add(key);

    const title = titleFromFileUrl(absolute);
    if (!title || title.length < 5) continue;

    items.push({
      name: title.substring(0, 220),
      url: absolute,
      snippet: 'Found on BEU official website',
      date: parseDate(`${title} ${absolute}`),
    });
  }

  return items;
}

function extractFirstAnchorText(html: string): string {
  const anchorPattern = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html)) !== null) {
    const text = cleanText(match[1]);
    if (text.length >= 4) return text;
  }
  return cleanText(html);
}

async function scrapeBeuApiNotices(options: { maxResults: number; timeoutMs: number }): Promise<ScrapedNoticeItem[]> {
  const apiBase = 'https://beu-bih.ac.in/backend/v1/notice';
  const fileBase = 'https://beu-bih.ac.in/backend/';
  const notices: ScrapedNoticeItem[] = [];

  const noticeJson = await fetchJson(`${apiBase}/get-notice`, options.timeoutMs);
  const noticeRows = Array.isArray(noticeJson?.data) ? noticeJson.data : [];
  for (const row of noticeRows) {
    const html = String(row?.notice || '').trim();
    if (!html) continue;
    const url = absoluteUrl(extractFirstHref(html), fileBase);
    const title = extractFirstAnchorText(html) || 'BEU Notice';
    const date = row?.updatedAt ? new Date(row.updatedAt) : row?.createdAt ? new Date(row.createdAt) : null;

    notices.push({
      name: title.substring(0, 220),
      url,
      snippet: 'Found on BEU notice feed',
      date: date && !Number.isNaN(date.getTime()) ? date : null,
    });
  }

  const boardJson = await fetchJson(`${apiBase}/get-notice-board`, options.timeoutMs);
  const boardRows = Array.isArray(boardJson) ? boardJson : [];
  for (const row of boardRows) {
    const title = cleanText(String(row?.board || ''));
    if (!title) continue;
    const url = absoluteUrl(String(row?.link || ''), fileBase);
    const date = row?.noticedate ? new Date(String(row.noticedate)) : null;

    notices.push({
      name: title.substring(0, 220),
      url,
      snippet: 'Found on BEU notice board',
      date: date && !Number.isNaN(date.getTime()) ? date : null,
    });
  }

  const alertsJson = await fetchJson(`${apiBase}/get-alerts`, options.timeoutMs);
  const alertRows = Array.isArray(alertsJson?.data) ? alertsJson.data : [];
  for (const row of alertRows) {
    const title = cleanText(String(row?.alertstitle || ''));
    if (!title) continue;
    const url = String(row?.alertsurl || '').trim();
    const date = row?.updatedAt ? new Date(row.updatedAt) : row?.createdAt ? new Date(row.createdAt) : null;

    notices.push({
      name: title.substring(0, 220),
      url,
      snippet: row?.alertsubtitle ? cleanText(String(row.alertsubtitle)) : 'Found on BEU alerts',
      date: date && !Number.isNaN(date.getTime()) ? date : null,
    });
  }

  return notices
    .filter((item) => item.url && item.url !== fileBase)
    .slice(0, options.maxResults);
}

async function scrapeBeuWebsite(options: { maxResults: number; timeoutMs: number }): Promise<ScrapedNoticeItem[]> {
  const pages = [
    'https://beu-bih.ac.in/',
    'https://beu-bih.ac.in/notice',
    'https://beu-bih.ac.in/notices',
    'https://beu-bih.ac.in/notifications',
    'https://beu-bih.ac.in/examination',
    'https://beu-bih.ac.in/results',
  ];
  const byUrl = new Map<string, ScrapedNoticeItem>();
  const baseUrl = new URL('https://beu-bih.ac.in/');

  for (const item of await scrapeBeuApiNotices(options)) {
    const key = item.url.split('#')[0];
    if (!byUrl.has(key)) byUrl.set(key, item);
  }

  for (const page of pages) {
    let html = await fetchHtml(page, options.timeoutMs);
    if (!html || !/\.pdf\b/i.test(html)) {
      const retry = await fetchHtmlWithNodeRequest(page, options.timeoutMs);
      if (retry) html = retry;
    }
    if (!html) continue;

    console.log(`[BEU] page=${page} html=${html.length} pdf=${/\.pdf\b/i.test(html)}`);

    for (const item of extractPdfLinks(html, page, baseUrl)) {
      const key = item.url.split('#')[0];
      if (!byUrl.has(key)) byUrl.set(key, item);
    }

    for (const item of extractPdfUrlsFromHtml(html, baseUrl)) {
      const key = item.url.split('#')[0];
      if (!byUrl.has(key)) byUrl.set(key, item);
    }
  }

  return [...byUrl.values()]
    .sort((a, b) => {
      const aTime = a.date?.getTime() ?? 0;
      const bTime = b.date?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, options.maxResults);
}

function extractLinks(html: string, pageUrl: string, baseUrl: URL): RankedLink[] {
  const links: RankedLink[] = [];
  const anchorPattern = /<a\b([^>]*)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) !== null) {
    const rawHref = decodeHtml(match[2]);
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

    const title = anchorLabel(match[4], `${match[1]} ${match[3]}`);
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

function extractSectionUrls(html: string, pageUrl: string, baseUrl: URL): RankedSectionUrl[] {
  const sections = new Map<string, RankedSectionUrl>();
  const anchorPattern = /<a\b([^>]*)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) !== null) {
    const rawHref = decodeHtml(match[2]);
    if (isSkippableUrl(rawHref)) continue;

    let url: URL;
    try {
      url = new URL(rawHref, pageUrl);
    } catch {
      continue;
    }

    if (!sameSite(url, baseUrl) || !isHtmlPageUrl(url)) continue;

    const title = anchorLabel(match[4], `${match[1]} ${match[3]}`);
    const absoluteUrl = url.toString().split('#')[0];
    const score = scoreSectionUrl(title, absoluteUrl);
    if (score < 8) continue;

    const existing = sections.get(absoluteUrl);
    if (!existing || score > existing.score) {
      sections.set(absoluteUrl, { url: absoluteUrl, score });
    }
  }

  return [...sections.values()].sort((a, b) => b.score - a.score);
}

function extractStructuredRows(html: string, pageUrl: string, baseUrl: URL): RankedLink[] {
  const links: RankedLink[] = [];
  const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cells = [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((match) => cleanText(match[1]))
      .filter(Boolean);
    if (cells.length < 2) continue;

    let bestTitle = '';
    let bestScore = -20;
    for (const cell of cells) {
      if (
        cell.length < 5 ||
        cell.length > 220 ||
        /^(s\.?\s*no\.?|sl\.?|heading|details|publish date|expire date|download|view|date)$/i.test(cell) ||
        /^\d+$/.test(cell) ||
        /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(cell)
      ) {
        continue;
      }

      const score = scoreNotice(cell, pageUrl);
      if (score > bestScore) {
        bestScore = score;
        bestTitle = cell;
      }
    }

    if (!bestTitle || bestScore < 3) continue;

    let noticeUrl = '';
    const hrefMatches = [...rowHtml.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi)];
    for (const hrefMatch of hrefMatches) {
      const rawHref = decodeHtml(hrefMatch[1]);
      if (isSkippableUrl(rawHref)) continue;

      try {
        const url = new URL(rawHref, pageUrl);
        if (!sameSite(url, baseUrl)) continue;
        noticeUrl = url.toString();
        break;
      } catch {
        continue;
      }
    }

    if (!noticeUrl) {
      noticeUrl = `${pageUrl.split('#')[0]}#${textKey(bestTitle) || `notice-${links.length + 1}`}`;
    }

    const rowText = cells.join(' ');
    links.push({
      name: bestTitle.substring(0, 220),
      url: noticeUrl,
      snippet: `Found on ${baseUrl.hostname} notice table`,
      date: parseDate(rowText),
      score: bestScore + 2,
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
  let baseUrl = normalizeWebsite(university.website);
  if (!baseUrl) return [];
  if (
    university.name.toLowerCase().includes('gaya college') ||
    baseUrl.hostname.includes('gayacollege.org')
  ) {
    baseUrl = new URL('https://gayacollege.ac.in/');
  }
  if (
    university.name.toLowerCase().includes('an college patna') ||
    baseUrl.hostname.includes('ancollegepatna.org') ||
    baseUrl.hostname.includes('ancpatna.com')
  ) {
    baseUrl = new URL('https://www.ancpatna.ac.in/');
  }
  if (
    university.name.toLowerCase().includes('magadh university') &&
    !university.name.toLowerCase().includes('gaya college')
  ) {
    baseUrl = new URL('https://www.magadhonline.in/');
  }
  if (
    university.name.toLowerCase() === 'nalanda university' ||
    baseUrl.hostname.includes('nalandauniversity.edu.in')
  ) {
    baseUrl = new URL('https://nalandauniv.edu.in/');
  }
  if (
    university.name.toLowerCase().includes('purnia university') ||
    university.name.toLowerCase().includes('purnea university') ||
    baseUrl.hostname.includes('purniauniversity.ac.in') ||
    baseUrl.hostname.includes('purneau.ac.in')
  ) {
    baseUrl = new URL('https://purneau.ac.in/');
  }
  if (
    university.shortName.toLowerCase() === 'aupat' ||
    university.name.toLowerCase().includes('amity university patna') ||
    baseUrl.hostname.includes('patna.amity.edu') ||
    (baseUrl.hostname.includes('amity.edu') && baseUrl.pathname.toLowerCase().startsWith('/bihar'))
  ) {
    baseUrl = new URL('https://patna.amity.edu/');
  }
  if (
    university.shortName.toLowerCase() === 'basu' ||
    university.name.toLowerCase().includes('bihar animal sciences university') ||
    baseUrl.hostname.includes('basu.in') ||
    baseUrl.hostname.includes('basu.org.in')
  ) {
    baseUrl = new URL('https://basu.org.in/');
  }

  const maxResults = options.maxResults ?? 5;
  const pageLimit = options.pageLimit ?? 10;
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

  if (baseUrl.hostname.includes('purneau.ac.in')) {
    return scrapePurneaWebsite({ maxResults, timeoutMs });
  }

  if (baseUrl.hostname.includes('patna.amity.edu')) {
    return scrapeAmityPatnaWebsite({ maxResults, timeoutMs });
  }

  if (baseUrl.hostname.includes('basu.org.in')) {
    return scrapeBasuWebsite({ maxResults, timeoutMs });
  }

  if (baseUrl.hostname.includes('beu-bih.ac.in')) {
    return scrapeBeuWebsite({ maxResults, timeoutMs });
  }

  const scrapeBaseUrl = baseUrl.hostname === 'tmbu.ac.in'
    ? new URL('https://www.tmbuniv.ac.in/public/')
    : baseUrl;
  const knownPages = candidateUrls(scrapeBaseUrl);
  const pages: string[] = [];
  const queuedPages = new Set<string>();
  let knownPageIndex = 0;
  const byUrl = new Map<string, RankedLink>();

  const enqueuePages = (urls: string[]) => {
    for (const url of urls) {
      if (pages.length >= pageLimit) return;
      const key = url.split('#')[0];
      if (queuedPages.has(key)) continue;
      queuedPages.add(key);
      pages.push(key);
    }
  };

  const enqueueNextKnownPage = () => {
    while (knownPageIndex < knownPages.length && pages.length < pageLimit) {
      const before = pages.length;
      enqueuePages([knownPages[knownPageIndex]]);
      knownPageIndex++;
      if (pages.length > before) break;
    }
  };

  enqueueNextKnownPage();

  const processPage = async (page: string): Promise<RankedSectionUrl[]> => {
    const html = await fetchHtml(page, timeoutMs);
    if (!html) return [];

    for (const link of extractLinks(html, page, scrapeBaseUrl)) {
      const key = link.url.split('#')[0];
      const existing = byUrl.get(key);
      if (!existing || link.score > existing.score) {
        byUrl.set(key, link);
      }
    }

    for (const link of extractStructuredRows(html, page, scrapeBaseUrl)) {
      const key = link.url.split('#')[0];
      const existing = byUrl.get(key);
      if (!existing || link.score > existing.score) {
        byUrl.set(key, link);
      }
    }

    return extractSectionUrls(html, page, scrapeBaseUrl);
  };

  const firstPage = pages[0];
  if (firstPage) {
    enqueuePages((await processPage(firstPage)).map((section) => section.url));
  }

  while (pages.length < pageLimit) {
    const before = pages.length;
    enqueueNextKnownPage();
    if (pages.length === before) break;
  }

  let pageIndex = 1;
  while (pageIndex < pages.length && pageIndex < pageLimit) {
    const chunk = pages.slice(pageIndex, Math.min(pageIndex + PAGE_FETCH_CONCURRENCY, pages.length, pageLimit));
    pageIndex += chunk.length;
    const discoveredGroups = await Promise.all(chunk.map((page) => processPage(page)));

    for (const discovered of discoveredGroups) {
      enqueuePages(discovered.map((section) => section.url));
    }

    while (pages.length < pageLimit && pageIndex >= pages.length) {
      const before = pages.length;
      enqueueNextKnownPage();
      if (pages.length === before) break;
    }
  }

  return [...byUrl.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ score: _score, ...item }) => item);
}
