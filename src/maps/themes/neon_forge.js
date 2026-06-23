/**
 * Map Theme: Neon Forge
 * Used for: Stage 11–15+
 *
 * Visual layers (back to front):
 *  1. Dark industrial base
 *  2. Amber vignette at edges
 *  3. Metal plate tile pattern with bolts
 *  4. Structural pillars & beams
 *  5. Heavy industrial floor grid
 *  6. Amber glowing arena border
 *  7. Corner gear/rivet ornaments
 *  8. Center forge platform circle
 */

export const theme = 'neon_forge';

export function draw(scene, mapBounds) {
  const W = mapBounds.width;
  const H = mapBounds.height;
  const cx = W / 2;
  const cy = H / 2;

  // ── 1. Base Background ──────────────────────────────────────────
  const bg = scene.add.graphics();
  bg.fillStyle(0x0c0905, 1);
  bg.fillRect(0, 0, W, H);

  // ── 2. Vignette (amber tint at edges) ───────────────────────────
  const vig = scene.add.graphics();
  vig.fillGradientStyle(0x1a0a00, 0x1a0a00, 0x000000, 0x000000, 0.65, 0.65, 0, 0);
  vig.fillRect(0, 0, W, 380);
  vig.fillGradientStyle(0x000000, 0x000000, 0x1a0a00, 0x1a0a00, 0, 0, 0.65, 0.65);
  vig.fillRect(0, H - 380, W, 380);
  vig.fillGradientStyle(0x1a0a00, 0x000000, 0x1a0a00, 0x000000, 0.55, 0, 0.55, 0);
  vig.fillRect(0, 0, 380, H);
  vig.fillGradientStyle(0x000000, 0x1a0a00, 0x000000, 0x1a0a00, 0, 0.55, 0, 0.55);
  vig.fillRect(W - 380, 0, 380, H);

  // ── 3. Metal Plate Tiles ────────────────────────────────────────
  const plateG = scene.add.graphics();
  const plateW = 200;
  const plateH = 150;

  for (let py = 0; py < H; py += plateH) {
    for (let px = 0; px < W; px += plateW) {
      const alt = (Math.floor(px / plateW) + Math.floor(py / plateH)) % 2;
      plateG.fillStyle(alt === 0 ? 0x100d08 : 0x130f09, 1);
      plateG.fillRect(px, py, plateW, plateH);
      // Plate seam
      plateG.lineStyle(1, 0x2a1a08, 0.55);
      plateG.strokeRect(px + 1, py + 1, plateW - 2, plateH - 2);
    }
  }

  // ── 4a. Rivet dots at plate intersections ───────────────────────
  const boltG = scene.add.graphics();
  for (let py = 0; py <= H; py += plateH) {
    for (let px = 0; px <= W; px += plateW) {
      boltG.fillStyle(0x3d2508, 0.85);
      boltG.fillCircle(px, py, 4.5);
      boltG.fillStyle(0x5a3510, 0.4);
      boltG.fillCircle(px, py, 2);
    }
  }

  // ── 4b. Structural Beams & Pillars ──────────────────────────────
  const beamG = scene.add.graphics();

  // Top & bottom horizontal beams
  beamG.fillStyle(0x1a1208, 1);
  beamG.fillRect(0, 0, W, 52);
  beamG.fillRect(0, H - 52, W, 52);

  // Beam bottom/top edge glow
  beamG.lineStyle(2, 0xff8c00, 0.38);
  beamG.beginPath();
  beamG.moveTo(0, 52);
  beamG.lineTo(W, 52);
  beamG.strokePath();
  beamG.beginPath();
  beamG.moveTo(0, H - 52);
  beamG.lineTo(W, H - 52);
  beamG.strokePath();

  // Beam rivets
  for (let x = 28; x < W; x += 82) {
    boltG.fillStyle(0x5a3510, 0.9);
    boltG.fillCircle(x, 26, 5.5);
    boltG.fillCircle(x, H - 26, 5.5);
    boltG.fillStyle(0x8a5520, 0.4);
    boltG.fillCircle(x, 26, 2.5);
    boltG.fillCircle(x, H - 26, 2.5);
  }

  // Left & right vertical pillars
  beamG.fillStyle(0x1a1208, 1);
  beamG.fillRect(0, 0, 52, H);
  beamG.fillRect(W - 52, 0, 52, H);

  // Pillar inner edge glow
  beamG.lineStyle(2, 0xff8c00, 0.32);
  beamG.beginPath();
  beamG.moveTo(52, 0);
  beamG.lineTo(52, H);
  beamG.strokePath();
  beamG.beginPath();
  beamG.moveTo(W - 52, 0);
  beamG.lineTo(W - 52, H);
  beamG.strokePath();

  // Pillar rivets
  for (let y = 28; y < H; y += 82) {
    boltG.fillStyle(0x5a3510, 0.9);
    boltG.fillCircle(26, y, 5.5);
    boltG.fillCircle(W - 26, y, 5.5);
    boltG.fillStyle(0x8a5520, 0.4);
    boltG.fillCircle(26, y, 2.5);
    boltG.fillCircle(W - 26, y, 2.5);
  }

  // ── 5. Heavy Industrial Floor Grid ──────────────────────────────
  const gridG = scene.add.graphics();
  const bm = 252;
  const majorStep = 100;
  const minorStep = 50;

  // Major grid (heavier lines)
  gridG.lineStyle(2, 0x2a1a08, 0.65);
  for (let x = bm; x <= W - bm; x += majorStep) {
    gridG.beginPath();
    gridG.moveTo(x, bm);
    gridG.lineTo(x, H - bm);
    gridG.strokePath();
  }
  for (let y = bm; y <= H - bm; y += majorStep) {
    gridG.beginPath();
    gridG.moveTo(bm, y);
    gridG.lineTo(W - bm, y);
    gridG.strokePath();
  }

  // Minor grid (thinner lines)
  gridG.lineStyle(1, 0x1e1208, 0.4);
  for (let x = bm + minorStep; x <= W - bm; x += majorStep) {
    gridG.beginPath();
    gridG.moveTo(x, bm);
    gridG.lineTo(x, H - bm);
    gridG.strokePath();
  }
  for (let y = bm + minorStep; y <= H - bm; y += majorStep) {
    gridG.beginPath();
    gridG.moveTo(bm, y);
    gridG.lineTo(W - bm, y);
    gridG.strokePath();
  }

  // ── 6. Arena Border (amber/orange glow) ─────────────────────────
  const borderG = scene.add.graphics();

  // Outer soft glow
  borderG.lineStyle(14, 0xff8c00, 0.1);
  borderG.strokeRect(bm - 7, bm - 7, W - (bm - 7) * 2, H - (bm - 7) * 2);
  // Outer solid border
  borderG.lineStyle(3, 0xff8c00, 0.52);
  borderG.strokeRect(bm, bm, W - bm * 2, H - bm * 2);
  // Inner fine border
  borderG.lineStyle(1, 0xffa500, 0.38);
  borderG.strokeRect(bm + 13, bm + 13, W - (bm + 13) * 2, H - (bm + 13) * 2);

  // ── 7. Corner Rivet/Gear Ornaments ──────────────────────────────
  const cornG = scene.add.graphics();
  const cLen = 42;
  const corners = [
    { x: bm,     y: bm,     dx:  1, dy:  1 },
    { x: W - bm, y: bm,     dx: -1, dy:  1 },
    { x: bm,     y: H - bm, dx:  1, dy: -1 },
    { x: W - bm, y: H - bm, dx: -1, dy: -1 },
  ];

  cornG.lineStyle(3, 0xff8c00, 0.95);
  corners.forEach(({ x, y, dx, dy }) => {
    // L-bracket arms
    cornG.beginPath();
    cornG.moveTo(x, y);
    cornG.lineTo(x + dx * cLen, y);
    cornG.strokePath();
    cornG.beginPath();
    cornG.moveTo(x, y);
    cornG.lineTo(x, y + dy * cLen);
    cornG.strokePath();
    // Main corner rivet
    cornG.fillStyle(0xff8c00, 1);
    cornG.fillCircle(x, y, 5.5);
    cornG.fillStyle(0xffa500, 0.5);
    cornG.fillCircle(x, y, 2.5);
    // Mid-arm rivets
    cornG.fillStyle(0xff8c00, 0.65);
    cornG.fillCircle(x + dx * (cLen / 2), y, 3);
    cornG.fillCircle(x, y + dy * (cLen / 2), 3);
  });

  // ── 8. Center Forge Platform ────────────────────────────────────
  const forgeG = scene.add.graphics();

  forgeG.lineStyle(1, 0xff8c00, 0.07);
  forgeG.strokeCircle(cx, cy, 178);
  forgeG.lineStyle(1, 0xff8c00, 0.14);
  forgeG.strokeCircle(cx, cy, 120);
  forgeG.lineStyle(2, 0xff8c00, 0.28);
  forgeG.strokeCircle(cx, cy, 74);

  forgeG.fillStyle(0x3d1800, 0.12);
  forgeG.fillCircle(cx, cy, 74);

  // Crosshair
  forgeG.lineStyle(1, 0xff8c00, 0.16);
  forgeG.beginPath();
  forgeG.moveTo(cx - 178, cy);
  forgeG.lineTo(cx + 178, cy);
  forgeG.strokePath();
  forgeG.beginPath();
  forgeG.moveTo(cx, cy - 178);
  forgeG.lineTo(cx, cy + 178);
  forgeG.strokePath();

  // Center forge dot
  forgeG.fillStyle(0xff8c00, 0.65);
  forgeG.fillCircle(cx, cy, 7);
}
