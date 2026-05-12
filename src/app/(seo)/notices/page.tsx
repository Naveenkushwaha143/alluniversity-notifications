import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, noticeSlug, pageFaqs, truncateSeo } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Latest University Notices 2026 - Results, Admit Card, Admission Updates',
  description:
    'Latest university notices 2026 for results, admit cards, exam dates, date sheets, admission forms and official student updates with direct source links.',
  alternates: { canonical: '/notices' },
  openGraph: {
    title: 'Latest University Notices 2026 - All University',
    description: 'Latest result, admit card, exam date and admission notices from Indian universities.',
    url: absoluteUrl('/notices'),
    type: 'website',
  },
};

type NoticesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

export default async function NoticesPage({ searchParams }: NoticesPageProps) {
  const params = await searchParams || {};
  const selectedState = getParam(params, 'state');
  const selectedCategory = getParam(params, 'category');
  const query = getParam(params, 'q').trim().toLowerCase();
  const allNotices = await db.notice.findMany({
    include: {
      university: {
        select: {
          name: true,
          shortName: true,
          state: true,
          district: true,
          logo: true,
          website: true,
        },
      },
    },
    orderBy: { datePublished: 'desc' },
    take: 200,
  }).catch((error) => {
    console.error('Error loading notices SEO page:', error);
    return [];
  });
  const states = Array.from(new Set(allNotices.map((notice) => notice.university.state))).sort((a, b) => a.localeCompare(b));
  const categories = Array.from(new Set(allNotices.map((notice) => notice.category))).sort((a, b) => a.localeCompare(b));
  const notices = allNotices.filter((notice) => {
    const noticeText = `${notice.title} ${notice.description || ''} ${notice.category} ${notice.university.name} ${notice.university.shortName} ${notice.university.state}`.toLowerCase();
    const matchesQuery = !query || noticeText.includes(query);
    const matchesState = !selectedState || notice.university.state === selectedState;
    const matchesCategory = !selectedCategory || notice.category === selectedCategory;
    return matchesQuery && matchesState && matchesCategory;
  }).slice(0, 60);

  const faqs = pageFaqs('University notices 2026');
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Latest University Notices 2026',
    description: metadata.description,
    url: absoluteUrl('/notices'),
    mainEntity: notices.slice(0, 20).map((notice) => ({
      '@type': 'Article',
      headline: notice.title,
      datePublished: notice.datePublished.toISOString(),
      url: absoluteUrl(`/notices/${noticeSlug(notice)}`),
      publisher: {
        '@type': 'Organization',
        name: notice.university.name,
      },
    })),
  };

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([collectionSchema, buildBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Latest University Notices 2026', url: '/notices' }]), buildFaqSchema(faqs)]) }} />
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 border-b border-white/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">Student notices</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Latest University Notices 2026
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/58">
            Result, admit card, exam date, date sheet, admission form and scholarship notices from official university sources.
          </p>
        </header>

        <div className="mb-8 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
          <h2 className="text-base font-semibold text-white">Official notice links</h2>
          <p className="mt-2 text-sm leading-6 text-white/58">
            Open any notice below and use the official source button at the top. Students should always verify final dates on the university website.
          </p>
        </div>

        <div className="mb-7 flex items-center gap-2 overflow-x-auto pb-1">
          <Link href="/notices" className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${!selectedState ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/55 hover:bg-white/10'}`}>
            All ({allNotices.length})
          </Link>
          {states.map((state) => (
            <Link key={state} href={`/notices?state=${encodeURIComponent(state)}`} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedState === state ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/55 hover:bg-white/10'}`}>
              {state} ({allNotices.filter((notice) => notice.university.state === state).length})
            </Link>
          ))}
        </div>

        <form method="get" className="mb-8 rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/10 sm:p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_188px_188px_auto]">
            <label className="grid gap-1">
              <span className="sr-only">Search notice</span>
              <input
                name="q"
                defaultValue={getParam(params, 'q')}
                placeholder="result, admit card, admission..."
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/50"
              />
            </label>
            <label className="grid gap-1">
              <span className="sr-only">State</span>
              <select
                name="state"
                defaultValue={selectedState}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                <option value="">All states</option>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="sr-only">Category</span>
              <select
                name="category"
                defaultValue={selectedCategory}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="h-11 rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-200">
                Filter
              </button>
              <a href="/notices" className="inline-flex h-11 items-center rounded-xl border border-white/10 px-3 text-sm font-semibold text-white/65 hover:bg-white/10">
                Clear
              </a>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/40">{notices.length} notices shown</p>
        </form>

        <div className="grid gap-4">
          {notices.map((notice) => (
            <article key={notice.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-cyan-200/80">{notice.category}</span>
                    <span>{notice.university.shortName}</span>
                    <span>{notice.university.state}</span>
                    <span>{formatDate(notice.datePublished)}</span>
                  </div>
                  <h2 className="text-lg font-semibold leading-6 text-white">
                    <Link href={`/notices/${noticeSlug(notice)}`} className="hover:text-cyan-200">
                      {notice.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    {truncateSeo(notice.description || `${notice.university.name} latest notice, result, admit card or admission update.`, 180)}
                  </p>
                </div>
                <Link
                  href={`/notices/${noticeSlug(notice)}`}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
                >
                  View Official Link
                </Link>
              </div>
            </article>
          ))}
        </div>

        {notices.length === 0 && (
          <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-white/65">
            No notices found for this filter. Clear filters or try another keyword.
          </div>
        )}

        <section className="mt-10 border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold">University Notice FAQs</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold text-white">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
