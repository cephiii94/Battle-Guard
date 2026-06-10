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
import { getPlayerProgress, addPlayerGold } from '../systems/PlayerProgress.js';
import { getStageById } from '../data/stages.js';
import { saveHeroLevel } from '../services/saveService.js';
import { soundManager } from '../services/soundManager.js';

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

    // Preload custom skins assets if they have them
    skins.forEach((skin) => {
      if (skin.assetKey && skin.assetPath) {
        if (skin.assetPath.endsWith('.svg')) {
          this.load.svg(skin.assetKey, skin.assetPath, { width: 160, height: 160 });
        } else {
          this.load.image(skin.assetKey, skin.assetPath);
        }
      }
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
    this.settingsLayer = [];
    this.loadoutSlotAnchors = [];
    this.loadoutSlotLayer = [];
    this.refreshHeroLoadout();

    this.drawGalaxyBackground(width, height);
    this.addTopBar(width);
    this.addLeftMenu();
    this.addRightRewards(width);
    this.addHeroFocus(width, height);
    this.addBottomActions(width, height);

    soundManager.playBGM(this, 'menu-bgm');
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
    const topY = 32;

    this.drawLevelBadge(46, topY);
    this.add.text(82, topY - 14, 'Player6634', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: UI.white,
      fontStyle: '800',
    });

    this.drawProgressBar(82, topY + 6, 154, 15, 100, 1500);

    this.add.image(width - 150, topY, 'ui-currency-bar').setDisplaySize(242, 42);
    this.goldText = this.addCurrency(width - 240, topY, 'ui-icon-gold', this.formatCurrency(this.playerProgress.gold));
    this.addCurrency(width - 126, topY, 'ui-icon-gem', '640');
    
    const plusBtn = this.add.text(width - 56, topY - 4, '+', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      color: UI.cyan,
      fontStyle: '800',
      stroke: '#17246c',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    plusBtn.on('pointerover', () => {
      plusBtn.setScale(1.1);
      soundManager.playSFX(this, 'hover');
    });
    plusBtn.on('pointerout', () => plusBtn.setScale(1));
    plusBtn.on('pointerup', () => soundManager.playSFX(this, 'click'));
  }

  drawLevelBadge(x, y) {
    const badge = this.add.graphics();
    badge.fillStyle(0x2f2a8f, 1);
    badge.lineStyle(2.5, 0xd8e7ff, 1);
    badge.beginPath();
    badge.moveTo(x, y - 20);
    badge.lineTo(x + 20, y - 8);
    badge.lineTo(x + 16, y + 16);
    badge.lineTo(x, y + 24);
    badge.lineTo(x - 16, y + 16);
    badge.lineTo(x - 20, y - 8);
    badge.closePath();
    badge.fillPath();
    badge.strokePath();

    this.add.text(x, y + 1, '12', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: UI.white,
      fontStyle: '900',
    }).setOrigin(0.5);
  }

  drawProgressBar(x, y, width, height, current, max) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x17205f, 1);
    graphics.fillRoundedRect(x, y, width, height, 3);
    graphics.fillStyle(0x23c7ff, 1);
    graphics.fillRoundedRect(x + 1.5, y + 1.5, Math.max(10, (width - 3) * (current / max)), height - 3, 3);
    graphics.lineStyle(1.5, 0x70eaff, 1);
    graphics.strokeRoundedRect(x, y, width, height, 3);

    this.add.text(x + width / 2, y + height / 2, `${current}/${max}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: UI.blueText,
      fontStyle: '800',
    }).setOrigin(0.5);
  }

  addCurrency(x, y, iconKey, value) {
    this.add.image(x, y, iconKey).setDisplaySize(26, 26);
    return this.add.text(x + 22, y, value, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: UI.white,
      fontStyle: '800',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);
  }

  addLeftMenu() {
    const panelX = 75;
    const panelY = 360;
    const panelW = 100;
    const panelH = 460;
    
    const panel = this.add.graphics();
    panel.fillStyle(0x0a1024, 0.75);
    panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 12);
    panel.lineStyle(2, 0x00d6ff, 0.45);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 12);

    const items = [
      { y: 190, icon: '🛒', label: 'TOKO' },
      { y: 280, icon: '🏆', label: 'RANK' },
      { y: 370, icon: '⚗', label: 'LAB' },
    ];

    const settingsBtn = this.add.image(panelX, 470, 'ui-settings-dot').setDisplaySize(38, 38).setInteractive({ useHandCursor: true });
    settingsBtn.on('pointerover', () => {
      settingsBtn.setScale(1.1);
      soundManager.playSFX(this, 'hover');
    });
    settingsBtn.on('pointerout', () => settingsBtn.setScale(1));
    settingsBtn.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showSettingsTab();
    });

    items.forEach((item) => {
      const button = this.add.image(panelX, item.y, 'ui-side-button').setInteractive({ useHandCursor: true });
      button.on('pointerover', () => {
        button.setScale(1.06);
        soundManager.playSFX(this, 'hover');
      });
      button.on('pointerout', () => button.setScale(1));
      button.on('pointerup', () => soundManager.playSFX(this, 'click'));

      this.add.text(panelX, item.y - 8, item.icon, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: UI.white,
      }).setOrigin(0.5);
      this.add.text(panelX, item.y + 22, item.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5);
    });
  }

  addRightRewards(width) {
    const panelX = width - 75;
    const panelY = 360;
    const panelW = 100;
    const panelH = 460;
    
    const panel = this.add.graphics();
    panel.fillStyle(0x0a1024, 0.75);
    panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 12);
    panel.lineStyle(2, 0xd543ff, 0.45);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 12);

    this.addRewardBadge(panelX, 180, '1D 16H');
    this.addTrophyCard(panelX, 270);
    this.addSmallQuest(panelX, 360, '!');
    this.addSmallQuest(panelX, 430, '3');
  }

  addRewardBadge(x, y, label) {
    const trophyBg = this.add.graphics();
    trophyBg.fillStyle(0x1a153b, 0.9);
    trophyBg.fillRoundedRect(x - 36, y - 30, 72, 60, 8);
    trophyBg.lineStyle(1.5, 0xff7a0b, 0.8);
    trophyBg.strokeRoundedRect(x - 36, y - 30, 72, 60, 8);

    this.add.text(x, y - 10, '🎁', { fontSize: '20px' }).setOrigin(0.5);
    this.add.text(x, y + 16, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: UI.white,
      fontStyle: '800',
      stroke: '#0c1648',
      strokeThickness: 2,
    }).setOrigin(0.5);
  }

  addTrophyCard(x, y) {
    const trophyBg = this.add.graphics();
    trophyBg.fillStyle(0x1a153b, 0.9);
    trophyBg.fillRoundedRect(x - 36, y - 30, 72, 60, 8);
    trophyBg.lineStyle(1.5, 0xffd84d, 0.8);
    trophyBg.strokeRoundedRect(x - 36, y - 30, 72, 60, 8);
    
    this.add.text(x, y - 10, '🏆', { fontSize: '20px' }).setOrigin(0.5);
    
    this.add.text(x, y + 16, '1 526', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  addSmallQuest(x, y, notice) {
    const panel = this.add.graphics();
    panel.fillStyle(0x1a153b, 0.9);
    panel.fillRoundedRect(x - 36, y - 24, 72, 48, 8);
    panel.lineStyle(1.5, 0x65e8ff, 0.8);
    panel.strokeRoundedRect(x - 36, y - 24, 72, 48, 8);

    this.add.text(x, y, '✓', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: UI.cyan,
      fontStyle: '900',
    }).setOrigin(0.5);

    const badge = this.add.graphics();
    badge.fillStyle(0xff3131, 1);
    badge.fillCircle(x + 28, y - 18, 9);
    badge.lineStyle(1.5, 0xffffff, 1);
    badge.strokeCircle(x + 28, y - 18, 9);

    this.add.text(x + 28, y - 18, notice, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: UI.white,
      fontStyle: '900',
    }).setOrigin(0.5);
  }

  addHeroFocus(width, height) {
    const cx = width / 2;
    const cy = height / 2 - 10;

    this.add.text(cx, 68, 'BATTLE GUARD', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#1b1b77',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.heroClassText = this.add.text(cx, 104, this.selectedHero.name.toUpperCase(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: UI.yellow,
      fontStyle: '800',
      stroke: '#1b1b77',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.heroLevelText = this.add.text(cx, 128, `Lv. ${this.heroLevel}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#1b1b77',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.addEquipmentSlots(cx - 180, cy, -1);
    this.addEquipmentSlots(cx + 180, cy, 1);
    this.refreshMainMenuLoadoutDisplay();

    this.add.image(cx, cy, 'ui-character-orb').setDisplaySize(188, 188);
    const activeSkin = this.activeSkin;
    const visualKey = activeSkin?.assetKey || this.selectedHero.assetKey;
    this.heroPortrait = this.add.image(cx, cy - 2, visualKey).setDisplaySize(138, 138);

    this.drawHeroUpgradeButton(cx, cy + 124);
  }

  drawHeroUpgradeButton(cx, y) {
    if (this.upgradeContainer) {
      this.upgradeContainer.destroy();
    }

    const upgradeCost = this.heroLevel * 150;
    const container = this.add.container(cx, y);
    
    const bg = this.add.rectangle(0, 0, 160, 42, 0x1d4ed8, 0.9)
      .setStrokeStyle(2, 0x60a5fa, 1)
      .setInteractive({ useHandCursor: true });
      
    const btnText = this.add.text(0, -9, 'UPGRADE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: UI.white,
      fontStyle: '900',
    }).setOrigin(0.5);
    
    const goldIcon = this.add.image(-28, 11, 'ui-icon-gold').setDisplaySize(20, 20);
    const costText = this.add.text(-12, 11, this.formatCurrency(upgradeCost), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: UI.yellow,
      fontStyle: '900',
    }).setOrigin(0, 0.5);
    
    container.add([bg, btnText, goldIcon, costText]);
    
    bg.on('pointerover', () => {
      bg.setFillStyle(0x2563eb, 1);
      bg.setStrokeStyle(2.5, 0x93c5fd, 1);
      soundManager.playSFX(this, 'hover');
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1d4ed8, 0.9);
      bg.setStrokeStyle(2, 0x60a5fa, 1);
    });
    
    bg.on('pointerdown', () => {
      bg.setScale(0.96);
    });
    
    bg.on('pointerup', () => {
      bg.setScale(1);
      this.handleHeroUpgrade(upgradeCost);
    });

    this.upgradeContainer = container;
  }

  handleHeroUpgrade(cost) {
    const currentGold = this.playerProgress.gold;
    if (currentGold < cost) {
      soundManager.playSFX(this, 'hit');
      this.showUpgradeFeedback(false, 'Not enough gold!');
      return;
    }

    soundManager.playSFX(this, 'upgrade');

    const nextGold = addPlayerGold(this, -cost);
    this.playerProgress.gold = nextGold;
    
    const nextLevel = this.heroLevel + 1;
    saveHeroLevel(this.selectedHero.id, nextLevel);
    
    const heroLevels = this.registry.get('heroLevels') || {};
    heroLevels[this.selectedHero.id] = nextLevel;
    this.registry.set('heroLevels', heroLevels);

    this.refreshHeroLoadout();
    this.refreshBottomStats();
    
    if (this.goldText) {
      this.goldText.setText(this.formatCurrency(nextGold));
    }
    
    if (this.heroLevelText) {
      this.heroLevelText.setText(`Lv. ${this.heroLevel}`);
    }
    this.drawHeroUpgradeButton(this.scale.width / 2, this.scale.height / 2 - 10 + 124);
    
    this.showUpgradeFeedback(true, 'Level Up!');
  }

  showUpgradeFeedback(success, message) {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2 - 10;
    
    const feedbackText = this.add.text(cx, cy - 80, message, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: success ? '#4ade80' : '#f87171',
      fontStyle: '900',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    
    feedbackText.setDepth(1000);
    
    this.tweens.add({
      targets: feedbackText,
      y: cy - 120,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => feedbackText.destroy()
    });
  }

  addEquipmentSlots(x, y, side) {
    const slots = side < 0
      ? [
        { slot: 'weapon', label: 'WEAPON', yOffset: -72, xOffset: 0 },
        { slot: 'accessory', label: 'RING', yOffset: 0, xOffset: 12 },
        { slot: null, label: 'SLOT', yOffset: 72, xOffset: 0 }
      ]
      : [
        { slot: 'armor', label: 'ARMOR', yOffset: -72, xOffset: 0 },
        { slot: null, label: 'SLOT', yOffset: 0, xOffset: -12 },
        { slot: null, label: 'SLOT', yOffset: 72, xOffset: 0 }
      ];

    slots.forEach((slotConfig, index) => {
      const slotX = x + (side * slotConfig.xOffset);
      const slotY = y + slotConfig.yOffset;
      const texture = slotConfig.slot ? 'ui-hex-active' : 'ui-hex-slot';
      const size = 62;

      this.add.image(slotX, slotY, texture).setDisplaySize(size, size).setAlpha(0.95);
      this.loadoutSlotAnchors.push({
        ...slotConfig,
        x: slotX,
        y: slotY
      });
    });
  }

  addBottomActions(width, height) {
    const cx = width / 2;
    const dockY = height - 52;
    
    const dock = this.add.graphics();
    dock.fillStyle(0x0c102b, 0.85);
    dock.fillRoundedRect(cx - 280, dockY - 30, 560, 60, 12);
    dock.lineStyle(2, 0x69e6ff, 0.4);
    dock.strokeRoundedRect(cx - 280, dockY - 30, 560, 60, 12);

    const loadoutBtn = this.add.image(cx - 200, dockY, 'ui-purple-button').setDisplaySize(114, 40).setInteractive({ useHandCursor: true });
    this.add.text(cx - 200, dockY, 'LOADOUT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#39106a',
      strokeThickness: 3,
    }).setOrigin(0.5);
    
    loadoutBtn.on('pointerover', () => {
      loadoutBtn.setScale(1.04);
      soundManager.playSFX(this, 'hover');
    });
    loadoutBtn.on('pointerout', () => loadoutBtn.setScale(1));
    loadoutBtn.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showInventoryTab();
    });

    this.bottomStatTexts = {
      damage: this.addStat(cx - 68, dockY, 'ui-stat-damage', 'DMG', this.finalHeroStats.damage),
      hp: this.addStat(cx + 8, dockY, 'ui-stat-hp', 'HP', this.finalHeroStats.hp),
      attackSpeed: this.addStat(cx + 84, dockY, 'ui-stat-aspd', 'ASPD', this.finalHeroStats.attackSpeed)
    };

    const battleBtn = this.add.image(cx + 195, dockY, 'ui-battle-button').setDisplaySize(114, 40).setInteractive({ useHandCursor: true });
    this.add.text(cx + 195, dockY, 'BATTLE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#9d3300',
      strokeThickness: 3,
    }).setOrigin(0.5);

    battleBtn.on('pointerover', () => {
      battleBtn.setScale(1.04);
      soundManager.playSFX(this, 'hover');
    });
    battleBtn.on('pointerout', () => battleBtn.setScale(1));
    battleBtn.on('pointerdown', () => battleBtn.setScale(0.98));
    battleBtn.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showStageSelectionTab();
    });

    this.tweens.add({
      targets: battleBtn,
      alpha: { from: 0.9, to: 1.0 },
      scaleX: { from: 1, to: 1.03 },
      scaleY: { from: 1, to: 1.03 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.addEventOffer(height);
  }

  addStat(x, y, iconKey, label, value) {
    this.add.image(x - 14, y, iconKey).setDisplaySize(18, 18);
    const valueText = this.add.text(x + 10, y, value, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: UI.cyan,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);

    return valueText;
  }

  addEventOffer(height) {
    const y = height - 42;
    const g = this.add.graphics();
    g.fillStyle(0x21aaff, 0.85);
    g.fillRoundedRect(24, y - 20, 170, 40, 8);
    g.lineStyle(1.5, 0x9af2ff, 1);
    g.strokeRoundedRect(24, y - 20, 170, 40, 8);

    this.add.circle(46, y, 13, 0xff7a0b);
    this.add.text(46, y, '⚔', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: UI.white,
    }).setOrigin(0.5);

    this.add.text(72, y, 'EVENT HARIAN', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 2,
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
    
    const heroLevels = this.registry.get('heroLevels') || {};
    this.heroLevel = heroLevels[this.selectedHero.id] || 1;

    this.finalHeroStats = calculateFinalStats(this.selectedHeroBaseStats, this.equippedItems, this.activeSkin, this.heroLevel);
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
      const activeSkin = this.activeSkin;
      const visualKey = activeSkin?.assetKey || this.selectedHero.assetKey;
      this.heroPortrait.setTexture(visualKey);
    }

    if (this.heroLevelText) {
      this.heroLevelText.setText(`Lv. ${this.heroLevel}`);
    }

    this.drawHeroUpgradeButton(this.scale.width / 2, this.scale.height / 2 - 10 + 124);
  }

  showInventoryTab() {
    this.clearInventoryTab();
    this.refreshHeroLoadout();
    this.refreshBottomStats();

    const { width, height } = this.scale;
    this.addInventoryItem(this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.62));
    this.addInventoryItem(this.add.rectangle(width / 2, height / 2, 820, 590, 0x090f1d, 0.98))
      .setStrokeStyle(3, 0x00d6ff, 0.9);
    this.addInventoryItem(this.add.text(width / 2, 88, 'INVENTORY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 4,
    }).setOrigin(0.5));

    this.addInventoryCloseButton(width / 2 + 372, 90);

    this.addHeroSelectionPanel(width / 2 - 270, 160);
    this.addEquipmentSlotPanel(width / 2, 160);
    this.addTotalStatsPanel(width / 2, 385);
    this.addInventoryList(width / 2 + 270, 160);
  }

  addHeroSelectionPanel(x, y) {
    this.addInventoryItem(this.add.text(x, y - 18, 'HERO CLASS', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));

    getAvailableHeroes().forEach((hero, index) => {
      const cardY = y + 46 + (index * 96);
      const isSelected = hero.id === this.selectedHero.id;
      const card = this.addInventoryItem(
        this.add.rectangle(x, cardY, 220, 86, isSelected ? 0x1d4ed8 : 0x0b1329, 0.95)
          .setStrokeStyle(2, isSelected ? 0xfacc15 : 0x1e293b, 0.9)
          .setInteractive({ useHandCursor: true })
      );

      const activeSkin = this.getDefaultSkinForHero(hero);
      const visualKey = activeSkin?.assetKey || hero.assetKey;
      
      this.addInventoryItem(this.add.image(x - 68, cardY, visualKey).setDisplaySize(46, 46));
      this.addInventoryItem(
        this.add.text(x - 32, cardY - 24, hero.name, this.getInventoryTextStyle(isSelected ? UI.yellow : UI.white, 15))
          .setOrigin(0, 0.5)
      );
      this.addInventoryItem(
        this.add.text(x - 32, cardY - 4, hero.description.length > 22 ? hero.description.slice(0, 20) + '...' : hero.description, this.getInventoryTextStyle('#bfdbfe', 9))
          .setOrigin(0, 0.5)
      );
      this.addInventoryItem(
        this.add.text(x - 32, cardY + 16, this.formatPassiveBonus(hero), this.getInventoryTextStyle(UI.cyan, 9))
          .setOrigin(0, 0.5)
      );

      card.on('pointerover', () => {
        soundManager.playSFX(this, 'hover');
        if (!isSelected) {
          card.setFillStyle(0x1a243d, 0.95);
          card.setStrokeStyle(2, 0x3b82f6, 1);
        }
      });
      card.on('pointerout', () => {
        if (!isSelected) {
          card.setFillStyle(0x0b1329, 0.95);
          card.setStrokeStyle(2, 0x1e293b, 0.9);
        }
      });
      card.on('pointerup', () => {
        soundManager.playSFX(this, 'click');
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
      criticalChance: 'CRIT',
      healthRegen: 'REGEN'
    };

    return labels[statName] || statName;
  }

  formatHeroBonus(statName, value) {
    if (statName === 'criticalChance') {
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
    this.addInventoryItem(this.add.text(x, y - 18, 'EQUIPPED', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));

    EQUIPMENT_SLOTS.forEach((slot, index) => {
      const item = getEquippedItemBySlot(this, slot);
      const slotY = y + 26 + (index * 56);
      const button = this.addInventoryItem(
        this.add.rectangle(x, slotY, 220, 46, item ? 0x1d4ed8 : 0x0b1329, 0.95)
          .setStrokeStyle(2, item ? 0xfacc15 : 0x1e293b, 0.9)
          .setInteractive({ useHandCursor: true })
      );

      const slotIcon = slot === 'weapon' ? '⚔' : slot === 'armor' ? '🛡' : '💍';
      
      this.addInventoryItem(
        this.add.text(x - 94, slotY, `${slotIcon} ${slot.toUpperCase()}`, this.getInventoryTextStyle('#9af2ff', 11))
          .setOrigin(0, 0.5)
      );
      this.addInventoryItem(
        this.add.text(x - 10, slotY, item ? item.name : 'Empty', this.getInventoryTextStyle(item ? UI.white : '#475569', 13))
          .setOrigin(0, 0.5)
      );

      button.on('pointerover', () => {
        soundManager.playSFX(this, 'hover');
        if (!item) {
          button.setFillStyle(0x1a243d, 0.95);
          button.setStrokeStyle(2, 0x3b82f6, 1);
        } else {
          button.setFillStyle(0x2563eb, 0.95);
        }
      });
      button.on('pointerout', () => {
        if (!item) {
          button.setFillStyle(0x0b1329, 0.95);
          button.setStrokeStyle(2, 0x1e293b, 0.9);
        } else {
          button.setFillStyle(0x1d4ed8, 0.95);
          button.setStrokeStyle(2, 0xfacc15, 0.9);
        }
      });
      button.on('pointerup', () => {
        soundManager.playSFX(this, 'click');
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
    this.addInventoryItem(this.add.text(x, y - 18, 'ITEMS', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));

    getInventoryItems(this).forEach((item, index) => {
      const rowY = y + 26 + (index * 56);
      const isEquipped = getEquippedItemBySlot(this, item.slot)?.id === item.id;
      const row = this.addInventoryItem(
        this.add.rectangle(x, rowY, 220, 46, isEquipped ? 0x1d4ed8 : 0x0b1329, 0.95)
          .setStrokeStyle(2, isEquipped ? 0xfacc15 : 0x1e293b, 0.9)
          .setInteractive({ useHandCursor: true })
      );

      this.addInventoryItem(
        this.add.text(x - 94, rowY - 10, item.name, this.getInventoryTextStyle(UI.white, 13))
          .setOrigin(0, 0.5)
      );
      this.addInventoryItem(
        this.add.text(x - 94, rowY + 10, `${item.slot.toUpperCase()}  ${formatEquipmentBonus(item)}`, this.getInventoryTextStyle('#475569', 10))
          .setOrigin(0, 0.5)
      );
      this.addInventoryItem(
        this.add.text(x + 94, rowY, isEquipped ? 'EQUIPPED' : 'EQUIP', this.getInventoryTextStyle(isEquipped ? '#facc15' : UI.cyan, 11))
          .setOrigin(1, 0.5)
      );

      row.on('pointerover', () => {
        soundManager.playSFX(this, 'hover');
        if (!isEquipped) {
          row.setFillStyle(0x1a243d, 0.95);
          row.setStrokeStyle(2, 0x3b82f6, 1);
        } else {
          row.setFillStyle(0x2563eb, 0.95);
        }
      });
      row.on('pointerout', () => {
        if (!isEquipped) {
          row.setFillStyle(0x0b1329, 0.95);
          row.setStrokeStyle(2, 0x1e293b, 0.9);
        } else {
          row.setFillStyle(0x1d4ed8, 0.95);
          row.setStrokeStyle(2, 0xfacc15, 0.9);
        }
      });
      row.on('pointerup', () => {
        soundManager.playSFX(this, 'click');
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
      ['Crit Chance', `${Math.round(this.finalHeroStats.criticalChance * 100)}%`],
      ['HP Regen', `${this.finalHeroStats.healthRegen || 0}/s`]
    ];

    this.addInventoryItem(this.add.text(x, y - 18, 'TOTAL STATUS', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));
    this.addInventoryItem(
      this.add.rectangle(x, y + 102, 220, 212, 0x07111f, 0.9)
        .setStrokeStyle(2, 0x00d6ff, 0.5)
    );

    stats.forEach(([label, value], index) => {
      const statY = y + 22 + (index * 32);
      this.addInventoryItem(
        this.add.text(x - 90, statY, label, this.getInventoryTextStyle('#bfdbfe', 13))
          .setOrigin(0, 0.5)
      );
      this.addInventoryItem(
        this.add.text(x + 90, statY, value, this.getInventoryTextStyle(UI.yellow, 13))
          .setOrigin(1, 0.5)
      );
    });
  }

  addInventoryCloseButton(x, y) {
    const button = this.addInventoryItem(
      this.add.rectangle(x, y, 36, 36, 0xd97706, 1)
        .setStrokeStyle(2, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );
    this.addInventoryItem(this.add.text(x, y, 'X', this.getInventoryTextStyle(UI.white, 16)).setOrigin(0.5));

    button.on('pointerover', () => {
      button.setScale(1.1);
      soundManager.playSFX(this, 'hover');
    });
    button.on('pointerout', () => {
      button.setScale(1);
    });
    button.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.clearInventoryTab();
    });
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
        soundManager.playSFX(this, 'hover');
      });

      card.on('pointerout', () => {
        card.setScale(1);
        card.setStrokeStyle(2, 0x3b82f6, 0.95);
        stageNumText.setScale(1);
        btnBg.setScale(1);
        btnText.setScale(1);
      });

      card.on('pointerup', () => {
        soundManager.playSFX(this, 'click');
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
      soundManager.playSFX(this, 'hover');
    });

    button.on('pointerout', () => {
      button.setScale(1);
      text.setScale(1);
    });

    button.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.clearStageSelectionTab();
    });
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

  addSettingsItem(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.settingsLayer.push(item);
    return item;
  }

  clearSettingsTab() {
    this.settingsLayer.forEach((item) => item.destroy());
    this.settingsLayer = [];
  }

  showSettingsTab() {
    this.clearSettingsTab();
    const { width, height } = this.scale;

    // Dim Background
    this.addSettingsItem(this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.75));

    // Main Settings Panel
    this.addSettingsItem(
      this.add.rectangle(width / 2, height / 2, 460, 320, 0x0f172a, 0.98)
        .setStrokeStyle(3, 0x00d6ff, 0.9)
    );

    // Title text
    this.addSettingsItem(
      this.add.text(width / 2, height / 2 - 110, 'SETTINGS', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0f172a',
        strokeThickness: 3,
      }).setOrigin(0.5)
    );

    // Close Button (Orange/Gold theme)
    this.addSettingsCloseButton(width / 2 + 195, height / 2 - 125);

    // Music Setting Container
    const musicY = height / 2 - 20;
    this.addSettingsItem(
      this.add.text(width / 2 - 130, musicY, 'BACKGROUND MUSIC', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0c1648',
        strokeThickness: 3,
      }).setOrigin(0, 0.5)
    );

    const isMusicOn = soundManager.isMusicEnabled();
    const musicBtn = this.addSettingsItem(
      this.add.rectangle(width / 2 + 80, musicY, 100, 36, isMusicOn ? 0x15803d : 0xb91c1c, 1)
        .setStrokeStyle(2, isMusicOn ? 0x4ade80 : 0xfca5a5, 1)
        .setInteractive({ useHandCursor: true })
    );

    const musicBtnText = this.addSettingsItem(
      this.add.text(width / 2 + 80, musicY, isMusicOn ? 'ON' : 'OFF', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    musicBtn.on('pointerover', () => {
      musicBtn.setScale(1.05);
      musicBtnText.setScale(1.05);
    });
    musicBtn.on('pointerout', () => {
      musicBtn.setScale(1);
      musicBtnText.setScale(1);
    });
    musicBtn.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      soundManager.setMusicEnabled(!soundManager.isMusicEnabled());
      // Refresh the tab to show updated state
      this.showSettingsTab();
    });

    // SFX Setting Container
    const sfxY = height / 2 + 40;
    this.addSettingsItem(
      this.add.text(width / 2 - 130, sfxY, 'SOUND EFFECTS (SFX)', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0c1648',
        strokeThickness: 3,
      }).setOrigin(0, 0.5)
    );

    const isSfxOn = soundManager.isSFXEnabled();
    const sfxBtn = this.addSettingsItem(
      this.add.rectangle(width / 2 + 80, sfxY, 100, 36, isSfxOn ? 0x15803d : 0xb91c1c, 1)
        .setStrokeStyle(2, isSfxOn ? 0x4ade80 : 0xfca5a5, 1)
        .setInteractive({ useHandCursor: true })
    );

    const sfxBtnText = this.addSettingsItem(
      this.add.text(width / 2 + 80, sfxY, isSfxOn ? 'ON' : 'OFF', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    sfxBtn.on('pointerover', () => {
      sfxBtn.setScale(1.05);
      sfxBtnText.setScale(1.05);
    });
    sfxBtn.on('pointerout', () => {
      sfxBtn.setScale(1);
      sfxBtnText.setScale(1);
    });
    sfxBtn.on('pointerup', () => {
      soundManager.setSFXEnabled(!soundManager.isSFXEnabled());
      soundManager.playSFX(this, 'click');
      // Refresh the tab to show updated state
      this.showSettingsTab();
    });
  }

  addSettingsCloseButton(x, y) {
    const button = this.addSettingsItem(
      this.add.rectangle(x, y, 36, 36, 0xd97706, 1)
        .setStrokeStyle(2, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );

    const text = this.addSettingsItem(
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

    button.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.clearSettingsTab();
    });
  }
}

