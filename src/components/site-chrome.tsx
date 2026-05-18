'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Bell,
  BookOpen,
  Building2,
  FileText,
  Home,
  Menu,
  Moon,
  RefreshCw,
  Sun,
  Wifi,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
  { label: 'Universities', href: '/universities', icon: <Building2 className="h-4 w-4" /> },
  { label: 'Notices', href: '/notices', icon: <Bell className="h-4 w-4" /> },
  { label: 'Entrance', href: '/entrance', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Boards', href: '/board', icon: <FileText className="h-4 w-4" /> },
];

const infoLinks = [
  { label: 'Blog', href: '/blog' },
];

type NotificationItem = {
  id?: string;
  title?: string;
  message?: string;
  source?: string;
  state?: string;
  category?: string;
  url?: string;
  timestamp?: string;
};

type NotificationPayload = {
  success?: boolean;
  total?: number;
  data?: NotificationItem[];
  message?: string;
};

function trimText(value: unknown, limit: number) {
  const text = String(value || '').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function readStorage(key: string) {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Browsers can block storage in private/restricted modes.
  }
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => readStorage('au-theme') === 'dark');
  const [muted, setMuted] = useState(() => readStorage('au-muted') === '1');
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [refreshToastOpen, setRefreshToastOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const loadNotifications = useCallback(async (limit = 50, loadingText = 'Checking latest All University notifications...') => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 7000);
    try {
      setLoading(true);
      setNotificationMessage(loadingText);
      const response = await fetch(`/api/live-notifications?limit=${limit}&t=${Date.now()}`, {
        headers: { accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as NotificationPayload;
      if (!response.ok || payload.success === false) {
        setNotificationMessage(payload.message || 'Latest notifications could not be loaded. Please try again.');
        return;
      }
      if (payload?.success && Array.isArray(payload.data)) {
        const items = payload.data.slice(0, limit);
        setNotifications(items);
        const count = payload.total ?? items.length;
        setNotificationMessage(
          count > 0
            ? `${count} latest notifications loaded from All University.`
            : 'No latest notification found right now.'
        );
      }
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setNotificationMessage(aborted
        ? 'Notification refresh is taking too long. Please try again.'
        : 'Network error. Latest notifications could not be loaded.');
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, [menuOpen]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    writeStorage('au-theme', next ? 'dark' : 'light');
  }

  function toggleMuted() {
    const next = !muted;
    setMuted(next);
    writeStorage('au-muted', next ? '1' : '0');
  }

  async function openNotifications() {
    setMenuOpen(false);
    setRefreshToastOpen(false);
    setOpen(true);
    await loadNotifications(50);
  }

  async function refreshNotificationCount() {
    setMenuOpen(false);
    setOpen(false);
    setRefreshToastOpen(true);
    await loadNotifications(50, 'Refresh Now loading...');
  }

  useEffect(() => {
    if (!refreshToastOpen || loading || !notificationMessage) return;
    const timer = window.setTimeout(() => setRefreshToastOpen(false), 6500);
    return () => window.clearTimeout(timer);
  }, [loading, notificationMessage, refreshToastOpen]);

  return (
    <div className="min-h-screen app-bg flex flex-col">
      <header className={`fixed left-0 right-0 top-0 z-90 transition-all duration-300 ${scrolled ? 'glass-strong-scrolled' : 'glass-strong'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-15 items-center justify-between gap-2 sm:h-17">
            <Link href="/" className="brand-logo group flex min-w-0 shrink-0 items-center gap-2.5" onClick={() => setMenuOpen(false)}>
              <span className="brand-logo-mark flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-300/35 bg-black/40 shadow-lg shadow-black/30 sm:h-12 sm:w-12">
                <img src="/logo.svg?v=20260518" alt="All University" width={48} height={48} decoding="async" className="h-full w-full object-contain" />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="brand-logo-title block truncate text-base font-bold leading-tight tracking-tight text-white">All University</span>
                <span className="brand-logo-sub block truncate text-[10px] leading-tight tracking-wide text-white/40">Student Portal</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link rounded-lg px-3.5 py-2 text-[15px] font-semibold text-white/50 transition-all hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              {infoLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link rounded-lg px-3 py-2 text-[14px] font-semibold text-white/45 transition-all hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5">
              <div className="hidden items-center gap-1 sm:flex" title="Live connected">
                <Wifi className="h-3 w-3 text-emerald-400" />
              </div>
              <button
                type="button"
                aria-label="Mute notifications"
                aria-pressed={muted}
                onClick={toggleMuted}
                className="mobile-header-action hidden h-10 w-10 items-center justify-center rounded-xl border sm:flex"
              >
                &#8977;
              </button>
              <button
                type="button"
                aria-label="Notifications"
                onClick={openNotifications}
                className="mobile-header-action relative z-160 flex h-12 w-12 items-center justify-center rounded-xl border touch-manipulation sm:h-10 sm:w-10"
              >
                <Bell className="h-5 w-5 pointer-events-none" />
                {!muted && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-linear-to-r from-red-500 to-orange-500 px-1.5 text-[11px] font-bold text-white shadow-lg shadow-red-500/40">
                    {notifications.length || 30}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={toggleDark}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="mobile-header-action hidden h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white sm:flex"
              >
                {dark ? (
                  <>
                    <Sun className="h-3.5 w-3.5" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    <span>Black</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={refreshNotificationCount}
                className="hidden h-8 items-center rounded-lg border-0 bg-linear-to-r from-cyan-500 to-blue-500 px-3 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-blue-600 sm:flex"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Refresh
              </button>

              <div className="lg:hidden">
                <button
                  type="button"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((value) => !value)}
                  className="mobile-header-action relative z-160 flex h-12 w-12 items-center justify-center rounded-xl border touch-manipulation"
                >
                  {menuOpen ? <X className="h-5 w-5 pointer-events-none" /> : <Menu className="h-5 w-5 pointer-events-none" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-100 bg-black/35 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu-panel fixed right-3 top-16 z-200 flex max-h-[calc(100dvh-5rem)] w-[min(18rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="border-b p-4 mobile-menu-border">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="brand-logo-mark flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-300/35 bg-black/40">
                    <img src="/logo.svg?v=20260518" alt="All University" width={44} height={44} decoding="async" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="mobile-menu-title truncate text-sm font-bold">All University</h2>
                    <p className="mobile-menu-sub text-[10px]">Student Portal</p>
                  </div>
                </div>
                <button type="button" onClick={() => setMenuOpen(false)} className="mobile-header-action flex h-9 w-9 items-center justify-center rounded-lg border">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="mobile-menu-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="my-2 h-px bg-white/5" />
              {infoLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="mobile-menu-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="space-y-2 border-t p-3 mobile-menu-border">
              <div className="mobile-menu-sub flex items-center gap-2 text-xs">
                <Wifi className="h-3 w-3 text-emerald-400" />
                <span>Live connected</span>
              </div>
              <button type="button" onClick={toggleDark} className="mobile-menu-action flex w-full items-center justify-start rounded-md border px-3 py-2 text-sm">
                {dark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {dark ? 'Light' : 'Black'} Mode
              </button>
              <button type="button" onClick={refreshNotificationCount} className="flex w-full items-center justify-center rounded-md bg-linear-to-r from-cyan-500 to-blue-500 px-3 py-2 text-sm font-semibold text-white">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed left-0 right-0 top-14 z-40 ticker-bar transition-all duration-300 sm:top-16 ${scrolled ? '-translate-y-11 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="ticker-bar-inner">
          <div className="relative flex h-9 items-center overflow-hidden">
            <div className="ticker-fade-left absolute bottom-0 left-0 top-0 z-20 flex items-center pl-2 pr-1">
              <span className="relative flex h-5 w-10 items-center justify-center rounded-full bg-red-500/90 text-[9px] font-bold tracking-wider text-white shadow-lg shadow-red-500/30">
                LIVE
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-red-300" />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-300" />
              </span>
            </div>
            <div className="ticker-fade-right absolute bottom-0 right-0 top-0 z-10" />
            <div className="marquee-track pl-14">
              {[
                'Latest Exam Results, Admissions & Board Updates',
                'Bihar, Haryana, Delhi, Uttar Pradesh universities',
                'Education Boards, Entrance Exams, Real-time Updates',
                'Latest Exam Results, Admissions & Board Updates',
                'Bihar, Haryana, Delhi, Uttar Pradesh universities',
                'Education Boards, Entrance Exams, Real-time Updates',
              ].map((text, index) => (
                <Link key={`${text}-${index}`} href="/notices" className="ticker-item">
                  <span className="ticker-dot" />
                  <span className="ticker-text">{text}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {refreshToastOpen && !open && (
        <div className="pointer-events-none fixed right-3 top-[5.4rem] z-[220] w-[min(92vw,23rem)] sm:right-5 sm:top-20">
          <div className="pointer-events-auto rounded-xl border border-cyan-300/25 bg-white px-4 py-3 text-slate-950 shadow-2xl shadow-black/20 dark:bg-slate-950 dark:text-white">
            <div className="flex items-center gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-white ${loading ? 'animate-pulse' : ''}`}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
                  Refresh Now
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-5">
                  {loading ? 'Refresh Now loading...' : notificationMessage}
                </p>
              </div>
              {!loading && (
                <button
                  type="button"
                  aria-label="Close refresh message"
                  onClick={() => setRefreshToastOpen(false)}
                  className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  X
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 flex-1 pt-[96px] sm:pt-[108px]">{children}</main>

      <footer className="relative z-10 mt-auto">
        <div className="glass-strong-scrolled border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-6 text-center sm:px-6">
            <p className="mb-3 text-sm text-white/45">All University - official education updates in one place.</p>
            <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-extrabold text-white/70">
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
            </nav>
            <p className="mx-auto mt-4 max-w-4xl rounded-xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-[10px] leading-5 text-white/55 sm:text-[11px]">
              <span className="font-bold text-amber-200">Declaration:</span> All University is an independent educational information portal. We are not affiliated with any university, education board, or government body. Students should verify every notice, result, admission date, fee detail, and official update from the respective official website before taking action.
            </p>
          </div>
        </div>
      </footer>

      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-[22px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="siteNoticeTitle" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 id="siteNoticeTitle" className="text-2xl font-black text-slate-950 dark:text-white">All University Notifications</h2>
                {notificationMessage && (
                  <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{notificationMessage}</p>
                )}
              </div>
              <button type="button" className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-100 font-black text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white" onClick={() => setOpen(false)}>X</button>
            </div>
            <div className="grid gap-3">
              {loading && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Fetching latest notifications...</div>}
              {!loading && notifications.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="font-bold text-slate-950 dark:text-white">No latest notification found.</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Please check the notices page or try again.</p>
                </div>
              )}
              {notifications.map((item, index) => (
                <a key={item.id || `${item.title}-${index}`} href={item.url || '/notices'} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-xs font-black text-sky-600 dark:text-sky-300">{item.category || 'Notification'}</span>
                  <h3 className="mt-2 text-base font-black leading-snug text-slate-950 dark:text-white">{trimText(item.title, 110)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{trimText(item.message, 150)}</p>
                  <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">{trimText(item.source || item.state || 'All University', 60)}</p>
                </a>
              ))}
              {notifications.length > 0 && (
                <Link href="/notices" className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-bold text-white hover:bg-sky-700" onClick={() => setOpen(false)}>
                  View all notices
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
