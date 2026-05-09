import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { siteConfig } from '@/lib/seo';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, noticeFaqs, parseNoticeId, truncateSeo, universitySlug } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

type NoticePageProps = {
  params: Promise<{ slug: string }>;
};

async function getNotice(slug: string) {
  return db.notice.findUnique({
    where: { id: parseNoticeId(slug) },
    include: { university: true },
  });
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

export async function generateMetadata({ params }: NoticePageProps): Promise<Metadata> {
  const { slug } = await params;
  const notice = await getNotice(slug).catch(() => null);
  if (!notice) return { title: 'Notice Not Found' };

  const title = `${notice.title} - ${notice.university.shortName} Notice 2026`;
  const description = truncateSeo(
    notice.description ||
      `${notice.university.name} ${notice.category} notice 2026. Check official notice link, result, admit card, exam date and student update details.`,
  );

  return {
    title,
    description,
    alternates: { canonical: `/notices/${slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/notices/${slug}`),
      type: 'article',
      publishedTime: notice.datePublished.toISOString(),
      modifiedTime: notice.updatedAt.toISOString(),
      images: [{ url: '/logo.svg', alt: `${notice.university.shortName} notice update` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo.svg'],
    },
  };
}

export default async function NoticeDetailPage({ params }: NoticePageProps) {
  const { slug } = await params;
  const notice = await getNotice(slug).catch(() => null);
  if (!notice) notFound();

  const sourceUrl = notice.sourceUrl || notice.university.website;
  const faqs = noticeFaqs(notice.university.name, notice.title);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: notice.title,
    description: notice.description || notice.title,
    datePublished: notice.datePublished.toISOString(),
    dateModified: notice.updatedAt.toISOString(),
    mainEntityOfPage: absoluteUrl(`/notices/${slug}`),
    image: [`${siteConfig.url}/logo.svg`],
    author: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.svg`,
      },
    },
    about: {
      '@type': 'CollegeOrUniversity',
      name: notice.university.name,
      url: notice.university.website,
    },
  };

  return (
    <article className="px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([articleSchema, buildBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Notices', url: '/notices' }, { name: notice.title, url: `/notices/${slug}` }]), buildFaqSchema(faqs)]) }} />
      <div className="mx-auto max-w-4xl">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/40">
          <Link href="/notices" className="text-cyan-300 hover:text-cyan-200">Notices</Link>
          <span>/</span>
          <Link href={`/universities/${universitySlug(notice.university)}`} className="text-cyan-300 hover:text-cyan-200">
            {notice.university.shortName}
          </Link>
        </nav>

        <header className="border-b border-white/10 pb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">{notice.category}</span>
            <span>{notice.university.name}</span>
            <span>{formatDate(notice.datePublished)}</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{notice.title}</h1>
          <p className="mt-4 text-base leading-7 text-white/58">
            {notice.description || `${notice.university.name} latest official notice for students. Check the direct official source link before applying or downloading any document.`}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-slate-950 hover:bg-cyan-200"
            >
              Click Here for Official Notice/Result
            </a>
            <a
              href={notice.university.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
            >
              {notice.university.shortName} Official Website
            </a>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-white/35">University</p>
            <h2 className="mt-1 text-base font-semibold">{notice.university.name}</h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-white/35">State</p>
            <h2 className="mt-1 text-base font-semibold">{notice.university.state}</h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-white/35">Category</p>
            <h2 className="mt-1 text-base font-semibold">{notice.category}</h2>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-bold">How to check this official update</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-white/58">
            <li>Open the official notice/result button given above.</li>
            <li>Verify the title, date, roll number or application details on the university website.</li>
            <li>Download the PDF, admit card, result or date sheet only from the official source.</li>
          </ol>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-bold">Official Link</h2>
          <p className="text-sm leading-6 text-white/58">
            Source: <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-cyan-300 underline underline-offset-2">{sourceUrl}</a>
          </p>
        </section>

        <section className="mt-10 border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold">FAQs</h2>
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
