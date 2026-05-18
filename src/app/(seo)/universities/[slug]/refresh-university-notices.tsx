'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type RefreshUniversityNoticesProps = {
  universityId: string;
  universityShortName: string;
};

type RefreshResponse = {
  success?: boolean;
  message?: string;
  newNotices?: number;
  rateLimited?: boolean;
};

export function RefreshUniversityNotices({ universityId, universityShortName }: RefreshUniversityNoticesProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function refreshNotices() {
    if (loading) return;

    setLoading(true);
    setMessage(`${universityShortName} official website is being checked...`);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`/api/scrape/university/${universityId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => ({}))) as RefreshResponse;

      if (!response.ok || data.success === false) {
        setMessage(data.message || 'Refresh could not be completed. Please try again shortly.');
        return;
      }

      setMessage(data.message || `${universityShortName} notices refreshed.`);
      router.refresh();
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setMessage(aborted
        ? 'Refresh is taking too long. Please try again; the official website may be slow.'
        : 'Network error. Check your internet or server connection and try again.');
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">{universityShortName} latest notifications refresh</h2>
          <p className="mt-1 text-xs leading-5 text-white/55">
            Check the official website for new notices and update the list.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshNotices}
          disabled={loading}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-cyan-300 px-4 text-xs font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Refreshing...' : 'Refresh Latest'}
        </button>
      </div>
      {message && (
        <p className="mt-3 rounded-md border border-white/10 bg-black/15 px-3 py-2 text-xs leading-5 text-white/65">
          {message}
        </p>
      )}
    </div>
  );
}
