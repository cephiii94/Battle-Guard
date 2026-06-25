import { getPlayerProgress, addPlayerGold } from '../../systems/PlayerProgress.js';
import { GameManager } from '../../systems/GameManager.js';
import { getSelectedHero, getSelectedHeroBaseStats } from '../../systems/HeroSelection.js';
import { calculateFinalStats, MAX_HERO_LEVEL } from '../../systems/HeroStats.js';
import { getEquippedItems } from '../../systems/EquipmentInventory.js';
import skins from '../../data/skins.js';

export class HeroDOM {
  constructor(scene, domManager) {
    this.scene = scene;
    this.domManager = domManager;
  }

  show() {
    this.domManager.showOverlay('hero', this.getHTML(), 'hero-overlay', (wrapper) => this.onMount(wrapper));
  }

  getHTML() {
    return `
      <div class="hero-container">
        <div class="hero-header">
          <h2>HERO PROFILE</h2>
          <button class="hero-close-btn" id="hero-close-btn">X</button>
        </div>
        
        <div class="hero-body">
          <!-- LEFT: Avatar & Info -->
          <div class="hero-left" style="align-items: center; justify-content: center; gap: 20px;">
            <div class="hero-class-panel" style="width: 100%; box-sizing: border-box;">
              <h3 id="hero-name-title" style="font-size: 24px; font-weight: 900; color: #4a3f35; margin: 0 0 5px 0;">Hero</h3>
              <div class="hero-level-text" id="hero-level-text" style="margin-bottom: 0;">Level 1</div>
            </div>
            
            <div class="hero-avatar-circle">
              <img id="hero-avatar-img" src="" alt="Hero" />
            </div>

            <button class="hero-upgrade-btn" id="hero-upgrade-btn">
              UPGRADE<br>
              <span id="hero-upgrade-cost" style="color: #f6be4f; font-size: 13px; font-weight: 900;">💰 0 Gold</span>
            </button>
          </div>
          
          <!-- RIGHT: Final Stats Summary -->
          <div class="hero-right">
            <h3>Combat Stats</h3>
            <div class="final-stats-grid" id="final-stats-grid">
              <!-- Injected via JS -->
            </div>
            
            <h4 class="sec-stats-title">Advanced Attributes</h4>
            <div class="secondary-stats-grid" id="secondary-stats-grid">
              <!-- Injected via JS -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  onMount(wrapper) {
    this.wrapper = wrapper;
    
    // Bind Close
    wrapper.querySelector('#hero-close-btn').addEventListener('click', () => {
      this.scene.soundManager?.playSFX(this.scene, 'click');
      this.domManager.closeCurrent();
    });

    // Bind Upgrade button
    wrapper.querySelector('#hero-upgrade-btn').addEventListener('click', () => {
      const selectedHero = getSelectedHero(this.scene);
      const heroLevels = GameManager.get('heroLevels') || {};
      const heroXP = GameManager.get('heroXP') || {};
      
      const heroLevel = heroLevels[selectedHero.id] || 1;
      const currentXP = heroXP[selectedHero.id] || 0;
      const xpRequired = heroLevel * 100;
      const xpRemaining = Math.max(0, xpRequired - currentXP);
      const upgradeCost = xpRemaining * heroLevel;

      const currentGold = GameManager.get('gold') || 0;
      if (currentGold < upgradeCost) {
        this.scene.soundManager?.playSFX(this.scene, 'hit');
        const btn = wrapper.querySelector('#hero-upgrade-btn');
        const oldContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span style="color: #ef4444; font-size: 13px; font-weight: 900;">Not enough gold!</span>`;
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = oldContent;
        }, 1500);
        return;
      }

      // Execute Upgrade
      addPlayerGold(this.scene, -upgradeCost);
      
      const nextLevel = heroLevel + 1;
      heroLevels[selectedHero.id] = nextLevel;
      heroXP[selectedHero.id] = 0;
      
      GameManager.setState({
        heroLevels,
        heroXP
      });

      this.scene.soundManager?.playSFX(this.scene, 'upgrade');
      
      // Update Main Menu Scene textures/texts if active
      this.scene.refreshHeroLoadout?.();
      this.scene.refreshBottomStats?.();
      if (this.scene.goldText) {
        this.scene.goldText.setText(this.scene.formatCurrency(GameManager.get('gold') || 0));
      }
      if (this.scene.heroLevelText) {
        this.scene.heroLevelText.setText(`Lv. ${nextLevel}`);
      }

      this.render();
    });

    this.render();
  }

  render() {
    // 1. Gather Data
    this.scene.playerProgress = getPlayerProgress(this.scene);
    const selectedHero = getSelectedHero(this.scene);
    const selectedHeroBaseStats = getSelectedHeroBaseStats(this.scene);
    const activeSkin = skins.find((skin) => skin.id === selectedHero.cosmeticSkinId) || skins[0];
    const equippedItems = getEquippedItems(this.scene);
    
    const heroLevels = GameManager.get('heroLevels') || {};
    const heroLevel = heroLevels[selectedHero.id] || 1;
    const finalHeroStats = calculateFinalStats(selectedHeroBaseStats, equippedItems, activeSkin, heroLevel);

    const heroXP = GameManager.get('heroXP') || {};
    const currentXP = heroXP[selectedHero.id] || 0;
    const xpRequired = heroLevel * 100;
    const xpRemaining = Math.max(0, xpRequired - currentXP);
    const upgradeCost = xpRemaining * heroLevel;
    
    // 2. Update Left Panel (Info & Avatar)
    this.wrapper.querySelector('#hero-name-title').innerText = selectedHero.name;
    this.wrapper.querySelector('#hero-level-text').innerText = `Level ${heroLevel}`;

    const heroImg = this.wrapper.querySelector('#hero-avatar-img');
    heroImg.src = activeSkin?.assetPath || selectedHero.assetPath;

    // Update upgrade button cost
    this.wrapper.querySelector('#hero-upgrade-cost').innerText = `💰 ${upgradeCost} Gold`;

    // 3. Update Right Panel (Final Stats)
    const statsGrid = this.wrapper.querySelector('#final-stats-grid');
    const secStatsGrid = this.wrapper.querySelector('#secondary-stats-grid');
    
    // Primary Stats
    const displayStats = [
      { key: 'hp', label: 'Max HP' },
      { key: 'damage', label: 'Attack' },
      { key: 'armor', label: 'Defense' },
      { key: 'attackSpeed', label: 'Atk Speed' },
      { key: 'moveSpeed', label: 'Move Speed' },
      { key: 'criticalChance', label: 'Crit %' }
    ];

    statsGrid.innerHTML = displayStats.map(stat => {
      let val = finalHeroStats[stat.key];
      if (typeof val === 'number') {
        if (stat.key === 'criticalChance') val = (val * 100).toFixed(1) + '%';
        else if (stat.key === 'attackSpeed') val = val.toFixed(2);
        else val = Math.floor(val);
      } else {
        val = val || 0;
      }
      return `
        <div class="final-stat-box">
          <span class="fs-name">${stat.label}</span>
          <span class="fs-val">${val}</span>
        </div>
      `;
    }).join('');

    // Secondary Stats
    const secondaryStats = [
      { key: 'healthRegen', label: 'HP Regen /s' },
      { key: 'lifesteal', label: 'Lifesteal' },
      { key: 'evasion', label: 'Evasion' },
      { key: 'cooldownReduction', label: 'CD Reduc' },
      { key: 'attackRange', label: 'Atk Range' }
    ];

    secStatsGrid.innerHTML = secondaryStats.map(stat => {
      let val = finalHeroStats[stat.key];
      if (typeof val === 'number') {
        if (['lifesteal', 'evasion', 'cooldownReduction'].includes(stat.key)) {
          val = (val * 100).toFixed(1) + '%';
        } else {
          val = val.toFixed(1);
        }
      } else {
        val = '0%';
      }
      return `
        <div class="sec-stat-row">
          <span class="ss-name">${stat.label}</span>
          <span class="ss-val">${val}</span>
        </div>
      `;
    }).join('');
  }
}
