/* Healthica service worker: cache the app shell so it works offline. */
const CACHE = 'healthica-v13';
const FILES = ['./', 'index.html', 'css/app.css', 'js/foods.js', 'js/core.js', 'js/ex.js', 'js/base.js', 'js/plan.js', 'js/intake.js', 'js/meds.js', 'js/pepdata.js', 'js/pep.js', 'js/sym.js', 'js/views.js', 'js/main.js', 'js/changes.js', 'js/kitdata.js', 'js/kitchen.js', 'js/formgen.js', 'js/form.js', 'js/dia.js', 'js/backup.js', 'js/profiles.js', 'js/occ-link.js', 'js/hh.js', 'js/patterns.js', 'js/qr.js', 'js/ice.js', 'js/reports.js', 'manifest.webmanifest',
  'img/seal.png', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png', 'img/favicon.png', 'fonts/Lora.ttf', 'fonts/Lora-Italic.ttf'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'healthica-pose').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.hostname === 'cdn.jsdelivr.net' && u.pathname.indexOf('@mediapipe/pose') >= 0) { e.respondWith(caches.open('healthica-pose').then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; })))); return; } // pose model: downloaded once, then offline
  if (u.origin !== location.origin || u.pathname.endsWith('peptides.json')) return; // online lookups and the knowledge file always go to the network
  e.respondWith(fetch(e.request).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return res; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(clients.matchAll({ type: 'window' }).then(l => l.length ? l[0].focus() : clients.openWindow('./'))); });
