// Basic service worker for PWA installability (CLAUDE.md "Mobile strategy",
// decided 2026-08-04, built 2026-09-15). Deliberately minimal: this is a
// live sports-data site (standings, results, prize money change constantly),
// so this SW never caches a page, an API route, or a Supabase-backed
// response. It only precaches the install icons and provides a tiny offline
// fallback for the network-first navigation case. If you're tempted to add
// a cache-first strategy for pages/data here, don't -- that's how a viewer
// ends up looking at a stale championship table with no idea why.

const CACHE = 'paddockintel-shell-v1';
const PRECACHE_URLS = ['/api/pwa-icon/?size=192', '/api/pwa-icon/?size=512'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever intervene on top-level navigations (page loads). Everything
  // else -- API calls, Supabase, RSC payloads, fonts, scripts -- goes
  // straight to the network untouched, every time.
  if (request.mode !== 'navigate') return;

  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then(
        (cached) =>
          cached ||
          new Response(
            '<!doctype html><meta charset="utf-8"><title>Offline — PaddockIntel</title>' +
              '<body style="font-family:monospace;background:#EDE3D0;color:#2B2620;' +
              'display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">' +
              "You're offline, and this page wasn't cached. Reconnect and reload." +
              '</body>',
            { headers: { 'Content-Type': 'text/html' } }
          )
      )
    )
  );
});
