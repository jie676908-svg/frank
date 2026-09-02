const CACHE = 'water-god-theatre-v11';
const ASSETS = [
  './', './index.html', './manifest.json', './icon.png',
  './furina-stage.webp', './furina-morning.webp', './furina-theatre.webp', './furina-reference-stage.png',
  './furina-detective.webp', './furina-birthday.webp', './furina-collage.webp', './fontaine-opera.webp', './fontaine-daylight-v2.png',
  './features/首页计划.js', './features/剧场主页.js', './features/论文研读.js',
  './features/写作进度.js', './features/日记.js', './features/读书进度.js',
  './features/健身记录.js', './features/健康打卡.js', './features/主题皮肤.js', './features/番茄钟.js', './features/API额度.js'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response;
  }).catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html'))));
});
