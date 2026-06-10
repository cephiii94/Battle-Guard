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
  unequipSlot,
  addEquipmentToInventory,
  getEquipmentById
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
  getDailyAttemptsRemaining,
  consumeDailyAttempt,
  hasTicket,
  consumeTicket,
  addPlayerMaterial,
  addPlayerTicket
} from '../systems/PlayerProgress.js';
import { getStageById } from '../data/stages.js';
import { saveHeroLevel, saveSkillLevel } from '../services/saveService.js';
import { soundManager } from '../services/soundManager.js';
import craftingRecipes from '../data/crafting.js';
import skills, { getSkillLevelStats } from '../data/skills.js';

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
    this.inventoryLayer = [];
    this.stageSelectionLayer = [];
    this.settingsLayer = [];
    this.blacksmithLayer = [];
    this.skillsLayer = [];
    this.selectedSkill = null;
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
      if (this.inventoryLayer && this.inventoryLayer.length > 0) {
        soundManager.playSFX(this, 'click');
        this.clearInventoryTab();
      } else if (this.stageSelectionLayer && this.stageSelectionLayer.length > 0) {
        soundManager.playSFX(this, 'click');
        this.clearStageSelectionTab();
      } else if (this.settingsLayer && this.settingsLayer.length > 0) {
        soundManager.playSFX(this, 'click');
        this.clearSettingsTab();
      } else if (this.blacksmithLayer && this.blacksmithLayer.length > 0) {
        soundManager.playSFX(this, 'click');
        this.clearBlacksmithTab();
      } else if (this.skillsLayer && this.skillsLayer.length > 0) {
        soundManager.playSFX(this, 'click');
        this.clearSkillsTab();
      }
    });

    soundManager.playBGM(this, 'menu-bgm');
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
    const avatarImg = this.add.image(avatarX, avatarY, visualKey).setDisplaySize(36, 36);

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
    const requiredExp = playerLevel * 500;
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
    const pedestalInner = this.add.ellipse(cx, cy + 180, 200, 48, 0x111e3b, 0.9);

    // Hero Portrait (large in the center)
    const activeSkin = this.activeSkin;
    const visualKey = activeSkin?.assetKey || this.selectedHero.assetKey;
    this.heroPortrait = this.add.image(cx, cy + 20, visualKey).setDisplaySize(280, 280);

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
        } else if (tab.name === 'HERO' || tab.name === 'INVENTORY') {
          this.showInventoryTab();
        } else if (tab.name === 'SKILL') {
          this.showSkillsTab();
        } else if (tab.name === 'SHOP') {
          this.showSettingsTab();
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
      this.showModeSelectionTab();
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
    if (this.inventoryLayer && this.inventoryLayer.length > 0) {
      this.addInventoryItem(container);
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
    
    if (this.inventoryLayer && this.inventoryLayer.length > 0) {
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

    if (this.inventoryLayer && this.inventoryLayer.length > 0) {
      this.drawHeroUpgradeButton(520, 315);
    } else {
      if (this.upgradeContainer) {
        this.upgradeContainer.destroy();
        this.upgradeContainer = null;
      }
    }
  }

  showInventoryTab() {
    this.clearInventoryTab();
    this.refreshHeroLoadout();
    this.refreshBottomStats();

    const { width, height } = this.scale;
    
    // Futuristic sky blue/cyan gradient background matching MainMenuScene background
    const bg = this.add.graphics();
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
    this.addInventoryItem(bg);
    
    // Title & Subtitle left-aligned in modern RPG style, shifted right to make room for the back button
    this.addInventoryItem(this.add.text(185, 38, 'HERO LOADOUT & INVENTORY', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '28px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#07111f',
      strokeThickness: 4,
    }).setOrigin(0, 0.5));

    this.addInventoryItem(this.add.text(185, 68, 'Equip artifacts, review attribute stats, and level up your character class.', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '13px',
      color: '#9af2ff',
      fontStyle: '800',
      stroke: '#07111f',
      strokeThickness: 2,
    }).setOrigin(0, 0.5));

    // Close/Back button placed in the top-left corner
    this.addInventoryCloseButton(110, 52);

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
    this.addInventoryItem(this.add.text(x, y - 18, 'SELECT HERO', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));

    getAvailableHeroes().forEach((hero, index) => {
      const cardY = y + 50 + (index * 116);
      const isSelected = hero.id === this.selectedHero.id;
      
      // Card background styled to align with main menu theme (cyanDark for selected, dark blue for unselected)
      const card = this.addInventoryItem(
        this.add.rectangle(x, cardY, 280, 100, isSelected ? 0x0c86bd : 0x07111f, 0.95)
          .setStrokeStyle(2.5, isSelected ? 0xffdc5a : 0x4aa6f7, 0.9)
          .setInteractive({ useHandCursor: true })
      );

      const activeSkin = this.getDefaultSkinForHero(hero);
      const visualKey = activeSkin?.assetKey || hero.assetKey;
      
      // Large portrait circle frame
      this.addInventoryItem(this.add.circle(x - 90, cardY, 32, 0x0c1e3d, 1))
        .setStrokeStyle(2, isSelected ? 0xffdc5a : 0x4aa6f7, 1);
      this.addInventoryItem(this.add.image(x - 90, cardY, visualKey).setDisplaySize(54, 54));
      
      this.addInventoryItem(
        this.add.text(x - 46, cardY - 26, hero.name, this.getInventoryTextStyle(isSelected ? UI.yellow : UI.white, 16))
          .setOrigin(0, 0.5)
      );
      this.addInventoryItem(
        this.add.text(x - 46, cardY - 4, hero.description.length > 30 ? hero.description.slice(0, 28) + '...' : hero.description, this.getInventoryTextStyle('#dff8ff', 10))
          .setOrigin(0, 0.5)
      );
      this.addInventoryItem(
        this.add.text(x - 46, cardY + 20, this.formatPassiveBonus(hero), this.getInventoryTextStyle(UI.cyan, 10))
          .setOrigin(0, 0.5)
      );

      card.on('pointerover', () => {
        soundManager.playSFX(this, 'hover');
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
        soundManager.playSFX(this, 'click');
        setSelectedHero(this, hero.id);
        this.refreshHeroLoadout();
        this.refreshBottomStats();
        this.showInventoryTab();
      });
    });
  }

  addHeroShowcasePanel(x, y) {
    // Background frame for the hero display
    this.addInventoryItem(
      this.add.rectangle(x, y + 90, 300, 200, 0x07111f, 0.85)
        .setStrokeStyle(2, 0x4aa6f7, 0.6)
    );

    // Glowing circle behind character avatar
    this.addInventoryItem(
      this.add.circle(x, y + 55, 60, 0x00d6ff, 0.12)
    );

    // Dynamic large character avatar display
    const activeSkin = this.activeSkin;
    const visualKey = activeSkin?.assetKey || this.selectedHero.assetKey;
    this.addInventoryItem(
      this.add.image(x, y + 55, visualKey).setDisplaySize(100, 100)
    );

    // Selected Hero Details Text
    this.addInventoryItem(
      this.add.text(x, y + 128, this.selectedHero.name.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '20px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#07111f',
        strokeThickness: 3,
      }).setOrigin(0.5)
    );

    this.addInventoryItem(
      this.add.text(x, y + 152, `CLASS LEVEL ${this.heroLevel}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: UI.cyan,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    // Force draw/refresh active upgrade button inside showcase area
    this.drawHeroUpgradeButton(x, y + 195);
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
    this.addInventoryItem(this.add.text(x, y - 18, 'EQUIPPED SLOTS', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));

    EQUIPMENT_SLOTS.forEach((slot, index) => {
      const item = getEquippedItemBySlot(this, slot);
      
      // Horizontal positioning for horizontal layout: 3 slots side-by-side inside width 380
      const slotX = x - 120 + (index * 120);
      const slotY = y + 36;
      
      const button = this.addInventoryItem(
        this.add.rectangle(slotX, slotY, 110, 70, item ? 0x0c86bd : 0x07111f, 0.95)
          .setStrokeStyle(2, item ? 0xffdc5a : 0x4aa6f7, 0.9)
          .setInteractive({ useHandCursor: true })
      );

      const slotIcon = slot === 'weapon' ? '⚔' : slot === 'armor' ? '🛡' : '💍';
      
      // Draw slot type label
      this.addInventoryItem(
        this.add.text(slotX, slotY - 20, `${slotIcon} ${slot.toUpperCase()}`, this.getInventoryTextStyle('#9af2ff', 10))
          .setOrigin(0.5, 0.5)
      );
      
      // Draw item name text
      this.addInventoryItem(
        this.add.text(slotX, slotY + 10, item ? item.name : 'EMPTY', this.getInventoryTextStyle(item ? UI.white : '#475569', 11))
          .setOrigin(0.5, 0.5)
      );

      button.on('pointerover', () => {
        soundManager.playSFX(this, 'hover');
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
    this.addInventoryItem(this.add.text(x, y - 10, 'AVAILABLE GEAR', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));

    getInventoryItems(this).forEach((item, index) => {
      const rowY = y + 36 + (index * 58);
      const isEquipped = getEquippedItemBySlot(this, item.slot)?.id === item.id;
      
      const row = this.addInventoryItem(
        this.add.rectangle(x, rowY, 360, 48, isEquipped ? 0x0c86bd : 0x07111f, 0.95)
          .setStrokeStyle(2, isEquipped ? 0xffdc5a : 0x4aa6f7, 0.9)
          .setInteractive({ useHandCursor: true })
      );

      // Left column: item info
      this.addInventoryItem(
        this.add.text(x - 165, rowY - 10, item.name, this.getInventoryTextStyle(UI.white, 13))
          .setOrigin(0, 0.5)
      );
      this.addInventoryItem(
        this.add.text(x - 165, rowY + 10, `${item.slot.toUpperCase()}  ${formatEquipmentBonus(item)}`, this.getInventoryTextStyle('#9af2ff', 10))
          .setOrigin(0, 0.5)
      );
      
      // Right column: status button
      this.addInventoryItem(
        this.add.text(x + 165, rowY, isEquipped ? 'EQUIPPED' : 'EQUIP', this.getInventoryTextStyle(isEquipped ? '#ffdc5a' : UI.cyan, 11))
          .setOrigin(1, 0.5)
      );

      row.on('pointerover', () => {
        soundManager.playSFX(this, 'hover');
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
      ['HP Regen', `${this.finalHeroStats.healthRegen || 0}/s`],
      ['Armor', this.finalHeroStats.armor || 0],
      ['Lifesteal', `${Math.round((this.finalHeroStats.lifesteal || 0) * 100)}%`],
      ['Evasion', `${Math.round((this.finalHeroStats.evasion || 0) * 100)}%`],
      ['CDR', `${Math.round((this.finalHeroStats.cooldownReduction || 0) * 100)}%`]
    ];

    this.addInventoryItem(this.add.text(x, y - 18, 'TOTAL STATUS', this.getInventoryTitleStyle()).setOrigin(0.5, 0.5));
    
    // Spacious 300px background box for stats
    this.addInventoryItem(
      this.add.rectangle(x, y + 130, 300, 278, 0x07111f, 0.95)
        .setStrokeStyle(2, 0x4aa6f7, 0.8)
    );

    // Loop through the 10 stats and organize them into 2 columns for clear fullscreen presentation
    stats.forEach(([label, value], index) => {
      // 5 stats in column 1 (left), 5 stats in column 2 (right)
      const colIndex = index < 5 ? 0 : 1;
      const rowIndex = index % 5;
      
      const statY = y + 16 + (rowIndex * 52);
      
      if (colIndex === 0) {
        // Left Column (centered at x - 75)
        this.addInventoryItem(
          this.add.text(x - 138, statY, label, this.getInventoryTextStyle('#9af2ff', 12))
            .setOrigin(0, 0.5)
        );
        this.addInventoryItem(
          this.add.text(x - 12, statY, value, this.getInventoryTextStyle(UI.yellow, 12))
            .setOrigin(1, 0.5)
        );
      } else {
        // Right Column (centered at x + 75)
        this.addInventoryItem(
          this.add.text(x + 12, statY, label, this.getInventoryTextStyle('#9af2ff', 12))
            .setOrigin(0, 0.5)
        );
        this.addInventoryItem(
          this.add.text(x + 138, statY, value, this.getInventoryTextStyle(UI.yellow, 12))
            .setOrigin(1, 0.5)
        );
      }
    });
  }

  addInventoryCloseButton(x, y) {
    const button = this.addInventoryItem(
      this.add.rectangle(x, y, 110, 40, 0x498ff5, 0.9)
        .setStrokeStyle(2, 0xffffff, 0.9)
        .setInteractive({ useHandCursor: true })
    );
    this.addInventoryItem(this.add.text(x, y, '← KEMBALI', this.getInventoryTextStyle(UI.white, 14)).setOrigin(0.5));

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

      const stageTimes = this.playerProgress.stageTimes || {};
      const clearTime = stageTimes[stageId];
      let timeLabel = '⏱ Best Time: --:--';
      if (clearTime !== undefined && clearTime !== null) {
        const mins = Math.floor(clearTime / 60).toString().padStart(2, '0');
        const secs = (clearTime % 60).toString().padStart(2, '0');
        timeLabel = `⏱ Best Time: ${mins}:${secs}`;
      }

      const durationText = this.addStageSelectionItem(
        this.add.text(x, y - 12, timeLabel, {
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

  showModeSelectionTab() {
    this.clearStageSelectionTab();
    this.refreshHeroLoadout();
    this.playerProgress = getPlayerProgress(this);

    const { width, height } = this.scale;

    // Dim Background
    this.addStageSelectionItem(this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.75));

    // Main Dialog Panel
    this.addStageSelectionItem(
      this.add.rectangle(width / 2, height / 2, 880, 530, 0x0f172a, 0.98)
        .setStrokeStyle(3, 0x00bcd4, 0.9)
    );

    // Decorative Title bar
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x1e293b, 1);
    titleBg.fillRoundedRect(width / 2 - 220, height / 2 - 240, 440, 48, 8);
    titleBg.lineStyle(2, 0x00bcd4, 1);
    titleBg.strokeRoundedRect(width / 2 - 220, height / 2 - 240, 440, 48, 8);
    this.addStageSelectionItem(titleBg);

    // Title text
    this.addStageSelectionItem(
      this.add.text(width / 2, height / 2 - 216, 'SELECT GAME MODE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0f172a',
        strokeThickness: 3,
      }).setOrigin(0.5)
    );

    // Close Button
    const closeBtn = this.addStageSelectionItem(
      this.add.rectangle(width / 2 + 405, height / 2 - 230, 36, 36, 0xd97706, 1)
        .setStrokeStyle(2, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );
    const closeText = this.addStageSelectionItem(
      this.add.text(width / 2 + 405, height / 2 - 230, 'X', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );
    closeBtn.on('pointerover', () => { closeBtn.setScale(1.1); closeText.setScale(1.1); soundManager.playSFX(this, 'hover'); });
    closeBtn.on('pointerout', () => { closeBtn.setScale(1); closeText.setScale(1); });
    closeBtn.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.clearStageSelectionTab();
    });

    // Modes configuration
    const modes = [
      {
        id: 'survival',
        name: 'SURVIVAL',
        desc: 'Bertahan hidup selama 90 detik.\nMusuh terus menggila.',
        limitText: '3x / day',
        color: 0xe040fb,
        btnLabel: 'ENTER SURVIVAL',
        ticketKey: 'survival-ticket',
      },
      {
        id: 'gold_farm',
        name: 'GOLD FARMING',
        desc: 'Dapatkan gold berlimpah\ndari monster dalam 60s.',
        limitText: '3x / day',
        color: 0x4caf50,
        btnLabel: 'ENTER FARMING',
        ticketKey: 'gold-ticket',
      },
      {
        id: 'looting',
        name: 'LOOTING BOSS',
        desc: 'Kalahkan Boss kuat.\nDapatkan material crafting.',
        limitText: '3x / day',
        color: 0x00bcd4,
        btnLabel: 'ENTER LOOTING',
        ticketKey: 'boss-ticket',
      }
    ];

    const cardW = 230;
    const cardH = 340;
    const startX = width / 2 - 270;
    const gapX = 270;
    const centerY = height / 2 + 30;

    modes.forEach((mode, index) => {
      const x = startX + index * gapX;
      
      // Card Background
      const card = this.addStageSelectionItem(
        this.add.rectangle(x, centerY, cardW, cardH, 0x1e293b, 0.95)
          .setStrokeStyle(2.5, mode.color, 0.8)
          .setInteractive({ useHandCursor: true })
      );

      // Title
      this.addStageSelectionItem(
        this.add.text(x, centerY - 130, mode.name, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '18px',
          color: UI.yellow,
          fontStyle: '900',
          align: 'center'
        }).setOrigin(0.5)
      );

      // Description
      this.addStageSelectionItem(
        this.add.text(x, centerY - 70, mode.desc, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: '#e2e8f0',
          fontStyle: '700',
          align: 'center',
          lineSpacing: 4
        }).setOrigin(0.5)
      );

      // Limit Info & Ticket count
      let limitValueText = mode.limitText;
      let ticketCountText = '';
      let remaining = 3;

      if (true) {
        remaining = getDailyAttemptsRemaining(this, mode.id);
        const ticketQty = this.playerProgress.tickets ? (this.playerProgress.tickets[mode.ticketKey] || 0) : 0;
        limitValueText = `Attempts: ${remaining}/3`;
        ticketCountText = `Tickets: ${ticketQty} 🎟️`;
      }

      this.addStageSelectionItem(
        this.add.text(x, centerY + 10, limitValueText, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: mode.id === 'campaign' || remaining > 0 ? '#4ade80' : '#f87171',
          fontStyle: '900',
          align: 'center'
        }).setOrigin(0.5)
      );

      if (ticketCountText) {
        this.addStageSelectionItem(
          this.add.text(x, centerY + 36, ticketCountText, {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '12px',
            color: '#38bdf8',
            fontStyle: '900',
            align: 'center'
          }).setOrigin(0.5)
        );
      }

      // Enter Button
      const btnBg = this.addStageSelectionItem(
        this.add.rectangle(x, centerY + 110, 160, 40, mode.color, 1)
          .setStrokeStyle(1.5, 0xffffff, 1)
      );
      const btnText = this.addStageSelectionItem(
        this.add.text(x, centerY + 110, mode.btnLabel, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: '900'
        }).setOrigin(0.5)
      );

      card.on('pointerover', () => {
        card.setScale(1.03);
        card.setStrokeStyle(3.5, mode.color, 1);
        btnBg.setScale(1.04);
        btnText.setScale(1.04);
        soundManager.playSFX(this, 'hover');
      });
      card.on('pointerout', () => {
        card.setScale(1);
        card.setStrokeStyle(2.5, mode.color, 0.8);
        btnBg.setScale(1);
        btnText.setScale(1);
      });

      card.on('pointerup', () => {
        soundManager.playSFX(this, 'click');
        {
          // Check attempts or tickets
          let canEnter = false;
          let useTicket = false;
          if (remaining > 0) {
            canEnter = true;
          } else {
            const hasTkt = hasTicket(this, mode.ticketKey);
            if (hasTkt) {
              canEnter = true;
              useTicket = true;
            }
          }

          if (canEnter) {
            if (useTicket) {
              consumeTicket(this, mode.ticketKey);
              this.showFeedback('Ticket consumed for entry!');
            } else {
              consumeDailyAttempt(this, mode.id);
            }

            this.clearStageSelectionTab();
            
            // Start game on player highest unlocked campaign stage number but in target game mode!
            const highestStageId = this.playerProgress.highestStageUnlocked || 1;
            this.scene.start('GameScene', {
              stageId: highestStageId,
              gameMode: mode.id,
              selectedHero: this.selectedHero,
              baseHeroStats: this.selectedHeroBaseStats,
              equippedItems: this.equippedItems,
              activeSkin: this.activeSkin,
              finalStats: this.finalHeroStats
            });
          } else {
            soundManager.playSFX(this, 'hit');
            this.showFeedback('No attempts or tickets remaining!');
          }
        }
      });
    });
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

  addBlacksmithItem(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.blacksmithLayer.push(item);
    return item;
  }

  clearBlacksmithTab() {
    this.blacksmithLayer.forEach((item) => item.destroy());
    this.blacksmithLayer = [];
  }

  showBlacksmithTab() {
    this.clearBlacksmithTab();
    this.refreshHeroLoadout();
    this.playerProgress = getPlayerProgress(this);

    const { width, height } = this.scale;

    // Background Gradient matching Menu Scene
    const bg = this.add.graphics();
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
    this.addBlacksmithItem(bg);

    // Header Title
    this.addBlacksmithItem(this.add.text(185, 38, '⚒️ BLACKSMITH CRAFTING', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '28px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#07111f',
      strokeThickness: 4,
    }).setOrigin(0, 0.5));

    this.addBlacksmithItem(this.add.text(185, 68, 'Tempa perlengkapan tempur baru menggunakan material dari looting boss.', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '13px',
      color: '#9af2ff',
      fontStyle: '800',
      stroke: '#07111f',
      strokeThickness: 2,
    }).setOrigin(0, 0.5));

    // Close button top-left
    const closeBtn = this.addBlacksmithItem(
      this.add.rectangle(110, 52, 42, 42, 0xd97706, 1)
        .setStrokeStyle(2, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );
    const closeText = this.addBlacksmithItem(
      this.add.text(110, 52, '◀', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );
    closeBtn.on('pointerover', () => { closeBtn.setScale(1.1); closeText.setScale(1.1); soundManager.playSFX(this, 'hover'); });
    closeBtn.on('pointerout', () => { closeBtn.setScale(1); closeText.setScale(1); });
    closeBtn.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.clearBlacksmithTab();
    });

    // Material Resources Panel (Top Right)
    const resX = width - 360;
    const resY = 38;
    const resBg = this.addBlacksmithItem(
      this.add.rectangle(resX + 160, resY + 12, 340, 54, 0x07111f, 0.9)
        .setStrokeStyle(2, 0x4aa6f7, 0.8)
    );

    const ironQty = this.playerProgress.materials ? (this.playerProgress.materials['iron-ore'] || 0) : 0;
    const gemQty = this.playerProgress.materials ? (this.playerProgress.materials['magic-gem'] || 0) : 0;
    const scaleQty = this.playerProgress.materials ? (this.playerProgress.materials['dragon-scale'] || 0) : 0;

    this.addBlacksmithItem(this.add.text(resX + 10, resY + 12, `🪨 ${ironQty}  💎 ${gemQty}  🐉 ${scaleQty}`, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: '900'
    }).setOrigin(0, 0.5));

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

      const isOwned = this.playerProgress.ownedEquipment && this.playerProgress.ownedEquipment.includes(recipe.resultItemId);

      // Recipe Card Frame
      const card = this.addBlacksmithItem(
        this.add.rectangle(rx + cardW/2, ry + cardH/2, cardW, cardH, 0x07111f, 0.95)
          .setStrokeStyle(2, isOwned ? 0x4ade80 : 0x4aa6f7, 0.8)
      );

      // Icon Display
      this.addBlacksmithItem(this.add.circle(rx + 50, ry + 75, 30, 0x0c1e3d, 1))
        .setStrokeStyle(2, isOwned ? 0x4ade80 : 0x4aa6f7, 1);
      this.addBlacksmithItem(this.add.text(rx + 50, ry + 75, itemData.icon, { fontSize: '28px' }).setOrigin(0.5));

      // Title
      this.addBlacksmithItem(this.add.text(rx + 100, ry + 20, itemData.name.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '16px',
        color: isOwned ? '#4ade80' : UI.yellow,
        fontStyle: '900'
      }));

      // Type/Slot
      this.addBlacksmithItem(this.add.text(rx + 100, ry + 42, `SLOT: ${itemData.slot.toUpperCase()}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '10px',
        color: '#89c5f8',
        fontStyle: '800'
      }));

      // Stats
      const statBonusText = formatEquipmentBonus(itemData);
      this.addBlacksmithItem(this.add.text(rx + 100, ry + 56, statBonusText, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: '800'
      }));

      // Materials Cost Display
      let costStrings = [];
      let canCraft = true;

      // Gold check
      const currentGold = this.playerProgress.gold;
      const goldColor = currentGold >= recipe.costGold ? '#4ade80' : '#f87171';
      if (currentGold < recipe.costGold) canCraft = false;

      costStrings.push(`💰 ${recipe.costGold}`);

      // Materials check
      Object.entries(recipe.materials).forEach(([matId, qty]) => {
        const ownedQty = this.playerProgress.materials ? (this.playerProgress.materials[matId] || 0) : 0;
        const matIcons = { 'iron-ore': '🪨', 'magic-gem': '💎', 'dragon-scale': '🐉' };
        if (ownedQty < qty) canCraft = false;
        
        costStrings.push(`${matIcons[matId] || ''} ${ownedQty}/${qty}`);
      });

      this.addBlacksmithItem(this.add.text(rx + 100, ry + 82, costStrings.join('   '), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '11px',
        color: '#cbd5e1',
        fontStyle: '900'
      }));

      // Craft Button
      if (isOwned) {
        this.addBlacksmithItem(this.add.text(rx + 340, ry + 75, 'OWNED', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '14px',
          color: '#4ade80',
          fontStyle: '900'
        }).setOrigin(0.5));
      } else {
        const craftBtn = this.addBlacksmithItem(
          this.add.rectangle(rx + 340, ry + 75, 100, 36, canCraft ? 0x2563eb : 0x334155, 1)
            .setStrokeStyle(1.5, canCraft ? 0x60a5fa : 0x475569, 1)
        );
        const craftText = this.addBlacksmithItem(
          this.add.text(rx + 340, ry + 75, 'CRAFT', {
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
            soundManager.playSFX(this, 'hover');
          });
          craftBtn.on('pointerout', () => {
            craftBtn.setScale(1);
            craftText.setScale(1);
          });
          craftBtn.on('pointerup', () => {
            soundManager.playSFX(this, 'upgrade');
            
            // Consume gold
            addPlayerGold(this, -recipe.costGold);
            
            // Consume materials
            Object.entries(recipe.materials).forEach(([matId, qty]) => {
              addPlayerMaterial(this, matId, -qty);
            });

            // Unlock Equipment
            addEquipmentToInventory(this, recipe.resultItemId);

            this.showFeedback('Equipment Crafted successfully!');
            this.showBlacksmithTab();
          });
        }
      }
    });
  }

  addSkillsItem(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.skillsLayer.push(item);
    return item;
  }

  clearSkillsTab() {
    this.skillsLayer.forEach((item) => item.destroy());
    this.skillsLayer = [];
    this.selectedSkill = null;
  }

  showSkillsTab() {
    // Clear all other active tabs to avoid overlap
    this.clearInventoryTab();
    this.clearStageSelectionTab();
    this.clearSettingsTab();
    this.clearBlacksmithTab();
    this.clearSkillsTab();

    this.refreshHeroLoadout();
    this.playerProgress = getPlayerProgress(this);

    // Default selection to fireball
    if (!this.selectedSkill) {
      this.selectedSkill = skills[0];
    }

    const { width, height } = this.scale;

    // Background Gradient matching Menu Scene
    const bg = this.add.graphics();
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
    this.addSkillsItem(bg);

    // Header Title
    this.addSkillsItem(this.add.text(185, 38, '⚡ PLAYER SKILLS TREE', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '28px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#07111f',
      strokeThickness: 4,
    }).setOrigin(0, 0.5));

    this.addSkillsItem(this.add.text(185, 68, 'Buka dan upgrade skill aktif menggunakan gold berdasarkan level player.', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '13px',
      color: '#9af2ff',
      fontStyle: '800',
      stroke: '#07111f',
      strokeThickness: 2,
    }).setOrigin(0, 0.5));

    // Close button top-left
    const closeBtn = this.addSkillsItem(
      this.add.rectangle(110, 52, 42, 42, 0xd97706, 1)
        .setStrokeStyle(2, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );
    const closeText = this.addSkillsItem(
      this.add.text(110, 52, '◀', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5)
    );

    closeBtn.on('pointerover', () => {
      closeBtn.setScale(1.1);
      closeText.setScale(1.1);
      soundManager.playSFX(this, 'hover');
    });
    closeBtn.on('pointerout', () => {
      closeBtn.setScale(1);
      closeText.setScale(1);
    });
    closeBtn.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.clearSkillsTab();
    });

    // Positions for skill nodes
    const positions = {
      'fireball': { x: 320, y: 240 },
      'lightning-strike': { x: 320, y: 460 },
      'multi-shot': { x: 600, y: 240 },
      'spin-attack': { x: 600, y: 460 }
    };

    // Draw skill nodes
    skills.forEach((skill) => {
      const pos = positions[skill.id];
      if (pos) {
        this.drawSkillNode(pos.x, pos.y, skill);
      }
    });

    // Draw Skill Details Panel on the right
    this.drawSkillDetailsPanel();
  }

  drawSkillNode(x, y, skill) {
    const isSelected = this.selectedSkill?.id === skill.id;
    const skillLevels = this.registry.get('playerData')?.skillLevels || {};
    const currentLvl = skillLevels[skill.id] || 0;

    // Prerequisite checks
    const isLevelMet = (this.playerProgress.playerLevel || 1) >= skill.requiredPlayerLevel;
    const isUnlocked = isLevelMet;

    // Node card background
    let bgCol = 0x07111f;
    let strokeCol = 0x4aa6f7;
    let strokeAlpha = 0.6;

    if (isSelected) {
      bgCol = 0x0c86bd;
      strokeCol = 0xffdc5a;
      strokeAlpha = 1.0;
    } else if (!isUnlocked) {
      bgCol = 0x1e293b;
      strokeCol = 0x475569;
      strokeAlpha = 0.5;
    }

    const card = this.addSkillsItem(
      this.add.rectangle(x, y, 220, 110, bgCol, 0.95)
        .setStrokeStyle(3, strokeCol, strokeAlpha)
        .setInteractive({ useHandCursor: true })
    );

    // Icon circle
    this.addSkillsItem(this.add.circle(x - 56, y, 30, 0x0c1e3d, 1))
      .setStrokeStyle(2.5, isUnlocked ? 0x00d6ff : 0x64748b, 1);

    const icon = this.addSkillsItem(
      this.add.image(x - 56, y, skill.assetKey)
        .setDisplaySize(50, 50)
        .setAlpha(isUnlocked ? 1.0 : 0.35)
    );

    // Skill Name text
    const nameText = this.addSkillsItem(
      this.add.text(x - 12, y - 34, skill.name, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '15px',
        color: isUnlocked ? UI.white : '#94a3b8',
        fontStyle: '900',
      }).setOrigin(0, 0.5)
    );

    // Level status or locked label
    let statusText = `Lv. ${currentLvl}/${skill.maxLevel}`;
    let statusColor = UI.cyan;
    if (!isUnlocked) {
      statusText = 'LOCKED';
      statusColor = '#f87171';
    } else if (currentLvl === 0) {
      statusText = 'UNLOCKED (Lv. 0)';
      statusColor = UI.yellow;
    } else if (currentLvl === skill.maxLevel) {
      statusText = 'MAX LEVEL';
      statusColor = '#4ade80';
    }

    this.addSkillsItem(
      this.add.text(x - 12, y - 10, statusText, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: statusColor,
        fontStyle: '800',
      }).setOrigin(0, 0.5)
    );

    // Requirements label (small font)
    this.addSkillsItem(
      this.add.text(x - 12, y + 14, `Req: Player Lv. ${skill.requiredPlayerLevel}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '10px',
        color: isLevelMet ? '#4ade80' : '#f87171',
        fontStyle: '800'
      }).setOrigin(0, 0.5)
    );

    // Add lock icon if not unlocked
    if (!isUnlocked) {
      this.addSkillsItem(
        this.add.image(x - 56, y, 'ui-lock-icon')
          .setDisplaySize(24, 24)
          .setAlpha(0.85)
      );
    }

    // Event handlers
    card.on('pointerover', () => {
      card.setScale(1.03);
      soundManager.playSFX(this, 'hover');
    });
    card.on('pointerout', () => {
      card.setScale(1);
    });
    card.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.selectedSkill = skill;
      this.showSkillsTab(); // Redraw panel and highlights
    });
  }

  drawSkillDetailsPanel() {
    const rx = 960;
    const ry = 380;
    const rw = 380;
    const rh = 460;

    // Panel card background
    this.addSkillsItem(
      this.add.rectangle(rx, ry, rw, rh, 0x07111f, 0.95)
        .setStrokeStyle(3, 0x4aa6f7, 0.8)
    );

    if (!this.selectedSkill) {
      this.addSkillsItem(
        this.add.text(rx, ry, 'Select a skill to inspect and upgrade', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '14px',
          color: '#94a3b8',
          fontStyle: 'bold'
        }).setOrigin(0.5)
      );
      return;
    }

    const skill = this.selectedSkill;
    const skillLevels = this.registry.get('playerData')?.skillLevels || {};
    const currentLvl = skillLevels[skill.id] || 0;

    // Prerequisite checks
    const isUnlocked = (this.playerProgress.playerLevel || 1) >= skill.requiredPlayerLevel;

    // Skill Name
    this.addSkillsItem(
      this.add.text(rx, ry - 190, skill.name.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '24px',
        color: UI.yellow,
        fontStyle: '900',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5)
    );

    // Description text
    this.addSkillsItem(
      this.add.text(rx, ry - 152, skill.description, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '13px',
        color: '#cbd5e1',
        align: 'center',
        wordWrap: { width: rw - 40 }
      }).setOrigin(0.5)
    );

    // Passive Buff Text
    const currentBuffText = currentLvl > 0 
      ? `PASSIVE: +${currentLvl * 8}% Dmg & -${currentLvl * 5}% Cooldown in battle.`
      : `PASSIVE (Locked): +8% Dmg & -5% Cooldown per level.`;
    this.addSkillsItem(
      this.add.text(rx, ry - 110, currentBuffText, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: currentLvl > 0 ? '#4ade80' : '#94a3b8',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: rw - 40 }
      }).setOrigin(0.5)
    );

    // Requirements Checklist
    const reqY = ry - 65;
    this.addSkillsItem(
      this.add.text(rx - 150, reqY, 'REQUISITES:', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: UI.cyan,
        fontStyle: '900'
      }).setOrigin(0, 0.5)
    );

    const checkPlayerLvl = isUnlocked ? '✅' : '❌';
    this.addSkillsItem(
      this.add.text(rx - 150, reqY + 24, `${checkPlayerLvl} Player Level ${skill.requiredPlayerLevel} (You: Lv. ${this.playerProgress.playerLevel || 1})`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: isUnlocked ? '#4ade80' : '#f87171',
        fontStyle: '800'
      }).setOrigin(0, 0.5)
    );

    // Stats Section
    const statsY = ry + 25;
    this.addSkillsItem(
      this.add.text(rx - 150, statsY, 'BASE STAT COMPARISON:', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: UI.cyan,
        fontStyle: '900'
      }).setOrigin(0, 0.5)
    );

    const maxed = currentLvl >= skill.maxLevel;
    const currentStats = getSkillLevelStats({ ...skill, level: currentLvl === 0 ? 1 : currentLvl });
    const nextStats = getSkillLevelStats({ ...skill, level: currentLvl + 1 });

    const displayedStats = [
      { label: 'Damage', key: 'damage', format: (val) => `${val}` },
      { label: 'Cooldown', key: 'cooldown', format: (val) => `${(val / 1000).toFixed(1)}s` },
      { label: 'Range', key: 'range', format: (val) => `${val}` },
      { label: 'Area Radius', key: 'area', format: (val) => `${val}` }
    ];

    let rowCount = 0;
    displayedStats.forEach((st) => {
      // Don't show range or area if base skill has 0
      if ((st.key === 'range' && skill.range === 0) || (st.key === 'area' && skill.area === 0)) {
        return;
      }

      const rowY = statsY + 24 + (rowCount * 22);
      this.addSkillsItem(
        this.add.text(rx - 150, rowY, st.label, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: '#94a3b8',
          fontStyle: '800'
        }).setOrigin(0, 0.5)
      );

      const val1 = currentLvl === 0 ? 'LOCKED' : st.format(currentStats[st.key]);
      const val2 = maxed ? 'MAX' : st.format(nextStats[st.key]);

      this.addSkillsItem(
        this.add.text(rx + 150, rowY, `${val1}  ➔  ${val2}`, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: UI.white,
          fontStyle: '900'
        }).setOrigin(1, 0.5)
      );

      rowCount++;
    });

    // Upgrade Button Cost & Action
    const btnY = ry + 175;
    if (maxed) {
      this.addSkillsItem(
        this.add.rectangle(rx, btnY, rw - 60, 44, 0x1e293b, 1)
          .setStrokeStyle(2, 0x475569, 1)
      );
      this.addSkillsItem(
        this.add.text(rx, btnY, 'MAX LEVEL REACHED', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '14px',
          color: '#94a3b8',
          fontStyle: '900'
        }).setOrigin(0.5)
      );
    } else if (!isUnlocked) {
      this.addSkillsItem(
        this.add.rectangle(rx, btnY, rw - 60, 44, 0x1e293b, 1)
          .setStrokeStyle(2, 0x475569, 1)
      );
      this.addSkillsItem(
        this.add.text(rx, btnY, 'SKILL BLOCKED', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '14px',
          color: '#f87171',
          fontStyle: '900'
        }).setOrigin(0.5)
      );
    } else {
      const upgradeCost = (currentLvl + 1) * 1500;
      const canAfford = this.playerProgress.gold >= upgradeCost;

      const upgradeBtn = this.addSkillsItem(
        this.add.rectangle(rx, btnY, rw - 60, 44, canAfford ? 0x15803d : 0x1e293b, 1)
          .setStrokeStyle(2.5, canAfford ? 0x22c55e : 0x475569, 1)
          .setInteractive({ useHandCursor: true })
      );

      const btnTitle = currentLvl === 0 ? 'UNLOCK SKILL' : 'UPGRADE SKILL';
      const upgradeBtnText = this.addSkillsItem(
        this.add.text(rx, btnY - 9, btnTitle, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '13px',
          color: canAfford ? UI.white : '#94a3b8',
          fontStyle: '900'
        }).setOrigin(0.5)
      );

      // Gold cost
      const goldIcon = this.addSkillsItem(
        this.add.image(rx - 45, btnY + 11, 'ui-icon-gold').setDisplaySize(18, 18)
      );
      const costText = this.addSkillsItem(
        this.add.text(rx - 30, btnY + 11, this.formatCurrency(upgradeCost), {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '13px',
          color: canAfford ? UI.yellow : '#94a3b8',
          fontStyle: '900'
        }).setOrigin(0, 0.5)
      );

      upgradeBtn.on('pointerover', () => {
        if (canAfford) {
          upgradeBtn.setFillStyle(0x166534, 1);
          upgradeBtn.setScale(1.02);
          soundManager.playSFX(this, 'hover');
        }
      });
      upgradeBtn.on('pointerout', () => {
        if (canAfford) {
          upgradeBtn.setFillStyle(0x15803d, 1);
          upgradeBtn.setScale(1);
        }
      });
      upgradeBtn.on('pointerup', () => {
        this.upgradeSelectedSkill(upgradeCost, currentLvl);
      });
    }
  }

  upgradeSelectedSkill(cost, currentLvl) {
    if (this.playerProgress.gold < cost) {
      soundManager.playSFX(this, 'hit');
      this.showUpgradeFeedback(false, 'Not enough gold!');
      return;
    }

    soundManager.playSFX(this, 'upgrade');

    // Deduct gold
    const nextGold = addPlayerGold(this, -cost);
    this.playerProgress.gold = nextGold;

    // Save skill level
    const skillId = this.selectedSkill.id;
    saveSkillLevel(skillId, currentLvl + 1);

    // Update gold display on the top HUD instantly
    if (this.goldText) {
      this.goldText.setText(this.formatCurrency(nextGold));
    }

    this.showUpgradeFeedback(true, currentLvl === 0 ? 'Skill Unlocked!' : 'Skill Upgraded!');

    // Redraw Skills Tree modal
    this.showSkillsTab();
  }
}



