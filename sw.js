/* Occultica Household launcher: caches only the launcher page. Each app keeps its own service worker for its folder. */
const CACHE = 'occultica-household-v3';
const FILES = ['./', 'index.html', 'occ-link.js', 'manifest.webmanifest', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png', 'img/favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('occultica-household') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (u.origin !== location.origin) return;
  const rel = u.pathname.replace(new URL(self.registration.scope).pathname, '');
  if (/^(Healthica|Hortica|Saturnica|Chorica|Backpackica|Campica|Roadtripica|Birthica|Recordica|Synths|Hauntica|3DPrintida)\//i.test(rel)) return; // the apps handle their own files
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('index.html'))));
});
