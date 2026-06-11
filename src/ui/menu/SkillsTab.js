import skills, { getSkillLevelStats } from '../../data/skills.js';
import { getPlayerProgress, addPlayerGold } from '../../systems/PlayerProgress.js';
import { saveSkillLevel } from '../../services/saveService.js';
import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';

export class SkillsTab {
  constructor(scene) {
    this.scene = scene;
    this.layer = [];
    this.selectedSkill = null;
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
    this.selectedSkill = null;
  }

  isActive() {
    return this.layer.length > 0;
  }

  show() {
    this.scene.clearAllTabs();
    this.scene.refreshHeroLoadout();
    this.scene.playerProgress = getPlayerProgress(this.scene);

    if (!this.selectedSkill) {
      this.selectedSkill = skills[0];
    }

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
      this.scene.add.text(185, 38, '⚡ PLAYER SKILLS TREE', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '28px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#07111f',
        strokeThickness: 4,
      }).setOrigin(0, 0.5)
    );

    this.add(
      this.scene.add.text(185, 68, 'Buka dan upgrade skill aktif menggunakan gold berdasarkan level player.', {
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
    const skillLevels = this.scene.registry.get('playerData')?.skillLevels || {};
    const currentLvl = skillLevels[skill.id] || 0;

    // Prerequisite checks
    const isLevelMet = (this.scene.playerProgress.playerLevel || 1) >= skill.requiredPlayerLevel;
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

    const card = this.add(
      this.scene.add.rectangle(x, y, 220, 110, bgCol, 0.95)
        .setStrokeStyle(3, strokeCol, strokeAlpha)
        .setInteractive({ useHandCursor: true })
    );

    // Icon circle
    this.add(this.scene.add.circle(x - 56, y, 30, 0x0c1e3d, 1))
      .setStrokeStyle(2.5, isUnlocked ? 0x00d6ff : 0x64748b, 1);

    this.add(
      this.scene.add.image(x - 56, y, skill.assetKey)
        .setDisplaySize(50, 50)
        .setAlpha(isUnlocked ? 1.0 : 0.35)
    );

    // Skill Name text
    this.add(
      this.scene.add.text(x - 12, y - 34, skill.name, {
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

    this.add(
      this.scene.add.text(x - 12, y - 10, statusText, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: statusColor,
        fontStyle: '800',
      }).setOrigin(0, 0.5)
    );

    // Requirements label (small font)
    this.add(
      this.scene.add.text(x - 12, y + 14, `Req: Player Lv. ${skill.requiredPlayerLevel}`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '10px',
        color: isLevelMet ? '#4ade80' : '#f87171',
        fontStyle: '800'
      }).setOrigin(0, 0.5)
    );

    // Add lock icon if not unlocked
    if (!isUnlocked) {
      this.add(
        this.scene.add.image(x - 56, y, 'ui-lock-icon')
          .setDisplaySize(24, 24)
          .setAlpha(0.85)
      );
    }

    // Event handlers
    card.on('pointerover', () => {
      card.setScale(1.03);
      soundManager.playSFX(this.scene, 'hover');
    });
    card.on('pointerout', () => {
      card.setScale(1);
    });
    card.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      this.selectedSkill = skill;
      this.show(); // Redraw panel and highlights
    });
  }

  drawSkillDetailsPanel() {
    const rx = 960;
    const ry = 380;
    const rw = 380;
    const rh = 460;

    // Panel card background
    this.add(
      this.scene.add.rectangle(rx, ry, rw, rh, 0x07111f, 0.95)
        .setStrokeStyle(3, 0x4aa6f7, 0.8)
    );

    if (!this.selectedSkill) {
      this.add(
        this.scene.add.text(rx, ry, 'Select a skill to inspect and upgrade', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '14px',
          color: '#94a3b8',
          fontStyle: 'bold'
        }).setOrigin(0.5)
      );
      return;
    }

    const skill = this.selectedSkill;
    const skillLevels = this.scene.registry.get('playerData')?.skillLevels || {};
    const currentLvl = skillLevels[skill.id] || 0;

    // Prerequisite checks
    const isUnlocked = (this.scene.playerProgress.playerLevel || 1) >= skill.requiredPlayerLevel;

    // Skill Name
    this.add(
      this.scene.add.text(rx, ry - 190, skill.name.toUpperCase(), {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '24px',
        color: UI.yellow,
        fontStyle: '900',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5)
    );

    // Description text
    this.add(
      this.scene.add.text(rx, ry - 152, skill.description, {
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
    this.add(
      this.scene.add.text(rx, ry - 110, currentBuffText, {
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
    this.add(
      this.scene.add.text(rx - 150, reqY, 'REQUISITES:', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: UI.cyan,
        fontStyle: '900'
      }).setOrigin(0, 0.5)
    );

    const checkPlayerLvl = isUnlocked ? '✅' : '❌';
    this.add(
      this.scene.add.text(rx - 150, reqY + 24, `${checkPlayerLvl} Player Level ${skill.requiredPlayerLevel} (You: Lv. ${this.scene.playerProgress.playerLevel || 1})`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '12px',
        color: isUnlocked ? '#4ade80' : '#f87171',
        fontStyle: '800'
      }).setOrigin(0, 0.5)
    );

    // Stats Section
    const statsY = ry + 25;
    this.add(
      this.scene.add.text(rx - 150, statsY, 'BASE STAT COMPARISON:', {
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
      this.add(
        this.scene.add.text(rx - 150, rowY, st.label, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: '#94a3b8',
          fontStyle: '800'
        }).setOrigin(0, 0.5)
      );

      const val1 = currentLvl === 0 ? 'LOCKED' : st.format(currentStats[st.key]);
      const val2 = maxed ? 'MAX' : st.format(nextStats[st.key]);

      this.add(
        this.scene.add.text(rx + 150, rowY, `${val1}  ➔  ${val2}`, {
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
      this.add(
        this.scene.add.rectangle(rx, btnY, rw - 60, 44, 0x1e293b, 1)
          .setStrokeStyle(2, 0x475569, 1)
      );
      this.add(
        this.scene.add.text(rx, btnY, 'MAX LEVEL REACHED', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '14px',
          color: '#94a3b8',
          fontStyle: '900'
        }).setOrigin(0.5)
      );
    } else if (!isUnlocked) {
      this.add(
        this.scene.add.rectangle(rx, btnY, rw - 60, 44, 0x1e293b, 1)
          .setStrokeStyle(2, 0x475569, 1)
      );
      this.add(
        this.scene.add.text(rx, btnY, 'SKILL BLOCKED', {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '14px',
          color: '#f87171',
          fontStyle: '900'
        }).setOrigin(0.5)
      );
    } else {
      const upgradeCost = (currentLvl + 1) * 1500;
      const canAfford = this.scene.playerProgress.gold >= upgradeCost;

      const upgradeBtn = this.add(
        this.scene.add.rectangle(rx, btnY, rw - 60, 44, canAfford ? 0x15803d : 0x1e293b, 1)
          .setStrokeStyle(2.5, canAfford ? 0x22c55e : 0x475569, 1)
          .setInteractive({ useHandCursor: true })
      );

      const btnTitle = currentLvl === 0 ? 'UNLOCK SKILL' : 'UPGRADE SKILL';
      this.add(
        this.scene.add.text(rx, btnY - 9, btnTitle, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '13px',
          color: canAfford ? UI.white : '#94a3b8',
          fontStyle: '900'
        }).setOrigin(0.5)
      );

      // Gold cost
      this.add(
        this.scene.add.image(rx - 45, btnY + 11, 'ui-icon-gold').setDisplaySize(18, 18)
      );
      this.add(
        this.scene.add.text(rx - 30, btnY + 11, this.scene.formatCurrency(upgradeCost), {
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
          soundManager.playSFX(this.scene, 'hover');
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
    if (this.scene.playerProgress.gold < cost) {
      soundManager.playSFX(this.scene, 'hit');
      this.scene.showUpgradeFeedback(false, 'Not enough gold!');
      return;
    }

    soundManager.playSFX(this.scene, 'upgrade');

    // Deduct gold
    const nextGold = addPlayerGold(this.scene, -cost);
    this.scene.playerProgress.gold = nextGold;

    // Save skill level
    const skillId = this.selectedSkill.id;
    saveSkillLevel(skillId, currentLvl + 1);

    // Update gold display on the top HUD instantly
    if (this.scene.goldText) {
      this.scene.goldText.setText(this.scene.formatCurrency(nextGold));
    }

    this.scene.showUpgradeFeedback(true, currentLvl === 0 ? 'Skill Unlocked!' : 'Skill Upgraded!');

    this.show();
  }
}
