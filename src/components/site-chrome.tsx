import Link from 'next/link';
import type { ReactNode } from 'react';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Universities', href: '/?view=universities' },
  { label: 'Notices', href: '/?view=notices' },
  { label: 'Entrance', href: '/?view=entrance' },
  { label: 'Board', href: '/?view=board' },
  { label: 'Blog', href: '/blog' },
];

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen app-bg flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-[90] glass-strong-scrolled">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-15 items-center justify-between sm:h-17">
            <Link href="/" className="brand-logo group flex shrink-0 items-center gap-2.5">
              <div className="brand-logo-mark flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-amber-300/35 bg-black/40 shadow-lg shadow-black/30 sm:h-12 sm:w-12">
                <img src="/logo.svg" alt="All University" className="h-full w-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <p className="brand-logo-title text-base font-bold leading-tight tracking-tight text-white">All University</p>
                <p className="brand-logo-sub text-[10px] leading-tight tracking-wide text-white/40">Student Portal</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1.5 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link rounded-lg px-3.5 py-2 text-[15px] font-semibold text-white/50 transition-all hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 pt-[72px] sm:pt-[84px]">
        {children}
      </main>

      <footer className="relative z-10 mt-auto">
        <div className="glass-strong-scrolled border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <div className="flex flex-col items-center gap-4">
              <div className="max-w-lg space-y-1.5 text-center">
                <p className="text-xs leading-relaxed text-white/30 sm:text-sm">
                  <span className="font-medium text-cyan-400/80">All University</span> - Your own platform where every student gets the right information at the right time.
                </p>
                <p className="text-[11px] text-white/20 sm:text-xs">
                  Exam updates, admission alerts, board results, entrance exams - sab ek jagah. Ab kisi notice miss mat karo!
                </p>
              </div>
              <div className="h-px w-32 bg-linear-to-r from-transparent via-cyan-500/30 to-transparent" />
              <div className="flex flex-col items-center gap-1.5">
                <p className="bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-sm font-bold tracking-wide text-transparent sm:text-base">
                  Developed by Naveen Kumar
                </p>
                <p className="text-xs font-medium text-white/30">From Bihar, India</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-center text-[10px] text-white/15">
                <span>Copyright 2025 All University</span>
                <span>-</span>
                <span>All Rights Reserved</span>
                <span>-</span>
                <span>Bihar - Haryana - Delhi - UP</span>
              </div>
              <div className="max-w-4xl rounded-xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-center shadow-sm">
                <p className="text-[10px] leading-5 text-white/58 sm:text-[11px]">
                  <span className="font-bold text-amber-200">Disclaimer:</span> AllUniversity.org is an independent educational portal and is NOT affiliated with any university, education board, or government body. All notifications and fee structures are gathered from public sources. Students are advised to verify the information from the respective official websites.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
