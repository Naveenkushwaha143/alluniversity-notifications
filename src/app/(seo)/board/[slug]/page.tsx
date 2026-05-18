import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { boardPages, boardSlug, resolveBoardSlug } from '@/lib/board-pages';
import { db } from '@/lib/db';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, pageFaqs, truncateSeo } from '@/lib/seo-pages';
import { RefreshExamNotifications } from '@/components/refresh-exam-notifications';

type BoardDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function getBoard(slug: string) {
  const resolvedSlug = resolveBoardSlug(slug);
  return boardPages.find((board) => boardSlug(board) === resolvedSlug);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function boardSearchTerms(board: { name: string; state: string }) {
  const words = board.name
    .replace(/\([^)]*\)/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word.length > 2 && !['board', 'exam', 'exams'].includes(word.toLowerCase()));

  return Array.from(new Set([...words, board.state].map((term) => term.toLowerCase())));
}

async function getRelatedBoardNotifications(board: { name: string; state: string }) {
  const terms = boardSearchTerms(board);
  const notifications = await db.examNotification.findMany({
    where: { examType: 'BOARD', isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  }).catch(() => []);

  return notifications.filter((notification) => {
    const haystack = `${notification.examName} ${notification.boardName || ''} ${notification.title} ${notification.description || ''} ${notification.state || ''}`.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  }).slice(0, 8);
}

export async function generateMetadata({ params }: BoardDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const board = getBoard(slug);
  if (!board) return { title: 'Board Not Found' };

  const title = `${board.name} 2026 - Result, Admit Card, Date Sheet`;
  const description = truncateSeo(`${board.name} 2026 result, admit card, date sheet, official notifications and student help for ${board.exams}.`);

  return {
    title,
    description,
    alternates: { canonical: `/board/${slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/board/${slug}`),
      type: 'article',
      images: [{ url: '/logo.svg', alt: `${board.name} notice board` }],
    },
  };
}

export default async function BoardDetailPage({ params }: BoardDetailPageProps) {
  const { slug } = await params;
  const board = getBoard(slug);
  if (!board) notFound();

  const relatedNotifications = await getRelatedBoardNotifications(board);
  const faqs = pageFaqs(`${board.name} result and date sheet 2026`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: board.name,
    url: board.website,
    areaServed: board.state,
  };

  return (
    <article className="px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, buildBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Board Exams', url: '/board' }, { name: board.name, url: `/board/${slug}` }]), buildFaqSchema(faqs)]) }} />
      <div className="mx-auto max-w-4xl">
        <nav className="mb-6 flex items-center justify-between gap-3 text-xs">
          <Link href="/board" className="text-cyan-300 hover:text-cyan-200">Board Exams</Link>
          <Link href="/" className="text-white/45 hover:text-white">Home</Link>
        </nav>

        <header className="border-b border-white/10 pb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">{board.state}</span>
            <span>{board.exams}</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{board.name} 2026</h1>
          <p className="mt-4 text-base leading-7 text-white/58">{board.keyword}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={board.website} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-slate-950 hover:bg-cyan-200">
              Open Official Website
            </a>
            <Link href="/board" className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
              Back to Board List
            </Link>
          </div>
        </header>

        <RefreshExamNotifications
          type="BOARD"
          title={`${board.name} latest notifications refresh`}
          description="Check official board websites for new result, admit card, and date sheet notifications."
        />

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-white/35">State</p>
            <h2 className="mt-1 text-base font-semibold">{board.state}</h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-white/35">Exams</p>
            <h2 className="mt-1 text-base font-semibold">{board.exams}</h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-white/35">Notifications</p>
            <h2 className="mt-1 text-base font-semibold">{board.notifications.length}</h2>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Latest Board Notifications</h2>
          {relatedNotifications.length > 0 && (
            <div className="mt-4 grid gap-3">
              {relatedNotifications.map((notification) => (
                <a
                  key={notification.id}
                  href={notification.sourceUrl || board.website}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-cyan-300/10 bg-cyan-300/5 p-4 text-sm leading-6 text-white/65 transition hover:border-cyan-300/25 hover:bg-cyan-300/10"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">{notification.category}</span>
                    <span>{formatDate(notification.createdAt)}</span>
                  </div>
                  <h3 className="font-semibold text-white/85">{notification.title}</h3>
                  {notification.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">{notification.description}</p>
                  )}
                </a>
              ))}
            </div>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {board.notifications.map((notice) => (
              <a key={notice} href={board.website} target="_blank" rel="noreferrer" className="rounded-lg border border-amber-300/10 bg-amber-300/5 p-4 text-sm leading-6 text-white/65 hover:border-amber-300/25 hover:bg-amber-300/10">
                {notice}
              </a>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-xl font-bold">Result</h2>
            <p className="mt-3 text-sm leading-7 text-white/58">Verify the roll number, school code, and result date on the official board result portal.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-xl font-bold">Admit Card</h2>
            <p className="mt-3 text-sm leading-7 text-white/58">Check the student name, subject list, exam centre, and reporting time carefully before the exam.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-xl font-bold">Date Sheet</h2>
            <p className="mt-3 text-sm leading-7 text-white/58">Always follow the latest revised timetable from the official board website.</p>
          </div>
        </section>

        <section className="mt-10 border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold">Student FAQs</h2>
          <div className="mt-4 grid gap-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
