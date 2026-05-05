'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import {
  GraduationCap, Bell, ExternalLink, Search, ChevronDown,
  ChevronRight, ChevronUp, Loader2, Trash2, Pin, PinOff,
  LogOut, Home as HomeIcon, Building2, BookOpen, Calendar, FileText,
  Menu, X, Filter, Star, MapPin, Globe, Zap,
  Upload, ArrowLeft, Clock, Tag, Shield,
  User, Lock, CheckCircle2, TrendingUp, Award, Megaphone,
  Wifi, WifiOff, Briefcase, Newspaper, Settings,
  Eye, EyeOff, Download,
  Sun, Moon, Monitor,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { EXAM_DETAILS, type ExamDetail } from '@/lib/entrance-exam-details';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface University {
  id: string;
  name: string;
  shortName: string;
  website: string;
  state: string;
  district: string | null;
  type: string;
  description: string | null;
  logo: string | null;
  color: string;
  isActive: boolean;
  _count: { notices: number };
}

interface Notice {
  id: string;
  universityId: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  datePublished: string;
  category: string;
  isImportant: boolean;
  createdAt: string;
  university: {
    id: string;
    name: string;
    shortName: string;
    color: string;
    logo: string | null;
    state: string;
    district: string | null;
  };
}

interface AdminPost {
  id: string;
  title: string;
  content: string | null;
  category: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: string;
  tags: string;
  category: string;
  readTime: string;
  isPublished: boolean;
  views: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogFormInput {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string;
  category: string;
  readTime: string;
  isPublished: boolean;
}

interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  source: string;
  category: string;
  state: string;
  timestamp: string;
  url?: string;
  universityId?: string;
  examId?: string;
  kind?: 'university' | 'exam' | 'socket';
}

interface StateSummary {
  state: string;
  count: number;
}

interface DistrictInfo {
  name: string;
  count: number;
}

type ViewType = 'home' | 'universities' | 'notices' | 'entrance' | 'board' | 'admin';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const STATES = ['Bihar', 'Haryana', 'Delhi', 'Uttar Pradesh'] as const;

const STATE_META: Record<string, { label: string; color: string; gradient: string; logo: string; stateKey: string; border: string; bg: string; badge: string }> = {
  Bihar: {
    label: 'Bihar',
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-amber-600/10',
    logo: '/logos/bihar-logo.png',
    stateKey: 'Bihar',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/10',
    badge: 'bg-orange-500/20 text-orange-400',
  },
  Haryana: {
    label: 'Haryana',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-600/10',
    logo: '/logos/haryana-logo.png',
    stateKey: 'Haryana',
    border: 'border-green-500/20',
    bg: 'bg-green-500/10',
    badge: 'bg-green-500/20 text-green-400',
  },
  Delhi: {
    label: 'Delhi',
    color: 'text-red-400',
    gradient: 'from-red-500/20 to-rose-600/10',
    logo: '/logos/delhi-logo.png',
    stateKey: 'Delhi',
    border: 'border-red-500/20',
    bg: 'bg-red-500/10',
    badge: 'bg-red-500/20 text-red-400',
  },
  'Uttar Pradesh': {
    label: 'UP',
    color: 'text-teal-400',
    gradient: 'from-teal-500/20 to-cyan-600/10',
    logo: '/logos/up-logo.png',
    stateKey: 'UP',
    border: 'border-teal-500/20',
    bg: 'bg-teal-500/10',
    badge: 'bg-teal-500/20 text-teal-400',
  },
};

const CAT_COLORS: Record<string, string> = {
  Exam: 'bg-red-500/20 text-red-400 border border-red-500/10',
  Result: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10',
  Admission: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/10',
  Holiday: 'bg-amber-500/20 text-amber-400 border border-amber-500/10',
  Fee: 'bg-purple-500/20 text-purple-400 border border-purple-500/10',
  Recruitment: 'bg-teal-500/20 text-teal-400 border border-teal-500/10',
  Tender: 'bg-orange-500/20 text-orange-400 border border-orange-500/10',
  Academic: 'bg-violet-500/20 text-violet-400 border border-violet-500/10',
  Convocation: 'bg-pink-500/20 text-pink-400 border border-pink-500/10',
  General: 'bg-gray-500/20 text-gray-400 border border-gray-500/10',
  Notification: 'bg-sky-500/20 text-sky-400 border border-sky-500/10',
  Circular: 'bg-lime-500/20 text-lime-400 border border-lime-500/10',
  Syllabus: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10',
  Workshop: 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/10',
  Scholarship: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/10',
};

const TYPE_COLORS: Record<string, string> = {
  State: 'bg-blue-500/20 text-blue-400',
  Central: 'bg-amber-500/20 text-amber-400',
  Private: 'bg-purple-500/20 text-purple-400',
  Deemed: 'bg-pink-500/20 text-pink-400',
  Constituent: 'bg-teal-500/20 text-teal-400',
};

// ═══ ALL ENTRANCE EXAMS — National + Bihar + Haryana + Delhi + UP ═══
const ENTRANCE_EXAMS: {
  name: string; desc: string; website: string; color: string; category: string; level: string; state: string; icon: string;
}[] = [
  // ──── NATIONAL LEVEL ────
  { name: 'JEE Main', desc: 'Joint Entrance Examination for engineering admissions to NITs, IIITs, and GFTIs.', website: 'https://jeemain.nta.nic.in', color: 'from-blue-500 to-cyan-500', category: 'Engineering', level: 'National', state: 'National', icon: '📐' },
  { name: 'JEE Advanced', desc: 'Advanced engineering entrance for IIT admissions. Only top JEE Main rankers eligible.', website: 'https://jeeadv.ac.in', color: 'from-orange-500 to-red-500', category: 'Engineering', level: 'National', state: 'National', icon: '🏆' },
  { name: 'NEET UG', desc: 'National Eligibility cum Entrance Test for MBBS/BDS and AYUSH admissions.', website: 'https://neet.nta.nic.in', color: 'from-emerald-500 to-green-500', category: 'Medical', level: 'National', state: 'National', icon: '🩺' },
  { name: 'NEET PG', desc: 'National entrance test for MD/MS/PG Diploma medical admissions.', website: 'https://natboard.edu.in', color: 'from-teal-500 to-emerald-500', category: 'Medical', level: 'National', state: 'National', icon: '⚕️' },
  { name: 'CUET UG', desc: 'Common University Entrance Test for undergraduate admissions in central universities.', website: 'https://cuet.samarth.ac.in', color: 'from-purple-500 to-violet-500', category: 'University', level: 'National', state: 'National', icon: '🎓' },
  { name: 'CUET PG', desc: 'Common University Entrance Test for postgraduate admissions.', website: 'https://cuet.nta.nic.in', color: 'from-violet-500 to-fuchsia-500', category: 'University', level: 'National', state: 'National', icon: '📚' },
  { name: 'UGC NET', desc: 'National Eligibility Test for lectureship and Junior Research Fellowship.', website: 'https://ugcnet.nta.nic.in', color: 'from-amber-500 to-orange-500', category: 'Research', level: 'National', state: 'National', icon: '🔬' },
  { name: 'CSIR NET', desc: 'Council of Scientific & Industrial Research NET for science research.', website: 'https://csirnet.nta.nic.in', color: 'from-teal-500 to-emerald-500', category: 'Research', level: 'National', state: 'National', icon: '🧪' },
  { name: 'CMAT', desc: 'Common Management Admission Test for MBA/PGDM programs.', website: 'https://cmat.nta.nic.in', color: 'from-rose-500 to-pink-500', category: 'Management', level: 'National', state: 'National', icon: '💼' },
  { name: 'GPAT', desc: 'Graduate Pharmacy Aptitude Test for M.Pharm admissions.', website: 'https://gpat.nta.nic.in', color: 'from-lime-500 to-green-500', category: 'Pharmacy', level: 'National', state: 'National', icon: '💊' },
  { name: 'CLAT', desc: 'Common Law Admission Test for national law university admissions.', website: 'https://consortiumofnlus.ac.in', color: 'from-sky-500 to-blue-500', category: 'Law', level: 'National', state: 'National', icon: '⚖️' },
  { name: 'AILET', desc: 'All India Law Entrance Test for NLU Delhi admissions.', website: 'https://nludelhi.ac.in', color: 'from-indigo-500 to-blue-500', category: 'Law', level: 'National', state: 'National', icon: '🏛️' },
  { name: 'NATA', desc: 'National Aptitude Test in Architecture for B.Arch admissions.', website: 'https://nata.in', color: 'from-indigo-500 to-purple-500', category: 'Architecture', level: 'National', state: 'National', icon: '🏗️' },
  { name: 'NIFT', desc: 'National Institute of Fashion Technology entrance exam for design programs.', website: 'https://nift.ac.in', color: 'from-pink-500 to-rose-500', category: 'Design', level: 'National', state: 'National', icon: '👗' },
  { name: 'NID DAT', desc: 'National Institute of Design Design Aptitude Test.', website: 'https://nid.edu', color: 'from-fuchsia-500 to-purple-500', category: 'Design', level: 'National', state: 'National', icon: '🎨' },
  { name: 'ICAR AIEEA', desc: 'Indian Council of Agricultural Research entrance exam for agriculture courses.', website: 'https://icar.org.in', color: 'from-green-500 to-teal-500', category: 'Agriculture', level: 'National', state: 'National', icon: '🌾' },
  { name: 'CAT', desc: 'Common Admission Test for IIMs and top MBA colleges.', website: 'https://iimcat.ac.in', color: 'from-amber-500 to-red-500', category: 'Management', level: 'National', state: 'National', icon: '🐱' },
  { name: 'XAT', desc: 'Xavier Aptitude Test for XLRI and other MBA programs.', website: 'https://xatonline.in', color: 'from-blue-500 to-indigo-500', category: 'Management', level: 'National', state: 'National', icon: '📝' },
  { name: 'GATE', desc: 'Graduate Aptitude Test in Engineering for M.Tech/PSU admissions.', website: 'https://gate.iitk.ac.in', color: 'from-orange-500 to-amber-500', category: 'Engineering', level: 'National', state: 'National', icon: '🚪' },
  { name: 'BITSAT', desc: 'Birla Institute of Technology entrance test for engineering.', website: 'https://bitsadmission.com', color: 'from-rose-500 to-red-500', category: 'Engineering', level: 'National', state: 'National', icon: '⚙️' },
  { name: 'VITEEE', desc: 'VIT University Engineering Entrance Exam.', website: 'https://viteee.vit.ac.in', color: 'from-purple-500 to-pink-500', category: 'Engineering', level: 'National', state: 'National', icon: '🔧' },
  { name: 'SRMJEEE', desc: 'SRM Institute Engineering Entrance Exam.', website: 'https://srmist.edu.in', color: 'from-cyan-500 to-blue-500', category: 'Engineering', level: 'National', state: 'National', icon: '📐' },
  { name: 'AP EAMCET', desc: 'Andhra Pradesh Engineering, Agriculture and Medical Common Entrance Test.', website: 'https://sche.ap.gov.in', color: 'from-violet-500 to-purple-500', category: 'Engineering', level: 'State', state: 'AP', icon: '📐' },
  { name: 'TS EAMCET', desc: 'Telangana Engineering, Agriculture and Medical Common Entrance Test.', website: 'https://eamcet.tsche.ac.in', color: 'from-lime-500 to-green-500', category: 'Engineering', level: 'State', state: 'Telangana', icon: '📐' },
  { name: 'KCET', desc: 'Karnataka Common Entrance Test for engineering/medical/pharmacy.', website: 'https://kea.kar.nic.in', color: 'from-pink-500 to-fuchsia-500', category: 'Engineering', level: 'State', state: 'Karnataka', icon: '📐' },
  { name: 'MHT CET', desc: 'Maharashtra Common Entrance Test for engineering and pharmacy.', website: 'https://mhtcet.org', color: 'from-purple-500 to-violet-500', category: 'Engineering', level: 'State', state: 'Maharashtra', icon: '📐' },
  { name: 'WBJEE', desc: 'West Bengal Joint Entrance Exam for engineering and pharmacy.', website: 'https://wbjeeb.nic.in', color: 'from-orange-500 to-red-500', category: 'Engineering', level: 'State', state: 'West Bengal', icon: '📐' },
  { name: 'TNEA', desc: 'Tamil Nadu Engineering Admissions through Anna University.', website: 'https://tneaonline.org', color: 'from-cyan-500 to-sky-500', category: 'Engineering', level: 'State', state: 'Tamil Nadu', icon: '📐' },
  { name: 'KEAM', desc: 'Kerala Engineering Agriculture Medical Entrance Exam.', website: 'https://cee.kerala.gov.in', color: 'from-emerald-500 to-teal-500', category: 'Engineering', level: 'State', state: 'Kerala', icon: '📐' },

  // ──── BIHAR STATE LEVEL ────
  { name: 'Bihar CECE', desc: 'Bihar Combined Entrance Competitive Examination for engineering in Bihar colleges.', website: 'https://bceceboard.bihar.gov.in', color: 'from-orange-500 to-amber-500', category: 'Engineering', level: 'State', state: 'Bihar', icon: '📐' },
  { name: 'Bihar NEET Counselling', desc: 'Bihar UG/PG medical counselling through BCECEB for MBBS/BDS seats.', website: 'https://bceceboard.bihar.gov.in', color: 'from-amber-500 to-yellow-500', category: 'Medical', level: 'State', state: 'Bihar', icon: '🩺' },
  { name: 'Bihar ITI CAT', desc: 'Bihar Industrial Training Institute Common Admission Test.', website: 'https://bceceboard.bihar.gov.in', color: 'from-yellow-500 to-orange-500', category: 'ITI', level: 'State', state: 'Bihar', icon: '🔧' },
  { name: 'Bihar D.El.Ed', desc: 'Bihar Diploma in Elementary Education entrance test.', website: 'https://biharboardonline.bihar.gov.in', color: 'from-green-500 to-emerald-500', category: 'Education', level: 'State', state: 'Bihar', icon: '📖' },
  { name: 'Bihar B.Ed CET', desc: 'Bihar Bachelor of Education Common Entrance Test.', website: 'https://lnmu.ac.in', color: 'from-emerald-500 to-teal-500', category: 'Education', level: 'State', state: 'Bihar', icon: '📚' },
  { name: 'Bihar DElEd (BSEB)', desc: 'Bihar Diploma in Elementary Education by BSEB.', website: 'https://biharboardonline.bihar.gov.in', color: 'from-teal-500 to-cyan-500', category: 'Education', level: 'State', state: 'Bihar', icon: '🎓' },
  { name: 'Bihar Polytechnic (DCECE)', desc: 'Diploma Certificate Entrance Competitive Exam for polytechnic admissions.', website: 'https://bceceboard.bihar.gov.in', color: 'from-rose-500 to-pink-500', category: 'Polytechnic', level: 'State', state: 'Bihar', icon: '⚙️' },
  { name: 'Bihar LAW CET', desc: 'Bihar Law Common Entrance Test for LLB/BA LLB admissions.', website: 'https://bnmu.ac.in', color: 'from-sky-500 to-blue-500', category: 'Law', level: 'State', state: 'Bihar', icon: '⚖️' },
  { name: 'Patna University PET', desc: 'Patna University Postgraduate Entrance Test for MA/MSc/MCom.', website: 'https://patnauniversity.ac.in', color: 'from-red-500 to-orange-500', category: 'University', level: 'State', state: 'Bihar', icon: '🎓' },
  { name: 'Bihar BSc Nursing', desc: 'Bihar BSc Nursing entrance test for nursing admissions.', website: 'https://bceceboard.bihar.gov.in', color: 'from-pink-500 to-rose-500', category: 'Medical', level: 'State', state: 'Bihar', icon: '🏥' },
  { name: 'Bihar Agriculture (AUCET)', desc: 'Bihar Agriculture University Combined Entrance Test.', website: 'https://pusa.bih.nic.in', color: 'from-lime-500 to-green-500', category: 'Agriculture', level: 'State', state: 'Bihar', icon: '🌾' },

  // ──── HARYANA STATE LEVEL ────
  { name: 'Haryana JEE', desc: 'Haryana Joint Entrance Exam for engineering admissions in Haryana colleges.', website: 'https://hstes.org.in', color: 'from-amber-500 to-orange-500', category: 'Engineering', level: 'State', state: 'Haryana', icon: '📐' },
  { name: 'Haryana LEET', desc: 'Haryana Lateral Entry Entrance Test for diploma to engineering.', website: 'https://hstes.org.in', color: 'from-orange-500 to-red-500', category: 'Engineering', level: 'State', state: 'Haryana', icon: '🔧' },
  { name: 'Haryana NEET Counselling', desc: 'Haryana UG medical counselling through DMER for MBBS/BDS seats.', website: 'https://dmer.haryana.gov.in', color: 'from-green-500 to-emerald-500', category: 'Medical', level: 'State', state: 'Haryana', icon: '🩺' },
  { name: 'Haryana B.Ed CET', desc: 'Haryana Bachelor of Education Common Entrance Test.', website: 'https://gjust.ac.in', color: 'from-emerald-500 to-teal-500', category: 'Education', level: 'State', state: 'Haryana', icon: '📖' },
  { name: 'Haryana D.El.Ed', desc: 'Haryana Diploma in Elementary Education entrance exam.', website: 'https://scertharyana.gov.in', color: 'from-teal-500 to-cyan-500', category: 'Education', level: 'State', state: 'Haryana', icon: '📚' },
  { name: 'Haryana PMET', desc: 'Haryana Pre-Medical Entrance Test for state quota medical seats.', website: 'https://hstes.org.in', color: 'from-rose-500 to-pink-500', category: 'Medical', level: 'State', state: 'Haryana', icon: '⚕️' },
  { name: 'Haryana LAW CET', desc: 'Haryana Law Common Entrance Test for LLB/BA LLB.', website: 'https://hstes.org.in', color: 'from-sky-500 to-blue-500', category: 'Law', level: 'State', state: 'Haryana', icon: '⚖️' },
  { name: 'Haryana Polytechnic', desc: 'Haryana Polytechnic entrance test (DET) for diploma courses.', website: 'https://hstes.org.in', color: 'from-purple-500 to-violet-500', category: 'Polytechnic', level: 'State', state: 'Haryana', icon: '⚙️' },
  { name: 'KUK CET', desc: 'Kurukshetra University Common Entrance Test for various courses.', website: 'https://kuk.ac.in', color: 'from-cyan-500 to-teal-500', category: 'University', level: 'State', state: 'Haryana', icon: '🎓' },
  { name: 'MDU CET', desc: 'Maharshi Dayanand University Common Entrance Test.', website: 'https://mdu.ac.in', color: 'from-blue-500 to-indigo-500', category: 'University', level: 'State', state: 'Haryana', icon: '🎓' },
  { name: 'Haryana BPharm CET', desc: 'Haryana B.Pharmacy Common Entrance Test.', website: 'https://hstes.org.in', color: 'from-lime-500 to-green-500', category: 'Pharmacy', level: 'State', state: 'Haryana', icon: '💊' },
  { name: 'Haryana BSc Nursing', desc: 'Haryana BSc Nursing entrance test.', website: 'https://hstes.org.in', color: 'from-pink-500 to-fuchsia-500', category: 'Medical', level: 'State', state: 'Haryana', icon: '🏥' },

  // ──── DELHI STATE LEVEL ────
  { name: 'Delhi CET (DTU)', desc: 'Delhi Technological University Combined Entrance Test.', website: 'https://dtu.ac.in', color: 'from-red-500 to-rose-500', category: 'Engineering', level: 'State', state: 'Delhi', icon: '📐' },
  { name: 'NSUT CET', desc: 'Netaji Subhas University of Technology entrance exam.', website: 'https://nsut.ac.in', color: 'from-rose-500 to-pink-500', category: 'Engineering', level: 'State', state: 'Delhi', icon: '🔧' },
  { name: 'Delhi NEET Counselling', desc: 'Delhi UG medical counselling for MBBS/BDS state quota seats.', website: 'https://fmsc.ac.in', color: 'from-emerald-500 to-green-500', category: 'Medical', level: 'State', state: 'Delhi', icon: '🩺' },
  { name: 'Delhi B.Ed CET', desc: 'Delhi University B.Ed Common Entrance Test.', website: 'https://cet.udel.ac.in', color: 'from-amber-500 to-orange-500', category: 'Education', level: 'State', state: 'Delhi', icon: '📖' },
  { name: 'Delhi JAT (DU)', desc: 'Delhi University Joint Admission Test for undergraduate courses.', website: 'https://admission.uod.ac.in', color: 'from-pink-500 to-red-500', category: 'University', level: 'State', state: 'Delhi', icon: '🎓' },
  { name: 'DU LLB / LLM', desc: 'Delhi University Faculty of Law entrance test.', website: 'https://lawfaculty.du.ac.in', color: 'from-sky-500 to-blue-500', category: 'Law', level: 'State', state: 'Delhi', icon: '⚖️' },
  { name: 'JMI Entrance', desc: 'Jamia Millia Islamia entrance exam for various UG/PG programs.', website: 'https://jmi.ac.in', color: 'from-green-500 to-emerald-500', category: 'University', level: 'State', state: 'Delhi', icon: '🕌' },
  { name: 'JNU Entrance', desc: 'Jawaharlal Nehru University entrance exam for UG/PG/PhD.', website: 'https://jnuee.jnu.ac.in', color: 'from-blue-500 to-indigo-500', category: 'University', level: 'State', state: 'Delhi', icon: '🏛️' },
  { name: 'IPU CET', desc: 'Guru Gobind Singh Indraprastha University Common Entrance Test.', website: 'https://ipu.ac.in', color: 'from-violet-500 to-purple-500', category: 'Engineering', level: 'State', state: 'Delhi', icon: '📐' },
  { name: 'Delhi BPharm CET', desc: 'Delhi B.Pharmacy entrance test.', website: 'https://ipu.ac.in', color: 'from-lime-500 to-green-500', category: 'Pharmacy', level: 'State', state: 'Delhi', icon: '💊' },
  { name: 'Delhi BSc Nursing', desc: 'Delhi BSc Nursing entrance for state nursing colleges.', website: 'https://fmsc.ac.in', color: 'from-teal-500 to-cyan-500', category: 'Medical', level: 'State', state: 'Delhi', icon: '🏥' },

  // ──── UTTAR PRADESH STATE LEVEL ────
  { name: 'UPSEE (AKTU)', desc: 'Uttar Pradesh State Entrance Exam for engineering/management/architecture.', website: 'https://aktu.ac.in', color: 'from-green-500 to-emerald-500', category: 'Engineering', level: 'State', state: 'UP', icon: '📐' },
  { name: 'UP NEET Counselling', desc: 'UP UG medical counselling for MBBS/BDS state quota seats.', website: 'https://upneet.gov.in', color: 'from-emerald-500 to-teal-500', category: 'Medical', level: 'State', state: 'UP', icon: '🩺' },
  { name: 'UP B.Ed JEE', desc: 'Uttar Pradesh Bachelor of Education Joint Entrance Exam.', website: 'https://lkouniv.ac.in', color: 'from-teal-500 to-cyan-500', category: 'Education', level: 'State', state: 'UP', icon: '📖' },
  { name: 'UP D.El.Ed', desc: 'Uttar Pradesh Diploma in Elementary Education entrance exam.', website: 'https://examregulatoryauthority.up.gov.in', color: 'from-cyan-500 to-sky-500', category: 'Education', level: 'State', state: 'UP', icon: '📚' },
  { name: 'UP Polytechnic (JEECUP)', desc: 'UP Joint Entrance Examination Council for diploma/polytechnic admissions.', website: 'https://jeecup.nic.in', color: 'from-amber-500 to-orange-500', category: 'Polytechnic', level: 'State', state: 'UP', icon: '⚙️' },
  { name: 'UP LAW CET', desc: 'Uttar Pradesh Law Common Entrance Test for LLB/BA LLB.', website: 'https://uplawcet.in', color: 'from-sky-500 to-blue-500', category: 'Law', level: 'State', state: 'UP', icon: '⚖️' },
  { name: 'UP BPharm CET', desc: 'UP B.Pharmacy Common Entrance Test.', website: 'https://aktu.ac.in', color: 'from-lime-500 to-green-500', category: 'Pharmacy', level: 'State', state: 'UP', icon: '💊' },
  { name: 'BHU PET / UET', desc: 'Banaras Hindu University Entrance Test for UG/PG courses.', website: 'https://bhu.ac.in', color: 'from-orange-500 to-red-500', category: 'University', level: 'State', state: 'UP', icon: '🎓' },
  { name: 'AMU Entrance', desc: 'Aligarh Muslim University entrance exam for various courses.', website: 'https://amu.ac.in', color: 'from-green-500 to-teal-500', category: 'University', level: 'State', state: 'UP', icon: '🕌' },
  { name: 'UP BSc Nursing', desc: 'UP BSc Nursing entrance test for state nursing colleges.', website: 'https://upnrhm.gov.in', color: 'from-pink-500 to-rose-500', category: 'Medical', level: 'State', state: 'UP', icon: '🏥' },
  { name: 'UP Agriculture (UPCATET)', desc: 'UP Combined Agriculture and Technology Entrance Test.', website: 'https://upcatet.org', color: 'from-emerald-500 to-lime-500', category: 'Agriculture', level: 'State', state: 'UP', icon: '🌾' },
  { name: 'Lucknow University CET', desc: 'University of Lucknow Common Entrance Test for UG/PG admissions.', website: 'https://lkouniv.ac.in', color: 'from-purple-500 to-violet-500', category: 'University', level: 'State', state: 'UP', icon: '🎓' },
  { name: 'CCSU Entrance', desc: 'Chaudhary Charan Singh University entrance test for various courses.', website: 'https://ccsuniversity.ac.in', color: 'from-blue-500 to-cyan-500', category: 'University', level: 'State', state: 'UP', icon: '🎓' },
  { name: 'UP ITI Admission', desc: 'UP Industrial Training Institute admission through state merit.', website: 'https://vppup.in', color: 'from-rose-500 to-amber-500', category: 'ITI', level: 'State', state: 'UP', icon: '🔧' },
];

// Unique categories from ENTRANCE_EXAMS for filter dropdown
const ENTRANCE_CATEGORIES = [...new Set(ENTRANCE_EXAMS.map(e => e.category))].sort();
const ENTRANCE_STATES = ['All', 'National', 'Bihar', 'Haryana', 'Delhi', 'UP'];

// All 75 UP districts for comprehensive filtering
const UP_ALL_DISTRICTS = [
  'Agra','Aligarh','Allahabad','Ambedkar Nagar','Amethi','Amroha','Auraiya','Ayodhya','Azamgarh',
  'Badaun','Baghpat','Bahraich','Ballia','Balrampur','Banda','Barabanki','Bareilly','Basti','Bhadohi',
  'Bijnor','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah','Etawah','Farrukhabad','Fatehpur',
  'Firozabad','Gautam Buddha Nagar','Ghaziabad','Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur',
  'Hardoi','Hathras','Jalaun','Jaunpur','Jhansi','Kannauj','Kanpur Dehat','Kanpur Nagar','Kasganj',
  'Kaushambi','Kheri','Kushi Nagar','Lalitpur','Lucknow','Mau','Meerut','Mirzapur','Moradabad',
  'Muzaffarnagar','Pilibhit','Pratapgarh','Prayagraj','Rae Bareli','Rampur','Saharanpur','Sambhal',
  'Sant Kabir Nagar','Shahjahanpur','Shamli','Shravasti','Siddharthnagar','Sitapur','Sonbhadra',
  'Sultanpur','Unnao','Varanasi','Mathura','Mainpuri','Budaun','Shravasti','Gonda','Balrampur',
];

// Comprehensive board exams from ALL states with logos
const BOARD_EXAMS: {
  name: string; desc: string; website: string; color: string; state: string; icon: string; logo?: string;
  exams?: string; notices?: string[];
}[] = [
  // ── National ──
  { name: 'CBSE Board', desc: 'Central Board of Secondary Education - 10th & 12th board exams across India.', website: 'https://cbse.gov.in', color: 'from-blue-500 to-indigo-500', state: 'National', icon: '📘', logo: '/logos/delhi-logo.png', exams: '10th & 12th', notices: ['CBSE 2025 board exam date sheet released', 'CBSE results declared for class 12', 'CBSE new assessment pattern for 2025'] },
  { name: 'CISCE (ICSE/ISC)', desc: 'Council for the Indian School Certificate Examinations.', website: 'https://cisce.org', color: 'from-sky-500 to-blue-500', state: 'National', icon: '📕', logo: '/logos/delhi-logo.png', exams: '10th (ICSE) & 12th (ISC)', notices: ['ICSE 2025 timetable released', 'ISC semester exam schedule updated'] },
  { name: 'NIOS Board', desc: 'National Institute of Open Schooling for distance education.', website: 'https://nios.ac.in', color: 'from-violet-500 to-purple-500', state: 'National', icon: '📖', logo: '/logos/delhi-logo.png', exams: '10th & 12th Open', notices: ['NIOS admission 2025-26 open now'] },

  // ── Bihar ──
  { name: 'Bihar Board (BSEB)', desc: 'Bihar School Examination Board - Matric (10th) & Intermediate (12th).', website: 'https://biharboardonline.bihar.gov.in', color: 'from-orange-500 to-amber-500', state: 'Bihar', icon: '📙', logo: '/logos/bihar-logo.png', exams: '10th (Matric) & 12th (Inter)', notices: ['BSEB Matric result 2025 declared', 'Bihar Board 12th compartment exam dates', 'BSEB dummy registration card download'] },
  { name: 'Bihar Open Board', desc: 'Bihar Board of Open Schooling & Examination.', website: 'https://bbos.bihar.gov.in', color: 'from-amber-500 to-yellow-500', state: 'Bihar', icon: '📒', logo: '/logos/bihar-logo.png', exams: '10th & 12th Open', notices: ['BBOSE admission form last date extended'] },
  { name: 'Bihar Sanskrit Board', desc: 'Bihar Sanskrit Shiksha Board for Sanskrit medium education.', website: 'https://bssbpatna.com', color: 'from-yellow-500 to-orange-500', state: 'Bihar', icon: '📿', logo: '/logos/bihar-logo.png', exams: '10th & 12th Sanskrit', notices: ['Sanskrit Board exam form fill-up dates'] },
  { name: 'Bihar Madrasa Board', desc: 'Bihar State Madrasa Education Board for Islamic studies.', website: 'https://bsmeb.org', color: 'from-green-500 to-emerald-500', state: 'Bihar', icon: '🕌', logo: '/logos/bihar-logo.png', exams: 'Wastania, Fauqania, Munshi, Moulvi', notices: ['Madrasa Board exam schedule 2025'] },

  // ── Haryana ──
  { name: 'Haryana Board (BSEH)', desc: 'Board of School Education Haryana - 10th & 12th.', website: 'https://bseh.org.in', color: 'from-amber-500 to-orange-500', state: 'Haryana', icon: '📔', logo: '/logos/haryana-logo.png', exams: '10th & 12th', notices: ['BSEH 10th result declared', 'Haryana Board 12th re-evaluation form open', 'HBSE compartment exam dates 2025'] },

  // ── Delhi ──
  { name: 'Delhi Board', desc: 'Delhi Board of Secondary & Senior Secondary Education.', website: 'https://edudel.nic.in', color: 'from-red-500 to-rose-500', state: 'Delhi', icon: '📕', logo: '/logos/delhi-logo.png', exams: '10th & 12th', notices: ['Delhi Board results announced'] },

  // ── Uttar Pradesh ──
  { name: 'UP Board (UPMSP)', desc: 'Uttar Pradesh Madhyamik Shiksha Parishad - largest board in India with 75+ districts.', website: 'https://upmsp.edu.in', color: 'from-green-500 to-emerald-500', state: 'UP', icon: '📗', logo: '/logos/up-logo.png', exams: '10th (High School) & 12th (Intermediate)', notices: ['UP Board 10th result 2025 declared', 'UP Board 12th compartment exam schedule', 'UPMSP copy evaluation dates', 'UP Board marksheet download'] },
  { name: 'UP Sanskrit Board', desc: 'Uttar Pradesh Sanskrit Sansthan for Sanskrit education.', website: 'https://upsanskritparishad.up.gov.in', color: 'from-emerald-500 to-teal-500', state: 'UP', icon: '📿', logo: '/logos/up-logo.png', exams: '10th & 12th Sanskrit', notices: ['UP Sanskrit Board exam dates'] },

  // ── Other Major States ──
  { name: 'MP Board (MPBSE)', desc: 'Madhya Pradesh Board of Secondary Education.', website: 'https://mpbse.nic.in', color: 'from-teal-500 to-cyan-500', state: 'MP', icon: '📓', exams: '10th & 12th', notices: ['MP Board results declared'] },
  { name: 'Rajasthan Board (RBSE)', desc: 'Board of Secondary Education, Rajasthan (BSER).', website: 'https://rajeduboard.rajasthan.gov.in', color: 'from-red-500 to-rose-500', state: 'Rajasthan', icon: '📒', exams: '10th & 12th', notices: ['RBSE 2025 exam dates released'] },
  { name: 'Gujarat Board (GSEB)', desc: 'Gujarat Secondary and Higher Secondary Education Board.', website: 'https://gseb.org', color: 'from-amber-500 to-yellow-500', state: 'Gujarat', icon: '📔', exams: '10th (SSC) & 12th (HSC)', notices: ['GSEB exam time table 2025'] },
  { name: 'Maharashtra Board (MSBSHSE)', desc: 'Maharashtra State Board of Secondary & Higher Secondary Education.', website: 'https://mahahsscboard.in', color: 'from-purple-500 to-violet-500', state: 'Maharashtra', icon: '📘', exams: '10th (SSC) & 12th (HSC)', notices: ['Maharashtra Board SSC result 2025'] },
  { name: 'Karnataka Board (KSEEB)', desc: 'Karnataka Secondary Education Examination Board.', website: 'https://kseeb.kar.nic.in', color: 'from-pink-500 to-fuchsia-500', state: 'Karnataka', icon: '📗', exams: '10th (SSLC) & 12th (PUC)', notices: ['Karnataka SSLC result 2025 declared'] },
  { name: 'Tamil Nadu Board (TNBSE)', desc: 'Tamil Nadu Board of Secondary Education.', website: 'https://tnschools.gov.in', color: 'from-cyan-500 to-sky-500', state: 'Tamil Nadu', icon: '📙', exams: '10th (SSLC) & 12th (HSC)', notices: ['TN Board exam results announced'] },
  { name: 'West Bengal Board (WBBSE)', desc: 'West Bengal Board of Secondary Education.', website: 'https://wbbse.wb.gov.in', color: 'from-orange-500 to-red-500', state: 'West Bengal', icon: '📕', exams: '10th (Madhyamik) & 12th (Uchcha Madhyamik)', notices: ['WB Board Madhyamik result 2025'] },
  { name: 'Kerala Board (DHSE)', desc: 'Kerala Pareeksha Bhavan - SSLC & HSE exams.', website: 'https://keralaresults.nic.in', color: 'from-emerald-500 to-teal-500', state: 'Kerala', icon: '📒', exams: '10th (SSLC) & 12th (HSE/VHSE)', notices: ['Kerala SSLC result 2025'] },
  { name: 'Punjab Board (PSEB)', desc: 'Punjab School Education Board (PSEB).', website: 'https://pseb.ac.in', color: 'from-rose-500 to-pink-500', state: 'Punjab', icon: '📘', exams: '10th & 12th', notices: ['PSEB 2025 results declared'] },
  { name: 'Telangana Board (BSE)', desc: 'Board of Secondary Education, Telangana.', website: 'https://bie.telangana.gov.in', color: 'from-lime-500 to-green-500', state: 'Telangana', icon: '📙', exams: '10th (SSC) & 12th (Inter)', notices: ['TS Board SSC result 2025'] },
  { name: 'AP Board (BIEAP)', desc: 'Board of Intermediate Education, Andhra Pradesh.', website: 'https://bieap.gov.in', color: 'from-violet-500 to-purple-500', state: 'AP', icon: '📕', exams: '10th (SSC) & 12th (Inter)', notices: ['AP Board Inter results 2025'] },
  { name: 'Odisha Board (BSE)', desc: 'Board of Secondary Education, Odisha.', website: 'https://bseodisha.ac.in', color: 'from-sky-500 to-blue-500', state: 'Odisha', icon: '📗', exams: '10th (HSC) & 12th (CHSE)', notices: ['Odisha Board HSC result 2025'] },
  { name: 'Jharkhand Board (JAC)', desc: 'Jharkhand Academic Council (JAC) board exams.', website: 'https://jac.jharkhand.gov.in', color: 'from-green-500 to-lime-500', state: 'Jharkhand', icon: '📙', exams: '10th & 12th', notices: ['JAC 10th result 2025 declared'] },
  { name: 'Chhattisgarh Board (CGBSE)', desc: 'Chhattisgarh Board of Secondary Education.', website: 'https://cgbse.nic.in', color: 'from-fuchsia-500 to-violet-500', state: 'Chhattisgarh', icon: '📕', exams: '10th & 12th', notices: ['CGBSE result 2025 announced'] },
  { name: 'Uttarakhand Board (UBSE)', desc: 'Uttarakhand Board of School Education.', website: 'https://ubse.uk.gov.in', color: 'from-teal-500 to-cyan-500', state: 'Uttarakhand', icon: '📓', exams: '10th & 12th', notices: ['UK Board 2025 results'] },
  { name: 'Himachal Board (HPBOSE)', desc: 'Himachal Pradesh Board of School Education.', website: 'https://hpbose.org', color: 'from-indigo-500 to-violet-500', state: 'Himachal Pradesh', icon: '📔', exams: '10th & 12th', notices: ['HP Board result 2025'] },
];

// Board state visual meta — covers every state that appears in BOARD_EXAMS
const BOARD_STATE_META: Record<string, { label: string; color: string; gradient: string; logo: string; border: string; bg: string; badge: string }> = {
  National:    { label: 'National Boards',   color: 'text-blue-400',    gradient: 'from-blue-500/20 to-indigo-600/10',   logo: '/logos/delhi-logo.png',    border: 'border-blue-500/20',    bg: 'bg-blue-500/10',    badge: 'bg-blue-500/20 text-blue-400' },
  Bihar:       { label: 'Bihar',             color: 'text-orange-400',  gradient: 'from-orange-500/20 to-amber-600/10',  logo: '/logos/bihar-logo.png',    border: 'border-orange-500/20', bg: 'bg-orange-500/10', badge: 'bg-orange-500/20 text-orange-400' },
  Haryana:     { label: 'Haryana',           color: 'text-green-400',   gradient: 'from-green-500/20 to-emerald-600/10', logo: '/logos/haryana-logo.png',  border: 'border-green-500/20',  bg: 'bg-green-500/10',  badge: 'bg-green-500/20 text-green-400' },
  Delhi:       { label: 'Delhi',             color: 'text-red-400',     gradient: 'from-red-500/20 to-rose-600/10',     logo: '/logos/delhi-logo.png',    border: 'border-red-500/20',    bg: 'bg-red-500/10',    badge: 'bg-red-500/20 text-red-400' },
  UP:          { label: 'Uttar Pradesh',     color: 'text-teal-400',    gradient: 'from-teal-500/20 to-cyan-600/10',    logo: '/logos/up-logo.png',       border: 'border-teal-500/20',   bg: 'bg-teal-500/10',   badge: 'bg-teal-500/20 text-teal-400' },
  MP:          { label: 'Madhya Pradesh',    color: 'text-cyan-400',    gradient: 'from-cyan-500/20 to-teal-600/10',    logo: '',                         border: 'border-cyan-500/20',   bg: 'bg-cyan-500/10',   badge: 'bg-cyan-500/20 text-cyan-400' },
  Rajasthan:   { label: 'Rajasthan',         color: 'text-rose-400',    gradient: 'from-rose-500/20 to-red-600/10',     logo: '',                         border: 'border-rose-500/20',   bg: 'bg-rose-500/10',   badge: 'bg-rose-500/20 text-rose-400' },
  Gujarat:     { label: 'Gujarat',           color: 'text-amber-400',   gradient: 'from-amber-500/20 to-yellow-600/10', logo: '',                         border: 'border-amber-500/20',  bg: 'bg-amber-500/10',  badge: 'bg-amber-500/20 text-amber-400' },
  Maharashtra: { label: 'Maharashtra',       color: 'text-purple-400',  gradient: 'from-purple-500/20 to-violet-600/10',logo: '',                         border: 'border-purple-500/20',bg: 'bg-purple-500/10', badge: 'bg-purple-500/20 text-purple-400' },
  Karnataka:   { label: 'Karnataka',         color: 'text-pink-400',    gradient: 'from-pink-500/20 to-fuchsia-600/10', logo: '',                         border: 'border-pink-500/20',   bg: 'bg-pink-500/10',   badge: 'bg-pink-500/20 text-pink-400' },
  'Tamil Nadu':  { label: 'Tamil Nadu',      color: 'text-sky-400',     gradient: 'from-sky-500/20 to-cyan-600/10',     logo: '',                         border: 'border-sky-500/20',    bg: 'bg-sky-500/10',    badge: 'bg-sky-500/20 text-sky-400' },
  'West Bengal':{ label: 'West Bengal',     color: 'text-orange-400',  gradient: 'from-orange-500/20 to-red-600/10',   logo: '',                         border: 'border-orange-500/20',bg: 'bg-orange-500/10', badge: 'bg-orange-500/20 text-orange-400' },
  Kerala:      { label: 'Kerala',            color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-teal-600/10', logo: '',                         border: 'border-emerald-500/20',bg:'bg-emerald-500/10',badge:'bg-emerald-500/20 text-emerald-400' },
  Punjab:      { label: 'Punjab',            color: 'text-rose-400',    gradient: 'from-rose-500/20 to-pink-600/10',    logo: '',                         border: 'border-rose-500/20',   bg: 'bg-rose-500/10',   badge: 'bg-rose-500/20 text-rose-400' },
  Telangana:   { label: 'Telangana',         color: 'text-lime-400',    gradient: 'from-lime-500/20 to-green-600/10',   logo: '',                         border: 'border-lime-500/20',   bg: 'bg-lime-500/10',   badge: 'bg-lime-500/20 text-lime-400' },
  AP:          { label: 'Andhra Pradesh',    color: 'text-violet-400',  gradient: 'from-violet-500/20 to-purple-600/10',logo: '',                         border: 'border-violet-500/20',bg: 'bg-violet-500/10', badge: 'bg-violet-500/20 text-violet-400' },
  Odisha:      { label: 'Odisha',            color: 'text-sky-400',     gradient: 'from-sky-500/20 to-blue-600/10',     logo: '',                         border: 'border-sky-500/20',    bg: 'bg-sky-500/10',    badge: 'bg-sky-500/20 text-sky-400' },
  Jharkhand:   { label: 'Jharkhand',         color: 'text-green-400',   gradient: 'from-green-500/20 to-lime-600/10',  logo: '',                         border: 'border-green-500/20',  bg: 'bg-green-500/10',  badge: 'bg-green-500/20 text-green-400' },
  Chhattisgarh:{ label: 'Chhattisgarh',      color: 'text-fuchsia-400', gradient: 'from-fuchsia-500/20 to-violet-600/10',logo:'',                        border: 'border-fuchsia-500/20',bg:'bg-fuchsia-500/10',badge:'bg-fuchsia-500/20 text-fuchsia-400'},
  Uttarakhand: { label: 'Uttarakhand',       color: 'text-teal-400',    gradient: 'from-teal-500/20 to-cyan-600/10',    logo: '',                         border: 'border-teal-500/20',   bg: 'bg-teal-500/10',   badge: 'bg-teal-500/20 text-teal-400' },
  'Himachal Pradesh': { label: 'Himachal',   color: 'text-indigo-400',  gradient: 'from-indigo-500/20 to-violet-600/10',logo:'',                        border: 'border-indigo-500/20',bg:'bg-indigo-500/10',badge:'bg-indigo-500/20 text-indigo-400'},
};

// Default board state meta fallback
const DEFAULT_BOARD_STATE_META = { label: 'Other', color: 'text-gray-400', gradient: 'from-gray-500/20 to-gray-600/10', logo: '', border: 'border-white/5', bg: 'bg-white/5', badge: 'bg-white/10 text-gray-400' };

function getBoardStateMeta(state: string) {
  return BOARD_STATE_META[state] || DEFAULT_BOARD_STATE_META;
}

const NOTICE_CATEGORIES = ['All', 'Exam', 'Result', 'Admission', 'Holiday', 'Fee', 'Recruitment', 'Tender', 'Academic', 'Convocation', 'General', 'Notification', 'Circular', 'Syllabus', 'Workshop', 'Scholarship'];

const NAV_ITEMS: { key: ViewType; label: string; icon: React.ReactNode }[] = [
  { key: 'home', label: 'Home', icon: <HomeIcon className="w-4 h-4" /> },
  { key: 'universities', label: 'Universities', icon: <Building2 className="w-4 h-4" /> },
  { key: 'notices', label: 'Notices', icon: <FileText className="w-4 h-4" /> },
  { key: 'entrance', label: 'Entrance', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'board', label: 'Boards', icon: <Calendar className="w-4 h-4" /> },
];

const MOBILE_NAV_ITEMS: { key: ViewType; label: string; icon: React.ReactNode }[] = [
  { key: 'home', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
  { key: 'universities', label: 'Unis', icon: <Building2 className="w-5 h-5" /> },
  { key: 'notices', label: 'Notices', icon: <FileText className="w-5 h-5" /> },
  { key: 'entrance', label: 'Entrance', icon: <BookOpen className="w-5 h-5" /> },
  { key: 'board', label: 'Boards', icon: <Calendar className="w-5 h-5" /> },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function formatFullDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return '';
  }
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeReadTime(value: string, content: string): string {
  const numeric = Number((value || '').match(/\d+/)?.[0] || 0);
  if (numeric > 0) return `${numeric} min`;
  const words = normalizeSpaces(content).split(' ').filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 220));
  return `${mins} min`;
}

function deriveExcerpt(content: string, maxLen = 180): string {
  const plain = normalizeSpaces(
    content
      .replace(/^#+\s*/gm, '')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/[*_`>~-]/g, '')
  );
  if (!plain) return '';
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trimEnd()}...`;
}

function normalizeContentLayout(content: string): string {
  const cleaned = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned) return '';
  const hasMarkdownStructure = /(^#{1,6}\s)|(^[-*]\s)|(^\d+\.\s)/m.test(cleaned);
  if (hasMarkdownStructure) return cleaned;

  const paragraphized = cleaned
    .split(/\n+/)
    .map((part) => normalizeSpaces(part))
    .filter(Boolean)
    .join('\n\n');

  return paragraphized;
}

function normalizeTags(tags: string): string {
  const unique = Array.from(new Set(
    tags
      .split(',')
      .map((tag) => normalizeSpaces(tag))
      .filter(Boolean)
  ));
  return unique.join(', ');
}

function normalizeBlogInput(input: BlogFormInput): BlogFormInput {
  const content = normalizeContentLayout(input.content || '');
  const titleRaw = normalizeSpaces((input.title || '').replace(/^[^A-Za-z0-9]+/, ''));
  const title = titleRaw ? titleRaw.charAt(0).toUpperCase() + titleRaw.slice(1) : '';
  const excerptRaw = normalizeSpaces(input.excerpt || '');

  return {
    ...input,
    title,
    content,
    excerpt: excerptRaw || deriveExcerpt(content),
    author: normalizeSpaces(input.author || '') || 'Editorial Team',
    category: titleCase(normalizeSpaces(input.category || 'Education')),
    tags: normalizeTags(input.tags || ''),
    readTime: normalizeReadTime(input.readTime || '', content),
    coverImage: normalizeSpaces(input.coverImage || ''),
  };
}

function normalizeBlogPost(post: BlogPost): BlogPost {
  const normalized = normalizeBlogInput({
    title: post.title,
    excerpt: post.excerpt || '',
    content: post.content,
    coverImage: post.coverImage || '',
    author: post.author,
    tags: post.tags,
    category: post.category,
    readTime: post.readTime,
    isPublished: post.isPublished,
  });

  return {
    ...post,
    ...normalized,
    excerpt: normalized.excerpt || null,
    coverImage: normalized.coverImage || null,
  };
}

function getStateMeta(state: string) {
  return STATE_META[state] || STATE_META['Bihar'];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function Home() {
  /* ─── View State ─── */
  const [view, setView] = useState<ViewType>('home');
  const [prevView, setPrevView] = useState<ViewType>('home');

  /* ─── Data States ─── */
  const [universities, setUniversities] = useState<University[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [adminPosts, setAdminPosts] = useState<AdminPost[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [stateSummary, setStateSummary] = useState<StateSummary[]>([]);
  const [districtsByState, setDistrictsByState] = useState<Record<string, DistrictInfo[]>>({});
  const [allCategories, setAllCategories] = useState<string[]>([]);

  /* ─── Realtime ─── */
  const [rtNotifications, setRtNotifications] = useState<RealtimeNotification[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>('dark');
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  /* ─── Loading States ─── */
  const [loadingUniv, setLoadingUniv] = useState(false);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  /* ─── Filter States ─── */
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedUnivId, setSelectedUnivId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNoticeState, setSelectedNoticeState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [univSearch, setUnivSearch] = useState('');
  const [noticeSearch, setNoticeSearch] = useState('');
  const [boardStateFilter, setBoardStateFilter] = useState<string>('all');
  const [entranceStateFilter, setEntranceStateFilter] = useState<string>('All');
  const [entranceCategoryFilter, setEntranceCategoryFilter] = useState<string>('All');
  const [entranceLevelFilter, setEntranceLevelFilter] = useState<string>('All');
  const [entranceSearch, setEntranceSearch] = useState('');
  const [selectedEntranceExam, setSelectedEntranceExam] = useState<string | null>(null);

  /* ─── Admin State ─── */
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '', content: '', category: 'General', sourceUrl: '', imageUrl: '', isPinned: false,
  });
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  /* ─── Blog State ─── */
  const [blogForm, setBlogForm] = useState({
    title: '', excerpt: '', content: '', coverImage: '', author: 'Admin', tags: '', category: 'Education', readTime: '3 min', isPublished: false,
  });
  const [blogSubmitting, setBlogSubmitting] = useState(false);
  const [blogNormalizing, setBlogNormalizing] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);

  /* ─── UI State ─── */
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ─── PWA Install State ─── */
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [appInstalled, setAppInstalled] = useState(false);
  const [openDistricts, setOpenDistricts] = useState<Set<string>>(new Set());

  /* ─── Refs ─── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  /* ─── Debounced Search ─── */
  const debouncedUnivSearch = useDebounce(univSearch, 300);
  const debouncedNoticeSearch = useDebounce(noticeSearch, 300);

  /* ═══════════════════════════════════════════════════════════════
     COMPUTED VALUES
     ═══════════════════════════════════════════════════════════════ */

  const stateUniCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATES.forEach((s) => { counts[s] = 0; });
    stateSummary.forEach((s) => { counts[s.state] = s.count; });
    return counts;
  }, [stateSummary]);

  const filteredDistricts = useMemo(() => {
    if (selectedState === 'all') return [];
    // For UP, include ALL 75 districts
    if (selectedState === 'Uttar Pradesh') {
      const dbDistricts = (districtsByState['Uttar Pradesh'] || []).map(d => d.name);
      const allUp = [...new Set([...UP_ALL_DISTRICTS, ...dbDistricts])].sort();
      return allUp.map(name => {
        const found = (districtsByState['Uttar Pradesh'] || []).find(d => d.name === name);
        return { name, count: found?.count || 0 };
      });
    }
    return districtsByState[selectedState] || [];
  }, [selectedState, districtsByState]);

  const universitiesByStateAndDistrict = useMemo(() => {
    const filtered = universities.filter((u) => {
      if (selectedState !== 'all' && u.state !== selectedState) return false;
      if (selectedDistrict !== 'all' && u.district !== selectedDistrict) return false;
      if (selectedType !== 'all' && u.type !== selectedType) return false;
      if (debouncedUnivSearch) {
        const q = debouncedUnivSearch.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.shortName.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const grouped = new Map<string, { state: string; district: string; unis: University[] }[]>();
    const stateOrder = [...STATES.filter(s => selectedState === 'all' || s === selectedState)];

    stateOrder.forEach((state) => {
      const stateUnis = filtered.filter((u) => u.state === state);
      const byDistrict = new Map<string, University[]>();
      stateUnis.forEach((u) => {
        const key = u.district || 'Other';
        const existing = byDistrict.get(key) || [];
        existing.push(u);
        byDistrict.set(key, existing);
      });
      const districts: { state: string; district: string; unis: University[] }[] = [];
      byDistrict.forEach((unis, district) => {
        districts.push({ state, district, unis: unis.sort((a, b) => a.name.localeCompare(b.name)) });
      });
      if (districts.length > 0) {
        grouped.set(state, districts);
      }
    });
    return grouped;
  }, [universities, selectedState, selectedDistrict, selectedType, debouncedUnivSearch]);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      if (selectedNoticeState !== 'all' && n.university.state !== selectedNoticeState) return false;
      if (selectedUnivId !== 'all' && n.universityId !== selectedUnivId) return false;
      if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
      if (debouncedNoticeSearch) {
        const q = debouncedNoticeSearch.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !(n.description || '').toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime());
  }, [notices, selectedNoticeState, selectedUnivId, selectedCategory, debouncedNoticeSearch]);

  const latestNotices = useMemo(() => {
    return [...notices].sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime()).slice(0, 8);
  }, [notices]);

  const pinnedPosts = useMemo(() => adminPosts.filter((p) => p.isPinned && p.isActive), [adminPosts]);
  const activePosts = useMemo(() => adminPosts.filter((p) => !p.isPinned && p.isActive), [adminPosts]);

  const tickerItems = useMemo(() => {
    const items: { text: string; icon: string }[] = [];
    // Board notifications first (most relevant for students)
    const boardNotifs = rtNotifications.filter(n => n.title.startsWith('['));
    boardNotifs.slice(0, 8).forEach((n) => {
      items.push({ text: n.title, icon: n.category === 'Result' ? '📊' : n.category === 'Exam' ? '📝' : n.category === 'Admission' ? '🎓' : '📋' });
    });
    // Other real-time WebSocket notifications
    rtNotifications.filter(n => !n.title.startsWith('[')).slice(0, 6).forEach((n) => {
      const prefix = n.source ? `${n.source}: ` : '';
      items.push({ text: `${prefix}${n.title}`, icon: n.category === 'Exam' || n.category === 'Result' ? '🚨' : '🔴' });
    });
    // Pinned admin posts
    pinnedPosts.forEach((p) => items.push({ text: p.title, icon: '📌' }));
    // Latest DB notices
    notices.slice(0, 8).forEach((n) => items.push({ text: `${n.university.shortName}: ${n.title}`, icon: '🔔' }));
    return items;
  }, [rtNotifications, pinnedPosts, notices]);

  const filteredBoardExams = useMemo(() => {
    if (boardStateFilter === 'all') return BOARD_EXAMS;
    return BOARD_EXAMS.filter((b) => b.state === boardStateFilter || b.state === 'National');
  }, [boardStateFilter]);

  /* ═══════════════════════════════════════════════════════════════
     DATA FETCHERS
     ═══════════════════════════════════════════════════════════════ */

  const fetchUniversities = useCallback(async () => {
    try {
      setLoadingUniv(true);
      const res = await fetch('/api/universities');
      const data = await res.json();
      if (data.success) {
        setUniversities(data.data || []);
        setStateSummary(data.stateSummary || []);
        setDistrictsByState(data.districtsByState || {});
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
    } finally {
      setLoadingUniv(false);
    }
  }, []);

  const fetchNotices = useCallback(async () => {
    try {
      setLoadingNotices(true);
      const params = new URLSearchParams();
      if (selectedUnivId !== 'all') params.set('universityId', selectedUnivId);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedNoticeState !== 'all') params.set('state', selectedNoticeState);
      if (debouncedNoticeSearch) params.set('search', debouncedNoticeSearch);
      params.set('limit', '100');
      const res = await fetch(`/api/notices?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setNotices(data.data || []);
        if (data.categories) setAllCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoadingNotices(false);
    }
  }, [selectedUnivId, selectedCategory, selectedNoticeState, debouncedNoticeSearch]);

  const fetchAdminPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch('/api/admin/posts/public');
      const data = await res.json();
      if (data.success) setAdminPosts(data.data || []);
    } catch (err) {
      console.error('Error fetching admin posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const fetchAllAdminPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/posts?all=true');
      const data = await res.json();
      if (data.success) setAdminPosts(data.data || []);
    } catch (err) {
      console.error('Error fetching all admin posts:', err);
    }
  }, []);

  const fetchBlogPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/blog/posts/public');
      const data = await res.json();
      if (data.success) setBlogPosts((data.data || []).map((post: BlogPost) => normalizeBlogPost(post)));
    } catch (err) {
      console.error('Error fetching blog posts:', err);
    }
  }, []);

  const fetchAllBlogPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/blog/posts?all=true');
      const data = await res.json();
      if (data.success) setBlogPosts((data.data || []).map((post: BlogPost) => normalizeBlogPost(post)));
    } catch (err) {
      console.error('Error fetching all blog posts:', err);
    }
  }, []);

  const fetchLiveNotifications = useCallback(async (countUnread = false) => {
    try {
      const res = await fetch('/api/live-notifications?limit=50');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRtNotifications((prev) => {
          if (countUnread && prev.length > 0) {
            const prevIds = new Set(prev.map(n => n.id));
            const freshCount = data.data.filter((item: RealtimeNotification) => !prevIds.has(item.id)).length;
            if (freshCount > 0) setNotifCount((current) => current + freshCount);
          }

          const merged = [...data.data, ...prev];
          const seen = new Set<string>();
          return merged
            .filter((item: RealtimeNotification) => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            })
            .sort((a: RealtimeNotification, b: RealtimeNotification) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 60);
        });
      }
    } catch (err) {
      console.error('Error fetching live notifications:', err);
    }
  }, []);

  const checkAdmin = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/login');
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.authenticated === true);
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);

  /* ═══════════════════════════════════════════════════════════════
     ACTION HANDLERS
     ═══════════════════════════════════════════════════════════════ */

  const handleLogin = async () => {
    if (!adminEmail || !adminPassword) {
      toast.error('Email and password are required');
      return;
    }
    try {
      setAdminLoading(true);
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        toast.success('Logged in successfully');
        await fetchAllAdminPosts();
        await fetchAllBlogPosts();
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch {
      toast.error('Login failed');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      setIsAdmin(false);
      toast.success('Logged out');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      setPostSubmitting(true);
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Post created successfully');
        setPostForm({ title: '', content: '', category: 'General', sourceUrl: '', imageUrl: '', isPinned: false });
        await fetchAllAdminPosts();
        await fetchAdminPosts();
      } else {
        toast.error(data.message || 'Failed to create post');
      }
    } catch {
      toast.error('Failed to create post');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/posts?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Post deleted');
        await fetchAllAdminPosts();
        await fetchAdminPosts();
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const handlePinPost = async (id: string, isPinned: boolean) => {
    try {
      await fetch('/api/admin/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPinned }),
      });
      toast.success(isPinned ? 'Post pinned' : 'Post unpinned');
      await fetchAllAdminPosts();
      await fetchAdminPosts();
    } catch {
      toast.error('Pin toggle failed');
    }
  };

  const handleTogglePost = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });
      toast.success(isActive ? 'Post activated' : 'Post deactivated');
      await fetchAllAdminPosts();
    } catch {
      toast.error('Toggle failed');
    }
  };

  /* ─── Blog Handlers ─── */
  const handleBlogSubmit = async () => {
    try {
      setBlogSubmitting(true);
      const url = editingBlogId ? '/api/blog/posts' : '/api/blog/posts';
      const method = editingBlogId ? 'PUT' : 'POST';
      const normalizedForm = normalizeBlogInput(blogForm);
      const body = editingBlogId
        ? { id: editingBlogId, ...normalizedForm }
        : normalizedForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingBlogId ? 'Blog updated!' : 'Blog published!');
        setBlogForm({ title: '', excerpt: '', content: '', coverImage: '', author: 'Admin', tags: '', category: 'Education', readTime: '3 min', isPublished: false });
        setEditingBlogId(null);
        await fetchBlogPosts();
        await fetchAllBlogPosts();
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch {
      toast.error('Blog submit failed');
    } finally {
      setBlogSubmitting(false);
    }
  };

  const handleNormalizeAllBlogs = async () => {
    if (!isAdmin) {
      toast.error('Admin login required');
      return;
    }

    try {
      setBlogNormalizing(true);
      const listRes = await fetch('/api/blog/posts?all=true');
      const listData = await listRes.json();

      if (!listData.success) {
        toast.error(listData.message || 'Failed to fetch blog posts');
        return;
      }

      const allPosts: BlogPost[] = listData.data || [];
      if (allPosts.length === 0) {
        toast.message('No blog posts found to normalize');
        return;
      }

      let checked = 0;
      let updated = 0;
      let failed = 0;

      const tasks = allPosts.map(async (post) => {
        checked += 1;

        const normalized = normalizeBlogInput({
          title: post.title,
          excerpt: post.excerpt || '',
          content: post.content,
          coverImage: post.coverImage || '',
          author: post.author,
          tags: post.tags,
          category: post.category,
          readTime: post.readTime,
          isPublished: post.isPublished,
        });

        const nextTitle = normalized.title;
        const nextExcerpt = normalized.excerpt;
        const nextContent = normalized.content;
        const nextCoverImage = normalized.coverImage;
        const nextAuthor = normalized.author;
        const nextTags = normalized.tags;
        const nextCategory = normalized.category;
        const nextReadTime = normalized.readTime;

        const hasChanges =
          nextTitle !== normalizeSpaces(post.title) ||
          nextExcerpt !== normalizeSpaces(post.excerpt || '') ||
          nextContent !== normalizeContentLayout(post.content) ||
          nextCoverImage !== normalizeSpaces(post.coverImage || '') ||
          nextAuthor !== normalizeSpaces(post.author) ||
          nextTags !== normalizeTags(post.tags || '') ||
          nextCategory !== titleCase(normalizeSpaces(post.category || 'Education')) ||
          nextReadTime !== normalizeReadTime(post.readTime || '', post.content);

        if (!hasChanges) return;

        const res = await fetch('/api/blog/posts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: post.id,
            title: nextTitle,
            excerpt: nextExcerpt,
            content: nextContent,
            coverImage: nextCoverImage,
            author: nextAuthor,
            tags: nextTags,
            category: nextCategory,
            readTime: nextReadTime,
            isPublished: post.isPublished,
            isActive: post.isActive,
          }),
        });

        if (res.ok) updated += 1;
        else failed += 1;
      });

      await Promise.all(tasks);
      await fetchBlogPosts();
      await fetchAllBlogPosts();

      if (updated === 0 && failed === 0) {
        toast.success(`All ${checked} posts are already in professional format`);
      } else if (failed === 0) {
        toast.success(`Normalized ${updated} posts successfully`);
      } else {
        toast.error(`Normalized ${updated} posts, ${failed} failed`);
      }
    } catch {
      toast.error('Bulk normalization failed');
    } finally {
      setBlogNormalizing(false);
    }
  };

  const handleEditBlog = (post: BlogPost) => {
    setEditingBlogId(post.id);
    setBlogForm({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      author: post.author,
      tags: post.tags,
      category: post.category,
      readTime: post.readTime,
      isPublished: post.isPublished,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleBlogPublish = async (id: string, isPublished: boolean) => {
    try {
      await fetch('/api/blog/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPublished }),
      });
      toast.success(isPublished ? 'Blog published!' : 'Blog unpublished');
      await fetchBlogPosts();
      await fetchAllBlogPosts();
    } catch {
      toast.error('Toggle failed');
    }
  };

  const handleDeleteBlog = async (id: string) => {
    try {
      await fetch(`/api/blog/posts?id=${id}`, { method: 'DELETE' });
      toast.success('Blog deleted');
      await fetchBlogPosts();
      await fetchAllBlogPosts();
    } catch {
      toast.error('Delete failed');
    }
  };

  const scrollToAdminSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleScrape = async () => {
    try {
      setScraping(true);
      toast.info('Scraping latest notifications...');
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: '2025', bulk: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await Promise.all([fetchUniversities(), fetchNotices(), fetchLiveNotifications(true)]);
      } else {
        toast.error(data.message || 'Scraping failed');
      }
    } catch {
      toast.error('Scraping failed. Please try again.');
    } finally {
      setScraping(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, GIF images allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setPostForm((prev) => ({ ...prev, imageUrl: data.url }));
        toast.success('Image uploaded');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ─── PWA Install Handler ─── */
  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('🎉 App installing...');
      setAppInstalled(true);
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    setInstallDismissed(true);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  };

  /* ═══════════════════════════════════════════════════════════════
     VIEW SWITCHING
     ═══════════════════════════════════════════════════════════════ */

  const switchView = useCallback((newView: ViewType) => {
    setPrevView(view);
    setView(newView);
    setMobileMenuOpen(false);
    setShowNotifDropdown(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const handleUnivClick = useCallback((uni: University) => {
    setSelectedUnivId(uni.id);
    setSelectedNoticeState('all');
    setSelectedCategory('all');
    setNoticeSearch('');
    switchView('notices');
  }, [switchView]);

  const lastScrapeTime = useRef<number>(0);
  const SCRAPE_COOLDOWN = 45000; // 45 seconds cooldown between user scrapes
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // Detect initial theme preference + listen for system changes
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      setThemeMode(saved);
    } else {
      setThemeMode('dark');
    }
    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const current = localStorage.getItem('theme');
      if (!current || current === 'system') {
        setThemeMode('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleScrapeUniversity = useCallback(async (uniId: string) => {
    if (scraping || cooldownSeconds > 0) return;

    // Local cooldown check
    const now = Date.now();
    const timeSinceLastScrape = now - lastScrapeTime.current;
    if (timeSinceLastScrape < SCRAPE_COOLDOWN) {
      const waitSec = Math.ceil((SCRAPE_COOLDOWN - timeSinceLastScrape) / 1000);
      toast.warning(`${waitSec} second rukiye, phir try karein`);
      return;
    }

    try {
      setScraping(true);
      lastScrapeTime.current = now;
      setScrapeProgress('🔍 Latest notifications dhundh rahe hain...');
      const uni = universities.find(u => u.id === uniId);
      const uniName = uni?.shortName || uni?.name || 'University';

      // First check server-side cooldown status
      try {
        const statusRes = await fetch(`/api/scrape/university/${encodeURIComponent(uniId)}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.cooldownActive && statusData.cooldownMinutes > 0) {
            setScraping(false);
            toast.warning(`API cooldown mein hai! ${statusData.cooldownMinutes} minute baad try karein.`);
            setScrapeProgress(`⏳ API cooldown mein hai — ${statusData.cooldownMinutes} minute baad available hoga`);
            // Start cooldown countdown
            setCooldownSeconds(statusData.cooldownRemaining / 1000);
            cooldownTimerRef.current = setInterval(() => {
              setCooldownSeconds(prev => {
                if (prev <= 1) {
                  if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
                  setScrapeProgress('');
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            setTimeout(() => setScrapeProgress(''), 10000);
            return;
          }
        }
      } catch (_) { /* ignore status check failure, proceed with scrape */ }

      // Use AbortController with 120s timeout (server retries can take up to 45s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      setScrapeProgress('🌐 API se search kar rahe hain...');
      const res = await fetch(`/api/scrape/university/${encodeURIComponent(uniId)}`, {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (data.success) {
        if (data.newNotices > 0) {
          toast.success(`${uniName}: ${data.newNotices} naye notices mile! ✅`);
          setScrapeProgress(`${uniName}: ✅ ${data.newNotices} naye notifications mile!`);
        } else {
          toast.info(`${uniName}: Sab up to date hai! ✓`);
          setScrapeProgress(`${uniName}: ✅ Sab notifications up to date hain`);
        }
        // Refresh notices & universities
        await Promise.all([fetchNotices(), fetchUniversities(), fetchLiveNotifications(true)]);
      } else if (data.cooldownActive || data.rateLimited) {
        const mins = data.cooldownMinutes || 10;
        toast.warning(`API limit full! ${mins} minute baad try karein.`);
        setScrapeProgress(`⏳ API limit full hai — ${mins} minute baad available hoga`);
        // Start cooldown countdown
        setCooldownSeconds(mins * 60);
        cooldownTimerRef.current = setInterval(() => {
          setCooldownSeconds(prev => {
            if (prev <= 1) {
              if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
              setScrapeProgress('');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(`${uniName}: ${data.message || 'Scraping failed'}`);
        setScrapeProgress(`${uniName}: ❌ ${data.message || 'Failed'}`);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        toast.error('Scrape time out ho gaya. Dobara try karein.');
        setScrapeProgress('⏱️ Request time out — dobara try karein');
      } else {
        toast.error('Scraping fail ho gaya. Dobara try karein.');
        setScrapeProgress('❌ Connection fail — internet check karein');
      }
    } finally {
      setScraping(false);
      if (!cooldownSeconds) {
        setTimeout(() => setScrapeProgress(''), 6000);
      }
    }
  }, [scraping, universities, fetchNotices, fetchUniversities, fetchLiveNotifications, cooldownSeconds]);

  /* ═══════════════════════════════════════════════════════════════
     EFFECTS
     ═══════════════════════════════════════════════════════════════ */

  // Initial data load
  useEffect(() => {
    const init = async () => {
      try { await fetch('/api/seed'); } catch { /* ignore */ }
      await Promise.all([
        fetchUniversities(),
        fetchNotices(),
        fetchAdminPosts(),
        fetchBlogPosts(),
        fetchLiveNotifications(),
        checkAdmin(),
      ]);
      setInitialized(true);
    };
    init();
  }, [fetchUniversities, fetchNotices, fetchAdminPosts, fetchBlogPosts, fetchLiveNotifications, checkAdmin]);

  useEffect(() => {
    const liveTimer = setInterval(() => {
      fetchLiveNotifications(true);
    }, 60000);
    return () => clearInterval(liveTimer);
  }, [fetchLiveNotifications]);

  // Refetch notices when filters change
  useEffect(() => {
    if (initialized) fetchNotices();
  }, [selectedUnivId, selectedCategory, selectedNoticeState, debouncedNoticeSearch, initialized, fetchNotices]);

  // Scroll effects
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Admin URL detection
  useEffect(() => {
    const checkAdminRoute = () => {
      if (window.location.pathname === '/admin' || window.location.pathname.endsWith('/admin')) {
        setView('admin');
      }
    };
    checkAdminRoute();
  }, []);

  // PWA: Service Worker Registration + Install Prompt
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const userAgent = navigator.userAgent || '';
    const isAndroid = /Android/i.test(userAgent);
    const isMobileBrowser = /Mobi|iPhone|iPad|iPod/i.test(userAgent);
    const isTouchMobile = navigator.maxTouchPoints > 0
      && window.matchMedia('(max-width: 820px)').matches;
    const canShowMobileInstallPrompt = isAndroid || isMobileBrowser || isTouchMobile;

    if (!canShowMobileInstallPrompt) {
      return;
    }

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (isStandalone) {
      queueMicrotask(() => setAppInstalled(true));
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursPassed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursPassed < 48) return; // Don't show for 48 hours after dismiss
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto-show banner after 3 seconds
      setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      setAppInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // WebSocket connection
  useEffect(() => {
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setWsConnected(true);
    });

    socket.on('disconnect', () => {
      setWsConnected(false);
    });

    // Receive historical notifications on connect
    socket.on('recent-notifications', (data: RealtimeNotification[]) => {
      if (Array.isArray(data) && data.length > 0) {
        setRtNotifications((prev) => {
          const existingIds = new Set(prev.map(n => n.id));
          const newItems = data.filter(n => !existingIds.has(n.id));
          return [...newItems, ...prev].slice(0, 50);
        });
        setNotifCount((prev) => prev + data.length);
      }
    });

    // Receive new notifications in real-time
    socket.on('new-notification', (data: RealtimeNotification) => {
      setRtNotifications((prev) => [data, ...prev].slice(0, 50));
      setNotifCount((prev) => prev + 1);

      // Show toast with category-specific styling
      const catEmoji: Record<string, string> = {
        Result: '📊', Exam: '📝', Admission: '🎓', Holiday: '🏖️',
        Fee: '💰', Recruitment: '💼', Notification: '🔔', General: '📋',
      };
      const emoji = catEmoji[data.category] || '🔔';
      toast.info(`${emoji} ${data.title}`, {
        description: data.message.slice(0, 120),
        duration: 5000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ═══════════════════════════════════════════════════════════════
     RENDER: NAVIGATION BAR
     ═══════════════════════════════════════════════════════════════ */

  const renderNavBar = () => (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-strong-scrolled' : 'glass-strong'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15 sm:h-17">
          {/* Logo */}
          <button onClick={() => switchView('home')} className="brand-logo group flex items-center gap-2.5 shrink-0">
            <div className="brand-logo-mark w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="brand-logo-title text-base font-bold tracking-tight text-white leading-tight">UniUpdates</h1>
              <p className="brand-logo-sub text-[10px] tracking-wide text-white/40 leading-tight">All University Updates</p>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => switchView(item.key)}
                className={`nav-link px-3.5 py-2 text-[15px] font-semibold rounded-lg transition-all ${
                  view === item.key
                    ? 'active text-cyan-400 bg-white/5'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">
            {/* WebSocket Status */}
            <div className="hidden sm:flex items-center gap-1 mr-1" title={wsConnected ? 'Live connected' : 'Reconnecting...'}>
              {wsConnected ? (
                <Wifi className="w-3 h-3 text-emerald-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-white/20" />
              )}
            </div>

            {/* Theme Toggle */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const current = document.documentElement.classList.contains('dark') ? 'dark' : 
                                 document.documentElement.classList.contains('light') ? 'light' : 'system';
                  let next = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
                  if (next === 'system') {
                    localStorage.removeItem('theme');
                    document.documentElement.classList.remove('dark', 'light');
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) document.documentElement.classList.add('dark');
                  } else {
                    localStorage.setItem('theme', next);
                    document.documentElement.classList.remove('dark', 'light');
                    document.documentElement.classList.add(next === 'dark' ? 'dark' : 'light');
                  }
                  setThemeMode(next);
                }}
                className="text-white/60 hover:text-white hover:bg-white/10 h-10 w-10"
                title="Toggle theme"
              >
                {themeMode === 'dark' ? <Moon className="w-4 h-4" /> : 
                 themeMode === 'light' ? <Sun className="w-4 h-4" /> : 
                 <Monitor className="w-4 h-4" />}
              </Button>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-white/20 whitespace-nowrap capitalize">{themeMode}</span>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifDropdownRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setShowNotifDropdown(!showNotifDropdown); setNotifCount(0); }}
                className="text-white/60 hover:text-white hover:bg-white/10 relative h-10 w-10"
              >
                <Bell className="w-5 h-5" />
                {(notifCount > 0 || rtNotifications.length > 0) && (
                  <span className={`absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow-lg ${
                    notifCount > 0
                      ? 'bg-linear-to-r from-red-500 to-orange-500 shadow-red-500/40 animate-bounce'
                      : 'bg-white/15 text-white/50'
                  }`}>
                    {notifCount > 99 ? '99+' : notifCount || rtNotifications.length}
                  </span>
                )}
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-linear-to-r from-red-500 to-orange-500 animate-ping opacity-30" />
                )}
              </Button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-[calc(100vw-1rem)] max-w-104 sm:w-105 glass-strong-scrolled rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <span className="text-white text-base font-bold">Notifications</span>
                          {notifCount > 0 && (
                            <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-linear-to-r from-red-500 to-orange-500 text-white">
                              {notifCount} NEW
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifCount(0)}
                        className="text-cyan-400 text-[11px] font-medium hover:text-cyan-300 transition-colors"
                      >
                        {rtNotifications.length > 0 ? 'Mark read' : ''}
                      </button>
                    </div>
                    <ScrollArea className="max-h-100">
                      {rtNotifications.length === 0 ? (
                        <div className="p-10 text-center">
                          <Bell className="w-10 h-10 text-white/10 mx-auto mb-3" />
                          <p className="text-white/30 text-sm">No notifications yet</p>
                          <p className="text-white/20 text-xs mt-1">Stay tuned for real-time updates!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {rtNotifications.slice(0, 20).map((notif) => (
                            <div
                              key={notif.id}
                              className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                              onClick={() => {
                                if (notif.url) window.open(notif.url, '_blank');
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl ${notif.title.startsWith('[') ? 'bg-linear-to-br from-emerald-500/20 to-cyan-500/20' : 'bg-linear-to-br from-cyan-500/20 to-purple-500/20'} flex items-center justify-center shrink-0 mt-0.5`}>
                                  {notif.title.startsWith('[') ? (
                                    <BookOpen className="w-5 h-5 text-emerald-400" />
                                  ) : (
                                    <Megaphone className="w-5 h-5 text-cyan-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {notif.title.startsWith('[') ? (
                                    <>
                                      <p className="text-emerald-400/80 text-xs font-semibold">{notif.source}</p>
                                      <p className="text-white text-sm font-semibold line-clamp-2 mt-0.5">{notif.title.replace(/^\[.*?\]\s*/, '')}</p>
                                    </>
                                  ) : (
                                    <p className="text-white text-sm font-semibold line-clamp-2">{notif.title}</p>
                                  )}
                                  <p className="text-white/40 text-xs mt-1 line-clamp-2">{notif.message}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    {notif.state && (
                                      <Badge className={`text-[10px] px-2 py-0.5 ${getBoardStateMeta(notif.state).badge}`}>
                                        {notif.state}
                                      </Badge>
                                    )}
                                    {notif.category && (
                                      <Badge className={`text-[10px] px-2 py-0.5 ${CAT_COLORS[notif.category] || CAT_COLORS.Notification}`}>
                                        {notif.category}
                                      </Badge>
                                    )}
                                    <span className="text-white/20 text-[10px]">{formatDate(notif.timestamp)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scrape Button (desktop) */}
            <Button
              size="sm"
              onClick={handleScrape}
              disabled={scraping}
              className="hidden sm:flex bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-xs shadow-lg shadow-cyan-500/20 border-0 h-8"
            >
              {scraping ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
              Scrape
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-72 backdrop-blur-xl app-glass p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="brand-logo-mark w-9 h-9 rounded-xl bg-linear-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="brand-logo-title text-sm font-bold text-white">UniUpdates</h2>
                        <p className="brand-logo-sub text-[10px] text-white/40">All University Updates</p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-3 space-y-1">
                    {NAV_ITEMS.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => switchView(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          view === item.key
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </nav>
                  <div className="p-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      {wsConnected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-white/20" />}
                      <span>{wsConnected ? 'Live connected' : 'Reconnecting...'}</span>
                    </div>
                    <Button
                      onClick={handleScrape}
                      disabled={scraping}
                      className="w-full bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 text-sm"
                    >
                      {scraping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                      Scrape Now
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER: MARQUEE TICKER
     ═══════════════════════════════════════════════════════════════ */

  const renderMarquee = () => {
    // Always show marquee — with default items if no data
    const items = tickerItems.length > 0 ? tickerItems : [
      { text: '🎓 Welcome to UniUpdates — All University Notices at One Place!', icon: '📢' },
      { text: '📋 Check Latest Exam Results, Admissions & Board Updates', icon: '🔍' },
      { text: '🏛️ Bihar • Haryana • Delhi • Uttar Pradesh — 125+ Universities', icon: '📍' },
      { text: '📝 24 Education Boards • 77 Entrance Exams • Real-time Updates', icon: '📚' },
    ];
    const doubled = [...items, ...items];
    return (
      <motion.div
        animate={scrolled ? { y: -44, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-14 sm:top-16 left-0 right-0 z-40 ticker-bar ${scrolled ? 'pointer-events-none' : ''}`}
      >
        <div className="ticker-bar-inner">
          <div className="relative overflow-hidden h-9 flex items-center">
            {/* LIVE badge */}
            <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-2 pr-1 ticker-fade-left">
              <span className="relative flex h-5 w-10 items-center justify-center rounded-full bg-red-500/90 text-white text-[9px] font-bold tracking-wider shadow-lg shadow-red-500/30">
                LIVE
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-300 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-300" />
              </span>
            </div>
            {/* Fade right */}
            <div className="ticker-fade-right absolute right-0 top-0 bottom-0 z-10" />
            <div className="marquee-track pl-14">
              {doubled.map((item, i) => (
                <div key={i} className="ticker-item" onClick={() => switchView('notices')}>
                  <span className="ticker-dot" />
                  <span className="ticker-icon">{item.icon}</span>
                  <span className="ticker-text">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER: BOTTOM MOBILE NAV
     ═══════════════════════════════════════════════════════════════ */

  const renderBottomNav = () => (
    <motion.div
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-strong-scrolled safe-area-bottom"
    >
      <nav className="flex items-center justify-around h-15 max-w-lg mx-auto px-2">
        {MOBILE_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => switchView(item.key)}
            className={`flex-1 max-w-20 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
              view === item.key
                ? 'text-cyan-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        ))}
      </nav>
    </motion.div>
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER: HOME VIEW
     ═══════════════════════════════════════════════════════════════ */

  const renderHomeView = () => (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-5 pt-6 sm:pt-10"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/50"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {wsConnected ? 'Live Updates' : 'Connecting...'}
        </motion.div>
        <h1 className="text-3xl sm:text-6xl lg:text-7xl tracking-tight font-extrabold leading-tight">
          <span className="bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            All University
          </span>
          <br />
          <span className="text-white">Updates</span>
        </h1>
        <p className="text-white/40 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Latest notices, exam schedules, results & admissions from{' '}
          <span className="text-cyan-400 font-medium">{universities.length}+ universities</span>{' '}
          across Bihar, Haryana, Delhi & UP
        </p>
      </motion.div>

      {/* ═══ Admin Posts / Announcements Section — RIGHT AFTER HERO ═══ */}
      {adminPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">📢 Latest Announcements</h3>
                <p className="text-white/30 text-xs">Official updates • {adminPosts.length} posts</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[11px] font-semibold">Live</span>
            </div>
          </div>

          {/* Horizontal scrolling post cards */}
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
            {[...pinnedPosts, ...activePosts].slice(0, 8).map((post, i) => {
              const isPinned = post.isPinned && post.isActive;
              const catIcon = post.category === 'Result' ? '📊' : post.category === 'Admission' ? '🎓' : post.category === 'Scholarship' ? '💰' : post.category === 'Exam' ? '📝' : '📋';
              const catGradient = post.category === 'Result' ? 'from-emerald-500/20 to-green-500/10 border-emerald-500/20' :
                                  post.category === 'Admission' ? 'from-cyan-500/20 to-blue-500/10 border-cyan-500/20' :
                                  post.category === 'Scholarship' ? 'from-yellow-500/20 to-amber-500/10 border-yellow-500/20' :
                                  post.category === 'Exam' ? 'from-red-500/20 to-pink-500/10 border-red-500/20' :
                                  'from-purple-500/20 to-violet-500/10 border-purple-500/20';
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ scale: 1.03, y: -3 }}
                  className="shrink-0 w-[86vw] max-w-84 sm:w-85 snap-start group cursor-default"
                >
                  <div className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${catGradient} border backdrop-blur-md h-full`}>
                    {/* Shimmer */}
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/3 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {/* Pinned indicator */}
                    {isPinned && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 z-10">
                        <Pin className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-amber-400 text-[9px] font-bold">Pinned</span>
                      </div>
                    )}
                    <div className="relative p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-xl group-hover:scale-110 transition-transform duration-300">
                          {catIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold text-sm leading-snug line-clamp-2">{post.title}</h4>
                          {post.content && (
                            <p className="text-white/40 text-xs mt-1.5 leading-relaxed line-clamp-2">{post.content}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <Badge className={`text-[10px] px-1.5 py-0.5 ${CAT_COLORS[post.category] || CAT_COLORS.General}`}>
                              {post.category}
                            </Badge>
                            <span className="text-white/20 text-[10px]">{formatDate(post.createdAt)}</span>
                            {post.sourceUrl && (
                              <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400/70 text-[10px] hover:text-cyan-400 hover:underline flex items-center gap-0.5 transition-colors ml-auto">
                                Visit <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Student Help Info Strip */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { icon: '🎯', title: 'Exam Updates', desc: 'Get instant alerts for exam dates, admit cards, syllabus changes & result announcements from all universities.' },
          { icon: '🎓', title: 'Admission Alerts', desc: 'Never miss admission deadlines — form dates, counselling schedules, merit lists & seat allotment updates.' },
          { icon: '📋', title: 'Board Results', desc: 'Stay updated with Bihar Board (BSEB), CBSE, and all state board results, compartment exams & marksheet info.' },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="glass-card rounded-xl p-5 border border-white/5 hover:border-cyan-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5 group cursor-default"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
              <div>
                <h3 className="text-white font-semibold text-base">{item.title}</h3>
                <p className="text-white/35 text-sm mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* State Prism Boxes — Bigger & Attractive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {STATES.map((state, idx) => {
          const meta = STATE_META[state];
          return (
            <motion.div
              key={state}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.08 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSelectedState(state); switchView('universities'); }}
              className="cursor-pointer"
            >
              <div className="prism-box">
                <div className={`prism-inner glass-card rounded-3xl p-5 sm:p-7 min-h-48 sm:min-h-56 flex flex-col items-center justify-center gap-3 sm:gap-4 border ${meta.border}`}>
                  <div className="prism-rainbow rounded-3xl" />
                  <div className="prism-shine rounded-3xl" />
                  <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
                    {/* Circular logo with glow hover */}
                    <div className={`group w-16 h-16 sm:w-22 sm:h-22 rounded-full bg-linear-to-br ${meta.gradient} flex items-center justify-center ring-2 ring-white/10 hover:ring-white/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10`} style={{ '--tw-ring-color': 'rgba(255,255,255,0.15)' } as React.CSSProperties}>
                      <img src={meta.logo} alt={meta.label} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover transition-all duration-300 group-hover:scale-[1.5] group-hover:shadow-xl group-hover:shadow-black/40" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-lg sm:text-xl">{meta.label}</p>
                      <p className={`text-sm sm:text-base mt-1 ${meta.color} font-semibold`}>{stateUniCounts[state] || 0} Universities</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Universities', value: universities.length, icon: <Building2 className="w-4 h-4" />, color: 'text-cyan-400' },
          { label: 'Notices', value: notices.length, icon: <FileText className="w-4 h-4" />, color: 'text-purple-400' },
          { label: 'States', value: STATES.length, icon: <MapPin className="w-4 h-4" />, color: 'text-pink-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
          >
            <Card className="glass-card rounded-xl border border-white/5">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/5 flex items-center justify-center ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-white font-bold text-2xl sm:text-3xl leading-tight">{stat.value}</p>
                    <p className="text-white/35 text-xs sm:text-sm">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Latest Notices */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-white font-semibold text-base">Latest Notices</h3>
          </div>
          <button
            onClick={() => switchView('notices')}
            className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
          >
            View all &rarr;
          </button>
        </div>
        {loadingNotices ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {latestNotices.map((notice, i) => {
              const stateMeta = getStateMeta(notice.university.state);
              return (
                <motion.div
                  key={notice.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="glass-card focus-card notice-item-card rounded-lg overflow-hidden hover:bg-white/8 transition-all border border-white/5 cursor-pointer group"
                    onClick={() => {
                      if (notice.sourceUrl) window.open(notice.sourceUrl, '_blank');
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{ backgroundColor: notice.university.color + '20' }}>
                          {notice.university.logo || notice.university.shortName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {notice.isImportant && <span className="text-red-400 text-[10px]">!</span>}
                            <Badge className={`text-[9px] px-1.5 py-0 ${CAT_COLORS[notice.category] || CAT_COLORS.General}`}>
                              {notice.category}
                            </Badge>
                            <Badge className={`text-[9px] px-1.5 py-0 ${stateMeta.badge}`}>
                              {notice.university.state === 'Uttar Pradesh' ? 'UP' : notice.university.state}
                            </Badge>
                          </div>
                          <p className="focus-title text-white/95 text-xs font-semibold line-clamp-2 transition-colors">{notice.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="focus-meta text-white/55 text-[10px]">{notice.university.shortName}</span>
                            <span className="focus-meta text-white/40 text-[10px]">{formatDate(notice.datePublished)}</span>
                            {notice.sourceUrl && (
                              <ExternalLink className="focus-icon w-2.5 h-2.5 text-white/45 transition-colors ml-auto" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Blog Posts Section ═══ */}
      {blogPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                <Newspaper className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Blog & Articles</h3>
                <p className="text-white/30 text-[10px]">Helpful guides & tips for students</p>
              </div>
            </div>
          </div>

          {/* Featured post (first) + grid */}
          <div className="space-y-4">
            {blogPosts[0] && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                className="group cursor-pointer"
                onClick={() => setSelectedBlogPost(blogPosts[0])}
              >
                <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-white/10 backdrop-blur-md">
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/2 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row gap-4">
                    {blogPosts[0].coverImage ? (
                      <img src={blogPosts[0].coverImage} alt="" className="w-full sm:w-40 h-28 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-full sm:w-40 h-28 rounded-xl bg-linear-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                        <span className="text-4xl">📰</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-pink-500/20 text-pink-400 border border-pink-500/10 text-[10px]">{blogPosts[0].category}</Badge>
                        <span className="text-white/25 text-[10px]">{blogPosts[0].readTime} read</span>
                        <span className="text-white/20 text-[10px]">{blogPosts[0].views} views</span>
                      </div>
                      <h4 className="text-white font-bold text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-pink-300 transition-colors">{blogPosts[0].title}</h4>
                      {blogPosts[0].excerpt && (
                        <p className="text-white/40 text-xs mt-1.5 leading-relaxed line-clamp-2">{blogPosts[0].excerpt}</p>
                      )}
                      <div className="flex items-center justify-between gap-2 mt-3">
                        <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white/30 text-[10px]">By {blogPosts[0].author}</span>
                        <span className="text-white/15 text-[10px]">•</span>
                        <span className="text-white/20 text-[10px]">{formatDate(blogPosts[0].createdAt)}</span>
                        </div>
                        <span className="text-pink-300 text-[11px] font-medium">Read article</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Blog grid — remaining posts */}
            {blogPosts.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {blogPosts.slice(1).map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedBlogPost(post)}
                  >
                    <div className="glass-card rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/5 h-full">
                      {post.coverImage ? (
                        <img src={post.coverImage} alt="" className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-linear-to-br from-pink-500/10 to-purple-500/10 flex items-center justify-center">
                          <span className="text-3xl">📄</span>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-white/5 text-white/50 border border-white/5 text-[9px]">{post.category}</Badge>
                          <span className="text-white/20 text-[9px]">{post.readTime}</span>
                        </div>
                        <h4 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-pink-300 transition-colors">{post.title}</h4>
                        {post.excerpt && (
                          <p className="text-white/30 text-[11px] mt-1.5 line-clamp-2">{post.excerpt}</p>
                        )}
                        <div className="flex items-center justify-between mt-3 gap-2">
                          <span className="text-white/20 text-[10px]">{formatDate(post.createdAt)}</span>
                          <span className="text-white/20 text-[10px]">{post.views} views</span>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-end">
                          <span className="text-pink-300/90 text-[11px] font-medium">Read article</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Entrance Exams', view: 'entrance' as ViewType, icon: '📐', color: 'from-blue-500/20 to-cyan-500/20' },
          { label: 'Board Exams', view: 'board' as ViewType, icon: '📝', color: 'from-amber-500/20 to-orange-500/20' },
          { label: 'All Universities', view: 'universities' as ViewType, icon: '🏫', color: 'from-purple-500/20 to-violet-500/20' },
          { label: 'All Notices', view: 'notices' as ViewType, icon: '📄', color: 'from-emerald-500/20 to-green-500/20' },
        ].map((link, i) => (
          <motion.div
            key={link.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Card
              className="glass-card rounded-xl overflow-hidden cursor-pointer hover:bg-white/6 transition-colors border border-white/5"
              onClick={() => switchView(link.view)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${link.color} flex items-center justify-center text-lg`}>
                  {link.icon}
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">{link.label}</p>
                  <p className="text-white/25 text-[10px]">Explore &rarr;</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER: UNIVERSITIES VIEW
     ═══════════════════════════════════════════════════════════════ */

  const renderUniversitiesView = () => {
    const totalFiltered = Array.from(universitiesByStateAndDistrict.values()).reduce(
      (acc, districts) => acc + districts.reduce((dAcc, d) => dAcc + d.unis.length, 0), 0
    );

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => switchView('home')} className="text-white/40 hover:text-white hover:bg-white/10 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Universities</h2>
            <p className="text-white/35 text-xs">{universities.length} universities registered &middot; {totalFiltered} shown</p>
          </div>
        </div>

        {/* State Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => { setSelectedState('all'); setSelectedDistrict('all'); }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedState === 'all'
                ? 'bg-linear-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            All ({universities.length})
          </button>
          {STATES.map((state) => {
            const meta = STATE_META[state];
            const count = stateUniCounts[state] || 0;
            return (
              <button
                key={state}
                onClick={() => { setSelectedState(state); setSelectedDistrict('all'); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedState === state
                    ? `${meta.bg} ${meta.color} ring-1 ${meta.border}`
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                }`}
              >
                <span className="hidden sm:inline">{state === 'Uttar Pradesh' ? 'UP' : state}</span>
                <span className="sm:hidden">{meta.label}</span>
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="glass-card rounded-xl border border-white/5">
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <Input
                  placeholder="Search universities by name..."
                  value={univSearch}
                  onChange={(e) => setUnivSearch(e.target.value)}
                  className="pl-9 h-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 rounded-lg"
                />
              </div>
              {/* District Filter */}
              {filteredDistricts.length > 0 && (
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9 rounded-lg w-full sm:w-44">
                    <SelectValue placeholder="District" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {filteredDistricts.map((d) => (
                      <SelectItem key={d.name} value={d.name}>{d.name} ({d.count})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9 rounded-lg w-full sm:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(TYPE_COLORS).map(([type]) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Active Filters */}
            {(selectedDistrict !== 'all' || selectedType !== 'all' || univSearch) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-white/25 text-[10px] mr-1">Active:</span>
                {selectedDistrict !== 'all' && (
                  <button onClick={() => setSelectedDistrict('all')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] hover:bg-white/15">
                    {selectedDistrict} <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {selectedType !== 'all' && (
                  <button onClick={() => setSelectedType('all')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] hover:bg-white/15">
                    {selectedType} <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {univSearch && (
                  <button onClick={() => setUnivSearch('')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] hover:bg-white/15">
                    &ldquo;{univSearch}&rdquo; <X className="w-2.5 h-2.5" />
                  </button>
                )}
                <button onClick={() => { setSelectedDistrict('all'); setSelectedType('all'); setUnivSearch(''); }} className="text-cyan-400 text-[10px] hover:underline">
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Universities List */}
        {loadingUniv ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-40 bg-white/5 rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Skeleton className="h-24 rounded-xl bg-white/5" />
                  <Skeleton className="h-24 rounded-xl bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : universitiesByStateAndDistrict.size === 0 ? (
          <Card className="glass-card rounded-xl border border-white/5">
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-white/15 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No universities found</p>
              <Button variant="ghost" className="mt-3 text-cyan-400 text-xs" onClick={() => { setSelectedState('all'); setSelectedDistrict('all'); setSelectedType('all'); setUnivSearch(''); }}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Array.from(universitiesByStateAndDistrict.entries()).map(([state, districts]) => (
              <div key={state}>
                {/* State Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${getStateMeta(state).bg} ${getStateMeta(state).color}`} style={{ backgroundColor: state === 'Bihar' ? '#f97316' : state === 'Haryana' ? '#22c55e' : state === 'Delhi' ? '#ef4444' : '#14b8a6' }} />
                  <h3 className="text-white/90 font-semibold text-sm">{state}</h3>
                  <Badge variant="secondary" className="text-[10px] bg-white/8 text-white/60">
                    {districts.reduce((a, d) => a + d.unis.length, 0)}
                  </Badge>
                </div>

                {/* Districts */}
                <div className="space-y-2">
                  {districts.map(({ district, unis }) => {
                    const isOpen = openDistricts.has(`${state}-${district}`) || unis.length <= 3 || selectedDistrict !== 'all' || selectedType !== 'all' || debouncedUnivSearch;
                    return (
                      <Collapsible
                        key={`${state}-${district}`}
                        open={isOpen}
                        onOpenChange={(open) => {
                          setOpenDistricts((prev) => {
                            const next = new Set(prev);
                            if (open) next.add(`${state}-${district}`); else next.delete(`${state}-${district}`);
                            return next;
                          });
                        }}
                      >
                        <Card className="glass-card district-group-card rounded-xl overflow-hidden border border-white/5">
                          <CollapsibleTrigger className="w-full">
                            <CardHeader className="py-2.5 px-4 cursor-pointer hover:bg-white/6 transition-colors">
                              <CardTitle className="text-xs font-semibold text-white/85 flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-white/55" />
                                <span>{district}</span>
                                <Badge variant="secondary" className="text-[9px] bg-white/10 text-white/70">
                                  {unis.length}
                                </Badge>
                                <ChevronDown className={`w-3.5 h-3.5 ml-auto text-white/45 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                              </CardTitle>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="px-3 pb-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {unis.map((uni) => (
                                  <motion.div
                                    key={uni.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Card
                                      className="glass-card focus-card uni-item-card rounded-lg overflow-hidden cursor-pointer hover:bg-white/8 transition-all border border-white/5 group"
                                      onClick={() => handleUnivClick(uni)}
                                    >
                                      <CardContent className="p-3">
                                        <div className="flex items-start gap-2.5">
                                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold" style={{ backgroundColor: uni.color + '20', color: uni.color }}>
                                            {uni.logo || uni.shortName.charAt(0)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                              <Badge className={`text-[9px] px-1.5 py-0 ${TYPE_COLORS[uni.type] || TYPE_COLORS.State}`}>
                                                {uni.type}
                                              </Badge>
                                            </div>
                                            <p className="focus-title text-white/95 text-xs font-semibold line-clamp-1 transition-colors">{uni.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="focus-meta text-white/55 text-[10px]">{uni.shortName}</span>
                                              <span className="focus-meta text-white/35 text-[10px]">&middot;</span>
                                              <span className="focus-meta text-white/55 text-[10px]">{uni._count.notices} notices</span>
                                              <ExternalLink className="focus-icon w-2.5 h-2.5 text-white/45 transition-colors ml-auto" />
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER: NOTICES VIEW
     ═══════════════════════════════════════════════════════════════ */

  const renderNoticesView = () => {
    const selectedUni = selectedUnivId !== 'all' ? universities.find(u => u.id === selectedUnivId) : null;

    return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedUnivId('all'); switchView('home'); }} className="text-white/40 hover:text-white hover:bg-white/10 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          {selectedUni ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 text-sm sm:text-base font-bold" style={{ backgroundColor: selectedUni.color + '20', color: selectedUni.color }}>
                {selectedUni.logo || selectedUni.shortName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">{selectedUni.name}</h2>
                <div className="flex items-center gap-2 text-white/40 text-[10px] sm:text-xs">
                  <Badge className={`text-[9px] px-1.5 py-0 ${TYPE_COLORS[selectedUni.type] || ''}`}>{selectedUni.type}</Badge>
                  {selectedUni.district && (
                    <>
                      <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{selectedUni.district}</span>
                      <span className="text-white/15">&middot;</span>
                    </>
                  )}
                  <span>{selectedUni.state === 'Uttar Pradesh' ? 'UP' : selectedUni.state}</span>
                  <span className="text-white/15">&middot;</span>
                  <span>{filteredNotices.length} notices</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">All Notices</h2>
              <p className="text-white/35 text-xs">{filteredNotices.length} notices found</p>
            </div>
          )}
        </div>

        {/* Scrape Button */}
        {selectedUni && (
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              disabled={scraping || cooldownSeconds > 0}
              onClick={() => handleScrapeUniversity(selectedUni.id)}
              className={`shrink-0 text-xs font-semibold shadow-lg gap-1.5 h-9 px-3 ${
                cooldownSeconds > 0
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-linear-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-cyan-500/20'
              }`}
            >
              {cooldownSeconds > 0 ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  {Math.ceil(cooldownSeconds / 60)}:{String(Math.ceil(cooldownSeconds % 60)).padStart(2, '0')}
                </>
              ) : scraping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Scrape Now
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Scrape Progress Banner */}
      <AnimatePresence>
        {scrapeProgress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="rounded-xl px-4 py-2.5 text-xs font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-2">
              {scraping && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
              {scrapeProgress}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* University Info Card (when selected) */}
      {selectedUni && (
        <Card className="glass-card rounded-xl border border-white/5 overflow-hidden">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/3 rounded-lg p-3 text-center">
                <p className="text-white/35 text-[10px] mb-1">Type</p>
                <p className="text-white/80 text-xs font-semibold">{selectedUni.type}</p>
              </div>
              <div className="bg-white/3 rounded-lg p-3 text-center">
                <p className="text-white/35 text-[10px] mb-1">Location</p>
                <p className="text-white/80 text-xs font-semibold">{selectedUni.district || 'N/A'}</p>
              </div>
              <div className="bg-white/3 rounded-lg p-3 text-center">
                <p className="text-white/35 text-[10px] mb-1">Notices</p>
                <p className="text-white/80 text-xs font-semibold">{selectedUni._count?.notices || filteredNotices.length}</p>
              </div>
              <div className="bg-white/3 rounded-lg p-3 text-center">
                <p className="text-white/35 text-[10px] mb-1">Website</p>
                <a href={selectedUni.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs font-semibold hover:underline truncate block">
                  Visit Site ↗
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Quick Filters (when selected university) */}
      {selectedUni && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-white/15 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            All ({filteredNotices.length})
          </button>
          {Object.entries(CAT_COLORS).filter(([cat]) => {
            if (cat === 'General') return true;
            return notices.some(n => n.category === cat && n.universityId === selectedUni.id);
          }).map(([cat, colorClass]) => {
            const count = notices.filter(n => n.category === cat && n.universityId === selectedUni.id).length;
            if (count === 0 && cat !== 'General') return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? `${colorClass}`
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {cat} ({selectedCategory === 'all' || selectedCategory === cat ? count : 0})
              </button>
            );
          })}
        </div>
      )}

      {/* Filters (when all universities) */}
      {!selectedUni && (
        <Card className="glass-card rounded-xl border border-white/5">
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Select value={selectedNoticeState} onValueChange={(v) => { setSelectedNoticeState(v); setSelectedUnivId('all'); }}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9 rounded-lg">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s === 'Uttar Pradesh' ? 'UP' : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9 rounded-lg">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {NOTICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat === 'All' ? 'all' : cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedUnivId} onValueChange={setSelectedUnivId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9 rounded-lg col-span-2 sm:col-span-1">
                  <SelectValue placeholder="University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {universities
                    .filter((u) => selectedNoticeState === 'all' || u.state === selectedNoticeState)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.shortName} - {u.name.length > 30 ? u.name.slice(0, 30) + '...' : u.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <div className="relative col-span-2 sm:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <Input
                  placeholder="Search notices..."
                  value={noticeSearch}
                  onChange={(e) => setNoticeSearch(e.target.value)}
                  className="pl-9 h-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 rounded-lg"
                />
              </div>
            </div>

            {/* Active Filters */}
            {(selectedNoticeState !== 'all' || selectedCategory !== 'all' || selectedUnivId !== 'all' || noticeSearch) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-white/25 text-[10px] mr-1">Filtering:</span>
                {selectedNoticeState !== 'all' && (
                  <button onClick={() => { setSelectedNoticeState('all'); setSelectedUnivId('all'); }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px]">
                    {selectedNoticeState === 'Uttar Pradesh' ? 'UP' : selectedNoticeState} <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {selectedCategory !== 'all' && (
                  <button onClick={() => setSelectedCategory('all')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px]">
                    {selectedCategory} <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {selectedUnivId !== 'all' && (
                  <button onClick={() => setSelectedUnivId('all')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px]">
                    {universities.find((u) => u.id === selectedUnivId)?.shortName || 'Uni'} <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {noticeSearch && (
                  <button onClick={() => setNoticeSearch('')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px]">
                    &ldquo;{noticeSearch}&rdquo; <X className="w-2.5 h-2.5" />
                  </button>
                )}
                <button onClick={() => { setSelectedNoticeState('all'); setSelectedCategory('all'); setSelectedUnivId('all'); setNoticeSearch(''); }} className="text-cyan-400 text-[10px] hover:underline">
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search bar (when selected university) */}
      {selectedUni && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <Input
            placeholder="Search within notifications..."
            value={noticeSearch}
            onChange={(e) => setNoticeSearch(e.target.value)}
            className="pl-9 h-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 rounded-lg w-full"
          />
          {noticeSearch && (
            <button onClick={() => setNoticeSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
            </button>
          )}
        </div>
      )}

      {/* Notice Cards */}
      {loadingNotices ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : filteredNotices.length === 0 ? (
        <Card className="glass-card rounded-xl border border-white/5">
          <CardContent className="p-12 text-center">
            {selectedUni ? (
              <>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: selectedUni.color + '15' }}>
                  <Newspaper className="w-7 h-7" style={{ color: selectedUni.color }} />
                </div>
                <p className="text-white/50 text-sm font-medium mb-1">No notifications found</p>
                <p className="text-white/30 text-xs mb-4">
                  {selectedUni.name} ke liye abhi koi notification nahi mila.
                </p>
                <Button
                  size="sm"
                  disabled={scraping}
                  onClick={() => handleScrapeUniversity(selectedUni.id)}
                  className="bg-linear-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 gap-1.5"
                >
                  {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  {scraping ? 'Scraping...' : 'Scrape Latest Notifications'}
                </Button>
              </>
            ) : (
              <>
                <Newspaper className="w-12 h-12 text-white/15 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No notices found</p>
                <Button variant="ghost" className="mt-3 text-cyan-400 text-xs" onClick={() => { setSelectedNoticeState('all'); setSelectedCategory('all'); setSelectedUnivId('all'); setNoticeSearch(''); }}>
                  Clear all filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          {filteredNotices.map((notice, i) => {
            const stateMeta = getStateMeta(notice.university.state);
            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Card
                  className={`glass-card focus-card notice-item-card rounded-xl overflow-hidden border border-white/5 transition-all group ${
                    notice.isImportant ? 'neon-border' : 'hover:bg-white/4'
                  } cursor-pointer`}
                  onClick={() => {
                    if (notice.sourceUrl) window.open(notice.sourceUrl, '_blank');
                    else toast.info('No source URL available');
                  }}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      {!selectedUni && (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold" style={{ backgroundColor: notice.university.color + '20', color: notice.university.color }}>
                          {notice.university.logo || notice.university.shortName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          {notice.isImportant && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-red-500/20 text-red-400 border border-red-500/10">
                              Important
                            </Badge>
                          )}
                          <Badge className={`text-[9px] px-1.5 py-0 ${CAT_COLORS[notice.category] || CAT_COLORS.General}`}>
                            {notice.category}
                          </Badge>
                          {!selectedUni && (
                            <Badge className={`text-[9px] px-1.5 py-0 ${stateMeta.badge}`}>
                              {notice.university.state === 'Uttar Pradesh' ? 'UP' : notice.university.state}
                            </Badge>
                          )}
                        </div>
                        <p className="focus-title text-white/95 text-xs sm:text-sm font-semibold line-clamp-2 transition-colors">{notice.title}</p>
                        {notice.description && notice.description.length > 0 && (
                          <p className="focus-meta text-white/55 text-[10px] sm:text-xs mt-1 line-clamp-1">{notice.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {!selectedUni && (
                            <>
                              <span className="focus-meta text-white/60 text-[10px] sm:text-xs">{notice.university.shortName}</span>
                              <span className="focus-meta text-white/35 text-[10px]">&middot;</span>
                            </>
                          )}
                          <span className="focus-meta text-white/55 text-[10px] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDate(notice.datePublished)}
                          </span>
                          {notice.sourceUrl && (
                            <ExternalLink className="focus-icon w-3 h-3 text-white/45 transition-colors ml-auto" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER: ENTRANCE EXAMS VIEW
     ═══════════════════════════════════════════════════════════════ */

  const filteredEntranceExams = useMemo(() => {
    return ENTRANCE_EXAMS.filter((e) => {
      if (entranceStateFilter !== 'All' && e.state !== entranceStateFilter) return false;
      if (entranceCategoryFilter !== 'All' && e.category !== entranceCategoryFilter) return false;
      if (entranceLevelFilter !== 'All' && e.level !== entranceLevelFilter) return false;
      if (entranceSearch) {
        const q = entranceSearch.toLowerCase();
        if (!e.name.toLowerCase().includes(q) && !e.desc.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entranceStateFilter, entranceCategoryFilter, entranceLevelFilter, entranceSearch]);

  const renderEntranceView = () => {
    const selectedExam = selectedEntranceExam ? ENTRANCE_EXAMS.find(e => e.name === selectedEntranceExam) : null;
    const selectedDetail = selectedEntranceExam ? EXAM_DETAILS[selectedEntranceExam] : null;
    const isExamSelected = selectedExam && selectedDetail;

    return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { switchView('home'); setSelectedEntranceExam(null); }} className="text-white/40 hover:text-white hover:bg-white/10 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Entrance Exams</h2>
          <p className="text-white/35 text-xs">{ENTRANCE_EXAMS.length} exams — National + State level with official websites & details</p>
        </div>
        <Badge className="bg-linear-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/10 px-3 py-1 text-xs">
          {filteredEntranceExams.length} Shown
        </Badge>
      </div>

      {/* Level Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['All', 'National', 'State'] as const).map((lvl) => {
          const count = lvl === 'All' ? ENTRANCE_EXAMS.length : ENTRANCE_EXAMS.filter(e => e.level === lvl).length;
          const isActive = entranceLevelFilter === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setEntranceLevelFilter(lvl)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? lvl === 'All'
                    ? 'bg-linear-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                    : lvl === 'National'
                    ? 'bg-blue-500/15 text-blue-400 shadow-lg'
                    : 'bg-amber-500/15 text-amber-400 shadow-lg'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {lvl === 'National' && <Globe className="w-3 h-3" />}
              {lvl === 'State' && <MapPin className="w-3 h-3" />}
              {lvl} ({count})
            </button>
          );
        })}
      </div>

      {/* State Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {ENTRANCE_STATES.map((s) => {
          const meta = s === 'All' ? { bg: '', color: '' } : getBoardStateMeta(s === 'National' ? 'National' : s === 'UP' ? 'UP' : s);
          const count = s === 'All' ? ENTRANCE_EXAMS.length : ENTRANCE_EXAMS.filter(e => e.state === s).length;
          const isActive = entranceStateFilter === s;
          return (
            <button
              key={s}
              onClick={() => setEntranceStateFilter(s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? s === 'All'
                    ? 'bg-linear-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                    : `${meta.bg} ${meta.color} shadow-lg`
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {s !== 'All' && meta.logo && (
                <img src={meta.logo} alt="" className="w-4 h-4 rounded-full object-cover ring-1 ring-white/20 hover:scale-[1.5] hover:shadow-lg hover:shadow-black/30 transition-all duration-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              {s === 'All' ? 'All' : s === 'UP' ? 'Uttar Pradesh' : s} ({count})
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="glass-card rounded-xl border border-white/5">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <Input
                placeholder="Search exams by name or description..."
                value={entranceSearch}
                onChange={(e) => setEntranceSearch(e.target.value)}
                className="pl-9 h-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 rounded-lg"
              />
            </div>
            {/* Category Filter */}
            <Select value={entranceCategoryFilter} onValueChange={setEntranceCategoryFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9 rounded-lg w-full sm:w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {ENTRANCE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Active Filters */}
          {(entranceStateFilter !== 'All' || entranceCategoryFilter !== 'All' || entranceLevelFilter !== 'All' || entranceSearch) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white/25 text-[10px] mr-1">Active:</span>
              {entranceLevelFilter !== 'All' && (
                <button onClick={() => setEntranceLevelFilter('All')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] hover:bg-white/15">
                  {entranceLevelFilter} <X className="w-2.5 h-2.5" />
                </button>
              )}
              {entranceStateFilter !== 'All' && (
                <button onClick={() => setEntranceStateFilter('All')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] hover:bg-white/15">
                  {entranceStateFilter === 'UP' ? 'Uttar Pradesh' : entranceStateFilter} <X className="w-2.5 h-2.5" />
                </button>
              )}
              {entranceCategoryFilter !== 'All' && (
                <button onClick={() => setEntranceCategoryFilter('All')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] hover:bg-white/15">
                  {entranceCategoryFilter} <X className="w-2.5 h-2.5" />
                </button>
              )}
              {entranceSearch && (
                <button onClick={() => setEntranceSearch('')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] hover:bg-white/15">
                  &ldquo;{entranceSearch}&rdquo; <X className="w-2.5 h-2.5" />
                </button>
              )}
              <button onClick={() => { setEntranceLevelFilter('All'); setEntranceStateFilter('All'); setEntranceCategoryFilter('All'); setEntranceSearch(''); }} className="text-cyan-400 text-[10px] hover:underline">
                Clear all
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exam Cards */}
      {filteredEntranceExams.length === 0 ? (
        <Card className="glass-card rounded-xl border border-white/5">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No entrance exams found</p>
            <Button variant="ghost" className="mt-3 text-cyan-400 text-xs" onClick={() => { setEntranceLevelFilter('All'); setEntranceStateFilter('All'); setEntranceCategoryFilter('All'); setEntranceSearch(''); }}>
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEntranceExams.map((exam, i) => {
            const stateMeta = getBoardStateMeta(exam.state);
            const isSelected = selectedEntranceExam === exam.name;
            const hasDetail = !!EXAM_DETAILS[exam.name];
            return (
              <motion.div
                key={exam.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="prism-box">
                  <div
                    className={`prism-inner glass-card focus-card entrance-card rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 ${isSelected ? 'ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/10' : ''} ${stateMeta.border}`}
                    onClick={() => {
                      if (hasDetail) {
                        setSelectedEntranceExam(isSelected ? null : exam.name);
                        if (!isSelected) {
                          setTimeout(() => {
                            document.getElementById(`exam-detail-${exam.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }, 100);
                        }
                      } else {
                        window.open(exam.website, '_blank');
                      }
                    }}
                  >
                    <div className="prism-rainbow rounded-xl" />
                    <div className="prism-shine rounded-xl" />
                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${exam.color} flex items-center justify-center text-xl shrink-0 shadow-lg`}>
                          {exam.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="focus-title text-white font-semibold text-sm leading-tight">{exam.name}</h3>
                            {hasDetail && (
                              <span className="shrink-0 text-cyan-400/60 text-[9px] flex items-center gap-0.5">
                                <FileText className="w-2.5 h-2.5" /> Details
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <Badge className={`text-[9px] ${stateMeta.badge}`}>
                              {exam.state === 'UP' ? 'UP' : exam.state}
                            </Badge>
                            <Badge className="text-[9px] bg-white/10 text-white/50">
                              {exam.category}
                            </Badge>
                            {exam.level === 'National' ? (
                              <Badge className="text-[9px] bg-blue-500/15 text-blue-400">
                                National
                              </Badge>
                            ) : (
                              <Badge className="text-[9px] bg-amber-500/15 text-amber-400">
                                State
                              </Badge>
                            )}
                          </div>
                          <p className="focus-meta text-white/60 text-[11px] line-clamp-2 leading-relaxed">{exam.desc}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <a
                              href={exam.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-400 text-[10px] hover:text-cyan-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Visit Website <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            {hasDetail && (
                              <span className="focus-meta text-white/55 text-[10px] flex items-center gap-0.5">
                                {isSelected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {isSelected ? 'Hide' : 'View Details'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ EXPANDED EXAM DETAIL PANEL ═══ */}
      <AnimatePresence>
        {isExamSelected && (
          <motion.div
            id={`exam-detail-${selectedExam.name}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              {/* Gradient Header */}
              <div className={`bg-linear-to-r ${selectedExam.color} p-5 sm:p-6 relative`}>
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl sm:text-4xl shadow-xl">
                      {selectedExam.icon}
                    </div>
                    <div>
                      <h3 className="text-white text-xl sm:text-2xl font-bold">{selectedExam.name}</h3>
                      <p className="text-white/70 text-sm mt-1">{selectedDetail.fullName}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className="bg-white/20 text-white text-[10px]">
                          <MapPin className="w-2.5 h-2.5 mr-1" />
                          {selectedExam.state === 'UP' ? 'Uttar Pradesh' : selectedExam.state}
                        </Badge>
                        <Badge className="bg-white/20 text-white text-[10px]">
                          <Tag className="w-2.5 h-2.5 mr-1" />
                          {selectedExam.category}
                        </Badge>
                        <Badge className="bg-white/20 text-white text-[10px]">
                          <Globe className="w-2.5 h-2.5 mr-1" />
                          {selectedExam.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEntranceExam(null)}
                    className="text-white/70 hover:text-white hover:bg-white/10 shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Detail Content */}
              <CardContent className="p-5 sm:p-6 space-y-6">
                {/* Conducting Body */}
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Shield className="w-4 h-4 text-white/40" />
                  <span className="text-white/40">Conducting Body:</span>
                  <span className="text-white font-medium">{selectedDetail.conductingBody}</span>
                </div>

                {/* Official Website */}
                <div className="flex items-center gap-2">
                  <a
                    href={selectedExam.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 text-sm font-medium hover:from-cyan-500/30 hover:to-blue-500/30 transition-all border border-cyan-500/10"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Official Website
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Eligibility */}
                <div>
                  <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Eligibility Criteria
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedDetail.eligibility.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white/60 text-xs leading-relaxed">
                        <ChevronRight className="w-3 h-3 text-white/30 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exam Pattern */}
                <div>
                  <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Exam Pattern
                  </h4>
                  <p className="text-white/60 text-xs leading-relaxed bg-white/5 rounded-lg p-3 border border-white/5">
                    {selectedDetail.examPattern}
                  </p>
                </div>

                {/* Syllabus */}
                <div>
                  <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                    Syllabus
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDetail.syllabus.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-white/60 text-xs leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50 mt-1.5 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important Dates */}
                <div>
                  <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    Important Dates (Approximate)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDetail.importantDates.map((d, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-medium">{d.event}</p>
                          <p className="text-white/40 text-[10px]">{d.timing}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Application Fee */}
                <div>
                  <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-pink-400" />
                    Application Fee
                  </h4>
                  <p className="text-white/60 text-xs bg-white/5 rounded-lg p-3 border border-white/5">
                    {selectedDetail.applicationFee}
                  </p>
                </div>

                {/* Official Links */}
                <div>
                  <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                    <ExternalLink className="w-4 h-4 text-cyan-400" />
                    Important Links
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDetail.officialLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/5 hover:border-cyan-500/20 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/25 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-medium group-hover:text-cyan-400 transition-colors">{link.label}</p>
                          <p className="text-white/30 text-[10px] truncate">{link.url}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Related Exams */}
                {selectedDetail.relatedExams.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Related Exams
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDetail.relatedExams.map((rel, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const relExam = ENTRANCE_EXAMS.find(e => e.name === rel);
                            if (relExam && EXAM_DETAILS[rel]) {
                              setSelectedEntranceExam(rel);
                              setTimeout(() => {
                                document.getElementById(`exam-detail-${rel}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }, 200);
                            } else if (relExam) {
                              window.open(relExam.website, '_blank');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all border border-white/5 hover:border-white/10"
                        >
                          <ChevronRight className="w-3 h-3" />
                          {rel}
                          {EXAM_DETAILS[rel] ? (
                            <FileText className="w-2.5 h-2.5 text-cyan-400/50" />
                          ) : (
                            <ExternalLink className="w-2.5 h-2.5 text-white/30" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preparation Tips */}
                <div>
                  <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Preparation Tips
                  </h4>
                  <div className="space-y-2">
                    {selectedDetail.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-white/60 text-xs leading-relaxed bg-yellow-500/5 rounded-lg p-3 border border-yellow-500/5">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-yellow-500/15 text-yellow-400 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <a
                    href={selectedExam.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <Globe className="w-4 h-4" />
                    Open Official Website
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedEntranceExam(null)}
                    className="text-white/50 hover:text-white hover:bg-white/10 text-sm"
                  >
                    Close Details
                  </Button>
                </div>
              </CardContent>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER: BOARD EXAMS VIEW
     ═══════════════════════════════════════════════════════════════ */

  // Unique states that actually appear in BOARD_EXAMS, in display order
  const BOARD_STATE_ORDER = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    BOARD_EXAMS.forEach(b => { if (!seen.has(b.state)) { seen.add(b.state); order.push(b.state); } });
    return order;
  }, []);

  const boardsByState = useMemo(() => {
    const grouped: Record<string, typeof BOARD_EXAMS> = {};
    BOARD_EXAMS.forEach(b => {
      const show = boardStateFilter === 'all'
        || b.state === boardStateFilter
        || (boardStateFilter === 'other' && b.state !== 'National' && b.state !== 'Bihar' && b.state !== 'Haryana' && b.state !== 'Delhi' && b.state !== 'UP');
      if (show || b.state === 'National') {
        if (!grouped[b.state]) grouped[b.state] = [];
        grouped[b.state].push(b);
      }
    });
    return grouped;
  }, [boardStateFilter]);

  const renderBoardView = () => {
    const totalFiltered = Object.values(boardsByState).flat().length;
    // Board filter buttons — uses BOARD_STATE_META for reliable lookups
    const boardFilterStates = ['National', 'Bihar', 'Haryana', 'Delhi', 'UP'];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => switchView('home')} className="text-white/40 hover:text-white hover:bg-white/10 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Board Exams</h2>
            <p className="text-white/35 text-xs">{BOARD_EXAMS.length} boards across all states with latest notices</p>
          </div>
          <Badge className="bg-linear-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/10 px-3 py-1 text-xs">
            {totalFiltered} Boards
          </Badge>
        </div>

        {/* State Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setBoardStateFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              boardStateFilter === 'all'
                ? 'bg-linear-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            All ({BOARD_EXAMS.length})
          </button>
          {boardFilterStates.map((s) => {
            const meta = getBoardStateMeta(s);
            const count = BOARD_EXAMS.filter(b => b.state === s).length;
            return (
              <button
                key={s}
                onClick={() => setBoardStateFilter(s)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  boardStateFilter === s
                    ? `${meta.bg} ${meta.color} shadow-lg`
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {meta.logo && (
                  <img src={meta.logo} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20 hover:scale-[1.5] hover:shadow-lg hover:shadow-black/30 transition-all duration-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                {meta.label} ({count})
              </button>
            );
          })}
          <button
            onClick={() => setBoardStateFilter('other')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              boardStateFilter === 'other'
                ? 'bg-linear-to-r from-amber-500/20 to-orange-500/20 text-amber-400'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            Other States
          </button>
        </div>

        {/* Board Groups by State in 3D Glass Prism */}
        {BOARD_STATE_ORDER.filter(s => boardsByState[s]?.length > 0).map((state) => {
          const stateMeta = getBoardStateMeta(state);
          return (
            <motion.div
              key={state}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* State Header with Logo */}
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-full bg-linear-to-br ${stateMeta.gradient} flex items-center justify-center ring-1 ring-white/15`}>
                  {stateMeta.logo ? (
                    <img src={stateMeta.logo} alt={state} className="w-7 h-7 rounded-full object-cover hover:scale-[1.5] hover:shadow-lg hover:shadow-black/30 transition-all duration-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <MapPin className={`w-4 h-4 ${stateMeta.color}`} />
                  )}
                </div>
                <h3 className={`font-semibold text-sm ${stateMeta.color}`}>{stateMeta.label}</h3>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-white/25 text-xs">{boardsByState[state].length} board{boardsByState[state].length > 1 ? 's' : ''}</span>
              </div>

              {/* Board Cards in 3D Prism Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {boardsByState[state].map((board, i) => (
                  <motion.div
                    key={board.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className="prism-box cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => window.open(board.website, '_blank')}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          window.open(board.website, '_blank');
                        }
                      }}
                      title={`Open ${board.name} website`}
                    >
                      <div className={`prism-inner glass-card rounded-2xl p-4 min-h-45 flex flex-col gap-3 border ${stateMeta.border}`}>
                        <div className="prism-rainbow rounded-2xl" />
                        <div className="prism-shine rounded-2xl" />

                        {/* Board Header */}
                        <div className="relative z-10 flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${board.color} flex items-center justify-center text-xl shrink-0 shadow-lg`}>
                            {board.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-bold text-sm leading-tight">{board.name}</h4>
                            {board.exams && (
                              <p className="text-cyan-400/70 text-[10px] mt-0.5">{board.exams}</p>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="relative z-10 text-white/30 text-[11px] leading-relaxed line-clamp-2">{board.desc}</p>

                        {/* Latest Notices */}
                        {board.notices && board.notices.length > 0 && (
                          <div className="relative z-10 space-y-1.5 flex-1">
                            <p className="text-amber-400/70 text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1">
                              <Megaphone className="w-2.5 h-2.5" /> Latest Notices
                            </p>
                            {board.notices.slice(0, 3).map((notice, ni) => (
                              <div key={ni} className="flex items-start gap-1.5 group/notice">
                                <span className="w-1 h-1 rounded-full bg-cyan-400/50 mt-1.5 shrink-0" />
                                <p className="text-white/40 text-[10px] leading-snug line-clamp-1 group-hover/notice:text-white/60 transition-colors">{notice}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="relative z-10 flex items-center justify-between mt-auto pt-1">
                          <a
                            href={board.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 text-[10px] hover:text-cyan-300 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Visit Website <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <Badge className={`text-[8px] px-1.5 py-0 ${stateMeta.badge}`}>
                            {board.state}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* All Board Notices Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <h3 className="text-white font-semibold text-sm">All Board Notices</h3>
            <span className="text-white/20 text-xs">Real-time updates</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {BOARD_EXAMS.filter(b => b.notices).flatMap(b => b.notices!.map(n => ({ board: b.name, state: b.state, notice: n, color: b.color }))).slice(0, 12).map((item, i) => {
              const bm = getBoardStateMeta(item.state);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-xl p-3 flex items-start gap-2.5 hover:bg-white/4 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${item.color} flex items-center justify-center text-sm shrink-0`}>
                    📋
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-xs line-clamp-1">{item.notice}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-white/25 text-[9px]">{item.board}</span>
                      <Badge className={`text-[8px] px-1 py-0 ${bm.badge}`}>
                        {item.state}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Real-time Board Notifications */}
        {rtNotifications.filter(n => n.category === 'Result' || n.category === 'Exam' || n.category === 'Notification' || n.state).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-white font-bold text-base">Live Notifications</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rtNotifications.slice(0, 10).map((notif, i) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-4 border border-emerald-500/10 flex items-start gap-3 cursor-pointer hover:bg-white/4 transition-colors"
                  onClick={() => { if (notif.url) window.open(notif.url, '_blank'); }}
                >
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-semibold line-clamp-2">{notif.title}</p>
                    <p className="text-white/30 text-xs line-clamp-2 mt-1">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {notif.state && (
                        <Badge className={`text-[10px] px-2 py-0.5 ${getBoardStateMeta(notif.state).badge}`}>
                          {notif.state}
                        </Badge>
                      )}
                      <Badge className={`text-[10px] px-2 py-0.5 ${CAT_COLORS[notif.category] || CAT_COLORS.General}`}>
                        {notif.category}
                      </Badge>
                      <span className="text-white/15 text-[10px]">{formatDate(notif.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER: ADMIN VIEW
     ═══════════════════════════════════════════════════════════════ */

  const renderAdminView = () => {
    if (!isAdmin) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm mx-auto"
          >
            <Card className="glass-card rounded-2xl border border-white/5 neon-border">
              <CardContent className="p-6 space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-white font-bold text-lg">Admin Login</h2>
                  <p className="text-white/35 text-xs">Access the admin dashboard</p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-white/50 text-xs">Email</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <Input
                        type="email"
                        placeholder="admin@uniupdates.in"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="pl-9 h-10 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-white/50 text-xs">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <Input
                        type="password"
                        placeholder="Enter password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="pl-9 h-10 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleLogin}
                  disabled={adminLoading}
                  className="w-full bg-linear-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white h-10 rounded-lg font-medium shadow-lg shadow-cyan-500/20 border-0"
                >
                  {adminLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
                <div className="text-center">
                  <button onClick={() => switchView('home')} className="text-white/30 text-xs hover:text-white/50 transition-colors">
                    &larr; Back to home
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Admin Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => switchView('home')} className="text-white/40 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Admin Dashboard
              </h2>
              <p className="text-white/35 text-xs">Manage posts, scrape & moderate</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="glass-card rounded-xl border border-white/5">
            <CardContent className="p-4 text-center">
              <p className="text-white font-bold text-2xl">{universities.length}</p>
              <p className="text-white/35 text-xs">Universities</p>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-xl border border-white/5">
            <CardContent className="p-4 text-center">
              <p className="text-white font-bold text-2xl">{notices.length}</p>
              <p className="text-white/35 text-xs">Notices</p>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-xl border border-white/5">
            <CardContent className="p-4 text-center">
              <p className="text-white font-bold text-2xl">{adminPosts.length}</p>
              <p className="text-white/35 text-xs">Posts</p>
            </CardContent>
          </Card>
          <button
            type="button"
            onClick={() => scrollToAdminSection('admin-blog-posts')}
            className="glass-card rounded-xl border border-white/5 p-4 text-center hover:bg-white/8 transition-colors"
          >
            <p className="text-white font-bold text-2xl">{blogPosts.length}</p>
            <p className="text-white/35 text-xs">Blog Posts</p>
          </button>
          <Card className="glass-card rounded-xl border border-white/5">
            <CardContent className="p-4 text-center">
              <p className={`font-bold text-2xl ${wsConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                {wsConnected ? 'Live' : 'Off'}
              </p>
              <p className="text-white/35 text-xs">WebSocket</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => scrollToAdminSection('admin-announcement-posts')}
            className="shrink-0 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
          >
            <Megaphone className="w-3.5 h-3.5 mr-1.5" />
            Announcement Posts
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => scrollToAdminSection('admin-blog-posts')}
            className="shrink-0 text-pink-200 hover:text-pink-100 hover:bg-pink-500/15 border border-pink-500/20"
          >
            <Newspaper className="w-3.5 h-3.5 mr-1.5" />
            Blog Posts
          </Button>
        </div>

        {/* Scrape Button */}
        <Card className="glass-card rounded-xl border border-white/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Scrape Notifications</p>
                <p className="text-white/30 text-xs">Fetch latest notices from all universities</p>
              </div>
            </div>
            <Button
              onClick={handleScrape}
              disabled={scraping}
              className="bg-linear-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-cyan-500/20"
            >
              {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
              <span className="hidden sm:inline ml-1">Scrape Now</span>
            </Button>
          </CardContent>
        </Card>

        {/* Create Post Form */}
        <Card id="admin-announcement-posts" className="glass-card rounded-xl border border-white/5 scroll-mt-24">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-cyan-400" />
              Create New Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Post title..."
              value={postForm.title}
              onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 h-9 rounded-lg"
            />
            <Textarea
              placeholder="Content (optional)..."
              value={postForm.content || ''}
              onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 min-h-20 rounded-lg resize-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select value={postForm.category} onValueChange={(v) => setPostForm({ ...postForm, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTICE_CATEGORIES.filter(c => c !== 'All').map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Source URL (optional)"
                value={postForm.sourceUrl || ''}
                onChange={(e) => setPostForm({ ...postForm, sourceUrl: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 h-9 rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={postForm.isPinned}
                    onCheckedChange={(v) => setPostForm({ ...postForm, isPinned: v })}
                    className="data-[state=checked]:bg-cyan-500"
                  />
                  <span className="text-white/50 text-xs">Pin this post</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="text-white/50 hover:text-white hover:bg-white/10 text-xs"
                >
                  {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                  Upload Image
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Button
                  onClick={handleCreatePost}
                  disabled={postSubmitting}
                  className="bg-linear-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-xs border-0 h-8 shadow-lg shadow-cyan-500/20"
                >
                  {postSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                  Publish
                </Button>
              </div>
            </div>
            {postForm.imageUrl && (
              <div className="relative inline-block">
                <img src={postForm.imageUrl} alt="Preview" className="w-24 h-24 rounded-lg object-cover border border-white/10" />
                <button
                  onClick={() => setPostForm({ ...postForm, imageUrl: '' })}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Posts Management */}
        <Card className="glass-card rounded-xl border border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-400" />
              Manage Posts ({adminPosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {adminPosts.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-8">No posts yet. Create one above!</p>
              ) : (
                adminPosts.map((post) => (
                  <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {post.isPinned && <Pin className="w-3 h-3 text-cyan-400" />}
                        <p className="text-white/80 text-xs font-medium line-clamp-1">{post.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge className={`text-[9px] ${CAT_COLORS[post.category] || CAT_COLORS.General}`}>{post.category}</Badge>
                        <span className="text-white/20 text-[9px]">{formatFullDate(post.createdAt)}</span>
                        {!post.isActive && <Badge className="text-[9px] bg-red-500/20 text-red-400">Inactive</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-white/30 hover:text-cyan-400 hover:bg-white/10"
                        onClick={() => handlePinPost(post.id, !post.isPinned)}
                        title={post.isPinned ? 'Unpin' : 'Pin'}
                      >
                        {post.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-7 h-7 ${post.isActive ? 'text-white/30 hover:text-amber-400' : 'text-amber-400/50 hover:text-amber-400'} hover:bg-white/10`}
                        onClick={() => handleTogglePost(post.id, !post.isActive)}
                        title={post.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {post.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-white/30 hover:text-red-400 hover:bg-white/10"
                        onClick={() => handleDeletePost(post.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* ═══ Blog Post Management ═══ */}
        <Card id="admin-blog-posts" className="glass-card rounded-xl border border-white/5 scroll-mt-24">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-pink-400" />
                Blog Posts ({blogPosts.length})
              </CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={blogNormalizing || blogPosts.length === 0}
                    className="h-8 text-[11px] text-pink-200 hover:text-pink-100 hover:bg-pink-500/15"
                  >
                    {blogNormalizing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Normalize All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#0f1424] border border-white/10 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white text-base">Normalize all blog posts?</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60 text-sm">
                      This will standardize title, excerpt, content formatting, tags, category, and read-time across existing posts.
                      {` `}Only posts with changes will be updated.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleNormalizeAllBlogs}
                      className="bg-linear-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
                    >
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Blog Form */}
            <div className="space-y-3 p-3 rounded-lg bg-white/3 border border-white/5">
              <Input
                placeholder="Blog title..."
                value={blogForm.title}
                onChange={(e) => setBlogForm(f => ({ ...f, title: e.target.value }))}
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20 rounded-lg"
              />
              <Input
                placeholder="Short excerpt (optional)..."
                value={blogForm.excerpt}
                onChange={(e) => setBlogForm(f => ({ ...f, excerpt: e.target.value }))}
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20 rounded-lg"
              />
              <textarea
                placeholder="Write your blog content here..."
                value={blogForm.content}
                onChange={(e) => setBlogForm(f => ({ ...f, content: e.target.value }))}
                rows={6}
                className="w-full bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 rounded-lg p-3 resize-y focus:outline-none focus:ring-1 focus:ring-pink-500/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Author"
                  value={blogForm.author}
                  onChange={(e) => setBlogForm(f => ({ ...f, author: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white text-xs placeholder:text-white/20 rounded-lg"
                />
                <Input
                  placeholder="Tags (comma separated)"
                  value={blogForm.tags}
                  onChange={(e) => setBlogForm(f => ({ ...f, tags: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white text-xs placeholder:text-white/20 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={blogForm.category}
                  onChange={(e) => setBlogForm(f => ({ ...f, category: e.target.value }))}
                  className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5"
                >
                  <option value="Education">Education</option>
                  <option value="Career">Career</option>
                  <option value="Exam Tips">Exam Tips</option>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Admission">Admission</option>
                  <option value="Technology">Technology</option>
                </select>
                <label className="flex items-center gap-1.5 text-white/40 text-xs cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={blogForm.isPublished}
                    onChange={(e) => setBlogForm(f => ({ ...f, isPublished: e.target.checked }))}
                    className="accent-pink-500"
                  />
                  Publish Now
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleBlogSubmit}
                  disabled={blogSubmitting || !blogForm.title.trim() || !blogForm.content.trim()}
                  className="bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-xs flex-1"
                >
                  {blogSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Newspaper className="w-3 h-3 mr-1" />}
                  {editingBlogId ? 'Update' : 'Publish'} Blog
                </Button>
                {editingBlogId && (
                  <Button size="sm" variant="ghost" onClick={() => { setEditingBlogId(null); setBlogForm({ title: '', excerpt: '', content: '', coverImage: '', author: 'Admin', tags: '', category: 'Education', readTime: '3 min', isPublished: false }); }} className="text-white/40 text-xs">Cancel</Button>
                )}
              </div>
            </div>

            {/* Blog list */}
            <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
              {blogPosts.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-6">No blog posts yet.</p>
              ) : (
                blogPosts.map((post) => (
                  <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge className={`text-[9px] ${post.isPublished ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' : 'bg-amber-500/20 text-amber-400 border border-amber-500/10'}`}>
                          {post.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        <span className="text-white/15 text-[9px]">{post.category}</span>
                      </div>
                      <p className="text-white/70 text-xs font-medium line-clamp-1">{post.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/20 text-[9px]">{post.author}</span>
                        <span className="text-white/15 text-[9px]">👁 {post.views}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-white/30 hover:text-cyan-400 hover:bg-white/10" onClick={() => handleEditBlog(post)} title="Edit">
                        <Settings className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className={`w-7 h-7 ${post.isPublished ? 'text-white/30 hover:text-amber-400' : 'text-emerald-400/50 hover:text-emerald-400'} hover:bg-white/10`} onClick={() => handleToggleBlogPublish(post.id, !post.isPublished)} title={post.isPublished ? 'Unpublish' : 'Publish'}>
                        {post.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-white/30 hover:text-red-400 hover:bg-white/10" onClick={() => handleDeleteBlog(post.id)} title="Delete">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════════ */

  // Marquee is always visible now (h-9 = 36px, nav h-14 = 56px on mobile, h-16 = 64px on sm+)
  const topOffset = 'pt-[96px] sm:pt-[108px]';
  const bottomPadding = 'pb-24 lg:pb-12';

  return (
    <div className="min-h-screen app-bg flex flex-col">
      {/* Background Orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />
      <div className="bg-orb-3" />

      {/* Navigation */}
      {renderNavBar()}

      {/* Marquee Ticker */}
      {renderMarquee()}

      {/* Main Content */}
      <main className={`flex-1 relative z-10 ${topOffset} ${bottomPadding}`}>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'home' && renderHomeView()}
              {view === 'universities' && renderUniversitiesView()}
              {view === 'notices' && renderNoticesView()}
              {view === 'entrance' && renderEntranceView()}
              {view === 'board' && renderBoardView()}
              {view === 'admin' && renderAdminView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Mobile Nav */}
      {renderBottomNav()}

      {/* ═══ Blog Post Reader Modal ═══ */}
      <AnimatePresence>
        {selectedBlogPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 app-overlay backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 pt-8 sm:pt-16"
            onClick={() => setSelectedBlogPost(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="relative w-full max-w-3xl app-modal-bg border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cover */}
              {selectedBlogPost.coverImage ? (
                <img src={selectedBlogPost.coverImage} alt="" className="w-full h-48 sm:h-64 object-cover" />
              ) : (
                <div className="w-full h-32 sm:h-40 bg-linear-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                  <span className="text-6xl">📰</span>
                </div>
              )}
              {/* Close button */}
              <button
                onClick={() => setSelectedBlogPost(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Close article"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {/* Content */}
              <div className="p-5 sm:p-7 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className="bg-pink-500/20 text-pink-400 border border-pink-500/10 text-[10px] uppercase tracking-wide">{selectedBlogPost.category}</Badge>
                  <span className="text-white/35 text-[10px]">{selectedBlogPost.readTime} read</span>
                  <span className="text-white/30 text-[10px]">{selectedBlogPost.views} views</span>
                </div>
                <h2 className="text-white font-bold text-2xl sm:text-3xl leading-tight tracking-tight">{selectedBlogPost.title}</h2>
                {selectedBlogPost.excerpt && (
                  <p className="text-white/60 text-sm mt-2.5 leading-relaxed">{selectedBlogPost.excerpt}</p>
                )}
                <div className="flex items-center gap-3 mt-3 mb-5 pb-4 border-b border-white/5">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-xs text-white/80 font-bold">
                    {selectedBlogPost.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium">{selectedBlogPost.author}</p>
                    <p className="text-white/30 text-[10px]">Published {formatDate(selectedBlogPost.createdAt)}</p>
                  </div>
                </div>
                <div className="max-w-none text-white/80 text-[15px] leading-7 space-y-4">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h3 className="text-white text-2xl font-semibold mt-6 mb-2">{children}</h3>,
                      h2: ({ children }) => <h4 className="text-white text-xl font-semibold mt-5 mb-2">{children}</h4>,
                      h3: ({ children }) => <h5 className="text-white text-lg font-semibold mt-4 mb-2">{children}</h5>,
                      p: ({ children }) => <p className="text-white/80 text-[15px] leading-7">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-outside pl-5 space-y-2 text-white/80">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-outside pl-5 space-y-2 text-white/80">{children}</ol>,
                      li: ({ children }) => <li className="leading-7">{children}</li>,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-pink-400/50 pl-4 italic text-white/70">{children}</blockquote>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2">
                          {children}
                        </a>
                      ),
                      code: ({ children }) => <code className="bg-white/10 rounded px-1.5 py-0.5 text-pink-200 text-sm">{children}</code>,
                    }}
                  >
                    {selectedBlogPost.content}
                  </ReactMarkdown>
                </div>
                {selectedBlogPost.tags && (
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5 flex-wrap">
                    {selectedBlogPost.tags.split(',').filter(Boolean).map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-full bg-white/5 text-white/30 text-[10px]">#{tag.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PWA Install Banner ═══ */}
      <AnimatePresence>
        {showInstallBanner && !appInstalled && !installDismissed && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:w-95 z-60"
          >
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#0f172a] to-[#1a1040] border border-white/10 shadow-2xl shadow-black/40 backdrop-blur-xl">
              {/* Animated gradient border glow */}
              <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
              <div className="relative p-4 sm:p-5">
                <button
                  onClick={handleDismissInstall}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white/40" />
                </button>

                <div className="flex items-start gap-4">
                  {/* App Icon */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-lg shadow-cyan-500/10">
                      <img
                        src="/logos/pwa-icon-192.png"
                        alt="UniUpdates"
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    </div>
                    {/* Notification badge */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <span className="text-white text-[8px] font-bold">NEW</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className="text-white font-bold text-sm sm:text-base">
                      Install UniUpdates App 📲
                    </h4>
                    <p className="text-white/40 text-xs mt-1 leading-relaxed line-clamp-2">
                      Add to home screen for faster access. Get instant notifications for exams, results & admissions!
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span className="text-white/30 text-[10px]">Fast</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5">
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <span className="text-white/30 text-[10px]">Offline</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5">
                        <Bell className="w-3 h-3 text-cyan-400" />
                        <span className="text-white/30 text-[10px]">Push Alerts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Install Button */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleInstallApp}
                    className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-purple-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Install App
                  </button>
                  <button
                    onClick={handleDismissInstall}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 text-xs font-medium transition-all duration-200"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer — Developed by Naveen Kumar */}
      <footer className="relative z-10 mt-auto">
        <div className="glass-strong-scrolled border-t border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col items-center gap-4">
              {/* Student Message */}
              <div className="text-center space-y-1.5 max-w-lg">
                <p className="text-white/30 text-xs sm:text-sm leading-relaxed">
                  📚 <span className="text-cyan-400/80 font-medium">UniUpdates</span> — Your own platform where every student gets the right information at the right time.
                </p>
                <p className="text-white/20 text-[11px] sm:text-xs">
                  Exam updates, admission alerts, board results, entrance exams — sab ek jagah. Ab kisi notice miss mat karo!
                </p>
              </div>
              {/* Divider */}
              <div className="w-32 h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent" />
              {/* Developed By */}
              <div className="group flex flex-col items-center gap-1.5 cursor-default">
                <motion.p
                  whileHover={{ scale: 1.05 }}
                  className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 text-sm sm:text-base font-bold tracking-wide transition-all duration-300"
                >
                  ✨ Developed by Naveen Kumar ✨
                </motion.p>
                <div className="flex items-center gap-2">
                  <span className="group-hover:opacity-100 opacity-50 transition-opacity duration-300">📍</span>
                  <p className="text-white/30 group-hover:text-orange-400 text-xs font-medium transition-all duration-300">
                    From Bihar, India 🇮🇳
                  </p>
                  <span className="group-hover:opacity-100 opacity-50 transition-opacity duration-300">📍</span>
                </div>
                <div className="overflow-hidden h-0 group-hover:h-5 transition-all duration-500">
                  <p className="text-white/20 text-[10px] group-hover:text-white/40 transition-colors duration-500">
                    Made with ❤️ for students of Bihar & all over India
                  </p>
                </div>
              </div>
              {/* Bottom bar */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-white/15 text-[10px] text-center">
                <span>© 2025 UniUpdates</span>
                <span>•</span>
                <span>All Rights Reserved</span>
                <span>•</span>
                <span>Bihar • Haryana • Delhi • UP</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
