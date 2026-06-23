import {
  getPlayerProgress,
  getDailyAttemptsRemaining,
  consumeDailyAttempt,
  hasTicket,
  consumeTicket
} from '../../systems/PlayerProgress.js';
import { soundManager } from '../../services/soundManager.js';

export class ModeSelectionTab {
  constructor(scene) {
    this.scene = scene;
  }

  clear() {
    if (this.scene.domUiManager && this.scene.domUiManager.isActive('mode-selection')) {
      this.scene.domUiManager.closeCurrent();
    }
  }

  isActive() {
    return this.scene.domUiManager && this.scene.domUiManager.isActive('mode-selection');
  }

  show() {
    this.scene.clearAllTabs();
    this.scene.refreshHeroLoadout();
    this.scene.playerProgress = getPlayerProgress(this.scene);

    const modes = [
      {
        id: 'survival',
        name: 'SURVIVAL',
        desc: 'Bertahan hidup selama 90 detik.<br>Musuh terus menggila.',
        btnLabel: 'ENTER SURVIVAL',
        ticketKey: 'survival-ticket',
        class: 'mode-survival'
      },
      {
        id: 'gold_farm',
        name: 'GOLD FARMING',
        desc: 'Dapatkan gold berlimpah<br>dari monster dalam 60 detik.',
        btnLabel: 'ENTER FARMING',
        ticketKey: 'gold-ticket',
        class: 'mode-gold_farm'
      },
      {
        id: 'looting',
        name: 'LOOTING BOSS',
        desc: 'Kalahkan Boss kuat.<br>Dapatkan material crafting.',
        btnLabel: 'ENTER LOOTING',
        ticketKey: 'boss-ticket',
        class: 'mode-looting'
      }
    ];

    let cardsHtml = '';
    modes.forEach(mode => {
      const remaining = getDailyAttemptsRemaining(this.scene, mode.id);
      const ticketQty = this.scene.playerProgress.tickets ? (this.scene.playerProgress.tickets[mode.ticketKey] || 0) : 0;
      
      const attemptsText = `Attempts: ${remaining}/3`;
      const ticketsText = `Tickets: ${ticketQty} 🎟️`;

      cardsHtml += `
        <div class="mode-card ${mode.class}" data-mode-id="${mode.id}" data-ticket-key="${mode.ticketKey}" data-remaining="${remaining}">
          <div class="mode-card-title">${mode.name}</div>
          <div class="mode-card-desc">${mode.desc}</div>
          
          <div class="mode-card-stats">
            <span class="mode-attempts ${remaining > 0 ? 'available' : 'empty'}">${attemptsText}</span>
            <span class="mode-tickets">${ticketsText}</span>
          </div>
          
          <button class="mode-enter-btn">${mode.btnLabel}</button>
        </div>
      `;
    });

    const htmlString = `
      <div class="mode-selection-container">
        <div class="mode-selection-header">
          <div class="mode-selection-title">
            <h2>⚔️ SELECT GAME MODE</h2>
          </div>
          <button class="mode-selection-close-btn" id="btn-close-mode">✖</button>
        </div>
        <div class="mode-selection-content">
          <div class="mode-grid">
            ${cardsHtml}
          </div>
        </div>
      </div>
    `;

    this.scene.domUiManager.showOverlay('mode-selection', htmlString, 'mode-selection-overlay', (wrapper) => {
      this.wrapper = wrapper;

      // Close button
      wrapper.querySelector('#btn-close-mode').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.clear();
      });

      // Card listeners
      const cards = wrapper.querySelectorAll('.mode-card');
      cards.forEach(card => {
        const modeId = card.getAttribute('data-mode-id');
        const ticketKey = card.getAttribute('data-ticket-key');

        // Hover SFX
        card.addEventListener('mouseenter', () => {
          soundManager.playSFX(this.scene, 'hover');
        });

        // Click handler
        card.addEventListener('click', () => {
          const remaining = parseInt(card.getAttribute('data-remaining'));
          let canEnter = false;
          let useTicket = false;

          if (remaining > 0) {
            canEnter = true;
          } else {
            const hasTkt = hasTicket(this.scene, ticketKey);
            if (hasTkt) {
              canEnter = true;
              useTicket = true;
            }
          }

          if (canEnter) {
            soundManager.playSFX(this.scene, 'click');
            if (useTicket) {
              consumeTicket(this.scene, ticketKey);
              this.showFeedback('Ticket consumed for entry!');
            } else {
              consumeDailyAttempt(this.scene, modeId);
            }

            this.clear();

            const highestStageId = this.scene.playerProgress.highestStageUnlocked || 1;
            this.scene.scene.start('LoadingScene', {
              stageId: highestStageId,
              gameMode: modeId,
              selectedHero: this.scene.selectedHero,
              baseHeroStats: this.scene.selectedHeroBaseStats,
              equippedItems: this.scene.equippedItems,
              activeSkin: this.scene.activeSkin,
              finalStats: this.scene.finalHeroStats,
              heroLevel: this.scene.heroLevel
            });
          } else {
            soundManager.playSFX(this.scene, 'hit');
            this.showFeedback('No attempts or tickets remaining!');
          }
        });
      });
    });
  }

  showFeedback(message) {
    if (!this.wrapper) return;

    // If there is an existing feedback banner, remove it
    const existing = this.wrapper.querySelector('.mode-feedback-banner');
    if (existing) {
      existing.remove();
    }

    const banner = document.createElement('div');
    banner.className = 'mode-feedback-banner';
    banner.textContent = message;
    
    this.wrapper.appendChild(banner);

    // Fade out after 1.2s, remove after 1.5s
    setTimeout(() => {
      banner.classList.add('fade-out');
    }, 1200);

    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 1500);
  }
}
