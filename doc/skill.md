# Dokumentasi Lengkap Skill BattleGuard

Dokumen ini menjelaskan seluruh data skill aktif dan pasif, termasuk cooldown, damage, jangkauan (range), area efek (AoE), jumlah target, serta pertumbuhannya dari level 1 hingga level 6 (Ultimate). Data bersumber langsung dari berkas [skills.js](file:///d:/ME/VSCODE/BattleGuard/src/data/skills.js).

---

## ⚔️ Active Skills (Skill Aktif)

Setiap kenaikan level pada skill aktif meningkatkan atribut dasarnya dengan formula pertumbuhan berikut:
* **Cooldown**: Berkurang $60\text{ ms}$ per level (Batas minimum: $550\text{ ms}$).
* **Damage**: Bertambah $+12\%$ dari base damage per level.
* **Range (Jangkauan)**: Bertambah $+8\text{ px}$ per level (Kecuali skill tertentu yang jangkauannya mengikuti status hero).
* **Area (Radius AoE)**: Bertambah $+6\text{ px}$ per level (Kecuali skill per target).

### 🔥 Level 6: Status Ultimate (Enchant)
Ketika skill aktif mencapai **Level 6**, skill tersebut berubah menjadi status **Ultimate** dengan efek mekanik khusus yang sangat kuat.

---

### 1. Fireball (`fireball`)
* **Deskripsi**: Menembakkan bola api ke enemy terdekat dan memberikan efek burn (damage berkala).
* **Syarat Level Player**: Level 1
* **Prasyarat**: Tidak ada
* **Mekanik Efek Burn**:
  * Damage berkala diterapkan setiap 1 detik selama 3 detik.
  * Level 1: $2\text{ DMG/detik}$
  * Pertumbuhan: $+2\text{ DMG/detik}$ per level (Level 6: $12\text{ DMG/detik}$).
* **✨ Efek Ultimate (Level 6)**:
  * **Fire Mark**: Ketika musuh mati dalam keadaan terbakar (*burning*), ia meninggalkan area api (*Fire Mark*) di tanah selama 5 detik dengan radius $65\text{ px}$.
  * Setiap musuh yang melintasi area ini akan menerima $12\text{ DMG}$ per detik dan terkena efek burn sekunder sebesar $6\text{ DMG/detik}$ selama 3 detik.

| Level | Cooldown | Damage | Range | Area (AoE) | Burn DMG / Detik | Efek Khusus |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Lvl 1** | 2200 ms | 28 | 360 px | 0 px | 2 DMG/s | Standar |
| **Lvl 2** | 2140 ms | 31 | 368 px | 6 px | 4 DMG/s | Standar |
| **Lvl 3** | 2080 ms | 35 | 376 px | 12 px | 6 DMG/s | Standar |
| **Lvl 4** | 2020 ms | 38 | 384 px | 18 px | 8 DMG/s | Standar |
| **Lvl 5** | 1960 ms | 41 | 392 px | 24 px | 10 DMG/s | Standar |
| **Lvl 6** | 1900 ms | 45 | 400 px | 30 px | 12 DMG/s | **Fire Mark (Corpse Burn)** |

---

### 2. Multiple Attack (`multi-shot`)
* **Deskripsi**: Melakukan serangan ke beberapa target secara bersamaan.
* **Syarat Level Player**: Level 2
* **Prasyarat**: Tidak ada
* **Mekanik Jangkauan & Target**:
  * Jangkauan serangan **tidak bertambah per level**, melainkan sepenuhnya mengikuti status jangkauan hero (`this.player.attackRange`).
  * Level 1: 2 target.
  * Pertumbuhan: $+1$ target per level.
* **✨ Efek Ultimate (Level 6)**:
  * **Ranged (Projectiles)**: Anak panah memantul (*bounce*) antar musuh terdekat. Setiap proyektil memantul maksimal 2 kali (menyerang hingga total 3 musuh berbeda).
  * **Melee (Tebasan)**: Mengubah serangan menjadi tebasan melingkar raksasa 360 derajat di sekeliling hero dengan radius $135\text{ px}$ yang merusak seluruh musuh di dalamnya secara instan.

| Level | Cooldown | Damage | Range (Jangkauan) | Jumlah Target | Efek Khusus |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **Lvl 1** | 2800 ms | 18 | *Mengikuti Status Hero* | 2 Target | Standar |
| **Lvl 2** | 2740 ms | 20 | *Mengikuti Status Hero* | 3 Target | Standar |
| **Lvl 3** | 2680 ms | 22 | *Mengikuti Status Hero* | 4 Target | Standar |
| **Lvl 4** | 2620 ms | 24 | *Mengikuti Status Hero* | 5 Target | Standar |
| **Lvl 5** | 2560 ms | 27 | *Mengikuti Status Hero* | 6 Target | Standar |
| **Lvl 6** | 2500 ms | 29 | *Mengikuti Status Hero* | 7 Target | **Bouncing (Ranged) / 360° Slash (Melee)** |

---

### 3. Lightning Strike (`lightning-strike`)
* **Deskripsi**: Petir instan menyambar beberapa target terdekat.
* **Syarat Level Player**: Level 3
* **Prasyarat**: `fireball`
* **Mekanik Target**:
  * Menyambar musuh secara individual dan langsung.
  * Level 1: 2 target.
  * Pertumbuhan: $+1$ target per level.
* **✨ Efek Ultimate (Level 6)**:
  * **Chain AoE Shock**: Setiap target yang tersambar petir memicu kerusakan area tambahan (*splash damage*) sebesar $50\%$ damage utama kepada musuh lain di sekeliling target tersebut dalam radius $90\text{ px}$.

| Level | Cooldown | Damage | Range (Jangkauan) | Jumlah Target | Area (AoE) | Efek Khusus |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Lvl 1** | 3400 ms | 42 | 430 px | 2 Target | 0 px | Standar |
| **Lvl 2** | 3340 ms | 47 | 438 px | 3 Target | 0 px | Standar |
| **Lvl 3** | 3280 ms | 52 | 446 px | 4 Target | 0 px | Standar |
| **Lvl 4** | 3220 ms | 57 | 454 px | 5 Target | 0 px | Standar |
| **Lvl 5** | 2560 ms | 62 | 462 px | 6 Target | 0 px | Standar |
| **Lvl 6** | 3100 ms | 67 | 470 px | 7 Target | 0 px | **Chain AoE Shockwave** |

---

### 4. Spin Attack (`spin-attack`)
* **Deskripsi**: Serangan area di sekitar hero.
* **Syarat Level Player**: Level 4
* **Prasyarat**: `multi-shot`
* **✨ Efek Ultimate (Level 6)**:
  * **Persistent Cyclone**: Tebasan berputar bertahan di sekeliling hero selama 2 detik.
  * Memberikan tebasan visual terus-menerus dan melakukan damage tick setiap $200\text{ ms}$ (total 10 tick) sebesar $25\%$ damage per tick kepada seluruh musuh yang menyentuhnya.

| Level | Cooldown | Damage | Range | Area (AoE) | Efek Khusus |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **Lvl 1** | 3000 ms | 24 | 0 px | 145 px | Standar |
| **Lvl 2** | 2940 ms | 27 | 8 px | 151 px | Standar |
| **Lvl 3** | 2880 ms | 30 | 16 px | 157 px | Standar |
| **Lvl 4** | 2820 ms | 33 | 24 px | 163 px | Standar |
| **Lvl 5** | 2760 ms | 36 | 32 px | 169 px | Standar |
| **Lvl 6** | 2700 ms | 38 | 40 px | 175 px | **Persistent cyclone spin (2s duration)** |

---

## 🛡️ Passive Skills (Skill Pasif)

Skill pasif memberikan efek peningkatan permanen pada stats hero yang bertumbuh secara linear per level.

### 1. Loot Magnet (`magnet`)
* **Deskripsi**: Meningkatkan jangkauan penarikan loot dan exp.
* **Syarat Level Player**: Level 1
* **Prasyarat**: Tidak ada
* **Mekanik**: $+20\text{ px}$ jangkauan penarikan (range) per level.

| Level | Total Jangkauan (Magnet Range) |
| :---: | :--- |
| **Lvl 1** | 170 px |
| **Lvl 2** | 190 px |
| **Lvl 3** | 210 px |
| **Lvl 4** | 230 px |
| **Lvl 5** | 250 px |

---

### 2. Swiftness (`movespeed`)
* **Deskripsi**: Meningkatkan kecepatan pergerakan hero.
* **Syarat Level Player**: Level 2
* **Prasyarat**: Tidak ada
* **Mekanik**: $+4\%$ Movement Speed per level.

| Level | Tambahan Kecepatan (Speed Bonus) |
| :---: | :--- |
| **Lvl 1** | $+4\%$ |
| **Lvl 2** | $+8\%$ |
| **Lvl 3** | $+12\%$ |
| **Lvl 4** | $+16\%$ |
| **Lvl 5** | $+20\%$ |

---

### 3. Frenzy (`aspd`)
* **Deskripsi**: Meningkatkan kecepatan serangan hero (melee & ranged).
* **Syarat Level Player**: Level 3
* **Prasyarat**: Tidak ada
* **Mekanik**: $+5\%$ Attack Speed per level.

| Level | Tambahan Attack Speed (ASPD Bonus) |
| :---: | :--- |
| **Lvl 1** | $+5\%$ |
| **Lvl 2** | $+10\%$ |
| **Lvl 3** | $+15\%$ |
| **Lvl 4** | $+20\%$ |
| **Lvl 5** | $+25\%$ |

---

### 4. Vitality (`hp-regen`)
* **Deskripsi**: Meningkatkan regen HP hero per detik.
* **Syarat Level Player**: Level 3
* **Prasyarat**: `movespeed`
* **Mekanik**: $+0.5\text{ HP/detik}$ HP Regeneration per level.

| Level | HP Regen Per Detik |
| :---: | :--- |
| **Lvl 1** | $+0.5\text{ HP/s}$ |
| **Lvl 2** | $+1.0\text{ HP/s}$ |
| **Lvl 3** | $+1.5\text{ HP/s}$ |
| **Lvl 4** | $+2.0\text{ HP/s}$ |
| **Lvl 5** | $+2.5\text{ HP/s}$ |

---

### 5. Aegis Shield (`shield`)
* **Deskripsi**: Mendapatkan shield yang menyerap damage dan meregenerasi.
* **Syarat Level Player**: Level 5
* **Prasyarat**: `hp-regen`
* **Mekanik**: $+10$ Kapasitas Shield per level.

| Level | Kapasitas Shield (Shield Capacity) |
| :---: | :--- |
| **Lvl 1** | 10 damage terserap |
| **Lvl 2** | 20 damage terserap |
| **Lvl 3** | 30 damage terserap |
| **Lvl 4** | 40 damage terserap |
| **Lvl 5** | 50 damage terserap |

---

### 6. Eagle Eye (`attack-range`)
* **Deskripsi**: Meningkatkan jarak serangan dasar projectile hero (Khusus Ranged).
* **Syarat Level Player**: Level 4
* **Prasyarat**: `aspd`
* **Mekanik**: $+5\%$ Jangkauan Ranged Attack per level.

| Level | Tambahan Jangkauan Serang (Range Bonus) |
| :---: | :--- |
| **Lvl 1** | $+5\%$ |
| **Lvl 2** | $+10\%$ |
| **Lvl 3** | $+15\%$ |
| **Lvl 4** | $+20\%$ |
| **Lvl 5** | $+25\%$ |

---

### 7. Heavy Impact (`knock`)
* **Deskripsi**: Serangan dasar hero memberikan efek knockback (mendorong mundur) enemy.
* **Syarat Level Player**: Level 4
* **Prasyarat**: `aspd`
* **Mekanik**: $+10\%$ Peluang Knockback per level.

| Level | Peluang Efek Knockback (Knockback Chance) |
| :---: | :--- |
| **Lvl 1** | $10\%$ |
| **Lvl 2** | $20\%$ |
| **Lvl 3** | $30\%$ |
| **Lvl 4** | $40\%$ |
| **Lvl 5** | $50\%$ |
