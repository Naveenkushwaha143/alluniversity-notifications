import { db } from '@/lib/db';

// Comprehensive university data for Bihar, Haryana, Delhi, Uttar Pradesh
const UNIVERSITIES: {
  name: string;
  shortName: string;
  website: string;
  state: string;
  district: string;
  type: string;
  description: string;
  logo: string;
  color: string;
}[] = [
  // ═══════════════════ BIHAR UNIVERSITIES ═══════════════════
  { name: "Patna University", shortName: "PU", website: "https://patnauniversity.ac.in", state: "Bihar", district: "Patna", type: "State", description: "Established in 1917, the seventh oldest university in India.", logo: "🏛️", color: "#ea580c" },
  { name: "Magadh University", shortName: "MU", website: "https://magadhuniversity.ac.in", state: "Bihar", district: "Gaya", type: "State", description: "A premier state university in Bodh Gaya serving southern Bihar.", logo: "📚", color: "#d97706" },
  { name: "Bihar University", shortName: "BRABU", website: "https://brabu.net", state: "Bihar", district: "Muzaffarpur", type: "State", description: "B.R. Ambedkar Bihar University in Muzaffarpur.", logo: "🎓", color: "#059669" },
  { name: "Lalit Narayan Mithila University", shortName: "LNMU", website: "https://lnmu.ac.in", state: "Bihar", district: "Darbhanga", type: "State", description: "A state university in Darbhanga for Mithila region.", logo: "📖", color: "#7c3aed" },
  { name: "Kameshwar Singh Darbhanga Sanskrit University", shortName: "KSDSU", website: "https://ksdsu.in", state: "Bihar", district: "Darbhanga", type: "State", description: "Sanskrit university dedicated to ancient Indian learning.", logo: "🕉️", color: "#dc2626" },
  { name: "Tilka Manjhi Bhagalpur University", shortName: "TMBU", website: "https://tmbu.ac.in", state: "Bihar", district: "Bhagalpur", type: "State", description: "State university in Bhagalpur serving eastern Bihar.", logo: "🏫", color: "#0891b2" },
  { name: "Veer Kunwar Singh University", shortName: "VKSU", website: "https://vksu.ac.in", state: "Bihar", district: "Arrah", type: "State", description: "State university in Ara serving Bhojpur region.", logo: "⚔️", color: "#b91c1c" },
  { name: "Jai Prakash University", shortName: "JPU", website: "https://jpu.ac.in", state: "Bihar", district: "Chapra", type: "State", description: "State university in Chapra, Saran district.", logo: "🏛️", color: "#65a30d" },
  { name: "Babasaheb Bhimrao Ambedkar Bihar University", shortName: "BBAUB", website: "https://bbrau.ac.in", state: "Bihar", district: "Muzaffarpur", type: "State", description: "State university in Muzaffarpur dedicated to Dr. Ambedkar's vision.", logo: "📖", color: "#2563eb" },
  { name: "Purnia University", shortName: "PURNIA", website: "https://purniauniversity.ac.in", state: "Bihar", district: "Purnia", type: "State", description: "State university serving Seemanchal region of Bihar.", logo: "🏫", color: "#9333ea" },
  { name: "Munger University", shortName: "MUNGER", website: "https://mungeruniversity.ac.in", state: "Bihar", district: "Munger", type: "State", description: "State university in Munger district.", logo: "🏛️", color: "#0d9488" },
  { name: "Nalanda University", shortName: "NALANDA", website: "https://nalandauniversity.edu.in", state: "Bihar", district: "Rajgir", type: "Central", description: "An international university inspired by the ancient Nalanda Mahavihara.", logo: "🏔️", color: "#c2410c" },
  { name: "Nalanda Open University", shortName: "NOU", website: "https://nalandaopenuniversity.com", state: "Bihar", district: "Patna", type: "State", description: "Open university offering distance education across Bihar.", logo: "📖", color: "#7c3aed" },
  { name: "Patliputra University", shortName: "PPU", website: "https://ppup.ac.in", state: "Bihar", district: "Patna", type: "State", description: "State university carved out of Patna University in 2018.", logo: "🏛️", color: "#0891b2" },
  { name: "Aryabhatta Knowledge University", shortName: "AKU", website: "https://akubihar.ac.in", state: "Bihar", district: "Patna", type: "State", description: "Technical and professional education university in Bihar.", logo: "🔧", color: "#2563eb" },
  { name: "Chandragupt Institute of Management Patna", shortName: "CIMP", website: "https://cimp.ac.in", state: "Bihar", district: "Patna", type: "State", description: "Management institute established by Govt. of Bihar.", logo: "💼", color: "#059669" },
  { name: "Dr. Rajendra Prasad Central Agricultural University", shortName: "RPCAU", website: "https://rpcau.ac.in", state: "Bihar", district: "Samastipur", type: "Central", description: "Central agricultural university in Pusa, Samastipur.", logo: "🌾", color: "#65a30d" },
  { name: "Indian Institute of Technology Patna", shortName: "IITP", website: "https://iitp.ac.in", state: "Bihar", district: "Patna", type: "Central", description: "Premier engineering institute - IIT Patna.", logo: "⚡", color: "#0369a1" },
  { name: "National Institute of Technology Patna", shortName: "NITP", website: "https://nitp.ac.in", state: "Bihar", district: "Patna", type: "Central", description: "NIT Patna - National Institute of Technology.", logo: "🔧", color: "#1d4ed8" },
  { name: "Indian Institute of Technology BHU Varanasi (Extension)", shortName: "IITBHU", website: "https://iitbhu.ac.in", state: "Bihar", district: "Patna", type: "Central", description: "IIT (BHU) Varanasi campus extension.", logo: "⚡", color: "#7c3aed" },
  { name: "All India Institute of Medical Sciences Patna", shortName: "AIIMS", website: "https://aiimspatna.edu.in", state: "Bihar", district: "Patna", type: "Central", description: "AIIMS Patna - premier medical institute.", logo: "🏥", color: "#dc2626" },
  { name: "Bihar National Law University", shortName: "BNLU", website: "https://bnlu.ac.in", state: "Bihar", district: "Patna", type: "State", description: "National law university in Patna.", logo: "⚖️", color: "#1e40af" },
  { name: "Bihar Animal Sciences University", shortName: "BASU", website: "https://basu.in", state: "Bihar", district: "Patna", type: "State", description: "Veterinary and animal sciences university.", logo: "🦁", color: "#65a30d" },
  { name: "Shree Narayan Yoga Vedanta University", shortName: "SNYVU", website: "https://snyvu.ac.in", state: "Bihar", district: "Patna", type: "State", description: "Dedicated to yoga and vedanta studies.", logo: "🧘", color: "#9333ea" },
  { name: "University of Patna Science & Technology", shortName: "PUST", website: "https://pust.ac.in", state: "Bihar", district: "Patna", type: "State", description: "Science and technology focused university.", logo: "🔬", color: "#0891b2" },
  { name: "Gaya College (Magadh University)", shortName: "GC", website: "https://gayacollege.org", state: "Bihar", district: "Gaya", type: "Constituent", description: "Premier constituent college of Magadh University.", logo: "🏫", color: "#b45309" },
  { name: "AN College Patna", shortName: "ANCOL", website: "https://ancollegepatna.org", state: "Bihar", district: "Patna", type: "Constituent", description: "A.N. College, a top constituent college of Patna University.", logo: "📚", color: "#0f766e" },
  { name: "Patna Science College", shortName: "PSC", website: "https://patnasciencecollege.ac.in", state: "Bihar", district: "Patna", type: "Constituent", description: "Premier science college under Patna University.", logo: "🔬", color: "#1d4ed8" },
  { name: "BN Mandal University", shortName: "BNMU", website: "https://bnmu.ac.in", state: "Bihar", district: "Madhepura", type: "State", description: "State university serving Kosi-Seemanchal region.", logo: "🏫", color: "#a21caf" },

  // ═══════════════════ HARYANA UNIVERSITIES ═══════════════════
  { name: "Maharshi Dayanand University", shortName: "MDU", website: "https://mdu.ac.in", state: "Haryana", district: "Rohtak", type: "State", description: "One of the premier state universities in Haryana, established 1976.", logo: "🏛️", color: "#dc2626" },
  { name: "Gurugram University", shortName: "GU", website: "https://gurugramuniversity.ac.in", state: "Haryana", district: "Gurugram", type: "State", description: "State university in Gurugram offering diverse programs.", logo: "🎓", color: "#059669" },
  { name: "Kurukshetra University", shortName: "KUK", website: "https://kuk.ac.in", state: "Haryana", district: "Kurukshetra", type: "State", description: "Named after the holy city of Kurukshetra, established 1956.", logo: "📜", color: "#b91c1c" },
  { name: "Chaudhary Charan Singh Haryana Agricultural University", shortName: "CCSHAU", website: "https://hau.ac.in", state: "Haryana", district: "Hisar", type: "State", description: "Premier agricultural university in Hisar.", logo: "🌾", color: "#65a30d" },
  { name: "Guru Jambheshwar University of Science & Technology", shortName: "GJU", website: "https://gju.ac.in", state: "Haryana", district: "Hisar", type: "State", description: "Technical university in Hisar focusing on science & technology.", logo: "🔬", color: "#0891b2" },
  { name: "Deenbandhu Chhotu Ram University of Science & Technology", shortName: "DCRUST", website: "https://dcrustm.ac.in", state: "Haryana", district: "Murthal", type: "State", description: "Technical university in Murthal, Sonipat.", logo: "⚙️", color: "#7c3aed" },
  { name: "Chaudhary Devi Lal University", shortName: "CDLU", website: "https://cdlu.ac.in", state: "Haryana", district: "Sirsa", type: "State", description: "State university in Sirsa.", logo: "🏫", color: "#0369a1" },
  { name: "Maharaja Agrasen University", shortName: "MAU", website: "https://maharajaagrasenuniversity.ac.in", state: "Haryana", district: "Baddi", type: "Private", description: "Private university in Baddi, Himachal Pradesh near Haryana border.", logo: "👑", color: "#d97706" },
  { name: "Manav Rachna International Institute of Research and Studies", shortName: "MRIIRS", website: "https://mriirs.edu", state: "Haryana", district: "Faridabad", type: "Deemed", description: "Deemed university in Faridabad with NAAC A++ grade.", logo: "🏫", color: "#059669" },
  { name: "Ashoka University", shortName: "ASHOKA", website: "https://ashoka.edu.in", state: "Haryana", district: "Sonipat", type: "Private", description: "Premier liberal arts and sciences private university.", logo: "🌳", color: "#0369a1" },
  { name: "OP Jindal Global University", shortName: "JGU", website: "https://jgu.edu.in", state: "Haryana", district: "Sonipat", type: "Private", description: "Top-ranked private university for law, policy, and international affairs.", logo: "⚖️", color: "#1e40af" },
  { name: "Lingaya's Vidyapeeth", shortName: "LVU", website: "https://lingayasuniversity.edu.in", state: "Haryana", district: "Faridabad", type: "Deemed", description: "Deemed university in Faridabad offering engineering and management.", logo: "📚", color: "#b91c1c" },
  { name: "Shri Vishwakarma Skill University", shortName: "SVSU", website: "https://svsu.ac.in", state: "Haryana", district: "Gurugram", type: "State", description: "India's first skill development university.", logo: "🔧", color: "#ea580c" },
  { name: "Haryana Vishwakarma Skill University", shortName: "HVSU", website: "https://hvsu.ac.in", state: "Haryana", district: "Gurugram", type: "State", description: "Skill-based university established by Haryana Govt.", logo: "🎯", color: "#dc2626" },
  { name: "National Institute of Technology Kurukshetra", shortName: "NITK", website: "https://nitkkr.ac.in", state: "Haryana", district: "Kurukshetra", type: "Central", description: "NIT Kurukshetra - National Institute of Technology.", logo: "⚡", color: "#1d4ed8" },
  { name: "Indian Institute of Technology (IIT) Delhi Extension", shortName: "IITDH", website: "https://iitd.ac.in", state: "Haryana", district: "Sonipat", type: "Central", description: "IIT Delhi's extension campus in Sonipat.", logo: "⚡", color: "#0369a1" },
  { name: "National Institute of Fashion Technology", shortName: "NIFTG", website: "https://nift.ac.in", state: "Haryana", district: "Gurugram", type: "Central", description: "NIFT Gurugram campus.", logo: "👗", color: "#c026d3" },
  { name: "YMCA University of Science & Technology", shortName: "YMCA", website: "https://ymcaust.ac.in", state: "Haryana", district: "Faridabad", type: "State", description: "State technical university in Faridabad.", logo: "🏫", color: "#0d9488" },
  { name: "SRM University Haryana", shortName: "SRMH", website: "https://srmharyana.ac.in", state: "Haryana", district: "Sonipat", type: "Private", description: "SRM University campus in Sonipat.", logo: "🏫", color: "#2563eb" },
  { name: "Bhagat Phool Singh Mahila Vishwavidyalaya", shortName: "BPSMV", website: "https://bpsmv.ac.in", state: "Haryana", district: "Khanpur Kalan", type: "State", description: "Women's university in Sonipat.", logo: "👩‍🎓", color: "#a21caf" },
  { name: "Pandit Bhagwat Dayal Sharma University of Health Sciences", shortName: "UHSR", website: "https://uhsr.ac.in", state: "Haryana", district: "Rohtak", type: "State", description: "Health sciences university in Rohtak.", logo: "🏥", color: "#dc2626" },
  { name: "Lala Lajpat Rai University of Veterinary & Animal Sciences", shortName: "LRUVAS", website: "https://luvas.in", state: "Haryana", district: "Hisar", type: "State", description: "Veterinary sciences university in Hisar.", logo: "🦁", color: "#65a30d" },

  // ═══════════════════ DELHI UNIVERSITIES ═══════════════════
  { name: "University of Delhi", shortName: "DU", website: "https://www.du.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "India's premier central university established in 1922.", logo: "📚", color: "#7c3aed" },
  { name: "Jawaharlal Nehru University", shortName: "JNU", website: "https://www.jnu.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "World-renowned research university in New Delhi.", logo: "🏛️", color: "#dc2626" },
  { name: "Jamia Millia Islamia", shortName: "JMI", website: "https://www.jmi.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "Central university with a rich legacy in education.", logo: "🕌", color: "#0369a1" },
  { name: "Indian Institute of Technology Delhi", shortName: "IITD", website: "https://www.iitd.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "Premier engineering institute - IIT Delhi.", logo: "⚡", color: "#2563eb" },
  { name: "Indian Institute of Technology (ISM) Dhanbad Delhi Campus", shortName: "IITISM", website: "https://iitism.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "IIT ISM extension center in Delhi.", logo: "⚡", color: "#1d4ed8" },
  { name: "All India Institute of Medical Sciences Delhi", shortName: "AIIMSD", website: "https://www.aiims.edu", state: "Delhi", district: "New Delhi", type: "Central", description: "India's most prestigious medical institute.", logo: "🏥", color: "#dc2626" },
  { name: "Indian Institute of Technology Bombay Delhi", shortName: "IITB", website: "https://iitb.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "IIT Bombay outreach center in Delhi.", logo: "⚡", color: "#0369a1" },
  { name: "Indian Statistical Institute Delhi", shortName: "ISID", website: "https://www.isid.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "Premier institute for statistics and mathematics.", logo: "📊", color: "#059669" },
  { name: "Indian Institute of Technology Kanpur Delhi", shortName: "IITK", website: "https://iitk.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "IIT Kanpur research center in Delhi.", logo: "⚡", color: "#7c3aed" },
  { name: "Indian Institute of Technology Madras Delhi", shortName: "IITM", website: "https://iitm.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "IIT Madras research center in Delhi.", logo: "⚡", color: "#9333ea" },
  { name: "Indian Institute of Science Education and Research Delhi", shortName: "IISERD", website: "https://iiserd.gov.in", state: "Delhi", district: "New Delhi", type: "Central", description: "IISER Delhi for science education and research.", logo: "🔬", color: "#0891b2" },
  { name: "Indian Institute of Technology Roorkee Delhi", shortName: "IITR", website: "https://iitr.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "IIT Roorkee campus in Delhi.", logo: "⚡", color: "#0f766e" },
  { name: "Indian Institute of Technology Indore Delhi", shortName: "IITI", website: "https://iiti.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "IIT Indore extension in Delhi.", logo: "⚡", color: "#1d4ed8" },
  { name: "National Institute of Technology Delhi", shortName: "NITD", website: "https://nitdelhi.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "NIT Delhi - National Institute of Technology.", logo: "🔧", color: "#1e40af" },
  { name: "Indian Institute of Foreign Trade", shortName: "IIFT", website: "https://iift.ac.in", state: "Delhi", district: "New Delhi", type: "Deemed", description: "Premier institute for international business and trade.", logo: "🌍", color: "#ea580c" },
  { name: "Indian Institute of Technology Kharagpur Delhi", shortName: "IITKG", website: "https://iitkgp.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "IIT Kharagpur extension in Delhi.", logo: "⚡", color: "#b91c1c" },
  { name: "Indian Agricultural Research Institute", shortName: "IARI", website: "https://iari.res.in", state: "Delhi", district: "New Delhi", type: "Central", description: "Premier agricultural research institute - Pusa Institute.", logo: "🌾", color: "#65a30d" },
  { name: "Delhi University South Campus", shortName: "DUSC", website: "https://southcampus.du.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "South Campus of University of Delhi.", logo: "🏫", color: "#7c3aed" },
  { name: "Delhi Technological University", shortName: "DTU", website: "https://dtu.ac.in", state: "Delhi", district: "Delhi", type: "State", description: "Formerly Delhi College of Engineering, top engineering college.", logo: "⚙️", color: "#2563eb" },
  { name: "Netaji Subhas University of Technology", shortName: "NSUT", website: "https://nsut.ac.in", state: "Delhi", district: "Delhi", type: "State", description: "Formerly NSIT, top engineering college in Delhi.", logo: "🔧", color: "#1d4ed8" },
  { name: "Indraprastha Institute of Information Technology Delhi", shortName: "IIITD", website: "https://iiitd.ac.in", state: "Delhi", district: "New Delhi", type: "State", description: "Premier IT research university.", logo: "💻", color: "#0891b2" },
  { name: "Indira Gandhi Delhi Technical University for Women", shortName: "IGDTUW", website: "https://igdtuw.ac.in", state: "Delhi", district: "Delhi", type: "State", description: "Technical university exclusively for women.", logo: "👩‍💻", color: "#a21caf" },
  { name: "Delhi University North Campus", shortName: "DUNC", website: "https://northcampus.du.ac.in", state: "Delhi", district: "Delhi", type: "Central", description: "North Campus of University of Delhi.", logo: "🏛️", color: "#7c3aed" },
  { name: "National Law University Delhi", shortName: "NLUD", website: "https://nludelhi.ac.in", state: "Delhi", district: "New Delhi", type: "State", description: "National law university in Dwarka, Delhi.", logo: "⚖️", color: "#1e40af" },
  { name: "Indian Law Institute", shortName: "ILI", website: "https://ili.ac.in", state: "Delhi", district: "New Delhi", type: "Deemed", description: "Premier law research and education institute.", logo: "⚖️", color: "#0369a1" },
  { name: "South Asian University", shortName: "SAU", website: "https://sau.int", state: "Delhi", district: "New Delhi", type: "Central", description: "International university established by SAARC nations.", logo: "🌐", color: "#059669" },
  { name: "Shiv Nadar University Delhi-NCR", shortName: "SNUD", website: "https://snu.edu.in", state: "Delhi", district: "Noida", type: "Private", description: "Top private research university near Delhi.", logo: "🏫", color: "#0369a1" },
  { name: "Jamia Hamdard", shortName: "JH", website: "https://jamiahamdard.edu", state: "Delhi", district: "New Delhi", type: "Deemed", description: "Deemed university known for Unani medicine and sciences.", logo: "🏫", color: "#059669" },
  { name: "Ambedkar University Delhi", shortName: "AUD", website: "https://aud.ac.in", state: "Delhi", district: "Delhi", type: "State", description: "State university focusing on social sciences and humanities.", logo: "📚", color: "#2563eb" },
  { name: "Teri School of Advanced Studies", shortName: "TERISAS", website: "https://terisas.ac.in", state: "Delhi", district: "New Delhi", type: "Deemed", description: "Deemed university focused on sustainable development.", logo: "🌿", color: "#65a30d" },
  { name: "Guru Gobind Singh Indraprastha University", shortName: "GGSIPU", website: "https://ipu.ac.in", state: "Delhi", district: "Delhi", type: "State", description: "State technical and professional university.", logo: "🏫", color: "#dc2626" },
  { name: "School of Planning and Architecture Delhi", shortName: "SPAD", website: "https://spa.ac.in", state: "Delhi", district: "New Delhi", type: "Central", description: "Premier architecture and planning institute.", logo: "🏗️", color: "#b45309" },
  { name: "National Museum Institute", shortName: "NMI", website: "https://nmi.gov.in", state: "Delhi", district: "New Delhi", type: "Deemed", description: "Deemed university for museology, history of art, and conservation.", logo: "🏛️", color: "#7c3aed" },
  { name: "Bharati Vidyapeeth Deemed University Delhi", shortName: "BVPD", website: "https://bvdelhi.ac.in", state: "Delhi", district: "New Delhi", type: "Deemed", description: "Bharati Vidyapeeth campus in Delhi.", logo: "📚", color: "#ea580c" },
  { name: "Jagannath University Delhi", shortName: "JAGU", website: "https://jagannathuniversityncr.ac.in", state: "Delhi", district: "Delhi", type: "Private", description: "Private university in Bahadurgarh, Delhi NCR.", logo: "🏫", color: "#b91c1c" },

  // ═══════════════════ UTTAR PRADESH UNIVERSITIES ═══════════════════
  { name: "University of Lucknow", shortName: "ULU", website: "https://lkouniv.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "State", description: "Premier state university in Lucknow, established 1921.", logo: "🏛️", color: "#dc2626" },
  { name: "Banaras Hindu University", shortName: "BHU", website: "https://www.bhu.ac.in", state: "Uttar Pradesh", district: "Varanasi", type: "Central", description: "One of India's largest residential universities, established 1916.", logo: "🏛️", color: "#b91c1c" },
  { name: "Aligarh Muslim University", shortName: "AMU", website: "https://www.amu.ac.in", state: "Uttar Pradesh", district: "Aligarh", type: "Central", description: "Premier central university established by Sir Syed Ahmad Khan.", logo: "🕌", color: "#0369a1" },
  { name: "University of Allahabad", shortName: "AU", website: "https://www.allduniv.ac.in", state: "Uttar Pradesh", district: "Prayagraj", type: "Central", description: "Oxford of the East - established 1887.", logo: "📚", color: "#1e40af" },
  { name: "Dr. A.P.J. Abdul Kalam Technical University", shortName: "AKTU", website: "https://aktu.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "State", description: "Technical university for all engineering colleges in UP.", logo: "⚙️", color: "#0891b2" },
  { name: "Dr. Ram Manohar Lohia Awadh University", shortName: "RMLAU", website: "https://rmlau.ac.in", state: "Uttar Pradesh", district: "Ayodhya", type: "State", description: "State university in Ayodhya.", logo: "🏫", color: "#ea580c" },
  { name: "Chhatrapati Shahu Ji Maharaj University", shortName: "CSJMU", website: "https://csjmu.ac.in", state: "Uttar Pradesh", district: "Kanpur", type: "State", description: "State university in Kanpur.", logo: "🏫", color: "#2563eb" },
  { name: "Mahatma Gandhi Kashi Vidyapeeth", shortName: "MGKVP", website: "https://mgkvp.ac.in", state: "Uttar Pradesh", district: "Varanasi", type: "State", description: "State university in Varanasi named after Mahatma Gandhi.", logo: "📜", color: "#d97706" },
  { name: "University of Meerut", shortName: "CCSU", website: "https://ccsu.ac.in", state: "Uttar Pradesh", district: "Meerut", type: "State", description: "Chaudhary Charan Singh University in Meerut.", logo: "🏫", color: "#059669" },
  { name: "University of Agra", shortName: "DBRAU", website: "https://dbrau.org.in", state: "Uttar Pradesh", district: "Agra", type: "State", description: "Dr. Bhimrao Ambedkar University in Agra.", logo: "🏛️", color: "#b45309" },
  { name: "Siddharth University", shortName: "SU", website: "https://siddharthuniversity.in", state: "Uttar Pradesh", district: "Kapilvastu", type: "State", description: "State university in Siddharthnagar.", logo: "🏛️", color: "#7c3aed" },
  { name: "Uttar Pradesh Rajarshi Tandon Open University", shortName: "UPRTOU", website: "https://uprtou.ac.in", state: "Uttar Pradesh", district: "Prayagraj", type: "State", description: "Open university offering distance education in UP.", logo: "📖", color: "#9333ea" },
  { name: "Indian Institute of Technology Kanpur", shortName: "IITKAN", website: "https://www.iitk.ac.in", state: "Uttar Pradesh", district: "Kanpur", type: "Central", description: "Premier IIT - Indian Institute of Technology Kanpur.", logo: "⚡", color: "#0369a1" },
  { name: "Indian Institute of Technology (BHU) Varanasi", shortName: "IITBHU", website: "https://www.iitbhu.ac.in", state: "Uttar Pradesh", district: "Varanasi", type: "Central", description: "IIT within BHU campus - one of the oldest engineering institutes.", logo: "⚡", color: "#1d4ed8" },
  { name: "Indian Institute of Technology Roorkee", shortName: "IITR", website: "https://www.iitr.ac.in", state: "Uttar Pradesh", district: "Roorkee", type: "Central", description: "Asia's oldest engineering college - IIT Roorkee.", logo: "⚡", color: "#2563eb" },
  { name: "Indian Institute of Technology Lucknow", shortName: "IITL", website: "https://www.iitl.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "Central", description: "New IIT established in Lucknow.", logo: "⚡", color: "#7c3aed" },
  { name: "Motilal Nehru National Institute of Technology Allahabad", shortName: "MNNIT", website: "https://www.mnnit.ac.in", state: "Uttar Pradesh", district: "Prayagraj", type: "Central", description: "Premier NIT in Prayagraj (Allahabad).", logo: "🔧", color: "#0891b2" },
  { name: "All India Institute of Medical Sciences (AIIMS) Gorakhpur", shortName: "AIIMSG", website: "https://aiims.edu.in", state: "Uttar Pradesh", district: "Gorakhpur", type: "Central", description: "AIIMS Gorakhpur - new AIIMS in UP.", logo: "🏥", color: "#dc2626" },
  { name: "National Institute of Technology Jamshedpur", shortName: "NITJSR", website: "https://nitjsr.ac.in", state: "Uttar Pradesh", district: "Jamshedpur", type: "Central", description: "NIT in Jamshedpur region.", logo: "🔧", color: "#1e40af" },
  { name: "Indian Institute of Management Lucknow", shortName: "IIML", website: "https://www.iiml.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "Central", description: "Premier management institute - IIM Lucknow.", logo: "💼", color: "#059669" },
  { name: "Harcourt Butler Technical University", shortName: "HBTU", website: "https://hbtu.ac.in", state: "Uttar Pradesh", district: "Kanpur", type: "State", description: "Top technical university in Kanpur, formerly HBTI.", logo: "⚙️", color: "#dc2626" },
  { name: "Bundelkhand University", shortName: "BUJH", website: "https://buajhansi.ac.in", state: "Uttar Pradesh", district: "Jhansi", type: "State", description: "State university in Jhansi, Bundelkhand region.", logo: "🏫", color: "#ea580c" },
  { name: "Gautam Buddha University", shortName: "GBU", website: "https://gbu.ac.in", state: "Uttar Pradesh", district: "Noida", type: "State", description: "State university in Greater Noida.", logo: "🏛️", color: "#0369a1" },
  { name: "Dr. Bhimrao Ambedkar University Agra", shortName: "DBRAU", website: "https://dbrau.org.in", state: "Uttar Pradesh", district: "Agra", type: "State", description: "State university in Agra named after Dr. B.R. Ambedkar.", logo: "📚", color: "#7c3aed" },
  { name: "King George's Medical University", shortName: "KGMU", website: "https://kgmu.org", state: "Uttar Pradesh", district: "Lucknow", type: "State", description: "Premier medical university in Lucknow.", logo: "🏥", color: "#dc2626" },
  { name: "Sanjay Gandhi Post Graduate Institute of Medical Sciences", shortName: "SGPGI", website: "https://sgpgi.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "State", description: "Top medical research institute in Lucknow.", logo: "🏥", color: "#b91c1c" },
  { name: "Integral University", shortName: "IU", website: "https://integraluniversity.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "Private", description: "Private university in Lucknow.", logo: "🏫", color: "#059669" },
  { name: "Lovely Professional University", shortName: "LPU", website: "https://lpu.in", state: "Uttar Pradesh", district: "Noida", type: "Private", description: "LPU campus in Delhi NCR region.", logo: "🏫", color: "#7c3aed" },
  { name: "Sharda University", shortName: "SU", website: "https://sharda.ac.in", state: "Uttar Pradesh", district: "Noida", type: "Private", description: "Private university in Greater Noida.", logo: "🏫", color: "#ea580c" },
  { name: "G L Bajaj Institute of Technology and Management", shortName: "GLBITM", website: "https://glbitm.org", state: "Uttar Pradesh", district: "Noida", type: "Private", description: "Top private engineering college in Greater Noida.", logo: "⚙️", color: "#0891b2" },
  { name: "Amity University Noida", shortName: "AMITY", website: "https://amity.edu", state: "Uttar Pradesh", district: "Noida", type: "Private", description: "India's largest private university.", logo: "🏫", color: "#dc2626" },
  { name: "Gautam Buddha University Greater Noida", shortName: "GBU", website: "https://gbu.ac.in", state: "Uttar Pradesh", district: "Greater Noida", type: "State", description: "State university in Gautam Buddha Nagar.", logo: "🏛️", color: "#0369a1" },
  { name: "Uttar Pradesh Technical University", shortName: "UPTU", website: "https://aktu.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "State", description: "Former UPTU now merged with AKTU.", logo: "⚙️", color: "#0891b2" },
  { name: "Veer Bahadur Singh Purvanchal University", shortName: "VBSPU", website: "https://vbspu.ac.in", state: "Uttar Pradesh", district: "Jaunpur", type: "State", description: "State university in Jaunpur for eastern UP.", logo: "🏫", color: "#65a30d" },
  { name: "Jananayak Chandrashekhar University", shortName: "JNCU", website: "https://jncu.ac.in", state: "Uttar Pradesh", district: "Ballia", type: "State", description: "State university in Ballia district.", logo: "🏫", color: "#b91c1c" },
  { name: "Mahatma Jyotiba Phule Rohilkhand University", shortName: "MJPRU", website: "https://mjpru.ac.in", state: "Uttar Pradesh", district: "Bareilly", type: "State", description: "State university in Bareilly.", logo: "🏫", color: "#9333ea" },
  { name: "Deen Dayal Upadhyaya Gorakhpur University", shortName: "DDUGU", website: "https://ddugu.ac.in", state: "Uttar Pradesh", district: "Gorakhpur", type: "State", description: "State university in Gorakhpur.", logo: "🏫", color: "#2563eb" },
  { name: "Swami Vivekanand Subharti University", shortName: "SVSU", website: "https://svsu.ac.in", state: "Uttar Pradesh", district: "Meerut", type: "Private", description: "Private university in Meerut.", logo: "🏫", color: "#ea580c" },
  { name: "Sanskriti University", shortName: "SANSKRITI", website: "https://sanskriti.edu.in", state: "Uttar Pradesh", district: "Mathura", type: "Private", description: "Private university in Mathura.", logo: "🏫", color: "#c2410c" },
  { name: "Galgotias University", shortName: "GU", website: "https://galgotiasuniversity.edu.in", state: "Uttar Pradesh", district: "Noida", type: "Private", description: "Private university in Greater Noida.", logo: "🏫", color: "#1d4ed8" },
  { name: "Jaypee Institute of Information Technology", shortName: "JIIT", website: "https://jiit.ac.in", state: "Uttar Pradesh", district: "Noida", type: "Private", description: "Premier private engineering institute in Noida.", logo: "💻", color: "#0891b2" },
  { name: "Shiv Nadar University", shortName: "SNU", website: "https://snu.edu.in", state: "Uttar Pradesh", district: "Greater Noida", type: "Private", description: "Top research-focused private university.", logo: "🏫", color: "#0369a1" },
  { name: "University of Lucknow Old Campus", shortName: "ULUOC", website: "https://lkouniv.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "State", description: "Historic old campus of University of Lucknow.", logo: "🏛️", color: "#dc2626" },
  { name: "Babu Banarasi Das University", shortName: "BBDU", website: "https://bbdu.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "Private", description: "Private university in Lucknow.", logo: "🏫", color: "#7c3aed" },
  { name: "Dr. Shakuntala Misra National Rehabilitation University", shortName: "DSMNRU", website: "https://dsmru.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "State", description: "India's first university dedicated to differently-abled students.", logo: "🏫", color: "#059669" },
  { name: "Khawaja Moinuddin Chishti Urdu Arabic Persian University", shortName: "KMCUAPU", website: "https://kmcau.ac.in", state: "Uttar Pradesh", district: "Lucknow", type: "State", description: "State university for Urdu, Arabic, and Persian languages.", logo: "📚", color: "#b45309" },
];

export async function seedUniversities() {
  let added = 0;
  let skipped = 0;

  for (const uni of UNIVERSITIES) {
    const existing = await db.university.findFirst({
      where: { shortName: uni.shortName }
    });

    if (!existing) {
      await db.university.create({
        data: {
          name: uni.name,
          shortName: uni.shortName,
          website: uni.website,
          state: uni.state,
          district: uni.district,
          type: uni.type,
          description: uni.description,
          logo: uni.logo,
          color: uni.color,
        }
      });
      added++;
    } else {
      skipped++;
    }
  }

  console.log(`✅ Seed complete: ${added} new universities added, ${skipped} already existed.`);
  return { added, skipped, total: UNIVERSITIES.length };
}
