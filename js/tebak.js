/* Tilawah Quest — tebak ayat (v33 — per-juz) */
(function () {
  'use strict';

  var PER = 5;
  var MAX_HEARTS = 5;
  var STAGES_PER_JUZ = 10;
  var AUDIO_FROM_STAGE = 2; // stage 1=baca ayat, stage 2+=dengar qari

  var S = {
    meta: [], juzData: [], juzNames: [],
    curJuz: 0, items: [],
    stage: 1, stages: STAGES_PER_JUZ,
    qi: 0, hearts: MAX_HEARTS, score: 0, right: 0, locked: false
  };

  var el = {};
  ['prog','pts','pbar','pbar-wrap','stage-badge','hearts','ar','opts','done',
   'sheet','hgrid','hq','hcount','openlist','sheet-close',
   'juz-screen','play-screen','back-btn','ta-speak','q-text','listen-box']
    .forEach(function (id) { el[id] = document.getElementById(id); });

  if (!TQ.requireProfile()) return;
  el.pts.textContent = TQ.fmt(TQ.points());

  function storeKey() { return 'tq_tebak_j' + S.curJuz; }
  function store() {
    try { return JSON.parse(localStorage.getItem(storeKey()) || '{}'); } catch (e) { return {}; }
  }
  function saveStore(o) { localStorage.setItem(storeKey(), JSON.stringify(o)); }
  function stageStars(st) { return store()[st] || 0; }
  function setStageStars(st, n) { var o = store(); if ((o[st] || 0) < n) { o[st] = n; saveStore(o); } }
  function stagesDone() { return Object.keys(store()).filter(function (k) { return store()[k] > 0; }).length; }

  function juzProgress(j) {
    try {
      var o = JSON.parse(localStorage.getItem('tq_tebak_j' + j) || '{}');
      var done = Object.keys(o).filter(function (k) { return o[k] > 0; }).length;
      return done;
    } catch (e) { return 0; }
  }

  function rnd(n) { return Math.floor(Math.random() * n); }

  function showJuzPicker() {
    stopAyatAudio();
    el['juz-screen'].classList.remove('hidden');
    el['play-screen'].classList.add('hidden');
    el.openlist.classList.add('hidden');
    el['pbar-wrap'].classList.add('hidden');
    el.prog.textContent = 'Pilih juz';
    el['back-btn'].href = 'belajar.html';
    el['back-btn'].onclick = null;
    renderJuzGrid();
  }
  window.__tqTebakBack = showJuzPicker;

  function renderJuzGrid() {
    var grid = document.getElementById('juz-grid');
    grid.innerHTML = '';
    for (var i = 0; i < S.juzData.length; i++) {
      (function (idx) {
        var jz = S.juzData[idx];
        var j = jz.j;
        var done = juzProgress(j);
        var pct = Math.round(done / STAGES_PER_JUZ * 100);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'jp' + (done >= STAGES_PER_JUZ ? ' alldone' : '');
        btn.innerHTML =
          '<b>' + j + '</b>' +
          '<span>' + (S.juzNames[j - 1] || 'Juz ' + j) + '</span>' +
          '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
          '<span class="pill">' + done + '/' + STAGES_PER_JUZ + '</span>';
        btn.onclick = function () {
          TQ.sfx.tap();
          enterJuz(j);
        };
        grid.appendChild(btn);
      })(i);
    }
  }

  function enterJuz(j) {
    S.curJuz = j;
    var jz = S.juzData.find(function (d) { return d.j === j; });
    S.items = jz ? jz.items : [];
    S.stages = STAGES_PER_JUZ;

    el['juz-screen'].classList.add('hidden');
    el['play-screen'].classList.remove('hidden');
    el.openlist.classList.remove('hidden');
    el['pbar-wrap'].classList.remove('hidden');
    el['back-btn'].href = '#';
    el['back-btn'].onclick = function (e) {
      e.preventDefault();
      TQ.sfx.tap();
      showJuzPicker();
    };

    S.stage = 1;
    for (var i = 1; i <= S.stages; i++) {
      if (!stageStars(i)) { S.stage = i; break; }
    }
    startStage();
  }

  function paintGrid() {
    var q = (el.hq.value || '').trim();
    var o = store();
    el.hgrid.innerHTML = '';
    for (var i = 1; i <= S.stages; i++) {
      if (q && String(i).indexOf(q) !== 0) continue;
      (function (st) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'hn' + (o[st] ? ' done' : '') + (st === S.stage ? ' now' : '');
        b.textContent = st;
        b.onclick = function () { S.stage = st; closeSheet(); startStage(); };
        el.hgrid.appendChild(b);
      })(i);
    }
    el.hcount.textContent = stagesDone() + ' dari ' + S.stages + ' stage selesai';
  }
  function openSheet() { el.sheet.classList.add('open'); el.sheet.setAttribute('aria-hidden', 'false'); paintGrid(); }
  function closeSheet() { el.sheet.classList.remove('open'); el.sheet.setAttribute('aria-hidden', 'true'); }
  el.openlist.onclick = function () { TQ.sfx.tap(); openSheet(); };
  el['sheet-close'].onclick = closeSheet;
  el.sheet.onclick = function (e) { if (e.target === el.sheet) closeSheet(); };
  el.hq.oninput = paintGrid;

  function renderHearts() {
    el.hearts.innerHTML = '';
    for (var i = 0; i < MAX_HEARTS; i++) {
      var s = document.createElement('span');
      s.className = i < S.hearts ? '' : 'off';
      s.textContent = '♥';
      el.hearts.appendChild(s);
    }
  }

  function label(s, a) {
    var m = S.meta[s - 1];
    return m ? m.name + ' ayat ' + a : 'Surah ' + s + ' ayat ' + a;
  }

  /* --- audio ayat --- */
  var curAudio = null;

  function setAudioUI(state) {
    var ico = state === 'loading' ? '⏳' : state === 'playing' ? '⏹️' : '🔊';
    if (el['ta-speak']) el['ta-speak'].textContent = ico;
    if (el['listen-box']) {
      var i = el['listen-box'].querySelector('.listen-ico');
      var l = el['listen-box'].querySelector('.listen-label');
      var sub = el['listen-box'].querySelector('.listen-sub');
      if (i) i.textContent = ico;
      if (l) l.textContent = state === 'playing' ? 'Sedang diputar' : 'Dengarkan';
      if (sub) sub.textContent = state === 'playing' ? 'Tekan untuk menghentikan' : 'Tekan untuk memutar ayat';
      el['listen-box'].classList.toggle('playing', state === 'playing');
    }
  }

  function stopAyatAudio() {
    if (curAudio) {
      try { curAudio.pause(); curAudio.currentTime = 0; } catch (e) {}
      curAudio = null;
    }
    setAudioUI('idle');
  }

  function playAyatAudio(surahNum, ayahNum) {
    if (curAudio && !curAudio.paused) {
      stopAyatAudio();
      return;
    }
    stopAyatAudio();

    if (!S.meta || !S.meta.length) return;
    var acc = 0;
    for (var i = 0; i < surahNum - 1; i++) {
      acc += (S.meta[i].ayat || S.meta[i].ayahs || 0);
    }
    var global = acc + ayahNum;
    var url = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/' + global + '.mp3';
    setAudioUI('loading');
    var a = TQ.playAudio ? TQ.playAudio(url, el['listen-box'] || el['ta-speak']) : new Audio(url);
    if (!a) { setAudioUI('idle'); return; }
    a.volume = 0.9;
    curAudio = a;
    a.onended = function () {
      if (curAudio === a) curAudio = null;
      setAudioUI('idle');
    };
    a.play().then(function () {
      if (curAudio === a) setAudioUI('playing');
    }).catch(function () {
      if (curAudio === a) curAudio = null;
      setAudioUI('idle');
      TQ.popup({ icon: '🔇', title: 'Audio tidak bisa diputar', text: 'Periksa koneksi internet untuk memutar bacaan.', bad: true, actions: [{ label: 'Oke' }] });
    });
  }

  function startStage() {
    S.stage = Math.min(Math.max(1, S.stage), S.stages);
    S.qi = 0; S.hearts = MAX_HEARTS; S.score = 0; S.right = 0; S.locked = false;
    el.done.classList.add('hidden');
    el.done.innerHTML = '';
    el.opts.style.display = 'grid';
    el['stage-badge'].textContent = 'Juz ' + S.curJuz + ' · Stage ' + S.stage + '/' + S.stages;
    renderHearts();
    renderQuestion();
  }

  function question(i) {
    var off = (S.stage - 1) * PER;
    return S.items[off + i];
  }

  function renderQuestion() {
    stopAyatAudio();
    var q = question(S.qi);
    if (!q) { finishStage(); return; }
    S.locked = false;
    el.ar.textContent = q.ar;
    el.prog.textContent = 'Juz ' + S.curJuz + ' · Soal ' + (S.qi + 1) + '/' + PER;
    el.pbar.style.width = (S.qi / PER * 100) + '%';

    /* Stage 1: lihat ayat. Stage 2+: ayat disembunyikan, ganti tombol dengar qari. */
    var audioMode = S.stage >= AUDIO_FROM_STAGE;
    el.ar.style.display = audioMode ? 'none' : '';
    el.ar.setAttribute('aria-hidden', audioMode ? 'true' : 'false');
    if (el['listen-box']) el['listen-box'].classList.toggle('hidden', !audioMode);
    if (el['q-text']) el['q-text'].textContent = audioMode
      ? 'Dengarkan, ayat ini dari surah mana,'
      : 'Ayat ini dari surah mana?';

    var answer = label(q.s, q.a);
    var opts = [{ txt: answer, ok: true }];

    /* Pengecoh HARUS berasal dari juz yang sama dengan soal.
       S.items adalah 50 ayat pada juz aktif, jadi pilihannya tetap
       masuk akal dan tidak membocorkan juz lewat opsi yang jelas di luar juz. */
    var pool = (S.items || []).filter(function (it) {
      return !(it.s === q.s && it.a === q.a);
    });
    if (pool.length < 3) {
      var jz = S.juzData.find(function (d) { return d.j === S.curJuz; });
      if (jz && jz.items) {
        pool = jz.items.filter(function (it) {
          return !(it.s === q.s && it.a === q.a);
        });
      }
    }
    var seen = {};
    seen[answer] = true;
    TQ.shuffle(pool).forEach(function (it) {
      if (opts.length >= 4) return;
      var t = label(it.s, it.a);
      if (!t || seen[t]) return;
      seen[t] = true;
      opts.push({ txt: t, ok: false });
    });
    opts = TQ.shuffle(opts);

    var playFn = function () { playAyatAudio(q.s, q.a); };
    if (el['ta-speak']) el['ta-speak'].onclick = playFn;
    if (el['listen-box']) el['listen-box'].onclick = playFn;

    el.opts.innerHTML = '';
    opts.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      b.textContent = o.txt;
      b.onclick = function () { choose(b, o); };
      el.opts.appendChild(b);
    });
  }

  function choose(btn, o) {
    if (S.locked || btn.disabled) return;
    if (o.ok) {
      S.locked = true;
      btn.classList.add('right');
      S.right++;
      S.score += 10;
      if (TQ.sfx.combo) TQ.sfx.combo(S.right); else TQ.sfx.ok();
      if (TQ.haptic) TQ.haptic.ok();
      el.pbar.style.width = ((S.qi + 1) / PER * 100) + '%';
      setTimeout(function () {
        S.qi++;
        if (S.qi >= PER) finishStage(); else renderQuestion();
      }, 620);
      return;
    }
    btn.classList.add('wrong');
    btn.disabled = true;
    S.hearts--;
    TQ.sfx.bad();
    if (TQ.haptic) TQ.haptic.bad();
    renderHearts();
    if (S.hearts <= 0) finishStage(true);
  }

  function finishStage(failed) {
    stopAyatAudio();
    if (el['listen-box']) el['listen-box'].classList.add('hidden');
    var passed = !failed;
    var stars = passed ? (S.hearts >= 5 ? 3 : S.hearts >= 3 ? 2 : 1) : 0;
    var first = passed && stageStars(S.stage) === 0;
    if (passed) {
      setStageStars(S.stage, stars);
      var gain = S.score + (first ? 20 : 0);
      if (first) TQ.addPoints(Math.round(gain / 2));
      TQ.bumpStat('levels');
      // Update daily mission
      try {
        var tk = new Date().toISOString().slice(0, 10);
        var ds = JSON.parse(localStorage.getItem('tq_daily_' + tk) || '{}');
        ds.d_tebak = (ds.d_tebak || 0) + 1;
        localStorage.setItem('tq_daily_' + tk, JSON.stringify(ds));
      } catch (e) {}
      if (TQ.sfx.fanfare) TQ.sfx.fanfare(); else TQ.sfx.win();
      if (TQ.haptic) TQ.haptic.win();
      if (TQ.sfx.star) TQ.sfx.star(3);
      if (TQ.praise) TQ.praise('Masya Allah! Stage selesai.', true);
    } else {
      TQ.sfx.lose();
      if (TQ.haptic) TQ.haptic.bad();
    }
    el.pts.textContent = TQ.fmt(TQ.points());
    el.opts.innerHTML = '';
    el.opts.style.display = 'none';
    el.done.classList.remove('hidden');

    var allDone = passed && S.stage >= S.stages;
    el.done.innerHTML =
      '<div class="stars">' + (passed ? '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars) : '☆☆☆') + '</div>' +
      '<h3>' + (passed ? (allDone ? 'Masya Allah, Juz ' + S.curJuz + ' selesai!' : 'Alhamdulillah, stage selesai!') : 'Nyawa habis') + '</h3>' +
      '<div class="muted" style="font-size:12.5px;font-weight:800">' +
        'Benar ' + S.right + '/' + PER + ' · skor ' + S.score +
        (first ? ' · +' + Math.round((S.score + 20) / 2) + ' poin' : '') +
      '</div>' +
      (passed && S.stage < S.stages
        ? '<button class="btn" id="next-stage">Stage ' + (S.stage + 1) + ' →</button>'
        : '<button class="btn" id="next-stage">' + (allDone ? 'Pilih Juz Lain' : 'Main lagi') + '</button>') +
      '<button class="btn ghost small" id="again-stage">Ulangi stage</button>';

    var nx = document.getElementById('next-stage');
    nx.onclick = function () {
      if (allDone) { showJuzPicker(); return; }
      if (passed && S.stage < S.stages) { S.stage++; startStage(); }
      else { S.stage = 1; startStage(); }
    };
    document.getElementById('again-stage').onclick = function () { startStage(); };
    el.done.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Pastikan tombol kembali di appbar tetap mengarah ke daftar juz
    el['back-btn'].onclick = function (e) {
      e.preventDefault();
      TQ.sfx.tap();
      showJuzPicker();
    };
  }

  Promise.all([
    fetch('data/tebak.json?v=33').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
    fetch('data/surah-meta.json?v=6').then(function (r) { return r.json(); }),
    fetch('data/juz.json?v=6').then(function (r) { return r.json(); })
  ]).then(function (res) {
    var d = res[0];
    S.juzData = d.juz;
    S.meta = res[1];
    S.juzNames = res[2].map(function (j) { return j.name; });
    showJuzPicker();
  }).catch(function (e) {
    console.error(e);
    el.prog.textContent = 'Gagal memuat';
    el.ar.textContent = 'Soal belum bisa dimuat. Periksa koneksi lalu muat ulang.';
  });
})();
