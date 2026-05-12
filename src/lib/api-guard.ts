import { NextRequest, NextResponse } from 'next/server';

type RateWindow = {
  count: number;
  resetAt: number;
};

const rateWindows = new Map<string, RateWindow>();
const MAX_RATE_KEYS = 5000;

export function clientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  );
}

export function boundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}

export function publicCacheHeaders(maxAge = 60, staleWhileRevalidate = 300) {
  return {
    'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  };
}

export function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store, max-age=0',
  };
}

export function rateLimit(
  request: NextRequest,
  options: { key: string; limit: number; windowMs: number },
) {
  const now = Date.now();
  const id = `${options.key}:${clientIp(request)}`;
  const current = rateWindows.get(id);

  if (!current || current.resetAt <= now) {
    if (rateWindows.size > MAX_RATE_KEYS) {
      for (const [key, window] of rateWindows) {
        if (window.resetAt <= now) rateWindows.delete(key);
      }
      if (rateWindows.size > MAX_RATE_KEYS) rateWindows.clear();
    }
    rateWindows.set(id, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  current.count += 1;
  if (current.count <= options.limit) return null;

  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  return NextResponse.json(
    {
      success: false,
      message: `Too many requests. Please try again after ${retryAfter} seconds.`,
      retryAfter,
    },
    {
      status: 429,
      headers: {
        ...noStoreHeaders(),
        'Retry-After': String(retryAfter),
      },
    },
  );
}
