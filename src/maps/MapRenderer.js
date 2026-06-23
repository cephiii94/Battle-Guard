/**
 * MapRenderer — Auto-discovery registry via Vite import.meta.glob
 *
 * HOW TO ADD A NEW MAP:
 *   1. Create a new file: src/maps/themes/your_theme_name.js
 *   2. Export:
 *        export const theme = 'your_theme_name';
 *        export function draw(scene, mapBounds) { ... }
 *   3. That's it. This file does NOT need to be modified.
 */

// Eagerly import all theme files in the themes/ directory
const modules = import.meta.glob('./themes/*.js', { eager: true });

/** @type {Record<string, (scene: Phaser.Scene, mapBounds: object) => void>} */
const registry = {};

for (const mod of Object.values(modules)) {
  if (mod.theme && typeof mod.draw === 'function') {
    registry[mod.theme] = mod.draw;
  }
}

/**
 * Renders the map background for the given theme.
 * Falls back to 'cyberpunk_city' if the theme key is not registered.
 *
 * @param {Phaser.Scene} scene
 * @param {{ x: number, y: number, width: number, height: number }} mapBounds
 * @param {string} theme
 */
export function renderMap(scene, mapBounds, theme) {
  const draw = registry[theme] ?? registry['cyberpunk_city'];

  if (draw) {
    draw(scene, mapBounds);
  } else {
    // Ultimate fallback: plain dark background
    const g = scene.add.graphics();
    g.fillStyle(0x08111f, 1);
    g.fillRect(0, 0, mapBounds.width, mapBounds.height);
  }
}

/**
 * Returns all registered theme keys (useful for debugging / map selection UI).
 * @returns {string[]}
 */
export function getRegisteredThemes() {
  return Object.keys(registry);
}
