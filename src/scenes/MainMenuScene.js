import Phaser from 'phaser';
import skins from '../data/skins.js';
import {
  getEquipmentInventory,
  getEquippedItemBySlot,
  getEquippedItems,
} from '../systems/EquipmentInventory.js';
import {
  getAvailableHeroes,
  getSelectedHero,
  getSelectedHeroBaseStats,
  setSelectedHero
} from '../systems/HeroSelection.js';
import { calculateFinalStats } from '../systems/HeroStats.js';
import {
  getPlayerProgress,
  addPlayerGold,
} from '../systems/PlayerProgress.js';
import { saveHeroLevel } from '../services/saveService.js';
import { soundManager } from '../services/soundManager.js';

// Modular UI imports
import { InventoryTab } from '../ui/menu/InventoryTab.js';
import { StageSelectionTab } from '../ui/menu/StageSelectionTab.js';
import { ModeSelectionTab } from '../ui/menu/ModeSelectionTab.js';
import { SettingsTab } from '../ui/menu/SettingsTab.js';
import { BlacksmithTab } from '../ui/menu/BlacksmithTab.js';
import { SkillsTab } from '../ui/menu/SkillsTab.js';
import { ShopTab } from '../ui/menu/ShopTab.js';
import { HeroTab } from '../ui/menu/HeroTab.js';
import { UI } from '../ui/menu/MenuConfig.js';



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
    this.load.image('ui-avatar-ring', '/assets/ui/avatar-ring.svg');
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

    // Initialize modular tabs
    this.inventoryTab = new InventoryTab(this);
    this.stageSelectionTab = new StageSelectionTab(this);
    this.settingsTab = new SettingsTab(this);
    this.blacksmithTab = new BlacksmithTab(this);
    this.skillsTab = new SkillsTab(this);
    this.shopTab = new ShopTab(this);
    this.modeSelectionTab = new ModeSelectionTab(this);
    this.heroTab = new HeroTab(this);

    this.loadoutSlotAnchors = [];
    this.loadoutSlotLayer = [];
    this.refreshHeroLoadout();

    this.drawCyberBackground(width, height);
    this.addRedesignedTopBar(width);
    this.addLeftHUD();
    this.addCenterHeroArea(width, height);
    this.addRightHUDGrid(width);
    this.addBottomDock(width, height);

    // Bind Escape key to close any active modal tabs
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.inventoryTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.clearInventoryTab();
      } else if (this.stageSelectionTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.clearStageSelectionTab();
      } else if (this.settingsTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.clearSettingsTab();
      } else if (this.blacksmithTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.clearBlacksmithTab();
      } else if (this.skillsTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.clearSkillsTab();
      } else if (this.shopTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.clearShopTab();
      } else if (this.modeSelectionTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.modeSelectionTab.clear();
      } else if (this.heroTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.clearHeroTab();
      }
    });

    // Bind keyboard numeric/numpad shortcuts 1 to 5
    const bindTabKey = (keyName, callback) => {
      this.input.keyboard.on(`keydown-${keyName}`, callback);
    };
    const handleTabOpen = (tabShowFn) => {
      soundManager.playSFX(this, 'click');
      this.clearAllTabs();
      tabShowFn.call(this);
    };

    bindTabKey('ONE', () => handleTabOpen(this.showHeroTab));
    bindTabKey('NUMPAD_ONE', () => handleTabOpen(this.showHeroTab));

    bindTabKey('TWO', () => handleTabOpen(this.showBlacksmithTab));
    bindTabKey('NUMPAD_TWO', () => handleTabOpen(this.showBlacksmithTab));

    bindTabKey('THREE', () => handleTabOpen(this.showSkillsTab));
    bindTabKey('NUMPAD_THREE', () => handleTabOpen(this.showSkillsTab));

    bindTabKey('FOUR', () => handleTabOpen(this.showInventoryTab));
    bindTabKey('NUMPAD_FOUR', () => handleTabOpen(this.showInventoryTab));

    bindTabKey('FIVE', () => handleTabOpen(this.showShopTab));
    bindTabKey('NUMPAD_FIVE', () => handleTabOpen(this.showShopTab));

    // Bind A and D keys to cycle heroes (only active when no modular tabs are open)
    const isAnyTabActive = () => {
      return (
        (this.inventoryTab && this.inventoryTab.isActive()) ||
        (this.stageSelectionTab && this.stageSelectionTab.isActive()) ||
        (this.settingsTab && this.settingsTab.isActive()) ||
        (this.blacksmithTab && this.blacksmithTab.isActive()) ||
        (this.skillsTab && this.skillsTab.isActive()) ||
        (this.shopTab && this.shopTab.isActive()) ||
        (this.modeSelectionTab && this.modeSelectionTab.isActive()) ||
        (this.heroTab && this.heroTab.isActive())
      );
    };

    this.input.keyboard.on('keydown-A', () => {
      if (!isAnyTabActive()) {
        soundManager.playSFX(this, 'click');
        this.cycleHero(-1);
      }
    });

    this.input.keyboard.on('keydown-LEFT', () => {
      if (!isAnyTabActive()) {
        soundManager.playSFX(this, 'click');
        this.cycleHero(-1);
      }
    });

    this.input.keyboard.on('keydown-D', () => {
      if (!isAnyTabActive()) {
        soundManager.playSFX(this, 'click');
        this.cycleHero(1);
      }
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      if (!isAnyTabActive()) {
        soundManager.playSFX(this, 'click');
        this.cycleHero(1);
      }
    });

    // Bind S and ENTER keys to open Campaign stage selection
    const handleCampaignOpen = () => {
      if (!isAnyTabActive()) {
        soundManager.playSFX(this, 'click');
        this.clearAllTabs();
        this.showStageSelectionTab();
      }
    };

    this.input.keyboard.on('keydown-S', handleCampaignOpen);
    this.input.keyboard.on('keydown-ENTER', handleCampaignOpen);

    soundManager.playBGM(this, 'menu-bgm');
  }

  clearAllTabs() {
    if (this.inventoryTab) this.inventoryTab.clear();
    if (this.stageSelectionTab) this.stageSelectionTab.clear();
    if (this.settingsTab) this.settingsTab.clear();
    if (this.blacksmithTab) this.blacksmithTab.clear();
    if (this.skillsTab) this.skillsTab.clear();
    if (this.shopTab) this.shopTab.clear();
    if (this.modeSelectionTab) this.modeSelectionTab.clear();
    if (this.heroTab) this.heroTab.clear();
  }

  drawCyberBackground(width, height) {
    const bg = this.add.graphics();
    // Sky/Cyber Gradient Background
    bg.fillGradientStyle(0xdbeefb, 0xdbeefb, 0xaad4fc, 0x89c5f8, 1);
    bg.fillRect(0, 0, width, height);

    // Draw cyber grids on the floor (perspective)
    const floorY = height * 0.65;
    bg.lineStyle(1.5, 0x4aa6f7, 0.45);
    
    // Draw horizontal perspective lines
    const numHoriz = 12;
    for (let i = 0; i <= numHoriz; i++) {
      const ratio = i / numHoriz;
      const py = floorY + (height - floorY) * Math.pow(ratio, 1.8);
      bg.lineBetween(0, py, width, py);
    }
    
    // Draw vertical/converging perspective lines
    const numVert = 20;
    const vpX = width / 2; // vanishing point X
    const vpY = floorY - 80; // vanishing point Y
    for (let i = -numVert/2; i <= numVert/2; i++) {
      const startX = width / 2 + i * 90;
      bg.lineBetween(vpX + i * 12, vpY, startX, height);
    }
  }

  addRedesignedTopBar(width) {
    const topY = 42;

    // 1. Profile Area (Top Left)
    const profileBg = this.add.graphics();
    profileBg.fillStyle(0x4095ff, 0.25);
    profileBg.fillRoundedRect(16, topY - 26, 220, 52, 26);
    profileBg.lineStyle(2, 0xffffff, 0.85);
    profileBg.strokeRoundedRect(16, topY - 26, 220, 52, 26);

    // Circle Avatar
    const avatarX = 42;
    const avatarY = topY;
    const avatarCircle = this.add.graphics();
    avatarCircle.fillStyle(0x0e1d3d, 1);
    avatarCircle.fillCircle(avatarX, avatarY, 22);
    avatarCircle.lineStyle(2, 0x00d6ff, 1);
    avatarCircle.strokeCircle(avatarX, avatarY, 22);

    const activeSkin = this.activeSkin;
    const visualKey = activeSkin?.assetKey || this.selectedHero.assetKey;
    this.add.image(avatarX, avatarY, visualKey).setDisplaySize(36, 36);

    // Name & Stats
    this.add.text(78, topY - 20, 'EUFEME', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '15px',
      color: UI.white,
      fontStyle: '800',
      stroke: '#081735',
      strokeThickness: 2,
    });

    const playerLevel = this.playerProgress.playerLevel || 1;
    const playerExp = this.playerProgress.playerExp || 0;
    const requiredExp = playerLevel * 200;
    const expRatio = Math.min(1.0, playerExp / requiredExp);

    // Level Pill
    const lvlPill = this.add.graphics();
    lvlPill.fillStyle(0x1d4ed8, 0.95);
    lvlPill.fillRoundedRect(78, topY + 2, 42, 14, 7);
    this.add.text(99, topY + 9, `Lv.${playerLevel}`, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '9px',
      color: UI.white,
      fontStyle: '900',
    }).setOrigin(0.5);

    // EXP Progress Bar
    const xpX = 126;
    const xpY = topY + 2;
    const xpW = 100;
    const xpH = 14;
    const expGraphics = this.add.graphics();
    expGraphics.fillStyle(0x0c1e3d, 0.9);
    expGraphics.fillRoundedRect(xpX, xpY, xpW, xpH, 7);
    if (expRatio > 0) {
      expGraphics.fillStyle(0x00d6ff, 1);
      expGraphics.fillRoundedRect(xpX + 1, xpY + 1, (xpW - 2) * expRatio, xpH - 2, 6);
    }
    this.add.text(xpX + xpW / 2, xpY + xpH / 2, `${playerExp}/${requiredExp}`, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '8px',
      color: UI.white,
      fontStyle: '900',
    }).setOrigin(0.5);

    // 2. Resource Bars (Top Middle)
    // Energy / Mana bar
    this.addResourcePanel(400, topY, '🧪', '192999', 0x2196f3);
    // Gems bar
    this.addResourcePanel(580, topY, '💎', '192999', 0x00bcd4);
    // Coins/Gold bar
    this.addResourcePanel(760, topY, '🪙', this.formatCurrency(this.playerProgress.gold), 0xffb300, true);

    // 3. Top Right Buttons (Mail & Menu)
    const mailBtn = this.add.container(width - 140, topY);
    const mBg = this.add.rectangle(0, 0, 44, 44, 0x498ff5, 0.9)
      .setStrokeStyle(2, 0xffffff, 0.9)
      .setInteractive({ useHandCursor: true });
    const mIcon = this.add.text(0, 0, '✉', { fontSize: '24px', color: '#fff' }).setOrigin(0.5);
    const mDot = this.add.circle(14, -14, 6, 0xff3b30);
    mailBtn.add([mBg, mIcon, mDot]);

    mBg.on('pointerover', () => { mBg.setScale(1.1); soundManager.playSFX(this, 'hover'); });
    mBg.on('pointerout', () => mBg.setScale(1));
    mBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showSettingsTab();
    });

    const menuGridBtn = this.add.container(width - 80, topY);
    const gBg = this.add.rectangle(0, 0, 44, 44, 0x498ff5, 0.9)
      .setStrokeStyle(2, 0xffffff, 0.9)
      .setInteractive({ useHandCursor: true });
    const gIcon = this.add.text(0, 0, '⚏', { fontSize: '24px', color: '#fff' }).setOrigin(0.5);
    menuGridBtn.add([gBg, gIcon]);

    gBg.on('pointerover', () => { gBg.setScale(1.1); soundManager.playSFX(this, 'hover'); });
    gBg.on('pointerout', () => gBg.setScale(1));
    gBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showSettingsTab();
    });
  }

  addResourcePanel(x, y, icon, value, colorHex, isGold = false) {
    const bg = this.add.graphics();
    bg.fillStyle(0x0c1e3d, 0.85);
    bg.fillRoundedRect(x - 80, y - 18, 160, 36, 18);
    bg.lineStyle(2, 0xffffff, 0.8);
    bg.strokeRoundedRect(x - 80, y - 18, 160, 36, 18);

    // Icon
    this.add.text(x - 66, y, icon, { fontSize: '20px' }).setOrigin(0.5);

    // Value
    const valText = this.add.text(x - 12, y, value, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '14px',
      color: UI.white,
      fontStyle: '800',
    }).setOrigin(0.5);

    if (isGold) {
      this.goldText = valText;
    }

    // Plus button
    const plusContainer = this.add.container(x + 58, y);
    const pBg = this.add.circle(0, 0, 12, 0x007aff)
      .setInteractive({ useHandCursor: true });
    const pText = this.add.text(0, -1, '+', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: '900',
    }).setOrigin(0.5);
    plusContainer.add([pBg, pText]);

    pBg.on('pointerover', () => { pBg.setScale(1.15); soundManager.playSFX(this, 'hover'); });
    pBg.on('pointerout', () => pBg.setScale(1));
    pBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      if (isGold) {
        const nextGold = addPlayerGold(this, 10000);
        this.playerProgress.gold = nextGold;
        valText.setText(this.formatCurrency(nextGold));
        soundManager.playSFX(this, 'upgrade');
      }
    });
  }

  addLeftHUD() {
    const lx = 180;
    const ly = 380;
    const lw = 280;
    const lh = 480;

    // Draw the main panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x07111f, 0.85);
    bg.fillRoundedRect(lx - lw / 2, ly - lh / 2, lw, lh, 16);
    bg.lineStyle(2.5, 0x4aa6f7, 0.85);
    bg.strokeRoundedRect(lx - lw / 2, ly - lh / 2, lw, lh, 16);

    // Title
    this.add.text(lx, ly - 210, 'STATUS HERO', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '20px',
      color: UI.yellow,
      fontStyle: '900',
      stroke: '#07111f',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Draw stats list
    const stats = [
      ['HP', this.finalHeroStats.hp],
      ['Attack', this.finalHeroStats.damage],
      ['Attack Speed', this.finalHeroStats.attackSpeed],
      ['Move Speed', this.finalHeroStats.moveSpeed],
      ['Crit Chance', `${Math.round(this.finalHeroStats.criticalChance * 100)}%`],
      ['HP Regen', `${this.finalHeroStats.healthRegen || 0}/s`],
      ['Armor', this.finalHeroStats.armor || 0],
      ['Evasion', `${Math.round((this.finalHeroStats.evasion || 0) * 100)}%`]
    ];

    stats.forEach(([label, value], index) => {
      const rowY = ly - 160 + index * 42;
      
      // Stat label
      this.add.text(lx - 110, rowY, label, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '14px',
        color: '#9af2ff',
        fontStyle: '800',
      }).setOrigin(0, 0.5);

      // Stat value
      this.add.text(lx + 110, rowY, value, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '14px',
        color: UI.white,
        fontStyle: '800',
      }).setOrigin(1, 0.5);

      // Mini separator line
      if (index < stats.length - 1) {
        const line = this.add.graphics();
        line.lineStyle(1, 0x4aa6f7, 0.25);
        line.lineBetween(lx - 110, rowY + 21, lx + 110, rowY + 21);
      }
    });

    // Small utility buttons underneath the stats panel inside the frame
    const eyeBtn = this.add.container(lx - 40, ly + 195);
    const eyeBg = this.add.circle(0, 0, 20, 0x498ff5, 0.9)
      .setStrokeStyle(2, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const eyeText = this.add.text(0, 0, '👁', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    eyeBtn.add([eyeBg, eyeText]);

    eyeBg.on('pointerover', () => { eyeBg.setScale(1.1); soundManager.playSFX(this, 'hover'); });
    eyeBg.on('pointerout', () => eyeBg.setScale(1));
    eyeBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.cameras.main.flash(200, 255, 255, 255);
    });

    const cycleBtn = this.add.container(lx + 40, ly + 195);
    const cycleBg = this.add.circle(0, 0, 20, 0x498ff5, 0.9)
      .setStrokeStyle(2, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const cycleText = this.add.text(0, 0, '🔄', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
    cycleBtn.add([cycleBg, cycleText]);

    cycleBg.on('pointerover', () => { cycleBg.setScale(1.1); soundManager.playSFX(this, 'hover'); });
    cycleBg.on('pointerout', () => cycleBg.setScale(1));
    cycleBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.cycleHero(1);
    });
  }

  addCenterHeroArea(width, height) {
    const cx = width / 2;
    const cy = height / 2 + 10;

    // Platform/Pedestal Under Hero
    const pedestal = this.add.ellipse(cx, cy + 180, 240, 60, 0x228df7, 0.8)
      .setStrokeStyle(3, 0xffffff, 1);
    pedestal.setDepth(90);
    const pedestalInner = this.add.ellipse(cx, cy + 180, 200, 48, 0x111e3b, 0.9);
    pedestalInner.setDepth(95);

    // Hero Portrait (large in the center)
    const activeSkin = this.activeSkin;
    const visualKey = activeSkin?.assetKey || this.selectedHero.assetKey;
    this.heroPortrait = this.add.image(cx, cy + 20, visualKey).setDisplaySize(280, 280);
    this.heroPortrait.setDepth(110);

    this.drawHeroFrame(cx, cy + 20);

    // Left Arrow
    const leftArrow = this.add.text(cx - 210, cy + 20, '◀', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#00d6ff',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    leftArrow.on('pointerover', () => { leftArrow.setScale(1.15); soundManager.playSFX(this, 'hover'); });
    leftArrow.on('pointerout', () => leftArrow.setScale(1));
    leftArrow.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.cycleHero(-1);
    });

    // Right Arrow
    const rightArrow = this.add.text(cx + 210, cy + 20, '▶', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#00d6ff',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    rightArrow.on('pointerover', () => { rightArrow.setScale(1.15); soundManager.playSFX(this, 'hover'); });
    rightArrow.on('pointerout', () => rightArrow.setScale(1));
    rightArrow.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.cycleHero(1);
    });

    // Upgrades overlay panel - smaller inside character area
    this.heroClassText = this.add.text(cx, cy - 170, this.selectedHero.name.toUpperCase(), {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '22px',
      color: UI.yellow,
      fontStyle: '900',
      stroke: '#081735',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.heroLevelText = this.add.text(cx, cy - 140, `Lv. ${this.heroLevel}`, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '18px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#081735',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Also draw the equipment circles in the background
    this.loadoutSlotAnchors = [
      { x: cx - 140, y: cy + 120, label: 'WEAPON', slot: 'weapon' },
      { x: cx, y: cy + 140, label: 'ARMOR', slot: 'armor' },
      { x: cx + 140, y: cy + 120, label: 'RING', slot: 'ring' },
    ];
    this.refreshMainMenuLoadoutDisplay();
  }

  addRightHUDGrid(width) {
    const rx = width - 200;

    // 1. Campaign Button (Large Yellow) & Mode Button (Blue square next to it)
    const campaignContainer = this.add.container(rx - 30, 160);
    const campBg = this.add.rectangle(0, 0, 180, 90, 0xffc400, 0.95)
      .setStrokeStyle(3, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const campIcon = this.add.text(-56, -10, '⚔', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
    const campTitle = this.add.text(-32, -18, 'CAMPAIGN', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: '900',
    }).setOrigin(0, 0.5);
    const campStageText = this.add.text(-32, 12, 'Stage 1-1\nRouete 66', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '11px',
      color: '#fff8e1',
      fontStyle: '700',
    }).setOrigin(0, 0.5);
    const campDot = this.add.circle(74, -34, 7, 0xff3b30);
    campaignContainer.add([campBg, campIcon, campTitle, campStageText, campDot]);

    campBg.on('pointerover', () => { campBg.setScale(1.04); soundManager.playSFX(this, 'hover'); });
    campBg.on('pointerout', () => campBg.setScale(1));
    campBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showStageSelectionTab();
    });

    const modeContainer = this.add.container(rx + 115, 160);
    const modeBg = this.add.rectangle(0, 0, 90, 90, 0x007aff, 0.95)
      .setStrokeStyle(3, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const modeIcon = this.add.text(0, -10, '🏰', { fontSize: '36px' }).setOrigin(0.5);
    const modeText = this.add.text(0, 26, 'MODE', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: '900',
    }).setOrigin(0.5);
    modeContainer.add([modeBg, modeIcon, modeText]);

    modeBg.on('pointerover', () => { modeBg.setScale(1.05); soundManager.playSFX(this, 'hover'); });
    modeBg.on('pointerout', () => modeBg.setScale(1));
    modeBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showModeSelectionTab();
    });

    // 2. Event Button (Wide Blue)
    const eventContainer = this.add.container(rx + 10, 245);
    const eventBg = this.add.rectangle(0, 0, 300, 56, 0x007aff, 0.95)
      .setStrokeStyle(3, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const eventIcon = this.add.text(-110, 0, '⭐', { fontSize: '24px' }).setOrigin(0.5);
    const eventText = this.add.text(-70, 0, 'EVENT', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: '900',
    }).setOrigin(0, 0.5);
    eventContainer.add([eventBg, eventIcon, eventText]);

    eventBg.on('pointerover', () => { eventBg.setScale(1.03); soundManager.playSFX(this, 'hover'); });
    eventBg.on('pointerout', () => eventBg.setScale(1));
    eventBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showModeSelectionTab();
    });

    // 3. Codex & Quest (Side-by-Side)
    const codexContainer = this.add.container(rx - 65, 320);
    const codexBg = this.add.rectangle(0, 0, 145, 66, 0x007aff, 0.95)
      .setStrokeStyle(3, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const codexIcon = this.add.text(-46, 0, '📖', { fontSize: '24px' }).setOrigin(0.5);
    const codexText = this.add.text(-16, 0, 'CODEX', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: '900',
    }).setOrigin(0, 0.5);
    codexContainer.add([codexBg, codexIcon, codexText]);

    codexBg.on('pointerover', () => { codexBg.setScale(1.05); soundManager.playSFX(this, 'hover'); });
    codexBg.on('pointerout', () => codexBg.setScale(1));
    codexBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showInventoryTab();
    });

    const questContainer = this.add.container(rx + 85, 320);
    const questBg = this.add.rectangle(0, 0, 145, 66, 0x007aff, 0.95)
      .setStrokeStyle(3, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const questIcon = this.add.text(-46, 0, '📋', { fontSize: '24px' }).setOrigin(0.5);
    const questText = this.add.text(-16, 0, 'QUEST', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: '900',
    }).setOrigin(0, 0.5);
    const questDot = this.add.circle(62, -24, 6, 0xff3b30);
    questContainer.add([questBg, questIcon, questText, questDot]);

    questBg.on('pointerover', () => { questBg.setScale(1.05); soundManager.playSFX(this, 'hover'); });
    questBg.on('pointerout', () => questBg.setScale(1));
    questBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showModeSelectionTab();
    });

    // 4. Time Recruit (Clock) & Recruit (Banner)
    const timeRecruitContainer = this.add.container(rx - 65, 415);
    const timeBg = this.add.rectangle(0, 0, 145, 96, 0x228df7, 0.95)
      .setStrokeStyle(3, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const timeIcon = this.add.text(-44, -22, '⏱ 09:00', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: '900',
    }).setOrigin(0.5);
    const timeText = this.add.text(0, 14, 'Time\nRecruit', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: '800',
      align: 'center',
    }).setOrigin(0.5);
    timeRecruitContainer.add([timeBg, timeIcon, timeText]);

    timeBg.on('pointerover', () => { timeBg.setScale(1.05); soundManager.playSFX(this, 'hover'); });
    timeBg.on('pointerout', () => timeBg.setScale(1));
    timeBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showInventoryTab();
    });

    const recruitContainer = this.add.container(rx + 85, 415);
    const recruitBg = this.add.rectangle(0, 0, 145, 96, 0x00bcd4, 0.95)
      .setStrokeStyle(3, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const recruitImg = this.add.text(0, -16, 'Hero RateUp', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '12px',
      color: '#fff',
      fontStyle: '900',
      stroke: '#081735',
      strokeThickness: 2,
    }).setOrigin(0.5);
    const recruitText = this.add.text(0, 22, 'RECRUIT', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: '900',
      stroke: '#081735',
      strokeThickness: 3,
    }).setOrigin(0.5);
    const recruitDot = this.add.circle(62, -38, 7, 0xff3b30);
    recruitContainer.add([recruitBg, recruitImg, recruitText, recruitDot]);

    recruitBg.on('pointerover', () => { recruitBg.setScale(1.05); soundManager.playSFX(this, 'hover'); });
    recruitBg.on('pointerout', () => recruitBg.setScale(1));
    recruitBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showInventoryTab();
    });
  }

  addBottomDock(width, height) {
    const cx = width / 2;
    const dockY = height - 52;

    // Background horizontal dock (shifted right, centered at X = 710)
    const dockX = cx + 70;
    const dockW = 580;
    const dock = this.add.graphics();
    dock.fillStyle(0xffffff, 0.95);
    dock.fillRoundedRect(dockX - dockW / 2, dockY - 32, dockW, 64, 16);
    dock.lineStyle(3, 0x4aa6f7, 1);
    dock.strokeRoundedRect(dockX - dockW / 2, dockY - 32, dockW, 64, 16);

    const tabs = [
      { name: 'HERO', icon: '👧', color: '#e040fb', dot: false },
      { name: 'BLACKSMITH', icon: '⚒️', color: '#ffb300', dot: true },
      { name: 'SKILL', icon: '⚡', color: '#4caf50', dot: false },
      { name: 'INVENTORY', icon: '🎒', color: '#00e5ff', dot: false },
      { name: 'SHOP', icon: '🏪', color: '#ff1744', dot: true },
    ];

    const tabWidth = (dockW - 100) / (tabs.length - 1);
    const startX = dockX - (dockW - 100) / 2;

    tabs.forEach((tab, index) => {
      const tx = startX + index * tabWidth;
      const tabContainer = this.add.container(tx, dockY);
      
      const clickArea = this.add.rectangle(0, 0, tabWidth, 56, 0xffffff, 0.01)
        .setInteractive({ useHandCursor: true });
      const icon = this.add.text(0, -10, tab.icon, { fontSize: '24px' }).setOrigin(0.5);
      const text = this.add.text(0, 18, tab.name, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '10px',
        color: '#1a237e',
        fontStyle: '900',
      }).setOrigin(0.5);

      tabContainer.add([clickArea, icon, text]);

      if (tab.dot) {
        const dot = this.add.circle(18, -18, 5, 0xff3b30);
        tabContainer.add(dot);
      }

      clickArea.on('pointerover', () => {
        tabContainer.setScale(1.1);
        soundManager.playSFX(this, 'hover');
      });
      clickArea.on('pointerout', () => tabContainer.setScale(1));
      clickArea.on('pointerup', () => {
        soundManager.playSFX(this, 'click');
        if (tab.name === 'BLACKSMITH') {
          this.showBlacksmithTab();
        } else if (tab.name === 'HERO') {
          this.showHeroTab();
        } else if (tab.name === 'INVENTORY') {
          this.showInventoryTab();
        } else if (tab.name === 'SKILL') {
          this.showSkillsTab();
        } else if (tab.name === 'SHOP') {
          this.showShopTab();
        }
      });
    });

    // Big Yellow BATTLE Button next to it (centered at X = 1085)
    const battleBoxX = dockX + dockW / 2 + 85;
    const battleBoxW = 150;
    
    const battleBox = this.add.graphics();
    // Yellow background with white border
    battleBox.fillStyle(0xffc400, 1);
    battleBox.fillRoundedRect(battleBoxX - battleBoxW / 2, dockY - 32, battleBoxW, 64, 16);
    battleBox.lineStyle(3, 0xffffff, 1);
    battleBox.strokeRoundedRect(battleBoxX - battleBoxW / 2, dockY - 32, battleBoxW, 64, 16);

    const battleBtn = this.add.container(battleBoxX, dockY);
    const clickBattle = this.add.rectangle(0, 0, battleBoxW, 64, 0xffffff, 0.01)
      .setInteractive({ useHandCursor: true });
    const bIcon = this.add.text(0, -10, '⚔️', { fontSize: '26px' }).setOrigin(0.5);
    const bText = this.add.text(0, 18, 'BATTLE', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '12px',
      color: '#07111f',
      fontStyle: '900',
    }).setOrigin(0.5);
    battleBtn.add([clickBattle, bIcon, bText]);

    clickBattle.on('pointerover', () => {
      battleBtn.setScale(1.05);
      soundManager.playSFX(this, 'hover');
    });
    clickBattle.on('pointerout', () => battleBtn.setScale(1));
    clickBattle.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showStageSelectionTab();
    });

    // Added a pulse tween to make the main play button glow and stand out
    this.tweens.add({
      targets: battleBtn,
      scaleX: 1.03,
      scaleY: 1.03,
      yoyo: true,
      repeat: -1,
      duration: 800
    });
  }

  cycleHero(dir) {
    const heroesList = getAvailableHeroes();
    const currentIndex = heroesList.findIndex((h) => h.id === this.selectedHero.id);
    let nextIndex = currentIndex + dir;
    if (nextIndex < 0) nextIndex = heroesList.length - 1;
    if (nextIndex >= heroesList.length) nextIndex = 0;
    
    const nextHero = heroesList[nextIndex];
    setSelectedHero(this, nextHero.id);
    
    this.scene.restart();
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
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '12px',
      color: UI.white,
      fontStyle: '900',
    }).setOrigin(0.5);
    
    const goldIcon = this.add.image(-28, 11, 'ui-icon-gold').setDisplaySize(20, 20);
    const costText = this.add.text(-12, 11, this.formatCurrency(upgradeCost), {
      fontFamily: 'Outfit, Arial, sans-serif',
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
    if (this.inventoryTab && this.inventoryTab.isActive()) {
      this.inventoryTab.add(container);
    }
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
    
    if (this.inventoryTab && this.inventoryTab.isActive()) {
      this.drawHeroUpgradeButton(520, 315);
      // Redraw inventory tab to update stats panel values instantly
      this.showInventoryTab();
    } else {
      if (this.upgradeContainer) {
        this.upgradeContainer.destroy();
        this.upgradeContainer = null;
      }
    }
    
    this.showUpgradeFeedback(true, 'Level Up!');
  }

  showUpgradeFeedback(success, message) {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2 + 10;
    
    const feedbackText = this.add.text(cx, cy - 80, message, {
      fontFamily: 'Outfit, Arial, sans-serif',
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

    if (this.inventoryTab && this.inventoryTab.isActive()) {
      this.drawHeroUpgradeButton(520, 315);
    } else {
      if (this.upgradeContainer) {
        this.upgradeContainer.destroy();
        this.upgradeContainer = null;
      }
    }

    this.drawHeroFrame(this.scale.width / 2, this.scale.height / 2 + 30);
  }

  showFeedback(message) {
    const { width, height } = this.scale;
    const text = this.add.text(width / 2, height / 2, message, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '20px',
      color: '#f87171',
      fontStyle: '900',
      stroke: '#000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(3000);

    this.tweens.add({
      targets: text,
      y: height / 2 - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy()
    });
  }

  getDefaultSkinForHero(hero) {
    return skins.find((skin) => skin.id === hero.cosmeticSkinId) || skins[0];
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

  // Compatibility Wrapper Methods delegating to modular tabs
  showHeroTab() {
    this.heroTab.show();
  }

  clearHeroTab() {
    this.heroTab.clear();
  }

  showInventoryTab() {
    this.inventoryTab.show();
  }

  clearInventoryTab() {
    this.inventoryTab.clear();
  }

  showStageSelectionTab() {
    this.stageSelectionTab.show();
  }

  clearStageSelectionTab() {
    this.stageSelectionTab.clear();
  }

  showModeSelectionTab() {
    this.modeSelectionTab.show();
  }

  showSettingsTab() {
    this.settingsTab.show();
  }

  clearSettingsTab() {
    this.settingsTab.clear();
  }

  showShopTab() {
    this.shopTab.show();
  }

  clearShopTab() {
    this.shopTab.clear();
  }

  showBlacksmithTab() {
    this.blacksmithTab.show();
  }

  clearBlacksmithTab() {
    this.blacksmithTab.clear();
  }

  showSkillsTab() {
    this.skillsTab.show();
  }

  clearSkillsTab() {
    this.skillsTab.clear();
  }

  createParticleTexture() {
    const key = 'aura-particle';
    if (this.textures.exists(key)) {
      return key;
    }

    const size = 32;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    for (let r = size / 2; r > 0; r--) {
      const alpha = (1 - (r / (size / 2))) * 0.38;
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(size / 2, size / 2, r);
    }
    graphics.generateTexture(key, size, size);
    graphics.destroy();
    return key;
  }

  drawHeroFrame(cx, cy) {
    if (this.heroFrameBackContainer) {
      this.heroFrameBackContainer.destroy();
    }
    if (this.heroFrameFrontContainer) {
      this.heroFrameFrontContainer.destroy();
    }
    if (this.heroAuraShader) {
      this.heroAuraShader.destroy();
    }

    this.heroFrameBackContainer = this.add.container(cx, cy);
    this.heroFrameBackContainer.setDepth(105);

    this.heroFrameFrontContainer = this.add.container(cx, cy);
    this.heroFrameFrontContainer.setDepth(115);

    const level = this.heroLevel || 1;

    if (level < 5) {
      this.drawTier1Frame();
    } else if (level < 10) {
      this.drawTier2Frame();
    } else if (level < 15) {
      this.drawTier3Frame();
    } else {
      this.drawTier4Frame();
    }
  }



  drawTier1Frame() {
    // Back glow
    const backGlow = this.add.graphics();
    backGlow.lineStyle(10, 0x06b6d4, 0.15);
    backGlow.strokeCircle(0, 0, 145);
    this.heroFrameBackContainer.add(backGlow);

    // Front ring
    const frontRing = this.add.graphics();
    frontRing.lineStyle(3, 0x06b6d4, 0.85);
    frontRing.strokeCircle(0, 0, 142);
    
    frontRing.lineStyle(1.5, 0x0891b2, 0.4);
    frontRing.strokeCircle(0, 0, 150);
    this.heroFrameFrontContainer.add(frontRing);

    // Animate breathing
    this.tweens.add({
      targets: [this.heroFrameBackContainer, this.heroFrameFrontContainer],
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  drawTier2Frame() {
    // Back Layer: Gold Hexagon
    const backHex = this.add.graphics();
    backHex.lineStyle(3, 0xeab308, 0.8);
    const sides = 6;
    const radius = 158;
    backHex.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (i === 0) backHex.moveTo(x, y);
      else backHex.lineTo(x, y);
    }
    backHex.closePath();
    backHex.strokePath();

    // Vertices dots
    backHex.fillStyle(0xfef08a, 1);
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      backHex.fillCircle(radius * Math.cos(angle), radius * Math.sin(angle), 5);
    }
    this.heroFrameBackContainer.add(backHex);

    // Front Layer: Inner Ring
    const frontRing = this.add.graphics();
    frontRing.lineStyle(3.5, 0x06b6d4, 0.9);
    frontRing.strokeCircle(0, 0, 142);
    this.heroFrameFrontContainer.add(frontRing);

    // Animate rotation on back hexagon
    this.tweens.add({
      targets: backHex,
      angle: 360,
      duration: 10000,
      repeat: -1
    });

    // Animate breathing on front ring
    this.tweens.add({
      targets: frontRing,
      scaleX: 1.015,
      scaleY: 1.015,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  drawTier3Frame() {
    // Back Layer: Octagon and Glow
    const backGlow = this.add.graphics();
    backGlow.lineStyle(12, 0xa78bfa, 0.2);
    backGlow.strokeCircle(0, 0, 168);
    this.heroFrameBackContainer.add(backGlow);

    const backOct = this.add.graphics();
    backOct.lineStyle(3.5, 0x8b5cf6, 0.85);
    const sides = 8;
    const radius = 160;
    backOct.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (i === 0) backOct.moveTo(x, y);
      else backOct.lineTo(x, y);
    }
    backOct.closePath();
    backOct.strokePath();
    this.heroFrameBackContainer.add(backOct);

    // Front Layer: Magenta Ring
    const frontRing = this.add.graphics();
    frontRing.lineStyle(4, 0xec4899, 0.95);
    frontRing.strokeCircle(0, 0, 142);
    this.heroFrameFrontContainer.add(frontRing);

    // Animate Octagon rotation
    this.tweens.add({
      targets: backOct,
      angle: -360,
      duration: 12000,
      repeat: -1
    });

    // Animate breathing/glow
    this.tweens.add({
      targets: [backGlow, frontRing],
      alpha: { from: 0.6, to: 1.0 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut'
    });

    // 3 Orbiting Green Particles
    for (let i = 0; i < 3; i++) {
      const dot = this.add.circle(0, 0, 6, 0x34d399, 1);
      dot.setStrokeStyle(2, 0xffffff, 0.95);
      this.heroFrameFrontContainer.add(dot);
      
      const angleOffset = (i * 2 * Math.PI) / 3;
      const orbitRadius = 166;

      this.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 6000 + i * 1000,
        repeat: -1,
        onUpdate: (tween) => {
          const val = tween.getValue();
          const rad = Phaser.Math.DegToRad(val) + angleOffset;
          dot.x = orbitRadius * Math.cos(rad);
          dot.y = orbitRadius * Math.sin(rad);
        }
      });
    }
  }

  drawTier4Frame() {
    // 1. Back Layer: Backing aura glows
    const glow1 = this.add.graphics();
    glow1.lineStyle(16, 0xec4899, 0.15);
    glow1.strokeCircle(0, 0, 168);
    
    const glow2 = this.add.graphics();
    glow2.lineStyle(24, 0xf59e0b, 0.08);
    glow2.strokeCircle(0, 0, 180);
    this.heroFrameBackContainer.add([glow2, glow1]);

    // 2. Outer gold gear
    const goldGear = this.add.graphics();
    goldGear.lineStyle(3, 0xfacc15, 0.9);
    const teeth1 = 16;
    const rIn1 = 165;
    const rOut1 = 175;
    goldGear.beginPath();
    for (let i = 0; i < teeth1 * 2; i++) {
      const angle = (i * Math.PI) / teeth1;
      const r = i % 2 === 0 ? rIn1 : rOut1;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      if (i === 0) goldGear.moveTo(x, y);
      else goldGear.lineTo(x, y);
    }
    goldGear.closePath();
    goldGear.strokePath();
    this.heroFrameBackContainer.add(goldGear);

    // 3. Inner crimson gear
    const crimsonGear = this.add.graphics();
    crimsonGear.lineStyle(3, 0xef4444, 0.85);
    const teeth2 = 12;
    const rIn2 = 148;
    const rOut2 = 156;
    crimsonGear.beginPath();
    for (let i = 0; i < teeth2 * 2; i++) {
      const angle = (i * Math.PI) / teeth2;
      const r = i % 2 === 0 ? rIn2 : rOut2;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      if (i === 0) crimsonGear.moveTo(x, y);
      else crimsonGear.lineTo(x, y);
    }
    crimsonGear.closePath();
    crimsonGear.strokePath();
    this.heroFrameBackContainer.add(crimsonGear);

    // 4. Front Layer: Pink ring with tech ticks
    const frontRing = this.add.graphics();
    frontRing.lineStyle(4, 0xec4899, 0.95);
    frontRing.strokeCircle(0, 0, 142);
    
    // Tech ticks on front ring
    frontRing.lineStyle(3, 0xffffff, 0.9);
    for (let i = 0; i < 8; i++) {
      const angle = (i * 2 * Math.PI) / 8;
      const x1 = 142 * Math.cos(angle);
      const y1 = 142 * Math.sin(angle);
      const x2 = 148 * Math.cos(angle);
      const y2 = 148 * Math.sin(angle);
      frontRing.lineBetween(x2, y2, x1, y1);
    }
    this.heroFrameFrontContainer.add(frontRing);

    // Tweens for back gears rotation
    this.tweens.add({
      targets: goldGear,
      angle: 360,
      duration: 14000,
      repeat: -1
    });

    this.tweens.add({
      targets: crimsonGear,
      angle: -360,
      duration: 10000,
      repeat: -1
    });

    // Tweens for breathing
    this.tweens.add({
      targets: [glow1, glow2, frontRing],
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 4 Orbiting Cosmic Flares
    for (let i = 0; i < 4; i++) {
      const flare = this.add.circle(0, 0, 7, 0xf59e0b, 1);
      flare.setStrokeStyle(2.5, 0xffffff, 0.95);
      this.heroFrameFrontContainer.add(flare);
      
      const angleOffset = (i * 2 * Math.PI) / 4;
      const orbitRadius = 175;

      this.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 7000,
        repeat: -1,
        onUpdate: (tween) => {
          const val = tween.getValue();
          const rad = Phaser.Math.DegToRad(val) + angleOffset;
          flare.x = orbitRadius * Math.cos(rad);
          flare.y = orbitRadius * Math.sin(rad);
          
          const scale = 0.8 + 0.4 * Math.sin(rad * 4);
          flare.setScale(scale);
        }
      });
    }
  }
}
