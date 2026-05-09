import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, importantStates, pageFaqs, stateSlug, universitySlug } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'University Result & Notices 2026 - Bihar, UP, Haryana, Delhi',
  description:
    'Find university result, admit card, admission, exam date and latest notice pages for Bihar, Uttar Pradesh, Haryana, Delhi and other Indian universities.',
  alternates: { canonical: '/universities' },
  openGraph: {
    title: 'University Result & Notices 2026 - All University',
    description: 'Programmatic university pages with latest notices, results, admit cards and official website links.',
    url: absoluteUrl('/universities'),
    type: 'website',
  },
};

export default async function UniversitiesPage() {
  const universities = await db.university.findMany({
    where: { isActive: true },
    include: { _count: { select: { notices: true } } },
    orderBy: [{ state: 'asc' }, { district: 'asc' }, { name: 'asc' }],
    take: 300,
  }).catch((error) => {
    console.error('Error loading universities SEO page:', error);
    return [];
  });

  const faqs = pageFaqs('University result and notices 2026');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'University Result & Notices 2026',
    description: metadata.description,
    url: absoluteUrl('/universities'),
    mainEntity: universities.slice(0, 100).map((university) => ({
      '@type': 'CollegeOrUniversity',
      name: university.name,
      alternateName: university.shortName,
      url: university.website,
      address: {
        '@type': 'PostalAddress',
        addressRegion: university.state,
        addressLocality: university.district || university.state,
        addressCountry: 'IN',
      },
    })),
  };

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, buildBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'University Result & Notices 2026', url: '/universities' }]), buildFaqSchema(faqs)]) }} />
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 border-b border-white/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">University directory</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            University Result & Notices 2026
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/58">
            State wise university pages for latest results, admit cards, admission forms, exam dates and official notice links.
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-bold">Browse by State</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {importantStates.map((state) => (
              <Link
                key={state}
                href={`/states/${stateSlug(state)}`}
                className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
              >
                {state} University Notices
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((university) => (
            <article key={university.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/5 text-sm font-bold text-cyan-200">
                  {university.logo && (university.logo.startsWith('/') || university.logo.startsWith('http')) ? (
                    <img src={university.logo} alt={`${university.name} notice board`} className="h-full w-full object-contain" />
                  ) : (
                    university.shortName.slice(0, 3)
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-6">
                    <Link href={`/universities/${universitySlug(university)}`} className="hover:text-cyan-200">
                      {university.name} Result & Notices 2026
                    </Link>
                  </h2>
                  <p className="mt-1 text-xs text-white/35">
                    {university.state}{university.district ? `, ${university.district}` : ''} - {university._count.notices} notices
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/universities/${universitySlug(university)}`}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-cyan-300 px-3 text-xs font-bold text-slate-950 hover:bg-cyan-200"
                >
                  View Updates
                </Link>
                <a
                  href={university.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 px-3 text-xs font-semibold text-white/65 hover:bg-white/10 hover:text-white"
                >
                  Official
                </a>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold">University Result FAQs</h2>
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
