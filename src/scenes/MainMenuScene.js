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
import { GameManager } from '../systems/GameManager.js';
import {
  getPlayerProgress,
  addPlayerGold,
} from '../systems/PlayerProgress.js';

import { soundManager } from '../services/soundManager.js';

// Modular UI imports
import { StageSelectionTab } from '../ui/menu/StageSelectionTab.js';
import { ModeSelectionTab } from '../ui/menu/ModeSelectionTab.js';
import { SettingsTab } from '../ui/menu/SettingsTab.js';
import { UI } from '../ui/menu/MenuConfig.js';

// DOM UI
import { DOMUIManager } from '../ui/dom/DOMUIManager.js';
import { InventoryDOM } from '../ui/dom/InventoryDOM.js';
import { HeroDOM } from '../ui/dom/HeroDOM.js';
import { ShopDOM } from '../ui/dom/ShopDOM.js';
import { savePlayerData } from '../services/saveService.js';



export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  preload() {
    // Assets are preloaded in PreloadScene
  }

  create() {
    const { width, height } = this.scale;
    this.playerProgress = getPlayerProgress(this);
    this.activeSkin = skins[0];

    // Initialize modular tabs
    this.stageSelectionTab = new StageSelectionTab(this);
    this.settingsTab = new SettingsTab(this);
    this.modeSelectionTab = new ModeSelectionTab(this);

    // Initialize DOM UI
    this.domUiManager = new DOMUIManager(this);
    this.inventoryDom = new InventoryDOM(this, this.domUiManager);
    this.heroDom = new HeroDOM(this, this.domUiManager);
    this.shopDom = new ShopDOM(this, this.domUiManager);

    this.loadoutSlotAnchors = [];
    this.loadoutSlotLayer = [];
    this.refreshHeroLoadout();

    this.drawCleanBackground(width, height);

    this.addRedesignedTopBar(width);
    this.addCenterHeroArea(width, height);
    this.addSideButtons(width, height);
    this.addBottomUI(width, height);

    this.checkOfflineRewards();

    // Bind Escape key to close any active modal tabs
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.domUiManager && this.domUiManager.activeOverlay) {
        soundManager.playSFX(this, 'click');
        this.domUiManager.closeCurrent();
      } else if (this.stageSelectionTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.clearStageSelectionTab();
      } else if (this.settingsTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.clearSettingsTab();
      } else if (this.modeSelectionTab.isActive()) {
        soundManager.playSFX(this, 'click');
        this.modeSelectionTab.clear();
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

    // (RPG System: Hero cycling removed — single hero, class based progression)
    
    const isAnyTabActive = () => {
      return (
        (this.domUiManager && this.domUiManager.activeOverlay) ||
        (this.stageSelectionTab && this.stageSelectionTab.isActive()) ||
        (this.settingsTab && this.settingsTab.isActive()) ||
        (this.modeSelectionTab && this.modeSelectionTab.isActive())
      );
    };

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

    this.resizeListener = (gameSize, baseSize, displaySize, prevWidth, prevHeight) => {
      if (prevWidth && prevHeight && (gameSize.width !== prevWidth || gameSize.height !== prevHeight)) {
        this.scene.restart();
      }
    };
    this.scale.on('resize', this.resizeListener);

    this.events.once('shutdown', () => {
      this.scale.off('resize', this.resizeListener);
    });

    soundManager.playBGM(this, 'menu-bgm');
  }

  clearAllTabs() {
    if (this.domUiManager) this.domUiManager.closeCurrent();
    if (this.stageSelectionTab) this.stageSelectionTab.clear();
    if (this.settingsTab) this.settingsTab.clear();
    if (this.modeSelectionTab) this.modeSelectionTab.clear();
  }

  drawCleanBackground(width, height) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xffffff, 0xffffff, 0xf0e6dc, 0xebd9cc, 1);
    bg.fillRect(0, 0, width, height);

    // Optional subtle soft shapes in background
    bg.fillStyle(0xffffff, 0.4);
    bg.fillCircle(width * 0.15, height * 0.3, 150);
    bg.fillCircle(width * 0.85, height * 0.7, 200);
  }

  addRedesignedTopBar(width) {
    const isPortrait = this.scale.height > this.scale.width;
    const topY = 40;

    if (isPortrait) {
      // 1. Compact Profile Area (Top Left)
      const profileBg = this.add.graphics();
      profileBg.fillStyle(0xf8f4ef, 1);
      profileBg.fillRoundedRect(10, topY - 20, 140, 44, 10);
      profileBg.lineStyle(1.5, 0xe2d5c8, 1);
      profileBg.strokeRoundedRect(10, topY - 20, 140, 44, 10);

      // Hexagon Avatar
      const avatarX = 28;
      const avatarY = topY + 2;
      const hex = this.add.graphics();
      hex.fillStyle(0xd5bda3, 1);
      hex.fillPoints([
        {x: avatarX, y: avatarY - 16}, {x: avatarX + 14, y: avatarY - 8}, 
        {x: avatarX + 14, y: avatarY + 8}, {x: avatarX, y: avatarY + 16}, 
        {x: avatarX - 14, y: avatarY + 8}, {x: avatarX - 14, y: avatarY - 8}
      ], true);
      
      const activeSkin = this.activeSkin;
      const visualKey = activeSkin?.assetKey || this.selectedHero.assetKey;
      this.add.image(avatarX, avatarY, visualKey).setDisplaySize(24, 24);

      // Name & Level
      const pName = GameManager.get('playerName') || 'Hero';
      const displayName = pName.length > 8 ? pName.substring(0, 8) + '..' : pName;
      this.add.text(50, topY - 14, displayName, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '11px',
        color: '#4a3f35',
        fontStyle: '900',
      });

      const playerLevel = this.playerProgress.playerLevel || 1;
      this.add.text(50, topY, `Lv.${playerLevel}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '11px',
        color: '#6ab5c7',
        fontStyle: 'bold'
      });

      // 2. Resource capsules & Settings
      // Gold
      this.addCapsule(width - 130, topY + 2, '🪙', this.formatCurrency(this.playerProgress.gold), 0xcca677);
      
      // Settings Button
      const setBtn = this.add.circle(width - 30, topY + 2, 16, 0xffffff)
        .setInteractive({ useHandCursor: true });
      this.add.text(width - 30, topY + 2, '⚙️', { fontSize: '16px', color: '#000' }).setOrigin(0.5);
      
      setBtn.on('pointerover', () => { setBtn.setScale(1.1); soundManager.playSFX(this, 'hover'); });
      setBtn.on('pointerout', () => setBtn.setScale(1));
      setBtn.on('pointerup', () => { soundManager.playSFX(this, 'click'); this.showSettingsTab(); });

    } else {
      // 1. Profile Area (Top Left)
      const profileBg = this.add.graphics();
      profileBg.fillStyle(0xf8f4ef, 1);
      profileBg.fillRoundedRect(20, topY - 20, 220, 50, 12);
      // Add a slight shadow
      profileBg.lineStyle(2, 0xe2d5c8, 1);
      profileBg.strokeRoundedRect(20, topY - 20, 220, 50, 12);

      // Hexagon Avatar
      const avatarX = 40;
      const avatarY = topY + 5;
      const hex = this.add.graphics();
      hex.fillStyle(0xd5bda3, 1);
      // draw simple hexagon shape
      hex.fillPoints([
        {x: avatarX, y: avatarY - 22}, {x: avatarX + 20, y: avatarY - 11}, 
        {x: avatarX + 20, y: avatarY + 11}, {x: avatarX, y: avatarY + 22}, 
        {x: avatarX - 20, y: avatarY + 11}, {x: avatarX - 20, y: avatarY - 11}
      ], true);
      
      const activeSkin = this.activeSkin;
      const visualKey = activeSkin?.assetKey || this.selectedHero.assetKey;
      this.add.image(avatarX, avatarY, visualKey).setDisplaySize(32, 32);

      // Name
      const pName = GameManager.get('playerName') || 'Hero';
      this.add.text(75, topY - 12, pName, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '16px',
        color: '#4a3f35',
        fontStyle: '900',
      });

      const playerLevel = this.playerProgress.playerLevel || 1;
      const playerExp = this.playerProgress.playerExp || 0;
      const requiredExp = playerLevel * 200;
      const expRatio = Math.min(1.0, playerExp / requiredExp);

      // Level bubble
      this.add.circle(85, topY + 12, 10, 0x6ab5c7);
      this.add.text(85, topY + 12, playerLevel, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // EXP Bar
      const xpX = 100;
      const xpY = topY + 8;
      const xpW = 100;
      const xpH = 8;
      this.add.rectangle(xpX + xpW/2, xpY + xpH/2, xpW, xpH, 0xe2d5c8).setOrigin(0.5);
      if (expRatio > 0) {
        this.add.rectangle(xpX + (xpW * expRatio)/2, xpY + xpH/2, xpW * expRatio, xpH, 0xf6be4f).setOrigin(0.5);
      }

      // 2. Center Top (Class Badge)
      const cx = width / 2;
      const classBadge = this.add.graphics();
      classBadge.fillStyle(0x4a426b, 1);
      // Draw polygon like reference
      classBadge.fillPoints([
        {x: cx - 40, y: topY - 15}, {x: cx + 20, y: topY - 15},
        {x: cx + 40, y: topY + 5}, {x: cx + 20, y: topY + 25},
        {x: cx - 40, y: topY + 25}, {x: cx - 60, y: topY + 5}
      ], true);
      
      // Circle for level inside badge
      this.add.circle(cx - 35, topY + 5, 14, 0x332b4d);
      this.add.text(cx - 35, topY + 5, playerLevel, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      // White bar next to it
      this.add.rectangle(cx + 10, topY + 5, 60, 10, 0xffffff);

      // 3. Top Right Resources
      // Gold
      this.addCapsule(width - 250, topY, '🪙', this.formatCurrency(this.playerProgress.gold), 0xcca677);
      // Gems
      this.addCapsule(width - 150, topY, '💎', '50', 0xcca677);
      
      // Settings Button
      const setBtn = this.add.circle(width - 50, topY + 5, 18, 0xffffff)
        .setInteractive({ useHandCursor: true });
      this.add.text(width - 50, topY + 5, '⚙️', { fontSize: '20px', color: '#000' }).setOrigin(0.5);
      
      setBtn.on('pointerover', () => { setBtn.setScale(1.1); soundManager.playSFX(this, 'hover'); });
      setBtn.on('pointerout', () => setBtn.setScale(1));
      setBtn.on('pointerup', () => { soundManager.playSFX(this, 'click'); this.showSettingsTab(); });
    }
  }

  addCapsule(x, y, icon, value, bgColor) {
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.4);
    bg.fillRoundedRect(x - 40, y - 12, 80, 24, 12);
    
    this.add.text(x - 30, y, icon, { fontSize: '18px' }).setOrigin(0.5);
    const valText = this.add.text(x + 10, y, value, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '14px',
      color: '#4a3f35',
      fontStyle: '800'
    }).setOrigin(0.5);

    if (icon === '🪙') {
      this.goldText = valText;
    }
  }

  addSideButtons(width, height) {
    const isPortrait = this.scale.height > this.scale.width;
    if (isPortrait) {
      // Bottom Navigation Bar in Portrait mode
      const y = height - 42;
      const buttons = [
        { label: 'SHOP', icon: '🏪', action: () => this.showShopTab() },
        { label: 'HERO', icon: '👧', action: () => this.showHeroTab() },
        { label: 'INVENTORY', icon: '🎒', action: () => this.showInventoryTab() },
        { label: 'SKILLS', icon: '⚡', action: () => this.showSkillsTab() },
        { label: 'SMITH', icon: '⚒️', action: () => this.showBlacksmithTab() }
      ];

      buttons.forEach((btn, i) => {
        const x = (i + 0.5) * (width / buttons.length);
        this.addSideButton(x, y, btn.label, btn.icon, btn.action);
      });
    } else {
      // Left Buttons (Shop, Hero, Inventory)
      const lx = 60;
      let ly = height * 0.35;
      
      const leftBtns = [
        { label: 'SHOP', icon: '🏪', action: () => this.showShopTab() },
        { label: 'HERO', icon: '👧', action: () => this.showHeroTab() },
        { label: 'INVENTORY', icon: '🎒', action: () => this.showInventoryTab() }
      ];

      leftBtns.forEach((btn, i) => {
        this.addSideButton(lx, ly + i * 85, btn.label, btn.icon, btn.action);
      });

      // Right Buttons (Skills, Smith)
      const rx = width - 60;
      const rightBtns = [
        { label: 'SKILLS', icon: '⚡', action: () => this.showSkillsTab() },
        { label: 'SMITH', icon: '⚒️', action: () => this.showBlacksmithTab() }
      ];

      rightBtns.forEach((btn, i) => {
        this.addSideButton(rx, ly + i * 85, btn.label, btn.icon, btn.action);
      });
    }
  }

  addSideButton(x, y, label, icon, callback) {
    const container = this.add.container(x, y);
    const bg = this.add.circle(0, 0, 28, 0xa58b76, 0.9)
      .setInteractive({ useHandCursor: true });
    // inner circle
    const inner = this.add.circle(0, 0, 24, 0x937661, 1);
    
    const iconText = this.add.text(0, -4, icon, { fontSize: '24px' }).setOrigin(0.5);
    const labelText = this.add.text(0, 36, label, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '11px',
      color: '#705c4b',
      fontStyle: '800'
    }).setOrigin(0.5);

    container.add([bg, inner, iconText, labelText]);

    bg.on('pointerover', () => { container.setScale(1.1); soundManager.playSFX(this, 'hover'); });
    bg.on('pointerout', () => container.setScale(1));
    bg.on('pointerup', () => { soundManager.playSFX(this, 'click'); callback(); });
  }

  addCenterHeroArea(width, height) {
    const isPortrait = this.scale.height > this.scale.width;
    const cx = width / 2;
    const cy = isPortrait ? (height * 0.42) : (height / 2 + 20);
    const heroSize = isPortrait ? 200 : 280;

    // Soft shadow under hero
    this.add.ellipse(cx, cy + (isPortrait ? 130 : 190), isPortrait ? 120 : 180, isPortrait ? 30 : 40, 0x000000, 0.15).setDepth(90);

    const activeSkin = this.activeSkin;
    const visualKey = activeSkin?.assetKey || this.selectedHero.assetKey;
    this.heroPortrait = this.add.image(cx, cy + 20, visualKey).setDisplaySize(heroSize, heroSize);
    this.heroPortrait.setDepth(110);

    // Plus button on the right of hero
    const plusContainer = this.add.container(cx + (isPortrait ? 90 : 140), cy + 20);
    const pBg = this.add.rectangle(0, 0, 36, 36, 0xe2d5c8, 0.8)
      .setInteractive({ useHandCursor: true });
    pBg.isStroked = false;
    const pText = this.add.text(0, 0, '+', { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    plusContainer.add([pBg, pText]);

    pBg.on('pointerover', () => { plusContainer.setScale(1.1); soundManager.playSFX(this, 'hover'); });
    pBg.on('pointerout', () => plusContainer.setScale(1));
    pBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      this.showHeroTab(); 
    });
  }

  addBottomUI(width, height) {
    const isPortrait = this.scale.height > this.scale.width;

    if (isPortrait) {
      const cx = width / 2;
      // Position buttons slightly higher up than the bottom nav bar (which is at height - 42)
      const by = height - 120;

      // MODE Button
      const modeBtn = this.add.container(cx, by - 52);
      const mBg = this.add.graphics();
      mBg.fillStyle(0x6ab5c7, 1);
      mBg.fillRoundedRect(-120, -16, 240, 32, 10);
      const mZone = this.add.zone(0, 0, 240, 32).setInteractive({ useHandCursor: true });
      const mText = this.add.text(0, 0, 'MODE SELECTION', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: '800'
      }).setOrigin(0.5);
      modeBtn.add([mBg, mZone, mText]);

      mZone.on('pointerover', () => { modeBtn.setScale(1.05); soundManager.playSFX(this, 'hover'); });
      mZone.on('pointerout', () => modeBtn.setScale(1));
      mZone.on('pointerup', () => {
        soundManager.playSFX(this, 'click');
        this.showModeSelectionTab();
      });

      // Giant PLAY Button
      const playBtn = this.add.container(cx, by);
      const pBg = this.add.graphics();
      pBg.fillStyle(0xf6be4f, 1);
      pBg.fillRoundedRect(-120, -30, 240, 60, 20);
      const pZone = this.add.zone(0, 0, 240, 60).setInteractive({ useHandCursor: true });
      
      const pText = this.add.text(0, 0, 'PLAY', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '28px',
        color: '#705c4b',
        fontStyle: '900'
      }).setOrigin(0.5);
      
      playBtn.add([pBg, pZone, pText]);

      pZone.on('pointerover', () => { playBtn.setScale(1.05); soundManager.playSFX(this, 'hover'); });
      pZone.on('pointerout', () => playBtn.setScale(1));
      pZone.on('pointerup', () => {
        soundManager.playSFX(this, 'click');
        this.showStageSelectionTab();
      });

    } else {
      const rx = width - 180;
      const by = height - 70;

      // Event Banner (Shifted up)
      const eventY = by - 105;
      const eventBg = this.add.graphics();
      eventBg.fillStyle(0xa58b76, 1);
      eventBg.fillRoundedRect(rx - 120, eventY - 20, 240, 44, 8);
      this.add.text(rx + 20, eventY - 5, 'New events in 02:02:30', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '10px',
        color: '#d6c5b3'
      }).setOrigin(0.5);
      this.add.text(rx + 20, eventY + 10, 'FaCTory Brawl', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Thumbnail for event (left side of banner)
      const thumbBg = this.add.graphics();
      thumbBg.fillStyle(0xcce8ef, 1);
      thumbBg.fillRoundedRect(rx - 130, eventY - 25, 60, 45, 6);
      thumbBg.lineStyle(2, 0xf6be4f, 1);
      thumbBg.strokeRoundedRect(rx - 130, eventY - 25, 60, 45, 6);

      // Info icon on right of banner
      this.add.circle(rx + 120, eventY - 20, 10, 0xc183a6);
      this.add.text(rx + 120, eventY - 20, 'i', { fontSize: '12px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

      // MODE Button
      const modeBtn = this.add.container(rx, by - 52);
      const mBg = this.add.graphics();
      mBg.fillStyle(0x6ab5c7, 1);
      mBg.fillRoundedRect(-120, -16, 240, 32, 10);
      const mZone = this.add.zone(0, 0, 240, 32).setInteractive({ useHandCursor: true });
      const mText = this.add.text(0, 0, 'MODE SELECTION', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: '800'
      }).setOrigin(0.5);
      modeBtn.add([mBg, mZone, mText]);

      mZone.on('pointerover', () => { modeBtn.setScale(1.05); soundManager.playSFX(this, 'hover'); });
      mZone.on('pointerout', () => modeBtn.setScale(1));
      mZone.on('pointerup', () => {
        soundManager.playSFX(this, 'click');
        this.showModeSelectionTab();
      });

      // Giant PLAY Button
      const playBtn = this.add.container(rx, by);
      const pBg = this.add.graphics();
      pBg.fillStyle(0xf6be4f, 1);
      pBg.fillRoundedRect(-120, -30, 240, 60, 20);
      const pZone = this.add.zone(0, 0, 240, 60).setInteractive({ useHandCursor: true });
      
      const pText = this.add.text(0, 0, 'PLAY', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '28px',
        color: '#705c4b',
        fontStyle: '900'
      }).setOrigin(0.5);
      
      playBtn.add([pBg, pZone, pText]);

      pZone.on('pointerover', () => { playBtn.setScale(1.05); soundManager.playSFX(this, 'hover'); });
      pZone.on('pointerout', () => playBtn.setScale(1));
      pZone.on('pointerup', () => {
        soundManager.playSFX(this, 'click');
        this.showStageSelectionTab();
      });

      // Left Side "A GIRL PASS" placeholder
      const passX = 140;
      const passY = height - 50;
      const passBg = this.add.graphics();
      passBg.fillStyle(0x7f6756, 1);
      passBg.fillRoundedRect(passX - 100, passY - 20, 200, 40, 8);
      
      // lightning icon placeholder (triangle)
      const lightBg = this.add.graphics();
      lightBg.fillStyle(0x38bdf8, 1);
      lightBg.fillPoints([{x:passX+80,y:passY-25}, {x:passX+100,y:passY-25}, {x:passX+90,y:passY+15}], true);
      
      // progress bar in pass
      this.add.rectangle(passX - 10, passY + 5, 120, 10, 0x614f40);
      this.add.rectangle(passX - 60, passY + 5, 40, 10, 0xf6be4f).setOrigin(0, 0.5);
      
      this.add.text(passX - 20, passY - 10, 'A GIRL PASS', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
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
    
    const heroLevels = GameManager.get('heroLevels') || {};
    this.heroLevel = heroLevels[this.selectedHero.id] || 1;
    this.equippedItems = getEquippedItems(this);
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
    // Disabled logic: equipment slots no longer display in the main menu for a cleaner look
    if (this.loadoutSlotLayer) {
      this.loadoutSlotLayer.forEach((item) => item.destroy());
      this.loadoutSlotLayer = [];
    }
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
    this.clearAllTabs();
    this.heroDom.show();
  }

  showInventoryTab() {
    this.clearAllTabs();
    this.inventoryDom.show();
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
    this.clearAllTabs();
    this.domUiManager.showShop();
  }

  showBlacksmithTab() {
    this.clearAllTabs();
    this.domUiManager.showBlacksmith();
  }

  showSkillsTab() {
    this.clearAllTabs();
    this.domUiManager.showSkills();
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
  checkOfflineRewards() {
    const lastSaved = GameManager.get('lastSavedTime') || 0;
    if (lastSaved > 0) {
      const now = Date.now();
      const diffMs = now - lastSaved;
      const diffSec = Math.floor(diffMs / 1000);
      
      // Minimum idle time: 1 minute (60 seconds)
      if (diffSec >= 60) {
        const highestStage = GameManager.get('highestStage') || 1;
        const goldPerMinute = highestStage * 2; // e.g. Stage 1 -> 2 Gold/min, Stage 5 -> 10 Gold/min
        
        // Cap idle time at 12 hours (720 minutes)
        const idleMinutes = Math.min(Math.floor(diffSec / 60), 720);
        const goldEarned = idleMinutes * goldPerMinute;
        
        if (goldEarned > 0) {
          this.showOfflineRewardsPopup(diffSec, goldEarned);
        }
      }
    }
  }

  showOfflineRewardsPopup(awaySeconds, goldGained) {
    if (this.input) {
      this.input.enabled = false;
      if (this.input.keyboard) {
        this.input.keyboard.enabled = false;
      }
    }

    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) {
      uiRoot.style.pointerEvents = 'auto';
    }

    const overlay = document.createElement('div');
    overlay.className = 'idle-reward-overlay';

    const stopProp = (e) => e.stopPropagation();
    overlay.addEventListener('pointerdown', stopProp);
    overlay.addEventListener('pointerup', stopProp);
    overlay.addEventListener('click', stopProp);
    overlay.addEventListener('mousedown', stopProp);
    overlay.addEventListener('mouseup', stopProp);

    const hrs = Math.floor(awaySeconds / 3600);
    const mins = Math.floor((awaySeconds % 3600) / 60);
    const secs = awaySeconds % 60;
    
    let timeStr = '';
    if (hrs > 0) timeStr += `<span>${hrs}</span> jam `;
    if (mins > 0 || hrs > 0) timeStr += `<span>${mins}</span> menit `;
    timeStr += `<span>${secs}</span> detik`;

    overlay.innerHTML = `
      <div class="idle-reward-container">
        <div class="idle-reward-header">
          <h2 class="idle-reward-title">OFFLINE RECOVERY</h2>
          <div class="idle-reward-subtitle">WELCOME BACK, HERO!</div>
        </div>
        <div class="idle-reward-body">
          <div class="idle-reward-chest">🎁</div>
          <div class="idle-reward-time-text">
            Kamu telah pergi selama:<br>${timeStr}
          </div>
          <div class="idle-reward-amount-box">
            <span class="idle-reward-amount-val">🪙 +${goldGained} Gold</span>
          </div>
        </div>
        <div class="idle-reward-footer">
          <button class="idle-reward-btn" id="claim-idle-btn">CLAIM REWARDS</button>
        </div>
      </div>
    `;

    const claimBtn = overlay.querySelector('#claim-idle-btn');
    claimBtn.addEventListener('mouseenter', () => soundManager.playSFX(this, 'hover'));
    claimBtn.addEventListener('click', () => {
      soundManager.playSFX(this, 'click');
      
      const currentGold = GameManager.get('gold') || 0;
      const newGold = currentGold + goldGained;
      GameManager.set('gold', newGold);
      
      savePlayerData(GameManager.getState());
      
      if (this.goldText) {
        this.goldText.setText(this.formatCurrency(newGold));
      }

      overlay.remove();
      
      if (this.input) {
        this.input.enabled = true;
        if (this.input.keyboard) {
          this.input.keyboard.enabled = true;
        }
      }
      if (uiRoot) {
        uiRoot.style.pointerEvents = 'none';
      }
    });

    uiRoot.appendChild(overlay);
  }
}
