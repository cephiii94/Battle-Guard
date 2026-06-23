/**
 * Map Theme: Void Wasteland
 * Used for: Stage 6–10
 *
 * Visual layers (back to front):
 *  1. Dark purple base background
 *  2. Purple vignette at edges
 *  3. Ground crack patterns
 *  4. Void energy orbs (corner & edge)
 *  5. Subtle arena floor grid (void texture)
 *  6. Dashed purple/magenta border
 *  7. Corner sigil ornaments
 *  8. Center void portal circle
 */

export const theme = 'void_wasteland';

export function draw(scene, mapBounds) {
  const W = mapBounds.width;
  const H = mapBounds.height;
  const cx = W / 2;
  const cy = H / 2;

  // ── 1. Base Background ──────────────────────────────────────────
  const bg = scene.add.graphics();
  bg.fillStyle(0x080510, 1);
  bg.fillRect(0, 0, W, H);

  // ── 2. Vignette (purple-magenta tint at edges) ──────────────────
  const vig = scene.add.graphics();
  vig.fillGradientStyle(0x180028, 0x180028, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
  vig.fillRect(0, 0, W, 400);
  vig.fillGradientStyle(0x000000, 0x000000, 0x180028, 0x180028, 0, 0, 0.7, 0.7);
  vig.fillRect(0, H - 400, W, 400);
  vig.fillGradientStyle(0x180028, 0x000000, 0x180028, 0x000000, 0.6, 0, 0.6, 0);
  vig.fillRect(0, 0, 400, H);
  vig.fillGradientStyle(0x000000, 0x180028, 0x000000, 0x180028, 0, 0.6, 0, 0.6);
  vig.fillRect(W - 400, 0, 400, H);

  // ── 3. Ground Cracks ────────────────────────────────────────────
  const crackG = scene.add.graphics();

  // Primary cracks (more visible)
  crackG.lineStyle(1, 0x3d0055, 0.65);
  const primaryCracks = [
    [[200, 55], [275, 125], [320, 92], [398, 178]],
    [[595, 32], [658, 102], [698, 62], [778, 142]],
    [[998, 42], [1048, 122], [1098, 78]],
    [[1398, 32], [1478, 112], [1538, 72], [1598, 152]],
    [[1698, 52], [1778, 132], [1838, 98]],
    [[205, H - 52], [272, H - 122], [312, H - 82], [382, H - 168]],
    [[698, H - 32], [758, H - 102], [798, H - 62]],
    [[1048, H - 42], [1098, H - 122], [1148, H - 78]],
    [[1398, H - 32], [1478, H - 112], [1538, H - 72]],
    [[1698, H - 52], [1778, H - 132], [1838, H - 92]],
    [[52, 398], [132, 448], [92, 498], [178, 558]],
    [[52, 698], [132, 758], [98, 798]],
    [[52, 998], [138, 1058], [98, 1098]],
    [[W - 52, 398], [W - 132, 448], [W - 92, 498], [W - 178, 558]],
    [[W - 52, 698], [W - 132, 758], [W - 98, 798]],
    [[W - 52, 998], [W - 138, 1058], [W - 98, 1098]],
    // Center area subtle cracks
    [[795, 598], [858, 648], [838, 698]],
    [[1098, 498], [1148, 558], [1128, 618]],
    [[898, 798], [958, 848], [938, 898]],
    [[1200, 750], [1260, 808], [1240, 860]],
    [[700, 850], [758, 910], [730, 960]],
  ];

  primaryCracks.forEach(points => {
    crackG.beginPath();
    crackG.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      crackG.lineTo(points[i][0], points[i][1]);
    }
    crackG.strokePath();
  });

  // Secondary micro-cracks
  crackG.lineStyle(1, 0x2a0038, 0.4);
  const microCracks = [
    [[248, 82], [288, 112], [308, 96]],
    [[648, 62], [678, 92], [698, 78]],
    [[1298, 72], [1338, 102]],
    [[1748, 82], [1798, 118]],
    [[98, 498], [138, 528]],
    [[W - 98, 598], [W - 138, 635]],
    [[498, H - 82], [538, H - 112]],
    [[1198, H - 72], [1248, H - 102]],
  ];

  microCracks.forEach(points => {
    crackG.beginPath();
    crackG.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      crackG.lineTo(points[i][0], points[i][1]);
    }
    crackG.strokePath();
  });

  // ── 4. Void Energy Orbs ─────────────────────────────────────────
  const orbG = scene.add.graphics();
  const voidOrbs = [
    [148, 98, 48], [W - 148, 98, 38], [148, H - 98, 42], [W - 148, H - 98, 40],
    [cx / 2, cy / 2, 28], [W - cx / 2, cy / 2, 26],
    [cx / 2, H - cy / 2, 30], [W - cx / 2, H - cy / 2, 28],
  ];

  voidOrbs.forEach(([x, y, r]) => {
    orbG.fillStyle(0x3a0055, 0.18);
    orbG.fillCircle(x, y, r);
    orbG.lineStyle(1, 0x8800cc, 0.32);
    orbG.strokeCircle(x, y, r);
    orbG.lineStyle(1, 0x6600aa, 0.22);
    orbG.strokeCircle(x, y, r * 0.58);
    orbG.fillStyle(0xaa00dd, 0.12);
    orbG.fillCircle(x, y, r * 0.58);
  });

  // ── 5. Arena Floor Grid ─────────────────────────────────────────
  const gridG = scene.add.graphics();
  const bm = 252;
  gridG.lineStyle(1, 0x1a0030, 0.5);
  const gridStep = 90;
  for (let x = bm; x <= W - bm; x += gridStep) {
    gridG.beginPath();
    gridG.moveTo(x, bm);
    gridG.lineTo(x, H - bm);
    gridG.strokePath();
  }
  for (let y = bm; y <= H - bm; y += gridStep) {
    gridG.beginPath();
    gridG.moveTo(bm, y);
    gridG.lineTo(W - bm, y);
    gridG.strokePath();
  }

  // ── 6. Arena Border (dashed magenta) ────────────────────────────
  const borderG = scene.add.graphics();
  const bx1 = bm, by1 = bm, bx2 = W - bm, by2 = H - bm;

  // Outer glow
  borderG.lineStyle(12, 0x8800cc, 0.1);
  borderG.strokeRect(bm, bm, W - bm * 2, H - bm * 2);

  // Dashed border
  const dashLen = 22;
  const gapLen  = 12;
  borderG.lineStyle(2, 0xaa00dd, 0.62);

  for (let x = bx1; x < bx2; x += dashLen + gapLen) {
    borderG.beginPath();
    borderG.moveTo(x, by1);
    borderG.lineTo(Math.min(x + dashLen, bx2), by1);
    borderG.strokePath();
    borderG.beginPath();
    borderG.moveTo(x, by2);
    borderG.lineTo(Math.min(x + dashLen, bx2), by2);
    borderG.strokePath();
  }
  for (let y = by1; y < by2; y += dashLen + gapLen) {
    borderG.beginPath();
    borderG.moveTo(bx1, y);
    borderG.lineTo(bx1, Math.min(y + dashLen, by2));
    borderG.strokePath();
    borderG.beginPath();
    borderG.moveTo(bx2, y);
    borderG.lineTo(bx2, Math.min(y + dashLen, by2));
    borderG.strokePath();
  }

  // Inner border
  borderG.lineStyle(1, 0xcc00ff, 0.38);
  borderG.strokeRect(bm + 15, bm + 15, W - (bm + 15) * 2, H - (bm + 15) * 2);

  // ── 7. Corner Sigil Ornaments ────────────────────────────────────
  const cornG = scene.add.graphics();
  const cLen = 36;
  const corners = [
    { x: bm,     y: bm,     dx:  1, dy:  1 },
    { x: W - bm, y: bm,     dx: -1, dy:  1 },
    { x: bm,     y: H - bm, dx:  1, dy: -1 },
    { x: W - bm, y: H - bm, dx: -1, dy: -1 },
  ];

  cornG.lineStyle(2, 0xcc00ff, 0.85);
  corners.forEach(({ x, y, dx, dy }) => {
    cornG.beginPath();
    cornG.moveTo(x, y);
    cornG.lineTo(x + dx * cLen, y);
    cornG.strokePath();
    cornG.beginPath();
    cornG.moveTo(x, y);
    cornG.lineTo(x, y + dy * cLen);
    cornG.strokePath();
    // Diamond rune at corner
    cornG.fillStyle(0xcc00ff, 0.7);
    cornG.fillTriangle(x, y - 7, x - 5, y, x + 5, y);
    cornG.fillTriangle(x, y + 7, x - 5, y, x + 5, y);
  });

  // ── 8. Center Void Portal ───────────────────────────────────────
  const portalG = scene.add.graphics();

  portalG.lineStyle(1, 0xcc00ff, 0.07);
  portalG.strokeCircle(cx, cy, 180);
  portalG.lineStyle(1, 0xcc00ff, 0.13);
  portalG.strokeCircle(cx, cy, 125);
  portalG.lineStyle(2, 0xcc00ff, 0.22);
  portalG.strokeCircle(cx, cy, 75);

  portalG.fillStyle(0x3d0055, 0.12);
  portalG.fillCircle(cx, cy, 75);

  // Crosshair
  portalG.lineStyle(1, 0xcc00ff, 0.14);
  portalG.beginPath();
  portalG.moveTo(cx - 180, cy);
  portalG.lineTo(cx + 180, cy);
  portalG.strokePath();
  portalG.beginPath();
  portalG.moveTo(cx, cy - 180);
  portalG.lineTo(cx, cy + 180);
  portalG.strokePath();

  // Center dot
  portalG.fillStyle(0xcc00ff, 0.6);
  portalG.fillCircle(cx, cy, 6);
}
