/* Tilawah Quest — latihan engine */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var JUZ = +(params.get('juz') || 30);
  var SURAH = +(params.get('surah') || 78);
  var MODE = params.get('mode') === 'arti' ? 'arti' : 'ayat';
  var LEVEL = +(params.get('level') || 1);

  var AYAH_CAP = 10;
  var CHUNK = MODE === 'arti' ? 3 : 6;
  var MAX_HEARTS = 5;

  var S = {
    surah: null,
    meta: null,
    ayahs: [],
    questions: [],
    qi: 0,
    picked: [],
    hearts: MAX_HEARTS,
    score: 0,
    combo: 0,
    maxCombo: 0,
    wrong: 0,
    done: false,
    lastBadAt: 0
  };

  var el = {};
  ['g-title', 'g-ar', 'score', 'hearts', 'step', 'bar', 'ayat-lines', 'slots', 'bank',
   'instr', 'mascot', 'surah-label', 'mode-label', 'bismillah', 'quit', 'speak'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });

  if (!TQ.requireProfile()) return;

  /* ---------- build ---------- */
  function buildQuestions() {
    S.questions = [];
    S.ayahs.forEach(function (ay, ai) {
      var text = MODE === 'arti' ? ay.tr : ay.ar;
      var words = text.split(/\s+/)
        .map(function (w) { return w.replace(/^[\u06D6-\u06ED\u08F0-\u08F3\u0670]+/, '').trim(); })
        .filter(function (w) { return w && /[\u0621-\u064A]/.test(w) || (MODE === 'arti' && /[A-Za-z0-9]/.test(w)); });
      if (!words.length) return;
      var size = words.length <= CHUNK + 2 ? words.length : CHUNK;
      for (var i = 0; i < words.length; i += size) {
        var tokens = words.slice(i, i + size);
        S.questions.push({ ai: ai, from: i, to: i + tokens.length, tokens: tokens });
      }
    });
  }

  function currentQ() { return S.questions[S.qi]; }

  /* ---------- render ---------- */
  function renderHearts() {
    el.hearts.innerHTML = '';
    for (var i = 0; i < MAX_HEARTS; i++) {
      var s = document.createElement('span');
      s.className = 'h' + (i < S.hearts ? '' : ' off');
      s.textContent = '♥';
      el.hearts.appendChild(s);
    }
    el.hearts.setAttribute('aria-label', 'Nyawa ' + S.hearts + ' dari ' + MAX_HEARTS);
  }

  function renderAyat() {
    var q = currentQ();
    if (!q) return;
    var ay = S.ayahs[q.ai];
    el.step.textContent = 'Ayat ' + ay.i + ' · ' + (q.ai + 1) + '/' + S.ayahs.length;

    var no = document.getElementById('ayah-no');
    if (no) no.textContent = 'Ayat ' + ay.i;

    if (MODE === 'arti') {
      // teks Arab jadi petunjuk, jawaban (arti) disusun di kotak
      el['ayat-lines'].style.display = 'block';
      el['ayat-lines'].innerHTML = '<p class="ayat-line ar">' + ay.ar + '</p>';
      el.slots.setAttribute('dir', 'ltr');
      el.slots.classList.remove('rtl');
    } else {
      // susun ayat: kotak kosong, kata naik hanya kalau pilihan benar
      el['ayat-lines'].style.display = 'none';
      el['ayat-lines'].innerHTML = '';
      el.slots.setAttribute('dir', 'rtl');
      el.slots.classList.add('rtl');
    }
  }

  function renderSlots() {
    var q = currentQ();
    el.slots.innerHTML = '';
    if (!q) return;
    var count = document.getElementById('slot-count');
    if (count) count.textContent = S.picked.length + '/' + q.tokens.length + ' kata';
    var hw = document.getElementById('hint-word');
    if (hw) {
      var next = q.tokens[S.picked.length];
      hw.textContent = '';
      hw.className = 'hint-word' + (MODE === 'arti' ? '' : ' ar');
    }
    q.tokens.forEach(function (tok, i) {
      var slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.i = i;
      var arCls = MODE === 'arti' ? '' : ' ar';
      if (i < S.picked.length) {
        slot.classList.add('filled');
        var t = document.createElement('span');
        t.className = 'tile' + arCls;
        t.textContent = S.picked[i];
        slot.appendChild(t);
      } else {
        if (LEVEL === 1) {
          // level 1: ayat tampil berbayang di kotak
          slot.classList.add('ghosted');
          var g = document.createElement('span');
          g.className = 'ghost' + arCls;
          g.textContent = tok;
          slot.appendChild(g);
        }
        var n = document.createElement('span');
        n.className = 'num';
        n.textContent = i + 1;
        slot.appendChild(n);
      }
      slot.style.minHeight = MODE === 'arti' ? '' : '52px';
      el.slots.appendChild(slot);
    });
  }

  var suppressClick = false;

  function makeDraggable(b, token) {
    b.addEventListener('pointerdown', function (e) {
      if (S.done || e.button > 0) return;
      if (b.classList.contains('used')) return;
      var pid = e.pointerId, sx = e.clientX, sy = e.clientY;
      var ghost = null, dragging = false;
      try { b.setPointerCapture(pid); } catch (err) {}
      function blockScroll(ev) { if (dragging) ev.preventDefault(); }

      function move(ev) {
        if (ev.pointerId !== pid) return;
        if (!dragging) {
          if (Math.abs(ev.clientX - sx) < 8 && Math.abs(ev.clientY - sy) < 8) return;
          dragging = true;
          ghost = document.createElement('div');
          ghost.className = 'tile drag-ghost' + (MODE === 'arti' ? '' : ' ar');
          ghost.textContent = token;
          document.body.appendChild(ghost);
          b.classList.add('dragging');
          document.addEventListener('touchmove', blockScroll, { passive: false });
        }
        ev.preventDefault();
        ghost.style.transform = 'translate(' + ev.clientX + 'px,' + ev.clientY + 'px) translate(-50%,-50%)';
        var under = document.elementFromPoint(ev.clientX, ev.clientY);
        var slot = under && under.closest ? under.closest('.slot') : null;
        Array.prototype.forEach.call(document.querySelectorAll('.slot.over'), function (x) { x.classList.remove('over'); });
        if (slot && !slot.classList.contains('filled')) slot.classList.add('over');
      }

      function up(ev) {
        if (ev.pointerId !== pid) return;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        if (!dragging) return;
        dragging = false;
        b.classList.remove('dragging');
        document.removeEventListener('touchmove', blockScroll);
        if (ghost) ghost.remove();
        Array.prototype.forEach.call(document.querySelectorAll('.slot.over'), function (x) { x.classList.remove('over'); });
        suppressClick = true;
        setTimeout(function () { suppressClick = false; }, 60);
        var under = document.elementFromPoint(ev.clientX, ev.clientY);
        var slot = under && under.closest ? under.closest('.slot') : null;
        if (slot && !slot.classList.contains('filled')) tap(b, token);
      }

      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      b.addEventListener('lostpointercapture', up, { once: true });
    });
  }

  function renderBank() {
    var q = currentQ();
    el.bank.innerHTML = '';
    if (!q) return;
    var order = q.order || (q.order = TQ.shuffle(q.tokens));
    order.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile' + (MODE === 'arti' ? '' : ' ar');
      b.textContent = t;
      var usedCount = S.picked.filter(function (x) { return x === t; }).length;
      var total = q.tokens.filter(function (x) { return x === t; }).length;
      if (usedCount >= total) b.classList.add('used');
      b.onclick = function () { if (!suppressClick) tap(b, t); };
      makeDraggable(b, t);
      el.bank.appendChild(b);
    });
  }

  function renderProgress() {
    var q = currentQ();
    var frac = q && q.tokens.length ? S.picked.length / q.tokens.length : 0;
    var pct = S.questions.length ? ((S.qi + frac) / S.questions.length) * 100 : 0;
    el.bar.style.width = Math.min(100, pct) + '%';
    el.score.textContent = S.score;
    var c = document.getElementById('combo');
    if (c) {
      if (S.combo >= 5) { c.hidden = false; c.querySelector('b').textContent = S.combo; }
      else c.hidden = true;
    }
  }

  function render() {
    renderHearts(); renderAyat(); renderSlots(); renderBank(); renderProgress();
  }

  /* ---------- interaction ---------- */
  function tap(btn, token) {
    if (S.done) return;
    var q = currentQ();
    if (!q) return;
    var expected = q.tokens[S.picked.length];

    if (token === expected) {
      S.picked.push(token);
      S.combo++;
      S.maxCombo = Math.max(S.maxCombo, S.combo);
      var bonus = S.combo >= 5 ? 5 * Math.min(4, Math.floor(S.combo / 5)) : 0;
      S.score += 10 + bonus;
      TQ.sfx.ok();
      if (S.combo > 0 && S.combo % 5 === 0) {
        el.mascot.classList.add('happy');
        setTimeout(function () { el.mascot.classList.remove('happy'); }, 600);
        TQ.popup({
          icon: '🔥',
          title: 'Combo ' + S.combo + '!',
          text: S.combo + ' benar berturut-turut. Bonus +' + bonus + ' skor.',
          good: true,
          actions: [{ label: 'Lanjut' }]
        });
      }
      if (S.picked.length >= q.tokens.length) {
        setTimeout(nextQuestion, 320);
      }
      render();
    } else {
      S.hearts--;
      S.wrong++;
      S.combo = 0;
      TQ.sfx.bad();
      if (btn) { btn.classList.add('shake'); setTimeout(function () { btn.classList.remove('shake'); }, 400); }
      el.mascot.classList.add('sad');
      setTimeout(function () { el.mascot.classList.remove('sad'); }, 900);
      renderHearts();
      var now = Date.now();
      if (now - S.lastBadAt > 1400) {
        S.lastBadAt = now;
        TQ.popup({
          icon: '💔',
          title: 'Salah pilih?',
          text: 'Nyawa berkurang. Coba kata berikutnya.',
          bad: true,
          actions: [{ label: 'Coba lagi' }]
        });
      }
      if (S.hearts <= 0) finish(false);
    }
  }

  function nextQuestion() {
    S.picked = [];
    S.qi++;
    if (S.qi >= S.questions.length) { finish(true); return; }
    render();
  }

  /* ---------- finish ---------- */
  function finish(passed) {
    if (S.done) return;
    S.done = true;
    var stars = passed ? (S.hearts >= 5 ? 3 : S.hearts >= 3 ? 2 : 1) : 0;
    var firstClear = passed && TQ.stageStars(SURAH, MODE, LEVEL) === 0;
    var points = firstClear ? Math.round(S.score / 10) : 0;

    if (passed) {
      TQ.setStageStars(SURAH, MODE, LEVEL, stars);
      if (points) TQ.addPoints(points);
      TQ.bumpStat('levels');
      TQ.bumpStat('ayahs', S.ayahs.length);
      TQ.bumpStat('heartsLost', MAX_HEARTS - S.hearts);
      if (S.maxCombo > (TQ.stats().bestCombo || 0)) TQ.bumpStat('bestCombo', S.maxCombo - (TQ.stats().bestCombo || 0));
      TQ.sfx.win();
    } else {
      TQ.sfx.lose();
    }

    var payload = {
      surah: SURAH, juz: JUZ, mode: MODE, level: LEVEL,
      name: S.meta ? S.meta.name : '', ar: S.meta ? S.meta.ar : '',
      score: S.score, points: points, stars: stars, passed: passed,
      hearts: S.hearts, combo: S.maxCombo, wrong: S.wrong,
      ayahs: S.ayahs.length, ayahsDone: passed ? S.ayahs.length : 0
    };
    try { sessionStorage.setItem('tq_last', JSON.stringify(payload)); } catch (e) {}
    location.href = 'result.html';
  }

  /* ---------- audio ---------- */
  function speak() {
    var q = currentQ();
    if (!q || !S.meta) return;
    var ay = S.ayahs[q.ai];
    var global = (S.meta.offset || 0) + ay.i;
    var url = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/' + global + '.mp3';
    var a = new Audio(url);
    a.volume = 0.9;
    a.play().catch(function () {
      TQ.popup({ icon: '🔇', title: 'Audio tidak bisa diputar', text: 'Butuh internet untuk memutar bacaan.', bad: true, actions: [{ label: 'Oke' }] });
    });
  }

  /* ---------- boot ---------- */
  Promise.all([Quran.surah(SURAH), Quran.surahMeta()]).then(function (res) {
    var d = res[0], meta = res[1];
    S.meta = meta[SURAH - 1];

    Quran.juzList().then(function (list) {
      // selalu mulai dari ayat 1 surah, bukan dari potongan juz
      S.ayahs = d.ayahs.slice(0, AYAH_CAP);

      if (!S.ayahs.length) {
        TQ.popup({ icon: '⚠️', title: 'Data ayat kosong', text: 'Coba pilih surah lain.', bad: true, actions: [{ label: 'Kembali', onClick: function () { location.href = 'surah.html?juz=' + JUZ; } }] });
        return;
      }

      // global ayah offset for audio
      var offset = 0;
      for (var i = 0; i < SURAH - 1; i++) offset += meta[i].ayahs;
      S.meta.offset = offset;

      el['g-title'].textContent = S.meta.name;
      el['g-ar'].textContent = S.meta.ar;
      el['surah-label'].textContent = 'سورة ' + S.meta.ar;
      el['mode-label'].textContent = (MODE === 'arti' ? 'Susun Arti' : 'Susun Ayat') + ' · Level ' + LEVEL;
      el.bismillah.style.display = (SURAH === 1 && S.ayahs[0].i === 1 && MODE === 'ayat') ? 'block' : 'none';
      document.title = S.meta.name + ' — Tilawah Quest';
      el.quit.href = 'surah.html?juz=' + JUZ + '&mode=' + MODE;
      el.mascot.innerHTML = '';
      el.mascot.appendChild(TQ.mascot(56));

      buildQuestions();
      render();

      el.speak.onclick = speak;
      var ra = document.getElementById('retry-ayah');
      if (ra) ra.onclick = function () {
        var q = currentQ();
        if (!q) return;
        S.picked = [];
        S.combo = 0;
        TQ.sfx.tap();
        render();
      };
      el.quit.onclick = function (e) {
        if (S.qi > 0 && !S.done) {
          e.preventDefault();
          TQ.popup({
            icon: '🚪', title: 'Keluar sekarang?', text: 'Progres level ini belum disimpan.',
            actions: [
              { label: 'Lanjut main', ghost: true },
              { label: 'Keluar', onClick: function () { location.href = 'surah.html?juz=' + JUZ + '&mode=' + MODE; } }
            ]
          });
        }
      };
    });
  }).catch(function (e) {
    el['ayat-lines'].innerHTML = '<p class="muted">Gagal memuat ayat. <a href="play.html?juz=' + JUZ + '&surah=' + SURAH + '&mode=' + MODE + '&level=' + LEVEL + '">Muat ulang</a></p>';
  });
})();
