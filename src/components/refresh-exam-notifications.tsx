'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type RefreshExamNotificationsProps = {
  type: 'NTA' | 'BOARD' | 'ALL';
  title: string;
  description: string;
};

type RefreshResponse = {
  success?: boolean;
  message?: string;
  newNotifications?: number;
  targetsChecked?: number;
};

export function RefreshExamNotifications({ type, title, description }: RefreshExamNotificationsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function refreshNotifications() {
    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = (await response.json().catch(() => ({}))) as RefreshResponse;

      if (!response.ok || data.success === false) {
        setMessage(data.message || 'Refresh abhi complete nahi ho paya. Thodi der baad try karein.');
        return;
      }

      setMessage(data.message || 'Latest notifications refreshed.');
      router.refresh();
    } catch {
      setMessage('Network error aaya. Internet/server check karke phir try karein.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-white/55">{description}</p>
        </div>
        <button
          type="button"
          onClick={refreshNotifications}
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
