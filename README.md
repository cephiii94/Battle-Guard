# Battle Guard

Battle Guard adalah game browser 2D berbasis Phaser dan Vite. Pemain mengendalikan hero di arena, menghindari monster, mengumpulkan loot, dan memilih upgrade saat naik level.

## Tech Stack

- Vite
- Phaser 3
- JavaScript ES Modules

## Menjalankan Proyek

Pastikan Node.js sudah terpasang, lalu jalankan:

```bash
npm install
npm run dev
```

Setelah server aktif, buka URL lokal yang ditampilkan oleh Vite di terminal.

## Script

```bash
npm run dev
```

Menjalankan development server.

```bash
npm run build
```

Membuat versi production ke folder `dist`.

```bash
npm run preview
```

Menjalankan preview hasil build production.

## Struktur Folder

```text
Battle Guard/
├── index.html
├── package.json
├── package-lock.json
├── src/
│   ├── main.js
│   ├── style.css
│   ├── entities/
│   │   ├── Loot.js
│   │   ├── Monster.js
│   │   ├── Player.js
│   │   └── Projectile.js
│   ├── scenes/
│   │   └── GameScene.js
│   ├── systems/
│   │   ├── CombatSystem.js
│   │   ├── GameStats.js
│   │   ├── LootSystem.js
│   │   ├── SpawnSystem.js
│   │   └── UpgradeSystem.js
│   └── ui/
│       ├── StatsPanel.js
│       └── UpgradePopup.js
└── dist/
```

## Ringkasan Arsitektur

- `src/main.js` membuat konfigurasi Phaser, mengatur ukuran game, scaling, physics, dan scene.
- `src/scenes/GameScene.js` menjadi pusat gameplay: membuat arena, player, kamera, sistem combat, spawn, loot, stats, dan upgrade.
- `src/entities` berisi objek game utama seperti player, monster, projectile, dan loot.
- `src/systems` memisahkan logika gameplay seperti combat, spawn monster, drop loot, statistik, dan pilihan upgrade.
- `src/ui` berisi tampilan HUD dan popup pilihan upgrade.

## Kontrol

- Gerak: `W`, `A`, `S`, `D` atau tombol panah.
- Upgrade: klik salah satu pilihan saat popup level up muncul.

## Catatan Development

Folder `dist` adalah hasil build dan tidak perlu diedit langsung. Perubahan gameplay utama biasanya dilakukan di `src/entities`, `src/systems`, atau `src/scenes/GameScene.js`.
