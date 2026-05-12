import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, importantStates, noticeSlug, pageFaqs, stateSlug, stateUniversityFaqs, universitySlug } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

type StatePageProps = {
  params: Promise<{ state: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

async function resolveState(slug: string) {
  const dbStates = await db.university.groupBy({
    by: ['state'],
    where: { isActive: true },
  }).catch(() => []);

  const states = Array.from(new Set([...importantStates, ...dbStates.map((item) => item.state)]));
  return states.find((state) => stateSlug(state) === slug);
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: stateParam } = await params;
  const state = await resolveState(stateParam);
  if (!state) return { title: 'State Not Found' };

  const title = `${state} University Result & Notices 2026`;
  const description = `${state} university result 2026, admit card, admission form, exam date, date sheet and latest official notices for students.`;

  return {
    title,
    description,
    alternates: { canonical: `/states/${stateSlug(state)}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/states/${stateSlug(state)}`),
      type: 'website',
    },
  };
}

export default async function StateUniversityPage({ params, searchParams }: StatePageProps) {
  const { state: stateParam } = await params;
  const queryParams = await searchParams || {};
  const state = await resolveState(stateParam);
  if (!state) notFound();
  const selectedDistrict = getParam(queryParams, 'district');
  const selectedType = getParam(queryParams, 'type');
  const selectedCategory = getParam(queryParams, 'category');
  const query = getParam(queryParams, 'q').trim().toLowerCase();

  const [allUniversities, allNotices] = await Promise.all([
    db.university.findMany({
      where: { isActive: true, state },
      include: { _count: { select: { notices: true } } },
      orderBy: [{ district: 'asc' }, { name: 'asc' }],
      take: 200,
    }),
    db.notice.findMany({
      where: { university: { state } },
      include: { university: { select: { name: true, shortName: true } } },
      orderBy: { datePublished: 'desc' },
      take: 30,
    }),
  ]).catch((error) => {
    console.error('Error loading state SEO page:', error);
    return [[], []] as const;
  });
  const districts = Array.from(new Set(allUniversities.map((university) => university.district || state))).sort((a, b) => a.localeCompare(b));
  const types = Array.from(new Set(allUniversities.map((university) => university.type))).sort((a, b) => a.localeCompare(b));
  const categories = Array.from(new Set(allNotices.map((notice) => notice.category))).sort((a, b) => a.localeCompare(b));
  const universities = allUniversities.filter((university) => {
    const universityText = `${university.name} ${university.shortName} ${university.district || ''} ${university.type} ${university.description || ''}`.toLowerCase();
    const matchesQuery = !query || universityText.includes(query);
    const matchesDistrict = !selectedDistrict || (university.district || state) === selectedDistrict;
    const matchesType = !selectedType || university.type === selectedType;
    return matchesQuery && matchesDistrict && matchesType;
  });
  const notices = allNotices.filter((notice) => {
    const noticeText = `${notice.title} ${notice.category} ${notice.university.name} ${notice.university.shortName}`.toLowerCase();
    const matchesQuery = !query || noticeText.includes(query);
    const matchesCategory = !selectedCategory || notice.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const faqs = [...stateUniversityFaqs(state), ...pageFaqs(`${state} university result and notices 2026`)];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${state} University Result & Notices 2026`,
    url: absoluteUrl(`/states/${stateSlug(state)}`),
    mainEntity: universities.map((university) => ({
      '@type': 'CollegeOrUniversity',
      name: university.name,
      alternateName: university.shortName,
      url: university.website,
    })),
  };

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, buildBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Universities', url: '/universities' }, { name: `${state} University Notices`, url: `/states/${stateSlug(state)}` }]), buildFaqSchema(faqs)]) }} />
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 border-b border-white/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">State updates</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            {state} University Result & Notices 2026
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/58">
            Latest result, admit card, admission, exam date and official notice links from {state} universities.
          </p>
        </header>

        <div className="mb-7 flex items-center gap-2 overflow-x-auto pb-1">
          <a href={`/states/${stateSlug(state)}`} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${!selectedDistrict ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/55 hover:bg-white/10'}`}>
            All ({allUniversities.length})
          </a>
          {districts.slice(0, 18).map((district) => (
            <a key={district} href={`/states/${stateSlug(state)}?district=${encodeURIComponent(district)}`} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedDistrict === district ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/55 hover:bg-white/10'}`}>
              {district} ({allUniversities.filter((university) => (university.district || state) === district).length})
            </a>
          ))}
        </div>

        <form method="get" className="mb-8 rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/10 sm:p-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_170px_170px_190px_auto]">
            <label className="grid gap-1">
              <span className="sr-only">Search in {state}</span>
              <input
                name="q"
                defaultValue={getParam(queryParams, 'q')}
                placeholder="university, result, admit card..."
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/50"
              />
            </label>
            <label className="grid gap-1">
              <span className="sr-only">District</span>
              <select
                name="district"
                defaultValue={selectedDistrict}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                <option value="">All districts</option>
                {districts.map((district) => (
                  <option key={district} value={district}>{district}</option>
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
            <label className="grid gap-1">
              <span className="sr-only">Notice category</span>
              <select
                name="category"
                defaultValue={selectedCategory}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                <option value="">All notices</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="h-11 rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-200">
                Filter
              </button>
              <a href={`/states/${stateSlug(state)}`} className="inline-flex h-11 items-center rounded-xl border border-white/10 px-3 text-sm font-semibold text-white/65 hover:bg-white/10">
                Clear
              </a>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/40">{universities.length} universities and {notices.length} notices found</p>
        </form>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <h2 className="text-xl font-bold">{state} Universities</h2>
            <div className="mt-4 grid gap-3">
              {universities.map((university) => (
                <article key={university.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <h3 className="text-base font-semibold">
                    <Link href={`/universities/${universitySlug(university)}`} className="hover:text-cyan-200">
                      {university.name} Result & Notices
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-white/35">
                    {university.district || state} - {university._count.notices} notices
                  </p>
                </article>
              ))}
              {universities.length === 0 && (
                <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-white/65">
                  No university found for this filter.
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold">Latest {state} University Notices</h2>
            <div className="mt-4 grid gap-3">
              {notices.map((notice) => (
                <article key={notice.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-cyan-200/80">{notice.category}</span>
                    <span>{notice.university.shortName}</span>
                  </div>
                  <h3 className="text-base font-semibold leading-6">
                    <Link href={`/notices/${noticeSlug(notice)}`} className="hover:text-cyan-200">{notice.title}</Link>
                  </h3>
                </article>
              ))}
              {notices.length === 0 && (
                <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-white/65">
                  No notice found for this filter.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold">{state} University Student FAQs</h2>
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
