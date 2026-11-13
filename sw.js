const CACHE_NAME = 'gre-10day-offline-v32';
const ASSETS = [
  './',
  './index.html',
  './data.js?v=10',
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
    )).then(() => self.clients.claim()).then(() => {
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(c => { try { c.navigate(c.url); } catch(e) {} });
      });
    })
  );
});

// Network-First strategy for same-origin only (never intercept external audio MP3 streams)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' }).then(netRes => {
      if (netRes && netRes.status === 200) {
        const clone = netRes.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
      }
      return netRes;
    }).catch(() => caches.match(event.request))
  );
});
