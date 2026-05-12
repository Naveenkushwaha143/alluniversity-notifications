import Link from 'next/link';
import type { Metadata } from 'next';
import { EXAM_DETAILS } from '@/lib/entrance-exam-details';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, pageFaqs, slugify } from '@/lib/seo-pages';

export const metadata: Metadata = {
  title: 'Entrance Exam 2026 - Admit Card, Result, Registration, Official Links',
  description:
    'Entrance exam 2026 updates for JEE Main, NEET, CUET, UGC NET, state CETs, admit cards, results, application forms and official websites.',
  alternates: { canonical: '/entrance' },
  openGraph: {
    title: 'Entrance Exam 2026 - Official Links and Updates',
    description: 'Check entrance exam registration, admit card, result, syllabus and official website links.',
    url: absoluteUrl('/entrance'),
    type: 'website',
  },
};

type EntrancePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function getExamStream(name: string, detail: (typeof EXAM_DETAILS)[string]) {
  const text = `${name} ${detail.fullName} ${detail.eligibility.join(' ')} ${detail.syllabus.join(' ')}`.toLowerCase();
  if (text.includes('medical') || text.includes('neet') || text.includes('nursing') || text.includes('pharmacy')) return 'Medical';
  if (text.includes('engineering') || text.includes('jee') || text.includes('polytechnic') || text.includes('technology')) return 'Engineering';
  if (text.includes('law') || text.includes('llb') || text.includes('clat')) return 'Law';
  if (text.includes('management') || text.includes('mba') || text.includes('cat') || text.includes('xat')) return 'Management';
  if (text.includes('teacher') || text.includes('bed') || text.includes('education')) return 'Teaching';
  if (text.includes('design') || text.includes('fashion') || text.includes('architecture')) return 'Design';
  return 'General';
}

export default async function EntranceSeoPage({ searchParams }: EntrancePageProps) {
  const params = await searchParams || {};
  const selectedBody = getParam(params, 'body');
  const selectedStream = getParam(params, 'stream');
  const query = getParam(params, 'q').trim().toLowerCase();
  const allExams = Object.entries(EXAM_DETAILS).slice(0, 80);
  const bodies = Array.from(new Set(allExams.map(([, detail]) => detail.conductingBody))).sort((a, b) => a.localeCompare(b));
  const streams = Array.from(new Set(allExams.map(([name, detail]) => getExamStream(name, detail)))).sort((a, b) => a.localeCompare(b));
  const exams = allExams.filter(([name, detail]) => {
    const stream = getExamStream(name, detail);
    const examText = `${name} ${detail.fullName} ${detail.conductingBody} ${stream} ${detail.eligibility.join(' ')} ${detail.syllabus.join(' ')} ${detail.relatedExams.join(' ')}`.toLowerCase();
    const matchesQuery = !query || examText.includes(query);
    const matchesBody = !selectedBody || detail.conductingBody === selectedBody;
    const matchesStream = !selectedStream || stream === selectedStream;
    return matchesQuery && matchesBody && matchesStream;
  });
  const faqs = pageFaqs('Entrance exam 2026');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Entrance Exam 2026',
    description: metadata.description,
    url: absoluteUrl('/entrance'),
    mainEntity: exams.slice(0, 40).map(([name, detail]) => ({
      '@type': 'EducationalOccupationalProgram',
      name,
      description: detail.fullName,
      provider: {
        '@type': 'Organization',
        name: detail.conductingBody,
      },
      url: detail.officialLinks[0]?.url,
    })),
  };

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, buildBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Entrance Exam 2026', url: '/entrance' }]), buildFaqSchema(faqs)]) }} />
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 border-b border-white/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">Entrance updates</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Entrance Exam 2026 Admit Card, Result & Official Links
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/58">
            JEE Main, NEET, CUET, UGC NET and state entrance exam registration, admit card, result, syllabus and official website links.
          </p>
        </header>

        <div className="mb-7 flex items-center gap-2 overflow-x-auto pb-1">
          <Link href="/entrance" className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${!selectedStream ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/55 hover:bg-white/10'}`}>
            All ({allExams.length})
          </Link>
          {streams.map((stream) => (
            <Link key={stream} href={`/entrance?stream=${encodeURIComponent(stream)}`} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedStream === stream ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/55 hover:bg-white/10'}`}>
              {stream} ({allExams.filter(([name, detail]) => getExamStream(name, detail) === stream).length})
            </Link>
          ))}
        </div>

        <form method="get" className="mb-8 rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/10 sm:p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_188px_220px_auto]">
            <label className="grid gap-1">
              <span className="sr-only">Search exam</span>
              <input
                name="q"
                defaultValue={getParam(params, 'q')}
                placeholder="JEE, NEET, CUET, Law..."
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/50"
              />
            </label>
            <label className="grid gap-1">
              <span className="sr-only">Stream</span>
              <select
                name="stream"
                defaultValue={selectedStream}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                <option value="">All streams</option>
                {streams.map((stream) => (
                  <option key={stream} value={stream}>{stream}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="sr-only">Conducting body</span>
              <select
                name="body"
                defaultValue={selectedBody}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                <option value="">All bodies</option>
                {bodies.map((body) => (
                  <option key={body} value={body}>{body}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="h-11 rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-200">
                Filter
              </button>
              <a href="/entrance" className="inline-flex h-11 items-center rounded-xl border border-white/10 px-3 text-sm font-semibold text-white/65 hover:bg-white/10">
                Clear
              </a>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/40">{exams.length} entrance exams found</p>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {exams.map(([name, detail]) => (
            <Link
              href={`/entrance/${slugify(name)}`}
              key={name}
              className="group flex aspect-square flex-col justify-between rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-cyan-950/30"
            >
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">
                    {detail.conductingBody}
                  </span>
                </div>
                <h2 className="text-lg font-semibold leading-6 text-white transition group-hover:text-cyan-100">{name} 2026</h2>
                <p className="mt-2 line-clamp-4 text-sm leading-6 text-white/50">{detail.fullName}</p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {detail.importantDates.slice(0, 1).map((date) => (
                    <span key={`${name}-${date.event}`} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/45">
                      <span className="font-semibold text-white/65">{date.event}:</span> {date.timing}
                    </span>
                  ))}
                </div>
                <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-cyan-300 px-3 text-xs font-bold text-slate-950">
                  Open Details
                </span>
              </div>
            </Link>
          ))}
        </section>

        {exams.length === 0 && (
          <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-white/65">
            No entrance exam matched this filter. Clear filters or try another exam keyword.
          </div>
        )}

        <section className="mt-10 border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold">Entrance Exam FAQs</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
