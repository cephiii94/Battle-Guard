import Phaser from 'phaser';
import skins from '../data/skins.js';
import { getAvailableHeroes } from '../systems/HeroSelection.js';
import '../ui/dom/preload.css';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Create DOM Loading screen overlay
    this.root = document.getElementById('ui-root');
    if (!this.root) {
      // Fallback if ui-root is not loaded yet
      this.root = document.body;
    }

    this.overlay = document.createElement('div');
    this.overlay.className = 'preload-overlay';
    this.overlay.innerHTML = `
      <div class="preload-container">
        <div class="preload-title">BATTLE GUARD</div>
        <div class="preload-bar-bg">
          <div class="preload-bar-fill" id="preload-fill" style="width: 0%;"></div>
        </div>
        <div class="preload-status" id="preload-status">LOADING CORE DATA... (0%)</div>
      </div>
    `;
    this.root.appendChild(this.overlay);

    const fillBar = this.overlay.querySelector('#preload-fill');
    const statusText = this.overlay.querySelector('#preload-status');

    // Phaser Loader events
    this.load.on('progress', (value) => {
      const pct = Math.floor(value * 100);
      if (fillBar) fillBar.style.width = `${pct}%`;
      if (statusText) statusText.textContent = `LOADING CORE DATA... (${pct}%)`;
    });

    this.load.on('complete', () => {
      if (statusText) statusText.textContent = 'CORE SYSTEM READY!';
      this.time.delayedCall(200, () => {
        // Fade out CSS animation or Phaser tween
        this.overlay.style.transition = 'opacity 0.3s ease-out';
        this.overlay.style.opacity = '0';
        
        this.time.delayedCall(300, () => {
          this.overlay.remove();
          this.scene.start('TitleScreen');
        });
      });
    });

    // 1. Load available heroes (images or SVGs)
    getAvailableHeroes().forEach((hero) => {
      if (hero.assetPath.endsWith('.svg')) {
        this.load.svg(hero.assetKey, hero.assetPath, { width: 160, height: 160 });
        return;
      }
      this.load.image(hero.assetKey, hero.assetPath);
    });

    // 2. Load custom skins assets if they have them
    skins.forEach((skin) => {
      if (skin.assetKey && skin.assetPath) {
        if (skin.assetPath.endsWith('.svg')) {
          this.load.svg(skin.assetKey, skin.assetPath, { width: 160, height: 160 });
        } else {
          this.load.image(skin.assetKey, skin.assetPath);
        }
      }
    });

    // 3. Load UI assets
    this.load.image('ui-settings-dot', '/assets/ui/settings-gear.svg');
    this.load.image('ui-avatar-ring', '/assets/ui/avatar-ring.svg');
    this.load.image('ui-icon-gem', '/assets/ui/icon-gem.svg');
    this.load.image('ui-icon-gold', '/assets/ui/icon-gold.svg');
    this.load.image('ui-currency-bar', '/assets/ui/currency-bar.svg');
    this.load.image('ui-side-button', '/assets/ui/neon-side-button.svg');
    this.load.image('ui-battle-button', '/assets/ui/neon-battle-button.svg');
    this.load.image('ui-purple-button', '/assets/ui/neon-purple-button.svg');
    this.load.image('ui-hex-slot', '/assets/ui/neon-hex-slot.svg');
    this.load.image('ui-hex-active', '/assets/ui/neon-hex-active.svg');
    this.load.image('ui-character-orb', '/assets/ui/neon-character-orb.svg');
    this.load.image('ui-bottom-panel', '/assets/ui/neon-panel-bottom.svg');
    this.load.image('ui-stat-damage', '/assets/ui/icon-damage.svg');
    this.load.image('ui-stat-hp', '/assets/ui/icon-hp.svg');
    this.load.image('ui-stat-aspd', '/assets/ui/icon-aspd.svg');

    // 4. Load Lucide Lock icon dynamically as SVG using Blob URL
    const lockSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
    const blob = new Blob([lockSvgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    this.load.svg('ui-lock-icon', url, { width: 48, height: 48 });
  }
}
