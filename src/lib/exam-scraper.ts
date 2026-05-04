import { db } from '@/lib/db';
import { scrapeUniversityWebsite } from '@/lib/website-scraper';

type ExamType = 'NTA' | 'BOARD';

type ExamScrapeTarget = {
  name: string;
  shortName: string;
  website: string;
  state: string;
  examType: ExamType;
  boardName?: string;
};

const EXAM_TARGETS: ExamScrapeTarget[] = [
  { name: 'National Testing Agency', shortName: 'NTA', website: 'https://nta.ac.in', state: 'National', examType: 'NTA' },
  { name: 'JEE Main', shortName: 'JEE', website: 'https://jeemain.nta.ac.in', state: 'National', examType: 'NTA' },
  { name: 'NEET UG', shortName: 'NEET', website: 'https://neet.nta.nic.in', state: 'National', examType: 'NTA' },
  { name: 'CUET UG', shortName: 'CUET', website: 'https://cuet.nta.nic.in', state: 'National', examType: 'NTA' },
  { name: 'UGC NET', shortName: 'UGC NET', website: 'https://ugcnet.nta.ac.in', state: 'National', examType: 'NTA' },
  { name: 'CBSE Board', shortName: 'CBSE', website: 'https://www.cbse.gov.in', state: 'National', examType: 'BOARD', boardName: 'CBSE Board' },
  { name: 'NIOS Board', shortName: 'NIOS', website: 'https://nios.ac.in', state: 'National', examType: 'BOARD', boardName: 'NIOS Board' },
  { name: 'Bihar Board', shortName: 'BSEB', website: 'https://biharboardonline.bihar.gov.in', state: 'Bihar', examType: 'BOARD', boardName: 'Bihar Board' },
  { name: 'Haryana Board', shortName: 'BSEH', website: 'https://bseh.org.in', state: 'Haryana', examType: 'BOARD', boardName: 'Haryana Board' },
  { name: 'UP Board', shortName: 'UPMSP', website: 'https://upmsp.edu.in', state: 'UP', examType: 'BOARD', boardName: 'UP Board' },
  { name: 'MP Board', shortName: 'MPBSE', website: 'https://mpbse.nic.in', state: 'MP', examType: 'BOARD', boardName: 'MP Board' },
  { name: 'Rajasthan Board', shortName: 'RBSE', website: 'https://rajeduboard.rajasthan.gov.in', state: 'Rajasthan', examType: 'BOARD', boardName: 'Rajasthan Board' },
  { name: 'Gujarat Board', shortName: 'GSEB', website: 'https://www.gseb.org', state: 'Gujarat', examType: 'BOARD', boardName: 'Gujarat Board' },
  { name: 'Maharashtra Board', shortName: 'MSBSHSE', website: 'https://mahahsscboard.in', state: 'Maharashtra', examType: 'BOARD', boardName: 'Maharashtra Board' },
  { name: 'Odisha Board', shortName: 'BSE Odisha', website: 'https://bseodisha.ac.in', state: 'Odisha', examType: 'BOARD', boardName: 'Odisha Board' },
  { name: 'Jharkhand Board', shortName: 'JAC', website: 'https://jac.jharkhand.gov.in', state: 'Jharkhand', examType: 'BOARD', boardName: 'Jharkhand Board' },
];

let targetCursor = 0;

function emitNotification(data: Record<string, unknown>) {
  fetch('http://127.0.0.1:3003/emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...data,
    }),
  }).catch(() => {});
}

function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('result') || t.includes('merit') || t.includes('marksheet') || t.includes('score')) return 'Result';
  if (t.includes('admit card') || t.includes('hall ticket')) return 'Exam';
  if (t.includes('exam') || t.includes('date sheet') || t.includes('schedule') || t.includes('timetable') || t.includes('answer key')) return 'Exam';
  if (t.includes('admission') || t.includes('registration') || t.includes('application') || t.includes('counselling')) return 'Admission';
  if (t.includes('fee') || t.includes('payment')) return 'Fee';
  if (t.includes('syllabus') || t.includes('pattern')) return 'Syllabus';
  return 'Notification';
}

function getTargets(type: string, limit: number): ExamScrapeTarget[] {
  const examType = type.toUpperCase();
  const filtered = EXAM_TARGETS.filter((target) => examType === 'ALL' || target.examType === examType);
  if (filtered.length <= limit) return filtered;

  const selected: ExamScrapeTarget[] = [];
  for (let i = 0; i < limit; i++) {
    selected.push(filtered[(targetCursor + i) % filtered.length]);
  }
  targetCursor = (targetCursor + limit) % filtered.length;
  return selected;
}

export async function scrapeAndStoreExamNotifications(
  type = 'ALL',
  options: { limit?: number; maxResultsPerTarget?: number } = {}
): Promise<{ newCount: number; targetsChecked: number }> {
  const targets = getTargets(type, options.limit ?? 6);
  const maxResults = options.maxResultsPerTarget ?? 3;
  let newCount = 0;

  for (const target of targets) {
    const results = await scrapeUniversityWebsite(
      {
        id: target.shortName,
        name: target.name,
        shortName: target.shortName,
        website: target.website,
        state: target.state,
      },
      {
        maxResults,
        pageLimit: 6,
        timeoutMs: 8000,
      }
    );

    for (const item of results) {
      const title = item.name || 'Exam notification';
      const existing = await db.examNotification.findFirst({
        where: {
          OR: [
            { sourceUrl: item.url },
            { title: { contains: title.substring(0, 35) } },
          ],
        },
      });
      if (existing) continue;

      const category = detectCategory(`${title} ${item.snippet || ''}`);
      const created = await db.examNotification.create({
        data: {
          title,
          description: item.snippet || null,
          sourceUrl: item.url || null,
          examName: target.name,
          examType: target.examType,
          boardName: target.boardName || null,
          state: target.state,
          category,
          isImportant: ['Exam', 'Result', 'Admission'].includes(category),
          isActive: true,
        },
      });

      emitNotification({
        title: `[${target.shortName}] ${created.title}`,
        message: created.description || '',
        source: target.boardName || target.name,
        category,
        state: target.state,
        url: created.sourceUrl,
        examId: created.id,
      });

      newCount++;
    }
  }

  return { newCount, targetsChecked: targets.length };
}
