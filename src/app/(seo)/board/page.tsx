import type { Metadata } from 'next';
import { absoluteUrl, buildBreadcrumbSchema, buildFaqSchema, pageFaqs } from '@/lib/seo-pages';

export const metadata: Metadata = {
  title: 'Board Exam 2026 - Result, Date Sheet, Admit Card, Official Links',
  description:
    'Board exam 2026 updates for CBSE, Bihar Board, UP Board, Haryana Board and other state boards with result, date sheet, admit card and official links.',
  alternates: { canonical: '/board' },
  openGraph: {
    title: 'Board Exam 2026 - Result, Date Sheet and Admit Card',
    description: 'Check board result, date sheet, admit card and official board website links.',
    url: absoluteUrl('/board'),
    type: 'website',
  },
};

const boards = [
  {
    name: 'CBSE Board',
    keyword: 'CBSE result, date sheet and admit card 2026',
    website: 'https://cbse.gov.in',
    exams: 'Class 10 and Class 12',
    state: 'National',
  },
  {
    name: 'Bihar Board (BSEB)',
    keyword: 'BSEB Bihar Board 10th 12th result 2026',
    website: 'https://biharboardonline.bihar.gov.in',
    exams: 'Matric and Intermediate',
    state: 'Bihar',
  },
  {
    name: 'UP Board (UPMSP)',
    keyword: 'UP Board result, date sheet and admit card 2026',
    website: 'https://upmsp.edu.in',
    exams: 'High School and Intermediate',
    state: 'Uttar Pradesh',
  },
  {
    name: 'Haryana Board (HBSE/BSEH)',
    keyword: 'HBSE Haryana Board result and date sheet 2026',
    website: 'https://bseh.org.in',
    exams: 'Class 10 and Class 12',
    state: 'Haryana',
  },
  {
    name: 'NIOS Board',
    keyword: 'NIOS admission, admit card and result 2026',
    website: 'https://nios.ac.in',
    exams: 'Secondary and Senior Secondary',
    state: 'National',
  },
];

export default function BoardSeoPage() {
  const faqs = pageFaqs('Board exam result and date sheet 2026');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Board Exam 2026',
    description: metadata.description,
    url: absoluteUrl('/board'),
    mainEntity: boards.map((board) => ({
      '@type': 'EducationalOrganization',
      name: board.name,
      url: board.website,
      areaServed: board.state,
    })),
  };

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, buildBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Board Exam 2026', url: '/board' }]), buildFaqSchema(faqs)]) }} />
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 border-b border-white/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">Board updates</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Board Exam 2026 Result, Date Sheet & Admit Card
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/58">
            CBSE, Bihar Board, UP Board, Haryana Board and open school official links for results, admit cards, date sheets and marksheet updates.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <article key={board.name} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">{board.state}</span>
                <span>{board.exams}</span>
              </div>
              <h2 className="text-lg font-semibold leading-6">{board.name} 2026</h2>
              <p className="mt-2 text-sm leading-6 text-white/50">{board.keyword}</p>
              <a
                href={board.website}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-cyan-300 px-3 text-xs font-bold text-slate-950 hover:bg-cyan-200"
              >
                Official Website
              </a>
            </article>
          ))}
        </section>

        <section className="mt-10 border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold">Board Exam FAQs</h2>
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
