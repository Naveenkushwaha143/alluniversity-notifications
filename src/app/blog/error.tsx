'use client';

import { RefreshCw } from 'lucide-react';

export default function BlogError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center px-4 py-10">
      <div className="glass-card w-full rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold text-white">Blog abhi load nahi ho raha</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">
          Thodi der me dobara try karein. Header aur footer ke andar page safe rahega.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </section>
  );
}
