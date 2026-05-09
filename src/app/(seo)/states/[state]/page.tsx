import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, importantStates, noticeSlug, pageFaqs, stateSlug, stateUniversityFaqs, universitySlug } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

type StatePageProps = {
  params: Promise<{ state: string }>;
};

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

export default async function StateUniversityPage({ params }: StatePageProps) {
  const { state: stateParam } = await params;
  const state = await resolveState(stateParam);
  if (!state) notFound();

  const [universities, notices] = await Promise.all([
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
