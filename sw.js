/* Tilawah Quest — offline cache */
const CORE = 'tq-core-v38';
const DATA = 'tq-data-v38';
const SHELL = [
  './', 'login.html', 'onboarding.html', 'juz.html', 'surah.html', 'play.html',
  'result.html', 'profil.html', 'belajar.html', 'bantuan.html', 'nabi.html',
  'rukun.html', 'hadis.html', 'sholat.html', 'baca.html', 'tebak.html',
  'css/app.css', 'css/screens.css',
  'js/app.js', 'js/quran.js', 'js/play.js',
  'js/sholat.js', 'js/baca.js', 'js/tebak.js',
  'manifest.json', 'icon.svg', 'data/juz.json', 'data/surah-meta.json', 'data/hadis.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CORE).then(function (c) {
    return Promise.all(SHELL.map(function (u) {
      return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CORE && k !== DATA; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.indexOf('/data/quran/') > -1 || url.pathname.indexOf('/data/tajwid/') > -1 || url.pathname.indexOf('/data/tebak.json') > -1) {
    e.respondWith(caches.open(DATA).then(function (c) {
      return c.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res.ok) c.put(req, res.clone());
          return res;
        });
      });
    }));
    return;
  }

  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      var copy = res.clone();
      if (res.ok) caches.open(CORE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match('juz.html');
    });
  }));
});
