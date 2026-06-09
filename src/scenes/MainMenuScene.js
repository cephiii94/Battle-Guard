import Phaser from 'phaser';
import skins from '../data/skins.js';
import {
  EQUIPMENT_SLOTS,
  equipItem,
  formatEquipmentBonus,
  getEquipmentInventory,
  getEquippedItemBySlot,
  getEquippedItems,
  getInventoryItems,
  unequipSlot
} from '../systems/EquipmentInventory.js';
import {
  getAvailableHeroes,
  getSelectedHero,
  getSelectedHeroBaseStats,
  setSelectedHero
} from '../systems/HeroSelection.js';
import { calculateFinalStats } from '../systems/HeroStats.js';
import { getPlayerProgress } from '../systems/PlayerProgress.js';
import { getStageById } from '../data/stages.js';

const UI = {
  white: '#ffffff',
  cyan: '#69e6ff',
  cyanDark: '#0c86bd',
  blueText: '#dff8ff',
  yellow: '#ffdc5a',
  purple: '#b53cff',
};

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  preload() {
    getAvailableHeroes().forEach((hero) => {
      if (hero.assetPath.endsWith('.svg')) {
        this.load.svg(hero.assetKey, hero.assetPath, { width: 160, height: 160 });
        return;
      }

      this.load.image(hero.assetKey, hero.assetPath);
    });

    this.load.image('ui-settings-dot', '/assets/ui/settings-gear.svg');
    this.load.image('ui-icon-gem', '/assets/ui/icon-gem.svg');
    this.load.image('ui-icon-gold', '/assets/ui/icon-gold.svg');
    this.load.image('ui-currency-bar', '/assets/ui/currency-bar.svg');
    this.load.image('ui-side-button', '/assets/ui/neon-side-button.svg');
    this.load.image('ui-battle-button', '/assets/ui/neon-battle-button.svg');
    this.load.image('ui-purple-button', '/assets/ui/neon-purple-button.svg');
    this.load.image('ui-hex-slot', '/assets/ui/neon-hex-slot.svg');
    this.load.image('ui-hex-active', '/assets/ui/neon-hex-active.svg');
    this.load.image('ui-character-orb', '/assets/ui/neon-character-orb.svg');
    this.load.image('ui-bottom-panel', '/assets/ui/neon-panel-bottom.svg');
    this.load.image('ui-stat-damage', '/assets/ui/icon-damage.svg');
    this.load.image('ui-stat-hp', '/assets/ui/icon-hp.svg');
    this.load.image('ui-stat-aspd', '/assets/ui/icon-aspd.svg');

    // Load Lucide Lock icon dynamically as SVG using Blob URL to ensure XHR compatibility in Phaser
    const lockSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
    const blob = new Blob([lockSvgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    this.load.svg('ui-lock-icon', url, { width: 48, height: 48 });
  }

  create() {
    const { width, height } = this.scale;
    this.playerProgress = getPlayerProgress(this);
    this.activeSkin = skins[0];
    this.inventoryLayer = [];
    this.stageSelectionLayer = [];
    this.loadoutSlotAnchors = [];
    this.loadoutSlotLayer = [];
    this.refreshHeroLoadout();

    this.drawGalaxyBackground(width, height);
    this.addTopBar(width);
    this.addLeftMenu();
    this.addRightRewards(width);
    this.addHeroFocus(width, height);
    this.addBottomActions(width, height);
  }

  drawGalaxyBackground(width, height) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x151038, 0x081c42, 0x10125c, 0x061c35, 1);
    bg.fillRect(0, 0, width, height);

    bg.fillStyle(0x7d39ff, 0.18);
    bg.fillCircle(width * 0.56, height * 0.38, 170);
    bg.fillStyle(0x00d6ff, 0.12);
    bg.fillCircle(width * 0.53, height * 0.45, 230);
    bg.lineStyle(3, 0x4bdbff, 0.25);
    bg.strokeEllipse(width * 0.54, height * 0.5, 430, 270);
    bg.lineStyle(2, 0xd543ff, 0.28);
    bg.strokeEllipse(width * 0.55, height * 0.47, 300, 210);

    const stars = [
      [78, 42, 2], [148, 91, 1], [224, 42, 1], [313, 88, 2], [420, 33, 1],
      [510, 96, 2], [610, 45, 1], [690, 112, 1], [64, 270, 1], [176, 310, 2],
      [298, 302, 1], [438, 276, 1], [548, 318, 2], [705, 286, 1],
    ];

    bg.fillStyle(0xffffff, 0.7);
    stars.forEach(([x, y, r]) => bg.fillCircle(x, y, r));
  }

  addTopBar(width) {
    this.add.image(26, 26, 'ui-settings-dot').setDisplaySize(38, 38).setInteractive({ useHandCursor: true });

    this.drawLevelBadge(91, 27);
    this.add.text(122, 12, 'Player6634', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: UI.white,
      fontStyle: '800',
    });

    this.drawProgressBar(122, 34, 154, 18, 100, 1500);

    this.add.image(width - 118, 24, 'ui-currency-bar').setDisplaySize(242, 46);
    this.addCurrency(width - 208, 24, 'ui-icon-gold', this.formatCurrency(this.playerProgress.gold));
    this.addCurrency(width - 94, 24, 'ui-icon-gem', '640');
    this.add.text(width - 24, 20, '+', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: UI.cyan,
      fontStyle: '800',
      stroke: '#17246c',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  drawLevelBadge(x, y) {
    const badge = this.add.graphics();
    badge.fillStyle(0x2f2a8f, 1);
    badge.lineStyle(3, 0xd8e7ff, 1);
    badge.beginPath();
    badge.moveTo(x, y - 25);
    badge.lineTo(x + 26, y - 10);
    badge.lineTo(x + 20, y + 20);
    badge.lineTo(x, y + 30);
    badge.lineTo(x - 20, y + 20);
    badge.lineTo(x - 26, y - 10);
    badge.closePath();
    badge.fillPath();
    badge.strokePath();

    this.add.text(x, y + 1, '12', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: UI.white,
      fontStyle: '900',
    }).setOrigin(0.5);
  }

  drawProgressBar(x, y, width, height, current, max) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x17205f, 1);
    graphics.fillRoundedRect(x, y, width, height, 3);
    graphics.fillStyle(0x23c7ff, 1);
    graphics.fillRoundedRect(x + 2, y + 2, Math.max(20, (width - 4) * (current / max)), height - 4, 3);
    graphics.lineStyle(2, 0x70eaff, 1);
    graphics.strokeRoundedRect(x, y, width, height, 3);

    this.add.text(x + width / 2, y + height / 2, `${current}/${max}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: UI.blueText,
      fontStyle: '800',
    }).setOrigin(0.5);
  }

  addCurrency(x, y, iconKey, value) {
    this.add.image(x, y, iconKey).setDisplaySize(26, 26);
    this.add.text(x + 22, y, value, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: UI.white,
      fontStyle: '800',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);
  }

  addLeftMenu() {
    const items = [
      { y: 105, icon: '🛒', label: 'TOKO' },
      { y: 177, icon: '🏆', label: 'RANK' },
      { y: 249, icon: '⚗', label: 'LAB' },
    ];

    items.forEach((item) => {
      const button = this.add.image(62, item.y, 'ui-side-button').setInteractive({ useHandCursor: true });
      button.on('pointerover', () => button.setScale(1.05));
      button.on('pointerout', () => button.setScale(1));

      this.add.text(62, item.y - 8, item.icon, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: UI.white,
      }).setOrigin(0.5);
      this.add.text(62, item.y + 22, item.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5);
    });
  }

  addRightRewards(width) {
    this.addRewardBadge(width - 103, 88, '1D 16H');
    this.addCup(width - 43, 92);
    this.add.text(width - 44, 130, '1 526', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.addSmallQuest(width - 43, 178, '!');
    this.addSmallQuest(width - 43, 232, '!');
    this.addSmallQuest(width - 43, 304, '3');
  }

  addRewardBadge(x, y, label) {
    const g = this.add.graphics();
    g.fillStyle(0xff7a0b, 1);
    g.fillCircle(x, y, 27);
    g.lineStyle(3, 0xffd84d, 1);
    g.strokeCircle(x, y, 27);
    this.add.text(x, y + 36, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: UI.white,
      fontStyle: '800',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  addCup(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0xffcc32, 1);
    g.fillEllipse(x, y - 4, 38, 22);
    g.fillRect(x - 12, y - 2, 24, 26);
    g.fillEllipse(x, y + 24, 34, 11);
    g.lineStyle(3, 0xfff2a8, 1);
    g.strokeEllipse(x, y - 4, 38, 22);
  }

  addSmallQuest(x, y, notice) {
    const panel = this.add.graphics();
    panel.fillStyle(0x29339a, 1);
    panel.fillRoundedRect(x - 24, y - 22, 48, 44, 7);
    panel.lineStyle(2, 0x65e8ff, 1);
    panel.strokeRoundedRect(x - 24, y - 22, 48, 44, 7);

    this.add.text(x, y, '✓', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: UI.cyan,
      fontStyle: '900',
    }).setOrigin(0.5);

    this.add.circle(x + 23, y - 20, 10, 0xff3131);
    this.add.text(x + 23, y - 20, notice, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: UI.white,
      fontStyle: '900',
    }).setOrigin(0.5);
  }

  addHeroFocus(width, height) {
    const cx = width / 2 + 20;
    const cy = height / 2 - 18;

    this.add.text(cx, 72, 'BATTLE GUARD', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#1b1b77',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.heroClassText = this.add.text(cx, 101, this.selectedHero.name.toUpperCase(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: UI.yellow,
      fontStyle: '800',
      stroke: '#1b1b77',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(cx - 88, 135, 'Lv. 46', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#1b1b77',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.addEquipmentSlots(cx - 178, cy + 3, -1);
    this.addEquipmentSlots(cx + 178, cy + 3, 1);
    this.refreshMainMenuLoadoutDisplay();
    this.add.image(cx, cy, 'ui-character-orb').setDisplaySize(188, 188);
    this.heroPortrait = this.add.image(cx, cy - 2, this.selectedHero.assetKey)
      .setDisplaySize(138, 138);

    this.add.text(cx + 68, cy + 75, '1/999', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#1b1b77',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.image(cx + 112, cy + 75, 'ui-icon-gold').setDisplaySize(30, 30);
  }

  addEquipmentSlots(x, y, side) {
    const slots = side < 0
      ? [
        { slot: 'weapon', label: 'WEAPON', yOffset: -73, xOffset: 0 },
        { slot: 'accessory', label: 'RING', yOffset: -15, xOffset: 8 },
        { slot: null, label: 'SLOT', yOffset: 43, xOffset: 0 }
      ]
      : [
        { slot: 'armor', label: 'ARMOR', yOffset: -73, xOffset: 0 },
        { slot: null, label: 'SLOT', yOffset: -15, xOffset: -8 },
        { slot: null, label: 'SLOT', yOffset: 43, xOffset: 0 }
      ];

    this.add.text(x, y - 124, side < 0 ? 'WEAPON' : 'ARMOR', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: UI.cyan,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0.5);

    slots.forEach((slotConfig, index) => {
      const slotX = x + (side * slotConfig.xOffset);
      const slotY = y + slotConfig.yOffset;
      const texture = index === 0 ? 'ui-hex-active' : 'ui-hex-slot';
      const size = index === 0 ? 66 : 58;

      this.add.image(slotX, slotY, texture).setDisplaySize(size, size).setAlpha(0.95);
      this.loadoutSlotAnchors.push({
        ...slotConfig,
        x: slotX,
        y: slotY
      });
    });
  }

  addBottomActions(width, height) {
    const cx = width / 2 + 20;

    const loadoutY = height - 118;
    const statusY = height - 43;

    const cells = this.add.image(cx, loadoutY, 'ui-purple-button').setInteractive({ useHandCursor: true });
    this.add.text(cx, loadoutY, '▦ LOADOUT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#39106a',
      strokeThickness: 3,
    }).setOrigin(0.5);
    cells.on('pointerover', () => cells.setScale(1.04));
    cells.on('pointerout', () => cells.setScale(1));
    cells.on('pointerup', () => this.showInventoryTab());

    this.add.image(cx, statusY, 'ui-bottom-panel').setDisplaySize(332, 66);
    this.bottomStatTexts = {
      damage: this.addStat(cx - 104, statusY, 'ui-stat-damage', 'DMG', this.finalHeroStats.damage),
      hp: this.addStat(cx, statusY, 'ui-stat-hp', 'HP', this.finalHeroStats.hp),
      attackSpeed: this.addStat(cx + 104, statusY, 'ui-stat-aspd', 'ASPD', this.finalHeroStats.attackSpeed)
    };

    const battle = this.add.image(width - 92, height - 54, 'ui-battle-button').setInteractive({ useHandCursor: true });
    this.add.text(width - 92, height - 54, 'BATTLE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#9d3300',
      strokeThickness: 4,
    }).setOrigin(0.5);
    battle.on('pointerover', () => battle.setScale(1.04));
    battle.on('pointerout', () => battle.setScale(1));
    battle.on('pointerdown', () => battle.setScale(0.98));
    battle.on('pointerup', () => this.showStageSelectionTab());

    this.addEventOffer(height);
  }

  addStat(x, y, iconKey, label, value) {
    this.add.image(x - 28, y, iconKey).setDisplaySize(24, 24);
    this.add.text(x + 12, y - 9, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#9af2ff',
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 2,
    }).setOrigin(0.5);
    const valueText = this.add.text(x + 12, y + 9, value, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: UI.cyan,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0.5);

    return valueText;
  }

  addEventOffer(height) {
    const g = this.add.graphics();
    g.fillStyle(0x21aaff, 1);
    g.fillRoundedRect(24, height - 70, 170, 50, 8);
    g.lineStyle(2, 0x9af2ff, 1);
    g.strokeRoundedRect(24, height - 70, 170, 50, 8);

    this.add.circle(47, height - 45, 18, 0xff7a0b);
    this.add.text(74, height - 45, 'EVENT HARIAN', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value);
  }

  refreshHeroLoadout() {
    getEquipmentInventory(this);
    this.selectedHero = getSelectedHero(this);
    this.selectedHeroBaseStats = getSelectedHeroBaseStats(this);
    this.activeSkin = this.getDefaultSkinForHero(this.selectedHero);
    this.equippedItems = getEquippedItems(this);
    this.finalHeroStats = calculateFinalStats(this.selectedHeroBaseStats, this.equippedItems, this.activeSkin, 1);
  }

  refreshBottomStats() {
    if (!this.bottomStatTexts) {
      return;
    }

    this.bottomStatTexts.damage.setText(this.finalHeroStats.damage);
    this.bottomStatTexts.hp.setText(this.finalHeroStats.hp);
    this.bottomStatTexts.attackSpeed.setText(this.finalHeroStats.attackSpeed);

    if (this.heroClassText) {
      this.heroClassText.setText(this.selectedHero.name.toUpperCase());
    }

    if (this.heroPortrait) {
      this.heroPortrait.setTexture(this.selectedHero.assetKey);
    }
  }

  showInventoryTab() {
    this.clearInventoryTab();
    this.refreshHeroLoadout();
    this.refreshBottomStats();

    const { width, height } = this.scale;
    this.addInventoryItem(this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.62));
    this.addInventoryItem(this.add.rectangle(width / 2, height / 2, 820, 590, 0x101a3a, 0.98))
      .setStrokeStyle(3, 0x69e6ff, 0.9);
    this.addInventoryItem(this.add.text(width / 2, 88, 'INVENTORY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 4,
    }).setOrigin(0.5));

    this.addInventoryCloseButton(width / 2 + 372, 90);
    this.addHeroSelectionPanel(width / 2 - 330, 158);
    this.addEquipmentSlotPanel(width / 2 - 245, 286);
    this.addInventoryList(width / 2 + 20, 286);
    this.addTotalStatsPanel(width / 2 - 245, 508);
  }

  addHeroSelectionPanel(x, y) {
    this.addInventoryItem(this.add.text(x, y - 34, 'HERO CLASS', this.getInventoryTitleStyle()));

    getAvailableHeroes().forEach((hero, index) => {
      const heroX = x + 92 + (index * 170);
      const isSelected = hero.id === this.selectedHero.id;
      const card = this.addInventoryItem(this.add.rectangle(heroX, y + 20, 154, 74, isSelected ? 0x1e3a8a : 0x111827, 0.96))
        .setStrokeStyle(2, isSelected ? 0xfacc15 : 0x64748b, 0.9)
        .setInteractive({ useHandCursor: true });

      this.addInventoryItem(this.add.image(heroX - 54, y + 20, hero.assetKey)
        .setDisplaySize(46, 46));
      this.addInventoryItem(this.add.text(heroX - 24, y - 4, hero.name, this.getInventoryTextStyle(isSelected ? UI.yellow : UI.white, 16))
        .setOrigin(0.5));
      this.addInventoryItem(this.add.text(heroX - 24, y + 18, hero.description, this.getInventoryTextStyle('#bfdbfe', 10))
        .setOrigin(0.5));
      this.addInventoryItem(this.add.text(heroX - 24, y + 38, this.formatPassiveBonus(hero), this.getInventoryTextStyle(UI.cyan, 10))
        .setOrigin(0.5));

      card.on('pointerup', () => {
        setSelectedHero(this, hero.id);
        this.refreshHeroLoadout();
        this.refreshBottomStats();
        this.showInventoryTab();
      });
    });
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
      criticalChance: 'CRIT'
    };

    return labels[statName] || statName;
  }

  formatHeroBonus(statName, value) {
    if (statName === 'criticalChance') {
      return `+${Math.round(value * 100)}%`;
    }

    return `+${value}`;
  }

  getDefaultSkinForHero(hero) {
    return skins.find((skin) => skin.id === hero.cosmeticSkinId) || skins[0];
  }

  addEquipmentSlotPanel(x, y) {
    this.addInventoryItem(this.add.text(x, y - 38, 'EQUIPPED', this.getInventoryTitleStyle()));

    EQUIPMENT_SLOTS.forEach((slot, index) => {
      const item = getEquippedItemBySlot(this, slot);
      const slotY = y + (index * 62);
      const button = this.addInventoryItem(this.add.rectangle(x + 118, slotY, 270, 48, 0x172554, 0.96))
        .setStrokeStyle(2, item ? 0xfacc15 : 0x38bdf8, 0.85)
        .setInteractive({ useHandCursor: true });

      this.addInventoryItem(this.add.text(x - 2, slotY, slot.toUpperCase(), this.getInventoryTextStyle('#9af2ff', 13))
        .setOrigin(0, 0.5));
      this.addInventoryItem(this.add.text(x + 96, slotY, item ? item.name : 'Empty', this.getInventoryTextStyle(UI.white, 16))
        .setOrigin(0, 0.5));

      button.on('pointerup', () => {
        if (item) {
          unequipSlot(this, slot);
          this.refreshHeroLoadout();
          this.refreshBottomStats();
          this.refreshMainMenuLoadoutDisplay();
          this.showInventoryTab();
        }
      });
    });
  }

  addInventoryList(x, y) {
    this.addInventoryItem(this.add.text(x, y - 38, 'ITEMS', this.getInventoryTitleStyle()));

    getInventoryItems(this).forEach((item, index) => {
      const rowY = y + (index * 58);
      const isEquipped = getEquippedItemBySlot(this, item.slot)?.id === item.id;
      const row = this.addInventoryItem(this.add.rectangle(x + 170, rowY, 320, 46, isEquipped ? 0x1e3a8a : 0x111827, 0.96))
        .setStrokeStyle(2, isEquipped ? 0xfacc15 : 0x64748b, 0.9)
        .setInteractive({ useHandCursor: true });

      this.addInventoryItem(this.add.text(x + 22, rowY - 8, item.name, this.getInventoryTextStyle(UI.white, 16)));
      this.addInventoryItem(this.add.text(x + 22, rowY + 12, `${item.slot.toUpperCase()}  ${formatEquipmentBonus(item)}`, this.getInventoryTextStyle('#bfdbfe', 12)));
      this.addInventoryItem(this.add.text(x + 296, rowY, isEquipped ? 'EQUIPPED' : 'EQUIP', this.getInventoryTextStyle(isEquipped ? '#facc15' : UI.cyan, 12))
        .setOrigin(0.5));

      row.on('pointerup', () => {
        equipItem(this, item.id);
        this.refreshHeroLoadout();
        this.refreshBottomStats();
        this.refreshMainMenuLoadoutDisplay();
        this.showInventoryTab();
      });
    });
  }

  addTotalStatsPanel(x, y) {
    const stats = [
      ['HP', this.finalHeroStats.hp],
      ['Attack', this.finalHeroStats.damage],
      ['Attack Speed', this.finalHeroStats.attackSpeed],
      ['Move Speed', this.finalHeroStats.moveSpeed],
      ['Crit Chance', `${Math.round(this.finalHeroStats.criticalChance * 100)}%`]
    ];

    this.addInventoryItem(this.add.text(x, y - 34, 'TOTAL STATUS', this.getInventoryTitleStyle()));
    this.addInventoryItem(this.add.rectangle(x + 162, y + 58, 326, 164, 0x07111f, 0.9))
      .setStrokeStyle(2, 0x38bdf8, 0.65);

    stats.forEach(([label, value], index) => {
      const statY = y + (index * 29);
      this.addInventoryItem(this.add.text(x + 24, statY, label, this.getInventoryTextStyle('#bfdbfe', 15)));
      this.addInventoryItem(this.add.text(x + 280, statY, value, this.getInventoryTextStyle(UI.yellow, 15))
        .setOrigin(1, 0));
    });
  }

  addInventoryCloseButton(x, y) {
    const button = this.addInventoryItem(this.add.rectangle(x, y, 38, 38, 0x1d4ed8, 1))
      .setStrokeStyle(2, 0x93c5fd, 1)
      .setInteractive({ useHandCursor: true });
    this.addInventoryItem(this.add.text(x, y, 'X', this.getInventoryTextStyle(UI.white, 18)).setOrigin(0.5));

    button.on('pointerup', () => this.clearInventoryTab());
  }

  refreshMainMenuLoadoutDisplay() {
    this.loadoutSlotLayer.forEach((item) => item.destroy());
    this.loadoutSlotLayer = [];

    this.loadoutSlotAnchors.forEach((anchor) => {
      const equippedItem = anchor.slot ? getEquippedItemBySlot(this, anchor.slot) : null;

      if (equippedItem) {
        this.addLoadoutSlotItem(this.add.circle(anchor.x, anchor.y, 21, 0x07111f, 0.9))
          .setStrokeStyle(2, 0xfacc15, 0.95);
        this.addLoadoutSlotItem(this.add.text(anchor.x, anchor.y - 2, equippedItem.icon || '?', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          color: UI.yellow,
          fontStyle: '900',
          stroke: '#0c1648',
          strokeThickness: 4,
        }).setOrigin(0.5));
        this.addLoadoutSlotItem(this.add.text(anchor.x, anchor.y + 33, this.getShortEquipmentName(equippedItem.name), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: UI.white,
          fontStyle: '900',
          stroke: '#0c1648',
          strokeThickness: 3,
        }).setOrigin(0.5));
        return;
      }

      this.addLoadoutSlotItem(this.add.text(anchor.x, anchor.y, anchor.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        color: '#67e8f9',
        fontStyle: '900',
        stroke: '#0c1648',
        strokeThickness: 3,
      }).setOrigin(0.5));
    });
  }

  addLoadoutSlotItem(item) {
    item.setDepth(850);
    this.loadoutSlotLayer.push(item);
    return item;
  }

  getShortEquipmentName(name) {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('');
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

  addInventoryItem(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.inventoryLayer.push(item);
    return item;
  }

  clearInventoryTab() {
    this.inventoryLayer.forEach((item) => item.destroy());
    this.inventoryLayer = [];
  }

  showStageSelectionTab() {
    this.clearStageSelectionTab();
    this.refreshHeroLoadout();
    this.playerProgress = getPlayerProgress(this);

    const { width, height } = this.scale;

    // Dim Background
    this.addStageSelectionItem(this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.75));

    // Main Dialog Panel
    this.addStageSelectionItem(
      this.add.rectangle(width / 2, height / 2, 860, 520, 0x0f172a, 0.98)
        .setStrokeStyle(3, 0x3b82f6, 0.9)
    );

    // Decorative Title bar
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x1e293b, 1);
    titleBg.fillRoundedRect(width / 2 - 200, height / 2 - 235, 400, 48, 8);
    titleBg.lineStyle(2, 0x60a5fa, 1);
    titleBg.strokeRoundedRect(width / 2 - 200, height / 2 - 235, 400, 48, 8);
    this.addStageSelectionItem(titleBg);

    // Title text
    this.addStageSelectionItem(
      this.add.text(width / 2, height / 2 - 210, 'SELECT BATTLEFIELD', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0f172a',
        strokeThickness: 3,
      }).setOrigin(0.5)
    );

    // Close Button
    this.addStageSelectionCloseButton(width / 2 + 395, height / 2 - 225);

    // Stage Grid Configuration
    const highestStage = this.playerProgress.highestStageUnlocked || 1;
    const cols = 3;
    const rows = 2;
    const startX = width / 2 - 260;
    const startY = height / 2 - 90;
    const gapX = 260;
    const gapY = 180;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const stageIndex = r * cols + c;
        const stageId = stageIndex + 1;
        const x = startX + c * gapX;
        const y = startY + r * gapY;

        this.drawStageCard(x, y, stageId, highestStage);
      }
    }
  }

  drawStageCard(x, y, stageId, highestStage) {
    const stage = getStageById(stageId);
    const isUnlocked = stageId <= highestStage;

    if (isUnlocked) {
      // Unlocked Stage Card
      const card = this.addStageSelectionItem(
        this.add.rectangle(x, y, 230, 150, 0x1e293b, 0.95)
          .setStrokeStyle(2, 0x3b82f6, 0.95)
          .setInteractive({ useHandCursor: true })
      );

      const stageNumText = this.addStageSelectionItem(
        this.add.text(x, y - 48, stage.stageName.toUpperCase(), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          color: UI.yellow,
          fontStyle: '900',
          stroke: '#0c1648',
          strokeThickness: 3,
        }).setOrigin(0.5)
      );

      const durationText = this.addStageSelectionItem(
        this.add.text(x, y - 12, `⏱ Duration: ${stage.duration}s`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          color: '#bfdbfe',
          fontStyle: '800',
        }).setOrigin(0.5)
      );

      const rewardText = this.addStageSelectionItem(
        this.add.text(x, y + 15, `💰 Reward: ${stage.goldReward}g`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          color: UI.cyan,
          fontStyle: '800',
        }).setOrigin(0.5)
      );

      const btnBg = this.addStageSelectionItem(
        this.add.rectangle(x, y + 50, 130, 28, 0x2563eb, 1)
          .setStrokeStyle(1, 0x60a5fa, 1)
      );

      const btnText = this.addStageSelectionItem(
        this.add.text(x, y + 50, 'START BATTLE', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: UI.white,
          fontStyle: '900',
        }).setOrigin(0.5)
      );

      // Card hover animation
      card.on('pointerover', () => {
        card.setScale(1.04);
        card.setStrokeStyle(3, 0x60a5fa, 1);
        stageNumText.setScale(1.04);
        btnBg.setScale(1.04);
        btnText.setScale(1.04);
      });

      card.on('pointerout', () => {
        card.setScale(1);
        card.setStrokeStyle(2, 0x3b82f6, 0.95);
        stageNumText.setScale(1);
        btnBg.setScale(1);
        btnText.setScale(1);
      });

      card.on('pointerup', () => {
        this.clearStageSelectionTab();
        this.scene.start('GameScene', {
          stageId,
          selectedHero: this.selectedHero,
          baseHeroStats: this.selectedHeroBaseStats,
          equippedItems: this.equippedItems,
          activeSkin: this.activeSkin,
          finalStats: this.finalHeroStats
        });
      });
    } else {
      // Locked Stage Card
      const card = this.addStageSelectionItem(
        this.add.rectangle(x, y, 230, 150, 0x0f172a, 0.7)
          .setStrokeStyle(1, 0x475569, 0.8)
      );

      this.addStageSelectionItem(
        this.add.text(x, y - 48, stage.stageName.toUpperCase(), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          color: '#64748b',
          fontStyle: '900',
        }).setOrigin(0.5)
      );

      // Padlock Icon
      this.addStageSelectionItem(
        this.add.image(x, y, 'ui-lock-icon')
          .setDisplaySize(38, 38)
          .setOrigin(0.5)
      );

      this.addStageSelectionItem(
        this.add.text(x, y + 44, 'LOCKED', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#64748b',
          fontStyle: '900',
          letterSpacing: 2,
        }).setOrigin(0.5)
      );
    }
  }

  addStageSelectionCloseButton(x, y) {
    const button = this.addStageSelectionItem(
      this.add.rectangle(x, y, 36, 36, 0xd97706, 1)
        .setStrokeStyle(2, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );

    const text = this.addStageSelectionItem(
      this.add.text(x, y, 'X', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    button.on('pointerover', () => {
      button.setScale(1.1);
      text.setScale(1.1);
    });

    button.on('pointerout', () => {
      button.setScale(1);
      text.setScale(1);
    });

    button.on('pointerup', () => this.clearStageSelectionTab());
  }

  addStageSelectionItem(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.stageSelectionLayer.push(item);
    return item;
  }

  clearStageSelectionTab() {
    this.stageSelectionLayer.forEach((item) => item.destroy());
    this.stageSelectionLayer = [];
  }
}

