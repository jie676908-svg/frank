const CACHE = 'water-god-theatre-v13';
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
  // no-cache = 每次都向服务器回源校验（有更新必拿新），避免 HTTP 启发式缓存导致 HTML/JS 新旧混搭
  event.respondWith(fetch(event.request, { cache: 'no-cache' }).then(response => {
    const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response;
  }).catch(() => caches.match(event.request, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
});
