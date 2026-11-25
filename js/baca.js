/* Tilawah Quest — baca Quran berwarna tajwid */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var SURAH = +(params.get('surah') || 0) || null;
  var AYAH = +(params.get('ayah') || 0) || null;

  var LS_FONT = 'tq_baca_font';
  var LS_COLOR = 'tq_baca_color';
  var LS_LAST = 'tq_baca_last';

  var RULES = [
    { k: 'ghunnah', label: 'Ghunnah', color: '#2E9E4F', note: 'dengung 2 harakat' },
    { k: 'ikhfa', label: 'Ikhfa', color: '#C98200', note: 'samar, dengung' },
    { k: 'idgham', label: 'Idgham', color: '#1D6FB8', note: 'lebur ke huruf berikut' },
    { k: 'iqlab', label: 'Iqlab', color: '#D63384', note: 'nun jadi mim' },
    { k: 'qalqalah', label: 'Qalqalah', color: '#8A4B2A', note: 'memantul' },
    { k: 'mad', label: 'Mad', color: '#DC2626', note: 'panjang 2 harakat' },
    { k: 'mad_lazim', label: 'Mad lazim', color: '#7F1D1D', note: 'panjang 6 harakat' }
  ];

  var el = {};
  ['g-name', 'g-ar', 'ayat-list', 'legend', 'sheet', 'surah-list', 'search', 'title',
   'prev', 'next', 'font-down', 'font-up', 'color-toggle', 'pts', 'last'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });

  var meta = null, offsets = [], cur = SURAH, ayahs = [], audio = null, playing = -1, bism = null;
  var fontPx = +(localStorage.getItem(LS_FONT) || 30);
  var colored = localStorage.getItem(LS_COLOR) !== '0';

  function pad(n) { return ('00' + n).slice(-3); }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function applyFont() {
    document.documentElement.style.setProperty('--baca-size', fontPx + 'px');
    localStorage.setItem(LS_FONT, String(fontPx));
  }

  function applyColor() {
    el['ayat-list'].classList.toggle('no-color', !colored);
    el['color-toggle'].setAttribute('aria-pressed', String(colored));
    el['color-toggle'].textContent = colored ? '🎨 Warna: nyala' : '🎨 Warna: mati';
    localStorage.setItem(LS_COLOR, colored ? '1' : '0');
  }

  function ayahHtml(a) {
    var html = '';
    a.s.forEach(function (seg) {
      var txt = esc(seg[0]);
      html += seg[1] ? '<span class="tj tj-' + seg[1] + '">' + txt + '</span>' : txt;
    });
    return html;
  }

  function renderLegend() {
    el.legend.innerHTML = RULES.map(function (r) {
      return '<button type="button" class="lg" data-rule="' + r.k + '">' +
        '<span class="dot" style="background:' + r.color + '"></span>' +
        '<b>' + r.label + '</b><i>' + r.note + '</i></button>';
    }).join('') + '<p class="lg-note">Ketuk ayat untuk memutar bacaan. Warna mengikuti kaidah tajwid mushaf standar.</p>';
    Array.prototype.forEach.call(el.legend.querySelectorAll('.lg'), function (b) {
      b.onclick = function () {
        var rule = b.dataset.rule;
        var on = !b.classList.contains('off');
        b.classList.toggle('off', on);
        el['ayat-list'].classList.toggle('hide-' + rule, on);
      };
    });
  }

  function render() {
    if (!meta) return;
    var m = meta[cur - 1];
    el['g-name'].textContent = m.name;
    el['g-ar'].textContent = m.ar;
    document.title = m.name + ' — Tilawah Quest';

    var bismillah = '';
    if (cur !== 1 && cur !== 9) {
      bismillah = '<div class="baca-bismillah">' +
        (bism ? ayahHtml({ s: bism }) : 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ') + '</div>';
    }

    el['ayat-list'].innerHTML = bismillah + ayahs.map(function (a) {
      return '<div class="ayah" id="a' + a.i + '" data-i="' + a.i + '">' +
        '<span class="ayah-tx">' + ayahHtml(a) + '</span>' +
        '<button class="ayah-no" type="button" aria-label="Putar ayat ' + a.i + '">' + a.i + '</button>' +
        '</div>';
    }).join('');

    Array.prototype.forEach.call(el['ayat-list'].querySelectorAll('.ayah'), function (row) {
      row.onclick = function () { play(+row.dataset.i); };
    });

    el.prev.disabled = cur <= 1;
    el.next.disabled = cur >= 114;
    el.prev.textContent = '← ' + (cur > 1 ? meta[cur - 2].name : '');
    el.next.textContent = (cur < 114 ? meta[cur].name : '') + ' →';
    applyFont(); applyColor();
  }

  function play(i) {
    var a = ayahs.find(function (x) { return x.i === i; });
    if (!a) return;
    var global = offsets[cur - 1] + i;
    if (audio) { audio.pause(); audio = null; }
    Array.prototype.forEach.call(el['ayat-list'].querySelectorAll('.ayah.playing'), function (x) { x.classList.remove('playing'); });
    var row = document.getElementById('a' + i);
    if (playing === i) { playing = -1; return; }
    playing = i;
    if (row) row.classList.add('playing');
    audio = new Audio('https://cdn.islamic.network/quran/audio/128/ar.alafasy/' + global + '.mp3');
    audio.onended = function () {
      if (row) row.classList.remove('playing');
      playing = -1;
      var nx = ayahs.find(function (x) { return x.i === i + 1; });
      if (nx) play(nx.i);
    };
    audio.play().catch(function () {
      if (row) row.classList.remove('playing');
      playing = -1;
      TQ.popup({ icon: '🔇', title: 'Audio tidak bisa diputar', text: 'Butuh internet untuk memutar bacaan.', bad: true, actions: [{ label: 'Oke' }] });
    });
  }

  function load(n, ayahTarget) {
    cur = Math.min(114, Math.max(1, n));
    el['ayat-list'].innerHTML = '<p class="muted center" style="padding:24px 0">Memuat surah…</p>';
    return fetch('data/tajwid/' + pad(cur) + '.json?v=21')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        ayahs = d.ayahs;
        render();
        try { localStorage.setItem(LS_LAST, JSON.stringify({ surah: cur, ayah: ayahTarget || 1 })); } catch (e) {}
        history.replaceState(null, '', 'baca.html?surah=' + cur + (ayahTarget ? '&ayah=' + ayahTarget : ''));
        if (ayahTarget) {
          var t = document.getElementById('a' + ayahTarget);
          if (t) setTimeout(function () { t.scrollIntoView({ block: 'center' }); t.classList.add('flash'); }, 120);
        } else {
          window.scrollTo({ top: 0 });
        }
        closeSheet();
      })
      .catch(function (e) {
        el['ayat-list'].innerHTML = '<p class="muted center">Gagal memuat surah. <a href="baca.html?surah=' + cur + '">Coba lagi</a></p>';
      });
  }

  /* ---------- sheet pilih surah ---------- */
  function openSheet() {
    el.sheet.classList.add('open');
    el.sheet.setAttribute('aria-hidden', 'false');
    if (el.search) { el.search.value = ''; filter(''); el.search.focus(); }
  }
  function closeSheet() {
    el.sheet.classList.remove('open');
    el.sheet.setAttribute('aria-hidden', 'true');
  }
  function filter(q) {
    q = (q || '').toLowerCase().trim();
    var list = meta.filter(function (m) {
      return !q || m.name.toLowerCase().indexOf(q) > -1 || String(m.n) === q || (m.ar || '').indexOf(q) > -1;
    });
    el['surah-list'].innerHTML = list.map(function (m) {
      return '<button type="button" class="srow' + (m.n === cur ? ' on' : '') + '" data-n="' + m.n + '">' +
        '<span class="srow-no">' + m.n + '</span>' +
        '<span class="srow-tx"><b>' + m.name + '</b><i>' + m.type + ' · ' + m.ayat + ' ayat · Juz ' + m.juzStart + (m.juzEnd !== m.juzStart ? '–' + m.juzEnd : '') + '</i></span>' +
        '<span class="srow-ar">' + m.ar + '</span></button>';
    }).join('') || '<p class="muted center" style="padding:16px">Tidak ketemu.</p>';
    Array.prototype.forEach.call(el['surah-list'].querySelectorAll('.srow'), function (b) {
      b.onclick = function () { TQ.sfx.tap(); load(+b.dataset.n); };
    });
  }

  /* ---------- boot ---------- */
  Promise.all([Quran.surahMeta(), Quran.juzList()]).then(function (res) {
    meta = res[0];
    var acc = 0;
    meta.forEach(function (m) { offsets.push(acc); acc += m.ayahs; });
    renderLegend();
    if (el.pts) el.pts.textContent = TQ.fmt(TQ.points());

    var last = null;
    try { last = JSON.parse(localStorage.getItem(LS_LAST) || 'null'); } catch (e) {}
    if (last && last.surah) {
      el.last.hidden = false;
      el.last.textContent = '📖 Lanjut ' + meta[last.surah - 1].name + ' ayat ' + (last.ayah || 1);
      el.last.onclick = function () { load(last.surah, last.ayah || 1); };
    } else {
      el.last.hidden = true;
    }

    el.title.onclick = openSheet;
    document.getElementById('pick').onclick = openSheet;
    document.getElementById('sheet-close').onclick = closeSheet;
    el.sheet.onclick = function (e) { if (e.target === el.sheet) closeSheet(); };
    el.search.oninput = function () { filter(el.search.value); };

    el['font-up'].onclick = function () { fontPx = Math.min(48, fontPx + 2); applyFont(); };
    el['font-down'].onclick = function () { fontPx = Math.max(20, fontPx - 2); applyFont(); };
    el['color-toggle'].onclick = function () { colored = !colored; applyColor(); TQ.sfx.tap(); };

    el.prev.onclick = function () { if (cur > 1) load(cur - 1); };
    el.next.onclick = function () { if (cur < 114) load(cur + 1); };

    fetch('data/tajwid/001.json?v=21').then(function (r) { return r.json(); })
      .then(function (d) { bism = d.ayahs[0].s; })
      .catch(function () {})
      .then(function () { load(SURAH || 1, AYAH); });
  }).catch(function (e) {
    el['ayat-list'].innerHTML = '<p class="muted center">Data surah gagal dimuat.</p>';
  });
})();
