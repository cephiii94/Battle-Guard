/**
 * Map Theme: Cyberpunk City
 * Used for: Stage 1–5
 *
 * Visual layers (back to front):
 *  1. Dark navy background
 *  2. Vignette (edges darken)
 *  3. Neon city road strips
 *  4. Building clusters with glowing windows
 *  5. Subtle arena floor grid
 *  6. Double arena border (cyan glow)
 *  7. L-bracket corner ornaments
 *  8. Center spawn circle
 */

export const theme = 'cyberpunk_city';

export function draw(scene, mapBounds) {
  const W = mapBounds.width;   // 2000
  const H = mapBounds.height;  // 1400
  const cx = W / 2;
  const cy = H / 2;

  // ── 1. Base Background ──────────────────────────────────────────
  const bg = scene.add.graphics();
  bg.fillStyle(0x060e1a, 1);
  bg.fillRect(0, 0, W, H);

  // ── 2. Vignette (edges fade to black) ───────────────────────────
  const vig = scene.add.graphics();
  // Top
  vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.65, 0.65, 0, 0);
  vig.fillRect(0, 0, W, 360);
  // Bottom
  vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.65, 0.65);
  vig.fillRect(0, H - 360, W, 360);
  // Left
  vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.55, 0, 0.55, 0);
  vig.fillRect(0, 0, 360, H);
  // Right
  vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.55, 0, 0.55);
  vig.fillRect(W - 360, 0, 360, H);

  // ── 3. City Road Strips ─────────────────────────────────────────
  const roadG = scene.add.graphics();
  roadG.fillStyle(0x0a1d2e, 1);
  roadG.fillRect(0, 185, W, 85);      // top horizontal road
  roadG.fillRect(0, H - 270, W, 85);  // bottom horizontal road
  roadG.fillRect(185, 0, 85, H);      // left vertical road
  roadG.fillRect(W - 270, 0, 85, H);  // right vertical road

  // Road center dashed glow lines
  const dashG = scene.add.graphics();
  for (let x = 0; x < W; x += 32) {
    dashG.fillStyle(0x00d4f0, 0.2);
    dashG.fillRect(x, 224, 18, 3);
    dashG.fillRect(x, H - 228, 18, 3);
  }
  for (let y = 0; y < H; y += 32) {
    dashG.fillStyle(0x00d4f0, 0.2);
    dashG.fillRect(224, y, 3, 18);
    dashG.fillRect(W - 228, y, 3, 18);
  }

  // ── 4. Buildings ────────────────────────────────────────────────
  _drawBuildings(scene, W, H);

  // ── 5. Arena Floor Grid ─────────────────────────────────────────
  const gridG = scene.add.graphics();
  const gridStep = 80;
  const ax1 = 285, ay1 = 285;
  const ax2 = W - 285, ay2 = H - 285;

  gridG.lineStyle(1, 0x0d2640, 0.5);
  for (let x = ax1; x <= ax2; x += gridStep) {
    gridG.beginPath();
    gridG.moveTo(x, ay1);
    gridG.lineTo(x, ay2);
    gridG.strokePath();
  }
  for (let y = ay1; y <= ay2; y += gridStep) {
    gridG.beginPath();
    gridG.moveTo(ax1, y);
    gridG.lineTo(ax2, y);
    gridG.strokePath();
  }

  // ── 6. Arena Border (double neon cyan) ──────────────────────────
  const borderG = scene.add.graphics();
  const bm = 252; // arena margin

  // Outer soft glow
  borderG.lineStyle(10, 0x00bcd4, 0.12);
  borderG.strokeRect(bm - 8, bm - 8, W - (bm - 8) * 2, H - (bm - 8) * 2);
  // Outer solid border
  borderG.lineStyle(2, 0x00bcd4, 0.45);
  borderG.strokeRect(bm, bm, W - bm * 2, H - bm * 2);
  // Inner fine border
  borderG.lineStyle(1, 0x00e5ff, 0.65);
  borderG.strokeRect(bm + 13, bm + 13, W - (bm + 13) * 2, H - (bm + 13) * 2);

  // ── 7. Corner L-Bracket Ornaments ───────────────────────────────
  const cornG = scene.add.graphics();
  cornG.lineStyle(2, 0x00e5ff, 0.95);
  const cLen = 38;

  const corners = [
    { x: bm, y: bm,     dx:  1, dy:  1 },
    { x: W - bm, y: bm,     dx: -1, dy:  1 },
    { x: bm, y: H - bm, dx:  1, dy: -1 },
    { x: W - bm, y: H - bm, dx: -1, dy: -1 },
  ];

  corners.forEach(({ x, y, dx, dy }) => {
    // Horizontal arm
    cornG.beginPath();
    cornG.moveTo(x, y);
    cornG.lineTo(x + dx * cLen, y);
    cornG.strokePath();
    // Vertical arm
    cornG.beginPath();
    cornG.moveTo(x, y);
    cornG.lineTo(x, y + dy * cLen);
    cornG.strokePath();
    // Corner dot
    cornG.fillStyle(0x00e5ff, 1);
    cornG.fillCircle(x, y, 3.5);
    // Mid-arm tick
    cornG.fillStyle(0x00e5ff, 0.5);
    cornG.fillRect(x + dx * (cLen / 2) - 1, y - 3, 2, 6);
    cornG.fillRect(x - 3, y + dy * (cLen / 2) - 1, 6, 2);
  });

  // ── 8. Center Spawn Circle ──────────────────────────────────────
  const spawnG = scene.add.graphics();

  spawnG.lineStyle(1, 0x00e5ff, 0.07);
  spawnG.strokeCircle(cx, cy, 165);
  spawnG.lineStyle(1, 0x00e5ff, 0.13);
  spawnG.strokeCircle(cx, cy, 115);
  spawnG.lineStyle(1, 0x00e5ff, 0.28);
  spawnG.strokeCircle(cx, cy, 72);

  spawnG.fillStyle(0x00e5ff, 0.06);
  spawnG.fillCircle(cx, cy, 72);

  // Crosshair lines
  spawnG.lineStyle(1, 0x00e5ff, 0.14);
  spawnG.beginPath();
  spawnG.moveTo(cx - 165, cy);
  spawnG.lineTo(cx + 165, cy);
  spawnG.strokePath();
  spawnG.beginPath();
  spawnG.moveTo(cx, cy - 165);
  spawnG.lineTo(cx, cy + 165);
  spawnG.strokePath();

  // Center dot
  spawnG.fillStyle(0x00e5ff, 0.55);
  spawnG.fillCircle(cx, cy, 6);
}

// ────────────────────────────────────────────────────────────────────
// Private helper: draw city building clusters
// ────────────────────────────────────────────────────────────────────
function _drawBuildings(scene, W, H) {
  const bG = scene.add.graphics();

  // [x, y, width, height]
  const buildings = [
    // Top-left cluster
    [10,  10, 115, 172], [135, 10,  58, 140], [202, 10,  68, 112],
    [10, 195,  78, 108], [98,  162, 88,  88],
    // Top-right cluster
    [W - 125, 10, 115, 172], [W - 193, 10, 58, 132], [W - 270, 10, 68, 112],
    [W - 105, 195, 94, 105], [W - 195, 158, 82, 92],
    // Bottom-left cluster
    [10,  H - 182, 115, 172], [135, H - 152, 58, 142], [202, H - 132, 68, 122],
    [10,  H - 302, 78,  112], [98,  H - 248, 88,  92],
    // Bottom-right cluster
    [W - 125, H - 182, 115, 172], [W - 193, H - 152, 58, 132], [W - 270, H - 132, 68, 122],
    [W - 105, H - 302, 94,  112], [W - 195, H - 248, 82,  92],
    // Top center buildings
    [W / 2 - 225, 10,  78, 148], [W / 2 - 135, 10, 68, 122],
    [W / 2 - 55,  10,  88, 158], [W / 2 + 62,  10, 72, 132],
    [W / 2 + 148, 10,  78, 142],
    // Bottom center buildings
    [W / 2 - 225, H - 168, 78, 158], [W / 2 - 135, H - 142, 68, 132],
    [W / 2 - 55,  H - 178, 88, 168], [W / 2 + 62,  H - 152, 72, 142],
    [W / 2 + 148, H - 162, 78, 152],
    // Left side mid
    [10, H / 2 - 185, 68, 135], [10, H / 2 - 35, 68, 125], [10, H / 2 + 105, 68, 118],
    // Right side mid
    [W - 78, H / 2 - 185, 68, 135], [W - 78, H / 2 - 35, 68, 125], [W - 78, H / 2 + 105, 68, 118],
  ];

  const bodyColors = [0x0a1420, 0x0c1a28, 0x091220, 0x0e1e30, 0x081018, 0x0b1725];

  buildings.forEach((b, i) => {
    const [bx, by, bw, bh] = b;
    const color = bodyColors[i % bodyColors.length];

    // Building body
    bG.fillStyle(color, 1);
    bG.fillRect(bx, by, bw, bh);

    // Building outline
    bG.lineStyle(1, 0x1b3a5c, 0.5);
    bG.strokeRect(bx, by, bw, bh);

    // Rooftop accent
    bG.lineStyle(1, 0x00bcd4, 0.22);
    bG.beginPath();
    bG.moveTo(bx + 3, by + 2);
    bG.lineTo(bx + bw - 3, by + 2);
    bG.strokePath();

    // Windows
    const cols = Math.max(1, Math.floor(bw / 22) - 1);
    const rows = Math.max(1, Math.floor(bh / 28) - 1);
    const cSpacing = bw / (cols + 1);
    const rSpacing = bh / (rows + 1);
    const wW = 8, wH = 10;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = bx + cSpacing * (c + 1) - wW / 2;
        const wy = by + rSpacing * (r + 1) - wH / 2;
        const seed = (i * 19 + r * 11 + c * 7) % 12;

        if (seed < 5) {
          // Warm yellow lit window
          const alpha = 0.4 + (seed % 3) * 0.1;
          bG.fillStyle(seed < 2 ? 0xffd86e : 0xffe8a8, alpha);
          bG.fillRect(wx, wy, wW, wH);
        } else if (seed < 7) {
          // Cool white window
          bG.fillStyle(0xd8f0ff, 0.28);
          bG.fillRect(wx, wy, wW, wH);
        } else if (seed < 9) {
          // Cyan-tinted window
          bG.fillStyle(0x00d4f0, 0.22);
          bG.fillRect(wx, wy, wW, wH);
        }
        // seed 9-11: dark / off
      }
    }
  });
}
