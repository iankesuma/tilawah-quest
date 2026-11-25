/* Diriku — karakter & toko */
(function () {
  'use strict';

  var ITEMS = {
    shirt: [
      ['Baju biru', '#54BFE3', 0], ['Baju merah', '#ED6674', 25], ['Baju hijau', '#59C990', 40],
      ['Jaket kuning', '#F2C84B', 65], ['Baju olahraga', '#8D79DB', 80], ['Kaos pelangi', '#F28CA8', 110],
      ['Seragam sekolah', '#385B9D', 140], ['Baju pahlawan', '#E86D38', 200]
    ],
    pants: [
      ['Celana biru', '#5278BD', 0], ['Celana merah', '#D95B69', 25], ['Celana hijau', '#4FA978', 40],
      ['Celana pendek', '#F0A84E', 55], ['Rok pink', '#E98AB8', 70], ['Celana olahraga', '#766BC2', 90]
    ],
    shoe: [
      ['Sepatu biru', '#315B9D', 0], ['Sepatu merah', '#E65D73', 25], ['Sepatu hijau', '#35A86B', 40],
      ['Sepatu kuning', '#E0A72F', 55], ['Sepatu ungu', '#7957B8', 70]
    ],
    ride: [
      ['Tanpa kendaraan', '', 0], ['Skuter', '🛴', 0], ['Sepeda', '🚲', 45], ['Skateboard', '🛹', 70],
      ['Mobil kecil', '🚙', 120], ['Bus sekolah', '🚌', 160], ['Kuda poni', '🐴', 180],
      ['Roket', '🚀', 250], ['Pesawat', '✈️', 300]
    ],
    toy: [
      ['Tanpa benda', '', 0], ['Bola', '⚽', 20], ['Boneka', '🧸', 35], ['Layangan', '🪁', 45],
      ['Balon', '🎈', 25], ['Buku', '📚', 30], ['Gitar', '🎸', 90], ['Robot', '🤖', 100], ['Kamera', '📷', 75]
    ]
  };

  var CATS = [
    { id: 'shirt', label: 'Baju', icon: '👕' },
    { id: 'pants', label: 'Celana', icon: '👖' },
    { id: 'shoe', label: 'Sepatu', icon: '👟' },
    { id: 'ride', label: 'Kendaraan', icon: '🛴' },
    { id: 'toy', label: 'Benda', icon: '⚽' }
  ];

  var SKIN = '#F0C29B';
  var INK = '#1E3A4C';

  var st = TQ.diriku();
  var cat = 'shirt';

  var el = {
    stage: TQ.qs('#stage'),
    pts: TQ.qs('#pts'),
    tabs: TQ.qs('#tabs'),
    shop: TQ.qs('#shop'),
    tags: TQ.qs('#tags'),
    charname: TQ.qs('#charname')
  };

  function save() { TQ.save(); }
  function price(it) { return it[2]; }
  function owned(c) { return st.owned[c] || []; }
  function isOwned(c, i) { return owned(c).indexOf(i) > -1; }

  /* ---------- avatar ---------- */
  function avatarSvg() {
    var ch = TQ.character();
    var girl = !!ch.female;
    var shirtC = st.shirt == null ? '#DCEBF3' : ITEMS.shirt[st.shirt][1];
    var pantsC = st.pants == null ? '#C9DDE7' : ITEMS.pants[st.pants][1];
    var shoeC = st.shoe == null ? '#315B9D' : ITEMS.shoe[st.shoe][1];
    var ride = st.ride ? ITEMS.ride[st.ride][1] : '';
    var toy = st.toy ? ITEMS.toy[st.toy][1] : '';
    var O = ' stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"';
    var OL = ' stroke="' + INK + '" stroke-width="2" stroke-linecap="round" fill="none"';

    // kepala memakai koordinat asli charFace (100x110); badan digambar di ruang yang sama
    var head = TQ.charFace(ch, null, true);

    var shadow = '<ellipse cx="50" cy="222" rx="21" ry="3.6" fill="#1E3A4C14"/>';

    var neck = '<rect x="42" y="62" width="16" height="26" rx="7" fill="' + ch.skin + '"/>';

    var torso = '<path d="M34 82 q16 -6 32 0 l2 68 q-18 5 -36 0 z" fill="' + shirtC + '"' + O + '/>' +
      '<path d="M43 84 q7 6 14 0" stroke="' + INK + '" stroke-width="1.6" fill="none" opacity=".35"/>';

    var arms =
      '<path d="M37 84 q-9 10 -10 26 l-1 14" ' + OL + ' stroke-width="11.5" stroke="' + INK + '"/>' +
      '<path d="M37 84 q-9 10 -10 26 l-1 14" ' + OL + ' stroke-width="8" stroke="' + shirtC + '"/>' +
      '<path d="M63 84 q9 10 10 26 l1 14" ' + OL + ' stroke-width="11.5" stroke="' + INK + '"/>' +
      '<path d="M63 84 q9 10 10 26 l1 14" ' + OL + ' stroke-width="8" stroke="' + shirtC + '"/>' +
      '<circle cx="26" cy="130" r="6" fill="' + ch.skin + '"' + O + '/>' +
      '<circle cx="74" cy="130" r="6" fill="' + ch.skin + '"' + O + '/>';

    var lower;
    if (girl) {
      lower = '<path d="M36 146 h28 l8 38 q-22 6 -44 0 z" fill="' + pantsC + '"' + O + '/>' +
        '<rect x="42" y="180" width="7" height="28" rx="3.5" fill="' + ch.skin + '"' + O + '/>' +
        '<rect x="51" y="180" width="7" height="28" rx="3.5" fill="' + ch.skin + '"' + O + '/>';
    } else {
      lower = '<path d="M37 146 h26 v22 q0 4 -4 4 h-5 q-4 0 -4 -4 v-6 h-0.5 v6 q0 4 -4 4 h-4 q-4 0 -4 -4 z" fill="' + pantsC + '"' + O + '/>' +
        '<rect x="40" y="166" width="9" height="42" rx="4.5" fill="' + pantsC + '"' + O + '/>' +
        '<rect x="51" y="166" width="9" height="42" rx="4.5" fill="' + pantsC + '"' + O + '/>';
    }

    var shoes = '<path d="M37 206 h11 q2 0 2 3 v4 q0 3 -3 3 h-10 q-3 0 -3 -3 v-4 q0 -3 3 -3z" fill="' + shoeC + '"' + O + '/>' +
      '<path d="M50 206 h11 q3 0 3 3 v4 q0 3 -3 3 h-10 q-3 0 -3 -3 v-4 q0 -3 2 -3z" fill="' + shoeC + '"' + O + '/>';

    return '<svg viewBox="0 0 100 234" class="ava-svg" role="img" aria-label="Karakter ' + ch.name + '">' +
      (ride ? '<text x="18" y="224" font-size="20" text-anchor="middle">' + ride + '</text>' : '') +
      shadow + lower + shoes + torso + arms + neck + head +
      (toy ? '<text x="82" y="140" font-size="16" text-anchor="middle">' + toy + '</text>' : '') +
      '</svg>';
  }

  function tags() {
    var out = [];
    if (st.shirt != null) out.push(['👕', ITEMS.shirt[st.shirt][0]]);
    if (st.pants != null) out.push([TQ.character().female ? '👗' : '👖', ITEMS.pants[st.pants][0]]);
    if (st.shoe != null) out.push(['👟', ITEMS.shoe[st.shoe][0]]);
    if (st.ride) out.push([ITEMS.ride[st.ride][1], ITEMS.ride[st.ride][0]]);
    if (st.toy) out.push([ITEMS.toy[st.toy][1], ITEMS.toy[st.toy][0]]);
    if (!out.length) out.push(['🙂', 'Karakter baru']);
    el.tags.innerHTML = out.map(function (t) {
      return '<span class="tag">' + t[0] + ' ' + t[1] + '</span>';
    }).join('');
  }

  function paintStage() {
    el.stage.innerHTML = avatarSvg();
    el.pts.textContent = TQ.fmt(TQ.points());
    tags();
    var ch = TQ.character();
    if (el.charname) el.charname.textContent = ch.name + ' · ' + ch.note;
  }

  /* ---------- shop ---------- */
  function swatch(c, it) {
    if (c === 'ride' || c === 'toy') {
      return it[1] ? '<span class="sw-emoji">' + it[1] + '</span>' : '<span class="sw-none">—</span>';
    }
    if (c === 'shirt') {
      return '<span class="sw-shirt" style="background:' + it[1] + '"></span>';
    }
    if (c === 'pants') {
      var skirt = it === ITEMS.pants[4];
      return '<span class="' + (skirt ? 'sw-skirt' : 'sw-pants') + '" style="background:' + it[1] + '"></span>';
    }
    return '<span class="sw-shoe" style="background:' + it[1] + '"></span>';
  }

  function renderShop() {
    var list = ITEMS[cat];
    el.shop.innerHTML = '';
    list.forEach(function (it, i) {
      var has = isOwned(cat, i);
      var active = st[cat] === i;
      var p = price(it);
      var can = has || TQ.points() >= p;
      var card = document.createElement('article');
      card.className = 'shop-item' + (active ? ' active' : '') + (has ? ' stored' : '');
      card.innerHTML =
        '<div class="sw-wrap">' + swatch(cat, it) + '</div>' +
        '<b>' + it[0] + '</b>' +
        (active ? '<span class="pill on">Dipakai</span>'
          : has ? '<span class="pill">Dimiliki</span>'
          : '<span class="pill price">🪙 ' + p + '</span>') +
        '<button class="btn small ' + (active ? 'ghost' : has ? 'soft' : '') + '" ' + (can ? '' : 'disabled') + ' data-i="' + i + '">' +
        (active ? 'Lepas' : has ? 'Pakai' : can ? 'Beli' : 'Perlu ' + p) + '</button>';
      el.shop.appendChild(card);
    });
  }

  function buyOrEquip(i) {
    var it = ITEMS[cat][i];
    if (st[cat] === i) {
      st[cat] = null;
      TQ.sfx.tap();
      save(); paintStage(); renderShop();
      return;
    }
    if (!isOwned(cat, i)) {
      var p = price(it);
      if (TQ.points() < p) { TQ.sfx.bad(); return; }
      TQ.addPoints(-p);
      st.owned[cat] = owned(cat).concat([i]);
      TQ.sfx.coin();
      TQ.popup({ icon: '🎉', title: it[0] + ' terbuka!', text: 'Langsung dipakai. Sisa poin ' + TQ.fmt(TQ.points()) + '.', good: true, actions: [{ label: 'Oke' }] });
    } else {
      TQ.sfx.ok();
    }
    st[cat] = i;
    save(); paintStage(); renderShop();
  }

  el.shop.onclick = function (e) {
    var b = e.target.closest('button[data-i]');
    if (!b || b.disabled) return;
    buyOrEquip(+b.dataset.i);
  };

  /* ---------- tabs & gender ---------- */
  el.tabs.innerHTML = CATS.map(function (c) {
    return '<button type="button" data-c="' + c.id + '" aria-pressed="false">' + c.icon + ' ' + c.label + '</button>';
  }).join('');

  el.tabs.onclick = function (e) {
    var b = e.target.closest('button[data-c]');
    if (!b) return;
    cat = b.dataset.c;
    TQ.sfx.tap();
    paintTabs(); renderShop();
  };

  function paintTabs() {
    Array.prototype.forEach.call(el.tabs.children, function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.c === cat));
    });
  }

  /* ---------- migrate old points ---------- */
  (function migrate() {
    try {
      var old = +(localStorage.getItem('points') || 0);
      if (old > 0 && TQ.points() === 0) {
        TQ.addPoints(old);
        localStorage.setItem('points', '0');
      }
    } catch (e) {}
  })();

  paintTabs();
  paintStage();
  renderShop();
})();
