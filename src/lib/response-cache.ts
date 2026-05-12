type CacheEntry<T> = {
  savedAt: number;
  payload: T;
};

const cache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_KEYS = 250;

export function setCachedResponse<T>(key: string, payload: T) {
  if (cache.size > MAX_CACHE_KEYS) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(key, {
    savedAt: Date.now(),
    payload,
  });
}

export function getCachedResponse<T>(key: string, maxAgeMs = 10 * 60 * 1000): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() - entry.savedAt > maxAgeMs) {
    cache.delete(key);
    return null;
  }

  return entry.payload;
}
