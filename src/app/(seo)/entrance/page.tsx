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

export default function EntranceSeoPage() {
  const exams = Object.entries(EXAM_DETAILS).slice(0, 80);
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

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map(([name, detail]) => (
            <article id={slugify(name)} key={name} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">
                  {detail.conductingBody}
                </span>
              </div>
              <h2 className="text-lg font-semibold leading-6">{name} 2026</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/50">{detail.fullName}</p>
              <div className="mt-4 space-y-2">
                {detail.importantDates.slice(0, 2).map((date) => (
                  <p key={`${name}-${date.event}`} className="text-xs text-white/40">
                    <span className="font-semibold text-white/65">{date.event}:</span> {date.timing}
                  </p>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.officialLinks.slice(0, 2).map((link) => (
                  <a
                    key={`${name}-${link.label}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-cyan-300 px-3 text-xs font-bold text-slate-950 hover:bg-cyan-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </section>

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
