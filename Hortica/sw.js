/* Hortica service worker: cache the app shell so it works offline in the field. */
const CACHE = 'hortica-v9';
const FILES = ['./', 'index.html', 'css/app.css', 'js/plants.js', 'js/herbs.js', 'js/fungidata.js', 'js/flowers2.js', 'js/veg2.js', 'js/fruit2.js', 'js/fungi2.js', 'js/pests2.js', 'js/flowers.js', 'js/data.js', 'js/shrubs.js', 'js/succ.js', 'js/trees1.js', 'js/trees2.js', 'js/vines.js', 'js/ground1.js', 'js/ground2.js', 'js/house.js', 'js/wet.js', 'js/coast.js', 'js/base.js', 'js/sky.js', 'js/map.js', 'js/plan.js', 'js/flowerui.js', 'js/fungi.js', 'js/fix.js', 'js/gopher.js', 'js/ask.js', 'js/log.js', 'js/photos.js', 'js/audit.js', 'js/start.js', 'js/remind.js', 'js/sync.js', 'js/land.js', 'js/almanac.js', 'js/views.js', 'js/occ-link.js', 'js/household.js', 'js/main.js', 'manifest.webmanifest',
  'img/seal.png', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png', 'img/favicon.png', 'fonts/Lora.ttf', 'fonts/Lora-Italic.ttf'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return; // weather, ZIP lookup and AI calls go straight to the network
  e.respondWith(fetch(e.request).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return res; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
