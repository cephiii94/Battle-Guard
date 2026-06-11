import Phaser from 'phaser';
import { getPlayerProgress, addPlayerGold } from '../../systems/PlayerProgress.js';
import { saveHeroLevel } from '../../services/saveService.js';
import { getAvailableHeroes, setSelectedHero, getSelectedHero, getSelectedHeroBaseStats } from '../../systems/HeroSelection.js';
import { calculateFinalStats } from '../../systems/HeroStats.js';
import { getEquippedItems } from '../../systems/EquipmentInventory.js';
import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';
import skins from '../../data/skins.js';

export class HeroTab {
  constructor(scene) {
    this.scene = scene;
    this.layer = [];
    this.upgradeContainer = null;
    this.heroFrameBackContainer = null;
    this.heroFrameFrontContainer = null;
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
    
    if (this.upgradeContainer) {
      this.upgradeContainer.destroy();
      this.upgradeContainer = null;
    }
    if (this.heroFrameBackContainer) {
      this.heroFrameBackContainer.destroy();
      this.heroFrameBackContainer = null;
    }
    if (this.heroFrameFrontContainer) {
      this.heroFrameFrontContainer.destroy();
      this.heroFrameFrontContainer = null;
    }
  }

  isActive() {
    return this.layer.length > 0;
  }

  show() {
    this.clear();
    
    // Refresh parent scene data
    this.scene.refreshHeroLoadout();
    this.scene.playerProgress = getPlayerProgress(this.scene);

    const { width, height } = this.scene.scale;
    const selectedHero = getSelectedHero(this.scene);
    const selectedHeroBaseStats = getSelectedHeroBaseStats(this.scene);
    const activeSkin = skins.find((skin) => skin.id === selectedHero.cosmeticSkinId) || skins[0];
    const equippedItems = getEquippedItems(this.scene);
    const heroLevels = this.scene.registry.get('heroLevels') || {};
    const heroLevel = heroLevels[selectedHero.id] || 1;
    const finalHeroStats = calculateFinalStats(selectedHeroBaseStats, equippedItems, activeSkin, heroLevel);

    // 1. Futuristic cyan gradient background with cyber perspective grid lines
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(0x0a101d, 0x0a101d, 0x111e3b, 0x0a101d, 1);
    bg.fillRect(0, 0, width, height);

    const floorY = height * 0.75;
    bg.lineStyle(1.5, 0x00d6ff, 0.25);
    
    // Draw horizontal grid lines
    const numHoriz = 10;
    for (let i = 0; i <= numHoriz; i++) {
      const ratio = i / numHoriz;
      const py = floorY + (height - floorY) * Math.pow(ratio, 1.8);
      bg.lineBetween(0, py, width, py);
    }
    
    // Draw vertical/converging grid lines
    const numVert = 16;
    const vpX = width / 2;
    const vpY = floorY - 120;
    for (let i = -numVert / 2; i <= numVert / 2; i++) {
      const startX = width / 2 + i * 110;
      bg.lineBetween(vpX + i * 15, vpY, startX, height);
    }
    this.add(bg);

    // 2. Header Text (Left-aligned next to back button)
    this.add(
      this.scene.add.text(185, 38, 'HERO PROFILE & LEVEL UP', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '28px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#07111f',
        strokeThickness: 4,
      }).setOrigin(0, 0.5)
    );

    this.add(
      this.scene.add.text(185, 68, 'Select a hero class, inspect attributes status, and spend gold to upgrade levels.', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '13px',
        color: '#9af2ff',
        fontStyle: '800',
        stroke: '#07111f',
        strokeThickness: 2,
      }).setOrigin(0, 0.5)
    );

    // 3. Top Left: "kembali" (Back) button
    this.addCloseButton(110, 52);

    // 4. Top Right: "saldo" (Gold & Gems Balance Panel)
    this.addResourcePanel(width - 240, 52);

    // 5. Bottom Left: "area hero" (Hero Selection List)
    this.addHeroSelectionPanel(260, 595);

    // 6. Center: Showcase Area (Large portrait inside revolving frame)
    this.addHeroShowcase(580, 290, selectedHero, activeSkin, heroLevel);

    // 7. Right: Hero Name & "status hero" Panel
    this.addStatsPanel(1040, 110, selectedHero, finalHeroStats);
  }

  addCloseButton(x, y) {
    const button = this.add(
      this.scene.add.rectangle(x, y, 110, 42, 0xd97706, 1)
        .setStrokeStyle(2.5, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );
    const btnText = this.add(
      this.scene.add.text(x, y, '← KEMBALI', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '14px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    button.on('pointerover', () => {
      button.setScale(1.06);
      btnText.setScale(1.06);
      soundManager.playSFX(this.scene, 'hover');
    });
    button.on('pointerout', () => {
      button.setScale(1);
      btnText.setScale(1);
    });
    button.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      this.clear();
    });
  }

  addResourcePanel(x, y) {
    const gold = this.scene.playerProgress.gold;
    const gems = 192999; // Mocked gems based on top bar design

    // Background Panel
    this.add(
      this.scene.add.rectangle(x + 50, y, 320, 44, 0x0c1e3d, 0.9)
        .setStrokeStyle(2, 0x00d6ff, 0.8)
    );

    // Gold Display
    this.add(this.scene.add.text(x - 80, y, '🪙', { fontSize: '20px' }).setOrigin(0.5));
    this.add(
      this.scene.add.text(x - 56, y, this.scene.formatCurrency(gold), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '14px',
        color: UI.yellow,
        fontStyle: '900',
      }).setOrigin(0, 0.5)
    );

    // Gems Display
    this.add(this.scene.add.text(x + 70, y, '💎', { fontSize: '18px' }).setOrigin(0.5));
    this.add(
      this.scene.add.text(x + 94, y, this.scene.formatCurrency(gems), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '14px',
        color: '#00bcd4',
        fontStyle: '900',
      }).setOrigin(0, 0.5)
    );
  }

  addHeroSelectionPanel(startX, y) {
    // Title header
    this.add(
      this.scene.add.text(80, y - 72, 'AREA HERO SELECT', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '15px',
        color: '#67e8f9',
        fontStyle: '900',
        stroke: '#07111f',
        strokeThickness: 3,
      }).setOrigin(0, 0.5)
    );

    // Backing panel for selection area
    this.add(
      this.scene.add.rectangle(230, y, 350, 100, 0x07111f, 0.7)
        .setStrokeStyle(1.5, 0x00d6ff, 0.4)
    );

    const availableHeroes = getAvailableHeroes();
    const currentHero = getSelectedHero(this.scene);

    const circleSpacing = 82;
    availableHeroes.forEach((hero, index) => {
      const circX = 90 + index * circleSpacing;
      const isSelected = hero.id === currentHero.id;

      // Container to hold visual elements so they scale together without overriding displaySize scales
      const visualContainer = this.scene.add.container(circX, y);
      this.add(visualContainer);

      // Circle Base Frame (Visual only, relative to container)
      const circleVisual = this.scene.add.circle(0, 0, 32, isSelected ? 0x0c86bd : 0x0c1e3d, 0.9)
        .setStrokeStyle(2.5, isSelected ? 0xffdc5a : 0x4aa6f7, 0.95);
      visualContainer.add(circleVisual);

      // Mini Avatar Portrait (Visual only, relative to container)
      const activeSkin = skins.find((skin) => skin.id === hero.cosmeticSkinId) || skins[0];
      const visualKey = activeSkin?.assetKey || hero.assetKey;
      const avatarImg = this.scene.add.image(0, 0, visualKey).setDisplaySize(48, 48);
      visualContainer.add(avatarImg);

      // Tooltip/Name text underneath (not in container to avoid scaling)
      const nameTxt = this.add(
        this.scene.add.text(circX, y + 42, hero.name, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '11px',
          color: isSelected ? UI.yellow : UI.white,
          fontStyle: '800',
        }).setOrigin(0.5)
      );

      // Interactive Click Zone (constant hit area scale of 1 to prevent stuck hover states)
      const clickZone = this.add(
        this.scene.add.circle(circX, y, 32, 0xffffff, 0)
          .setInteractive({ useHandCursor: true })
      );

      clickZone.on('pointerover', () => {
        visualContainer.setScale(1.1);
        soundManager.playSFX(this.scene, 'hover');
      });
      clickZone.on('pointerout', () => {
        visualContainer.setScale(1);
      });
      clickZone.on('pointerup', () => {
        soundManager.playSFX(this.scene, 'click');
        setSelectedHero(this.scene, hero.id);
        this.show();
      });
    });
  }

  addHeroShowcase(cx, cy, hero, activeSkin, level) {
    // 1. Pedestal platform below avatar
    const pedestal = this.add(
      this.scene.add.ellipse(cx, cy + 150, 240, 56, 0x00d6ff, 0.15)
        .setStrokeStyle(3, 0x4aa6f7, 0.8)
    );
    const pedestalInner = this.add(
      this.scene.add.ellipse(cx, cy + 150, 190, 42, 0x0c1e3d, 0.9)
    );

    // 2. Large Avatar Image
    const visualKey = activeSkin?.assetKey || hero.assetKey;
    const avatar = this.add(
      this.scene.add.image(cx, cy, visualKey).setDisplaySize(220, 220)
    );

    // Pulse effect on hero avatar
    this.scene.tweens.add({
      targets: avatar,
      y: cy - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3. Draw Tier-based revolving frames
    this.drawRevolvingFrame(cx, cy, level);

    // 4. Hero Class Upgrade Button directly below
    this.addUpgradeButton(cx, cy + 195, hero.id, level);
  }

  drawRevolvingFrame(cx, cy, level) {
    this.heroFrameBackContainer = this.scene.add.container(cx, cy);
    this.heroFrameBackContainer.setDepth(2000);
    this.heroFrameFrontContainer = this.scene.add.container(cx, cy);
    this.heroFrameFrontContainer.setDepth(2000);

    if (level < 5) {
      // Tier 1 Frame: Simple glowing cyan rings
      const backGlow = this.scene.add.graphics();
      backGlow.lineStyle(10, 0x06b6d4, 0.12);
      backGlow.strokeCircle(0, 0, 128);
      this.heroFrameBackContainer.add(backGlow);

      const frontRing = this.scene.add.graphics();
      frontRing.lineStyle(3, 0x06b6d4, 0.85);
      frontRing.strokeCircle(0, 0, 124);
      frontRing.lineStyle(1.5, 0x0891b2, 0.4);
      frontRing.strokeCircle(0, 0, 132);
      this.heroFrameFrontContainer.add(frontRing);

      this.scene.tweens.add({
        targets: [this.heroFrameBackContainer, this.heroFrameFrontContainer],
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else if (level < 10) {
      // Tier 2 Frame: Rotating Golden Hexagon
      const backHex = this.scene.add.graphics();
      backHex.lineStyle(3, 0xeab308, 0.85);
      const sides = 6;
      const radius = 136;
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

      backHex.fillStyle(0xfef08a, 1);
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        backHex.fillCircle(radius * Math.cos(angle), radius * Math.sin(angle), 5);
      }
      this.heroFrameBackContainer.add(backHex);

      const frontRing = this.scene.add.graphics();
      frontRing.lineStyle(3.5, 0x06b6d4, 0.9);
      frontRing.strokeCircle(0, 0, 124);
      this.heroFrameFrontContainer.add(frontRing);

      this.scene.tweens.add({
        targets: backHex,
        angle: 360,
        duration: 10000,
        repeat: -1
      });

      this.scene.tweens.add({
        targets: frontRing,
        scaleX: 1.015,
        scaleY: 1.015,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      // Tier 3/4 Frame: Rotating Tech Crimson/Gold Gears with Orbiting Particles
      const glow1 = this.scene.add.graphics();
      glow1.lineStyle(14, 0xec4899, 0.15);
      glow1.strokeCircle(0, 0, 142);
      this.heroFrameBackContainer.add(glow1);

      const goldGear = this.scene.add.graphics();
      goldGear.lineStyle(3, 0xfacc15, 0.9);
      const teeth = 12;
      const rIn = 138;
      const rOut = 146;
      goldGear.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const angle = (i * Math.PI) / teeth;
        const r = i % 2 === 0 ? rIn : rOut;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        if (i === 0) goldGear.moveTo(x, y);
        else goldGear.lineTo(x, y);
      }
      goldGear.closePath();
      goldGear.strokePath();
      this.heroFrameBackContainer.add(goldGear);

      const frontRing = this.scene.add.graphics();
      frontRing.lineStyle(4, 0xec4899, 0.95);
      frontRing.strokeCircle(0, 0, 124);
      
      frontRing.lineStyle(3, 0xffffff, 0.9);
      for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI) / 8;
        frontRing.lineBetween(124 * Math.cos(angle), 124 * Math.sin(angle), 130 * Math.cos(angle), 130 * Math.sin(angle));
      }
      this.heroFrameFrontContainer.add(frontRing);

      this.scene.tweens.add({
        targets: goldGear,
        angle: 360,
        duration: 12000,
        repeat: -1
      });

      this.scene.tweens.add({
        targets: [glow1, frontRing],
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Orbiting Spark particle
      const flare = this.scene.add.circle(0, 0, 6, 0xf59e0b, 1);
      flare.setStrokeStyle(2, 0xffffff, 0.95);
      this.heroFrameFrontContainer.add(flare);

      this.scene.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 6000,
        repeat: -1,
        onUpdate: (tween) => {
          const val = tween.getValue();
          const rad = Phaser.Math.DegToRad(val);
          flare.x = 146 * Math.cos(rad);
          flare.y = 146 * Math.sin(rad);
        }
      });
    }
  }

  addUpgradeButton(cx, y, heroId, level) {
    const cost = level * 150;
    const gold = this.scene.playerProgress.gold;
    const canAfford = gold >= cost;

    this.upgradeContainer = this.scene.add.container(cx, y);
    this.upgradeContainer.setDepth(2000);

    // Frame Button
    const btnBg = this.scene.add.rectangle(0, 0, 170, 48, canAfford ? 0x1d4ed8 : 0x334155, 0.9)
      .setStrokeStyle(2.5, canAfford ? 0x60a5fa : 0x475569, 1);
    
    const label = this.scene.add.text(0, -10, 'UPGRADE LEVEL', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '11px',
      color: canAfford ? UI.white : '#94a3b8',
      fontStyle: '900',
      letterSpacing: 1,
    }).setOrigin(0.5);

    const goldIcon = this.scene.add.text(-35, 12, '🪙', { fontSize: '14px' }).setOrigin(0.5);
    const costText = this.scene.add.text(-20, 12, this.scene.formatCurrency(cost), {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '14px',
      color: canAfford ? UI.yellow : '#64748b',
      fontStyle: '900',
    }).setOrigin(0, 0.5);

    this.upgradeContainer.add([btnBg, label, goldIcon, costText]);

    if (canAfford) {
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerover', () => {
        btnBg.setScale(1.05);
        label.setScale(1.05);
        goldIcon.setScale(1.05);
        costText.setScale(1.05);
        soundManager.playSFX(this.scene, 'hover');
      });
      btnBg.on('pointerout', () => {
        btnBg.setScale(1);
        label.setScale(1);
        goldIcon.setScale(1);
        costText.setScale(1);
      });
      btnBg.on('pointerup', () => {
        this.handleHeroUpgrade(heroId, cost);
      });
    }
  }

  handleHeroUpgrade(heroId, cost) {
    const currentGold = this.scene.playerProgress.gold;
    if (currentGold < cost) {
      soundManager.playSFX(this.scene, 'hit');
      this.showUpgradeFeedback(false, 'Gold kurang!');
      return;
    }

    soundManager.playSFX(this.scene, 'upgrade');

    const nextGold = addPlayerGold(this.scene, -cost);
    this.scene.playerProgress.gold = nextGold;
    
    // Increment level
    const nextLevel = (this.scene.registry.get('heroLevels')?.[heroId] || 1) + 1;
    saveHeroLevel(heroId, nextLevel);
    
    const heroLevels = this.scene.registry.get('heroLevels') || {};
    heroLevels[heroId] = nextLevel;
    this.scene.registry.set('heroLevels', heroLevels);

    // Refresh data references
    this.scene.refreshHeroLoadout();
    this.scene.refreshBottomStats();
    
    // Refresh display
    this.show();
    
    this.showUpgradeFeedback(true, 'Level Up!');
  }

  showUpgradeFeedback(success, message) {
    const cx = this.scene.scale.width / 2;
    const cy = this.scene.scale.height / 2;

    const feedbackText = this.scene.add.text(cx, cy - 60, message, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '24px',
      color: success ? '#4ade80' : '#f87171',
      fontStyle: '900',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    feedbackText.setDepth(3000);

    this.scene.tweens.add({
      targets: feedbackText,
      y: cy - 120,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => feedbackText.destroy()
    });
  }

  addStatsPanel(x, y, hero, stats) {
    // 1. Hero Class Name Title ("nama")
    this.add(
      this.scene.add.text(x, y, hero.name.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '32px',
        color: UI.yellow,
        fontStyle: '900',
        stroke: '#081735',
        strokeThickness: 5,
      }).setOrigin(0.5, 0.5)
    );

    const level = this.scene.registry.get('heroLevels')?.[hero.id] || 1;
    this.add(
      this.scene.add.text(x, y + 36, `CLASS LEVEL ${level}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '14px',
        color: '#69e6ff',
        fontStyle: '900',
      }).setOrigin(0.5, 0.5)
    );

    // 2. Stats Panel Box ("status hero")
    const panelY = y + 250;
    this.add(
      this.scene.add.rectangle(x, panelY, 320, 370, 0x07111f, 0.9)
        .setStrokeStyle(2.5, 0x00d6ff, 0.7)
    );

    // 3. Render Status List (Spaced details)
    const list = [
      { name: 'HP (Health)', val: stats.hp, max: 400, color: 0xef4444 },
      { name: 'Attack Damage', val: stats.damage, max: 100, color: 0xeab308 },
      { name: 'Attack Speed', val: stats.attackSpeed, max: 3, color: 0x10b981 },
      { name: 'Movement Speed', val: stats.moveSpeed, max: 400, color: 0x3b82f6 },
      { name: 'Crit Chance', val: `${Math.round(stats.criticalChance * 100)}%`, fill: stats.criticalChance, max: 1, color: 0x8b5cf6 },
      { name: 'Armor (Def)', val: stats.armor || 0, max: 50, color: 0x64748b },
      { name: 'Evasion (Dodge)', val: `${Math.round((stats.evasion || 0) * 100)}%`, fill: stats.evasion, max: 1, color: 0x06b6d4 }
    ];

    list.forEach((item, index) => {
      const rowY = panelY - 150 + index * 48;

      // Stat Label
      this.add(
        this.scene.add.text(x - 140, rowY - 14, item.name, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: '#9af2ff',
          fontStyle: '800',
        }).setOrigin(0, 0.5)
      );

      // Stat Value
      this.add(
        this.scene.add.text(x + 140, rowY - 14, item.val, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: UI.white,
          fontStyle: '900',
        }).setOrigin(1, 0.5)
      );

      // Progress bar background
      const barBg = this.scene.add.graphics();
      barBg.fillStyle(0x0e274a, 1);
      barBg.fillRoundedRect(x - 140, rowY + 2, 280, 8, 4);
      this.add(barBg);

      // Progress bar fill
      const numericVal = typeof item.val === 'string' ? (item.fill || 0) : item.val;
      const pct = Math.min(1.0, numericVal / item.max);
      if (pct > 0) {
        const barFill = this.scene.add.graphics();
        barFill.fillStyle(item.color, 1);
        barFill.fillRoundedRect(x - 140, rowY + 2, 280 * pct, 8, 4);
        this.add(barFill);
      }
    });
  }
}
