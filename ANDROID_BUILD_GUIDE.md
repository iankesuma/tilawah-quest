# Tilawah Quest — Android Build & Release Guide

Proyek Android native mandiri Tilawah Quest sudah berhasil diinisialisasi menggunakan **Capacitor 8** di direktori:
`C:\Users\Evaluation Software\Desktop\tilawah-quest\android`

---

## 1. Spesifikasi Android Package
- **App Name**: Tilawah Quest
- **Package ID / App ID**: `com.iankesuma.tilawahquest`
- **Orientation**: Portrait Keras (`android:screenOrientation="portrait"`)
- **Assets Bundled**: 100% Offline (seluruh HTML, CSS, JS, dan 233 file JSON Qur'an berada di `android/app/src/main/assets/public/`)
- **Permissions**:
  - `INTERNET` (untuk streaming murottal qari online)
  - `RECORD_AUDIO` & `MODIFY_AUDIO_SETTINGS` (untuk mode suara tebak ayat)

---

## 2. Cara Build Menjadi File .APK

### Opsi A: Menggunakan Android Studio (Paling Mudah & Disarankan)
1. Buka aplikasi **Android Studio** di laptop/komputer.
2. Pilih **Open**, lalu arahkan ke folder:
   `C:\Users\Evaluation Software\Desktop\tilawah-quest\android`
3. Tunggu Gradle selesai sinkronisasi pertama kali.
4. Klik menu atas: **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
5. Selesai! File APK langsung jadi di:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Opsi B: Build Cepat Lewat Command Line (CLI)
Jika Java JDK & Android SDK sudah terpasang:
```bash
cd "C:\Users\Evaluation Software\Desktop\tilawah-quest\android"
./gradlew assembleDebug
```

---

## 3. Sinkronisasi Otomatis Setiap Ada Perubahan Web
Jika kamu mengedit HTML/CSS/JS di root folder dan ingin memperbarui aset ke Android:
```bash
npm run cap:sync
```
Perintah ini otomatis:
1. Menyalin file web terbaru ke `www/`.
2. Menyinkronkan seluruh aset langsung ke folder Android assets.
