import { slugify } from '@/lib/seo-pages';

export type BoardItem = {
  name: string;
  keyword: string;
  website: string;
  exams: string;
  state: string;
  notifications: string[];
};

export function boardSlug(board: { name: string }) {
  return slugify(board.name);
}

export const boardSlugAliases: Record<string, string> = {
  'cisce-icse-isc': 'cisce-board-icse-isc',
  'haryana-board-bseh': 'haryana-board-hbse-bseh',
  'delhi-board': 'delhi-board-education-department',
  'karnataka-board-kseeb': 'karnataka-board-kseab',
  'tamil-nadu-board-tnbse': 'tamil-nadu-board-dge-tndge',
  'west-bengal-board-wbbse': 'west-bengal-board-wbbse-wbchse',
  'kerala-board-dhse': 'kerala-board-pareeksha-bhavan-dhse',
  'telangana-board-bse': 'telangana-board-bse-tsbie',
  'ap-board-bieap': 'andhra-pradesh-board-bseap-bieap',
  'odisha-board-bse': 'odisha-board-bse-chse',
  'jammu-and-kashmir-board-jkbose': 'jkbose',
};

export function resolveBoardSlug(slug: string) {
  return boardSlugAliases[slug] || slug;
}

export const boardPages: BoardItem[] = [
  { name: 'CBSE Board', keyword: 'CBSE result, date sheet and admit card 2026', website: 'https://cbse.gov.in', exams: 'Class 10 and Class 12', state: 'National', notifications: ['CBSE date sheet notification', 'CBSE admit card update', 'CBSE class 10 and 12 result notice'] },
  { name: 'CISCE Board (ICSE/ISC)', keyword: 'ICSE ISC timetable, admit card and result 2026', website: 'https://cisce.org', exams: 'ICSE and ISC', state: 'National', notifications: ['ICSE timetable update', 'ISC result notification', 'CISCE exam instructions'] },
  { name: 'NIOS Board', keyword: 'NIOS admission, admit card and result 2026', website: 'https://nios.ac.in', exams: 'Secondary and Senior Secondary', state: 'National', notifications: ['NIOS admission notice', 'NIOS hall ticket update', 'NIOS result notification'] },
  { name: 'Bihar Board (BSEB)', keyword: 'BSEB Bihar Board 10th 12th result 2026', website: 'https://biharboardonline.bihar.gov.in', exams: 'Matric and Intermediate', state: 'Bihar', notifications: ['BSEB matric result update', 'Bihar Board inter admit card', 'Bihar Board compartment exam notice'] },
  { name: 'Bihar Open Board', keyword: 'Bihar open school 10th 12th admission, admit card and result 2026', website: 'https://bbos.bihar.gov.in', exams: 'Open School Class 10 and Class 12', state: 'Bihar', notifications: ['BBOSE admission form notice', 'Bihar Open Board admit card update', 'BBOSE result notification'] },
  { name: 'Bihar Sanskrit Board', keyword: 'Bihar Sanskrit board exam date sheet result and admit card 2026', website: 'https://bssbpatna.com', exams: 'Sanskrit 10th and 12th', state: 'Bihar', notifications: ['Sanskrit Board exam form notice', 'Bihar Sanskrit Board date sheet update', 'Sanskrit Board result notification'] },
  { name: 'Bihar Madrasa Board', keyword: 'Bihar Madrasa board Wastania Fauqania Munshi Moulvi result 2026', website: 'https://bsmeb.org', exams: 'Wastania, Fauqania, Munshi and Moulvi', state: 'Bihar', notifications: ['Madrasa Board exam schedule notice', 'Bihar Madrasa Board admit card update', 'Madrasa Board result notification'] },
  { name: 'UP Board (UPMSP)', keyword: 'UP Board result, date sheet and admit card 2026', website: 'https://upmsp.edu.in', exams: 'High School and Intermediate', state: 'Uttar Pradesh', notifications: ['UP Board date sheet notice', 'UPMSP admit card update', 'UP Board result notification'] },
  { name: 'UP Sanskrit Board', keyword: 'UP Sanskrit board exam date sheet admit card result 2026', website: 'https://upsanskritparishad.up.gov.in', exams: 'Sanskrit 10th and 12th', state: 'Uttar Pradesh', notifications: ['UP Sanskrit Board exam dates', 'UP Sanskrit Board admit card notice', 'UP Sanskrit Board result update'] },
  { name: 'Haryana Board (HBSE/BSEH)', keyword: 'HBSE Haryana Board result and date sheet 2026', website: 'https://bseh.org.in', exams: 'Class 10 and Class 12', state: 'Haryana', notifications: ['HBSE date sheet update', 'Haryana Board result notice', 'BSEH rechecking form notification'] },
  { name: 'Delhi Board / Education Department', keyword: 'Delhi board school exam result and notice 2026', website: 'https://edudel.nic.in', exams: 'Class 10 and Class 12', state: 'Delhi', notifications: ['Delhi school exam notice', 'Delhi result update', 'Delhi admit card instructions'] },
  { name: 'MP Board (MPBSE)', keyword: 'MP Board 10th 12th result and admit card 2026', website: 'https://mpbse.nic.in', exams: 'Class 10 and Class 12', state: 'Madhya Pradesh', notifications: ['MP Board time table', 'MPBSE admit card update', 'MP Board result notification'] },
  { name: 'Rajasthan Board (RBSE)', keyword: 'RBSE Rajasthan Board result and date sheet 2026', website: 'https://rajeduboard.rajasthan.gov.in', exams: 'Class 10 and Class 12', state: 'Rajasthan', notifications: ['RBSE date sheet update', 'Rajasthan Board result notice', 'RBSE supplementary exam notice'] },
  { name: 'Gujarat Board (GSEB)', keyword: 'GSEB SSC HSC result and time table 2026', website: 'https://gseb.org', exams: 'SSC and HSC', state: 'Gujarat', notifications: ['GSEB time table update', 'Gujarat Board hall ticket', 'GSEB result notification'] },
  { name: 'Maharashtra Board (MSBSHSE)', keyword: 'Maharashtra SSC HSC result and hall ticket 2026', website: 'https://mahahsscboard.in', exams: 'SSC and HSC', state: 'Maharashtra', notifications: ['Maharashtra Board timetable', 'SSC/HSC hall ticket update', 'MSBSHSE result notice'] },
  { name: 'Karnataka Board (KSEAB)', keyword: 'Karnataka SSLC PUC result and admit card 2026', website: 'https://kseab.karnataka.gov.in', exams: 'SSLC and PUC', state: 'Karnataka', notifications: ['Karnataka SSLC timetable', 'PUC result notification', 'KSEAB admit card update'] },
  { name: 'Tamil Nadu Board (DGE/TNDGE)', keyword: 'Tamil Nadu SSLC HSE result and hall ticket 2026', website: 'https://dge.tn.gov.in', exams: 'SSLC and HSE', state: 'Tamil Nadu', notifications: ['TN board timetable update', 'Tamil Nadu hall ticket', 'DGE result notification'] },
  { name: 'West Bengal Board (WBBSE/WBCHSE)', keyword: 'West Bengal Madhyamik HS result 2026', website: 'https://wbbse.wb.gov.in', exams: 'Madhyamik and HS', state: 'West Bengal', notifications: ['Madhyamik routine update', 'WBCHSE HS result notice', 'West Bengal admit card update'] },
  { name: 'Kerala Board (Pareeksha Bhavan/DHSE)', keyword: 'Kerala SSLC HSE result and timetable 2026', website: 'https://pareekshabhavan.kerala.gov.in', exams: 'SSLC and HSE', state: 'Kerala', notifications: ['Kerala SSLC result update', 'DHSE timetable notice', 'Kerala hall ticket notification'] },
  { name: 'Punjab Board (PSEB)', keyword: 'PSEB Punjab Board result and date sheet 2026', website: 'https://pseb.ac.in', exams: 'Class 10 and Class 12', state: 'Punjab', notifications: ['PSEB date sheet update', 'Punjab Board result notice', 'PSEB reappear exam notification'] },
  { name: 'Telangana Board (BSE/TSBIE)', keyword: 'Telangana SSC Inter result and hall ticket 2026', website: 'https://bse.telangana.gov.in', exams: 'SSC and Intermediate', state: 'Telangana', notifications: ['TS SSC hall ticket update', 'TSBIE result notice', 'Telangana exam timetable'] },
  { name: 'Andhra Pradesh Board (BSEAP/BIEAP)', keyword: 'AP SSC Inter result and hall ticket 2026', website: 'https://bse.ap.gov.in', exams: 'SSC and Intermediate', state: 'Andhra Pradesh', notifications: ['AP SSC result update', 'BIEAP hall ticket notice', 'AP board timetable'] },
  { name: 'Odisha Board (BSE/CHSE)', keyword: 'Odisha HSC CHSE result and admit card 2026', website: 'https://bseodisha.ac.in', exams: 'HSC and CHSE', state: 'Odisha', notifications: ['Odisha HSC result notice', 'CHSE timetable update', 'BSE Odisha admit card'] },
  { name: 'Jharkhand Board (JAC)', keyword: 'JAC Jharkhand Board result and date sheet 2026', website: 'https://jac.jharkhand.gov.in', exams: 'Class 10 and Class 12', state: 'Jharkhand', notifications: ['JAC date sheet update', 'Jharkhand Board result notice', 'JAC compartment notification'] },
  { name: 'Chhattisgarh Board (CGBSE)', keyword: 'CGBSE 10th 12th result and timetable 2026', website: 'https://cgbse.nic.in', exams: 'Class 10 and Class 12', state: 'Chhattisgarh', notifications: ['CGBSE timetable update', 'Chhattisgarh Board result notice', 'CGBSE admit card update'] },
  { name: 'Uttarakhand Board (UBSE)', keyword: 'Uttarakhand Board result and date sheet 2026', website: 'https://ubse.uk.gov.in', exams: 'Class 10 and Class 12', state: 'Uttarakhand', notifications: ['UBSE date sheet update', 'UK Board result notice', 'Uttarakhand admit card update'] },
  { name: 'Himachal Board (HPBOSE)', keyword: 'HPBOSE Himachal Board result and date sheet 2026', website: 'https://hpbose.org', exams: 'Class 10 and Class 12', state: 'Himachal Pradesh', notifications: ['HPBOSE date sheet update', 'Himachal Board result notice', 'HPBOSE revaluation form'] },
  { name: 'Assam Board (SEBA/AHSEC)', keyword: 'Assam HSLC HS result and routine 2026', website: 'https://sebaonline.org', exams: 'HSLC and HS', state: 'Assam', notifications: ['SEBA HSLC routine update', 'AHSEC result notice', 'Assam admit card update'] },
  { name: 'Goa Board (GBSHSE)', keyword: 'Goa Board SSC HSSC result and timetable 2026', website: 'https://gbshse.in', exams: 'SSC and HSSC', state: 'Goa', notifications: ['Goa board timetable update', 'GBSHSE hall ticket notice', 'Goa result notification'] },
  { name: 'Manipur Board (BOSEM/COHSEM)', keyword: 'Manipur HSLC HSE result and routine 2026', website: 'https://bosem.in', exams: 'HSLC and HSE', state: 'Manipur', notifications: ['Manipur HSLC routine', 'COHSEM result notice', 'Manipur admit card update'] },
  { name: 'Meghalaya Board (MBOSE)', keyword: 'MBOSE SSLC HSSLC result and routine 2026', website: 'https://mbose.in', exams: 'SSLC and HSSLC', state: 'Meghalaya', notifications: ['MBOSE routine update', 'Meghalaya result notice', 'MBOSE admit card update'] },
  { name: 'Mizoram Board (MBSE)', keyword: 'MBSE HSLC HSSLC result and routine 2026', website: 'https://mbse.edu.in', exams: 'HSLC and HSSLC', state: 'Mizoram', notifications: ['MBSE routine update', 'Mizoram result notice', 'MBSE admit card update'] },
  { name: 'Nagaland Board (NBSE)', keyword: 'NBSE HSLC HSSLC result and routine 2026', website: 'https://nbsenl.edu.in', exams: 'HSLC and HSSLC', state: 'Nagaland', notifications: ['NBSE routine update', 'Nagaland result notice', 'NBSE admit card update'] },
  { name: 'Tripura Board (TBSE)', keyword: 'TBSE Madhyamik HS result and routine 2026', website: 'https://tbse.tripura.gov.in', exams: 'Madhyamik and HS', state: 'Tripura', notifications: ['TBSE routine update', 'Tripura result notice', 'TBSE admit card update'] },
  { name: 'JKBOSE', keyword: 'Jammu Kashmir Board date sheet result admit card 2026', website: 'https://jkbose.nic.in', exams: 'Class 10 and Class 12', state: 'Jammu & Kashmir', notifications: ['JKBOSE date sheet update', 'JKBOSE result notice', 'JKBOSE admit card notification'] },
  { name: 'Arunachal Pradesh Board', keyword: 'Arunachal Pradesh Board exam result notice 2026', website: 'https://education.arunachal.gov.in', exams: 'Class 10 and Class 12', state: 'Arunachal Pradesh', notifications: ['Arunachal exam schedule', 'Arunachal result update', 'Arunachal admit card notice'] },
  { name: 'Sikkim Board', keyword: 'Sikkim Board exam result date sheet 2026', website: 'https://sikkim.gov.in', exams: 'Class 10 and Class 12', state: 'Sikkim', notifications: ['Sikkim exam notice', 'Sikkim result update', 'Sikkim admit card instructions'] },
  { name: 'Ladakh Board Updates', keyword: 'Ladakh school board exam result updates 2026', website: 'https://jkbose.nic.in', exams: 'Class 10 and Class 12', state: 'Ladakh', notifications: ['Ladakh date sheet update', 'Ladakh result notice', 'Ladakh board exam instructions'] },
];
