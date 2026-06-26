import Phaser from 'phaser';
import { getSkillLevelStats } from '../data/skills.js';

const MAX_SKILL_SLOTS = 5;

export default class SkillHud {
  constructor(scene, activeSkillSystem) {
    this.scene = scene;
    this.activeSkillSystem = activeSkillSystem;
    this.items = [];
    this.tooltip = null;

    this.skillsChangedListener = () => this.render();
    activeSkillSystem.on('skillsChanged', this.skillsChangedListener);

    this.resizeListener = () => this.render();
    this.scene.scale.on('resize', this.resizeListener);

    this.scene.events.once('shutdown', () => {
      this.activeSkillSystem.off('skillsChanged', this.skillsChangedListener);
      this.scene.scale.off('resize', this.resizeListener);
    });

    this.render();
  }

  render() {
    this.clear();
    const skills = this.activeSkillSystem.getOwnedSkills();

    const isPortrait = this.scene.scale.height > this.scene.scale.width;
    const slotSize = isPortrait ? 30 : 36;
    const gap      = isPortrait ? 6 : 8;
    const panelW   = MAX_SKILL_SLOTS * slotSize + (MAX_SKILL_SLOTS - 1) * gap + 16;
    const panelH   = slotSize + 16;
    const sceneW   = this.scene.scale.width;
    const sceneH   = this.scene.scale.height;

    let x, y;
    if (isPortrait) {
      // Bottom center, above screen bottom
      x = (sceneW - panelW) / 2;
      y = sceneH - panelH - 12;
    } else {
      x = sceneW - panelW - 10;
      y = 10;
    }

    // ── Background strip ─────────────────────────────────────
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x07111f, 0.82);
    bg.fillRoundedRect(x, y, panelW, panelH, 10);
    bg.lineStyle(1.5, 0x1e4a6e, 0.9);
    bg.strokeRoundedRect(x, y, panelW, panelH, 10);
    this.add(bg);

    // ── 5 Slots ──────────────────────────────────────────────
    const startX = x + 8 + slotSize / 2;
    const slotY  = y + panelH / 2;

    for (let i = 0; i < MAX_SKILL_SLOTS; i++) {
      const sx    = startX + i * (slotSize + gap);
      const skill = skills[i];

      if (skill) {
        const isPassive = skill.type === 'passive';
        const ringColor = isPassive ? 0x22c55e : 0x38bdf8;
        const lvlColor  = isPassive ? '#4ade80' : '#38bdf8';

        const ring = this.add(
          this.scene.add.circle(sx, slotY, slotSize / 2, 0x0b1e30, 1)
            .setStrokeStyle(2, ringColor, 1)
            .setInteractive({ useHandCursor: false })
        );

        this.scene.tweens.add({
          targets: ring,
          alpha: 0.72,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 1000 + i * 120,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        const imgSize = Math.floor(slotSize * 0.72);
        const icon = this.add(
          this.scene.add.image(sx, slotY, skill.assetKey)
            .setDisplaySize(imgSize, imgSize)
            .setInteractive({ useHandCursor: false })
        );

        // Level badge
        const scale = slotSize / 36;
        const badgeBg = this.scene.add.graphics();
        badgeBg.fillStyle(0x020f1a, 0.95);
        badgeBg.fillRoundedRect(sx + 8 * scale, slotY + 9 * scale, 18 * scale, 12 * scale, 4 * scale);
        this.add(badgeBg);

        this.add(
          this.scene.add.text(sx + 17 * scale, slotY + 15 * scale, `${skill.level}`, {
            fontFamily: '"Trebuchet MS", Arial, sans-serif',
            fontSize: `${9 * scale}px`,
            color: lvlColor,
            fontStyle: 'bold'
          }).setOrigin(0.5)
        );

        // ── Hover events ──────────────────────────────────────
        const tooltipX = sx;
        const tooltipY = slotY + slotSize / 2 + 8;
        const showTip = () => this.showTooltip(tooltipX, tooltipY, skill);
        const hideTip = () => this.hideTooltip();

        ring.on('pointerover', showTip).on('pointerout', hideTip);
        icon.on('pointerover', showTip).on('pointerout', hideTip);

      } else {
        const empty = this.add(
          this.scene.add.circle(sx, slotY, slotSize / 2, 0x07111f, 1)
        );
        empty.setStrokeStyle(1.2, 0x1e3a5f, 0.6);

        this.add(
          this.scene.add.text(sx, slotY, '+', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#1e3a5f'
          }).setOrigin(0.5)
        );
      }
    }
  }

  // ── Tooltip ─────────────────────────────────────────────────
  showTooltip(anchorX, anchorY, skill) {
    this.hideTooltip();

    const isPassive = skill.type === 'passive';
    const accentCol = isPassive ? 0x22c55e : 0x38bdf8;
    const accentHex = isPassive ? '#4ade80' : '#38bdf8';
    const typeLabel = isPassive ? '● PASIF' : '▶ AKTIF';
    const stats     = getSkillLevelStats(skill);
    const statLine  = this.buildStatLine(skill, stats);
    const nextLine  = skill.level < skill.maxLevel
      ? this.buildStatLine(skill, getSkillLevelStats({ ...skill, level: skill.level + 1 }))
      : null;

    // ── Height calculation ──────────────────────────────────
    // Fixed sections:
    //   accent bar   : 3px
    //   header row   : 44px  (icon 28px + padding)
    //   divider      : 8px
    //   description  : 34px  (2 wrapped lines @ ~17px each)
    //   stat current : statLine ? 18px : 0
    //   stat next    : nextLine ? 18px : 0
    //   bottom pad   : 10px
    const tw = 248;
    const HEADER_H  = 48;
    const DIVIDER_H = 8;
    const DESC_H    = 36;   // reserved for description (up to 2 wrapped lines)
    const STAT_H    = 18;
    const PAD_BOT   = 10;

    const th = HEADER_H + DIVIDER_H + DESC_H
             + (statLine ? STAT_H : 0)
             + (nextLine ? STAT_H : 0)
             + PAD_BOT;

    // ── Clamp to screen ──────────────────────────────────────
    const sceneW = this.scene.scale.width;
    const sceneH = this.scene.scale.height;
    let tx = anchorX - tw / 2;
    let ty = anchorY + 6;
    if (tx < 8) tx = 8;
    if (tx + tw > sceneW - 8) tx = sceneW - 8 - tw;
    if (ty + th > sceneH - 10)  ty = anchorY - th - 12;

    const tips = [];
    const t = (item) => {
      item.setScrollFactor(0).setDepth(3000);
      tips.push(item);
      return item;
    };

    // Shadow
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(tx + 3, ty + 3, tw, th, 10);
    t(shadow);

    // Panel background
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x060e1c, 0.97);
    panel.fillRoundedRect(tx, ty, tw, th, 10);
    panel.lineStyle(1.5, accentCol, 0.85);
    panel.strokeRoundedRect(tx, ty, tw, th, 10);
    panel.fillStyle(accentCol, 0.7);
    panel.fillRoundedRect(tx, ty, tw, 3, { tl: 10, tr: 10, bl: 0, br: 0 });
    t(panel);

    // ── Header row ─────────────────────────────────────────
    // Icon (centred vertically in header)
    const iconCY = ty + HEADER_H / 2;
    t(this.scene.add.image(tx + 22, iconCY, skill.assetKey).setDisplaySize(30, 30));

    // Skill name
    const titleText = skill.level >= 6 ? `${skill.name.toUpperCase()} (ULTIMATE)` : skill.name.toUpperCase();
    t(this.scene.add.text(tx + 42, ty + 10, titleText, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '13px',
      color: skill.level >= 6 ? '#fb923c' : '#f8fafc',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2
    }));

    // Type badge
    t(this.scene.add.text(tx + 42, ty + 28, typeLabel, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '10px',
      color: accentHex,
      fontStyle: 'bold'
    }));

    // Level dots — right side of header
    for (let d = 0; d < skill.maxLevel; d++) {
      const filled = d < skill.level;
      const dotX   = tx + tw - 12 - (skill.maxLevel - 1 - d) * 11;
      t(this.scene.add.circle(dotX, ty + 17, 4,
        filled ? accentCol : 0x1e3a5f, 1
      ).setStrokeStyle(1, filled ? accentCol : 0x2d4a6e, 1));
    }

    // ── Divider ─────────────────────────────────────────────
    const divY = ty + HEADER_H;
    const divG = this.scene.add.graphics();
    divG.lineStyle(1, 0x1e3a5f, 0.8);
    divG.lineBetween(tx + 10, divY, tx + tw - 10, divY);
    t(divG);

    // ── Description ─────────────────────────────────────────
    const descY = divY + DIVIDER_H;
    t(this.scene.add.text(tx + 10, descY, skill.description, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '11px',
      color: '#94a3b8',
      wordWrap: { width: tw - 20 },
      lineSpacing: 2
    }));

    // ── Stat divider ────────────────────────────────────────
    if (statLine || nextLine) {
      const statDivY = divY + DIVIDER_H + DESC_H;
      const statDivG = this.scene.add.graphics();
      statDivG.lineStyle(1, 0x1e3a5f, 0.5);
      statDivG.lineBetween(tx + 10, statDivY, tx + tw - 10, statDivY);
      t(statDivG);

      // Current stat
      if (statLine) {
        t(this.scene.add.text(tx + 10, statDivY + 4, statLine, {
          fontFamily: '"Trebuchet MS", Arial, sans-serif',
          fontSize: '11px',
          color: '#e2e8f0',
          fontStyle: 'bold'
        }));
      }

      // Next level preview
      if (nextLine) {
        const nextY = statDivY + 4 + (statLine ? STAT_H : 0);
        t(this.scene.add.text(tx + 10, nextY, `→ Lv.${skill.level + 1}: ${nextLine}`, {
          fontFamily: '"Trebuchet MS", Arial, sans-serif',
          fontSize: '11px',
          color: '#facc15'
        }));
      }
    }

    this.tooltip = tips;
  }

  buildStatLine(skill, stats) {
    if (!stats || Object.keys(stats).length === 0) return null;

    switch (skill.id) {
      case 'magnet':      return `Magnet Range: ${stats.range}px`;
      case 'movespeed':   return `Move Speed: +${(stats.speed * 100).toFixed(0)}%`;
      case 'aspd':        return `Attack Speed: +${(stats.aspd * 100).toFixed(0)}%`;
      case 'hp-regen':    return `HP Regen: +${stats.regen.toFixed(1)}/s`;
      case 'shield':      return `Shield: ${stats.shield} HP`;
      case 'attack-range':return `Attack Range: +${(stats.range * 100).toFixed(0)}%`;
      case 'knock':       return `Knockback Chance: ${(stats.chance * 100).toFixed(0)}%`;
      case 'fireball':
        return `DMG ${stats.damage} (+${stats.burnDamage}/s burn)  CD ${(stats.cooldown / 1000).toFixed(1)}s  RNG ${stats.range}`;
      case 'multi-shot':
        return `DMG ${stats.damage}  CD ${(stats.cooldown / 1000).toFixed(1)}s  TGT ${stats.targets}`;
      case 'lightning-strike':
        return `DMG ${stats.damage}  CD ${(stats.cooldown / 1000).toFixed(1)}s  TGT ${stats.targets}  RNG ${stats.range}`;
      default:
        if (stats.damage !== undefined)
          return `DMG ${stats.damage}  CD ${(stats.cooldown / 1000).toFixed(1)}s  RNG ${stats.range}`;
        return null;
    }
  }

  hideTooltip() {
    if (!this.tooltip) return;
    this.tooltip.forEach((item) => item.destroy());
    this.tooltip = null;
  }

  // ── Helpers ──────────────────────────────────────────────────
  add(item) {
    item.setScrollFactor(0);
    item.setDepth(1000);
    this.items.push(item);
    return item;
  }

  clear() {
    this.hideTooltip();
    this.items.forEach((item) => item.destroy());
    this.items = [];
  }
}
