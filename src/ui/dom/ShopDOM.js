import { getPlayerProgress, addPlayerGold, addPlayerMaterial, addPlayerTicket } from '../../systems/PlayerProgress.js';
import { soundManager } from '../../services/soundManager.js';

export class ShopDOM {
  constructor(scene, domManager) {
    this.scene = scene;
    this.domManager = domManager;

    this.shopSections = [
      {
        title: 'CRAFTING MATERIALS',
        id: 'materials',
        items: [
          { id: 'iron-ore', name: 'Iron Ore', cost: 200, desc: 'Material logam dasar.', icon: '🪨', type: 'material', amount: 1 },
          { id: 'magic-gem', name: 'Magic Gem', cost: 800, desc: 'Batu permata penuh energi.', icon: '💎', type: 'material', amount: 1 },
          { id: 'dragon-scale', name: 'Dragon Scale', cost: 2500, desc: 'Sisik naga langka.', icon: '🐉', type: 'material', amount: 1 }
        ]
      },
      {
        title: 'SPECIAL TICKETS',
        id: 'tickets',
        items: [
          { id: 'survival-ticket', name: 'Survival Ticket', cost: 1000, desc: 'Akses ke mode Survival.', icon: '🎫', type: 'ticket', amount: 1 },
          { id: 'gold-ticket', name: 'Gold Ticket', cost: 3000, desc: 'Akses ke mode Gold Rush.', icon: '🎟️', type: 'ticket', amount: 1 },
          { id: 'boss-ticket', name: 'Boss Ticket', cost: 5000, desc: 'Akses ke mode Boss Rush.', icon: '🎟️', type: 'ticket', amount: 1 }
        ]
      }
    ];
  }

  show() {
    this.scene.playerProgress = getPlayerProgress(this.scene);
    
    const htmlString = `
      <div class="shop-container">
        <div class="shop-header">
          <div class="shop-title">
            <h2>🏪 OUTPOST EXCHANGE SHOP</h2>
            <p>Tukarkan Gold dengan material kerajinan, tiket tantangan, dan peti misteri.</p>
          </div>
          <div class="shop-resources" id="shop-res">
            <!-- Injected via JS -->
          </div>
          <button class="shop-close-btn" id="btn-close-shop">✖</button>
        </div>
        
        <div class="shop-content" id="shop-content">
          <!-- Sections Injected via JS -->
        </div>
      </div>
    `;

    this.domManager.showOverlay('shop', htmlString, 'shop-overlay', (wrapper) => {
      this.wrapper = wrapper;
      
      this.wrapper.querySelector('#btn-close-shop').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.domManager.closeCurrent();
      });

      this.updateResources();
      this.renderCatalog();
    });
  }

  hide() {
    this.domManager.closeCurrent();
  }

  updateResources() {
    const resDiv = this.wrapper.querySelector('#shop-res');
    const p = this.scene.playerProgress;
    
    const gold = p.gold || 0;
    const iron = p.materials?.['iron-ore'] || 0;
    const gem = p.materials?.['magic-gem'] || 0;
    const scale = p.materials?.['dragon-scale'] || 0;
    
    resDiv.innerHTML = `
      <div class="res-item" title="Gold">💰 ${gold}</div>
      <div class="res-item" title="Iron Ore">🪨 ${iron}</div>
      <div class="res-item" title="Magic Gem">💎 ${gem}</div>
      <div class="res-item" title="Dragon Scale">🐉 ${scale}</div>
    `;

    // Re-render buttons to check affordability
    this.updateButtons(gold);
  }

  renderCatalog() {
    const content = this.wrapper.querySelector('#shop-content');
    content.innerHTML = '';

    this.shopSections.forEach(section => {
      const secDiv = document.createElement('div');
      secDiv.className = 'shop-section';
      secDiv.innerHTML = `<h3>${section.title}</h3>`;
      
      const grid = document.createElement('div');
      grid.className = 'shop-grid';
      
      section.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'shop-card';
        card.innerHTML = `
          <div class="shop-icon">${item.icon}</div>
          <div class="shop-info">
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-desc">${item.desc}</div>
            <button class="shop-buy-btn" data-id="${item.id}" data-type="${item.type}" data-cost="${item.cost}" data-amt="${item.amount}">
              💰 ${item.cost}
            </button>
          </div>
        `;
        
        const btn = card.querySelector('.shop-buy-btn');
        btn.addEventListener('click', () => {
          this.promptBuy(item);
        });

        grid.appendChild(card);
      });

      secDiv.appendChild(grid);
      content.appendChild(secDiv);
    });
  }

  updateButtons(currentGold) {
    const btns = this.wrapper.querySelectorAll('.shop-buy-btn');
    btns.forEach(btn => {
      const cost = parseInt(btn.getAttribute('data-cost'));
      if (currentGold < cost) {
        btn.disabled = true;
        btn.innerHTML = `💰 ${cost} (Not Enough)`;
      } else {
        btn.disabled = false;
        btn.innerHTML = `💰 ${cost} - BUY`;
      }
    });
  }

  promptBuy(item) {
    soundManager.playSFX(this.scene, 'click');
    
    const existingModal = this.wrapper.querySelector('.shop-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'shop-modal';
    modal.innerHTML = `
      <h3>Beli ${item.name}?</h3>
      <p>Harga: 💰 ${item.cost}</p>
      <div class="shop-modal-actions">
        <button class="shop-modal-btn btn-confirm">Beli</button>
        <button class="shop-modal-btn btn-cancel">Batal</button>
      </div>
    `;

    this.wrapper.appendChild(modal);

    modal.querySelector('.btn-confirm').addEventListener('click', () => {
      this.executeBuy(item, modal);
    });

    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      soundManager.playSFX(this.scene, 'click');
      modal.remove();
    });
  }

  executeBuy(item, modal) {
    const p = this.scene.playerProgress;
    if (p.gold >= item.cost) {
      addPlayerGold(this.scene, -item.cost);
      
      if (item.type === 'material') {
        addPlayerMaterial(this.scene, item.id, item.amount);
      } else if (item.type === 'ticket') {
        addPlayerTicket(this.scene, item.id, item.amount);
      }
      
      soundManager.playSFX(this.scene, 'upgrade');
      modal.innerHTML = `<h3 style="color: #4ade80;">Pembelian Sukses!</h3>`;
      
      // Update resources globally and re-render
      this.scene.playerProgress = getPlayerProgress(this.scene);
      this.updateResources();

      setTimeout(() => {
        if (modal.parentNode) modal.remove();
      }, 1000);
    } else {
      soundManager.playSFX(this.scene, 'error');
      modal.innerHTML = `<h3 style="color: #f87171;">Gold Tidak Cukup!</h3>`;
      setTimeout(() => {
        if (modal.parentNode) modal.remove();
      }, 1000);
    }
  }
}
