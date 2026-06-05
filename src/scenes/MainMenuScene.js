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
    const contentX = 82;
    const contentY = 164;
    const contentWidth = width - 164;

    this.drawMenuBackdrop(width, height);

    this.addUi(this.add.text(86, 42, 'BATTLE GUARD', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '58px',
      color: '#f8fafc',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 8
    }));

    this.addUi(this.add.text(90, 103, 'ARMORY DECK // Prepare your guard before entering the field', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '17px',
      color: '#facc15',
      fontStyle: 'bold'
    }));

    this.createTabButton(width - 486, 112, 218, 'Command', 'home');
    this.createTabButton(width - 250, 112, 218, 'Loadout', 'inventory');

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

    this.createCard(x, y, leftWidth, 370, 'Active Hero');
    this.drawHeroPreview(x + 54, y + 96, activeSkin);
    this.addUi(this.add.text(x + 148, y + 82, activeSkin.name.toUpperCase(), this.valueStyle()));
    this.addUi(this.add.text(x + 148, y + 116, 'Guard skin online', this.labelStyle()));
    this.addUi(this.add.text(x + 148, y + 154, activeSkin.description, {
      ...this.bodyStyle(),
      color: '#cbd5e1',
      wordWrap: { width: leftWidth - 188 }
    }));
    this.addUi(this.add.text(x + 34, y + 242, 'EQUIPPED MODULES', this.labelStyle()));
    this.addUi(this.add.text(x + 34, y + 280, equippedItems.length
      ? equippedItems.map((item) => `> ${item.name}`).join('\n')
      : '> Empty slots', {
        ...this.bodyStyle(),
        lineSpacing: 10
      }));

    this.createCard(x + leftWidth + 28, y, rightWidth, 370, 'Combat Readout');
    this.drawStatsGrid(x + leftWidth + 58, y + 78, rightWidth - 88, finalStats);

    this.createButton(
      x + (width / 2) - 175,
      y + 428,
      350,
      82,
      'Deploy',
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

    this.createCard(x, y, leftWidth, 286, 'Equipment Rack');
    equipment.forEach((item, index) => {
      const isEquipped = this.equippedItemIds.has(item.id);
      const rowY = y + 76 + (index * 68);

      this.addUi(this.add.rectangle(x + 28, rowY, 14, 40, isEquipped ? 0xfacc15 : 0x475569, 1));
      this.addUi(this.add.text(x + 52, rowY - 17, item.name, this.valueStyle()));
      this.addUi(this.add.text(x + 250, rowY - 13, this.formatBonus(item.bonus), this.bodyStyle()));
      this.createButton(x + leftWidth - 165, rowY, 128, 42, isEquipped ? 'Unequip' : 'Equip', () => {
        this.toggleEquipment(item.id);
      }, isEquipped ? 'active' : 'secondary');
    });

    this.createCard(x, y + 312, leftWidth, 264, 'Hero Skin Bay');
    skins.forEach((skin, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const skinX = x + 30 + (column * ((leftWidth - 80) / 2));
      const skinY = y + 378 + (row * 88);
      const isActive = skin.id === activeSkin.id;

      this.createButton(skinX, skinY, 226, 44, isActive ? `Active: ${skin.name}` : skin.name, () => {
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

    this.createCard(rightX, y, rightWidth, 576, 'Loadout Preview');
    this.drawHeroPreview(rightX + 52, y + 94, activeSkin);
    this.addUi(this.add.text(rightX + 134, y + 76, activeSkin.name.toUpperCase(), this.valueStyle()));
    this.addUi(this.add.text(rightX + 134, y + 118, 'SKIN BONUS', this.labelStyle()));
    this.addUi(this.add.text(rightX + 134, y + 154, activeSkin.description, {
      ...this.bodyStyle(),
      color: '#cbd5e1',
      wordWrap: { width: rightWidth - 168 }
    }));
    this.drawStatsGrid(rightX + 34, y + 246, rightWidth - 68, finalStats);
  }

  createTabButton(x, y, width, label, tab) {
    this.createButton(x - (width / 2), y, width, 46, label, () => {
      this.activeTab = tab;
      this.render();
    }, this.activeTab === tab ? 'active' : 'tab');
  }

  createCard(x, y, width, height, title) {
    const shadow = this.add.rectangle(x + (width / 2) + 8, y + (height / 2) + 8, width, height, 0x020617, 0.45);
    const card = this.add.rectangle(x + (width / 2), y + (height / 2), width, height, 0x0d1828, 0.96);
    const topLine = this.add.rectangle(x + (width / 2), y + 1, width, 4, 0xf59e0b, 0.95);
    const sideLine = this.add.rectangle(x + 2, y + (height / 2), 4, height - 18, 0x38bdf8, 0.55);
    const titleText = this.add.text(x + 28, y + 22, title.toUpperCase(), this.headingStyle());

    card.setStrokeStyle(2, 0x334155, 1);
    this.addUi(shadow);
    this.addUi(card);
    this.addUi(topLine);
    this.addUi(sideLine);
    this.addUi(titleText);
  }

  createButton(x, y, width, height, label, onClick, variant = 'secondary') {
    const colors = {
      primary: { fill: 0x9a3412, hover: 0xc2410c, stroke: 0xfacc15 },
      active: { fill: 0x0f766e, hover: 0x0d9488, stroke: 0x5eead4 },
      tab: { fill: 0x111827, hover: 0x1f2937, stroke: 0x64748b },
      secondary: { fill: 0x172033, hover: 0x26384f, stroke: 0x64748b }
    };
    const palette = colors[variant] || colors.secondary;
    const button = this.add.rectangle(x + (width / 2), y, width, height, palette.fill, 1);
    const shine = this.add.rectangle(x + (width / 2), y - (height / 2) + 5, width - 18, 4, 0xffffff, 0.18);
    const text = this.add.text(x + (width / 2), y, label, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
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
    this.addUi(shine);
    this.addUi(text);
  }

  drawMenuBackdrop(width, height) {
    this.addUi(this.add.rectangle(width / 2, height / 2, width, height, 0x07111f));
    for (let x = -80; x < width + 80; x += 96) {
      this.addUi(this.add.line(0, 0, x, 0, x + 260, height, 0x1e3a5f, 0.32));
    }
    for (let y = 140; y < height; y += 86) {
      this.addUi(this.add.line(0, 0, 0, y, width, y, 0x23384f, 0.26));
    }
    this.addUi(this.add.circle(width * 0.76, height * 0.28, 210, 0x7c2d12, 0.18));
    this.addUi(this.add.circle(width * 0.18, height * 0.82, 170, 0x0f766e, 0.18));
    this.addUi(this.add.rectangle(width / 2, height / 2, width - 44, height - 38, 0x020617, 0).setStrokeStyle(4, 0x334155, 0.8));
  }

  drawHeroPreview(x, y, skin) {
    this.addUi(this.add.circle(x, y, 50, skin.colors.aura, 0.22));
    this.addUi(this.add.circle(x, y, 28, skin.colors.hero, 1).setStrokeStyle(4, skin.colors.border, 1));
    this.addUi(this.add.rectangle(x, y + 44, 78, 10, skin.colors.border, 0.8));
    this.addUi(this.add.rectangle(x, y + 58, 54, 8, 0xfacc15, 0.85));
  }

  drawStatsGrid(x, y, width, stats) {
    const rows = [
      ['HP', stats.hp],
      ['DMG', stats.damage],
      ['MOVE', stats.moveSpeed],
      ['ATK SPD', stats.attackSpeed],
      ['RANGE', stats.attackRange],
      ['CRIT', `${Math.round(stats.criticalChance * 100)}%`]
    ];
    const colWidth = width / 2;

    rows.forEach(([label, value], index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const chipX = x + (col * colWidth);
      const chipY = y + (row * 76);
      const chip = this.add.rectangle(chipX + (colWidth / 2) - 8, chipY + 26, colWidth - 18, 58, 0x111827, 0.9);
      chip.setStrokeStyle(2, 0x334155, 1);
      this.addUi(chip);
      this.addUi(this.add.text(chipX + 18, chipY + 8, label, this.labelStyle()));
      this.addUi(this.add.text(chipX + 18, chipY + 31, `${value}`, {
        ...this.valueStyle(),
        fontSize: '22px',
        color: '#facc15'
      }));
    });
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
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '22px',
      color: '#facc15',
      fontStyle: 'bold'
    };
  }

  labelStyle() {
    return {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '15px',
      color: '#94a3b8',
      fontStyle: 'bold'
    };
  }

  valueStyle() {
    return {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '19px',
      color: '#f8fafc',
      fontStyle: 'bold'
    };
  }

  bodyStyle() {
    return {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
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
