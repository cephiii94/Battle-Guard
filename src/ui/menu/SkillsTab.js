import skills, { getSkillLevelStats } from '../../data/skills.js';
import { getPlayerProgress, addPlayerGold, getSkillLevelsForPlayerLevel } from '../../systems/PlayerProgress.js';
import { savePlayerProgress } from '../../services/saveService.js';
import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';

export class SkillsTab {
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
    this.scene.playerProgress = getPlayerProgress(this.scene);

    const { width, height } = this.scene.scale;

    // Background Gradient matching Menu Scene
    const bg = this.scene.add.graphics();
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
    this.add(bg);

    // Header Title
    this.add(
      this.scene.add.text(185, 38, '⚡ PLAYER SKILLS ROAD', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '28px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#07111f',
        strokeThickness: 4,
      }).setOrigin(0, 0.5)
    );

    this.add(
      this.scene.add.text(185, 68, 'Upgrade level global menggunakan gold untuk membuka dan meningkatkan skill pasif/aktif.', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '13px',
        color: '#9af2ff',
        fontStyle: '800',
        stroke: '#07111f',
        strokeThickness: 2,
      }).setOrigin(0, 0.5)
    );

    // Close button top-left
    const closeBtn = this.add(
      this.scene.add.rectangle(110, 52, 42, 42, 0xd97706, 1)
        .setStrokeStyle(2, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );
    const closeText = this.add(
      this.scene.add.text(110, 52, '◀', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5)
    );

    closeBtn.on('pointerover', () => {
      closeBtn.setScale(1.1);
      closeText.setScale(1.1);
      soundManager.playSFX(this.scene, 'hover');
    });
    closeBtn.on('pointerout', () => {
      closeBtn.setScale(1);
      closeText.setScale(1);
    });
    closeBtn.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      this.clear();
    });

    // Draw Vertical Progression Path
    const pathX = 420;
    const unlockedSkillLvl = this.scene.playerProgress.unlockedSkillLevel || 1;

    let startL = Math.max(1, unlockedSkillLvl - 1);
    if (startL + 4 > 55) {
      startL = 51;
    }

    // Path Line
    const pathGraphic = this.scene.add.graphics();
    pathGraphic.lineStyle(10, 0x1e293b, 1);
    pathGraphic.lineBetween(pathX, 120, pathX, 550);
    
    // Highlight active unlocked path
    const activeSegments = Math.min(4, unlockedSkillLvl - startL);
    if (activeSegments > 0) {
      pathGraphic.lineStyle(10, 0xfacc15, 0.95);
      pathGraphic.lineBetween(pathX, 520, 520 - (activeSegments * 90));
    }
    this.add(pathGraphic);

    // Render nodes
    for (let i = 0; i < 5; i++) {
      const levelNum = startL + i;
      const y = 520 - (i * 90);
      this.drawVerticalNode(pathX, y, levelNum);
    }

    // Draw Right Side Cumulative Panel
    this.drawCumulativePanel();

    // Draw Bottom Control Upgrade Panel
    this.drawUpgradePanel();
  }

  drawVerticalNode(x, y, levelNum) {
    const playerLvl = this.scene.playerProgress.playerLevel || 1;
    const unlockedSkillLvl = this.scene.playerProgress.unlockedSkillLevel || 1;
    
    const isUnlocked = levelNum <= unlockedSkillLvl;
    const isNextTarget = levelNum === unlockedSkillLvl + 1;
    const canUnlockWithGold = isNextTarget && levelNum <= playerLvl;
    const isLockedByLevel = levelNum > playerLvl;

    const skillIndex = (levelNum - 1) % 11;
    const skill = skills[skillIndex];
    const targetLvl = Math.floor((levelNum - 1) / 11) + 1;

    // Node Frame/Circle
    let circleColor = 0x1e293b;
    let strokeColor = 0x475569;
    
    if (isUnlocked) {
      circleColor = 0x0c86bd;
      strokeColor = 0xffdc5a;
    } else if (canUnlockWithGold) {
      circleColor = 0x1e3a5f;
      strokeColor = 0x38bdf8;
    }

    const circle = this.add(
      this.scene.add.circle(x, y, 28, circleColor, 0.95)
        .setStrokeStyle(3, strokeColor, 1)
    );

    // Skill Icon
    const isIconVisible = isUnlocked || canUnlockWithGold;
    const icon = this.add(
      this.scene.add.image(x, y, skill.assetKey)
        .setDisplaySize(42, 42)
        .setAlpha(isIconVisible ? 1.0 : 0.25)
    );

    // Left side Level Indicator (large text)
    const levelLabelText = this.add(
      this.scene.add.text(x - 90, y, `${levelNum} Lv`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '20px',
        color: isUnlocked ? UI.yellow : (canUnlockWithGold ? UI.cyan : '#64748b'),
        fontStyle: '900',
        align: 'right'
      }).setOrigin(1, 0.5)
    );

    // Right side Buff details
    const buffTitle = skill.name;
    let buffDetail = '';
    
    if (skill.type === 'passive') {
      switch (skill.id) {
        case 'magnet':
          buffDetail = `+${targetLvl * 20}px Loot Magnet`;
          break;
        case 'movespeed':
          buffDetail = `+${targetLvl * 4}% Hero Speed`;
          break;
        case 'aspd':
          buffDetail = `+${targetLvl * 5}% Attack Speed`;
          break;
        case 'hp-regen':
          buffDetail = `+${(targetLvl * 0.5).toFixed(1)} HP/s Regen`;
          break;
        case 'shield':
          buffDetail = `+${targetLvl * 10} Shield Capacity`;
          break;
        case 'attack-range':
          buffDetail = `+${targetLvl * 5}% Attack Range`;
          break;
        case 'knock':
          buffDetail = `+${targetLvl * 10}% Knockback`;
          break;
      }
    } else {
      buffDetail = `+${targetLvl * 8}% Dmg / -${targetLvl * 5}% CD`;
    }

    const titleText = this.add(
      this.scene.add.text(x + 52, y - 10, buffTitle, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '14px',
        color: isUnlocked ? UI.white : (canUnlockWithGold ? UI.cyan : '#94a3b8'),
        fontStyle: '900'
      }).setOrigin(0, 0.5)
    );

    const descText = this.add(
      this.scene.add.text(x + 52, y + 10, buffDetail, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: isUnlocked ? UI.cyan : (canUnlockWithGold ? UI.blueText : '#64748b'),
        fontStyle: '800'
      }).setOrigin(0, 0.5)
    );

    // Unlocked checkmark
    if (isUnlocked) {
      this.add(
        this.scene.add.circle(x + 22, y - 22, 11, 0x22c55e, 1)
          .setStrokeStyle(1.5, 0xffffff, 1)
      );
      this.add(
        this.scene.add.text(x + 22, y - 22, '✓', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5)
      );
    } else if (canUnlockWithGold) {
      // Show cost/arrow to unlock
      this.add(
        this.scene.add.circle(x + 22, y - 22, 11, 0xfacc15, 1)
          .setStrokeStyle(1.5, 0xffffff, 1)
      );
      this.add(
        this.scene.add.text(x + 22, y - 22, '⭐', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '9px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5)
      );
    } else {
      // Locked lock icon
      this.add(
        this.scene.add.image(x, y, 'ui-lock-icon')
          .setDisplaySize(20, 20)
          .setAlpha(0.8)
      );
    }
  }

  drawCumulativePanel() {
    const rx = 1000;
    const ry = 340;
    const rw = 380;
    const rh = 450;

    // Panel Background
    this.add(
      this.scene.add.rectangle(rx, ry, rw, rh, 0x07111f, 0.95)
        .setStrokeStyle(3, 0x4aa6f7, 0.8)
    );

    this.add(
      this.scene.add.text(rx, ry - 200, 'TOTAL PASSIVE EFFECT', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '18px',
        color: UI.yellow,
        fontStyle: '900',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5)
    );

    const skillLevels = this.scene.registry.get('playerData')?.skillLevels || {};

    skills.forEach((skill, index) => {
      const currentLvl = skillLevels[skill.id] || 0;
      const rowY = ry - 150 + (index * 35);

      // Icon
      this.add(
        this.scene.add.image(rx - 160, rowY, skill.assetKey)
          .setDisplaySize(24, 24)
          .setAlpha(currentLvl > 0 ? 1 : 0.3)
      );

      // Name
      this.add(
        this.scene.add.text(rx - 134, rowY, skill.name, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: currentLvl > 0 ? UI.white : '#475569',
          fontStyle: '800'
        }).setOrigin(0, 0.5)
      );

      // Level
      this.add(
        this.scene.add.text(rx + 20, rowY, `Lv. ${currentLvl}/5`, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '11px',
          color: currentLvl > 0 ? UI.cyan : '#475569',
          fontStyle: '800'
        }).setOrigin(0, 0.5)
      );

      // Accum Effect Value
      let effectText = 'LOCKED';
      let effectColor = '#f87171';
      if (currentLvl > 0) {
        effectColor = '#4ade80';
        if (skill.type === 'passive') {
          switch (skill.id) {
            case 'magnet':
              effectText = `+${currentLvl * 20}px Radius`;
              break;
            case 'movespeed':
              effectText = `+${currentLvl * 4}% Speed`;
              break;
            case 'aspd':
              effectText = `+${currentLvl * 5}% Atk Speed`;
              break;
            case 'hp-regen':
              effectText = `+${(currentLvl * 0.5).toFixed(1)} HP/s`;
              break;
            case 'shield':
              effectText = `+${currentLvl * 10} Shield`;
              break;
            case 'attack-range':
              effectText = `+${currentLvl * 5}% Range`;
              break;
            case 'knock':
              effectText = `+${currentLvl * 10}% Knockback`;
              break;
          }
        } else {
          effectText = `+${currentLvl * 8}% Dmg, -${currentLvl * 5}% CD`;
        }
      }

      this.add(
        this.scene.add.text(rx + 160, rowY, effectText, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '11px',
          color: effectColor,
          fontStyle: '900',
          align: 'right'
        }).setOrigin(1, 0.5)
      );
    });
  }

  drawUpgradePanel() {
    const cx = 420;
    const cy = 635;
    const pw = 600;
    const ph = 96;

    // Curved Panel Base Card
    const panelBg = this.add(
      this.scene.add.rectangle(cx, cy, pw, ph, 0xdbeefb, 1)
        .setStrokeStyle(3, 0xffffff, 1)
    );

    const playerLvl = this.scene.playerProgress.playerLevel || 1;
    const unlockedSkillLvl = this.scene.playerProgress.unlockedSkillLevel || 1;
    const targetLvl = unlockedSkillLvl + 1;
    const maxed = unlockedSkillLvl >= 55;

    if (maxed) {
      this.add(
        this.scene.add.text(cx, cy, 'MAX SKILL ROAD LEVEL REACHED', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '20px',
          color: '#1e293b',
          fontStyle: '900'
        }).setOrigin(0.5)
      );
      return;
    }

    const isLockedByLevel = targetLvl > playerLvl;

    // Next Level Header
    this.add(
      this.scene.add.text(cx - 260, cy - 14, `${targetLvl} LEVEL`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '24px',
        color: '#1e293b',
        fontStyle: '900',
        stroke: '#ffffff',
        strokeThickness: 2
      }).setOrigin(0, 0.5)
    );

    // Cost calculation
    const costGold = targetLvl * 2000;
    const canAfford = this.scene.playerProgress.gold >= costGold;

    // Resource ratio text
    const costText = this.add(
      this.scene.add.text(cx - 260, cy + 18, `🪙 ${this.scene.formatCurrency(this.scene.playerProgress.gold)} / ${this.scene.formatCurrency(costGold)}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '15px',
        color: canAfford && !isLockedByLevel ? '#16a34a' : '#dc2626',
        fontStyle: '900'
      }).setOrigin(0, 0.5)
    );

    // Pill-shaped UPGRADE button
    const btnX = cx + 180;
    
    // Determine button state and visual colors
    let btnColor = 0x22c55e;
    let btnLabel = 'UPGRADE';
    let isClickable = canAfford && !isLockedByLevel;

    if (isLockedByLevel) {
      btnColor = 0x94a3b8;
      btnLabel = `REQ: PLAYER LV. ${targetLvl}`;
    } else if (!canAfford) {
      btnColor = 0x94a3b8;
      btnLabel = 'NO GOLD';
    }

    const upgradeBtn = this.add(
      this.scene.add.rectangle(btnX, cy, 180, 52, btnColor, 1)
        .setStrokeStyle(2, 0xffffff, 1)
    );

    const upgradeText = this.add(
      this.scene.add.text(btnX, cy, btnLabel, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: isLockedByLevel ? '12px' : '18px',
        color: '#ffffff',
        fontStyle: '900'
      }).setOrigin(0.5)
    );

    if (isClickable) {
      upgradeBtn.setInteractive({ useHandCursor: true });
      upgradeBtn.on('pointerover', () => {
        upgradeBtn.setScale(1.05);
        upgradeText.setScale(1.05);
        soundManager.playSFX(this.scene, 'hover');
      });
      upgradeBtn.on('pointerout', () => {
        upgradeBtn.setScale(1);
        upgradeText.setScale(1);
      });
      upgradeBtn.on('pointerup', () => {
        this.upgradePlayerLevel(costGold, unlockedSkillLvl);
      });
    }
  }

  upgradePlayerLevel(cost, currentLvl) {
    if (this.scene.playerProgress.gold < cost) {
      soundManager.playSFX(this.scene, 'hit');
      this.scene.showUpgradeFeedback(false, 'Not enough gold!');
      return;
    }

    soundManager.playSFX(this.scene, 'upgrade');

    // Deduct gold
    const nextGold = addPlayerGold(this.scene, -cost);
    this.scene.playerProgress.gold = nextGold;

    // Increment road level & recalculate skill levels
    const nextLvl = currentLvl + 1;
    const nextSkillLevels = getSkillLevelsForPlayerLevel(nextLvl);
    savePlayerProgress(nextLvl, nextSkillLevels);

    // Sync state
    this.scene.playerProgress.unlockedSkillLevel = nextLvl;
    this.scene.playerProgress.skillLevels = nextSkillLevels;
    
    const playerData = this.scene.registry.get('playerData') || {};
    playerData.unlockedSkillLevel = nextLvl;
    playerData.skillLevels = nextSkillLevels;
    this.scene.registry.set('playerData', playerData);

    // Update gold display on top bar
    if (this.scene.goldText) {
      this.scene.goldText.setText(this.scene.formatCurrency(nextGold));
    }

    this.scene.showUpgradeFeedback(true, `Unlocked Road Level ${nextLvl}!`);

    // Redraw screen
    this.show();
  }
}
