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
    setMessage('');

    try {
      const response = await fetch(`/api/scrape/university/${universityId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await response.json().catch(() => ({}))) as RefreshResponse;

      if (!response.ok || data.success === false) {
        setMessage(data.message || 'Refresh abhi complete nahi ho paya. Thodi der baad try karein.');
        return;
      }

      setMessage(data.message || `${universityShortName} notices refreshed.`);
      router.refresh();
    } catch {
      setMessage('Network error aaya. Internet/server check karke phir try karein.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">{universityShortName} latest notifications refresh</h2>
          <p className="mt-1 text-xs leading-5 text-white/55">
            Official website se naye notices check karke list update karein.
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
