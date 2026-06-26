import { getPlayerProgress, addPlayerGold } from '../../systems/PlayerProgress.js';
import { GameManager } from '../../systems/GameManager.js';
import { getSelectedHero, getSelectedHeroBaseStats, getAvailableHeroes, setSelectedHero } from '../../systems/HeroSelection.js';
import { calculateFinalStats, MAX_HERO_LEVEL } from '../../systems/HeroStats.js';
import { getEquippedItems, getEquipmentById } from '../../systems/EquipmentInventory.js';
import skins from '../../data/skins.js';
import { getHeroById, getHeroBaseStats } from '../../data/heroes.js';
import { soundManager } from '../../services/soundManager.js';

export class HeroDOM {
  constructor(scene, domManager) {
    this.scene = scene;
    this.domManager = domManager;
    this.viewMode = 'profile'; // 'profile' or 'collection'
  }

  show() {
    this.viewMode = 'profile';
    this.domManager.showOverlay('hero', this.getHTML(), 'hero-overlay', (wrapper) => this.onMount(wrapper));
  }

  getHTML() {
    return `<div class="hero-container" id="hero-container-main"></div>`;
  }

  onMount(wrapper) {
    this.wrapper = wrapper;
    this.render();

    // Bind keydown events for keyboard navigation (Arrow Left/Right, A/D)
    this.keyListener = (e) => {
      // If the overlay is no longer in the DOM, self-clean and remove listener
      if (!this.wrapper || !this.wrapper.isConnected) {
        window.removeEventListener('keydown', this.keyListener);
        return;
      }

      // Only allow keyboard shifting in profile view mode
      if (this.viewMode !== 'profile') return;

      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        this.cycleSelectedHero(-1);
      } else if (key === 'arrowright' || key === 'd') {
        this.cycleSelectedHero(1);
      }
    };

    window.addEventListener('keydown', this.keyListener);
  }

  cycleSelectedHero(dir) {
    soundManager.playSFX(this.scene, 'hover');
    const allHeroes = getAvailableHeroes();
    const selectedHero = getSelectedHero(this.scene);
    const currentIndex = allHeroes.findIndex(h => h.id === selectedHero.id);
    
    let nextIndex = currentIndex + dir;
    if (nextIndex < 0) nextIndex = allHeroes.length - 1;
    if (nextIndex >= allHeroes.length) nextIndex = 0;
    
    const nextHero = allHeroes[nextIndex];
    setSelectedHero(this.scene, nextHero.id);
    
    // Sync main scene selections
    this.scene.selectedHero = getHeroById(nextHero.id);
    this.scene.selectedHeroBaseStats = getSelectedHeroBaseStats(this.scene);
    this.scene.activeSkin = skins.find((s) => s.id === this.scene.selectedHero.cosmeticSkinId) || skins[0];
    
    this.scene.refreshHeroLoadout?.();
    this.scene.refreshBottomStats?.();
    
    this.render();
  }

  getEquippedItemsForHero(heroId) {
    const allEquipped = GameManager.get('equippedItems') || {};
    const equipped = allEquipped[heroId] || { weapon: null, armor: null, accessory: null };
    const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory'];
    return EQUIPMENT_SLOTS
      .map((slot) => getEquipmentById(equipped[slot]))
      .filter(Boolean);
  }

  render() {
    const container = this.wrapper.querySelector('#hero-container-main');
    if (!container) return;

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

    if (this.viewMode === 'collection') {
      // --- COLLECTION VIEW ---
      const allHeroes = getAvailableHeroes();
      container.innerHTML = `
        <div class="hero-header">
          <h2>HERO COLLECTION</h2>
          <div style="display: flex; gap: 12px; align-items: center;">
            <button class="hero-back-btn" id="hero-back-btn" style="background: #cca677; color: white; border: none; padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 13px; cursor: pointer; transition: all 0.2s;">BACK TO PROFILE</button>
            <button class="hero-close-btn" id="hero-close-btn">X</button>
          </div>
        </div>
        
        <div class="hero-body" style="padding: 20px; display: flex; flex-direction: column; overflow: hidden; flex: 1;">
          <div class="hero-collection-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 16px; overflow-y: auto; flex: 1; padding: 10px; box-sizing: border-box;">
            ${allHeroes.map(h => {
              const isSelected = h.id === selectedHero.id;
              const lvl = heroLevels[h.id] || 1;
              const hSkin = skins.find((skin) => skin.id === h.cosmeticSkinId) || skins[0];
              const hImgSrc = hSkin?.assetPath || h.assetPath;

              // Calculate final stats for this hero dynamically
              const hBaseStats = getHeroBaseStats(h);
              const hEquipped = this.getEquippedItemsForHero(h.id);
              const hFinalStats = calculateFinalStats(hBaseStats, hEquipped, hSkin, lvl);

              return `
                <div class="hero-collection-card ${isSelected ? 'active' : ''}" data-hero-id="${h.id}" style="background: ${isSelected ? '#eff6ff' : 'white'}; border: 2px solid ${isSelected ? '#1d4ed8' : '#ebd9cc'}; border-radius: 12px; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05); box-sizing: border-box;">
                  <img src="${hImgSrc}" style="width: 64px; height: 64px; object-fit: contain; margin-bottom: 8px;" alt="${h.name}"/>
                  <h4 style="margin: 0 0 2px 0; font-size: 15px; font-weight: 900; color: #4a3f35;">${h.name}</h4>
                  <span style="font-size: 11px; color: #a58b76; font-weight: bold; margin-bottom: 8px;">Lv. ${lvl}</span>
                  
                  <!-- mini stats list below -->
                  <div class="hero-card-stats" style="margin-top: 6px; width: 100%; border-top: 1px dashed #ebd9cc; padding-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 10px; width: 100%;">
                      <span style="color: #a58b76; font-weight: bold;">HP:</span>
                      <span style="color: #4a3f35; font-weight: 900;">${Math.floor(hFinalStats.hp)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; width: 100%;">
                      <span style="color: #a58b76; font-weight: bold;">Attack:</span>
                      <span style="color: #4a3f35; font-weight: 900;">${Math.floor(hFinalStats.damage)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; width: 100%;">
                      <span style="color: #a58b76; font-weight: bold;">Defense:</span>
                      <span style="color: #4a3f35; font-weight: 900;">${Math.floor(hFinalStats.armor)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; width: 100%;">
                      <span style="color: #a58b76; font-weight: bold;">Speed:</span>
                      <span style="color: #4a3f35; font-weight: 900;">${hFinalStats.attackSpeed.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
               `;
             }).join('')}
          </div>
        </div>
      `;

      // Bind Close
      container.querySelector('#hero-close-btn').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.domManager.closeCurrent();
      });

      // Bind Back
      container.querySelector('#hero-back-btn').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.viewMode = 'profile';
        this.render();
      });

      // Bind Card clicks
      container.querySelectorAll('.hero-collection-card').forEach(card => {
        card.addEventListener('click', () => {
          const targetHeroId = card.getAttribute('data-hero-id');
          soundManager.playSFX(this.scene, 'click');
          setSelectedHero(this.scene, targetHeroId);
          
          this.scene.selectedHero = getHeroById(targetHeroId);
          this.scene.selectedHeroBaseStats = getSelectedHeroBaseStats(this.scene);
          this.scene.activeSkin = skins.find((s) => s.id === this.scene.selectedHero.cosmeticSkinId) || skins[0];
          
          this.scene.refreshHeroLoadout?.();
          this.scene.refreshBottomStats?.();
          
          this.viewMode = 'profile';
          this.render();
        });
      });

    } else {
      // --- PROFILE VIEW ---
      const xpPercent = Math.min(100, (currentXP / xpRequired) * 100);
      
      container.innerHTML = `
        <div class="hero-header">
          <h2>HERO PROFILE</h2>
          <div style="display: flex; gap: 12px; align-items: center;">
            <button class="hero-collection-btn" id="hero-collection-btn" style="background: #1d4ed8; color: white; border: 1px solid #60a5fa; padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 13px; cursor: pointer; transition: all 0.2s;">ALL HEROES</button>
            <button class="hero-close-btn" id="hero-close-btn">X</button>
          </div>
        </div>
        
        <div class="hero-body">
          <!-- LEFT: Avatar & Info -->
          <div class="hero-left" style="align-items: center; justify-content: center; gap: 15px;">
            <div class="hero-class-panel" style="width: 100%; box-sizing: border-box;">
              <h3 id="hero-name-title" style="font-size: 24px; font-weight: 900; color: #4a3f35; margin: 0 0 5px 0;">${selectedHero.name}</h3>
              <div class="hero-level-text" id="hero-level-text" style="margin-bottom: 0;">Level ${heroLevel}</div>
              <div class="hero-xp-container">
                <div class="hero-xp-bar-bg">
                  <div class="hero-xp-bar-fill" id="hero-xp-fill" style="width: ${xpPercent}%"></div>
                  <span class="hero-xp-text" id="hero-xp-text">${currentXP} / ${xpRequired} XP</span>
                </div>
              </div>
            </div>
            
            <!-- Avatar wrapper with arrows -->
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px; width: 100%; margin: 10px 0;">
              <button class="hero-nav-btn" id="hero-prev-btn" style="background: #cca677; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; font-weight: bold; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); flex-shrink: 0;">&lt;</button>
              <div class="hero-avatar-circle">
                <img id="hero-avatar-img" src="${activeSkin?.assetPath || selectedHero.assetPath}" alt="${selectedHero.name}" />
              </div>
              <button class="hero-nav-btn" id="hero-next-btn" style="background: #cca677; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; font-weight: bold; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); flex-shrink: 0;">&gt;</button>
            </div>

            <button class="hero-upgrade-btn" id="hero-upgrade-btn" style="margin-top: 5px;">
               UPGRADE<br>
               <span id="hero-upgrade-cost" style="color: #f6be4f; font-size: 13px; font-weight: 900;">💰 ${upgradeCost} Gold</span>
            </button>
          </div>
          
          <!-- RIGHT: Final Stats Summary -->
          <div class="hero-right">
            <h3>Combat Stats</h3>
            <div class="final-stats-grid" id="final-stats-grid">
              ${this.getPrimaryStatsHtml(finalHeroStats)}
            </div>
            
            <h4 class="sec-stats-title">Advanced Attributes</h4>
            <div class="secondary-stats-grid" id="secondary-stats-grid">
              ${this.getSecondaryStatsHtml(finalHeroStats)}
            </div>
          </div>
        </div>
      `;

      // Bind Close
      container.querySelector('#hero-close-btn').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.domManager.closeCurrent();
      });

      // Bind Collection
      container.querySelector('#hero-collection-btn').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.viewMode = 'collection';
        this.render();
      });

      // Bind Navs
      container.querySelector('#hero-prev-btn').addEventListener('click', () => {
        this.cycleSelectedHero(-1);
      });
      container.querySelector('#hero-next-btn').addEventListener('click', () => {
        this.cycleSelectedHero(1);
      });

      // Bind Upgrade
      const upgradeBtn = container.querySelector('#hero-upgrade-btn');
      upgradeBtn.addEventListener('click', () => {
        const currentGold = GameManager.get('gold') || 0;
        if (currentGold < upgradeCost) {
          soundManager.playSFX(this.scene, 'hit');
          const oldContent = upgradeBtn.innerHTML;
          upgradeBtn.disabled = true;
          upgradeBtn.innerHTML = `<span style="color: #ef4444; font-size: 13px; font-weight: 900;">Not enough gold!</span>`;
          setTimeout(() => {
            upgradeBtn.disabled = false;
            upgradeBtn.innerHTML = oldContent;
          }, 1500);
          return;
        }

        // Upgrade logic
        addPlayerGold(this.scene, -upgradeCost);
        
        const nextLevel = heroLevel + 1;
        const heroLevels = GameManager.get('heroLevels') || {};
        const heroXP = GameManager.get('heroXP') || {};
        heroLevels[selectedHero.id] = nextLevel;
        heroXP[selectedHero.id] = 0;
        
        GameManager.setState({
          heroLevels,
          heroXP
        });

        soundManager.playSFX(this.scene, 'upgrade');
        
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
    }
  }

  getPrimaryStatsHtml(stats) {
    const displayStats = [
      { key: 'hp', label: 'Max HP' },
      { key: 'damage', label: 'Attack' },
      { key: 'armor', label: 'Defense' },
      { key: 'attackSpeed', label: 'Atk Speed' },
      { key: 'moveSpeed', label: 'Move Speed' },
      { key: 'criticalChance', label: 'Crit %' }
    ];
    return displayStats.map(stat => {
      let val = stats[stat.key];
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
  }

  getSecondaryStatsHtml(stats) {
    const secondaryStats = [
      { key: 'healthRegen', label: 'HP Regen /s' },
      { key: 'lifesteal', label: 'Lifesteal' },
      { key: 'evasion', label: 'Evasion' },
      { key: 'cooldownReduction', label: 'CD Reduc' },
      { key: 'attackRange', label: 'Atk Range' }
    ];
    return secondaryStats.map(stat => {
      let val = stats[stat.key];
      if (typeof val === 'number') {
        if (['lifesteal', 'evasion', 'cooldownReduction'].includes(stat.key)) {
          val = (val * 100).toFixed(1) + '%';
        } else {
          val = val.toFixed(1);
        }
      } else {
        val = '0.0%';
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
