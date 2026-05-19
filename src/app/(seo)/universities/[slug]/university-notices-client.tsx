'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { noticeSlug } from '@/lib/seo-pages';
import { RefreshUniversityNotices } from './refresh-university-notices';

type NoticeItem = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  datePublished: string | Date;
};

type NoticesResponse = {
  success?: boolean;
  data?: NoticeItem[];
  total?: number;
};

type UniversityNoticesClientProps = {
  universityId: string;
  universityShortName: string;
  universityState: string;
  universityDistrict: string | null;
  initialNotices: NoticeItem[];
  initialNoticeCount: number;
  initialQuery: string;
  initialCategory: string;
};

function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'NA';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function UniversityNoticesClient({
  universityId,
  universityShortName,
  universityState,
  universityDistrict,
  initialNotices,
  initialNoticeCount,
  initialQuery,
  initialCategory,
}: UniversityNoticesClientProps) {
  const [notices, setNotices] = useState<NoticeItem[]>(initialNotices);
  const [totalCount, setTotalCount] = useState(initialNoticeCount);
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const categorySummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const notice of notices) {
      counts.set(notice.category, (counts.get(notice.category) || 0) + 1);
    }
    const categories = [...counts.keys()].sort((a, b) => a.localeCompare(b));
    return { categories, counts };
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const queryText = query.trim().toLowerCase();
    return notices.filter((notice) => {
      const noticeText = `${notice.title} ${notice.description || ''} ${notice.category}`.toLowerCase();
      const matchesQuery = !queryText || noticeText.includes(queryText);
      const matchesCategory = !selectedCategory || notice.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [notices, query, selectedCategory]);

  async function refreshNotices() {
    const response = await fetch(`/api/notices?universityId=${encodeURIComponent(universityId)}&limit=25`, {
      method: 'GET',
      cache: 'no-store',
    });
    const payload = (await response.json().catch(() => ({}))) as NoticesResponse;
    if (!response.ok || payload.success === false || !Array.isArray(payload.data)) return;

    setNotices(payload.data);
    if (typeof payload.total === 'number') setTotalCount(payload.total);
  }

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function clearFilters() {
    setQuery('');
    setSelectedCategory('');
  }

  return (
    <>
      <RefreshUniversityNotices
        universityId={universityId}
        universityShortName={universityShortName}
        onRefreshed={refreshNotices}
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <p className="text-xs text-white/35">State</p>
          <h2 className="mt-1 text-base font-semibold">{universityState}</h2>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <p className="text-xs text-white/35">District</p>
          <h2 className="mt-1 text-base font-semibold">{universityDistrict || 'India'}</h2>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <p className="text-xs text-white/35">Total Notices</p>
          <h2 className="mt-1 text-base font-semibold">{totalCount}</h2>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">{universityShortName} Latest Notices</h2>
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${!selectedCategory ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/55 hover:bg-white/10'}`}
          >
            All ({notices.length})
          </button>
          {categorySummary.categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedCategory === category ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/55 hover:bg-white/10'}`}
            >
              {category} ({categorySummary.counts.get(category) || 0})
            </button>
          ))}
        </div>
        <form
          method="get"
          className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/10 sm:p-6"
          onSubmit={handleFilterSubmit}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
            <label className="grid gap-1">
              <span className="sr-only">Search notice</span>
              <input
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="result, admit card, exam date..."
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/50"
              />
            </label>
            <label className="grid gap-1">
              <span className="sr-only">Category</span>
              <select
                name="category"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                <option value="">All categories</option>
                {categorySummary.categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="h-11 rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-200">
                Filter
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-11 items-center rounded-xl border border-white/10 px-3 text-sm font-semibold text-white/65 hover:bg-white/10"
              >
                Clear
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/40">{filteredNotices.length} notices found</p>
        </form>
        <div className="mt-4 grid gap-3">
          {filteredNotices.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
              {notices.length === 0 ? 'Latest notices will appear here after the next update.' : 'No notices matched this filter.'}
            </div>
          ) : (
            filteredNotices.map((notice) => (
              <article key={notice.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-cyan-200/80">{notice.category}</span>
                      <span>{formatDate(notice.datePublished)}</span>
                    </div>
                    <h3 className="text-base font-semibold leading-6">
                      <Link href={`/notices/${noticeSlug(notice)}`} className="hover:text-cyan-200">{notice.title}</Link>
                    </h3>
                  </div>
                  <Link
                    href={`/notices/${noticeSlug(notice)}`}
                    className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-cyan-300 px-3 text-xs font-bold text-slate-950 hover:bg-cyan-200"
                  >
                    Official Link
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
