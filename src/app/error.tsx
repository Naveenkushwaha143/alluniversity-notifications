'use client';

import { RefreshCw } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen app-bg flex items-center justify-center px-4">
      <div className="glass-card max-w-md rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold text-white">Page load nahi ho paaya</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">
          Connection ya server response me issue aaya. Dobara try karein.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
