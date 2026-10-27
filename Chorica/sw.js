/* Chorica service worker: cache the app so it works offline. */
const CACHE = 'chorica-v2';
const FILES = ['./', 'index.html', 'css/app.css', 'js/core.js', 'js/parent.js', 'js/kid.js', 'js/occ-link.js', 'js/main.js', 'manifest.webmanifest', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png', 'img/favicon.png', 'fonts/Lora.ttf', 'fonts/Lora-Italic.ttf'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('chorica') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => { const u = new URL(e.request.url); if (u.origin !== location.origin || e.request.method !== 'GET') return; e.respondWith(fetch(e.request).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return res; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))); });
