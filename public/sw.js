const CACHE_NAME = 'alluniversity-shell-v10';
const STATIC_CACHE_NAME = 'alluniversity-static-v10';
const API_CACHE_NAME = 'alluniversity-api-v2';
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
  '/logos/bihar-logo-small.webp',
  '/logos/haryana-logo-small.webp',
  '/logos/delhi-logo-small.webp',
  '/logos/up-logo-small.webp',
];

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

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => ![CACHE_NAME, STATIC_CACHE_NAME, API_CACHE_NAME].includes(name))
            .map((name) => caches.delete(name))
        );
      }),
      self.registration.navigationPreload
        ? self.registration.navigationPreload.enable()
        : Promise.resolve(),
    ])
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin !== location.origin && !url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp)$/)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              cache.put(OFFLINE_URL, response.clone());
            });
          }
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match(OFFLINE_URL)) ||
            Response.error()
          );
        })
    );
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

  if (url.pathname.startsWith('/_next/')) return;

  if (
    url.pathname.startsWith('/logos/') ||
    url.pathname === '/logo.svg' ||
    url.pathname === '/manifest.json' ||
    url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|webp|woff2?)$/)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

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
