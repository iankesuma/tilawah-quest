# Rencana Pembangunan Ulang Tilawah Quest
## Meniru workflow, UI, dan fitur game referensi (Al Quran Digital / gaya Duolingo)

Status: rencana, belum dieksekusi.
Basis: 9 screenshot referensi + kondisi kode saat ini di folder ini.

---

## 1. Yang ditiru dari referensi

### Alur pemain (workflow)
```
Login (email + nomor HP)
  → Onboarding: nama panggilan + warna bot + topi
  → Pilih Juz (grid 3 kolom, Juz 1–30)
  → Pilih Surah dalam Juz
  → Pilih Mode: Susun Ayat / Susun Arti
  → Pilih Level: Level 1 (ada bayangan) / Level 2 (tanpa bayangan)
  → Latihan (soal per ayat, ketuk kata berikutnya)
  → Hasil (bintang, poin, combo, nyawa)
```

### Fitur inti yang harus ada
| Fitur | Detail dari referensi |
|---|---|
| Nyawa | 5 hati di header. Salah = 1 hati hilang. Habis = level gagal. |
| Combo | "Benar terus? Combo! 🔥" saat benar beruntun. |
| Skor | Angka di header + progress bar per level. |
| Level 1 | "Ada bayangan" — kata berikutnya ditampilkan samar sebagai petunjuk. |
| Level 2 | "Tanpa bayangan" — tanpa petunjuk. |
| Unlock | Level 2 terkunci (`LOCK`) sampai Level 1 selesai. Surah berikutnya terkunci sampai surah sebelumnya selesai. |
| NEW | Penanda level/surah baru yang belum dimainkan. |
| Dua mode | `Susun Ayat` (kata Arab ke urutan mushaf) dan `Susun Arti` (kata Indonesia ke urutan arti). |
| Progress per Juz | Pill `x/29 level` di kartu Juz. |
| Maskot | Karakter pixel/oranye yang bereaksi: senang saat benar, retak saat salah. |
| Audio | Ikon speaker untuk memutar bacaan ayat. |
| Popup salah | "Salah pilih? Nyawa berkurang" + ikon hati pecah. |
| Onboarding | Nama + warna bot (9 warna) + topi (6 pilihan: Tanpa, Peci putih, Kopiyah, Short cap, Koboi, Bucket). |

### Perbedaan penting dengan versi sekarang
| Aspek | Sekarang | Target |
|---|---|---|
| Navigasi | 114 surat langsung, tanpa Juz | Juz → Surah → Mode → Level |
| Level | Section 3 ayat, tanpa level | Level 1/2 per surah per mode |
| Nyawa | Tidak ada | 5 hati per sesi |
| Combo | Tidak ada | Ada, dengan popup |
| Mode | Hanya susun ayat Arab | Tambah Susun Arti (terjemahan) |
| Petunjuk | Tidak ada | Bayangan kata di Level 1 |
| Maskot | Tidak ada | Karakter reaktif |
| Onboarding | Login + menu kartu | Login → nama/bot → pilih Juz |
| Header game | Logo + poin | X, hati, judul surah, speaker, skor, progress bar |

---

## 2. Peta layar dan route

```
/                    → redirect ke login
login.html           → masuk (email + nomor HP)
onboarding.html      → nama + warna bot + topi → "Pilih Juz >"
juz.html             → grid Juz 1–30 + progress
surah.html           → daftar surah dalam juz + status level
mode.html            → pilih Susun Ayat / Susun Arti
level.html           → Level 1 / Level 2 (LOCK/NEW)
play.html            → latihan inti (satu level = satu surah)
result.html          → hasil level: bintang, poin, combo, ulangi/lanjut
profil.html          → nama, bot, total poin, bintang, reset progres
bantuan.html         → cara main, sumber data
```

Layar pendukung yang tetap dipakai:
```
diriku.html   → dipertahankan sebagai "toko & avatar" yang terhubung ke bot onboarding
nabi.html     → dipindah ke dalam shell baru (menu "Belajar")
rukun.html    → idem
hadis.html    → idem
```

Halaman yang dihapus/digabung:
```
game-menu.html  → diganti juz.html sebagai layar utama setelah onboarding
surat.html      → diganti surah.html (berbasis juz)
index-v2.html   → diganti play.html
index.html      → tetap redirect saja
```

---

## 3. Design system

### Palet
| Token | Nilai | Pakai |
|---|---|---|
| `--bg` | `#DDF1FA` | latar halaman (biru muda) |
| `--bg-alt` | `#EAF7FD` | kartu lembut |
| `--surface` | `#FFFFFF` | kartu, panel, input |
| `--ink` | `#1E3A4C` | teks utama |
| `--muted` | `#6B8794` | teks sekunder |
| `--green` | `#8DBF2E` | tombol utama (lime) |
| `--green-dark` | `#6E9A1F` | shadow bawah tombol |
| `--green-soft` | `#E6F4EA` | pill progress |
| `--green-text` | `#2F7A45` | teks pill |
| `--blue` | `#2F80C9` | aksen, ikon, border aktif |
| `--orange` | `#F5A623` | maskot, NEW, highlight kata |
| `--pink` | `#F06A8A` | salah, hati hilang |
| `--yellow` | `#FFC93C` | bintang, skor |

### Tipografi
| Peran | Font | Ukuran |
|---|---|---|
| Judul | `Baloo 2` / `Nunito` 800 | 28–40px |
| UI/body | `Nunito` 600–700 | 15–17px |
| Arab | `Amiri Quran` atau `Scheherazade New` | 26–34px, `line-height:2` |
| Angka/level | `Baloo 2` 800 | 24–32px |

### Komponen wajib (dibuat sekali, dipakai semua layar)
1. `AppHeader` — varian: `nav` (back + judul), `game` (X, hati, judul, speaker, skor, progress bar).
2. `Card` — radius 20–24px, shadow lembut, border 2px putih.
3. `BtnPrimary` — lime, radius penuh, teks putih 800, shadow bawah 4px gelap, `:active` turun 2px.
4. `BtnSecondary` — putih, border 2px `--blue`.
5. `Pill` — progress `x/y level`.
6. `WordTile` — kartu kata: normal, terpilih (pink), benar (hijau), salah (merah + goyang).
7. `SlotRow` — baris slot kosong bergaris putus-putus untuk tempat menyusun.
8. `GhostWord` — kata samar untuk Level 1.
9. `Hearts` — 5 ikon, penuh/kosong.
10. `ProgressBar` — hijau, animasi lebar.
11. `Popup` — benar, salah, combo, level selesai.
12. `Mascot` — 3 state: idle, senang, retak.
13. `Tooltip` — kotak putih border gelap, untuk instruksi awal.

### Aturan UI
- Mobile-first: 360px jadi acuan utama. Semua layar harus muat tanpa scroll horizontal.
- Touch target minimal 44×44px.
- Teks Arab selalu `direction: rtl`, rata kanan, ukuran cukup besar.
- Fokus keyboard terlihat (`outline: 3px`).
- `prefers-reduced-motion` mematikan animasi.
- Bahasa Indonesia konsisten. Tidak ada teks Inggris di UI.

---

## 4. Mekanik game

### Sesi latihan
```
1 level = 1 surah × 1 mode × 1 level kesulitan
Isi level = semua ayat surah itu, dipecah per ayat
Nyawa awal = 5
Salah = -1 hati, kata tidak masuk slot
Hati habis = level gagal, tawarkan ulangi
```

### Mode Susun Ayat
- Tampil ayat lengkap di kartu atas (teks Arab + nomor ayat).
- Pemain mengetuk kata Arab sesuai urutan mushaf.
- Salah urutan = hati berkurang, kata kembali ke bank.
- Level 1: kata berikutnya ditampilkan samar di slot.
- Level 2: tanpa bayangan.

### Mode Susun Arti
- Tampil ayat Arab di atas, arti Indonesia dipecah jadi potongan.
- Pemain menyusun potongan arti sesuai urutan.
- Level 1: bayangan kata arti berikutnya.
- Level 2: tanpa bayangan.

### Combo
```
benar berturut 3  → "Benar terus? Combo! 🔥" + skor bonus
benar berturut 6  → combo naik, animasi lebih besar
salah             → combo reset
```

### Skor dan bintang
```
dasar per kata benar   = 10
bonus combo            = +5 per tingkat combo
bonus tanpa salah      = +20
bintang 3 = tanpa salah, bintang 2 = salah 1–2, bintang 1 = selesai
```

### Progres dan unlock
```
localStorage.tq_progress = {
  "<juz>": {
    "<surah>": {
      "ayat":  { "1": {"done":true,"stars":3}, "2": {...} },
      "arti":  { "1": {"done":true,"stars":2} }
    }
  }
}
```
Aturan:
- Level 2 terbuka setelah Level 1 surah itu selesai.
- Surah berikutnya terbuka setelah surah sebelumnya selesai di mode yang sama.
- Progress Juz = jumlah ayat selesai / total ayat Juz itu, ditampilkan `x/y level`.

### Anti-farming
- Poin hanya bertambah pada penyelesaian pertama.
- Mengulang level memberi 0 poin, tapi bintang bisa diperbaiki.
- Reset progres harus lewat konfirmasi ketik.

---

## 5. Data yang dibutuhkan

| Data | Sumber | Catatan |
|---|---|---|
| Peta Juz → Surah → Ayat | Statis, dibundel | 30 Juz, 114 surah. Tidak boleh bergantung API saat main. |
| Teks ayat Uthmani | `api.alquran.cloud/v1/surah/{n}/quran-uthmani` | Di-cache ke `data/quran/{n}.json` saat build, bukan saat main. |
| Terjemahan Indonesia | `api.alquran.cloud/v1/surah/{n}/id.indonesian` | Untuk mode Susun Arti. |
| Audio ayat | CDN qari (mis. `cdn.islamic.network/quran/audio`) | Opsional, dimuat saat tombol speaker ditekan. |
| Data nabi/rukun/hadis | Sudah ada lokal | Dipertahankan. |

Prinsip: **game harus tetap bisa dimainkan tanpa internet.** Data inti dibundel sebagai JSON, API hanya untuk melengkapi.

Struktur file:
```
data/
  juz.json              → [{juz:1, surah:[1,2,...]}]
  surah-meta.json       → [{n:1, name:"Al-Fatihah", arabic:"الفاتحة", ayahs:7}]
  quran/001.json        → [{ayah:1, text:"...", translation:"..."}]
```

---

## 6. Spesifikasi layar

### 6.1 `login.html`
- Latar `--bg`, kartu putih radius 24.
- Judul: "Masuk" + 👋
- Banner: "Masuk pakai email & nomor HP"
- Field 1: label "Username (email)", placeholder `nama@email.com`
- Field 2: label "Password (nomor HP)", placeholder `08xxxxxxxxxx`
- Tombol lime penuh: "Masuk"
- Footer: "Belum punya akun? Langsung isi saja."
- Hapus teks "Akun awal: admin / admin".
- Login tetap lokal (`localStorage`), tapi label jelas: "Profil perangkat, bukan akun online."

### 6.2 `onboarding.html`
- Tooltip: "Tulis namamu, lalu kunci 🔒"
- Label "Siapa namamu?" + input
- Tombol "Simpan 🔒"
- Label "Warna bot" + 9 lingkaran warna
- Label "Topi" + 6 kartu: Tanpa, Peci putih, Kopiyah, Short cap, Koboi, Bucket
- Tombol lime penuh: "Pilih Juz >"
- Bot di sini menggantikan/menyatu dengan avatar `diriku.html`.

### 6.3 `juz.html`
- Header: avatar bulat + nama + badge ⭐ poin.
- Instruksi hijau: "Pilih Juz yang mau kamu latih 👉"
- Grid 3 kolom, kartu putih: nomor besar, nama Juz abu, pill `x/y level`.
- Juz terkunci untuk pemain baru? Referensi membuka semua. Ikuti referensi: semua terbuka.

### 6.4 `surah.html`
- Header: back, judul "Juz 30", subjudul "An-Naba – An-Nas".
- Tooltip: "Mau susun ayat atau artinya?"
- Dua tombol mode: "Susun Ayat" (Kata Arab ke mushaf), "Susun Arti" (Arti di bawah ayat).
- Daftar surah: nomor + nama + nama Arab.
- Per surah: dua kartu level. `1 NEW!` oranye, `2 LOCK` abu.
- Panel pratinjau kecil: contoh soal sesuai mode aktif.

### 6.5 `play.html`
Header game:
```
[ X ]  ❤❤❤❤♡      An-Naba - hal 582
                   النبأ            🔊  ⭐ 36
[ progress bar hijau ───────────── ]
```
Isi:
- Kartu putih: judul surah Arab, basmalah (khusus awal surah), ayat aktif dengan nomor ayat di lingkaran.
- Ayat berikutnya tampil samar.
- Instruksi: "Ketuk kata berikutnya".
- Baris slot kosong bergaris putus-putus.
- Bank kata: grid 2–3 kolom, kartu putih border.
- Maskot di pojok kanan bawah.

Interaksi:
- Ketuk kata benar → masuk slot, hijau sebentar, skor naik.
- Ketuk kata salah → kartu pink, goyang, hati berkurang, popup "Salah pilih? Nyawa berkurang".
- Semua kata ayat selesai → ayat berikutnya otomatis.
- Semua ayat selesai → `result.html`.

### 6.6 `result.html`
- Bintang besar (1–3).
- Poin didapat, combo tertinggi, ayat selesai `x/y`.
- Tombol: "Ulangi", "Lanjut".
- Kalau hati habis: "Nyawa habis" + "Coba lagi".

### 6.7 `profil.html`
- Nama, bot, total poin, total bintang, progress per Juz.
- Tombol "Reset progres" dengan konfirmasi.

---

## 7. Arsitektur kode

```
index.html            redirect
login.html
onboarding.html
juz.html
surah.html
play.html
result.html
profil.html
bantuan.html
nabi.html  rukun.html  hadis.html  diriku.html

css/
  tokens.css          variabel warna, font, spacing
  base.css            reset, tipografi, layout
  components.css      header, card, btn, pill, tile, slot, popup, mascot
  screens.css         gaya per layar

js/
  store.js            localStorage wrapper, skema, migrasi
  quran.js            loader data lokal, cache, fallback
  game.js             mesin sesi: ayat, kata, hati, combo, skor
  ui.js               render komponen, popup, hearts, progress
  audio.js            satu AudioContext, BGM + SFX
  mascot.js           state maskot

data/
  juz.json  surah-meta.json  quran/*.json
```

Aturan teknis:
- Tidak ada framework, tetap static HTML/CSS/JS.
- Satu modul audio saja (sekarang `beep()` diduplikasi di 4 file).
- Tidak ada `sort(()=>Math.random())` saat render ulang — urutan diacak sekali per soal.
- Semua state sesi di memori, semua progres di `localStorage` dengan satu skema.

---

## 8. Fase kerja

### Fase 0 — Data (fondasi)
- Kumpulkan peta Juz → Surah → Ayat.
- Unduh & simpan `quran/*.json` (teks + terjemahan).
- Validasi: 114 surah, jumlah ayat cocok dengan metadata.
- Output: game bisa main offline.

### Fase 1 — Design system + shell
- `tokens.css`, `base.css`, `components.css`.
- `AppHeader` dua varian, tombol, kartu, pill, tile.
- Halaman contoh untuk cek visual di 360/390/412px.

### Fase 2 — Alur onboarding
- `login.html` baru.
- `onboarding.html` (nama, warna, topi).
- `juz.html` grid 30 Juz.

### Fase 3 — Alur latihan
- `surah.html` (mode + level + daftar surah).
- `play.html` mode Susun Ayat.
- `result.html`.
- Hati, combo, skor, progress.

### Fase 4 — Mode Susun Arti
- Data terjemahan.
- Logika pemecahan arti per kata.
- Level 1 bayangan.

### Fase 5 — Migrasi game lain
- `nabi.html`, `rukun.html`, `hadis.html`, `diriku.html` masuk shell baru.
- Perbaiki bug lama: nama nabi huruf duplikat, validasi hadis, progress bar hadis, hijab avatar.
- Tambah kartu Hadis yang hilang di menu.

### Fase 6 — Polish & deploy
- Maskot, audio, animasi.
- Aksesibilitas: `aria-live`, fokus, kontras.
- QA mobile 360/390/412 + desktop.
- Deploy ke GitHub Pages, verifikasi live.

---

## 9. QA checklist

- [ ] Alur penuh: login → onboarding → juz → surah → mode → level → latihan → hasil.
- [ ] Tidak ada scroll horizontal di 360px.
- [ ] Semua tombol ≥44px.
- [ ] Teks Arab tidak terpotong, RTL benar.
- [ ] Nyawa berkurang tepat 1 per salah.
- [ ] Hati habis memunculkan layar gagal.
- [ ] Combo naik dan reset benar.
- [ ] Level 2 tetap terkunci sebelum Level 1 selesai.
- [ ] Progress Juz bertambah dan tersimpan setelah reload.
- [ ] Poin tidak bertambah saat mengulang level.
- [ ] Mode Susun Arti menampilkan terjemahan yang benar.
- [ ] Offline: game tetap jalan tanpa internet.
- [ ] Semua halaman lolos `node --check`.
- [ ] Live GitHub Pages sama dengan lokal.

---

## 10. Keputusan yang perlu diambil sebelum mulai

1. **Login**: tetap lokal (profil perangkat) atau pindah ke akun online? Rekomendasi: tetap lokal, label jelas.
2. **Bot dan Diriku**: digabung jadi satu karakter, atau bot untuk game dan Diriku untuk toko? Rekomendasi: digabung, satu karakter dipakai di semua layar.
3. **Juz**: semua terbuka seperti referensi, atau bertahap (Juz 30 dulu)?
4. **Audio**: pakai CDN qari (butuh internet) atau tanpa audio dulu?
5. **Cakupan data**: 30 Juz penuh (±6.236 ayat) atau mulai Juz 30 saja (±564 ayat) supaya cepat selesai dan teruji?
6. **Nasib halaman lama**: hapus `index-v2.html` dan `surat.html`, atau simpan sebagai arsip?

Rekomendasi saya: Juz 30 dulu (Fase 0–3), lalu perluas ke 30 Juz setelah alur terbukti.
