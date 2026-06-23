import './dom/upgrade-popup.css';
import { soundManager } from '../services/soundManager.js';

export default class UpgradePopup {
  constructor(scene, onChoose) {
    this.scene = scene;
    this.onChoose = onChoose;
    this.overlayElement = null;
    this.isVisible = false;
  }

  show(upgrades) {
    this.hide();

    // Disable Phaser inputs
    if (this.scene.input) {
      this.scene.input.enabled = false;
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = false;
      }
    }

    // Set pointer events on ui-root
    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) {
      uiRoot.style.pointerEvents = 'auto';
    }

    // Create DOM element
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'upgrade-popup-overlay';
    
    // Prevent click propagation to Phaser canvas
    const stopProp = (e) => e.stopPropagation();
    this.overlayElement.addEventListener('pointerdown', stopProp);
    this.overlayElement.addEventListener('pointerup', stopProp);
    this.overlayElement.addEventListener('click', stopProp);
    this.overlayElement.addEventListener('mousedown', stopProp);
    this.overlayElement.addEventListener('mouseup', stopProp);

    let cardsHtml = '';
    upgrades.forEach((upgrade, index) => {
      cardsHtml += `
        <div class="upgrade-card" data-index="${index}">
          <div class="upgrade-card-accent"></div>
          <div class="upgrade-card-icon-container">
            ${this.getUpgradeSymbol(upgrade.id)}
          </div>
          <div class="upgrade-card-title">${upgrade.title}</div>
          <div class="upgrade-card-divider"></div>
          <div class="upgrade-card-description">${upgrade.description}</div>
          <div class="upgrade-card-select-btn">PILIH</div>
        </div>
      `;
    });

    this.overlayElement.innerHTML = `
      <div class="upgrade-popup-container">
        <div class="upgrade-popup-header">
          <h2 class="upgrade-popup-title">LEVEL UP - CHOOSE A BATTLE MOD</h2>
        </div>
        <div class="upgrade-popup-body">
          ${cardsHtml}
        </div>
      </div>
    `;

    // Wire up events
    const cards = this.overlayElement.querySelectorAll('.upgrade-card');
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        soundManager.playSFX(this.scene, 'hover');
      });
      card.addEventListener('click', () => {
        const index = parseInt(card.getAttribute('data-index'), 10);
        soundManager.playSFX(this.scene, 'click');
        this.onChoose(upgrades[index]);
      });
    });

    uiRoot.appendChild(this.overlayElement);
    this.isVisible = true;
  }

  hide() {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }

    // Re-enable Phaser inputs
    if (this.scene.input) {
      this.scene.input.enabled = true;
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = true;
      }
    }

    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) {
      uiRoot.style.pointerEvents = 'none';
    }

    this.isVisible = false;
  }

  getUpgradeSymbol(id) {
    const symbols = {
      'damage': '⚔️',
      'attack-speed': '⚡',
      'max-hp': '❤️',
      'movement-speed': '👟',
      'critical-chance': '🎯',
      'health-regen': '🧪',
      'armor': '🛡️',
      'lifesteal': '🩸',
      'evasion': '💨',
      'cooldown-reduction': '⏳'
    };
    return symbols[id] || '⚙️';
  }
}
