# 🗺️ Battle Guard - Development Roadmap

Dokumen ini berisi peta jalan (Roadmap) pengembangan game **Battle Guard**. Roadmap ini digunakan agar transisi arsitektur, penambahan fitur, dan perbaikan bug tidak tumpang tindih dan mudah dilacak.

---

## 📍 Fase 1: Perombakan Arsitektur (Saat Ini)
Fase ini berfokus pada stabilisasi *engine*, performa, dan pemindahan antarmuka pengguna (UI) yang berat dari Canvas ke HTML/DOM agar jauh lebih *smooth* dan mudah diatur (*styling* menggunakan CSS).

### 1.1 Migrasi UI ke DOM / HTML (Priority: Tinggi)
- [x] **Sistem Dasar**: Membuat `DOMUIManager.js` sebagai *handler* utama.
- [x] **Setup `index.html` & CSS**: Menambahkan `#ui-root` dan sistem gaya visual utama (Glassmorphism, animasi fade).
- [x] **Migrasi Menu Inventory**: Memindahkan UI inventory, status senjata, dan filter ke DOM CSS Grid.
- [x] **Migrasi Menu Hero**: Memindahkan UI layar Hero dan peningkatan level.
- [x] **Migrasi Menu Shop & Skills**: Memindahkan Shop dan Skill Tree ke dalam DOM.
- [x] **Migrasi Menu Stage Selection, Settings, & Mode Selection**: Memindahkan menu Battlefield, Pengaturan, dan Mode Tantangan ke DOM.
- [x] **Pembersihan Canvas UI**: Menghapus file UI lama (`InventoryTab.js` dkk) yang membebani Phaser.

### 1.2 State Management (Priority: Menengah)
- [x] Membuat `GameManager.js` (Sistem data tunggal).
- [x] Memisahkan logika uang (Gold), EXP, dan progres stage keluar dari `scene.registry` agar lebih aman dari *bug sinkronisasi*.

---

## 🚀 Fase 2: Peningkatan Performa & Fitur Skala Besar
Fase ini berfokus pada fitur inti dari pengalaman bermain RPG jangka panjang dan pengurangan waktu *loading*.

### 2.1 Lazy Loading Aset (Priority: Menengah)
- [x] Refactor arsitektur pemuatan aset dengan membuat `PreloadScene.js` untuk aset Main Menu.
- [x] Membuat `LoadingScene` dinamis sebelum berpindah Stage untuk meload aset musuh, bos, dan musik secara spesifik.

### 2.2 Refactoring GameScene (Priority: Menengah)
- [x] **Sistem Pertarungan**: Memisahkan kalkulasi *Damage*, *Critical*, dan *Evasion* ke `CombatSystem.js`.
- [x] **Sistem Loot/Drop**: Memisahkan logika hadiah musuh mati ke `LootSystem.js`.

### 2.3 Sistem Baru dalam Game (Priority: Menengah)
- [ ] Sistem *Equipment* Set (Set Bonus untuk kombinasi armor tertentu).
- [ ] Animasi partikel pertempuran yang lebih mewah menggunakan *Phaser Particles*.
- [ ] Fitur *Idle Reward* (Mendapatkan Gold saat game ditutup/AFK).

---

## 🌍 Fase 3: Rilis & Multi-Platform
Fase akhir sebelum merilis game ke publik.

### 3.1 Monetisasi & Interaksi Sosial (Priority: Rendah)
- [ ] Papan Peringkat (Leaderboards) menggunakan Firebase.
- [ ] Sistem Clan / Guild sederhana.
- [ ] Banner *Gacha* yang menggunakan mata uang *Gems* (Premium).

### 3.2 Porting ke Aplikasi HP (Priority: Rendah)
- [ ] Memasang CapacitorJS / Cordova untuk mengubah game HTML5 menjadi file `.apk` (Android) dan `.ipa` (iOS).
- [ ] Optimasi responsivitas layar untuk berbagai rasio *smartphone*.
- [ ] Pendaftaran ke Google Play Store.

---
*Catatan: Centang kotak `[x]` jika tugas telah selesai dikerjakan.*
