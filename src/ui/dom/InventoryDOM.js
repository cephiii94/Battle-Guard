import { 
  getInventoryItems, 
  getEquippedItemBySlot, 
  getEquippedItems,
  getEquipmentById,
  equipItem, 
  unequipSlot, 
  EQUIPMENT_SLOTS 
} from '../../systems/EquipmentInventory.js';
import equipmentSets from '../../data/equipmentSets.js';

export class InventoryDOM {
  constructor(scene, domManager) {
    this.scene = scene;
    this.domManager = domManager;
    this.activeFilter = 'all'; // 'all', 'weapon', 'armor', 'accessory'
    this.selectedItem = null;
  }

  show() {
    this.domManager.showOverlay('inventory', this.getHTML(), 'inventory-overlay', (wrapper) => this.onMount(wrapper));
  }

  getHTML() {
    return `
      <div class="inv-container">
        <!-- HEADER -->
        <div class="inv-header">
          <h2>INVENTORY</h2>
          <button class="inv-close-btn" id="inv-close-btn">X</button>
        </div>
        
        <div class="inv-body">
          <!-- LEFT: Hero Showcase -->
          <div class="inv-left">
            <div class="inv-hero-circle">
              <img id="inv-hero-img" src="" alt="Hero" />
            </div>
            <div class="inv-slots" id="inv-equip-slots"></div>
          </div>
          
          <!-- RIGHT: Grid & Detail -->
          <div class="inv-right">
            <!-- Tabs -->
            <div class="inv-tabs">
              <button class="inv-tab active" data-filter="all">ALL</button>
              <button class="inv-tab" data-filter="weapon">WEAPONS</button>
              <button class="inv-tab" data-filter="armor">ARMOR</button>
              <button class="inv-tab" data-filter="accessory">ACC</button>
            </div>
            
            <div class="inv-grid-wrapper">
              <div class="inv-grid" id="inv-grid">
                <!-- items injected via JS -->
              </div>
            </div>
            
            <div class="inv-detail-panel" id="inv-detail">
               <p class="inv-placeholder">Select an item</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  onMount(wrapper) {
    this.wrapper = wrapper;
    
    // Bind Close
    wrapper.querySelector('#inv-close-btn').addEventListener('click', () => {
      this.scene.soundManager?.playSFX(this.scene, 'click');
      this.domManager.closeCurrent();
    });

    // Bind Filters
    const tabs = wrapper.querySelectorAll('.inv-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.scene.soundManager?.playSFX(this.scene, 'click');
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.activeFilter = e.target.dataset.filter;
        this.selectedItem = null;
        this.render();
      });
    });

    this.render();
  }

  render() {
    this.renderHeroArea();
    this.renderGrid();
    this.renderDetail();
  }

  renderHeroArea() {
    const heroImg = this.wrapper.querySelector('#inv-hero-img');
    const activeSkin = this.scene.activeSkin;
    const visualKey = activeSkin?.assetPath || this.scene.selectedHero.assetPath;
    heroImg.src = visualKey; 

    const slotsContainer = this.wrapper.querySelector('#inv-equip-slots');
    slotsContainer.innerHTML = '';
    
    EQUIPMENT_SLOTS.forEach(slotType => {
      const equipped = getEquippedItemBySlot(this.scene, slotType);
      
      const slotEl = document.createElement('div');
      slotEl.className = 'inv-equip-slot';
      if (equipped) {
        slotEl.innerHTML = `
          <div class="item-icon-text">${equipped.icon || '?'}</div>
          <div class="slot-badge">${slotType}</div>
        `;
        slotEl.addEventListener('click', () => {
          this.selectedItem = equipped;
          this.scene.soundManager?.playSFX(this.scene, 'click');
          this.updateSelectionVisuals();
          this.renderDetail();
        });
      } else {
        slotEl.innerHTML = `<span class="empty-slot">${slotType.substring(0, 3)}</span>`;
      }
      slotsContainer.appendChild(slotEl);
    });
  }

  renderGrid() {
    const grid = this.wrapper.querySelector('#inv-grid');
    grid.innerHTML = '';

    const allItems = getInventoryItems(this.scene);
    const filtered = this.activeFilter === 'all' ? allItems : allItems.filter(i => i.slot === this.activeFilter);

    filtered.forEach(item => {
      const box = document.createElement('div');
      const rarity = item.rarity || 'common';
      box.className = `inv-item-box rarity-${rarity}`;
      box.dataset.itemId = item.id;
      if (this.selectedItem && this.selectedItem.id === item.id) {
        box.classList.add('selected');
      }

      // Check if equipped
      const isEquipped = EQUIPMENT_SLOTS.some(slot => {
        const eq = getEquippedItemBySlot(this.scene, slot);
        return eq && eq.id === item.id;
      });

      box.innerHTML = `
        <div class="item-icon-text">${item.icon || '?'}</div>
        ${isEquipped ? '<div class="eq-badge">E</div>' : ''}
      `;

      box.addEventListener('click', () => {
        this.selectedItem = item;
        this.scene.soundManager?.playSFX(this.scene, 'click');
        this.updateSelectionVisuals(); 
        this.renderDetail();
      });

      grid.appendChild(box);
    });
  }

  updateSelectionVisuals() {
    // Only update the 'selected' class to avoid rebuilding images (blinking)
    const boxes = this.wrapper.querySelectorAll('.inv-item-box');
    boxes.forEach(box => {
      if (this.selectedItem && box.dataset.itemId === this.selectedItem.id) {
        box.classList.add('selected');
      } else {
        box.classList.remove('selected');
      }
    });
  }

  renderDetail() {
    const detail = this.wrapper.querySelector('#inv-detail');
    if (!this.selectedItem) {
      detail.innerHTML = '<p class="inv-placeholder">Select an item</p>';
      return;
    }

    const item = this.selectedItem;
    const isEquipped = EQUIPMENT_SLOTS.some(slot => {
      const eq = getEquippedItemBySlot(this.scene, slot);
      return eq && eq.id === item.id;
    });

    let actionBtnHTML = '';
    if (isEquipped) {
      actionBtnHTML = `<button class="inv-action-btn unequip" id="btn-unequip">UNEQUIP</button>`;
    } else {
      actionBtnHTML = `<button class="inv-action-btn equip" id="btn-equip">EQUIP</button>`;
    }

    const rarity = item.rarity || 'common';
    const slot = item.slot || 'unknown';
    const desc = item.description || 'A powerful item found in the world.';

    // Equipment Set Calculations
    const itemSet = equipmentSets.find(set => set.items.includes(item.id));
    let setInfoHtml = '';
    
    if (itemSet) {
      const equippedItemsList = getEquippedItems(this.scene);
      const equippedIds = equippedItemsList.map(eq => eq.id);
      const equippedCount = itemSet.items.filter(itemId => equippedIds.includes(itemId)).length;
      
      const itemsHtml = itemSet.items.map(itemId => {
        const isPartEquipped = equippedIds.includes(itemId);
        const partItem = getEquipmentById(itemId);
        const name = partItem ? partItem.name : itemId;
        return `<span class="set-item-name ${isPartEquipped ? 'active' : ''}">${name}</span>`;
      }).join(', ');

      const bonusesHtml = Object.entries(itemSet.bonuses).map(([thresholdStr, bonus]) => {
        const threshold = parseInt(thresholdStr, 10);
        const isActive = equippedCount >= threshold;
        const statDescriptions = Object.entries(bonus).map(([statName, value]) => {
          return `${statName}: +${value}`;
        }).join(', ');
        return `
          <div class="set-bonus-row ${isActive ? 'active' : ''}">
            (${threshold} Set): ${statDescriptions}
          </div>
        `;
      }).join('');

      setInfoHtml = `
        <div class="detail-set-info">
          <div class="set-header">${itemSet.name} (${equippedCount}/${itemSet.items.length})</div>
          <div class="set-items-list">
            Set: ${itemsHtml}
          </div>
          <div class="set-bonuses">
            ${bonusesHtml}
          </div>
        </div>
      `;
    }

    detail.innerHTML = `
      <div class="detail-header">
        <div class="item-icon-text large">${item.icon || '?'}</div>
        <div>
          <h3>${item.name}</h3>
          <p class="rarity-${rarity} text-sm">${rarity.toUpperCase()} ${slot.toUpperCase()}</p>
        </div>
      </div>
      <p class="detail-desc">${desc}</p>
      <div class="detail-stats">
        ${Object.keys(item.bonus || {}).map(stat => `
          <div class="stat-row">
            <span>${stat}</span>
            <span class="stat-val">+${item.bonus[stat]}</span>
          </div>
        `).join('')}
      </div>
      ${setInfoHtml}
      <div class="detail-actions">
        ${actionBtnHTML}
      </div>
    `;

    // Bind action buttons
    const btnEquip = detail.querySelector('#btn-equip');
    if (btnEquip) {
      btnEquip.addEventListener('click', () => {
        equipItem(this.scene, item.id);
        this.scene.soundManager?.playSFX(this.scene, 'click'); 
        this.scene.refreshHeroLoadout();
        this.scene.refreshBottomStats();
        this.render();
      });
    }

    const btnUnequip = detail.querySelector('#btn-unequip');
    if (btnUnequip) {
      btnUnequip.addEventListener('click', () => {
        unequipSlot(this.scene, item.slot);
        this.scene.soundManager?.playSFX(this.scene, 'click');
        this.scene.refreshHeroLoadout();
        this.scene.refreshBottomStats();
        this.render();
      });
    }
  }
}
