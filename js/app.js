/* Tilawah Quest — core app helpers: store, profile, progress, audio, popup */
(function () {
  'use strict';

  const KEY = 'tq_v1';

  const DEFAULT = {
    profile: { name: '', color: '#2F80C9', hat: 'none', onboarded: false },
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
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

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
  function setProfile(p) { Object.assign(state.profile, p); save(); }
  function points() { return state.points; }
  function addPoints(n) { state.points = Math.max(0, state.points + n); save(); return state.points; }
  function stats() { return state.stats; }
  function bumpStat(k, n) { state.stats[k] = (state.stats[k] || 0) + (n == null ? 1 : n); save(); }

  /* ---------- progress ---------- */
  function stageStars(surah, mode, level) {
    const s = state.progress[surah];
    return (s && s[mode] && s[mode][level]) || 0;
  }
  function setStageStars(surah, mode, level, stars) {
    state.progress[surah] = state.progress[surah] || {};
    state.progress[surah][mode] = state.progress[surah][mode] || {};
    const prev = state.progress[surah][mode][level] || 0;
    if (stars > prev) state.progress[surah][mode][level] = stars;
    save();
  }
  function surahLevelDone(surah, mode, level) { return stageStars(surah, mode, level) > 0; }

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
      [1, 2].forEach(function (l) { const v = stageStars(surah, m, l); if (v) { sum += v; n++; } });
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
  const sfx = {
    ok: function () { tone(880, 'sine', 0.16, 0.16); tone(1320, 'sine', 0.18, 0.11, 0.08); },
    bad: function () { tone(200, 'square', 0.26, 0.13); tone(150, 'square', 0.22, 0.10, 0.10); },
    tap: function () { tone(520, 'sine', 0.07, 0.09); },
    coin: function () { tone(1046, 'triangle', 0.10, 0.12); tone(1568, 'triangle', 0.16, 0.10, 0.07); },
    win: function () {
      [660, 880, 1100, 1320, 1760].forEach(function (f, i) { tone(f, 'sine', 0.22, 0.13, i * 0.09); });
    },
    lose: function () { [400, 330, 260, 200].forEach(function (f, i) { tone(f, 'triangle', 0.24, 0.12, i * 0.11); }); }
  };


  /* ---------- background music + sound toggle ---------- */
  var bgmEl = null;
  function bgmOn() { try { return localStorage.getItem('tq_bgm') !== '0'; } catch (e) { return true; } }
  function bgmSet(on) {
    try { localStorage.setItem('tq_bgm', on ? '1' : '0'); } catch (e) {}
    if (on) {
      if (!bgmEl) { bgmEl = new Audio('audio/calmant.mp3'); bgmEl.loop = true; bgmEl.volume = 0.18; }
      bgmEl.play().catch(function () {});
    } else if (bgmEl) { bgmEl.pause(); }
    paintToggle();
  }
  function bgmTryStart() { if (bgmOn()) bgmSet(true); }

  var toggleEl = null;
  function paintToggle() {
    if (!toggleEl) return;
    var on = bgmOn();
    toggleEl.textContent = on ? '🔊' : '🔇';
    toggleEl.setAttribute('aria-label', on ? 'Matikan suara' : 'Nyalakan suara');
    toggleEl.setAttribute('aria-pressed', String(on));
  }
  function mountToggle() {
    if (toggleEl || !document.body) return;
    toggleEl = document.createElement('button');
    toggleEl.type = 'button';
    toggleEl.className = 'sound-toggle';
    toggleEl.onclick = function () { bgmSet(!bgmOn()); if (bgmOn()) sfx.tap(); };
    var bar = document.querySelector('.appbar');
    if (bar) {
      toggleEl.className += ' inbar';
      bar.appendChild(toggleEl);
    } else {
      document.body.appendChild(toggleEl);
    }
    paintToggle();
  }
  function armAudio() {
    var started = false;
    function go() {
      if (started) return;
      started = true;
      ac();
      bgmTryStart();
    }
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, go, { once: true, passive: true });
    });
    // keep trying until the browser lets us play (mobile autoplay policies)
    var lastTry = 0;
    document.addEventListener('pointerdown', function () {
      if (!bgmOn()) return;
      if (bgmEl && !bgmEl.paused) return;
      var now = Date.now();
      if (now - lastTry < 1500) return;
      lastTry = now;
      ac();
      bgmSet(true);
    }, { passive: true });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mountToggle(); armAudio(); });
  } else { mountToggle(); armAudio(); }

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
    if (!state.profile.onboarded) { location.replace('onboarding.html'); return false; }
    return true;
  }

  function mascot(size) {
    const m = el('div', 'mascot');
    if (size) { m.style.width = size + 'px'; m.style.height = size + 'px'; }
    m.innerHTML = '<div class="m-body"></div><div class="m-eye l"></div><div class="m-eye r"></div><div class="m-mouth"></div>';
    return m;
  }

  function hatCss(hatId) {
    const h = HATS.find(function (x) { return x.id === hatId; }) || HATS[0];
    if (h.id === 'none') return { display: 'none' };
    return { display: 'block', background: h.color, border: '2px solid rgba(0,0,0,.15)' };
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  window.TQ = {
    KEY: KEY, HATS: HATS, COLORS: COLORS,
    state: function () { return state; },
    profile: profile, setProfile: setProfile,
    points: points, addPoints: addPoints, stats: stats, bumpStat: bumpStat,
    stageStars: stageStars, setStageStars: setStageStars, surahLevelDone: surahLevelDone,
    juzProgress: juzProgress, surahStars: surahStars, totalStars: totalStars,
    sfx: sfx, popup: popup, closePopup: close,
    bgmOn: bgmOn, bgmSet: bgmSet, bgmState: function () { return { on: bgmOn(), playing: !!(bgmEl && !bgmEl.paused), t: bgmEl ? Math.round(bgmEl.currentTime * 10) / 10 : 0, ctx: ctx ? ctx.state : 'none' }; }, diriku: function () { return state.diriku; }, save: save,
    qs: qs, el: el, shuffle: shuffle, esc: esc, fmt: fmt,
    requireProfile: requireProfile, mascot: mascot, hatCss: hatCss,
    reset: function () { state = JSON.parse(JSON.stringify(DEFAULT)); save(); }
  };
})();
