import { getPlayerProgress, addPlayerGold, addPlayerMaterial } from '../../systems/PlayerProgress.js';
import craftingRecipes from '../../data/crafting.js';
import { getEquipmentById, formatEquipmentBonus, addEquipmentToInventory } from '../../systems/EquipmentInventory.js';
import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';

export class BlacksmithTab {
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

    // Background Gradient matching Menu Scene
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
      this.scene.add.text(185, 38, '⚒️ BLACKSMITH CRAFTING', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '28px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#07111f',
        strokeThickness: 4,
      }).setOrigin(0, 0.5)
    );

    this.add(
      this.scene.add.text(185, 68, 'Tempa perlengkapan tempur baru menggunakan material dari looting boss.', {
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
    closeBtn.on('pointerover', () => { closeBtn.setScale(1.1); closeText.setScale(1.1); soundManager.playSFX(this.scene, 'hover'); });
    closeBtn.on('pointerout', () => { closeBtn.setScale(1); closeText.setScale(1); });
    closeBtn.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      this.clear();
    });

    // Material Resources Panel (Top Right)
    const resX = width - 360;
    const resY = 38;
    this.add(
      this.scene.add.rectangle(resX + 160, resY + 12, 340, 54, 0x07111f, 0.9)
        .setStrokeStyle(2, 0x4aa6f7, 0.8)
    );

    const ironQty = this.scene.playerProgress.materials ? (this.scene.playerProgress.materials['iron-ore'] || 0) : 0;
    const gemQty = this.scene.playerProgress.materials ? (this.scene.playerProgress.materials['magic-gem'] || 0) : 0;
    const scaleQty = this.scene.playerProgress.materials ? (this.scene.playerProgress.materials['dragon-scale'] || 0) : 0;

    this.add(
      this.scene.add.text(resX + 10, resY + 12, `🪨 ${ironQty}  💎 ${gemQty}  🐉 ${scaleQty}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: '900'
      }).setOrigin(0, 0.5)
    );

    // Crafting Recipes list (Grid)
    const startRecipeX = 200;
    const startRecipeY = 170;
    const cardW = 420;
    const cardH = 150;
    const gapX = 460;
    const gapY = 170;

    craftingRecipes.forEach((recipe, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const rx = startRecipeX + col * gapX;
      const ry = startRecipeY + row * gapY;

      const itemData = getEquipmentById(recipe.resultItemId);
      if (!itemData) return;

      const isOwned = this.scene.playerProgress.ownedEquipment && this.scene.playerProgress.ownedEquipment.includes(recipe.resultItemId);

      // Recipe Card Frame
      this.add(
        this.scene.add.rectangle(rx + cardW / 2, ry + cardH / 2, cardW, cardH, 0x07111f, 0.95)
          .setStrokeStyle(2, isOwned ? 0x4ade80 : 0x4aa6f7, 0.8)
      );

      // Icon Display
      this.add(this.scene.add.circle(rx + 50, ry + 75, 30, 0x0c1e3d, 1))
        .setStrokeStyle(2, isOwned ? 0x4ade80 : 0x4aa6f7, 1);
      this.add(this.scene.add.text(rx + 50, ry + 75, itemData.icon, { fontSize: '28px' }).setOrigin(0.5));

      // Title
      this.add(
        this.scene.add.text(rx + 100, ry + 20, itemData.name.toUpperCase(), {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '16px',
          color: isOwned ? '#4ade80' : UI.yellow,
          fontStyle: '900'
        })
      );

      // Type/Slot
      this.add(
        this.scene.add.text(rx + 100, ry + 42, `SLOT: ${itemData.slot.toUpperCase()}`, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '10px',
          color: '#89c5f8',
          fontStyle: '800'
        })
      );

      // Stats
      const statBonusText = formatEquipmentBonus(itemData);
      this.add(
        this.scene.add.text(rx + 100, ry + 56, statBonusText, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '11px',
          color: '#ffffff',
          fontStyle: '800'
        })
      );

      // Materials Cost Display
      let costStrings = [];
      let canCraft = true;

      const currentGold = this.scene.playerProgress.gold;
      if (currentGold < recipe.costGold) canCraft = false;

      costStrings.push(`💰 ${recipe.costGold}`);

      Object.entries(recipe.materials).forEach(([matId, qty]) => {
        const ownedQty = this.scene.playerProgress.materials ? (this.scene.playerProgress.materials[matId] || 0) : 0;
        const matIcons = { 'iron-ore': '🪨', 'magic-gem': '💎', 'dragon-scale': '🐉' };
        if (ownedQty < qty) canCraft = false;

        costStrings.push(`${matIcons[matId] || ''} ${ownedQty}/${qty}`);
      });

      this.add(
        this.scene.add.text(rx + 100, ry + 82, costStrings.join('   '), {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '11px',
          color: '#cbd5e1',
          fontStyle: '900'
        })
      );

      // Craft Button
      if (isOwned) {
        this.add(
          this.scene.add.text(rx + 340, ry + 75, 'OWNED', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '14px',
            color: '#4ade80',
            fontStyle: '900'
          }).setOrigin(0.5)
        );
      } else {
        const craftBtn = this.add(
          this.scene.add.rectangle(rx + 340, ry + 75, 100, 36, canCraft ? 0x2563eb : 0x334155, 1)
            .setStrokeStyle(1.5, canCraft ? 0x60a5fa : 0x475569, 1)
        );
        const craftText = this.add(
          this.scene.add.text(rx + 340, ry + 75, 'CRAFT', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '12px',
            color: canCraft ? '#ffffff' : '#94a3b8',
            fontStyle: '900'
          }).setOrigin(0.5)
        );

        if (canCraft) {
          craftBtn.setInteractive({ useHandCursor: true });
          craftBtn.on('pointerover', () => {
            craftBtn.setScale(1.05);
            craftText.setScale(1.05);
            soundManager.playSFX(this.scene, 'hover');
          });
          craftBtn.on('pointerout', () => {
            craftBtn.setScale(1);
            craftText.setScale(1);
          });
          craftBtn.on('pointerup', () => {
            soundManager.playSFX(this.scene, 'upgrade');

            // Consume gold
            addPlayerGold(this.scene, -recipe.costGold);

            // Consume materials
            Object.entries(recipe.materials).forEach(([matId, qty]) => {
              addPlayerMaterial(this.scene, matId, -qty);
            });

            // Unlock Equipment
            addEquipmentToInventory(this.scene, recipe.resultItemId);

            this.scene.showFeedback('Equipment Crafted successfully!');
            this.show();
          });
        }
      }
    });
  }
}
