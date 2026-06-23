import './dom/stage-result.css';
import { soundManager } from '../services/soundManager.js';

export default class StageResultOverlay {
  constructor(scene) {
    this.scene = scene;
    this.overlayElement = null;
  }

  showVictory(result) {
    this.clear();

    // Disable Phaser inputs
    if (this.scene.input) {
      this.scene.input.enabled = false;
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = false;
      }
    }

    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) {
      uiRoot.style.pointerEvents = 'auto';
    }

    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'stage-result-overlay';

    // Prevent click propagation
    const stopProp = (e) => e.stopPropagation();
    this.overlayElement.addEventListener('pointerdown', stopProp);
    this.overlayElement.addEventListener('pointerup', stopProp);
    this.overlayElement.addEventListener('click', stopProp);
    this.overlayElement.addEventListener('mousedown', stopProp);
    this.overlayElement.addEventListener('mouseup', stopProp);

    const gameMode = result.gameMode || 'campaign';
    const subTitleText = result.stage.stageName.toUpperCase() + ` (${gameMode.replace('_', ' ').toUpperCase()})`;

    // Gold rewards
    const rewardGold = result.stageGoldReward || result.goldReward || 0;
    const bossGold = result.bossGoldReward || 0;
    const totalGoldGained = rewardGold + bossGold;

    // Loot / Drops summary
    let lootString = 'None';
    let hasLoot = false;
    if (result.equipmentDrop) {
      lootString = `🛡️ ${result.equipmentDrop.name}`;
      hasLoot = true;
    } else if (result.materialDrops) {
      const dropEntries = Object.entries(result.materialDrops);
      if (dropEntries.length > 0) {
        const labels = { 'iron-ore': 'Iron Ore', 'magic-gem': 'Magic Gem', 'dragon-scale': 'Dragon Scale' };
        lootString = dropEntries.map(([mat, qty]) => `${labels[mat] || mat} x${qty}`).join(', ');
        hasLoot = true;
      }
    } else if (result.ticketDrop) {
      const labels = { 'survival-ticket': 'Survival Ticket', 'gold-ticket': 'Gold Ticket', 'boss-ticket': 'Boss Ticket' };
      lootString = `🎫 ${labels[result.ticketDrop] || result.ticketDrop}`;
      hasLoot = true;
    }

    // Level up badges
    let levelUpHtml = '';
    
    // Check if player leveled up from combined EXP results
    if (result.playerLeveledUp && result.playerLevelsGained > 0) {
      levelUpHtml += `
        <div class="stage-level-up-badge">
          🎉 LEVEL UP! x${result.playerLevelsGained}  —  +${result.playerStatusPointsGained} Status Pts  +${result.playerSkillPointsGained} Skill Pt
        </div>
      `;
      levelUpHtml += `
        <div class="stage-global-level-up-badge">
          🌟 GLOBAL LEVEL UP! NOW LV. ${result.playerLevel} 🌟
        </div>
      `;
    }

    // Render Victory panel
    this.overlayElement.innerHTML = `
      <div class="stage-result-container victory">
        <div class="stage-result-header">
          <h1 class="stage-result-title">VICTORY</h1>
          <div class="stage-result-subtitle">${subTitleText}</div>
        </div>
        <div class="stage-result-body">
          <div class="stage-result-exp-section">
            <div class="stage-clear-exp">✨ +${result.expGained} EXP</div>
            ${levelUpHtml}
          </div>
          
          <div class="stage-result-columns">
            <div class="stage-result-column victory-col">
              <div class="column-title">STAGE STATISTICS</div>
              <div class="column-list">
                <div class="column-item">
                  <span class="label-kills">💀 Kills:</span>
                  <span>${result.kills}</span>
                </div>
                <div class="column-item">
                  <span class="label-gold">🪙 Found:</span>
                  <span class="label-gold">+${result.temporaryGold}</span>
                </div>
              </div>
            </div>
            
            <div class="stage-result-column rewards-col">
              <div class="column-title">REWARDS EARNED</div>
              <div class="column-list">
                <div class="column-item">
                  <span class="label-gold">Gold Bonus:</span>
                  <span class="label-gold">+${totalGoldGained}</span>
                </div>
                <div class="column-item">
                  <span class="label-exp">EXP Gained:</span>
                  <span class="label-exp">+${result.expGained}</span>
                </div>
                <div class="column-item">
                  <span class="label-hero-xp">Hero XP:</span>
                  <span class="label-hero-xp">+${result.heroXpGained}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="stage-result-loot-panel ${hasLoot ? 'has-loot' : ''}">
            LOOT DETECTED: ${lootString.toUpperCase()}
          </div>
        </div>
        
        <div class="stage-result-footer">
          ${gameMode === 'campaign' ? `
            <button class="stage-result-btn btn-blue" id="next-stage-btn">NEXT STAGE</button>
          ` : `
            <button class="stage-result-btn btn-blue" id="retry-btn">RETRY</button>
          `}
          <button class="stage-result-btn btn-slate" id="main-menu-btn">MAIN MENU</button>
        </div>
      </div>
    `;

    // Button event listeners
    if (gameMode === 'campaign') {
      const nextBtn = this.overlayElement.querySelector('#next-stage-btn');
      nextBtn.addEventListener('mouseenter', () => soundManager.playSFX(this.scene, 'hover'));
      nextBtn.addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.clear();
        const nextStageId = Number((result && result.nextStage && result.nextStage.stageId) 
          ? result.nextStage.stageId 
          : (this.scene.stage ? (this.scene.stage.stageId + 1) : 1));

        this.scene.scene.start('LoadingScene', {
          stageId: nextStageId,
          gameMode: 'campaign',
          selectedHero: this.scene.selectedHero || null,
          baseHeroStats: this.scene.baseHeroStats || null,
          equippedItems: this.scene.equippedItems || null,
          activeSkin: this.scene.activeSkin || null,
          finalStats: this.scene.finalStats || null,
          heroLevel: this.scene.heroLevel || 1
        });
      });
    } else {
      const retryBtn = this.overlayElement.querySelector('#retry-btn');
      retryBtn.addEventListener('mouseenter', () => soundManager.playSFX(this.scene, 'hover'));
      retryBtn.addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.clear();
        const stageId = Number((result && result.stage && result.stage.stageId) 
          ? result.stage.stageId 
          : (this.scene.stage ? this.scene.stage.stageId : 1));

        this.scene.scene.start('LoadingScene', {
          stageId: stageId,
          gameMode,
          selectedHero: this.scene.selectedHero || null,
          baseHeroStats: this.scene.baseHeroStats || null,
          equippedItems: this.scene.equippedItems || null,
          activeSkin: this.scene.activeSkin || null,
          finalStats: this.scene.finalStats || null,
          heroLevel: this.scene.heroLevel || 1
        });
      });
    }

    const menuBtn = this.overlayElement.querySelector('#main-menu-btn');
    menuBtn.addEventListener('mouseenter', () => soundManager.playSFX(this.scene, 'hover'));
    menuBtn.addEventListener('click', () => {
      soundManager.playSFX(this.scene, 'click');
      this.clear();
      this.scene.scene.start('MainMenuScene');
    });

    uiRoot.appendChild(this.overlayElement);
  }

  showDefeat(result) {
    this.clear();

    // Disable Phaser inputs
    if (this.scene.input) {
      this.scene.input.enabled = false;
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = false;
      }
    }

    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) {
      uiRoot.style.pointerEvents = 'auto';
    }

    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'stage-result-overlay';

    // Prevent click propagation
    const stopProp = (e) => e.stopPropagation();
    this.overlayElement.addEventListener('pointerdown', stopProp);
    this.overlayElement.addEventListener('pointerup', stopProp);
    this.overlayElement.addEventListener('click', stopProp);
    this.overlayElement.addEventListener('mousedown', stopProp);
    this.overlayElement.addEventListener('mouseup', stopProp);

    const gameMode = this.scene.gameMode || 'campaign';
    const subTitleText = result.stage.stageName.toUpperCase() + ` (${gameMode.replace('_', ' ').toUpperCase()})`;

    // Render Defeat panel
    this.overlayElement.innerHTML = `
      <div class="stage-result-container defeat">
        <div class="stage-result-header">
          <h1 class="stage-result-title">DEFEAT</h1>
          <div class="stage-result-subtitle">${subTitleText}</div>
        </div>
        <div class="stage-result-body">
          <div class="stage-result-columns">
            <div class="stage-result-column defeat-col">
              <div class="column-title">DEFEAT DETAILS</div>
              <div class="column-list">
                <div class="column-item centered">
                  <span>💀 Monsters Slain:</span>
                  <span class="label-kills">${result.kills}</span>
                </div>
                <div class="column-item centered">
                  <span>🪙 Gold Gathered:</span>
                  <span class="label-gold">${result.temporaryGold}</span>
                </div>
                <div class="column-item centered">
                  <span>⚡ Hero XP Gained:</span>
                  <span class="label-hero-xp">+${result.heroXpGained || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="stage-result-footer">
          <button class="stage-result-btn btn-red" id="retry-btn">RETRY</button>
          <button class="stage-result-btn btn-slate" id="main-menu-btn">MAIN MENU</button>
        </div>
      </div>
    `;

    // Button event listeners
    const retryBtn = this.overlayElement.querySelector('#retry-btn');
    retryBtn.addEventListener('mouseenter', () => soundManager.playSFX(this.scene, 'hover'));
    retryBtn.addEventListener('click', () => {
      soundManager.playSFX(this.scene, 'click');
      this.clear();
      const stageId = Number((result && result.stage && result.stage.stageId) 
        ? result.stage.stageId 
        : (this.scene.stage ? this.scene.stage.stageId : 1));

      this.scene.scene.start('LoadingScene', {
        stageId: stageId,
        gameMode,
        selectedHero: this.scene.selectedHero || null,
        baseHeroStats: this.scene.baseHeroStats || null,
        equippedItems: this.scene.equippedItems || null,
        activeSkin: this.scene.activeSkin || null,
        finalStats: this.scene.finalStats || null,
        heroLevel: this.scene.heroLevel || 1
      });
    });

    const menuBtn = this.overlayElement.querySelector('#main-menu-btn');
    menuBtn.addEventListener('mouseenter', () => soundManager.playSFX(this.scene, 'hover'));
    menuBtn.addEventListener('click', () => {
      soundManager.playSFX(this.scene, 'click');
      this.clear();
      this.scene.scene.start('MainMenuScene');
    });

    uiRoot.appendChild(this.overlayElement);
  }

  clear() {
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
  }
}
