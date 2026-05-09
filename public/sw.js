const CACHE_NAME = 'alluniversity-v6';
const API_CACHE_NAME = 'alluniversity-api-v1';
const OFFLINE_URL = '/';
const API_CACHE_PATHS = [
  '/api/universities',
  '/api/notices',
  '/api/admin/posts/public',
  '/api/blog/posts/public',
  '/api/live-notifications',
];

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/logo.svg',
];

// Install: precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('SW: Some precache URLs failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => ![CACHE_NAME, API_CACHE_NAME].includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except images)
  if (url.origin !== location.origin && !url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp)$/)) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    const canCacheApi = API_CACHE_PATHS.some((path) => url.pathname === path);
    if (!canCacheApi) return;

    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // Next.js runtime chunks must stay network-first and uncached, especially during development.
  if (url.pathname.startsWith('/_next/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || caches.match(OFFLINE_URL);
        });
      })
  );
});
