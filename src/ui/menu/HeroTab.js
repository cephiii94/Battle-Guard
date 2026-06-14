import Phaser from 'phaser';
import { getPlayerProgress, addPlayerGold } from '../../systems/PlayerProgress.js';
import { saveHeroLevel, saveHeroLevelAndXP } from '../../services/saveService.js';
import { getAvailableHeroes, setSelectedHero, getSelectedHero, getSelectedHeroBaseStats } from '../../systems/HeroSelection.js';
import { calculateFinalStats, MAX_HERO_LEVEL } from '../../systems/HeroStats.js';
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
      const avatarImg = this.scene.add.image(0, 0, visualKey);
      visualContainer.add(avatarImg);

      const setAvatarSize = () => {
        if (avatarImg.texture && avatarImg.texture.key !== '__MISSING') {
          avatarImg.setDisplaySize(48, 48);
        }
      };

      if (avatarImg.texture && avatarImg.texture.key !== '__MISSING' && avatarImg.texture.frames['__BASE']) {
        setAvatarSize();
      } else {
        avatarImg.once('textureloaded', setAvatarSize);
      }

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
      this.scene.add.image(cx, cy, visualKey)
    );

    const setShowcaseSize = () => {
      if (avatar.texture && avatar.texture.key !== '__MISSING') {
        avatar.setDisplaySize(220, 220);
      }
    };

    if (avatar.texture && avatar.texture.key !== '__MISSING' && avatar.texture.frames['__BASE']) {
      setShowcaseSize();
    } else {
      avatar.once('textureloaded', setShowcaseSize);
    }

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

    // Apply scaling factor relative to MainMenuScene container sizes: 220 / 280
    const scaleFactor = 220 / 280;
    this.heroFrameBackContainer.setScale(scaleFactor);
    this.heroFrameFrontContainer.setScale(scaleFactor);

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
    const baseScale = 220 / 280;
    // Back glow
    const backGlow = this.scene.add.graphics();
    backGlow.lineStyle(10, 0x06b6d4, 0.15);
    backGlow.strokeCircle(0, 0, 145);
    this.heroFrameBackContainer.add(backGlow);

    // Front ring
    const frontRing = this.scene.add.graphics();
    frontRing.lineStyle(3, 0x06b6d4, 0.85);
    frontRing.strokeCircle(0, 0, 142);
    
    frontRing.lineStyle(1.5, 0x0891b2, 0.4);
    frontRing.strokeCircle(0, 0, 150);
    this.heroFrameFrontContainer.add(frontRing);

    // Animate breathing
    this.scene.tweens.add({
      targets: [this.heroFrameBackContainer, this.heroFrameFrontContainer],
      scaleX: baseScale * 1.02,
      scaleY: baseScale * 1.02,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  drawTier2Frame() {
    // Back Layer: Gold Hexagon
    const backHex = this.scene.add.graphics();
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
    const frontRing = this.scene.add.graphics();
    frontRing.lineStyle(3.5, 0x06b6d4, 0.9);
    frontRing.strokeCircle(0, 0, 142);
    this.heroFrameFrontContainer.add(frontRing);

    // Animate rotation on back hexagon
    this.scene.tweens.add({
      targets: backHex,
      angle: 360,
      duration: 10000,
      repeat: -1
    });

    // Animate breathing on front ring
    this.scene.tweens.add({
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
    const backGlow = this.scene.add.graphics();
    backGlow.lineStyle(12, 0xa78bfa, 0.2);
    backGlow.strokeCircle(0, 0, 168);
    this.heroFrameBackContainer.add(backGlow);

    const backOct = this.scene.add.graphics();
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
    const frontRing = this.scene.add.graphics();
    frontRing.lineStyle(4, 0xec4899, 0.95);
    frontRing.strokeCircle(0, 0, 142);
    this.heroFrameFrontContainer.add(frontRing);

    // Animate Octagon rotation
    this.scene.tweens.add({
      targets: backOct,
      angle: -360,
      duration: 12000,
      repeat: -1
    });

    // Animate breathing/glow
    this.scene.tweens.add({
      targets: [backGlow, frontRing],
      alpha: { from: 0.6, to: 1.0 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut'
    });

    // 3 Orbiting Green Particles
    for (let i = 0; i < 3; i++) {
      const dot = this.scene.add.circle(0, 0, 6, 0x34d399, 1);
      dot.setStrokeStyle(2, 0xffffff, 0.95);
      this.heroFrameFrontContainer.add(dot);
      
      const angleOffset = (i * 2 * Math.PI) / 3;
      const orbitRadius = 166;

      this.scene.tweens.addCounter({
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
    const glow1 = this.scene.add.graphics();
    glow1.lineStyle(16, 0xec4899, 0.15);
    glow1.strokeCircle(0, 0, 168);
    
    const glow2 = this.scene.add.graphics();
    glow2.lineStyle(24, 0xf59e0b, 0.08);
    glow2.strokeCircle(0, 0, 180);
    this.heroFrameBackContainer.add([glow2, glow1]);

    // 2. Outer gold gear
    const goldGear = this.scene.add.graphics();
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
    const crimsonGear = this.scene.add.graphics();
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
    const frontRing = this.scene.add.graphics();
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
    this.scene.tweens.add({
      targets: goldGear,
      angle: 360,
      duration: 14000,
      repeat: -1
    });

    this.scene.tweens.add({
      targets: crimsonGear,
      angle: -360,
      duration: 10000,
      repeat: -1
    });

    // Tweens for breathing
    this.scene.tweens.add({
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
      const flare = this.scene.add.circle(0, 0, 7, 0xf59e0b, 1);
      flare.setStrokeStyle(2.5, 0xffffff, 0.95);
      this.heroFrameFrontContainer.add(flare);
      
      const angleOffset = (i * 2 * Math.PI) / 4;
      const orbitRadius = 175;

      this.scene.tweens.addCounter({
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

  addUpgradeButton(cx, y, heroId, level) {
    const isMaxLevel = level >= MAX_HERO_LEVEL;
    const cost = Math.floor(100 * level * level);
    const gold = this.scene.playerProgress.gold;
    const currentXp = this.scene.registry.get('heroXP')?.[heroId] || 0;
    const requiredXp = level * 100;
    const hasEnoughXp = currentXp >= requiredXp;
    const canAfford = !isMaxLevel && gold >= cost && hasEnoughXp;

    this.upgradeContainer = this.scene.add.container(cx, y);
    this.upgradeContainer.setDepth(2000);

    if (isMaxLevel) {
      // MAX LEVEL badge
      const maxBg = this.scene.add.rectangle(0, 0, 180, 48, 0x78350f, 0.95)
        .setStrokeStyle(2.5, 0xfbbf24, 1);
      const maxLabel = this.scene.add.text(0, -8, '✦  MAX LEVEL', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '13px',
        color: '#fbbf24',
        fontStyle: '900',
        letterSpacing: 2,
      }).setOrigin(0.5);
      const maxSub = this.scene.add.text(0, 10, 'Hero telah mencapai level tertinggi', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '9px',
        color: '#fde68a',
        fontStyle: '700',
      }).setOrigin(0.5);
      this.upgradeContainer.add([maxBg, maxLabel, maxSub]);
      return;
    }

    // Normal upgrade button
    let btnColor = 0x334155;
    let strokeColor = 0x475569;
    if (canAfford) {
      btnColor = 0x1d4ed8;
      strokeColor = 0x60a5fa;
    } else if (!hasEnoughXp) {
      btnColor = 0x4c1d95; // deep purple
      strokeColor = 0x8b5cf6;
    }

    const btnBg = this.scene.add.rectangle(0, 0, 180, 48, btnColor, 0.9)
      .setStrokeStyle(2.5, strokeColor, 1);

    let labelString = `UPGRADE  Lv${level} → ${level + 1}`;
    if (!isMaxLevel && !hasEnoughXp) {
      labelString = `BUTUH XP  Lv${level} → ${level + 1}`;
    }

    const label = this.scene.add.text(0, -10, labelString, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '11px',
      color: canAfford ? UI.white : (hasEnoughXp ? '#94a3b8' : '#e9d5ff'),
      fontStyle: '900',
      letterSpacing: 1,
    }).setOrigin(0.5);

    const goldIcon = this.scene.add.text(-42, 12, '🪙', { fontSize: '14px' }).setOrigin(0.5);
    const costText = this.scene.add.text(-26, 12, this.scene.formatCurrency(cost), {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '14px',
      color: canAfford ? UI.yellow : '#64748b',
      fontStyle: '900',
    }).setOrigin(0, 0.5);

    // Progress indicator: level / MAX
    const progressText = this.scene.add.text(54, 12, `${level} / ${MAX_HERO_LEVEL}`, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '10px',
      color: '#94a3b8',
      fontStyle: '700',
    }).setOrigin(0.5);

    this.upgradeContainer.add([btnBg, label, goldIcon, costText, progressText]);

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

  handleHeroUpgrade(heroId, cost) {
    // Guard: cannot exceed MAX level
    const currentLevel = this.scene.registry.get('heroLevels')?.[heroId] || 1;
    if (currentLevel >= MAX_HERO_LEVEL) {
      this.showUpgradeFeedback(false, 'Sudah MAX level!');
      return;
    }

    const currentXp = this.scene.registry.get('heroXP')?.[heroId] || 0;
    const requiredXp = currentLevel * 100;
    if (currentXp < requiredXp) {
      soundManager.playSFX(this.scene, 'hit');
      this.showUpgradeFeedback(false, 'XP Hero belum cukup!');
      return;
    }

    const currentGold = this.scene.playerProgress.gold;
    if (currentGold < cost) {
      soundManager.playSFX(this.scene, 'hit');
      this.showUpgradeFeedback(false, 'Gold kurang!');
      return;
    }

    soundManager.playSFX(this.scene, 'upgrade');

    const nextGold = addPlayerGold(this.scene, -cost);
    this.scene.playerProgress.gold = nextGold;

    const nextLevel = currentLevel + 1;
    const nextXp = currentXp - requiredXp;
    saveHeroLevelAndXP(heroId, nextLevel, nextXp);

    const heroLevels = this.scene.registry.get('heroLevels') || {};
    heroLevels[heroId] = nextLevel;
    this.scene.registry.set('heroLevels', heroLevels);

    const heroXP = this.scene.registry.get('heroXP') || {};
    heroXP[heroId] = nextXp;
    this.scene.registry.set('heroXP', heroXP);

    // Refresh data references
    this.scene.refreshHeroLoadout();
    this.scene.refreshBottomStats();

    // Refresh display
    this.show();

    this.showUpgradeFeedback(true, `Level Up! Lv ${nextLevel}`);
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
    // 1. Hero Name Title
    this.add(
      this.scene.add.text(x, y, hero.name.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '30px',
        color: UI.yellow,
        fontStyle: '900',
        stroke: '#081735',
        strokeThickness: 5,
      }).setOrigin(0.5, 0.5)
    );

    const level = this.scene.registry.get('heroLevels')?.[hero.id] || 1;
    this.add(
      this.scene.add.text(x, y + 32, `CLASS LEVEL ${level}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '13px',
        color: '#69e6ff',
        fontStyle: '900',
      }).setOrigin(0.5, 0.5)
    );

    // Hero XP progress bar
    const currentXp = this.scene.registry.get('heroXP')?.[hero.id] || 0;
    const requiredXp = level * 100;
    const xpRatio = Math.min(1.0, currentXp / requiredXp);

    const barW = 200;
    const barH = 14;
    const barX = x - barW / 2;
    const barY = y + 54;

    const xpBg = this.scene.add.rectangle(x, barY, barW, barH, 0x0c1e3d, 0.95)
      .setStrokeStyle(1.5, 0x00d6ff, 0.7);
    this.add(xpBg);

    if (xpRatio > 0) {
      const isReady = currentXp >= requiredXp;
      const fillColor = isReady ? 0x22c55e : 0xa855f7; // Green if ready, Purple if charging
      const xpFill = this.scene.add.rectangle(barX + 1, barY, (barW - 2) * xpRatio, barH - 2, fillColor, 1)
        .setOrigin(0, 0.5);
      this.add(xpFill);
    }

    const xpTextVal = level >= MAX_HERO_LEVEL ? 'MAX' : `${currentXp}/${requiredXp} XP`;
    const xpText = this.scene.add.text(x, barY, xpTextVal, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: '800',
    }).setOrigin(0.5, 0.5);
    this.add(xpText);

    // 2. Panel box
    const panelW = 320;
    const panelH = 435;
    const panelY = y + 290;

    // Outer glow halo
    const glow = this.scene.add.graphics();
    glow.fillStyle(0x00d6ff, 0.04);
    glow.fillRoundedRect(x - panelW / 2 - 5, panelY - panelH / 2 - 5, panelW + 10, panelH + 10, 12);
    this.add(glow);

    // Panel background
    this.add(
      this.scene.add.rectangle(x, panelY, panelW, panelH, 0x07111f, 0.93)
        .setStrokeStyle(2, 0x00d6ff, 0.6)
    );

    // Panel header bar
    this.add(
      this.scene.add.rectangle(x, panelY - panelH / 2 + 20, panelW, 38, 0x0c2040, 1)
    );
    this.add(
      this.scene.add.text(x, panelY - panelH / 2 + 20, '⚡  CHARACTER ATTRIBUTES', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '11px',
        color: '#67e8f9',
        fontStyle: '900',
        letterSpacing: 2,
      }).setOrigin(0.5)
    );

    // Separator line beneath header
    const sep = this.scene.add.graphics();
    sep.lineStyle(1, 0x00d6ff, 0.35);
    sep.lineBetween(
      x - panelW / 2 + 8, panelY - panelH / 2 + 40,
      x + panelW / 2 - 8, panelY - panelH / 2 + 40
    );
    this.add(sep);

    // 3. Full 11-stat list
    const list = [
      { name: 'HP (Health)',    val: stats.hp,                                               fill: stats.hp / 500,                    color: 0xef4444 },
      { name: 'Attack DMG',    val: stats.damage,                                           fill: stats.damage / 150,                color: 0xeab308 },
      { name: 'Attack Range',  val: stats.attackRange,                                      fill: stats.attackRange / 400,           color: 0xf97316 },
      { name: 'Attack Speed',  val: stats.attackSpeed,                                      fill: stats.attackSpeed / 3,             color: 0x10b981 },
      { name: 'Move Speed',    val: stats.moveSpeed,                                        fill: stats.moveSpeed / 400,             color: 0x3b82f6 },
      { name: 'Crit Chance',   val: `${Math.round(stats.criticalChance * 100)}%`,          fill: stats.criticalChance,              color: 0x8b5cf6 },
      { name: 'Armor (DEF)',   val: stats.armor,                                            fill: stats.armor / 50,                  color: 0x64748b },
      { name: 'HP Regen',      val: `${stats.healthRegen}/s`,                              fill: stats.healthRegen / 10,            color: 0x22d3ee },
      { name: 'Lifesteal',     val: `${Math.round(stats.lifesteal * 100)}%`,               fill: stats.lifesteal,                   color: 0xf43f5e },
      { name: 'Evasion',       val: `${Math.round(stats.evasion * 100)}%`,                 fill: stats.evasion,                     color: 0x06b6d4 },
      { name: 'Cooldown Reduce', val: `${Math.round(stats.cooldownReduction * 100)}%`,     fill: stats.cooldownReduction,           color: 0xf59e0b },
    ];

    const listStartY = panelY - panelH / 2 + 56;
    const rowH = 34;

    list.forEach((item, index) => {
      const rowTop = listStartY + index * rowH;
      const rowCenterY = rowTop + rowH / 2;

      // Alternating row highlight
      if (index % 2 === 0) {
        const rowBg = this.scene.add.graphics();
        rowBg.fillStyle(0x0c2040, 0.5);
        rowBg.fillRect(x - panelW / 2 + 6, rowTop, panelW - 12, rowH - 1);
        this.add(rowBg);
      }

      // Colored indicator dot
      const dot = this.scene.add.graphics();
      dot.fillStyle(item.color, 1);
      dot.fillCircle(x - panelW / 2 + 14, rowCenterY - 6, 3.5);
      this.add(dot);

      // Stat label
      this.add(
        this.scene.add.text(x - panelW / 2 + 24, rowCenterY - 6, item.name, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '11px',
          color: '#a5f3ff',
          fontStyle: '700',
        }).setOrigin(0, 0.5)
      );

      // Stat value (right-aligned)
      this.add(
        this.scene.add.text(x + panelW / 2 - 8, rowCenterY - 6, String(item.val), {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: '900',
        }).setOrigin(1, 0.5)
      );

      // Progress bar
      const barX = x - panelW / 2 + 14;
      const barY = rowCenterY + 7;
      const barW = panelW - 26;

      const barBg = this.scene.add.graphics();
      barBg.fillStyle(0x0e274a, 1);
      barBg.fillRoundedRect(barX, barY, barW, 4, 2);
      this.add(barBg);

      const pct = Math.min(1.0, Math.max(0, item.fill || 0));
      if (pct > 0) {
        const barFill = this.scene.add.graphics();
        barFill.fillStyle(item.color, 0.85);
        barFill.fillRoundedRect(barX, barY, barW * pct, 4, 2);
        this.add(barFill);
      }
    });
  }
}

