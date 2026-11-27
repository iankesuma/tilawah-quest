/* Tilawah Quest — core app helpers: store, profile, progress, audio, popup */
(function () {
  'use strict';

  /* ---------- multi-anak: namespace penyimpanan per anak ----------
     Anak pertama (id 'c1') memakai kunci lama tanpa prefix, jadi progres lama tetap aman.
     Anak lain memakai prefix tq_<id>_ . Kunci global tidak diprefix. */
  var GLOBAL_KEYS = { tq_children: 1, tq_active: 1, tq_voice: 1, tq_data_cache_v1: 1 };
  var _proto = Storage.prototype;
  var _getItem = _proto.getItem.__orig || _proto.getItem;
  var _setItem = _proto.setItem.__orig || _proto.setItem;
  var _removeItem = _proto.removeItem.__orig || _proto.removeItem;
  function rawGet(k) { try { return _getItem.call(localStorage, k); } catch (e) { return null; } }
  function nsKey(k, childId) {
    if (typeof k !== 'string' || k.indexOf('tq_') !== 0 || GLOBAL_KEYS[k]) return k;
    if (!childId || childId === 'c1') return k;
    return 'tq_' + childId + '_' + k.slice(3);
  }
  function activeId() { return rawGet('tq_active') || 'c1'; }
  if (!_proto.getItem.__tqNs) {
    var _pg = _getItem, _ps = _setItem, _pr = _removeItem;
    _proto.getItem = function (k) { return _pg.call(this, this === localStorage ? nsKey(k, activeId()) : k); };
    _proto.setItem = function (k, v) { return _ps.call(this, this === localStorage ? nsKey(k, activeId()) : k, v); };
    _proto.removeItem = function (k) { return _pr.call(this, this === localStorage ? nsKey(k, activeId()) : k); };
    _proto.getItem.__tqNs = true; _proto.getItem.__orig = _pg;
    _proto.setItem.__tqNs = true; _proto.setItem.__orig = _ps;
    _proto.removeItem.__tqNs = true; _proto.removeItem.__orig = _pr;
  }

  const KEY = 'tq_v1';

  const DEFAULT = {
    profile: { name: '', char: 'abubakar', color: '#2F80C9', hat: 'none', onboarded: false },
    points: 0,
    progress: {},   // { surah: { ayat: {1:stars,2:stars}, arti: {1:..,2:..} } }
    best: {},       // { surah: {mode: {combo, score}} }
    stats: { levels: 0, ayahs: 0, heartsLost: 0, bestCombo: 0 },
    diriku: { gender: 'girl', shirt: 0, pants: 0, shoe: 0, ride: 0, toy: 0, owned: { shirt: [0], pants: [0], shoe: [0], ride: [0], toy: [0] } }
  };

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
      const d = JSON.parse(raw);
      return Object.assign(JSON.parse(JSON.stringify(DEFAULT)), d, {
        profile: Object.assign({}, DEFAULT.profile, d.profile || {}),
        stats: Object.assign({}, DEFAULT.stats, d.stats || {}),
        diriku: Object.assign({}, DEFAULT.diriku, d.diriku || {}, {
          owned: Object.assign({}, DEFAULT.diriku.owned, (d.diriku && d.diriku.owned) || {})
        })
      });
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT));
    }
  }

  let state = read();

  function save() {
    try {
      // guard against a stale tab clobbering a newer profile / higher points
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.profile && d.profile.onboarded && !state.profile.onboarded) {
          state.profile = Object.assign({}, state.profile, d.profile);
        }
        if (d && typeof d.points === 'number' && d.points > state.points) state.points = d.points;
      }
    } catch (e) {}
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }


  /* ---------- karakter (tokoh teladan) ---------- */
  const CHARACTERS = [
    { id: 'abubakar', name: 'Abu Bakar', skin: '#E8C09B', robe: '#2F80C9', head: 'turban', headColor: '#FFFFFF', beard: 'short', face: 'oval', note: 'Sahabat pertama, jujur dan lembut' },
    { id: 'umar', name: 'Umar', skin: '#E3B58C', robe: '#8DBF2E', head: 'cap', headColor: '#F5F5F0', beard: 'full', face: 'square', note: 'Tegas dan adil' },
    { id: 'utsman', name: 'Utsman', skin: '#EFC9A4', robe: '#8E6FD1', head: 'turban', headColor: '#FFF3D6', beard: 'short', face: 'oval', note: 'Pemalu dan dermawan' },
    { id: 'ali', name: 'Ali', skin: '#E7BC93', robe: '#2AB5A5', head: 'turban', headColor: '#1F2933', beard: 'full', face: 'oval', note: 'Cerdas dan pemberani' },
    { id: 'bilal', name: 'Bilal', skin: '#7A4B2E', robe: '#F5A623', head: 'cap', headColor: '#E2564E', beard: 'short', face: 'round', note: 'Suara azan yang indah' },
    { id: 'khalid', name: 'Khalid', skin: '#D9A273', robe: '#5B6B7A', head: 'turban', headColor: '#2F80C9', beard: 'full', face: 'square', note: 'Panglima yang gagah' },
    { id: 'salman', name: 'Salman', skin: '#EBD0B4', robe: '#6E9A1F', head: 'cap', headColor: '#FFFFFF', beard: 'full', face: 'oval', note: 'Cerdik dan suka menolong' },
    { id: 'hamzah', name: 'Hamzah', skin: '#D79A66', robe: '#E2564E', head: 'none', headColor: '#3A2A22', beard: 'full', face: 'square', note: 'Kuat dan berani' },
    { id: 'zubair', name: 'Zubair', skin: '#E4B78E', robe: '#315B9D', head: 'cap', headColor: '#8DBF2E', beard: 'none', face: 'round', note: 'Cepat tanggap' },
    { id: 'aisyah', name: 'Aisyah', skin: '#F1CBA6', robe: '#F06A8A', head: 'hijab', headColor: '#E98AB8', beard: 'none', face: 'round', female: true, note: 'Cerdas dan banyak meriwayatkan hadis' },
    { id: 'fatimah', name: 'Fatimah', skin: '#F1CBA6', robe: '#B48BD8', head: 'hijab', headColor: '#C9A3E8', beard: 'none', face: 'oval', female: true, note: 'Sabar dan penyayang' },
    { id: 'khadijah', name: 'Khadijah', skin: '#EDC49D', robe: '#2F80C9', head: 'hijab', headColor: '#7FB3D5', beard: 'none', face: 'oval', female: true, note: 'Pengusaha mulia dan setia' }
  ];

  /* ---------- profile ---------- */
  const HATS = [
    { id: 'none', label: 'Tanpa', color: 'transparent', brim: false },
    { id: 'peci', label: 'Peci putih', color: '#FFFFFF', brim: false },
    { id: 'kopyah', label: 'Kopiyah', color: '#1F2933', brim: false },
    { id: 'cap', label: 'Short cap', color: '#2F80C9', brim: true },
    { id: 'koboi', label: 'Koboi', color: '#8B5A2B', brim: true },
    { id: 'bucket', label: 'Bucket', color: '#DCEBF3', brim: true }
  ];
  const COLORS = ['#2F80C9', '#F06A8A', '#8DBF2E', '#F5A623', '#8E6FD1', '#2AB5A5', '#E2564E', '#FFC93C', '#5B6B7A'];

  function profile() { return state.profile; }
  function character(id) {
    var key = id || state.profile.char;
    return CHARACTERS.find(function (c) { return c.id === key; }) || CHARACTERS[0];
  }
  function setProfile(p) { Object.assign(state.profile, p); save(); registerChild(); }
  function points() { return state.points; }
  function addPoints(n) { state.points = Math.max(0, state.points + n); save(); return state.points; }
  function stats() { return state.stats; }
  function bumpStat(k, n) { state.stats[k] = (state.stats[k] || 0) + (n == null ? 1 : n); save(); }

  /* ---------- progress ---------- */
  function stageKey(level, stage) {
    const st = +stage || 1;
    return st > 1 ? level + '.' + st : String(level);
  }
  function stageStars(surah, mode, level, stage) {
    const s = state.progress[surah];
    return (s && s[mode] && s[mode][stageKey(level, stage)]) || 0;
  }
  function setStageStars(surah, mode, level, stars, stage) {
    state.progress[surah] = state.progress[surah] || {};
    state.progress[surah][mode] = state.progress[surah][mode] || {};
    const k = stageKey(level, stage);
    const prev = state.progress[surah][mode][k] || 0;
    if (stars > prev) state.progress[surah][mode][k] = stars;
    save();
  }
  function levelStagesDone(surah, mode, level) {
    const s = state.progress[surah];
    if (!s || !s[mode]) return 0;
    return Object.keys(s[mode]).filter(function (k) {
      return (k === String(level) || k.indexOf(level + '.') === 0) && s[mode][k] > 0;
    }).length;
  }
  function surahLevelDone(surah, mode, level) { return levelStagesDone(surah, mode, level) > 0; }

  /** progress for one juz: levels = surahs * 4 (2 mode x 2 level) */
  function juzProgress(juz, meta) {
    let total = 0, done = 0;
    juz.surahs.forEach(function (s) {
      total += 4;
      ['ayat', 'arti'].forEach(function (m) {
        [1, 2].forEach(function (l) { if (stageStars(s.n, m, l) > 0) done++; });
      });
    });
    return { done: done, total: total };
  }

  function surahStars(surah) {
    let sum = 0, n = 0;
    ['ayat', 'arti'].forEach(function (m) {
      [1, 2].forEach(function (l) {
        let best = 0;
        for (let st = 1; st <= 60; st++) { const v = stageStars(surah, m, l, st); if (v > best) best = v; }
        if (best) { sum += best; n++; }
      });
    });
    return n ? Math.round(sum / n) : 0;
  }

  function totalStars() {
    let t = 0;
    Object.keys(state.progress).forEach(function (k) {
      ['ayat', 'arti'].forEach(function (m) {
        [1, 2].forEach(function (l) { t += stageStars(k, m, l) || 0; });
      });
    });
    return t;
  }

  /* ---------- audio ---------- */
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function tone(freq, type, dur, gain, delay) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    const t0 = c.currentTime + (delay || 0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.14, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function semi(base, steps) { return base * Math.pow(2, steps / 12); }

  let lastStarAt = 0;
  const sfx = {
    tap: function () { tone(520, 'sine', 0.07, 0.09); },
    ok: function () { tone(880, 'sine', 0.16, 0.16); tone(1320, 'sine', 0.18, 0.11, 0.08); },
    bad: function () { tone(200, 'square', 0.26, 0.13); tone(150, 'square', 0.22, 0.10, 0.10); },
    wrong: function () { this.bad(); },
    coin: function () { tone(1046, 'triangle', 0.10, 0.12); tone(1568, 'triangle', 0.16, 0.10, 0.07); },

    // Bintang didapat. Makin tinggi bila beruntun (n = streak).
    star: function (n) {
      const now = Date.now();
      if (now - lastStarAt < 110) return;
      lastStarAt = now;
      const up = Math.min(Math.max((n || 1) - 1, 0), 5);
      const root = semi(1046, up);
      tone(root, 'triangle', 0.09, 0.13);
      tone(semi(root, 7), 'triangle', 0.14, 0.11, 0.06);
      tone(semi(root, 12), 'sine', 0.20, 0.09, 0.13);
    },

    // Jawaban benar beruntun: nada menanjak tiap kelipatan combo.
    combo: function (n) {
      const step = Math.min(Math.max((n || 1) - 1, 0), 7);
      const base = semi(660, step);
      tone(base, 'triangle', 0.09, 0.12);
      tone(semi(base, 4), 'triangle', 0.10, 0.10, 0.06);
      tone(semi(base, 7), 'sine', 0.14, 0.09, 0.12);
    },

    // Naik stage / level: beda jelas dari win biasa.
    fanfare: function () {
      [0, 4, 7, 12].forEach(function (st, i) {
        tone(semi(523, st), 'triangle', 0.18, 0.13, i * 0.085);
      });
      [523, 659, 784, 1046].forEach(function (f) {
        tone(f, 'sine', 0.85, 0.075, 0.36);
      });
    },

    // Piagam terbuka: megah, chord lebar + gemerlap tinggi.
    grand: function () {
      tone(131, 'sine', 1.10, 0.10, 0);
      [392, 523, 659, 784].forEach(function (f, i) {
        tone(f, 'triangle', 1.20, 0.075, i * 0.05);
      });
      [1046, 1318, 1568, 2093].forEach(function (f, i) {
        tone(f, 'sine', 0.55, 0.055, 0.30 + i * 0.10);
      });
    },

    win: function () {
      [660, 880, 1100, 1320, 1760].forEach(function (f, i) { tone(f, 'sine', 0.22, 0.13, i * 0.09); });
    },
    lose: function () { [400, 330, 260, 200].forEach(function (f, i) { tone(f, 'triangle', 0.24, 0.12, i * 0.11); }); }
  };

  /* ---------- haptic (getar halus di HP) ---------- */
  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }
  const haptic = {
    tap: function () { vibrate(8); },
    ok: function () { vibrate(18); },
    bad: function () { vibrate([30, 55, 30]); },
    star: function () { vibrate(14); },
    win: function () { vibrate([18, 45, 18, 45, 80]); },
    grand: function () { vibrate([25, 55, 25, 55, 25, 55, 130]); }
  };

  /* ---------- pujian suara (TTS Bahasa Indonesia) ---------- */
  var praiseOn = true;
  try { praiseOn = localStorage.getItem('tq_voice') !== '0'; } catch (e) {}
  var lastPraiseAt = 0;

  function praiseEnabled() { return praiseOn; }
  function praiseSet(on) {
    praiseOn = !!on;
    try { localStorage.setItem('tq_voice', on ? '1' : '0'); } catch (e) {}
    if (!praiseOn && window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }
  function praise(text, force) {
    if (!praiseOn || !text || !window.speechSynthesis) return;
    const now = Date.now();
    if (!force && now - lastPraiseAt < 4000) return;
    lastPraiseAt = now;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'id-ID';
      u.rate = 1.02;
      u.pitch = 1.2;
      u.volume = 0.95;
      const vs = window.speechSynthesis.getVoices() || [];
      for (let i = 0; i < vs.length; i++) {
        if (/^id([-_]ID)?$/i.test(vs[i].lang)) { u.voice = vs[i]; break; }
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  const PRAISE_OK = ['Masya Allah, benar!', 'Hebat!', 'Bagus sekali!', 'Alhamdulillah!', 'Pintar!'];
  const PRAISE_RETRY = ['Ayo coba lagi!', 'Belum tepat, ayo ulangi.', 'Hampir benar, coba lagi.'];
  function praiseRandom(kind) {
    const arr = kind === 'retry' ? PRAISE_RETRY : PRAISE_OK;
    praise(arr[Math.floor(Math.random() * arr.length)]);
  }

  /* ---------- versi aplikasi & cek update ---------- */
  const VERSION = '1.0.12';
  const UPDATE_URL = 'https://iankesuma.github.io/tilawah-quest/version.json';
  function version() { return VERSION; }
  function checkUpdate() {
    return fetch(UPDATE_URL + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        const latest = String((j && j.version) || VERSION);
        return {
          current: VERSION,
          latest: latest,
          url: (j && j.url) || '',
          notes: (j && j.notes) || '',
          newer: latest !== VERSION
        };
      });
  }


    function playAudio(url, btn) {
      if (!navigator.onLine) {
        TQ.popup({
          icon: '📶',
          title: 'Mode Offline',
          text: 'Kamu sedang offline. Fitur susun ayat dan kuis tetap bisa dimainkan tanpa internet, namun suara qori butuh koneksi data/WiFi.',
          bad: true,
          actions: [{ label: 'Oke, Mengerti' }]
        });
        return null;
      }
      var a = new Audio(url);
      return a;
    }
  function armAudio() {
    var started = false;
    function go() {
      if (started) return;
      started = true;
      ac();
    }
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, go, { once: true, passive: true });
    });
    // Auto-resume saat app balik dari background/screen lock
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        if (ctx && ctx.state === 'suspended') { ctx.resume().catch(function () {}); }
      }
    });
  }

  /* ---------- android back button handler ---------- */
  function setupAndroidBack() {
    // Intersep event backbutton dari Capacitor/Cordova WebView
    document.addEventListener('backbutton', function (e) {
      e.preventDefault();
      // 1. Jika ada popup overlay yang sedang terbuka, tutup dulu popupnya
      if (overlayEl && overlayEl.classList.contains('on')) {
        close();
        return;
      }
      // 2. Jika ada bottom sheet yang terbuka, tutup sheetnya
      var sheet = document.querySelector('.sheet.open');
      if (sheet) {
        sheet.classList.remove('open');
        sheet.setAttribute('aria-hidden', 'true');
        return;
      }
      // 3. Jika di halaman tebak.html dan sedang di panggung kuis, kembali ke layar juz
      var playScreen = document.getElementById('play-screen');
      var juzScreen = document.getElementById('juz-screen');
      if (playScreen && !playScreen.classList.contains('hidden') && juzScreen) {
        playScreen.classList.add('hidden');
        juzScreen.classList.remove('hidden');
        return;
      }
      // 4. Jika ada tombol back bawaan appbar, klik tombol tersebut
      var backBtn = document.querySelector('.appbar .iconbtn[href]') || document.querySelector('.appbar a.iconbtn');
      if (backBtn && backBtn.getAttribute('href')) {
        location.href = backBtn.getAttribute('href');
        return;
      }
      // 5. Fallback ke history browser jika memungkinkan
      if (window.history.length > 1) {
        window.history.back();
      }
    }, false);
  }

  /* ---------- boot app ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { armAudio(); setupAndroidBack(); });
  } else { armAudio(); setupAndroidBack(); }

  /* ---------- popup ---------- */
  let overlayEl = null;
  function overlay() {
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.className = 'overlay';
      overlayEl.innerHTML = '<div class="dialog" role="dialog" aria-modal="true"><div class="d-icon"></div><h3></h3><p></p><div class="d-actions"></div></div>';
      document.body.appendChild(overlayEl);
    }
    return overlayEl;
  }
  function popup(opt) {
    const el = overlay();
    const dlg = el.querySelector('.dialog');
    dlg.className = 'dialog' + (opt.good ? ' good' : '') + (opt.bad ? ' bad' : '');
    el.querySelector('.d-icon').textContent = opt.icon || '';
    el.querySelector('h3').textContent = opt.title || '';
    el.querySelector('p').textContent = opt.text || '';
    const act = el.querySelector('.d-actions');
    act.innerHTML = '';
    (opt.actions || [{ label: 'Oke' }]).forEach(function (a) {
      const b = document.createElement('button');
      b.className = 'btn' + (a.ghost ? ' ghost' : '') + (a.small ? ' small' : '');
      b.textContent = a.label;
      b.style.marginTop = '8px';
      b.onclick = function () {
        close();
        if (a.onClick) a.onClick();
      };
      act.appendChild(b);
    });
    el.classList.add('on');
    const first = act.querySelector('button');
    if (first) first.focus();
  }
  function close() { if (overlayEl) overlayEl.classList.remove('on'); }

  /* ---------- helpers ---------- */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }
  function esc(s) { return String(s == null ? '' : s); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  function requireProfile() {
    if (!state.profile.onboarded) {
      // another tab may already have finished onboarding
      var fresh = read();
      if (fresh.profile.onboarded) { state = fresh; return true; }
      location.replace('onboarding.html');
      return false;
    }
    return true;
  }

  function mascot(size) {
    const m = el('div', 'mascot');
    if (size) { m.style.width = size + 'px'; m.style.height = size + 'px'; }
    m.innerHTML = '<div class="m-body"></div><div class="m-eye l"></div><div class="m-eye r"></div><div class="m-mouth"></div>';
    return m;
  }


  /* ---------- avatar wajah karakter (SVG) ---------- */
  var INK = '#1E3A4C';
  function charFace(ch, size, inner) {
    var c = ch || character();
    var skin = c.skin, hc = c.headColor;
    var shape = c.face === 'square'
      ? '<rect x="24" y="18" width="52" height="58" rx="16" fill="' + skin + '"/>'
      : c.face === 'round'
        ? '<circle cx="50" cy="47" r="28" fill="' + skin + '"/>'
        : '<ellipse cx="50" cy="47" rx="25" ry="29" fill="' + skin + '"/>';

    var beard = '';
    if (c.beard === 'full') {
      beard = '<path d="M24 48 q0 30 26 30 q26 0 26 -30 q-8 16 -26 16 q-18 0 -26 -16z" fill="' + INK + '" opacity=".85"/>';
    } else if (c.beard === 'short') {
      beard = '<path d="M28 54 q4 20 22 20 q18 0 22 -20 q-8 10 -22 10 q-14 0 -22 -10z" fill="' + INK + '" opacity=".7"/>';
    }

    var head = '';
    if (c.head === 'hijab') {
      head = '<path d="M50 8 a34 34 0 0 1 34 34 q0 18 -8 28 l10 18 q-18 10 -36 10 q-18 0 -36 -10 l10 -18 q-8 -10 -8 -28 a34 34 0 0 1 34 -34z" fill="' + hc + '"/>' +
             '<path d="M50 16 a26 26 0 0 1 26 26 q0 14 -6 22 h-40 q-6 -8 -6 -22 a26 26 0 0 1 26 -26z" fill="' + skin + '"/>';
    } else if (c.head === 'turban') {
      head = '<path d="M18 34 q32 -26 64 0 q2 10 -4 12 q-28 -14 -56 0 q-6 -2 -4 -12z" fill="' + hc + '"/>' +
             '<path d="M20 34 q30 -12 60 0 l-2 8 q-28 -10 -56 0z" fill="' + INK + '" opacity=".12"/>';
    } else if (c.head === 'cap') {
      head = '<path d="M22 36 a28 31 0 0 1 56 0 q-28 -7 -56 0z" fill="' + hc + '"/>' +
             '<path d="M22 36 q28 -7 56 0" fill="none" stroke="' + INK + '" stroke-width="1.4" opacity=".18"/>';
    } else {
      head = '<path d="M22 40 a28 28 0 0 1 56 0 q-14 -12 -28 -12 q-14 0 -28 12z" fill="' + hc + '"/>';
    }

    var eyes = '<circle cx="40" cy="46" r="3.2" fill="' + INK + '"/><circle cx="60" cy="46" r="3.2" fill="' + INK + '"/>' +
               '<circle cx="32" cy="55" r="4" fill="#F4A0A8" opacity=".55"/><circle cx="68" cy="55" r="4" fill="#F4A0A8" opacity=".55"/>' +
               '<path d="M43 58 q7 6 14 0" stroke="' + INK + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';

    var body = shape + head + beard + eyes;
    if (inner) return body;
    var s = size ? ' width="' + size + '" height="' + size + '"' : '';
    return '<svg viewBox="0 0 100 110" class="face-svg"' + s + ' aria-hidden="true">' + body + '</svg>';
  }

  function hatCss(hatId) {
    const h = HATS.find(function (x) { return x.id === hatId; }) || HATS[0];
    if (h.id === 'none') return { display: 'none' };
    return { display: 'block', background: h.color, border: '2px solid rgba(0,0,0,.15)' };
  }

  var isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();
  if ('serviceWorker' in navigator && !isNativeApp && location.protocol === 'https:' && location.hostname !== 'localhost') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* ---------- multi-anak: daftar anak ---------- */
  function childrenList() { try { return JSON.parse(rawGet('tq_children') || '[]') || []; } catch (e) { return []; } }
  function saveChildren(list) { try { _setItem.call(localStorage, 'tq_children', JSON.stringify(list)); } catch (e) {} }
  function ensureChildren() {
    var list = childrenList();
    if (list.length) return list;
    // data lama (sebelum multi-anak) dianggap anak pertama, id 'c1'
    try {
      var d = JSON.parse(rawGet('tq_v1') || 'null');
      if (d && d.profile && d.profile.onboarded) {
        list = [{ id: 'c1', name: d.profile.name || 'Anak', char: d.profile.char, color: d.profile.color }];
        saveChildren(list);
      }
    } catch (e) {}
    return list;
  }
  function registerChild() {
    var id = activeId(), p = state.profile;
    if (!p.onboarded) return;
    var list = childrenList(), found = false;
    list.forEach(function (c) {
      if (c.id === id) { c.name = p.name; c.char = p.char; c.color = p.color; found = true; }
    });
    if (!found) list.push({ id: id, name: p.name, char: p.char, color: p.color });
    saveChildren(list);
  }
  function dropChild(id) { saveChildren(childrenList().filter(function (c) { return c.id !== id; })); }
  function addChild() {
    var list = ensureChildren();
    if (list.length >= 5) return null;
    var n = 1;
    while (list.some(function (c) { return c.id === 'c' + n; })) n++;
    var id = 'c' + n;
    _setItem.call(localStorage, 'tq_active', id);
    return id;
  }
  function switchChild(id) {
    _setItem.call(localStorage, 'tq_active', id);
    location.href = 'juz.html';
  }
  function childSummary(id) {
    try {
      var d = JSON.parse(_getItem.call(localStorage, nsKey('tq_v1', id)) || 'null');
      if (!d) return { points: 0, onboarded: false };
      return { points: d.points || 0, onboarded: !!(d.profile && d.profile.onboarded) };
    } catch (e) { return { points: 0, onboarded: false }; }
  }

  window.TQ = {
    KEY: KEY, HATS: HATS, COLORS: COLORS, CHARACTERS: CHARACTERS, character: character,
    state: function () { return state; },
    profile: profile, setProfile: setProfile,
    points: points, addPoints: addPoints, stats: stats, bumpStat: bumpStat,
    stageStars: stageStars, setStageStars: setStageStars, surahLevelDone: surahLevelDone, levelStagesDone: levelStagesDone,
    juzProgress: juzProgress, surahStars: surahStars, totalStars: totalStars,
    sfx: sfx, haptic: haptic, praise: praise, praiseRandom: praiseRandom, praiseEnabled: praiseEnabled, praiseSet: praiseSet,
    version: version, checkUpdate: checkUpdate, vibrate: vibrate, popup: popup, closePopup: close, playAudio: playAudio,
    bgmOn: function () { return false; }, bgmSet: function () {}, bgmState: function () { return { on: false, playing: false, t: 0, ctx: ctx ? ctx.state : 'none' }; }, diriku: function () { return state.diriku; }, save: save,
    children: ensureChildren, activeChild: activeId, addChild: addChild, switchChild: switchChild,
    childSummary: childSummary, MAX_CHILDREN: 5,
    qs: qs, el: el, shuffle: shuffle, esc: esc, fmt: fmt,
    requireProfile: requireProfile, mascot: mascot, hatCss: hatCss, charFace: charFace,
    reset: function () {
      state = JSON.parse(JSON.stringify(DEFAULT));
      save();
      dropChild(activeId());
      // Bersihkan juga progres tebak ayat & cache lokal
      try {
        for (var i = 1; i <= 30; i++) {
          localStorage.removeItem('tq_tebak_j' + i);
        }
        localStorage.removeItem('tq_tebak_v1');
        localStorage.removeItem('tq_baca_last');
        localStorage.removeItem('tq_data_cache_v1');
      } catch (e) {}
    }
  };
})();
