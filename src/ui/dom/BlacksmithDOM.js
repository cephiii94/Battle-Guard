import { getPlayerProgress, addPlayerGold, addPlayerMaterial } from '../../systems/PlayerProgress.js';
import craftingRecipes from '../../data/crafting.js';
import { getEquipmentById, addEquipmentToInventory } from '../../systems/EquipmentInventory.js';
import { soundManager } from '../../services/soundManager.js';

export class BlacksmithDOM {
  constructor(scene, domManager) {
    this.scene = scene;
    this.domManager = domManager;
    this.selectedRecipeIndex = 0;
    this.isForging = false;
  }

  show() {
    this.scene.playerProgress = getPlayerProgress(this.scene);
    
    const htmlString = `
      <div class="blacksmith-container">
        <div class="blacksmith-header">
          <div class="blacksmith-title">
            <h2>⚒️ BLACKSMITH FORGE</h2>
            <p>Tempa persenjataan modern menggunakan material langka hasil pertempuran.</p>
          </div>
          <div class="blacksmith-resources" id="blacksmith-res">
            <!-- Injected -->
          </div>
          <button class="blacksmith-close-btn" id="btn-close-blacksmith">✖</button>
        </div>
        
        <div class="blacksmith-content">
          <div class="blacksmith-panel left">
            <div class="panel-title blue">BLUEPRINTS</div>
            <div class="recipe-list" id="recipe-list"></div>
          </div>
          
          <div class="blacksmith-panel center">
            <div class="forge-chamber" id="forge-chamber"></div>
          </div>
          
          <div class="blacksmith-panel right">
            <div class="panel-title yellow">EQUIPMENT SPECS</div>
            <div class="specs-content" id="specs-content"></div>
          </div>
        </div>
      </div>
    `;

    this.domManager.showOverlay('blacksmith', htmlString, 'blacksmith-overlay', (wrapper) => {
      this.wrapper = wrapper;
      
      this.wrapper.querySelector('#btn-close-blacksmith').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.domManager.closeCurrent();
      });

      this.updateAll();
    });
  }

  hide() {
    this.domManager.closeCurrent();
  }

  updateAll() {
    this.updateResources();
    this.renderRecipes();
    this.renderForgeChamber();
    this.renderSpecs();
  }

  updateResources() {
    const resDiv = this.wrapper.querySelector('#blacksmith-res');
    const p = this.scene.playerProgress;
    
    const iron = p.materials?.['iron-ore'] || 0;
    const gem = p.materials?.['magic-gem'] || 0;
    const scale = p.materials?.['dragon-scale'] || 0;
    
    resDiv.innerHTML = `
      <div class="res-item" title="Iron Ore">🪨 ${iron}</div>
      <div class="res-item" title="Magic Gem">💎 ${gem}</div>
      <div class="res-item" title="Dragon Scale">🐉 ${scale}</div>
    `;
  }

  renderRecipes() {
    const list = this.wrapper.querySelector('#recipe-list');
    list.innerHTML = '';
    
    const p = this.scene.playerProgress;
    const owned = p.ownedEquipment || [];

    craftingRecipes.forEach((recipe, idx) => {
      const isSelected = idx === this.selectedRecipeIndex;
      const itemData = getEquipmentById(recipe.resultItemId);
      if (!itemData) return;

      const isOwned = owned.includes(recipe.resultItemId);

      const card = document.createElement('div');
      card.className = `recipe-card ${isSelected ? 'active' : ''} ${isOwned ? 'owned' : ''}`;
      card.innerHTML = `
        <div class="recipe-icon">${itemData.icon}</div>
        <div class="recipe-info">
          <div class="recipe-name">${itemData.name.toUpperCase()}</div>
          <div class="recipe-slot">${itemData.slot}</div>
        </div>
        <div class="recipe-cost">${isOwned ? 'CRAFTED' : '💰 ' + recipe.costGold}</div>
      `;

      card.addEventListener('click', () => {
        if (this.isForging) return;
        soundManager.playSFX(this.scene, 'click');
        this.selectedRecipeIndex = idx;
        this.updateAll();
      });

      list.appendChild(card);
    });
  }

  renderForgeChamber() {
    const chamber = this.wrapper.querySelector('#forge-chamber');
    chamber.innerHTML = '';

    const recipe = craftingRecipes[this.selectedRecipeIndex];
    if (!recipe) return;

    const itemData = getEquipmentById(recipe.resultItemId);
    const p = this.scene.playerProgress;
    const isOwned = p.ownedEquipment?.includes(recipe.resultItemId);
    const currentGold = p.gold || 0;

    // Build materials list
    let canCraft = currentGold >= recipe.costGold;
    
    const mats = [];
    mats.push({
      icon: '💰',
      owned: currentGold,
      req: recipe.costGold,
      sufficient: currentGold >= recipe.costGold
    });

    Object.entries(recipe.materials).forEach(([matId, reqQty]) => {
      const ownedQty = p.materials?.[matId] || 0;
      const matIcons = { 'iron-ore': '🪨', 'magic-gem': '💎', 'dragon-scale': '🐉' };
      const suf = ownedQty >= reqQty;
      if (!suf) canCraft = false;
      
      mats.push({
        icon: matIcons[matId] || '❓',
        owned: ownedQty,
        req: reqQty,
        sufficient: suf
      });
    });

    let actionHTML = '';
    if (isOwned) {
      actionHTML = `<div class="btn-crafted">✓ TELAH DIMILIKI</div>`;
    } else if (this.isForging) {
      actionHTML = `
        <div class="progress-bar-container">
          <div class="progress-bar-fill" id="forge-progress"></div>
        </div>
        <div class="progress-text">MENEMPA PERALATAN...</div>
      `;
    } else {
      actionHTML = `
        <button class="btn-forge" id="btn-forge" ${canCraft ? '' : 'disabled'}>
          ${canCraft ? 'TEMPA PERALATAN' : 'BAHAN TIDAK CUKUP'}
        </button>
      `;
    }

    chamber.innerHTML = `
      <svg class="forge-rings" viewBox="0 0 300 300">
        <circle cx="150" cy="150" r="110" />
        <circle cx="150" cy="150" r="80" />
        <circle cx="150" cy="150" r="50" stroke="#ff8c00" />
      </svg>
      
      <div class="forge-target ${isOwned ? 'owned' : ''}">
        <div class="forge-target-label">TARGET TEMPA</div>
        ${itemData.icon}
      </div>
      
      <div class="forge-materials-label">SLOT BAHAN / MATERIAL PENEMPAAN</div>
      <div class="forge-materials">
        ${mats.map(m => `
          <div class="forge-material-slot ${m.sufficient ? 'sufficient' : ''}">
            <div class="mat-icon">${m.icon}</div>
            <div class="mat-count">${m.owned}/${m.req}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="forge-action">
        ${actionHTML}
      </div>
    `;

    if (!isOwned && !this.isForging && canCraft) {
      chamber.querySelector('#btn-forge').addEventListener('click', () => {
        this.startForging(recipe);
      });
    }

    if (this.isForging) {
      setTimeout(() => {
        const fill = chamber.querySelector('#forge-progress');
        if (fill) fill.style.width = '100%';
      }, 50);
    }
  }

  startForging(recipe) {
    this.isForging = true;
    soundManager.playSFX(this.scene, 'upgrade');
    this.renderForgeChamber();

    setTimeout(() => {
      this.executeCrafting(recipe);
    }, 1200);
  }

  executeCrafting(recipe) {
    addPlayerGold(this.scene, -recipe.costGold);
    Object.entries(recipe.materials).forEach(([matId, qty]) => {
      addPlayerMaterial(this.scene, matId, -qty);
    });

    addEquipmentToInventory(this.scene, recipe.resultItemId);

    this.isForging = false;
    soundManager.playSFX(this.scene, 'upgrade');
    this.scene.showFeedback('Peralatan berhasil ditempa!');
    
    // Refresh global scene items too
    this.scene.refreshHeroLoadout();
    this.scene.refreshBottomStats();
    
    this.updateAll();
  }

  renderSpecs() {
    const specs = this.wrapper.querySelector('#specs-content');
    specs.innerHTML = '';

    const recipe = craftingRecipes[this.selectedRecipeIndex];
    if (!recipe) return;

    const itemData = getEquipmentById(recipe.resultItemId);
    const p = this.scene.playerProgress;
    const isOwned = p.ownedEquipment?.includes(recipe.resultItemId);

    const labels = {
      hp: 'Maks HP', damage: 'Serangan (ATK)', attackSpeed: 'Kecepatan Serang',
      moveSpeed: 'Kecepatan Gerak', criticalChance: 'Peluang Kritis', healthRegen: 'Regen HP',
      armor: 'Pertahanan (Armor)', lifesteal: 'Life Steal', evasion: 'Evasion',
      cooldownReduction: 'CDR'
    };

    const statRows = Object.entries(itemData.bonus).map(([statName, val]) => {
      const sign = val >= 0 ? '+' : '';
      const displayVal = (['criticalChance', 'lifesteal', 'evasion', 'cooldownReduction'].includes(statName))
        ? `${sign}${Math.round(val * 100)}%` : `${sign}${val}`;
      return `
        <div class="stat-row">
          <div class="stat-label">⚡ ${labels[statName] || statName}</div>
          <div class="stat-value">${displayVal}</div>
        </div>
      `;
    }).join('');

    specs.innerHTML = `
      <div class="specs-icon ${isOwned ? 'owned' : ''}">${itemData.icon}</div>
      <div class="specs-name ${isOwned ? 'owned' : ''}">${itemData.name.toUpperCase()}</div>
      <div class="specs-slot">${itemData.slot}</div>
      
      <div class="specs-divider"></div>
      
      <div class="specs-stats">
        <div class="specs-stats-title">STAT BONUS</div>
        ${statRows}
      </div>
      
      <div class="specs-desc">Item yang ditempa akan otomatis masuk ke dalam inventori perlengkapan Pahlawan.</div>
      
      <div class="specs-status ${isOwned ? 'owned' : 'ready'}">
        ${isOwned ? '✓ TELAH DIMILIKI' : '⚒️ SIAP DI-TEMPA'}
      </div>
    `;
  }
}
