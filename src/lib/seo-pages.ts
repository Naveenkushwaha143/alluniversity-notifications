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
      question: `${universityName} result kab aayega?`,
      answer: `${universityName} result official university website par publish hota hai. All University par latest notices aur direct official links regular update kiye jaate hain.`,
    },
    {
      question: `${universityName} admit card kaise download karein?`,
      answer: `Admit card download karne ke liye official link open karein, exam or student section select karein, aur apna roll number ya registration number enter karein.`,
    },
    {
      question: `${universityName} latest notices kahan milenge?`,
      answer: `Latest notices is page par list hote hain. Har notice ke saath original university source link diya jaata hai.`,
    },
  ];
}

export function stateUniversityFaqs(state: string, universityName?: string): FaqItem[] {
  const target = universityName || `${state} universities`;
  const stateGuides: Record<string, FaqItem[]> = {
    Bihar: [
      {
        question: `${target} ka result kaise check karein?`,
        answer: `Bihar ke universities me result aksar Examination, Result, Student Corner ya Notice Board section me publish hota hai. Apna roll number, registration number aur course details ready rakhein, phir official university link se result verify karein.`,
      },
      {
        question: `${target} admit card download karne ke liye kya chahiye?`,
        answer: `Admit card download ke liye registration number, roll number, date of birth ya login password ki zarurat ho sakti hai. Download karne ke baad exam date, centre, subject aur student details carefully check karein.`,
      },
      {
        question: `Bihar university admission form aur merit list kahan milegi?`,
        answer: `Admission form, merit list aur counselling notices university ki official website ke Admission, UG/PG Admission ya Latest Notice section me milte hain. Last date aur document list official notice se hi confirm karein.`,
      },
      {
        question: `Bihar university notice miss na ho iske liye kya karein?`,
        answer: `Apni university page ko bookmark karein aur result, admit card, exam date, practical, migration, fee aur admission category ke latest notices regularly check karein.`,
      },
    ],
    'Uttar Pradesh': [
      {
        question: `${target} result aur marksheet kaise check karein?`,
        answer: `UP universities result ko official result portal, examination portal ya student login par publish karti hain. Course, semester/year, roll number aur captcha details bhar kar marksheet verify karein.`,
      },
      {
        question: `${target} date sheet aur exam scheme kahan milegi?`,
        answer: `Date sheet, exam scheme aur centre list official website ke Examination, Circular, Notice ya Student Corner section me milti hai. Revised schedule ke liye same page ko dobara check karna zaruri hai.`,
      },
      {
        question: `UP university admit card download nahi ho raha to kya karein?`,
        answer: `Sabse pehle official portal par registration details dobara check karein. Agar admit card abhi show nahi ho raha hai to university notice, college login ya examination branch update ka wait karein.`,
      },
      {
        question: `UP university admission, counselling aur fee notice kaise verify karein?`,
        answer: `Admission aur counselling notice sirf official university website ya authorised admission portal se verify karein. Fee payment se pehle notice number, date, course aur official domain zarur match karein.`,
      },
    ],
    Delhi: [
      {
        question: `${target} admission update kaise check karein?`,
        answer: `Delhi universities me admission updates official admission portal, university website aur department notice board par aate hain. CUET, merit list, counselling aur document verification dates official link se confirm karein.`,
      },
      {
        question: `${target} result aur exam notice kahan publish hota hai?`,
        answer: `Result, exam form, date sheet aur admit card notices Examination, Academics, Student Portal ya Latest Notices section me publish hote hain. Login-based result ke liye enrollment number ready rakhein.`,
      },
      {
        question: `Delhi university students ko official link kaise identify karna chahiye?`,
        answer: `Official link usually university ke main domain ya authorised admission/exam portal par hota hai. Social media screenshots ya forwarded PDFs ke bajay official website par notice title aur date verify karein.`,
      },
      {
        question: `Delhi university document verification ke liye kya ready rakhein?`,
        answer: `Marksheet, admit card, ID proof, category certificate, migration/transfer certificate, photo aur admission form receipt ready rakhein. Exact list hamesha official admission notice se match karein.`,
      },
    ],
    Haryana: [
      {
        question: `${target} result aur reappear notice kaise check karein?`,
        answer: `Haryana universities result, reappear, improvement aur exam notices official Examination, Result ya Student Portal section me publish karti hain. Roll number aur registration details se result verify karein.`,
      },
      {
        question: `${target} admit card aur date sheet kahan milegi?`,
        answer: `Admit card, date sheet, practical schedule aur centre list university ke official website notice board par milti hai. Revised date sheet aane par old schedule follow na karein.`,
      },
      {
        question: `Haryana university admission aur counselling notice kaise confirm karein?`,
        answer: `Admission, merit list, counselling aur fee notices official university website ya Haryana admission portal se confirm karein. Course eligibility, fee deadline aur document list carefully check karein.`,
      },
      {
        question: `Haryana university official notice download karte waqt kya check karein?`,
        answer: `Notice ka title, date, department, course, semester aur PDF source URL check karein. Important notices ke liye college/university examination branch se bhi confirmation le sakte hain.`,
      },
    ],
  };

  return stateGuides[state] || [
    {
      question: `${target} latest result aur notices kaise check karein?`,
      answer: `Official university website ke Result, Examination, Admission aur Notice Board section me latest updates publish hote hain. All University par direct official links ke saath student updates list kiye jaate hain.`,
    },
    {
      question: `${target} official link kaise verify karein?`,
      answer: `Official link open karke domain, notice title, date, course aur PDF details check karein. Final decision hamesha university ki official website ke notice par based rakhein.`,
    },
  ];
}

export function noticeFaqs(universityName: string, noticeTitle: string): FaqItem[] {
  return [
    {
      question: `${noticeTitle} official notice kaise check karein?`,
      answer: `Official notice check karne ke liye page par diye gaye official link button ko open karein aur ${universityName} ki website par details verify karein.`,
    },
    {
      question: `Kya ${universityName} notice information official hai?`,
      answer: `All University public sources se notice links collect karta hai. Students ko final confirmation ke liye official university website par notice verify karna chahiye.`,
    },
  ];
}

export function pageFaqs(topic: string): FaqItem[] {
  return [
    {
      question: `${topic} latest update kaise check karein?`,
      answer: `Is page par latest updates date wise show hote hain. Important notice open karke official website link se details verify karein.`,
    },
    {
      question: `${topic} official link kahan milega?`,
      answer: `Har university, board, exam ya notice card me official website or source link diya gaya hai.`,
    },
  ];
}
