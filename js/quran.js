/* Tilawah Quest — data loader (bundled JSON, offline-first) */
(function () {
  'use strict';
  const cache = {};
  const V = '?v=6';

  function get(path) {
    if (cache[path]) return Promise.resolve(cache[path]);
    return fetch(path + V, { cache: 'default' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + path);
        return r.json();
      })
      .then(function (d) { cache[path] = d; return d; })
      .catch(function (e) {
        throw new Error('Gagal memuat data: ' + path);
      });
  }

  window.Quran = {
    juzList: function () { return get('data/juz.json'); },
    surahMeta: function () { return get('data/surah-meta.json'); },
    surah: function (n) { return get('data/quran/' + String(n).padStart(3, '0') + '.json'); },
    /** ayahs of one surah restricted to a juz range */
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
