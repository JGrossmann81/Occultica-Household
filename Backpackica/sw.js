/* Backpackica service worker: keeps the whole app on the phone so it works with no signal. Cache 7d1645ef. */
const CACHE = 'backpackica-7d1645ef';
const FILES = ["./", "css/app.css", "css/occ.css", "data/forage.js", "data/gear-presets.js", "data/survive-core.js", "data/survive-medical.js", "data/trailfoods.js", "data/trails-more.js", "data/trails-more2.js", "data/trails-other.js", "data/trails-pct-coords.js", "data/trails-pct.js", "fonts/Lora-Italic.ttf", "fonts/Lora.ttf", "img/apple-touch-icon.png", "img/favicon.png", "img/icon-192.png", "img/icon-512.png", "img/icon-maskable-512.png", "img/seal.png", "index.html", "js/10-today.js", "js/20-trail.js", "js/30-plan.js", "js/40-pack.js", "js/42-food.js", "js/50-survive.js", "js/52-tools.js", "js/55-forage.js", "js/60-log.js", "js/90-publish.js", "js/boot.js", "js/occ-core.js", "js/occ-geo.js", "js/occ-link.js", "js/occ-media.js", "manifest.webmanifest"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('backpackica-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return;   // maps, weather and lookups go straight to the network
  /* network first so a new version shows on the next open; the saved copy is used when there is no signal */
  e.respondWith(fetch(e.request).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return res; }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
});
