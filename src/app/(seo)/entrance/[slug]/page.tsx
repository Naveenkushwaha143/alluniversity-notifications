import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EXAM_DETAILS } from '@/lib/entrance-exam-details';
import { db } from '@/lib/db';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, pageFaqs, slugify, truncateSeo } from '@/lib/seo-pages';
import { RefreshExamNotifications } from '@/components/refresh-exam-notifications';

type EntranceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function getExam(slug: string) {
  return Object.entries(EXAM_DETAILS).find(([name]) => slugify(name) === slug);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function entranceSearchTerms(name: string, fullName: string) {
  const skip = new Set([
    'exam', 'examination', 'entrance', 'test', 'common', 'national', 'state',
    'main', 'advanced', 'undergraduate', 'postgraduate', 'joint',
  ]);
  const words = `${name} ${fullName}`
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.toLowerCase())
    .filter((word) => word.length > 2 && !skip.has(word));

  return Array.from(new Set(words));
}

async function getRelatedEntranceNotifications(name: string, fullName: string) {
  const terms = entranceSearchTerms(name, fullName);
  const notifications = await db.examNotification.findMany({
    where: { examType: 'NTA', isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  }).catch(() => []);

  return notifications.filter((notification) => {
    const haystack = `${notification.examName} ${notification.title} ${notification.description || ''} ${notification.boardName || ''}`.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  }).slice(0, 8);
}

export async function generateMetadata({ params }: EntranceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const exam = getExam(slug);
  if (!exam) return { title: 'Entrance Exam Not Found' };

  const [name, detail] = exam;
  const title = `${name} 2026 - Eligibility, Syllabus, Admit Card, Result`;
  const description = truncateSeo(`${detail.fullName} 2026 eligibility, exam pattern, syllabus, application fee, important dates, admit card, result and official links.`);

  return {
    title,
    description,
    alternates: { canonical: `/entrance/${slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/entrance/${slug}`),
      type: 'article',
      images: [{ url: '/logo.svg', alt: `${name} entrance exam update` }],
    },
  };
}

export default async function EntranceDetailPage({ params }: EntranceDetailPageProps) {
  const { slug } = await params;
  const exam = getExam(slug);
  if (!exam) notFound();

  const [name, detail] = exam;
  const relatedNotifications = await getRelatedEntranceNotifications(name, detail.fullName);
  const faqs = pageFaqs(`${name} 2026`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name,
    description: detail.fullName,
    provider: {
      '@type': 'Organization',
      name: detail.conductingBody,
    },
    url: absoluteUrl(`/entrance/${slug}`),
  };

  return (
    <article className="px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, buildBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Entrance Exams', url: '/entrance' }, { name, url: `/entrance/${slug}` }]), buildFaqSchema(faqs)]) }} />
      <div className="mx-auto max-w-4xl">
        <nav className="mb-6 flex items-center justify-between gap-3 text-xs">
          <Link href="/entrance" className="text-cyan-300 hover:text-cyan-200">Entrance Exams</Link>
          <Link href="/" className="text-white/45 hover:text-white">Home</Link>
        </nav>

        <header className="border-b border-white/10 pb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">{detail.conductingBody}</span>
            <span>Entrance Exam 2026</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{name} 2026</h1>
          <p className="mt-4 text-base leading-7 text-white/58">{detail.fullName}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {detail.officialLinks[0] && (
              <a href={detail.officialLinks[0].url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-slate-950 hover:bg-cyan-200">
                Open Official Website
              </a>
            )}
            <Link href="/entrance" className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
              Back to Entrance List
            </Link>
          </div>
        </header>

        <RefreshExamNotifications
          type="NTA"
          title={`${name} latest notifications refresh`}
          description="Entrance exam websites se naye registration, admit card aur result notifications check karein."
        />

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-white/35">Conducting Body</p>
            <h2 className="mt-1 text-base font-semibold">{detail.conductingBody}</h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-white/35">Application Fee</p>
            <h2 className="mt-1 text-sm font-semibold leading-6">{detail.applicationFee}</h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-white/35">Official Links</p>
            <h2 className="mt-1 text-base font-semibold">{detail.officialLinks.length}</h2>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Related Entrance Notifications</h2>
          <div className="mt-4 grid gap-3">
            {relatedNotifications.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/50">
                Is exam se related latest notification abhi database me nahi hai. Refresh Latest se official sources check kar sakte hain.
              </div>
            ) : (
              relatedNotifications.map((notification) => (
                <a
                  key={notification.id}
                  href={notification.sourceUrl || detail.officialLinks[0]?.url || '#'}
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
              ))
            )}
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold">Eligibility Criteria</h2>
          <ul className="grid gap-3">
            {detail.eligibility.map((item) => (
              <li key={item} className="rounded-lg border border-emerald-300/10 bg-emerald-300/5 p-4 text-sm leading-6 text-white/65">{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-xl font-bold">Exam Pattern</h2>
            <p className="mt-3 text-sm leading-7 text-white/58">{detail.examPattern}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-xl font-bold">Important Dates</h2>
            <div className="mt-3 space-y-2">
              {detail.importantDates.map((date) => (
                <p key={date.event} className="text-sm leading-6 text-white/58"><span className="font-semibold text-white/78">{date.event}:</span> {date.timing}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Syllabus</h2>
          <div className="mt-4 grid gap-3">
            {detail.syllabus.map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-white/58">{item}</div>
            ))}
          </div>
        </section>

        {detail.tips.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold">Student Tips</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {detail.tips.map((tip) => (
                <div key={tip} className="rounded-lg border border-yellow-300/10 bg-yellow-300/5 p-4 text-sm leading-6 text-white/58">{tip}</div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Official Links</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {detail.officialLinks.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-300 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-200">
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
