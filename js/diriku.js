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
    var shirtC = st.shirt == null ? '#DCEBF3' : ITEMS.shirt[st.shirt][1];
    var pantsC = st.pants == null ? '#C9DDE7' : ITEMS.pants[st.pants][1];
    var shoeC = st.shoe == null ? '#315B9D' : ITEMS.shoe[st.shoe][1];
    var ride = st.ride ? ITEMS.ride[st.ride][1] : '';
    var toy = st.toy ? ITEMS.toy[st.toy][1] : '';
    var isSkirt = st.pants === 4;
    var O = ' stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"';

    var shadow = '<ellipse cx="100" cy="232" rx="42" ry="6" fill="#1E3A4C14"/>';

    var legs = '<rect x="84" y="186" width="14" height="32" rx="7" fill="' + ch.skin + '"' + O + '/>' +
               '<rect x="102" y="186" width="14" height="32" rx="7" fill="' + ch.skin + '"' + O + '/>';

    var shoes = '<path d="M78 214 h20 v9 q0 6 -7 6 h-16 q-5 0 -5 -5 v-3 q0 -7 8 -7z" fill="' + shoeC + '"' + O + '/>' +
                '<path d="M102 214 h20 v9 q0 6 -7 6 h-16 q-5 0 -5 -5 v-3 q0 -7 8 -7z" fill="' + shoeC + '"' + O + '/>';

    var pants = isSkirt
      ? '<path d="M74 148 h52 l11 44 q-37 8 -74 0 z" fill="' + pantsC + '"' + O + '/>'
      : '<path d="M72 148 h56 v40 q0 6 -6 6 h-16 q-6 0 -6 -6 v-14 h-4 v14 q0 6 -6 6 h-14 q-6 0 -6 -6 z" fill="' + pantsC + '"' + O + '/>';

    var neck = '<rect x="91" y="78" width="18" height="18" rx="6" fill="' + ch.skin + '"/>';

    var shirt = '<path d="M76 92 h48 q12 0 12 14 v34 q0 10 -10 10 h-52 q-10 0 -10 -10 v-34 q0 -14 12 -14z" fill="' + shirtC + '"' + O + '/>' +
                '<path d="M72 98 q-14 8 -14 24 v20" fill="none" stroke="' + INK + '" stroke-width="13" stroke-linecap="round"/>' +
                '<path d="M72 98 q-14 8 -14 24 v20" fill="none" stroke="' + shirtC + '" stroke-width="9" stroke-linecap="round"/>' +
                '<path d="M128 98 q14 8 14 24 v20" fill="none" stroke="' + INK + '" stroke-width="13" stroke-linecap="round"/>' +
                '<path d="M128 98 q14 8 14 24 v20" fill="none" stroke="' + shirtC + '" stroke-width="9" stroke-linecap="round"/>' +
                '<circle cx="58" cy="146" r="9" fill="' + ch.skin + '"' + O + '/>' +
                '<circle cx="142" cy="146" r="9" fill="' + ch.skin + '"' + O + '/>';

    var faceGroup = '<g transform="translate(66,10) scale(0.68)">' + TQ.charFace(ch, null, true) + '</g>';

    return '<svg viewBox="0 0 200 244" class="ava-svg" role="img" aria-label="Karakter ' + ch.name + '">' +
      (ride ? '<text x="40" y="232" font-size="38" text-anchor="middle">' + ride + '</text>' : '') +
      shadow + legs + shoes + pants + neck + shirt + faceGroup +
      (toy ? '<text x="162" y="150" font-size="30" text-anchor="middle">' + toy + '</text>' : '') +
      '</svg>';
  }

  function tags() {
    var out = [];
    if (st.shirt != null) out.push(['👕', ITEMS.shirt[st.shirt][0]]);
    if (st.pants != null) out.push(['👖', ITEMS.pants[st.pants][0]]);
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
