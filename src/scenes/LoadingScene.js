import Phaser from 'phaser';
import skills from '../data/skills.js';
import '../ui/dom/preload.css';

export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super('LoadingScene');
  }

  init(data) {
    this.startArgs = data;
  }

  preload() {
    // Create DOM Loading screen overlay
    this.root = document.getElementById('ui-root');
    if (!this.root) {
      this.root = document.body;
    }

    const messages = [
      'PREPARING BATTLEFIELD...',
      'SUMMONING MONSTERS...',
      'LOADING HERO SPECS...',
      'CHARGING SKILL ORBS...',
      'FORGING NEON DEFENSES...'
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    this.overlay = document.createElement('div');
    this.overlay.className = 'preload-overlay';
    this.overlay.innerHTML = `
      <div class="preload-container">
        <div class="preload-title" id="loading-title">BATTLEFIELD SETUP</div>
        <div class="preload-bar-bg">
          <div class="preload-bar-fill" id="loading-fill" style="width: 0%;"></div>
        </div>
        <div class="preload-status" id="loading-status">${randomMsg} (0%)</div>
      </div>
    `;
    this.root.appendChild(this.overlay);

    const fillBar = this.overlay.querySelector('#loading-fill');
    const statusText = this.overlay.querySelector('#loading-status');

    // Phaser Loader events
    this.load.on('progress', (value) => {
      const pct = Math.floor(value * 100);
      if (fillBar) fillBar.style.width = `${pct}%`;
      if (statusText) statusText.textContent = `${randomMsg} (${pct}%)`;
    });

    this.load.on('complete', () => {
      if (statusText) statusText.textContent = 'READY FOR BATTLE!';
      this.time.delayedCall(200, () => {
        this.overlay.style.transition = 'opacity 0.3s ease-out';
        this.overlay.style.opacity = '0';
        
        this.time.delayedCall(300, () => {
          this.overlay.remove();
          this.scene.start('GameScene', this.startArgs);
        });
      });
    });

    // 1. Load skill assets
    skills.forEach((skill) => {
      if (skill.assetPath && skill.assetKey) {
        this.load.svg(skill.assetKey, skill.assetPath, { width: 96, height: 96 });
      }
    });

    // 2. Load selected hero asset
    const hero = this.startArgs.selectedHero;
    if (hero && hero.assetKey && hero.assetPath) {
      if (hero.assetPath.endsWith('.svg')) {
        this.load.svg(hero.assetKey, hero.assetPath, { width: 160, height: 160 });
      } else {
        this.load.image(hero.assetKey, hero.assetPath);
      }
    }

    // 3. Load active skin asset
    const skin = this.startArgs.activeSkin;
    if (skin && skin.assetKey && skin.assetPath) {
      if (skin.assetPath.endsWith('.svg')) {
        this.load.svg(skin.assetKey, skin.assetPath, { width: 160, height: 160 });
      } else {
        this.load.image(skin.assetKey, skin.assetPath);
      }
    }
  }
}
