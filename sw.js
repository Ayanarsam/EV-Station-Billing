/* EV Station Billing: keeps the app on the phone so it opens fast, even with no internet.
   Bills themselves are never cached here; they go straight to the Google Sheet. */
const CACHE = 'ev-billing-v2';
const SHELL = ['./', './index.html', './admin.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // Google Sheet calls and fonts go to the network as normal
  // the page: newest from the internet when online, saved copy when offline
  if (req.mode === 'navigate') {
    const page = /admin\.html$/.test(url.pathname) ? './admin.html' : './index.html';
    e.respondWith(fetch(req).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(page, c)); } return res; })
      .catch(() => caches.match(page)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
