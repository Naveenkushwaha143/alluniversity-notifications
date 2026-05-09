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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

export default async function NoticesPage() {
  const notices = await db.notice.findMany({
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
    take: 60,
  }).catch((error) => {
    console.error('Error loading notices SEO page:', error);
    return [];
  });

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
