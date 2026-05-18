'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  FileText,
  GraduationCap,
  Newspaper,
  Sparkles,
} from 'lucide-react';
import { SiteChrome } from '@/components/site-chrome';

type NotificationItem = {
  id?: string;
  title?: string;
  message?: string;
  source?: string;
  category?: string;
  state?: string;
  timestamp?: string;
  url?: string;
};

type BlogPost = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  coverImage?: string | null;
  author?: string;
  category?: string;
  readTime?: string;
  createdAt?: string;
};

const stateCards = [
  {
    name: 'Bihar',
    href: '/states/bihar',
    count: '44 Universities',
    logo: '/logos/bihar-logo-small.webp',
    color: 'text-orange-500',
    ring: 'group-hover:border-orange-300/60',
  },
  {
    name: 'Haryana',
    href: '/states/haryana',
    count: '44 Universities',
    logo: '/logos/haryana-logo-small.webp',
    color: 'text-emerald-500',
    ring: 'group-hover:border-emerald-300/60',
  },
  {
    name: 'Delhi',
    href: '/states/delhi',
    count: '42 Universities',
    logo: '/logos/delhi-logo-small.webp',
    color: 'text-red-500',
    ring: 'group-hover:border-red-300/60',
  },
  {
    name: 'UP',
    href: '/states/uttar-pradesh',
    count: '72 Universities',
    logo: '/logos/up-logo-small.webp',
    color: 'text-teal-500',
    ring: 'group-hover:border-teal-300/60',
  },
];

const featureCards = [
  {
    title: 'Exam Updates',
    href: '/entrance',
    copy: 'Exam dates, admit cards, entrance alerts and result announcements.',
    icon: <GraduationCap className="h-6 w-6" />,
  },
  {
    title: 'Admission Alerts',
    href: '/notices',
    copy: 'Forms, counselling schedules, merit lists and seat allotments.',
    icon: <Bell className="h-6 w-6" />,
  },
  {
    title: 'Board Results',
    href: '/board',
    copy: 'Board results, date sheets, marksheets and compartment notices.',
    icon: <FileText className="h-6 w-6" />,
  },
];

const fallbackNotifications: NotificationItem[] = [
  {
    title: 'Latest university notices will appear here',
    message: 'Open notices to check official updates, results, admit cards and admissions.',
    source: 'All University',
    category: 'Notification',
    url: '/notices',
  },
  {
    title: 'Bihar university live updates',
    message: 'Check Bihar universities for the newest official notices.',
    source: 'Live notifications',
    category: 'Bihar',
    url: '/states/bihar',
  },
  {
    title: 'Entrance and board updates',
    message: 'Find exam dates, result updates and board alerts in one place.',
    source: 'Student portal',
    category: 'Exam',
    url: '/entrance',
  },
];

const fallbackBlogs: BlogPost[] = [
  {
    title: 'Student guides and university updates',
    excerpt: 'Read simple guides for results, admissions, exams and forms.',
    author: 'All University',
    category: 'Blog',
    slug: '',
  },
  {
    title: 'How to track official notices',
    excerpt: 'Use official university pages and All University updates together.',
    author: 'Student help',
    category: 'Guide',
    slug: '',
  },
  {
    title: 'Admission and result explainers',
    excerpt: 'Blog posts from the admin panel will show here automatically.',
    author: 'Education',
    category: 'News',
    slug: '',
  },
];

function trimText(value: unknown, limit: number) {
  const text = String(value || '').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function formatDate(value?: string) {
  if (!value) return 'Latest';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Latest';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export function HomeClient() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(fallbackNotifications);
  const [blogs, setBlogs] = useState<BlogPost[]>(fallbackBlogs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      const loadingTimer = window.setTimeout(() => {
        if (!cancelled) setLoading(true);
      }, 300);

      const [notificationResult, blogResult] = await Promise.all([
        fetchJsonWithTimeout(`/api/live-notifications?limit=8&t=${Date.now()}`),
        fetchJsonWithTimeout(`/api/blog/posts/public?limit=8&t=${Date.now()}`),
      ]);

      window.clearTimeout(loadingTimer);
      if (cancelled) return;

      if (
        notificationResult?.success &&
        Array.isArray(notificationResult.data) &&
        notificationResult.data.length > 0
      ) {
        setNotifications(notificationResult.data);
      }

      if (
        blogResult?.success &&
        Array.isArray(blogResult.data) &&
        blogResult.data.length > 0
      ) {
        setBlogs(blogResult.data);
      }

      setLoading(false);
    }

    void loadHomeData();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Universities', value: '202+', icon: <Building2 className="h-5 w-5" /> },
      { label: 'Latest Notices', value: notifications.length > fallbackNotifications.length ? `${notifications.length}+` : '60+', icon: <Bell className="h-5 w-5" /> },
      { label: 'Blog Posts', value: blogs.length > fallbackBlogs.length ? `${blogs.length}+` : 'Live', icon: <Newspaper className="h-5 w-5" /> },
    ],
    [blogs.length, notifications.length]
  );

  return (
    <SiteChrome>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:pb-14">
        <div className="space-y-10">
          <section className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {loading ? 'Checking latest updates...' : 'Live university notifications'}
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">All University</span>
              <br />
              <span className="text-white">Updates</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/45 sm:text-lg">
              Latest notices, results, admissions, board updates and entrance alerts in one place.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {featureCards.map((card) => (
              <Link key={card.href} href={card.href} className="glass-card group rounded-xl border border-white/5 p-5 transition-all hover:border-cyan-400/25">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 transition group-hover:scale-105">
                    {card.icon}
                  </span>
                  <span>
                    <h2 className="text-base font-semibold text-white">{card.title}</h2>
                    <p className="mt-1.5 text-sm leading-6 text-white/40">{card.copy}</p>
                  </span>
                </div>
              </Link>
            ))}
          </section>

          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {stateCards.map((state) => (
              <Link
                key={state.href}
                href={state.href}
                className="group rounded-[26px] border border-slate-300/70 bg-linear-to-br from-white/95 to-slate-50/80 p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 dark:border-white/10 dark:from-white/[0.07] dark:to-white/[0.035]"
              >
                <span className={`mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-[3px] border-slate-200 bg-white shadow-inner transition ${state.ring}`}>
                  <img src={state.logo} alt={`${state.name} university updates`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </span>
                <h2 className="mt-8 text-3xl font-black text-slate-950 dark:text-white">{state.name}</h2>
                <p className={`mt-4 text-2xl font-medium ${state.color}`}>{state.count}</p>
              </Link>
            ))}
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="glass-card rounded-xl border border-white/5 p-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">{item.icon}</span>
                  <span>
                    <span className="block text-3xl font-black text-white">{item.value}</span>
                    <span className="text-sm font-medium text-white/40">{item.label}</span>
                  </span>
                </div>
              </div>
            ))}
          </section>

          <ScrollSection
            title="Latest Notifications"
            subtitle="Live notices, exam alerts and official updates"
            href="/notices"
            icon={<Bell className="h-5 w-5" />}
          >
            {notifications.map((item, index) => (
              <Link
                key={item.id || `${item.title}-${index}`}
                href={item.url || '/notices'}
                className="notice-item-card glass-card flex h-56 w-[min(21rem,84vw)] shrink-0 flex-col justify-between rounded-xl border border-white/5 p-5"
              >
                <span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/10 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-bold text-cyan-200">
                    <Sparkles className="h-3 w-3" />
                    {trimText(item.category || 'Notification', 22)}
                  </span>
                  <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-snug text-white">{trimText(item.title, 92)}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/45">{trimText(item.message, 132)}</p>
                </span>
                <span className="flex items-center justify-between gap-3 text-xs font-medium text-white/35">
                  <span className="truncate">{trimText(item.source || item.state || 'All University', 36)}</span>
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(item.timestamp)}
                  </span>
                </span>
              </Link>
            ))}
          </ScrollSection>

          <ScrollSection
            title="Latest Blog"
            subtitle="Fresh guides and student explainers"
            href="/blog"
            icon={<BookOpen className="h-5 w-5" />}
          >
            {blogs.map((post, index) => (
              <Link
                key={post.id || `${post.title}-${index}`}
                href={post.slug ? `/blog/${post.slug}` : '/blog'}
                className="blog-featured-card flex h-64 w-[min(22rem,84vw)] shrink-0 flex-col overflow-hidden rounded-xl border border-white/5 bg-white/[0.04]"
              >
                {post.coverImage ? (
                  <img src={post.coverImage} alt="" className="h-28 w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <span className="flex h-28 w-full items-center justify-center bg-linear-to-br from-pink-500/20 via-cyan-500/10 to-purple-500/20 text-pink-200">
                    <Newspaper className="h-9 w-9" />
                  </span>
                )}
                <span className="flex flex-1 flex-col justify-between p-4">
                  <span>
                    <span className="text-[11px] font-black uppercase tracking-wide text-pink-300">{trimText(post.category || 'Blog', 22)}</span>
                    <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-white">{trimText(post.title, 82)}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">{trimText(post.excerpt, 110)}</p>
                  </span>
                  <span className="flex items-center justify-between gap-3 text-xs text-white/35">
                    <span className="truncate">{trimText(post.author || 'Admin', 24)}</span>
                    <span>{post.readTime || formatDate(post.createdAt)}</span>
                  </span>
                </span>
              </Link>
            ))}
          </ScrollSection>
        </div>
      </section>
    </SiteChrome>
  );
}

function ScrollSection({
  title,
  subtitle,
  href,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-300">{icon}</span>
          <span>
            <h2 className="text-xl font-black text-white sm:text-2xl">{title}</h2>
            <p className="mt-1 text-xs text-white/35 sm:text-sm">{subtitle}</p>
          </span>
        </div>
        <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm font-bold text-cyan-200 hover:text-cyan-100 sm:inline-flex">
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="home-scroll-strip -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6">
        {children}
      </div>
    </section>
  );
}
