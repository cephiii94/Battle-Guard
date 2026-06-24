# 📱 Battle Guard — Mobile Portrait / Responsive Roadmap

> Dokumen ini adalah panduan teknis untuk membuat Battle Guard **bisa dimainkan dengan nyaman di layar HP vertikal (portrait)**.
> Dibuat berdasarkan audit penuh seluruh codebase pada 2026-06-24.

---

## 🔎 Ringkasan Audit

| File | Responsive Saat Ini | Kesulitan | Prioritas |
|------|---|---|---|
| `SkillHud.js` | ❌ Tidak | 🟡 Sedang | 🔴 Kritis |
| `inventory.css` | ❌ Tidak | 🟡 Sedang | 🔴 Kritis |
| `hero.css` | ❌ Tidak | 🟡 Sedang | 🔴 Kritis |
| `MainMenuScene.js` | ❌ Tidak | 🔴 Sulit | 🔴 Kritis |
| `stage-result.css` | ❌ Tidak | 🟢 Mudah | 🟠 Tinggi |
| `settings.css` | ❌ Tidak | 🟢 Mudah | 🟠 Tinggi |
| `pause.css` | ❌ Tidak | 🟢 Mudah | 🟠 Tinggi |
| `StatsPanel.js` | ❌ Tidak | 🟡 Sedang | 🟠 Tinggi |
| `blacksmith.css` | ✅ Parsial | 🟡 Sedang | 🟡 Sedang |
| `skills.css` | ✅ Parsial | 🟡 Sedang | 🟡 Sedang |
| `stage-selection.css` | ✅ Parsial | 🟢 Mudah | 🟡 Sedang |
| `mode-selection.css` | ✅ Parsial | 🟢 Mudah | 🟡 Sedang |
| `TitleScreen.js` | ✅ Parsial | 🟢 Mudah | 🟢 Rendah |
| `shop.css` | ✅ Parsial | 🟢 Mudah | 🟢 Rendah |
| `PauseOverlay.js` | ✅ Delegate CSS | 🟢 Mudah | 🟢 Rendah |
| `StageResultOverlay.js` | ✅ Delegate CSS | 🟢 Mudah | 🟢 Rendah |

---

## 🐛 Bug Kritis yang HARUS Diperbaiki Duluan

Sebelum mulai fase apapun, 7 bug ini wajib diselesaikan karena langsung merusak tampilan di HP:

| # | Bug | File | Baris | Dampak |
|---|-----|------|-------|--------|
| 1 | `x = 1280 - panelW - 10` hardcoded | `SkillHud.js` | 25 | Skill HUD **di luar layar** di semua HP |
| 2 | Tooltip clamp ke `1272` & `710` hardcoded | `SkillHud.js` | 152–153 | Tooltip posisi salah di semua HP |
| 3 | `width: 900px; height: 600px` | `inventory.css` | 23–24 | Inventory tidak bisa dilihat di HP |
| 4 | `width: 900px; height: 600px` | `hero.css` | 3–4 | Panel Hero tidak bisa dilihat di HP |
| 5 | `width: 560px` | `stage-result.css` | 19 | Layar hasil stage overflow di HP |
| 6 | Tombol samping `lx=60` / `rx=width-60` | `MainMenuScene.js` | 275–296 | Tombol bertumpuk di portrait |
| 7 | Bottom UI di `width-180` | `MainMenuScene.js` | 351 | Tombol PLAY tidak center di portrait |

---

## 🗺️ Fase Pengerjaan

---

### FASE 1 — Perbaikan Cepat CSS (Target: 1–2 hari)
> **Tujuan:** Semua panel DOM UI tidak overflow di layar HP. Fix tanpa menulis ulang layout.

#### 1.1 — `SkillHud.js`: Ganti hardcoded `1280` ⚡ (2 baris saja)

**File:** [`src/ui/SkillHud.js`](file:///d:/ME/VSCODE/BattleGuard/src/ui/SkillHud.js)

**Masalah:** Posisi HUD dihitung dari `1280 - panelW - 10` — nilainya negatif di HP semua ukuran.

**Fix:**
```js
// SEBELUM (baris 25):
const x = 1280 - panelW - 10;

// SESUDAH:
const sceneW = this.scene.scale.width;
const x = sceneW - panelW - 10;

// SEBELUM (baris 152–153):
if (tx + tw > 1272) tx = 1272 - tw;
if (ty + th > 710)  ty = anchorY - th - 12;

// SESUDAH:
const sceneW = this.scene.scale.width;
const sceneH = this.scene.scale.height;
if (tx + tw > sceneW - 8) tx = sceneW - 8 - tw;
if (ty + th > sceneH - 8) ty = anchorY - th - 12;
```

---

#### 1.2 — `inventory.css` & `hero.css`: Container responsif

**File:** [`src/ui/dom/inventory.css`](file:///d:/ME/VSCODE/BattleGuard/src/ui/dom/inventory.css), [`hero.css`](file:///d:/ME/VSCODE/BattleGuard/src/ui/dom/hero.css)

**Masalah:** Container fixed `900×600px` — overflow total di HP.

**Fix `inventory.css`:**
```css
/* Ganti ukuran container */
.inv-container {
  width: min(900px, 95vw);
  height: min(600px, 92vh);
}

/* Portrait: susun vertikal */
@media (orientation: portrait), (max-width: 600px) {
  .inv-body { flex-direction: column; overflow-y: auto; }
  .inv-left  { flex: 0 0 auto; width: 100%; padding: 12px; }
  .inv-hero-circle { width: 120px; height: 120px; }
  .inv-hero-circle img { max-width: 100px; max-height: 100px; }
  .inv-detail-panel { height: auto; min-height: 140px; }
}
```

**Fix `hero.css`:**
```css
.hero-container {
  width: min(900px, 95vw);
  height: min(600px, 92vh);
}

@media (orientation: portrait), (max-width: 600px) {
  .hero-body { flex-direction: column; overflow-y: auto; }
  .hero-left  { width: 100%; }
  .hero-avatar-circle { width: min(240px, 40vw); height: min(240px, 40vw); }
  .final-stats-grid { grid-template-columns: 1fr 1fr; }
}
```

---

#### 1.3 — `stage-result.css`, `settings.css`, `pause.css`: `min()` container

**File:** `stage-result.css`, `settings.css`, `pause.css`

**Fix singkat tiap file:**
```css
/* stage-result.css */
.stage-result-container { width: min(560px, 92vw); }
.stage-result-title { font-size: clamp(24px, 8vw, 48px); }
@media (max-width: 500px) {
  .stage-result-columns { grid-template-columns: 1fr; }
  .stage-result-btn { width: 130px; font-size: 13px; }
}

/* settings.css */
.settings-container { width: min(460px, 90vw); }
@media (max-width: 500px) {
  .settings-toggle-btn { width: 80px; font-size: 12px; }
  .settings-scale-btn  { width: 110px; font-size: 10px; }
}

/* pause.css */
.pause-container { width: min(380px, 90vw); }
.pause-btn { width: min(240px, 75vw); }
```

---

#### 1.4 — `stage-selection.css` & `mode-selection.css`: Grid kolom adaptif

**File:** `stage-selection.css`, `mode-selection.css`

```css
/* stage-selection.css */
@media (max-width: 600px) {
  .stage-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
@media (max-width: 380px) {
  .stage-grid { grid-template-columns: 1fr; }
}

/* mode-selection.css */
@media (max-width: 650px) {
  .mode-grid { grid-template-columns: 1fr; gap: 12px; }
  .mode-card { min-height: 180px; }
}
```

---

### FASE 2 — In-Game HUD Responsif (Target: 2–3 hari)
> **Tujuan:** Semua elemen dalam permainan (bukan menu) bisa dilihat dengan benar di portrait.

#### 2.1 — `StatsPanel.js`: Scale factor dari ukuran layar

**File:** [`src/ui/StatsPanel.js`](file:///d:/ME/VSCODE/BattleGuard/src/ui/StatsPanel.js)

**Masalah:** Panel digambar di posisi absolut `(16, 16)` ukuran `240×178px` hardcoded.

**Strategi:**
- Hitung `scaleFactor = Math.min(scene.scale.width / 1280, scene.scale.height / 720, 1.0)`
- Kalikan semua koordinat internal dengan `scaleFactor`
- Di portrait, pindahkan panel ke **bagian bawah layar** agar tidak menutup game area
- Daftarkan `scene.scale.on('resize', () => this.rebuild())` agar panel reposisi otomatis saat rotasi

---

#### 2.2 — `SkillHud.js`: Tata letak portrait

**File:** [`src/ui/SkillHud.js`](file:///d:/ME/VSCODE/BattleGuard/src/ui/SkillHud.js)

**Masalah:** Setelah fix bug kritis, HUD tetap ada di pojok kanan atas — di portrait layar sempit, icon skill bertumpuk.

**Strategi:**
- Di portrait: pindahkan HUD ke **bawah layar, tengah horizontal**
- Susunan: ikon-ikon skill berjajar horizontal di posisi `bottom: 80px, center`
- Slot size turun dari `36px` → `28px` di portrait untuk muat lebih banyak
- Tambahkan listener `scene.scale.on('resize', () => this.rebuild())`

```js
// Deteksi portrait
const isPortrait = scene.scale.height > scene.scale.width;

if (isPortrait) {
  // Tengah-bawah
  x = (sceneW - panelW) / 2;
  y = sceneH - 80;
} else {
  // Kanan-atas (behaviour sekarang, sudah di-fix)
  x = sceneW - panelW - 10;
  y = 10;
}
```

---

#### 2.3 — `StageHud.js`: Verifikasi timer & wave counter di portrait

**File:** [`src/ui/StageHud.js`](file:///d:/ME/VSCODE/BattleGuard/src/ui/StageHud.js)

- Audit posisi timer dan wave counter
- Pastikan tidak bertabrakan dengan StatsPanel di portrait

---

### FASE 3 — Main Menu Portrait Layout (Target: 3–5 hari)
> **Tujuan:** MainMenuScene tampil rapi di layar vertikal HP, bukan hanya "terlihat".

**File:** [`src/scenes/MainMenuScene.js`](file:///d:/ME/VSCODE/BattleGuard/src/scenes/MainMenuScene.js)

Ini adalah perubahan terbesar. MainMenuScene saat ini **sepenuhnya didesain untuk landscape 1280×720**.

#### 3.1 — Deteksi orientasi di awal `create()`

```js
create() {
  const { width, height } = this.scale;
  this.isPortrait = height > width;
  // ...
  this.drawCleanBackground(width, height);
  this.addRedesignedTopBar(width, height);
  this.addCenterHeroArea(width, height);
  this.addSideButtons(width, height);
  this.addBottomUI(width, height);
}
```

#### 3.2 — Top Bar: Compact 1 baris di portrait

**Masalah:** Profile box, badge, gold, gems, settings semua berjajar horizontal — penuh di 720px, overflow di 480px portrait.

**Solusi portrait:**
- Profile (kiri) + Settings (kanan) di row 1
- Gold + Gems di row 2 (atau tersembunyi di dropdown)
- Badge class dihilangkan atau diperkecil

```js
addRedesignedTopBar(width, height) {
  if (this.isPortrait) {
    this.addPortraitTopBar(width);
  } else {
    this.addLandscapeTopBar(width);
  }
}
```

#### 3.3 — Side Buttons: Dari kiri/kanan menjadi baris bawah di portrait

**Masalah:** Tombol SHOP, HERO, INVENTORY di `lx=60` dan SKILLS, SMITH di `rx=width-60` — pada layar 480px wide, jarak antar tombol sangat sempit.

**Solusi portrait:** Pindahkan semua tombol ke baris horizontal di bagian bawah layar (seperti nav bar mobile).

```js
addSideButtons(width, height) {
  if (this.isPortrait) {
    this.addPortraitNavBar(width, height); // horizontal bottom bar
  } else {
    this.addLandscapeSideButtons(width, height); // kiri-kanan seperti sekarang
  }
}
```

Desain Nav Bar Portrait:
```
[ SHOP ] [ HERO ] [ INVENTORY ] [ SKILLS ] [ SMITH ]
         ──────────── bottom bar ────────────
```

#### 3.4 — Center Hero: Diperkecil di portrait

**Masalah:** Hero portrait `280×280px` + plus button di `cx+140` — terlalu besar dan plus button keluar layar di portrait 480px.

**Solusi:**
- Portrait: Hero image `180×180px`, plus button di **bawah** hero bukan di samping
- `heroSize = isPortrait ? 180 : 280`

#### 3.5 — Bottom UI (PLAY, MODE): Centered di portrait

**Masalah:** Seluruh bottom UI di `rx = width - 180` — semua elemen menumpuk di kanan bawah.

**Solusi portrait:**
- PLAY button: lebar penuh `width - 40`, centered
- MODE button: di atas PLAY, sama lebarnya
- Event banner: disembunyikan atau dipindah ke bawah hero

```js
addBottomUI(width, height) {
  if (this.isPortrait) {
    const btnW = width - 40;
    const cx   = width / 2;
    // PLAY button full-width
    // MODE button di atas PLAY
  } else {
    // Layout landscape seperti sekarang
  }
}
```

#### 3.6 — Daftar semua posisi yang perlu `isPortrait` conditional

| Fungsi | Nilai Lama | Nilai Portrait |
|--------|-----------|----------------|
| `addRedesignedTopBar` | `width - 250` (gold) | `width * 0.6` |
| `addRedesignedTopBar` | `width - 150` (gems) | `width * 0.8` |
| `addSideButtons` | `lx = 60`, `rx = width-60` | Bottom nav bar |
| `addCenterHeroArea` | hero `280px`, plus `cx+140` | hero `180px`, plus bawah hero |
| `addBottomUI` | `rx = width - 180` | `cx = width/2` |
| `addBottomUI` | `passX = 140` | `passX = width * 0.15` |

---

### FASE 4 — Blacksmith & Skills Panel Portrait (Target: 1–2 hari)
> **Tujuan:** Panel yang paling kompleks agar bisa dipakai di HP.

#### 4.1 — `blacksmith.css`: 3-panel → 1-panel scroll di portrait

```css
@media (orientation: portrait), (max-width: 700px) {
  .blacksmith-content {
    flex-direction: column;
    overflow-y: auto;
  }
  .blacksmith-panel.left,
  .blacksmith-panel.right {
    width: 100%;
    flex-shrink: 1;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .forge-rings  { width: 200px; height: 200px; }
  .forge-action { width: 90%; }
}
```

#### 4.2 — `skills.css`: Sembunyikan side panel, ganti dengan tab di portrait

```css
@media (orientation: portrait), (max-width: 700px) {
  .skills-content {
    flex-direction: column;
    overflow-y: auto;
  }
  .skills-cumulative-panel {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border);
  }
  .road-nodes { max-width: 100%; }
}
```

---

### FASE 5 — TitleScreen & Touch Controls (Target: 1–2 hari)

#### 5.1 — `TitleScreen.js`: Font & input responsif

**File:** [`src/scenes/TitleScreen.js`](file:///d:/ME/VSCODE/BattleGuard/src/scenes/TitleScreen.js)

```js
// Font size dinamis
const titleSize = Math.floor(Math.min(80, width * 0.14));
// Input width dinamis
inputEl.style.width = Math.min(300, width * 0.75) + 'px';
// Confirm button dinamis
const btnW = Math.min(160, width * 0.4);
```

#### 5.2 — Touch Controls Ingame (Opsional / Bonus)

Untuk pengalaman yang benar-benar mobile-first, pertimbangkan:

- **Virtual Joystick:** Phaser memiliki plugin `rex-virtual-joystick` — tambahkan joystick di kiri bawah untuk menggerakkan hero di portrait
- Atau **Tap-to-Move:** Hero bergerak ke posisi tap terakhir player

---

## ✅ Checklist Implementasi

### Fase 1 — CSS Cepat
- [x] **1.1** Fix `SkillHud.js` — ganti hardcoded `1280` dan `710`
- [x] **1.2** Fix `inventory.css` — container `min()` + portrait stack
- [x] **1.2** Fix `hero.css` — container `min()` + portrait stack
- [x] **1.3** Fix `stage-result.css` — container `min()` + grid 1-col
- [x] **1.3** Fix `settings.css` — container `min(460px, 90vw)`
- [x] **1.3** Fix `pause.css` — container `min(380px, 90vw)`
- [x] **1.4** Fix `stage-selection.css` — grid 2→1 col di portrait
- [x] **1.4** Fix `mode-selection.css` — grid 3→1 col di portrait

### Fase 2 — In-Game HUD
- [x] **2.1** `StatsPanel.js` — scale factor + portrait reposition
- [x] **2.2** `SkillHud.js` — portrait layout (bottom center)
- [x] **2.3** `StageHud.js` — audit & fix posisi

### Fase 3 — Main Menu Portrait
- [x] **3.1** Deteksi `isPortrait` di `create()`
- [x] **3.2** Top bar portrait compact
- [x] **3.3** Side buttons → bottom nav bar di portrait
- [x] **3.4** Hero area diperkecil di portrait
- [x] **3.5** Bottom UI PLAY/MODE centered di portrait

### Fase 4 — Panel Kompleks
- [x] **4.1** `blacksmith.css` — column layout portrait
- [x] **4.2** `skills.css` — column layout portrait

### Fase 5 — Polish
- [x] **5.1** `TitleScreen.js` — font & input dinamis
- [x] **5.2** Virtual joystick (opsional)

---

## 📐 Panduan Ukuran Layar Target

| Kategori | Resolusi | Contoh HP |
|----------|----------|-----------|
| Portrait Kecil | 360×780 | Samsung A-series |
| Portrait Sedang | 390×844 | iPhone 14 |
| Portrait Besar | 430×932 | iPhone 14 Plus |
| Landscape HP | 844×390 | HP landscape |
| Tablet Portrait | 768×1024 | iPad mini |

> **Rekomendasi:** Test di resolusi `390×844` sebagai ukuran baseline utama.

---

## 🛠️ Cara Test Portrait di Browser

```
1. Buka Chrome DevTools (F12)
2. Klik ikon "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Pilih "iPhone 14" atau atur manual 390×844
4. Refresh halaman
5. Test semua panel: Inventory, Hero, Skills, Blacksmith, Settings, Stage Result, Pause
```

---

*Roadmap dibuat: 2026-06-24 | Berdasarkan audit penuh 16 file*
