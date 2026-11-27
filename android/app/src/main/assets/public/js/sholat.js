/* Tilawah Quest — jadwal sholat 5 waktu + dhuha berdasarkan lokasi */
(function () {
  'use strict';
  var KEY = 'tq_loc';
  var el = {};
  ['city', 'date', 'list', 'next', 'nextLbl', 'next-at', 'status', 'btnLoc', 'btnManual', 'src'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });

  var PRAYERS = [
    { k: 'Fajr', label: 'Subuh', icon: '🌄' },
    { k: 'Dhuha', label: 'Dhuha', icon: '🌤️' },
    { k: 'Dhuhr', label: 'Dzuhur', icon: '☀️' },
    { k: 'Asr', label: 'Ashar', icon: '🌇' },
    { k: 'Maghrib', label: 'Maghrib', icon: '🌆' },
    { k: 'Isha', label: 'Isya', icon: '🌙' }
  ];

  var timings = null;      // {Subuh:'04:32', ...} dalam menit
  var cityName = '';
  var timer = null;

  function fmtMin(m) {
    m = ((m % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  }
  function toMin(hhmm) {
    var p = String(hhmm).split(':');
    return (+p[0]) * 60 + (+p[1]);
  }
  function nowMin() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }

  function saveLoc(lat, lng, city) {
    try { localStorage.setItem(KEY, JSON.stringify({ lat: lat, lng: lng, city: city || '' })); } catch (e) {}
  }
  function readLoc() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }

  function setStatus(msg, bad) {
    el.status.textContent = msg || '';
    el.status.className = 'sh-status' + (bad ? ' bad' : '');
    el.status.hidden = !msg;
  }

  function reverseCity(lat, lng) {
    return fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lng + '&localityLanguage=id')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return '';
        return [d.city || d.locality, d.principalSubdivision].filter(Boolean).join(', ');
      })
      .catch(function () { return ''; });
  }

  function fetchTimings(lat, lng) {
    var d = new Date();
    var date = ('0' + d.getDate()).slice(-2) + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + d.getFullYear();
    var url = 'https://api.aladhan.com/v1/timings/' + date +
      '?latitude=' + lat + '&longitude=' + lng + '&method=20&school=0';
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || !j.data || !j.data.timings) throw new Error('Data kosong');
      return j.data.timings;
    });
  }

  function build(t) {
    var syuruq = toMin(t.Sunrise || t.Fajr);
    var dhuhaStart = syuruq + 20;           // ±20 menit setelah syuruq
    var dhuhaEnd = toMin(t.Dhuhr) - 10;     // berhenti sebelum dzuhur
    timings = {
      Subuh: toMin(t.Fajr),
      Dhuha: dhuhaStart,
      Dzuhur: toMin(t.Dhuhr),
      Ashar: toMin(t.Asr),
      Maghrib: toMin(t.Maghrib),
      Isya: toMin(t.Isha)
    };
    timings.__dhuhaEnd = dhuhaEnd;
    render();
    startTimer();
  }

  function render() {
    if (!timings) return;
    var d = new Date();
    el.date.textContent = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    el.city.textContent = cityName || 'Lokasi terdeteksi';
    el.list.innerHTML = '';
    var now = nowMin();

    PRAYERS.forEach(function (p) {
      var m = timings[p.label];
      var row = document.createElement('div');
      row.className = 'sh-row';
      var active = false, sub = '';
      if (p.label === 'Dhuha') {
        active = now >= m && now <= timings.__dhuhaEnd;
        sub = now > timings.__dhuhaEnd
          ? 'sudah lewat (sampai ' + fmtMin(timings.__dhuhaEnd) + ')'
          : now < m
            ? 'mulai ' + fmtMin(m) + ' – ' + fmtMin(timings.__dhuhaEnd)
            : 'sedang berlangsung, sampai ' + fmtMin(timings.__dhuhaEnd);
      } else {
        sub = now >= m ? 'sudah lewat' : 'belum';
      }
      if (active) row.classList.add('now');
      row.innerHTML =
        '<span class="sh-ic">' + p.icon + '</span>' +
        '<span class="sh-name">' + p.label + '</span>' +
        '<span class="sh-time">' + fmtMin(m) + '</span>' +
        '<span class="sh-sub">' + sub + '</span>';
      el.list.appendChild(row);
    });

    // sholat berikutnya (5 waktu saja)
    var keys = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
    var next = null;
    for (var i = 0; i < keys.length; i++) {
      if (timings[keys[i]] > now) { next = keys[i]; break; }
    }
    if (!next) next = 'Subuh';
    Array.prototype.forEach.call(el.list.children, function (rowEl) {
      if (rowEl.querySelector('.sh-name').textContent === next) rowEl.classList.add('next');
    });
    var target = timings[next] + (timings[next] <= now ? 1440 : 0);
    var left = Math.max(0, Math.round(target - now));
    var hh = Math.floor(left / 60), mm = left % 60;
    el.nextLbl.textContent = next;
    el.next.textContent = (hh > 0 ? hh + ' jam ' : '') + mm + ' menit';
    el['next-at'].textContent = 'pukul ' + fmtMin(timings[next]);
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(render, 30000);
  }

  function load(lat, lng, label) {
    setStatus('Mengambil jadwal…');
    el.src.textContent = '';
    var cityP = label ? Promise.resolve(label) : reverseCity(lat, lng);
    Promise.all([fetchTimings(lat, lng), cityP]).then(function (res) {
      cityName = res[1] || '';
      build(res[0]);
      saveLoc(lat, lng, cityName);
      setStatus('');
      el.src.textContent = 'Sumber: Aladhan API (Kemenag, method 20) · lokasi ' + lat.toFixed(3) + ', ' + lng.toFixed(3);
    }).catch(function (e) {
      setStatus('Gagal ambil jadwal. Cek internet lalu coba lagi.', true);
      el.src.textContent = String(e.message || e);
    });
  }

  function askLocation() {
    if (!navigator.geolocation) {
      setStatus('Perangkat tidak mendukung lokasi. Pakai pilihan kota di bawah.', true);
      return;
    }
    setStatus('Minta izin lokasi…');
    navigator.geolocation.getCurrentPosition(function (pos) {
      load(pos.coords.latitude, pos.coords.longitude);
    }, function (err) {
      setStatus(err.code === 1
        ? 'Izin lokasi ditolak. Pilih kota manual di bawah.'
        : 'Lokasi tidak terbaca. Pilih kota manual di bawah.', true);
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
  }

  el.btnLoc.onclick = askLocation;
  el.btnManual.onclick = function () {
    var c = prompt('Tulis kota (contoh: Bandung, Surabaya, Mekkah)');
    if (!c) return;
    setStatus('Mencari kota…');
    fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(c) + '&count=1&language=id')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var hit = j && j.results && j.results[0];
        if (!hit) throw new Error('Kota tidak ditemukan');
        var label = [hit.name, hit.admin1, hit.country].filter(Boolean).join(', ');
        load(hit.latitude, hit.longitude, label);
      })
      .catch(function () { setStatus('Kota tidak ditemukan. Coba nama lain.', true); });
  };

  var saved = readLoc();
  if (saved && saved.lat) {
    cityName = saved.city || '';
    load(saved.lat, saved.lng, saved.city);
  } else {
    askLocation();
  }
})();
