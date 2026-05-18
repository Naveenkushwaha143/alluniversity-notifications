import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, pageFaqs, universitySlug } from '@/lib/seo-pages';

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

type UniversitiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default async function UniversitiesPage({ searchParams }: UniversitiesPageProps) {
  const params = await searchParams || {};
  const selectedState = getParam(params, 'state');
  const selectedType = getParam(params, 'type');
  const query = getParam(params, 'q').trim().toLowerCase();
  const allUniversities = await db.university.findMany({
    where: { isActive: true },
    include: { _count: { select: { notices: true } } },
    orderBy: [{ state: 'asc' }, { district: 'asc' }, { name: 'asc' }],
    take: 300,
  }).catch((error) => {
    console.error('Error loading universities SEO page:', error);
    return [];
  });
  const states = Array.from(new Set(allUniversities.map((university) => university.state))).sort((a, b) => a.localeCompare(b));
  const types = Array.from(new Set(allUniversities.map((university) => university.type))).sort((a, b) => a.localeCompare(b));
  const universities = allUniversities.filter((university) => {
    const universityText = `${university.name} ${university.shortName} ${university.state} ${university.district || ''} ${university.type} ${university.description || ''}`.toLowerCase();
    const matchesQuery = !query || universityText.includes(query);
    const matchesState = !selectedState || university.state === selectedState;
    const matchesType = !selectedType || university.type === selectedType;
    return matchesQuery && matchesState && matchesType;
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

        <div className="mb-7 flex items-center gap-2 overflow-x-auto pb-1">
          <Link href="/universities" className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${!selectedState ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/55 hover:bg-white/10'}`}>
            All ({allUniversities.length})
          </Link>
          {states.map((state) => (
            <Link key={state} href={`/universities?state=${encodeURIComponent(state)}`} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedState === state ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/55 hover:bg-white/10'}`}>
              {state} ({allUniversities.filter((university) => university.state === state).length})
            </Link>
          ))}
        </div>

        <form method="get" className="mb-8 rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/10 sm:p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_188px_188px_auto]">
            <label className="grid gap-1">
              <span className="sr-only">Search university</span>
              <input
                name="q"
                defaultValue={getParam(params, 'q')}
                placeholder="AKTU, Bihar, medical..."
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
              <span className="sr-only">Type</span>
              <select
                name="type"
                defaultValue={selectedType}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                <option value="">All types</option>
                {types.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="h-11 rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-200">
                Filter
              </button>
              <a href="/universities" className="inline-flex h-11 items-center rounded-xl border border-white/10 px-3 text-sm font-semibold text-white/65 hover:bg-white/10">
                Clear
              </a>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/40">{universities.length} universities found</p>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((university) => (
            <article key={university.id} className="group relative cursor-pointer rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-300/50 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-cyan-950/20">
              <Link
                href={`/universities/${universitySlug(university)}`}
                className="absolute inset-0 z-10 rounded-lg"
                aria-label={`Open ${university.name} result and notices`}
              />
              <div className="pointer-events-none relative z-20 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/5 text-sm font-bold text-cyan-200 transition group-hover:border-cyan-300/40 group-hover:bg-cyan-300/10 group-hover:text-white">
                  {university.logo && (university.logo.startsWith('/') || university.logo.startsWith('http')) ? (
                    <img src={university.logo} alt={`${university.name} notice board`} className="h-full w-full object-contain" />
                  ) : (
                    university.shortName.slice(0, 3)
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-6 text-white transition group-hover:text-cyan-200">
                    {university.name} Result & Notices 2026
                  </h2>
                  <p className="mt-1 text-xs text-white/35 transition group-hover:text-white/65">
                    {university.state}{university.district ? `, ${university.district}` : ''} - {university._count.notices} notices
                  </p>
                </div>
              </div>
              <div className="relative z-20 mt-4 flex gap-2">
                <span
                  className="pointer-events-none inline-flex h-9 flex-1 items-center justify-center rounded-md bg-cyan-300 px-3 text-xs font-bold text-slate-950 transition group-hover:bg-cyan-200"
                >
                  View Updates
                </span>
                <a
                  href={university.website}
                  target="_blank"
                  rel="noreferrer"
                  className="relative z-30 inline-flex h-9 items-center justify-center rounded-md border border-white/10 px-3 text-xs font-semibold text-white/65 transition hover:bg-white/10 hover:text-white"
                >
                  Official
                </a>
              </div>
            </article>
          ))}
        </section>

        {universities.length === 0 && (
          <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-white/65">
            No university matched this filter. Clear filters or search another state/name.
          </div>
        )}

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
