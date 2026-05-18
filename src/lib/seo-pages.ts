import { siteConfig } from '@/lib/seo';

export type FaqItem = {
  question: string;
  answer: string;
};

export const importantStates = ['Bihar', 'Uttar Pradesh', 'Haryana', 'Delhi'];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export function truncateSeo(value: string, maxLength = 155) {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}...`;
}

export function noticeSlug(notice: { id: string; title: string }) {
  return `${notice.id}-${slugify(notice.title) || 'notice'}`;
}

export function parseNoticeId(slug: string) {
  return slug.split('-')[0];
}

export function universitySlug(university: { shortName: string; name: string }) {
  return slugify(university.shortName || university.name);
}

export function stateSlug(state: string) {
  return slugify(state);
}

export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}

export function buildFaqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function universityFaqs(universityName: string): FaqItem[] {
  return [
    {
      question: `When will the ${universityName} result be released?`,
      answer: `${universityName} results are published on the official university website. All University regularly updates latest notices with direct official links.`,
    },
    {
      question: `How can I download the ${universityName} admit card?`,
      answer: `Open the official link, select the exam or student section, and enter your roll number or registration number to download the admit card.`,
    },
    {
      question: `Where can I find the latest ${universityName} notices?`,
      answer: `Latest notices are listed on this page with the original university source link for each notice.`,
    },
  ];
}

export function stateUniversityFaqs(state: string, universityName?: string): FaqItem[] {
  const target = universityName || `${state} universities`;
  const stateGuides: Record<string, FaqItem[]> = {
    Bihar: [
      {
        question: `How can I check the ${target} result?`,
        answer: `Bihar university results are usually published in the Examination, Result, Student Corner, or Notice Board section. Keep your roll number, registration number, and course details ready, then verify the result from the official university link.`,
      },
      {
        question: `What is required to download the ${target} admit card?`,
        answer: `You may need your registration number, roll number, date of birth, or login password. After downloading, carefully check the exam date, centre, subject, and student details.`,
      },
      {
        question: `Where can I find Bihar university admission forms and merit lists?`,
        answer: `Admission forms, merit lists, and counselling notices are available on the official university website under Admission, UG/PG Admission, or Latest Notice. Confirm deadlines and document lists from the official notice.`,
      },
      {
        question: `How can I avoid missing Bihar university notices?`,
        answer: `Bookmark your university page and regularly check the latest result, admit card, exam date, practical, migration, fee, and admission notices.`,
      },
    ],
    'Uttar Pradesh': [
      {
        question: `How can I check the ${target} result and marksheet?`,
        answer: `UP universities publish results on the official result portal, examination portal, or student login. Enter course, semester or year, roll number, and captcha details to verify the marksheet.`,
      },
      {
        question: `Where can I find the ${target} date sheet and exam scheme?`,
        answer: `Date sheets, exam schemes, and centre lists are available on the official website under Examination, Circular, Notice, or Student Corner. Check the same page again for revised schedules.`,
      },
      {
        question: `What should I do if the UP university admit card is not downloading?`,
        answer: `First recheck your registration details on the official portal. If the admit card is not visible yet, wait for a university notice, college login update, or examination branch update.`,
      },
      {
        question: `How can I verify UP university admission, counselling, and fee notices?`,
        answer: `Verify admission and counselling notices only from the official university website or authorised admission portal. Before paying fees, match the notice number, date, course, and official domain.`,
      },
    ],
    Delhi: [
      {
        question: `How can I check ${target} admission updates?`,
        answer: `Delhi university admission updates are published on the official admission portal, university website, and department notice board. Confirm CUET, merit list, counselling, and document verification dates from the official link.`,
      },
      {
        question: `Where are ${target} results and exam notices published?`,
        answer: `Results, exam forms, date sheets, and admit card notices are published under Examination, Academics, Student Portal, or Latest Notices. Keep your enrollment number ready for login-based results.`,
      },
      {
        question: `How should Delhi university students identify official links?`,
        answer: `Official links are usually on the university main domain or an authorised admission or exam portal. Verify the notice title and date on the official website instead of relying on screenshots or forwarded PDFs.`,
      },
      {
        question: `What should be ready for Delhi university document verification?`,
        answer: `Keep marksheets, admit card, ID proof, category certificate, migration or transfer certificate, photo, and admission form receipt ready. Always match the exact list with the official admission notice.`,
      },
    ],
    Haryana: [
      {
        question: `How can I check ${target} result and reappear notices?`,
        answer: `Haryana universities publish result, reappear, improvement, and exam notices in the official Examination, Result, or Student Portal section. Verify results with roll number and registration details.`,
      },
      {
        question: `Where can I find the ${target} admit card and date sheet?`,
        answer: `Admit cards, date sheets, practical schedules, and centre lists are available on the university official website notice board. Follow the revised date sheet whenever it is released.`,
      },
      {
        question: `How can I confirm Haryana university admission and counselling notices?`,
        answer: `Confirm admission, merit list, counselling, and fee notices from the official university website or Haryana admission portal. Carefully check course eligibility, fee deadlines, and document lists.`,
      },
      {
        question: `What should I check while downloading a Haryana university official notice?`,
        answer: `Check the notice title, date, department, course, semester, and PDF source URL. For important notices, you may also confirm with the college or university examination branch.`,
      },
    ],
  };

  return stateGuides[state] || [
    {
      question: `How can I check the latest ${target} results and notices?`,
      answer: `Latest updates are published in the Result, Examination, Admission, and Notice Board sections of the official university website. All University lists student updates with direct official links.`,
    },
    {
      question: `How can I verify the official ${target} link?`,
      answer: `Open the official link and check the domain, notice title, date, course, and PDF details. Always base final decisions on the notice available on the official university website.`,
    },
  ];
}

export function noticeFaqs(universityName: string, noticeTitle: string): FaqItem[] {
  return [
    {
      question: `How can I check the official notice for ${noticeTitle}?`,
      answer: `Open the official link button on the page and verify the details on the ${universityName} website.`,
    },
    {
      question: `Is the ${universityName} notice information official?`,
      answer: `All University collects notice links from public sources. Students should verify final details on the official university website.`,
    },
  ];
}

export function pageFaqs(topic: string): FaqItem[] {
  return [
    {
      question: `How can I check the latest ${topic} updates?`,
      answer: `Latest updates are shown date-wise on this page. Open important notices and verify details from the official website link.`,
    },
    {
      question: `Where can I find the official ${topic} link?`,
      answer: `Every university, board, exam, or notice card includes an official website or source link.`,
    },
  ];
}
