import { InventoryDOM } from './InventoryDOM.js';
import { HeroDOM } from './HeroDOM.js';
import { ShopDOM } from './ShopDOM.js';
import { BlacksmithDOM } from './BlacksmithDOM.js';
import { SkillsDOM } from './SkillsDOM.js';
import { soundManager } from '../../services/soundManager.js';

import './inventory.css';
import './hero.css';
import './shop.css';
import './blacksmith.css';
import './skills.css';
import './stage-selection.css';
import './settings.css';
import './mode-selection.css';
import './stage-result.css';
import './upgrade-popup.css';
import './pause.css';
import './idle-reward.css';

export class DOMUIManager {
  constructor(scene) {
    this.scene = scene;
    this.root = document.getElementById('ui-root');
    this.inventory = new InventoryDOM(scene, this);
    this.hero = new HeroDOM(scene, this);
    this.shop = new ShopDOM(scene, this);
    this.blacksmith = new BlacksmithDOM(scene, this);
    this.skills = new SkillsDOM(scene, this);
    this.activeOverlay = null;
    this.activeOverlayId = null;

    // Listen for ESC key globally to close UI
    if (!window.domUiEscListenerAttached) {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeOverlay) {
          soundManager.playSFX(this.scene, 'click');
          this.closeCurrent();
        }
      });
      window.domUiEscListenerAttached = true;
    }
  }

  isActive(overlayId) {
    return this.activeOverlayId === overlayId;
  }

  showInventory() {
    this.inventory.show();
  }

  showHero() {
    this.hero.show();
  }

  showShop() {
    this.shop.show();
  }

  showBlacksmith() {
    this.blacksmith.show();
  }

  showSkills() {
    this.skills.show();
  }

  closeCurrent() {
    if (this.activeOverlay) {
      this.root.removeChild(this.activeOverlay);
      this.activeOverlay = null;
      this.activeOverlayId = null;
      this.root.style.pointerEvents = 'none';
      
      // Re-enable Phaser inputs
      if (this.scene.input) {
        this.scene.input.enabled = true;
        if (this.scene.input.keyboard) {
          this.scene.input.keyboard.enabled = true;
        }
      }
    }
  }

  showOverlay(overlayId, htmlString, styleClass, onMount = null) {
    this.closeCurrent();

    const wrapper = document.createElement('div');
    wrapper.className = `dom-ui-overlay ${styleClass}`;
    wrapper.innerHTML = htmlString;
    wrapper.style.pointerEvents = 'auto'; // Block clicks from passing to Phaser

    // Prevent clicks from reaching Phaser canvas
    wrapper.addEventListener('pointerdown', (e) => e.stopPropagation());
    wrapper.addEventListener('pointerup', (e) => e.stopPropagation());
    wrapper.addEventListener('click', (e) => e.stopPropagation());
    wrapper.addEventListener('mousedown', (e) => e.stopPropagation());
    wrapper.addEventListener('mouseup', (e) => e.stopPropagation());

    // Disable all phaser inputs temporarily
    if (this.scene.input) {
      this.scene.input.enabled = false;
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = false;
      }
    }

    this.root.appendChild(wrapper);
    this.root.style.pointerEvents = 'auto';
    this.activeOverlay = wrapper;
    this.activeOverlayId = overlayId;

    if (onMount) {
      onMount(wrapper);
    }
  }
}
