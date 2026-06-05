import Phaser from 'phaser';
import baseHeroStats from '../data/baseHero.js';
import equipment from '../data/equipment.js';
import skins from '../data/skins.js';
import { calculateFinalStats } from '../systems/HeroStats.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.activeTab = 'home';
    this.equippedItemIds = new Set();
    this.activeSkinId = 'default-guard';
    this.uiItems = [];

    this.cameras.main.setBackgroundColor('#0b1020');
    this.render();
  }

  render() {
    this.clearUi();

    const { width, height } = this.scale;
    const contentX = 110;
    const contentY = 150;
    const contentWidth = width - 220;

    this.addUi(this.add.rectangle(width / 2, height / 2, width, height, 0x0b1020));
    this.addUi(this.add.circle(width * 0.16, height * 0.18, 130, 0x27152b, 0.55));
    this.addUi(this.add.circle(width * 0.84, height * 0.82, 180, 0x1f2937, 0.65));
    this.addUi(this.add.rectangle(width / 2, height / 2, width - 72, height - 56, 0x111827, 0.92));

    this.addUi(this.add.text(width / 2, 58, 'Battle Guard', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '54px',
      color: '#f8fafc',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 7
    }).setOrigin(0.5));

    this.addUi(this.add.text(width / 2, 104, 'Prepare your guard before entering the field', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '18px',
      color: '#94a3b8'
    }).setOrigin(0.5));

    this.createTabButton(width / 2 - 125, 138, 220, 'Home', 'home');
    this.createTabButton(width / 2 + 125, 138, 220, 'Inventory', 'inventory');

    if (this.activeTab === 'home') {
      this.renderHomeTab(contentX, contentY, contentWidth);
    } else {
      this.renderInventoryTab(contentX, contentY, contentWidth);
    }
  }

  renderHomeTab(x, y, width) {
    const activeSkin = this.getActiveSkin();
    const equippedItems = this.getEquippedItems();
    const finalStats = this.getFinalStats();
    const leftWidth = Math.round(width * 0.53);
    const rightWidth = width - leftWidth - 28;

    this.createCard(x, y, leftWidth, 345, 'Active Hero');
    this.addUi(this.add.text(x + 34, y + 76, `Skin aktif: ${activeSkin.name}`, this.valueStyle()));
    this.addUi(this.add.text(x + 34, y + 122, 'Equipment aktif', this.labelStyle()));
    this.addUi(this.add.text(x + 34, y + 160, equippedItems.length
      ? equippedItems.map((item) => `- ${item.name}`).join('\n')
      : '- None', {
        ...this.bodyStyle(),
        lineSpacing: 10
      }));
    this.addUi(this.add.text(x + 34, y + 266, activeSkin.description, {
      ...this.bodyStyle(),
      color: '#cbd5e1',
      wordWrap: { width: leftWidth - 68 }
    }));

    this.createCard(x + leftWidth + 28, y, rightWidth, 345, 'Final Stats');
    this.addUi(this.add.text(x + leftWidth + 62, y + 78, this.formatStats(finalStats), {
      ...this.bodyStyle(),
      fontSize: '21px',
      lineSpacing: 13
    }));

    this.createButton(
      x + (width / 2) - 175,
      y + 405,
      350,
      76,
      'Play',
      () => {
        this.scene.start('GameScene', {
          baseHeroStats,
          equippedItems,
          activeSkin,
          finalStats
        });
      },
      'primary'
    );
  }

  renderInventoryTab(x, y, width) {
    const activeSkin = this.getActiveSkin();
    const finalStats = this.getFinalStats();
    const leftWidth = Math.round(width * 0.5);
    const rightX = x + leftWidth + 28;
    const rightWidth = width - leftWidth - 28;

    this.createCard(x, y, leftWidth, 280, 'Equipment');
    equipment.forEach((item, index) => {
      const isEquipped = this.equippedItemIds.has(item.id);
      const rowY = y + 76 + (index * 68);

      this.addUi(this.add.text(x + 30, rowY - 13, item.name, this.valueStyle()));
      this.addUi(this.add.text(x + 230, rowY - 10, this.formatBonus(item.bonus), this.bodyStyle()));
      this.createButton(x + leftWidth - 165, rowY, 128, 42, isEquipped ? 'Unequip' : 'Equip', () => {
        this.toggleEquipment(item.id);
      }, isEquipped ? 'active' : 'secondary');
    });

    this.createCard(x, y + 306, leftWidth, 250, 'Hero Skin');
    skins.forEach((skin, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const skinX = x + 30 + (column * ((leftWidth - 80) / 2));
      const skinY = y + 378 + (row * 88);
      const isActive = skin.id === activeSkin.id;

      this.createButton(skinX, skinY, 220, 44, isActive ? `Active: ${skin.name}` : skin.name, () => {
        this.activeSkinId = skin.id;
        this.render();
      }, isActive ? 'active' : 'secondary');
      this.addUi(this.add.text(skinX, skinY + 30, skin.description, {
        ...this.bodyStyle(),
        fontSize: '14px',
        color: '#94a3b8',
        wordWrap: { width: 220 }
      }));
    });

    this.createCard(rightX, y, rightWidth, 556, 'Preview Total Stats');
    this.addUi(this.add.text(rightX + 34, y + 76, `Active Skin: ${activeSkin.name}`, this.valueStyle()));
    this.addUi(this.add.text(rightX + 34, y + 120, 'Skin Bonus', this.labelStyle()));
    this.addUi(this.add.text(rightX + 34, y + 156, activeSkin.description, {
      ...this.bodyStyle(),
      color: '#cbd5e1',
      wordWrap: { width: rightWidth - 68 }
    }));
    this.addUi(this.add.text(rightX + 34, y + 246, this.formatStats(finalStats), {
      ...this.bodyStyle(),
      fontSize: '21px',
      lineSpacing: 14
    }));
  }

  createTabButton(x, y, width, label, tab) {
    this.createButton(x - (width / 2), y, width, 46, label, () => {
      this.activeTab = tab;
      this.render();
    }, this.activeTab === tab ? 'active' : 'tab');
  }

  createCard(x, y, width, height, title) {
    const card = this.add.rectangle(x + (width / 2), y + (height / 2), width, height, 0x172033, 0.96);
    const topLine = this.add.rectangle(x + (width / 2), y + 1, width, 2, 0x7c3aed, 0.9);
    const titleText = this.add.text(x + 28, y + 24, title, this.headingStyle());

    card.setStrokeStyle(2, 0x334155);
    this.addUi(card);
    this.addUi(topLine);
    this.addUi(titleText);
  }

  createButton(x, y, width, height, label, onClick, variant = 'secondary') {
    const colors = {
      primary: { fill: 0x7c2d12, hover: 0x9a3412, stroke: 0xfacc15 },
      active: { fill: 0x4338ca, hover: 0x4f46e5, stroke: 0xa5b4fc },
      tab: { fill: 0x1e293b, hover: 0x334155, stroke: 0x475569 },
      secondary: { fill: 0x1f2937, hover: 0x374151, stroke: 0x64748b }
    };
    const palette = colors[variant] || colors.secondary;
    const button = this.add.rectangle(x + (width / 2), y, width, height, palette.fill, 1);
    const text = this.add.text(x + (width / 2), y, label, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: variant === 'primary' ? '28px' : '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    button.setStrokeStyle(2, palette.stroke);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setFillStyle(palette.hover, 1));
    button.on('pointerout', () => button.setFillStyle(palette.fill, 1));
    button.on('pointerdown', onClick);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', onClick);

    this.addUi(button);
    this.addUi(text);
  }

  toggleEquipment(itemId) {
    if (this.equippedItemIds.has(itemId)) {
      this.equippedItemIds.delete(itemId);
    } else {
      this.equippedItemIds.add(itemId);
    }

    this.render();
  }

  getEquippedItems() {
    return equipment.filter((item) => this.equippedItemIds.has(item.id));
  }

  getActiveSkin() {
    return skins.find((skin) => skin.id === this.activeSkinId) || skins[0];
  }

  getFinalStats() {
    return calculateFinalStats(baseHeroStats, this.getEquippedItems(), this.getActiveSkin(), 1);
  }

  formatStats(stats) {
    return [
      `HP: ${stats.hp}`,
      `Damage: ${stats.damage}`,
      `Move Speed: ${stats.moveSpeed}`,
      `Attack Speed: ${stats.attackSpeed}`,
      `Attack Range: ${stats.attackRange}`,
      `Critical Chance: ${Math.round(stats.criticalChance * 100)}%`
    ].join('\n');
  }

  formatBonus(bonus) {
    return Object.entries(bonus)
      .map(([statName, value]) => `${this.formatStatName(statName)} +${value}`)
      .join(', ');
  }

  formatStatName(statName) {
    const names = {
      hp: 'HP',
      damage: 'Damage',
      moveSpeed: 'Move Speed',
      attackSpeed: 'Attack Speed',
      attackRange: 'Attack Range',
      criticalChance: 'Critical Chance'
    };

    return names[statName] || statName;
  }

  headingStyle() {
    return {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '24px',
      color: '#f8fafc',
      fontStyle: 'bold'
    };
  }

  labelStyle() {
    return {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '18px',
      color: '#94a3b8',
      fontStyle: 'bold'
    };
  }

  valueStyle() {
    return {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '19px',
      color: '#f8fafc',
      fontStyle: 'bold'
    };
  }

  bodyStyle() {
    return {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '17px',
      color: '#dbe3ef',
      lineSpacing: 8
    };
  }

  addUi(item) {
    this.uiItems.push(item);

    return item;
  }

  clearUi() {
    this.uiItems.forEach((item) => item.destroy());
    this.uiItems = [];
  }
}
