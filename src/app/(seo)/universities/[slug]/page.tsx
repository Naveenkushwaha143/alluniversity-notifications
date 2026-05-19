import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, stateSlug, stateUniversityFaqs, truncateSeo, universityFaqs, universitySlug } from '@/lib/seo-pages';
import { UniversityNoticesClient } from './university-notices-client';

export const dynamic = 'force-dynamic';

type UniversityPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const UNIVERSITY_SLUG_ALIASES: Record<string, string> = {
  bbaub: 'brabu',
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

async function getUniversity(slug: string) {
  const universities = await db.university.findMany({
    where: { isActive: true },
    include: {
      notices: {
        orderBy: { datePublished: 'desc' },
        take: 25,
      },
      _count: { select: { notices: true } },
    },
    take: 500,
  });

  return universities.find((university) => universitySlug(university) === slug);
}

function officialWebsite(university: { name: string; website: string }) {
  if (
    university.name.toLowerCase().includes('gaya college') ||
    university.website.includes('gayacollege.org')
  ) {
    return 'https://gayacollege.ac.in';
  }
  return university.website;
}

export async function generateMetadata({ params }: UniversityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const university = await getUniversity(slug).catch(() => null);
  if (!university) return { title: 'University Not Found' };

  const title = `${university.name} Result & Notices 2026`;
  const description = truncateSeo(
    `${university.name} result 2026, admit card, exam date, admission notice, date sheet and official website updates. Check ${university.shortName} latest notices with direct links.`,
  );
  const ogImage = university.logo && (university.logo.startsWith('/') || university.logo.startsWith('http'))
    ? university.logo
    : '/logo.svg';

  return {
    title,
    description,
    alternates: { canonical: `/universities/${slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/universities/${slug}`),
      type: 'website',
      images: [{ url: ogImage, alt: `${university.name} notice board` }],
    },
  };
}

export default async function UniversityDetailPage({ params, searchParams }: UniversityPageProps) {
  const { slug } = await params;
  const aliasSlug = UNIVERSITY_SLUG_ALIASES[slug];
  if (aliasSlug) redirect(`/universities/${aliasSlug}`);

  const queryParams = await searchParams || {};
  const university = await getUniversity(slug).catch(() => null);
  if (!university) notFound();
  const noticeList = university.notices;
  const selectedCategory = getParam(queryParams, 'category');
  const query = getParam(queryParams, 'q').trim();

  const faqs = [...universityFaqs(university.name), ...stateUniversityFaqs(university.state, university.name)];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: university.name,
    alternateName: university.shortName,
    description: university.description || `${university.name} latest result, admit card, exam date and notices.`,
    url: officialWebsite(university),
    address: {
      '@type': 'PostalAddress',
      addressLocality: university.district || university.state,
      addressRegion: university.state,
      addressCountry: 'IN',
    },
    sameAs: [officialWebsite(university)],
  };

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, buildBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Universities', url: '/universities' }, { name: university.state, url: `/states/${stateSlug(university.state)}` }, { name: university.name, url: `/universities/${slug}` }]), buildFaqSchema(faqs)]) }} />
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/40">
          <Link href="/universities" className="text-cyan-300 hover:text-cyan-200">Universities</Link>
          <span>/</span>
          <Link href={`/states/${stateSlug(university.state)}`} className="text-cyan-300 hover:text-cyan-200">
            {university.state}
          </Link>
        </nav>

        <header className="border-b border-white/10 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5 text-lg font-bold text-cyan-200">
              {university.logo && (university.logo.startsWith('/') || university.logo.startsWith('http')) ? (
                <img src={university.logo} alt={`${university.name} notice board`} className="h-full w-full object-contain" />
              ) : (
                university.shortName.slice(0, 4)
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">{university.shortName} official updates</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                {university.name} Result & Notices 2026
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/58">
                {university.description || `Latest ${university.shortName} result, admit card, exam date, admission, date sheet and official notices for students.`}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href={officialWebsite(university)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-slate-950 hover:bg-cyan-200"
                >
                  Open Official Website
                </a>
                <Link
                  href="/notices"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                >
                  Latest University Notices
                </Link>
              </div>
            </div>
          </div>
        </header>

        <UniversityNoticesClient
          universityId={university.id}
          universityShortName={university.shortName}
          universityState={university.state}
          universityDistrict={university.district}
          initialNotices={noticeList}
          initialNoticeCount={university._count.notices}
          initialQuery={query}
          initialCategory={selectedCategory}
        />

        <section className="mt-10 border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold">{university.shortName} Student FAQs</h2>
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
    </section>
  );
}
