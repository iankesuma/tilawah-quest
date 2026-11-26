/* Tilawah Quest — data loader (bundled JSON, offline-first, retry + localStorage fallback) */
(function () {
  'use strict';
  var cache = {};
  var V = '?v=7';
  var LS = 'tq_data_cache_v1';

  function readDisk(path) {
    try {
      var all = JSON.parse(localStorage.getItem(LS) || '{}');
      return Object.prototype.hasOwnProperty.call(all, path) ? all[path] : null;
    } catch (e) { return null; }
  }
  function writeDisk(path, d) {
    try {
      var all = JSON.parse(localStorage.getItem(LS) || '{}');
      all[path] = d;
      localStorage.setItem(LS, JSON.stringify(all));
    } catch (e) {}
  }

  function get(path) {
    if (cache[path]) return Promise.resolve(cache[path]);
    var url = path + V;
    function attempt(n) {
      return fetch(url, { cache: 'reload' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (d) {
        cache[path] = d;
        writeDisk(path, d);
        return d;
      }).catch(function (e) {
        if (n < 2) return new Promise(function (res) { setTimeout(res, 400 * (n + 1)); })
          .then(function () { return attempt(n + 1); });
        var old = readDisk(path);
        if (old) { cache[path] = old; return old; }
        throw new Error('Gagal memuat data: ' + path);
      });
    }
    return attempt(0);
  }

  window.Quran = {
    juzList: function () { return get('data/juz.json'); },
    surahMeta: function () { return get('data/surah-meta.json'); },
    surah: function (n) { return get('data/quran/' + String(n).padStart(3, '0') + '.json'); },
    surahInJuz: function (n, from, to) {
      return get('data/quran/' + String(n).padStart(3, '0') + '.json').then(function (d) {
        return {
          n: d.n, name: d.name, ar: d.ar,
          ayahs: d.ayahs.filter(function (a) {
            return (from == null || a.i >= from) && (to == null || a.i <= to);
          })
        };
      });
    }
  };
})();
