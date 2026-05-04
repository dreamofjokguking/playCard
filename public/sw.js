/* PlayCard service worker — 정적 자산 캐싱 + 오프라인 fallback (간단 모드) */
const CACHE_NAME = 'playcard-shell-v1';
const PRECACHE_URLS = ['/', '/offline', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // 같은 출처가 아니면 SW 개입하지 않음
  if (url.origin !== self.location.origin) return;
  // API 요청은 항상 네트워크 우선 (오프라인이면 실패 그대로)
  if (url.pathname.startsWith('/api/')) return;
  // 페이지 내비게이션: network → 실패 시 오프라인 fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOffline = await cache.match('/offline');
        return cachedOffline || cache.match('/') || Response.error();
      })
    );
    return;
  }
  // 정적 자산: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
          return response;
        })
        .catch(() => cached || Response.error());
    })
  );
});
