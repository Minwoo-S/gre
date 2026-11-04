const CACHE_NAME = 'gre-10day-offline-v4';
const ASSETS = [
  './',
  './index.html',
  './data.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(netRes => {
        if (netRes && netRes.status === 200 && event.request.method === 'GET' && url.origin === self.location.origin) {
          const clone = netRes.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return netRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
