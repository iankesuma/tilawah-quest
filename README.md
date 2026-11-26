# Tilawah Quest

Game belajar Al-Quran untuk anak: susun ayat, susun arti, susun nama nabi, rukun, dan hadis.

Live: <https://iankesuma.github.io/tilawah-quest/>

## Alur

```text
login.html → onboarding.html → juz.html → surah.html → play.html → result.html
```

Halaman pendukung: `profil.html`, `belajar.html` (nabi/rukun/hadis/tebak ayat), `bantuan.html`.

## Fitur

- 30 juz, 114 surah, 6.236 ayat, teks Uthmani + terjemahan Kemenag (id.indonesian).
- Dua mode: **Susun Ayat** (kata Arab) dan **Susun Arti** (terjemahan).
- Dua tingkat per surah: **Level 1 ada bayangan**, **Level 2 tanpa bayangan**.
- Nyawa 5 hati, combo tiap 3 benar, skor, bintang 1–3.
- Poin hanya sekali per level (anti-farming); mengulang memperbaiki bintang.
- Mini game lain: susun nama 25 nabi, rukun iman & islam, 500 hadis pilihan (Bukhari, Muslim, Abu Dawud, Nasai, Ibnu Majah), dan toko karakter **Diriku**.
- Data ayat dibundel lokal (`data/`), jadi permainan jalan tanpa internet. Audio butuh koneksi.
- PWA: `manifest.json` + `sw.js` (cache offline), bisa dipasang ke home screen.
- Semua progres disimpan di perangkat (`localStorage`, key `tq_v1`).

## Struktur

```text
index.html            redirect ke login
login.html            masuk lokal (email + nomor HP, demo perangkat)
onboarding.html       nama, warna bot, topi
juz.html              grid 30 juz + progres
surah.html            mode + daftar surah per juz
play.html / js/play.js  mesin latihan
result.html           hasil, bintang, poin
profil.html           statistik + reset
belajar.html          hub mini game
nabi.html rukun.html hadis.html tebak.html
bantuan.html          cara main + sumber data
css/app.css           token + komponen
css/screens.css       layout layar
js/app.js             store tq_v1, profil, progres, sfx, popup
js/quran.js           loader JSON offline-first
data/juz.json         peta juz → surah + rentang ayat
data/surah-meta.json  metadata 114 surah
data/quran/NNN.json   ayat per surah
sw.js manifest.json icon.svg
```

## Data

Sumber: [AlQuran Cloud](https://alquran.cloud) — `quran-uthmani` dan `id.indonesian`.
Bismillah di awal surah dibuang kecuali Al-Fatihah. Audio: `cdn.islamic.network` (Mishary Alafasy).

## Pengembangan lokal

```bash
python -m http.server 8765
# buka http://127.0.0.1:8765/login.html
```

Service worker hanya didaftarkan pada `https:` supaya tidak mengganggu pengembangan lokal.

## Catatan

Login bersifat lokal untuk profil perangkat, bukan autentikasi produksi. Tidak ada backend dan tidak ada data yang dikirim ke server.
