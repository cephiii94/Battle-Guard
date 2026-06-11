import Phaser from 'phaser';
import { getPlayerProgress, addPlayerGold, addPlayerMaterial, addPlayerTicket } from '../../systems/PlayerProgress.js';
import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';

export class ShopTab {
  constructor(scene) {
    this.scene = scene;
    this.layer = [];
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.layer.push(item);
    return item;
  }

  clear() {
    this.layer.forEach((item) => item.destroy());
    this.layer = [];
  }

  isActive() {
    return this.layer.length > 0;
  }

  show() {
    this.scene.clearAllTabs();
    this.scene.refreshHeroLoadout();
    this.scene.playerProgress = getPlayerProgress(this.scene);

    const { width, height } = this.scene.scale;

    // Background Gradient matching MainMenuScene
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(0xdbeefb, 0xdbeefb, 0xaad4fc, 0x89c5f8, 1);
    bg.fillRect(0, 0, width, height);

    // Floor grids (perspective)
    const floorY = height * 0.65;
    bg.lineStyle(1.5, 0x4aa6f7, 0.45);

    const numHoriz = 12;
    for (let i = 0; i <= numHoriz; i++) {
      const ratio = i / numHoriz;
      const py = floorY + (height - floorY) * Math.pow(ratio, 1.8);
      bg.lineBetween(0, py, width, py);
    }

    const numVert = 20;
    const vpX = width / 2;
    const vpY = floorY - 80;
    for (let i = -numVert / 2; i <= numVert / 2; i++) {
      const startX = width / 2 + i * 90;
      bg.lineBetween(vpX + i * 12, vpY, startX, height);
    }
    this.add(bg);

    // Header Title
    this.add(
      this.scene.add.text(185, 38, '🏪 OUTPOST EXCHANGE SHOP', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '28px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#07111f',
        strokeThickness: 4,
      }).setOrigin(0, 0.5)
    );

    this.add(
      this.scene.add.text(185, 68, 'Tukarkan Gold dengan material kerajinan, tiket tantangan, dan peti misteri.', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '13px',
        color: '#9af2ff',
        fontStyle: '800',
        stroke: '#07111f',
        strokeThickness: 2,
      }).setOrigin(0, 0.5)
    );

    // Close button top-left
    const closeBtn = this.add(
      this.scene.add.rectangle(110, 52, 42, 42, 0xd97706, 1)
        .setStrokeStyle(2, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );
    const closeText = this.add(
      this.scene.add.text(110, 52, '◀', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );
    closeBtn.on('pointerover', () => {
      closeBtn.setScale(1.1);
      closeText.setScale(1.1);
      soundManager.playSFX(this.scene, 'hover');
    });
    closeBtn.on('pointerout', () => {
      closeBtn.setScale(1);
      closeText.setScale(1);
    });
    closeBtn.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      this.clear();
    });

    // Material and Currency Status Panel (Top Right)
    const gold = this.scene.playerProgress.gold;
    const ironQty = this.scene.playerProgress.materials ? (this.scene.playerProgress.materials['iron-ore'] || 0) : 0;
    const gemQty = this.scene.playerProgress.materials ? (this.scene.playerProgress.materials['magic-gem'] || 0) : 0;
    const scaleQty = this.scene.playerProgress.materials ? (this.scene.playerProgress.materials['dragon-scale'] || 0) : 0;
    const survTicket = this.scene.playerProgress.tickets ? (this.scene.playerProgress.tickets['survival-ticket'] || 0) : 0;
    const goldTicket = this.scene.playerProgress.tickets ? (this.scene.playerProgress.tickets['gold-ticket'] || 0) : 0;
    const bossTicket = this.scene.playerProgress.tickets ? (this.scene.playerProgress.tickets['boss-ticket'] || 0) : 0;

    const resX = width - 640;
    const resY = 38;
    this.add(
      this.scene.add.rectangle(resX + 280, resY + 12, 580, 54, 0x07111f, 0.9)
        .setStrokeStyle(2, 0x4aa6f7, 0.8)
    );

    this.add(
      this.scene.add.text(resX + 10, resY + 12, `💰 ${this.scene.formatCurrency(gold)}   🪨 ${ironQty}  💎 ${gemQty}  🐉 ${scaleQty}   🎫 ${survTicket}  🎟️ ${goldTicket}  🎟️ ${bossTicket}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: '900'
      }).setOrigin(0, 0.5)
    );

    // Shop Items Definition
    const shopSections = [
      {
        title: 'CRAFTING MATERIALS',
        color: 0x69e6ff,
        items: [
          {
            id: 'iron-ore',
            name: 'Iron Ore',
            cost: 200,
            description: 'Material logam dasar.',
            icon: '🪨',
            type: 'material',
            amount: 1
          },
          {
            id: 'magic-gem',
            name: 'Magic Gem',
            cost: 800,
            description: 'Permata magis langka.',
            icon: '💎',
            type: 'material',
            amount: 1
          },
          {
            id: 'dragon-scale',
            name: 'Dragon Scale',
            cost: 2500,
            description: 'Sisik naga purba.',
            icon: '🐉',
            type: 'material',
            amount: 1
          }
        ]
      },
      {
        title: 'DAILY TICKETS',
        color: 0xffdc5a,
        items: [
          {
            id: 'survival-ticket',
            name: 'Survival Ticket',
            cost: 1500,
            description: 'Akses ke mode Survival.',
            icon: '🎫',
            type: 'ticket',
            amount: 1
          },
          {
            id: 'gold-ticket',
            name: 'Gold Ticket',
            cost: 1500,
            description: 'Akses ke Gold Farm.',
            icon: '🎫',
            type: 'ticket',
            amount: 1
          },
          {
            id: 'boss-ticket',
            name: 'Boss Ticket',
            cost: 3000,
            description: 'Akses ke Boss Looting.',
            icon: '🎟️',
            type: 'ticket',
            amount: 1
          }
        ]
      },
      {
        title: 'MYSTERY CHESTS',
        color: 0xff1744,
        items: [
          {
            id: 'common-chest',
            name: 'Common Chest',
            cost: 1000,
            description: 'Dapat 5-15 acak Iron Ore.',
            icon: '📦',
            type: 'chest',
            roll: () => {
              const amount = Phaser.Math.Between(5, 15);
              return {
                type: 'material',
                id: 'iron-ore',
                amount,
                message: `Dapat ${amount} Iron Ore!`
              };
            }
          },
          {
            id: 'rare-chest',
            name: 'Rare Chest',
            cost: 4000,
            description: 'Dapat Gems & Dragon Scales.',
            icon: '🧰',
            type: 'chest',
            roll: () => {
              const gems = Phaser.Math.Between(2, 5);
              const scales = Phaser.Math.Between(1, 2);
              return {
                type: 'multi-material',
                items: [
                  { id: 'magic-gem', amount: gems },
                  { id: 'dragon-scale', amount: scales }
                ],
                message: `Dapat ${gems} Gems & ${scales} Scales!`
              };
            }
          },
          {
            id: 'premium-chest',
            name: 'Premium Chest',
            cost: 8000,
            description: 'Paket Tiket + Dragon Scale.',
            icon: '👑',
            type: 'chest',
            roll: () => {
              return {
                type: 'multi-all',
                items: [
                  { type: 'ticket', id: 'survival-ticket', amount: 1 },
                  { type: 'ticket', id: 'gold-ticket', amount: 1 },
                  { type: 'ticket', id: 'boss-ticket', amount: 1 },
                  { type: 'material', id: 'dragon-scale', amount: 1 }
                ],
                message: `Dapat 3 Tiket + 1 Dragon Scale!`
              };
            }
          }
        ]
      }
    ];

    // Grid Coordinates setup
    const startX = 220;
    const startY = 160;
    const columnGap = 420;
    const cardGapY = 166;
    const cardW = 340;
    const cardH = 136;

    shopSections.forEach((section, colIdx) => {
      const colX = startX + colIdx * columnGap;

      // Section Title
      this.add(
        this.scene.add.text(colX, startY, section.title, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '15px',
          color: section.color,
          fontStyle: '900',
          stroke: '#07111f',
          strokeThickness: 3
        }).setOrigin(0.5, 0.5)
      );

      section.items.forEach((item, rowIdx) => {
        const cardY = startY + 45 + rowIdx * cardGapY;

        // Card Frame
        const cardBg = this.add(
          this.scene.add.rectangle(colX, cardY + cardH / 2, cardW, cardH, 0x07111f, 0.95)
            .setStrokeStyle(2.5, section.color, 0.8)
        );

        // Icon Circle
        this.add(this.scene.add.circle(colX - 110, cardY + cardH / 2, 28, 0x0c1e3d, 1))
          .setStrokeStyle(2, section.color, 1);
        this.add(this.scene.add.text(colX - 110, cardY + cardH / 2, item.icon, { fontSize: '26px' }).setOrigin(0.5));

        // Item Name
        this.add(
          this.scene.add.text(colX - 70, cardY + 20, item.name, {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '15px',
            color: UI.white,
            fontStyle: '900'
          })
        );

        // Item Description
        this.add(
          this.scene.add.text(colX - 70, cardY + 44, item.description, {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '10px',
            color: '#89c5f8',
            fontStyle: '700',
            wordWrap: { width: 190 }
          })
        );

        // Cost
        this.add(
          this.scene.add.text(colX - 70, cardY + 84, `💰 ${this.scene.formatCurrency(item.cost)}`, {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '13px',
            color: UI.yellow,
            fontStyle: '900'
          })
        );

        // Buy button
        const canBuy = gold >= item.cost;
        const buyBtn = this.add(
          this.scene.add.rectangle(colX + 100, cardY + cardH / 2 + 30, 80, 32, canBuy ? 0x15803d : 0x334155, 1)
            .setStrokeStyle(1.5, canBuy ? 0x22c55e : 0x475569, 1)
        );
        const buyText = this.add(
          this.scene.add.text(colX + 100, cardY + cardH / 2 + 30, 'BELI', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '12px',
            color: canBuy ? '#ffffff' : '#94a3b8',
            fontStyle: '900'
          }).setOrigin(0.5)
        );

        if (canBuy) {
          buyBtn.setInteractive({ useHandCursor: true });
          buyBtn.on('pointerover', () => {
            buyBtn.setScale(1.05);
            buyText.setScale(1.05);
            cardBg.setScale(1.02);
            soundManager.playSFX(this.scene, 'hover');
          });
          buyBtn.on('pointerout', () => {
            buyBtn.setScale(1);
            buyText.setScale(1);
            cardBg.setScale(1);
          });
          buyBtn.on('pointerup', () => {
            this.handlePurchase(item);
          });
        }
      });
    });
  }

  handlePurchase(item) {
    const currentGold = this.scene.playerProgress.gold;
    if (currentGold < item.cost) {
      soundManager.playSFX(this.scene, 'hit');
      this.showPurchaseFeedback(false, 'Gold kurang!', this.scene.scale.width / 2, this.scene.scale.height / 2);
      return;
    }

    // Deduct gold
    const nextGold = addPlayerGold(this.scene, -item.cost);
    this.scene.playerProgress.gold = nextGold;
    if (this.scene.goldText) {
      this.scene.goldText.setText(this.scene.formatCurrency(nextGold));
    }

    let feedbackMessage = '';

    // Handle reward types
    if (item.type === 'material') {
      addPlayerMaterial(this.scene, item.id, item.amount);
      soundManager.playSFX(this.scene, 'upgrade');
      feedbackMessage = `+${item.amount} ${item.name}!`;
    } else if (item.type === 'ticket') {
      addPlayerTicket(this.scene, item.id, item.amount);
      soundManager.playSFX(this.scene, 'upgrade');
      feedbackMessage = `+${item.amount} ${item.name}!`;
    } else if (item.type === 'chest') {
      soundManager.playSFX(this.scene, 'upgrade');
      const rollResult = item.roll();
      feedbackMessage = rollResult.message;

      // Distribute rewards from chest
      if (rollResult.type === 'material') {
        addPlayerMaterial(this.scene, rollResult.id, rollResult.amount);
      } else if (rollResult.type === 'multi-material') {
        rollResult.items.forEach((it) => {
          addPlayerMaterial(this.scene, it.id, it.amount);
        });
      } else if (rollResult.type === 'multi-all') {
        rollResult.items.forEach((it) => {
          if (it.type === 'material') {
            addPlayerMaterial(this.scene, it.id, it.amount);
          } else if (it.type === 'ticket') {
            addPlayerTicket(this.scene, it.id, it.amount);
          }
        });
      }
    }

    this.showPurchaseFeedback(true, feedbackMessage, this.scene.scale.width / 2, this.scene.scale.height / 2);
    
    // Refresh Shop View to update gold/materials displays & check afford states
    this.show();
  }

  showPurchaseFeedback(success, message, x, y) {
    const feedbackText = this.scene.add.text(x, y - 50, message, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '24px',
      color: success ? '#4ade80' : '#f87171',
      fontStyle: '900',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    feedbackText.setDepth(3000);

    this.scene.tweens.add({
      targets: feedbackText,
      y: y - 110,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => feedbackText.destroy()
    });
  }
}
