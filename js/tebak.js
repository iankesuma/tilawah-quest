/* Tilawah Quest — tebak ayat */
(function () {
  'use strict';

  var PER = 5;
  var MAX_HEARTS = 5;
  var params = new URLSearchParams(location.search);
  var STAGE = params.get('stage') ? Math.max(1, +params.get('stage')) : 0;

  var S = { meta: [], items: [], stage: 1, stages: 50, qi: 0, hearts: MAX_HEARTS, score: 0, right: 0, locked: false };

  var el = {};
  ['prog', 'pts', 'pbar', 'stage-badge', 'hearts', 'ar', 'opts', 'done', 'sheet', 'hgrid', 'hq', 'hcount', 'openlist', 'sheet-close']
    .forEach(function (id) { el[id] = document.getElementById(id); });

  if (!TQ.requireProfile()) return;
  el.pts.textContent = TQ.fmt(TQ.points());

  function store() {
    try { return JSON.parse(localStorage.getItem('tq_tebak_v1') || '{}'); } catch (e) { return {}; }
  }
  function saveStore(o) { localStorage.setItem('tq_tebak_v1', JSON.stringify(o)); }
  function stageStars(st) { return store()[st] || 0; }
  function setStageStars(st, n) { var o = store(); if ((o[st] || 0) < n) { o[st] = n; saveStore(o); } }
  function stagesDone() { return Object.keys(store()).filter(function (k) { return store()[k] > 0; }).length; }

  function rnd(n) { return Math.floor(Math.random() * n); }

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
    return m.name + ' ayat ' + a;
  }

  function startStage() {
    S.stage = Math.min(Math.max(1, S.stage), S.stages);
    S.qi = 0; S.hearts = MAX_HEARTS; S.score = 0; S.right = 0; S.locked = false;
    el.done.classList.add('hidden');
    el.done.innerHTML = '';
    el.opts.style.display = 'grid';
    el['stage-badge'].textContent = 'Stage ' + S.stage + '/' + S.stages;
    renderHearts();
    renderQuestion();
  }

  function question(i) {
    var off = (S.stage - 1) * PER;
    return S.items[off + i];
  }

  function renderQuestion() {
    var q = question(S.qi);
    if (!q) { finishStage(); return; }
    S.locked = false;
    el.ar.textContent = q.ar;
    el.prog.textContent = 'Soal ' + (S.qi + 1) + '/' + PER;
    el.pbar.style.width = (S.qi / PER * 100) + '%';

    var answer = label(q.s, q.a);
    var opts = [{ txt: answer, ok: true }];
    var guard = 0;
    while (opts.length < 4 && guard++ < 300) {
      var s = 1 + rnd(114);
      if (s === q.s) continue;
      var m = S.meta[s - 1];
      var a = 1 + rnd(m.ayat);
      var t = label(s, a);
      if (opts.some(function (o) { return o.txt === t; })) continue;
      opts.push({ txt: t, ok: false });
    }
    opts = TQ.shuffle(opts);

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
      TQ.sfx.ok();
      var q = question(S.qi);
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
    renderHearts();
    if (S.hearts <= 0) finishStage(true);
  }

  function finishStage(failed) {
    var passed = !failed;
    var stars = passed ? (S.hearts >= 5 ? 3 : S.hearts >= 3 ? 2 : 1) : 0;
    var first = passed && stageStars(S.stage) === 0;
    if (passed) {
      setStageStars(S.stage, stars);
      var gain = S.score + (first ? 20 : 0);
      if (first) TQ.addPoints(Math.round(gain / 2));
      TQ.bumpStat('levels');
      TQ.sfx.win();
    } else {
      TQ.sfx.lose();
    }
    el.pts.textContent = TQ.fmt(TQ.points());
    el.opts.innerHTML = '';
    el.opts.style.display = 'none';
    el.done.classList.remove('hidden');
    el.done.innerHTML =
      '<div class="stars">' + (passed ? '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars) : '☆☆☆') + '</div>' +
      '<h3>' + (passed ? (S.stage === S.stages ? 'Masya Allah, 50 stage selesai!' : 'Alhamdulillah, stage selesai!') : 'Nyawa habis') + '</h3>' +
      '<div class="muted" style="font-size:12.5px;font-weight:800">' +
        'Benar ' + S.right + '/' + PER + ' · skor ' + S.score +
        (first ? ' · +' + Math.round((S.score + 20) / 2) + ' poin' : '') +
      '</div>' +
      (passed && S.stage < S.stages
        ? '<button class="btn" id="next-stage">Stage ' + (S.stage + 1) + ' →</button>'
        : '<button class="btn" id="next-stage">Main lagi</button>') +
      '<button class="btn ghost small" id="again-stage">Ulangi stage</button>';
    var nx = document.getElementById('next-stage');
    nx.onclick = function () {
      if (passed && S.stage < S.stages) { S.stage++; startStage(); }
      else { S.stage = 1; startStage(); }
    };
    document.getElementById('again-stage').onclick = function () { startStage(); };
    el.done.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  Promise.all([
    fetch('data/tebak.json?v=32').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
    fetch('data/surah-meta.json?v=6').then(function (r) { return r.json(); })
  ]).then(function (res) {
    var d = res[0];
    S.items = d.items;
    S.stages = d.stages || 50;
    S.meta = res[1];
    if (!STAGE) {
      STAGE = 1;
      for (var i = 1; i <= S.stages; i++) { if (!stageStars(i)) { STAGE = i; break; } }
    }
    S.stage = STAGE;
    startStage();
  }).catch(function () {
    el.prog.textContent = 'Gagal memuat';
    el.ar.textContent = 'Soal belum bisa dimuat. Periksa koneksi lalu muat ulang.';
  });
})();
