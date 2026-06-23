import { getStageById } from '../../data/stages.js';
import { getPlayerProgress } from '../../systems/PlayerProgress.js';
import { soundManager } from '../../services/soundManager.js';

export class StageSelectionTab {
  constructor(scene) {
    this.scene = scene;
  }

  clear() {
    if (this.scene.domUiManager && this.scene.domUiManager.isActive('stage-selection')) {
      this.scene.domUiManager.closeCurrent();
    }
  }

  isActive() {
    return this.scene.domUiManager && this.scene.domUiManager.isActive('stage-selection');
  }

  show() {
    this.scene.clearAllTabs();
    this.scene.refreshHeroLoadout();
    this.scene.playerProgress = getPlayerProgress(this.scene);

    const highestStage = this.scene.playerProgress.highestStageUnlocked || 1;
    const stageTimes = this.scene.playerProgress.stageTimes || {};
    let cardsHtml = '';

    for (let stageId = 1; stageId <= 6; stageId++) {
      const stage = getStageById(stageId);
      const isUnlocked = stageId <= highestStage;

      if (isUnlocked) {
        const clearTime = stageTimes[stageId];
        let timeLabel = 'Best Time: --:--';
        if (clearTime !== undefined && clearTime !== null) {
          const mins = Math.floor(clearTime / 60).toString().padStart(2, '0');
          const secs = (clearTime % 60).toString().padStart(2, '0');
          timeLabel = `Best Time: ${mins}:${secs}`;
        }

        cardsHtml += `
          <div class="stage-card unlocked" data-stage-id="${stageId}">
            <div class="stage-card-title">${stage.stageName}</div>
            <div class="stage-card-time">${timeLabel}</div>
            <div class="stage-card-reward">💰 ${stage.goldReward}g</div>
            <button class="stage-start-btn">START BATTLE</button>
          </div>
        `;
      } else {
        cardsHtml += `
          <div class="stage-card locked">
            <div class="stage-card-title">${stage.stageName}</div>
            <div class="stage-lock-icon">🔒</div>
            <div class="stage-locked-label">LOCKED</div>
          </div>
        `;
      }
    }

    const htmlString = `
      <div class="stage-selection-container">
        <div class="stage-selection-header">
          <div class="stage-selection-title">
            <h2>⚔️ BATTLEFIELD SELECTION</h2>
            <p>Pilih medan pertempuran untuk dihadapi.</p>
          </div>
          <button class="stage-selection-close-btn" id="btn-close-stage">✖</button>
        </div>
        <div class="stage-selection-content">
          <div class="stage-grid">
            ${cardsHtml}
          </div>
        </div>
      </div>
    `;

    this.scene.domUiManager.showOverlay('stage-selection', htmlString, 'stage-selection-overlay', (wrapper) => {
      this.wrapper = wrapper;

      // Close button listener
      wrapper.querySelector('#btn-close-stage').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.clear();
      });

      // Interactive card listeners
      const cards = wrapper.querySelectorAll('.stage-card.unlocked');
      cards.forEach(card => {
        const stageId = parseInt(card.getAttribute('data-stage-id'));

        // Hover SFX
        card.addEventListener('mouseenter', () => {
          soundManager.playSFX(this.scene, 'hover');
        });

        // Click to Start Battle
        card.addEventListener('click', () => {
          soundManager.playSFX(this.scene, 'click');
          this.clear();
          this.scene.scene.start('LoadingScene', {
            stageId,
            selectedHero: this.scene.selectedHero,
            baseHeroStats: this.scene.selectedHeroBaseStats,
            equippedItems: this.scene.equippedItems,
            activeSkin: this.scene.activeSkin,
            finalStats: this.scene.finalHeroStats,
            heroLevel: this.scene.heroLevel
          });
        });
      });
    });
  }
}
