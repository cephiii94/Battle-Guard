import { getPlayerProgress, addPlayerGold, addPlayerMaterial } from '../../systems/PlayerProgress.js';
import craftingRecipes from '../../data/crafting.js';
import { getEquipmentById, formatEquipmentBonus, addEquipmentToInventory } from '../../systems/EquipmentInventory.js';
import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';

export class BlacksmithTab {
  constructor(scene) {
    this.scene = scene;
    this.layer = [];
    this.selectedRecipeIndex = 0;
    this.isForging = false;
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

    // 1. Sleek Cyber Gradient Background
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(0x090f1d, 0x090f1d, 0x050811, 0x050811, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative gridlines for high-tech feeling
    bg.lineStyle(1, 0x4aa6f7, 0.08);
    for (let x = 0; x < width; x += 40) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      bg.lineBetween(0, y, width, y);
    }
    this.add(bg);

    // 2. Dynamic UI Panels Geometry
    const sidebarW = 290;
    const specsW = 310;
    const gap = 20;

    const leftX = 60;
    const leftY = 120;
    const leftW = sidebarW;
    const leftH = height - 165;

    const rightX = width - specsW - 60;
    const rightY = 120;
    const rightW = specsW;
    const rightH = height - 165;

    const centerX = leftX + leftW + gap;
    const centerY = 120;
    const centerW = rightX - gap - centerX;
    const centerH = height - 165;

    // Panel 1: Blueprints List (Left)
    bg.fillStyle(0x0d1527, 0.85);
    bg.fillRoundedRect(leftX, leftY, leftW, leftH, 12);
    bg.lineStyle(2, 0x1e293b, 0.9);
    bg.strokeRoundedRect(leftX, leftY, leftW, leftH, 12);
    bg.fillStyle(0x00f0ff, 0.8);
    bg.fillRect(leftX + 20, leftY, leftW - 40, 3);

    // Panel 2: Forging Chamber (Center)
    bg.fillStyle(0x0a101f, 0.7);
    bg.fillRoundedRect(centerX, centerY, centerW, centerH, 12);
    bg.lineStyle(2, 0x334155, 0.6);
    bg.strokeRoundedRect(centerX, centerY, centerW, centerH, 12);
    
    // Forging ring aesthetic (Concentric Circles)
    const forgeCenterX = centerX + centerW / 2;
    const forgeCenterY = centerY + 130;
    bg.lineStyle(1.5, 0x00f0ff, 0.12);
    bg.strokeCircle(forgeCenterX, forgeCenterY, 110);
    bg.strokeCircle(forgeCenterX, forgeCenterY, 80);
    bg.lineStyle(1, 0xff8c00, 0.1);
    bg.strokeCircle(forgeCenterX, forgeCenterY, 50);

    // Panel 3: Specs Details (Right)
    bg.fillStyle(0x0d1527, 0.85);
    bg.fillRoundedRect(rightX, rightY, rightW, rightH, 12);
    bg.lineStyle(2, 0x1e293b, 0.9);
    bg.strokeRoundedRect(rightX, rightY, rightW, rightH, 12);
    bg.fillStyle(0xffdc5a, 0.8);
    bg.fillRect(rightX + 20, rightY, rightW - 40, 3);

    // Header Title
    this.add(
      this.scene.add.text(185, 38, '⚒️ BLACKSMITH FORGE', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '28px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#07111f',
        strokeThickness: 4,
      }).setOrigin(0, 0.5)
    );

    this.add(
      this.scene.add.text(185, 68, 'Tempa persenjataan modern menggunakan material langka hasil pertempuran.', {
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
      this.scene.add.text(resX + 10, resY + 12, `🪨 ${ironQty}   💎 ${gemQty}   🐉 ${scaleQty}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: '900'
      }).setOrigin(0, 0.5)
    );

    // Header labels inside panels
    this.add(
      this.scene.add.text(leftX + 20, leftY + 20, 'BLUEPRINTS', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '15px',
        color: '#89c5f8',
        fontStyle: '900'
      })
    );

    this.add(
      this.scene.add.text(rightX + 20, rightY + 20, 'EQUIPMENT SPECS', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '15px',
        color: '#ffdc5a',
        fontStyle: '900'
      })
    );

    // Selected recipe
    const selectedRecipe = craftingRecipes[this.selectedRecipeIndex];
    const itemData = selectedRecipe ? getEquipmentById(selectedRecipe.resultItemId) : null;
    const isOwned = itemData ? (this.scene.playerProgress.ownedEquipment && this.scene.playerProgress.ownedEquipment.includes(selectedRecipe.resultItemId)) : false;

    // 3. Render Recipe Sidebar List (Left Panel)
    const startListY = leftY + 50;
    const itemH = 68;
    const spacing = 8;

    craftingRecipes.forEach((recipe, idx) => {
      const rx = leftX + 12;
      const ry = startListY + idx * (itemH + spacing);
      const isSelected = idx === this.selectedRecipeIndex;
      const recipeItem = getEquipmentById(recipe.resultItemId);
      if (!recipeItem) return;

      const recipeOwned = this.scene.playerProgress.ownedEquipment && this.scene.playerProgress.ownedEquipment.includes(recipe.resultItemId);

      // Card Background
      const cardBg = this.scene.add.rectangle(rx + (leftW - 24) / 2, ry + itemH / 2, leftW - 24, itemH, isSelected ? 0x1e293b : 0x0f172a, 1)
        .setStrokeStyle(1.5, isSelected ? 0x00f0ff : 0x334155, 0.8)
        .setInteractive({ useHandCursor: true });
      this.add(cardBg);

      // Icon Container
      const iconCircle = this.scene.add.circle(rx + 34, ry + itemH / 2, 22, isSelected ? 0x0f172a : 0x0b0f19, 1)
        .setStrokeStyle(1.5, recipeOwned ? 0x4ade80 : 0x4aa6f7, 0.8);
      this.add(iconCircle);

      const iconText = this.scene.add.text(rx + 34, ry + itemH / 2, recipeItem.icon, { fontSize: '20px' }).setOrigin(0.5);
      this.add(iconText);

      // Title & Slot
      const nameText = this.scene.add.text(rx + 68, ry + 16, recipeItem.name.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: recipeOwned ? '#4ade80' : (isSelected ? '#00f0ff' : '#ffffff'),
        fontStyle: '900'
      });
      this.add(nameText);

      const slotText = this.scene.add.text(rx + 68, ry + 36, recipeItem.slot.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '9px',
        color: '#94a3b8',
        fontStyle: '800'
      });
      this.add(slotText);

      // Owned Badge or Simple cost badge on card
      if (recipeOwned) {
        this.add(
          this.scene.add.text(rx + leftW - 60, ry + itemH / 2, 'CRAFTED', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '9px',
            color: '#4ade80',
            fontStyle: '900'
          }).setOrigin(0.5)
        );
      } else {
        this.add(
          this.scene.add.text(rx + leftW - 60, ry + itemH / 2, `💰 ${recipe.costGold}`, {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '9px',
            color: '#ffdc5a',
            fontStyle: '900'
          }).setOrigin(0.5)
        );
      }

      cardBg.on('pointerover', () => {
        if (!isSelected) {
          cardBg.setFillStyle(0x182235, 1);
          soundManager.playSFX(this.scene, 'hover');
        }
      });
      cardBg.on('pointerout', () => {
        if (!isSelected) {
          cardBg.setFillStyle(0x0f172a, 1);
        }
      });
      cardBg.on('pointerup', () => {
        if (this.isForging) return;
        this.selectedRecipeIndex = idx;
        soundManager.playSFX(this.scene, 'click');
        this.show();
      });
    });

    // 4. Render Specs sheet (Right Panel)
    if (itemData) {
      const specCentX = rightX + rightW / 2;

      // Big floating item circle icon
      const bigCircle = this.scene.add.circle(specCentX, rightY + 90, 48, 0x0f172a, 1)
        .setStrokeStyle(3, isOwned ? 0x4ade80 : 0xffdc5a, 1);
      this.add(bigCircle);

      const bigIcon = this.scene.add.text(specCentX, rightY + 90, itemData.icon, { fontSize: '46px' }).setOrigin(0.5);
      this.add(bigIcon);

      // Title & Slot Pill
      const specTitle = this.scene.add.text(specCentX, rightY + 160, itemData.name.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '18px',
        color: isOwned ? '#4ade80' : '#ffffff',
        fontStyle: '900'
      }).setOrigin(0.5);
      this.add(specTitle);

      const specSlotBg = this.scene.add.rectangle(specCentX, rightY + 192, 120, 22, 0x1e293b, 1)
        .setStrokeStyle(1, 0x4aa6f7, 0.5);
      this.add(specSlotBg);

      const specSlotText = this.scene.add.text(specCentX, rightY + 192, itemData.slot.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '10px',
        color: '#89c5f8',
        fontStyle: '900'
      }).setOrigin(0.5);
      this.add(specSlotText);

      // Divider line
      const divLine = this.scene.add.graphics();
      divLine.lineStyle(1.5, 0x1e293b, 0.8);
      divLine.lineBetween(rightX + 25, rightY + 220, rightX + rightW - 25, rightY + 220);
      this.add(divLine);

      // Stat Bonuses Header
      this.add(
        this.scene.add.text(rightX + 25, rightY + 235, 'STAT BONUS', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '11px',
          color: '#64748b',
          fontStyle: '900'
        })
      );

      // List of stats
      let statY = rightY + 260;
      Object.entries(itemData.bonus).forEach(([statName, val]) => {
        const labels = {
          hp: 'Maks HP',
          damage: 'Serangan (ATK)',
          attackSpeed: 'Kecepatan Serang',
          moveSpeed: 'Kecepatan Gerak',
          criticalChance: 'Peluang Kritis',
          healthRegen: 'Regen HP',
          armor: 'Pertahanan (Armor)',
          lifesteal: 'Life Steal',
          evasion: 'Evasion',
          cooldownReduction: 'CDR'
        };
        const sign = val >= 0 ? '+' : '';
        const displayVal = (statName === 'criticalChance' || statName === 'lifesteal' || statName === 'evasion' || statName === 'cooldownReduction')
          ? `${sign}${Math.round(val * 100)}%`
          : `${sign}${val}`;

        this.add(
          this.scene.add.text(rightX + 25, statY, `⚡ ${labels[statName] || statName}`, {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '13px',
            color: '#cbd5e1',
            fontStyle: '800'
          })
        );

        this.add(
          this.scene.add.text(rightX + rightW - 25, statY, displayVal, {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '13px',
            color: '#00f0ff',
            fontStyle: '900'
          }).setOrigin(1, 0)
        );

        statY += 28;
      });

      // Rarity Description or Quote
      this.add(
        this.scene.add.text(specCentX, rightY + 415, 'Item yang ditempa akan otomatis masuk ke dalam inventori perlengkapan Pahlawan.', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '10px',
          color: '#64748b',
          fontStyle: '800',
          align: 'center',
          wordWrap: { width: rightW - 60 }
        }).setOrigin(0.5)
      );

      // Status indicator overlay
      if (isOwned) {
        this.add(
          this.scene.add.text(specCentX, rightY + 480, '✓ TELAH DIMILIKI', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '15px',
            color: '#4ade80',
            fontStyle: '900'
          }).setOrigin(0.5)
        );
      } else {
        this.add(
          this.scene.add.text(specCentX, rightY + 480, '⚒️ SIAP DI-TEMPA', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '15px',
            color: '#00f0ff',
            fontStyle: '900'
          }).setOrigin(0.5)
        );
      }
    }

    // 5. Render Central Forging Area (Area Tempa)
    if (selectedRecipe && itemData) {
      // Draw Central Forge Node (Target Icon inside the Concentric Circles)
      const targetCircle = this.scene.add.circle(forgeCenterX, forgeCenterY, 32, 0x090f1d, 1)
        .setStrokeStyle(2.5, isOwned ? 0x4ade80 : 0x00f0ff, 1);
      this.add(targetCircle);

      const targetIcon = this.scene.add.text(forgeCenterX, forgeCenterY, itemData.icon, { fontSize: '30px' }).setOrigin(0.5);
      this.add(targetIcon);

      this.add(
        this.scene.add.text(forgeCenterX, forgeCenterY - 48, 'TARGET TEMPA', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '11px',
          color: '#89c5f8',
          fontStyle: '900',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5)
      );

      // Materials requirements list
      const materialList = [];
      let canCraft = true;

      // Add Gold requirement first
      const currentGold = this.scene.playerProgress.gold;
      materialList.push({
        id: 'gold',
        name: 'Koin Emas',
        icon: '💰',
        owned: currentGold,
        required: selectedRecipe.costGold,
        isSufficient: currentGold >= selectedRecipe.costGold
      });
      if (currentGold < selectedRecipe.costGold) {
        canCraft = false;
      }

      // Add Materials requirements
      Object.entries(selectedRecipe.materials).forEach(([matId, reqQty]) => {
        const ownedQty = this.scene.playerProgress.materials ? (this.scene.playerProgress.materials[matId] || 0) : 0;
        const matIcons = { 'iron-ore': '🪨', 'magic-gem': '💎', 'dragon-scale': '🐉' };
        const matNames = { 'iron-ore': 'Biji Besi', 'magic-gem': 'Permata Sihir', 'dragon-scale': 'Sisik Naga' };

        const isSuf = ownedQty >= reqQty;
        if (!isSuf) canCraft = false;

        materialList.push({
          id: matId,
          name: matNames[matId] || matId,
          icon: matIcons[matId] || '❓',
          owned: ownedQty,
          required: reqQty,
          isSufficient: isSuf
        });
      });

      // Draw Connection lines and material slots
      const totalSlots = materialList.length;
      const slotW = 75;
      const slotH = 75;
      const slotGap = 16;
      const slotsTotalW = totalSlots * slotW + (totalSlots - 1) * slotGap;
      const startSlotX = forgeCenterX - slotsTotalW / 2 + slotW / 2;
      const slotsY = centerY + 285;

      // Label "BAHAN DIKEHENDAKI"
      this.add(
        this.scene.add.text(forgeCenterX, slotsY - 58, 'SLOT BAHAN / MATERIAL PENEMPAAN', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: '#94a3b8',
          fontStyle: '900'
        }).setOrigin(0.5)
      );

      materialList.forEach((mat, sIdx) => {
        const sx = startSlotX + sIdx * (slotW + slotGap);

        // Draw connection beam from material slot to center forge node
        bg.lineStyle(1.5, mat.isSufficient ? 0x00f0ff : 0xef4444, 0.25);
        bg.lineBetween(sx, slotsY, forgeCenterX, forgeCenterY);

        // Slot box
        const slotBox = this.scene.add.rectangle(sx, slotsY, slotW, slotH, 0x0d1527, 1)
          .setStrokeStyle(2, mat.isSufficient ? 0x10b981 : 0xef4444, 0.9);
        this.add(slotBox);

        // Icon inside slot
        const iconTxt = this.scene.add.text(sx, slotsY - 10, mat.icon, { fontSize: '24px' }).setOrigin(0.5);
        this.add(iconTxt);

        // Count (Owned / Req)
        const countTxt = this.scene.add.text(sx, slotsY + 20, `${mat.owned}/${mat.required}`, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '11px',
          color: mat.isSufficient ? '#10b981' : '#f87171',
          fontStyle: '900'
        }).setOrigin(0.5);
        this.add(countTxt);

        // Hover tooltip name
        slotBox.setInteractive({ useHandCursor: true });
        slotBox.on('pointerover', () => {
          slotBox.setScale(1.05);
          soundManager.playSFX(this.scene, 'hover');
        });
        slotBox.on('pointerout', () => {
          slotBox.setScale(1);
        });
      });

      // Forge button or states
      if (isOwned) {
        // Already Crafted button
        const ownedBtn = this.add(
          this.scene.add.rectangle(forgeCenterX, centerY + 395, 260, 48, 0x1e293b, 1)
            .setStrokeStyle(1.5, 0x475569, 1)
        );
        this.add(
          this.scene.add.text(forgeCenterX, centerY + 395, '✓ TELAH DIMILIKI', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '14px',
            color: '#64748b',
            fontStyle: '900'
          }).setOrigin(0.5)
        );
      } else if (this.isForging) {
        // We are forging - show progress bar
        const progressBg = this.add(
          this.scene.add.rectangle(forgeCenterX, centerY + 395, 280, 20, 0x07111f, 1)
            .setStrokeStyle(1, 0x334155, 1)
        );
        const progressBar = this.add(
          this.scene.add.rectangle(forgeCenterX - 138, centerY + 395, 0, 16, 0x00f0ff, 1)
            .setOrigin(0, 0.5)
        );
        const progressTxt = this.add(
          this.scene.add.text(forgeCenterX, centerY + 420, 'MENEMPA PERALATAN...', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '11px',
            color: '#00f0ff',
            fontStyle: '900'
          }).setOrigin(0.5)
        );

        // Animate the progress bar
        this.scene.tweens.add({
          targets: progressBar,
          width: 276,
          duration: 1200,
          ease: 'Linear',
          onUpdate: () => {
            // Random sparks effect or sound clicks
            if (Math.random() < 0.15) {
              soundManager.playSFX(this.scene, 'upgrade');
            }
          },
          onComplete: () => {
            this.executeCrafting(selectedRecipe);
          }
        });
      } else {
        // Forge button
        const forgeBtn = this.add(
          this.scene.add.rectangle(forgeCenterX, centerY + 395, 260, 48, canCraft ? 0xd97706 : 0x334155, 1)
            .setStrokeStyle(2, canCraft ? 0xfcd34d : 0x475569, 1)
        );
        const forgeTxt = this.add(
          this.scene.add.text(forgeCenterX, centerY + 395, canCraft ? 'TEMPA PERALATAN' : 'BAHAN TIDAK CUKUP', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '14px',
            color: canCraft ? '#ffffff' : '#94a3b8',
            fontStyle: '900'
          }).setOrigin(0.5)
        );

        if (canCraft) {
          forgeBtn.setInteractive({ useHandCursor: true });
          forgeBtn.on('pointerover', () => {
            forgeBtn.setScale(1.05);
            forgeTxt.setScale(1.05);
            forgeBtn.setFillStyle(0xeab308, 1);
            soundManager.playSFX(this.scene, 'hover');
          });
          forgeBtn.on('pointerout', () => {
            forgeBtn.setScale(1);
            forgeTxt.setScale(1);
            forgeBtn.setFillStyle(0xd97706, 1);
          });
          forgeBtn.on('pointerup', () => {
            this.isForging = true;
            soundManager.playSFX(this.scene, 'upgrade');
            this.show();
          });
        }
      }
    }
  }

  executeCrafting(recipe) {
    // Consume gold
    addPlayerGold(this.scene, -recipe.costGold);

    // Consume materials
    Object.entries(recipe.materials).forEach(([matId, qty]) => {
      addPlayerMaterial(this.scene, matId, -qty);
    });

    // Unlock Equipment
    addEquipmentToInventory(this.scene, recipe.resultItemId);

    this.isForging = false;
    soundManager.playSFX(this.scene, 'upgrade');
    this.scene.showFeedback('Peralatan berhasil ditempa!');
    this.show();
  }
}

