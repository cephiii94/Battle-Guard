import Phaser from 'phaser';
import skins from '../../data/skins.js';
import {
  EQUIPMENT_SLOTS,
  equipItem,
  formatEquipmentBonus,
  getEquippedItemBySlot,
  getInventoryItems,
  unequipSlot,
} from '../../systems/EquipmentInventory.js';
import {
  getAvailableHeroes,
  setSelectedHero,
} from '../../systems/HeroSelection.js';
import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';

export class InventoryTab {
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
    this.scene.refreshBottomStats();

    const { width, height } = this.scene.scale;

    // Futuristic sky blue/cyan gradient background matching MainMenuScene background
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(0xdbeefb, 0xdbeefb, 0xaad4fc, 0x89c5f8, 1);
    bg.fillRect(0, 0, width, height);

    // Draw horizontal and vertical perspective grid lines matching MainMenuScene style
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

    // Title & Subtitle left-aligned in modern RPG style, shifted right to make room for the back button
    this.add(
      this.scene.add.text(185, 38, 'HERO LOADOUT & INVENTORY', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '28px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#07111f',
        strokeThickness: 4,
      }).setOrigin(0, 0.5)
    );

    this.add(
      this.scene.add.text(185, 68, 'Equip artifacts, review attribute stats, and level up your character class.', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '13px',
        color: '#9af2ff',
        fontStyle: '800',
        stroke: '#07111f',
        strokeThickness: 2,
      }).setOrigin(0, 0.5)
    );

    // Close/Back button placed in the top-left corner
    this.addCloseButton(110, 52);

    // Column 1: Hero Selection Panel (Left Column)
    this.addHeroSelectionPanel(190, 140);

    // Column 2: Selected Hero Showcase & Stats (Center Column)
    this.addHeroShowcasePanel(520, 140);
    this.addTotalStatsPanel(520, 360);

    // Column 3: Equipment Slots & Inventory List (Right Column)
    this.addEquipmentSlotPanel(980, 140);
    this.addInventoryList(980, 250);
  }

  addHeroSelectionPanel(x, y) {
    this.add(this.scene.add.text(x, y - 18, 'SELECT HERO', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));

    getAvailableHeroes().forEach((hero, index) => {
      const cardY = y + 50 + (index * 116);
      const isSelected = hero.id === this.scene.selectedHero.id;

      // Card background styled to align with main menu theme (cyanDark for selected, dark blue for unselected)
      const card = this.add(
        this.scene.add.rectangle(x, cardY, 280, 100, isSelected ? 0x0c86bd : 0x07111f, 0.95)
          .setStrokeStyle(2.5, isSelected ? 0xffdc5a : 0x4aa6f7, 0.9)
          .setInteractive({ useHandCursor: true })
      );

      const activeSkin = this.getDefaultSkinForHero(hero);
      const visualKey = activeSkin?.assetKey || hero.assetKey;

      // Large portrait circle frame
      this.add(this.scene.add.circle(x - 90, cardY, 32, 0x0c1e3d, 1))
        .setStrokeStyle(2, isSelected ? 0xffdc5a : 0x4aa6f7, 1);
      this.add(this.scene.add.image(x - 90, cardY, visualKey).setDisplaySize(54, 54));

      this.add(
        this.scene.add.text(x - 46, cardY - 26, hero.name, this.getInventoryTextStyle(isSelected ? UI.yellow : UI.white, 16))
          .setOrigin(0, 0.5)
      );
      this.add(
        this.scene.add.text(x - 46, cardY - 4, hero.description.length > 30 ? hero.description.slice(0, 28) + '...' : hero.description, this.getInventoryTextStyle('#dff8ff', 10))
          .setOrigin(0, 0.5)
      );
      this.add(
        this.scene.add.text(x - 46, cardY + 20, this.formatPassiveBonus(hero), this.getInventoryTextStyle(UI.cyan, 10))
          .setOrigin(0, 0.5)
      );

      card.on('pointerover', () => {
        soundManager.playSFX(this.scene, 'hover');
        if (!isSelected) {
          card.setFillStyle(0x0e1d3d, 0.95);
          card.setStrokeStyle(2.5, 0x00d6ff, 1);
        }
      });
      card.on('pointerout', () => {
        if (!isSelected) {
          card.setFillStyle(0x07111f, 0.95);
          card.setStrokeStyle(2.5, 0x4aa6f7, 0.9);
        }
      });
      card.on('pointerup', () => {
        soundManager.playSFX(this.scene, 'click');
        setSelectedHero(this.scene, hero.id);
        this.scene.refreshHeroLoadout();
        this.scene.refreshBottomStats();
        this.show();
      });
    });
  }

  addHeroShowcasePanel(x, y) {
    // Background frame for the hero display
    this.add(
      this.scene.add.rectangle(x, y + 90, 300, 200, 0x07111f, 0.85)
        .setStrokeStyle(2, 0x4aa6f7, 0.6)
    );

    // Glowing circle behind character avatar
    this.add(
      this.scene.add.circle(x, y + 55, 60, 0x00d6ff, 0.12)
    );

    // Dynamic large character avatar display
    const activeSkin = this.scene.activeSkin;
    const visualKey = activeSkin?.assetKey || this.scene.selectedHero.assetKey;
    this.add(
      this.scene.add.image(x, y + 55, visualKey).setDisplaySize(100, 100)
    );

    // Selected Hero Details Text
    this.add(
      this.scene.add.text(x, y + 128, this.scene.selectedHero.name.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '20px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#07111f',
        strokeThickness: 3,
      }).setOrigin(0.5)
    );

    this.add(
      this.scene.add.text(x, y + 152, `CLASS LEVEL ${this.scene.heroLevel}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: UI.cyan,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    // Force draw/refresh active upgrade button inside showcase area
    this.scene.drawHeroUpgradeButton(x, y + 195);
  }

  formatPassiveBonus(hero) {
    const passiveEntries = Object.entries(hero.passiveBonus || {});

    if (passiveEntries.length === 0) {
      return 'Passive: none';
    }

    return `Passive: ${passiveEntries
      .map(([statName, value]) => `${this.getStatShortLabel(statName)} ${this.formatHeroBonus(statName, value)}`)
      .join(', ')}`;
  }

  getStatShortLabel(statName) {
    const labels = {
      hp: 'HP',
      damage: 'ATK',
      attackSpeed: 'ASPD',
      attackRange: 'RANGE',
      moveSpeed: 'MOVE',
      criticalChance: 'CRIT',
      healthRegen: 'REGEN',
      armor: 'ARMOR',
      lifesteal: 'LIFE',
      evasion: 'DODGE',
      cooldownReduction: 'CDR'
    };

    return labels[statName] || statName;
  }

  formatHeroBonus(statName, value) {
    if (statName === 'criticalChance' || statName === 'lifesteal' || statName === 'evasion' || statName === 'cooldownReduction') {
      return `+${Math.round(value * 100)}%`;
    }
    if (statName === 'healthRegen') {
      return `+${value}/s`;
    }

    return `+${value}`;
  }

  getDefaultSkinForHero(hero) {
    return skins.find((skin) => skin.id === hero.cosmeticSkinId) || skins[0];
  }

  addEquipmentSlotPanel(x, y) {
    this.add(this.scene.add.text(x, y - 18, 'EQUIPPED SLOTS', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));

    EQUIPMENT_SLOTS.forEach((slot, index) => {
      const item = getEquippedItemBySlot(this.scene, slot);

      // Horizontal positioning for horizontal layout: 3 slots side-by-side inside width 380
      const slotX = x - 120 + (index * 120);
      const slotY = y + 36;

      const button = this.add(
        this.scene.add.rectangle(slotX, slotY, 110, 70, item ? 0x0c86bd : 0x07111f, 0.95)
          .setStrokeStyle(2, item ? 0xffdc5a : 0x4aa6f7, 0.9)
          .setInteractive({ useHandCursor: true })
      );

      const slotIcon = slot === 'weapon' ? '⚔' : slot === 'armor' ? '🛡' : '💍';

      // Draw slot type label
      this.add(
        this.scene.add.text(slotX, slotY - 20, `${slotIcon} ${slot.toUpperCase()}`, this.getInventoryTextStyle('#9af2ff', 10))
          .setOrigin(0.5, 0.5)
      );

      // Draw item name text
      this.add(
        this.scene.add.text(slotX, slotY + 10, item ? item.name : 'EMPTY', this.getInventoryTextStyle(item ? UI.white : '#475569', 11))
          .setOrigin(0.5, 0.5)
      );

      button.on('pointerover', () => {
        soundManager.playSFX(this.scene, 'hover');
        if (!item) {
          button.setFillStyle(0x0e1d3d, 0.95);
          button.setStrokeStyle(2, 0x00d6ff, 1);
        } else {
          button.setFillStyle(0x1a9cd8, 0.95);
        }
      });
      button.on('pointerout', () => {
        if (!item) {
          button.setFillStyle(0x07111f, 0.95);
          button.setStrokeStyle(2, 0x4aa6f7, 0.9);
        } else {
          button.setFillStyle(0x0c86bd, 0.95);
          button.setStrokeStyle(2, 0xffdc5a, 0.9);
        }
      });
      button.on('pointerup', () => {
        soundManager.playSFX(this.scene, 'click');
        if (item) {
          unequipSlot(this.scene, slot);
          this.scene.refreshHeroLoadout();
          this.scene.refreshBottomStats();
          this.scene.refreshMainMenuLoadoutDisplay();
          this.show();
        }
      });
    });
  }

  addInventoryList(x, y) {
    this.add(this.scene.add.text(x, y - 10, 'AVAILABLE GEAR', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));

    getInventoryItems(this.scene).forEach((item, index) => {
      const rowY = y + 36 + (index * 58);
      const isEquipped = getEquippedItemBySlot(this.scene, item.slot)?.id === item.id;

      const row = this.add(
        this.scene.add.rectangle(x, rowY, 360, 48, isEquipped ? 0x0c86bd : 0x07111f, 0.95)
          .setStrokeStyle(2, isEquipped ? 0xffdc5a : 0x4aa6f7, 0.9)
          .setInteractive({ useHandCursor: true })
      );

      // Left column: item info
      this.add(
        this.scene.add.text(x - 165, rowY - 10, item.name, this.getInventoryTextStyle(UI.white, 13))
          .setOrigin(0, 0.5)
      );
      this.add(
        this.scene.add.text(x - 165, rowY + 10, `${item.slot.toUpperCase()}  ${formatEquipmentBonus(item)}`, this.getInventoryTextStyle('#9af2ff', 10))
          .setOrigin(0, 0.5)
      );

      // Right column: status button
      this.add(
        this.scene.add.text(x + 165, rowY, isEquipped ? 'EQUIPPED' : 'EQUIP', this.getInventoryTextStyle(isEquipped ? '#ffdc5a' : UI.cyan, 11))
          .setOrigin(1, 0.5)
      );

      row.on('pointerover', () => {
        soundManager.playSFX(this.scene, 'hover');
        if (!isEquipped) {
          row.setFillStyle(0x0e1d3d, 0.95);
          row.setStrokeStyle(2, 0x00d6ff, 1);
        } else {
          row.setFillStyle(0x1a9cd8, 0.95);
        }
      });
      row.on('pointerout', () => {
        if (!isEquipped) {
          row.setFillStyle(0x07111f, 0.95);
          row.setStrokeStyle(2, 0x4aa6f7, 0.9);
        } else {
          row.setFillStyle(0x0c86bd, 0.95);
          row.setStrokeStyle(2, 0xffdc5a, 0.9);
        }
      });
      row.on('pointerup', () => {
        soundManager.playSFX(this.scene, 'click');
        equipItem(this.scene, item.id);
        this.scene.refreshHeroLoadout();
        this.scene.refreshBottomStats();
        this.scene.refreshMainMenuLoadoutDisplay();
        this.show();
      });
    });
  }

  addTotalStatsPanel(x, y) {
    const stats = [
      ['HP', this.scene.finalHeroStats.hp],
      ['Attack', this.scene.finalHeroStats.damage],
      ['Attack Speed', this.scene.finalHeroStats.attackSpeed],
      ['Move Speed', this.scene.finalHeroStats.moveSpeed],
      ['Crit Chance', `${Math.round(this.scene.finalHeroStats.criticalChance * 100)}%`],
      ['HP Regen', `${this.scene.finalHeroStats.healthRegen || 0}/s`],
      ['Armor', this.scene.finalHeroStats.armor || 0],
      ['Lifesteal', `${Math.round((this.scene.finalHeroStats.lifesteal || 0) * 100)}%`],
      ['Evasion', `${Math.round((this.scene.finalHeroStats.evasion || 0) * 100)}%`],
      ['CDR', `${Math.round((this.scene.finalHeroStats.cooldownReduction || 0) * 100)}%`]
    ];

    this.add(this.scene.add.text(x, y - 18, 'TOTAL STATUS', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));

    // Spacious 300px background box for stats
    this.add(
      this.scene.add.rectangle(x, y + 130, 300, 278, 0x07111f, 0.95)
        .setStrokeStyle(2, 0x4aa6f7, 0.8)
    );

    // Loop through the 10 stats and organize them into 2 columns for clear fullscreen presentation
    stats.forEach(([label, value], index) => {
      const colIndex = index < 5 ? 0 : 1;
      const rowIndex = index % 5;
      const statY = y + 16 + (rowIndex * 52);

      if (colIndex === 0) {
        this.add(
          this.scene.add.text(x - 138, statY, label, this.getInventoryTextStyle('#9af2ff', 12))
            .setOrigin(0, 0.5)
        );
        this.add(
          this.scene.add.text(x - 12, statY, value, this.getInventoryTextStyle(UI.yellow, 12))
            .setOrigin(1, 0.5)
        );
      } else {
        this.add(
          this.scene.add.text(x + 12, statY, label, this.getInventoryTextStyle('#9af2ff', 12))
            .setOrigin(0, 0.5)
        );
        this.add(
          this.scene.add.text(x + 138, statY, value, this.getInventoryTextStyle(UI.yellow, 12))
            .setOrigin(1, 0.5)
        );
      }
    });
  }

  addCloseButton(x, y) {
    const button = this.add(
      this.scene.add.rectangle(x, y, 110, 40, 0x498ff5, 0.9)
        .setStrokeStyle(2, 0xffffff, 0.9)
        .setInteractive({ useHandCursor: true })
    );
    this.add(this.scene.add.text(x, y, '← KEMBALI', this.getInventoryTextStyle(UI.white, 14)).setOrigin(0.5));

    button.on('pointerover', () => {
      button.setScale(1.1);
      soundManager.playSFX(this.scene, 'hover');
    });
    button.on('pointerout', () => {
      button.setScale(1);
    });
    button.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      this.clear();
    });
  }

  getInventoryTitleStyle() {
    return {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: UI.yellow,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    };
  }

  getInventoryTextStyle(color, fontSize) {
    return {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color,
      fontStyle: '800',
      stroke: '#0c1648',
      strokeThickness: 3,
    };
  }
}
