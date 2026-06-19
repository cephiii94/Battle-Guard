import { getPlayerProgress, allocateStatPoint } from '../../systems/PlayerProgress.js';
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
          <!-- LEFT: Class & Stats Allocation -->
          <div class="hero-left">
            <div class="hero-class-panel">
              <h3>Current Class</h3>
              <div class="hero-class-name" id="hero-class-name">Novice</div>
              <div class="hero-level-text" id="hero-level-text">Level 1</div>
            </div>
            
            <div class="hero-alloc-panel">
              <div class="alloc-header">
                <h3>Attributes</h3>
                <div class="stat-points" id="hero-stat-points">0 Pts</div>
              </div>
              
              <div class="alloc-row">
                <span class="alloc-name" title="Attack, Max HP, HP Regen">STR</span>
                <span class="alloc-val" id="val-str">0</span>
                <button class="alloc-btn" id="btn-add-str">+</button>
              </div>
              <div class="alloc-row">
                <span class="alloc-name" title="Atk Speed, Move Speed, Crit, Evasion">AGI</span>
                <span class="alloc-val" id="val-agi">0</span>
                <button class="alloc-btn" id="btn-add-agi">+</button>
              </div>
              <div class="alloc-row">
                <span class="alloc-name" title="CD Reduc, Lifesteal, Defense">INT</span>
                <span class="alloc-val" id="val-int">0</span>
                <button class="alloc-btn" id="btn-add-int">+</button>
              </div>
            </div>
          </div>
          
          <!-- CENTER: Avatar -->
          <div class="hero-center">
            <div class="hero-avatar-circle">
              <img id="hero-avatar-img" src="" alt="Hero" />
            </div>
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

    // Bind Stat Allocation Buttons
    const bindAddStat = (statName, btnId) => {
      const btn = wrapper.querySelector(btnId);
      btn.addEventListener('click', () => {
        const statusPoints = GameManager.get('statusPoints') || 0;
        if (statusPoints > 0) {
          allocateStatPoint(this.scene, statName);
          this.scene.soundManager?.playSFX(this.scene, 'click');
          this.scene.refreshBottomStats(); // update main menu UI if needed
          this.render(); // re-render DOM
        }
      });
    };

    bindAddStat('strength', '#btn-add-str');
    bindAddStat('agility', '#btn-add-agi');
    bindAddStat('intelligence', '#btn-add-int');

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
    
    const allocatedStats = GameManager.get('allocatedStats') || { strength: 0, agility: 0, intelligence: 0 };
    const currentClass = GameManager.get('currentClass') || 'Novice';
    const finalHeroStats = calculateFinalStats(selectedHeroBaseStats, equippedItems, activeSkin, heroLevel, allocatedStats, currentClass);
    
    const statusPoints = GameManager.get('statusPoints') || 0;
    const playerLevel = GameManager.get('playerLevel') || 1;

    // 2. Update Left Panel (Class & Allocation)
    this.wrapper.querySelector('#hero-class-name').innerText = currentClass;
    this.wrapper.querySelector('#hero-level-text').innerText = `Player Level ${playerLevel} (Hero Lv ${heroLevel})`;
    this.wrapper.querySelector('#hero-stat-points').innerText = `${statusPoints} Pts`;

    this.wrapper.querySelector('#val-str').innerText = allocatedStats.strength;
    this.wrapper.querySelector('#val-agi').innerText = allocatedStats.agility;
    this.wrapper.querySelector('#val-int').innerText = allocatedStats.intelligence || 0;

    // Highlight Main Attribute
    const agiClasses = ['Archer', 'Hunter', 'Assassin', 'Ranger'];
    const intClasses = ['Mage', 'Wizard', 'Summoner'];
    
    let mainAttr = 'str';
    if (agiClasses.includes(currentClass)) mainAttr = 'agi';
    if (intClasses.includes(currentClass)) mainAttr = 'int';

    ['str', 'agi', 'int'].forEach(attr => {
      const row = this.wrapper.querySelector(`#val-${attr}`).parentElement;
      const nameSpan = row.querySelector('.alloc-name');
      row.classList.remove('main-attribute-highlight');
      
      // Reset tooltips
      if (attr === 'str') nameSpan.title = "Max HP, HP Regen";
      if (attr === 'agi') nameSpan.title = "Atk Speed, Move Speed, Crit, Evasion";
      if (attr === 'int') nameSpan.title = "CD Reduc, Lifesteal, Defense";
      nameSpan.innerText = attr.toUpperCase();
      
      if (attr === mainAttr) {
        row.classList.add('main-attribute-highlight');
        nameSpan.title = "Main Attribute (Increases Attack Damage) + " + nameSpan.title;
        nameSpan.innerText = `🗡️ ${attr.toUpperCase()}`;
      }
    });

    const btnStr = this.wrapper.querySelector('#btn-add-str');
    const btnAgi = this.wrapper.querySelector('#btn-add-agi');
    const btnInt = this.wrapper.querySelector('#btn-add-int');

    if (statusPoints <= 0) {
      btnStr.disabled = true;
      btnAgi.disabled = true;
      btnInt.disabled = true;
    } else {
      btnStr.disabled = false;
      btnAgi.disabled = false;
      btnInt.disabled = false;
    }

    // 3. Update Center Panel (Avatar)
    const heroImg = this.wrapper.querySelector('#hero-avatar-img');
    heroImg.src = activeSkin?.assetPath || selectedHero.assetPath;

    // 4. Update Right Panel (Final Stats)
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
