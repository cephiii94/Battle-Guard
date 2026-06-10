import Phaser from 'phaser';
import skills, { createSkillState, getSkillLevelStats } from '../data/skills.js';
import Projectile from '../entities/Projectile.js';
import SkillChoicePopup from '../ui/SkillChoicePopup.js';
import { soundManager } from '../services/soundManager.js';

export default class ActiveSkillSystem {
  constructor(scene, player, spawnSystem, combatSystem, gameStats) {
    this.scene = scene;
    this.player = player;
    this.spawnSystem = spawnSystem;
    this.combatSystem = combatSystem;
    this.gameStats = gameStats;
    this.ownedSkills = [];
    this.pendingChoices = 0;
    this.isChoosing = false;
    this.listeners = {
      skillsChanged: []
    };
    this.popup = new SkillChoicePopup(scene, (skill) => this.chooseSkill(skill));

    this.gameStats.on('levelUp', () => this.queueSkillChoice());
  }

  update(delta) {
    this.ownedSkills.forEach((skill) => {
      skill.cooldownRemaining = Math.max(0, skill.cooldownRemaining - delta);

      if (skill.cooldownRemaining <= 0) {
        this.castSkill(skill);
      }
    });
  }

  queueSkillChoice() {
    this.pendingChoices += 1;

    if (!this.isChoosing) {
      this.showNextChoice();
    }
  }

  showNextChoice() {
    if (this.pendingChoices <= 0) {
      this.isChoosing = false;
      this.scene.setGameplayPaused(false);
      return;
    }

    const choices = this.getRandomSkillChoices(3);

    if (choices.length === 0) {
      this.pendingChoices = 0;
      this.isChoosing = false;
      this.scene.setGameplayPaused(false);
      return;
    }

    this.pendingChoices -= 1;
    this.isChoosing = true;
    this.scene.setGameplayPaused(true);
    this.popup.show(choices);
  }

  chooseSkill(skillChoice) {
    soundManager.playSFX(this.scene, 'click');
    const ownedSkill = this.ownedSkills.find((skill) => skill.id === skillChoice.id);

    if (ownedSkill) {
      ownedSkill.level = Math.min(ownedSkill.maxLevel, ownedSkill.level + 1);
      ownedSkill.cooldownRemaining = 0;
    } else {
      this.ownedSkills.push(createSkillState(skillChoice));
    }

    this.emit('skillsChanged', this.getOwnedSkills());
    this.popup.hide();
    this.showNextChoice();
  }

  getRandomSkillChoices(count) {
    const choicePool = skills
      .map((skill) => {
        const ownedSkill = this.ownedSkills.find((owned) => owned.id === skill.id);

        if (ownedSkill && ownedSkill.level >= ownedSkill.maxLevel) {
          return null;
        }

        return ownedSkill || skill;
      })
      .filter(Boolean);

    return Phaser.Utils.Array.Shuffle(choicePool).slice(0, count);
  }

  castSkill(skill) {
    const stats = getSkillLevelStats(skill);
    const castMap = {
      fireball: () => this.castFireball(skill, stats),
      'multi-shot': () => this.castMultiShot(skill, stats),
      'lightning-strike': () => this.castLightningStrike(skill, stats),
      'spin-attack': () => this.castSpinAttack(skill, stats)
    };
    const cast = castMap[skill.id];

    if (!cast || !cast()) {
      return;
    }

    soundManager.playSFX(this.scene, 'skill');
    skill.cooldownRemaining = stats.cooldown;
  }

  castFireball(skill, stats) {
    const target = this.findNearestMonster(stats.range);

    if (!target) {
      return false;
    }

    this.fireProjectile(target, stats.damage, 640, 0xf97316);
    this.showCastText(skill.name, '#fb923c');
    return true;
  }

  castMultiShot(skill, stats) {
    const targets = this.findNearestMonsters(stats.range, Math.min(2 + skill.level, 5));

    if (targets.length === 0) {
      return false;
    }

    targets.forEach((target) => {
      this.fireProjectile(target, stats.damage, 610, 0x60a5fa);
    });
    this.showCastText(skill.name, '#93c5fd');
    return true;
  }

  castLightningStrike(skill, stats) {
    const target = this.findNearestMonster(stats.range);

    if (!target) {
      return false;
    }

    this.getMonstersInArea(target.x, target.y, Math.max(20, stats.area)).forEach((monster) => {
      this.combatSystem.applyDamage(monster, stats.damage);
    });

    const bolt = this.scene.add.line(0, 0, target.x, target.y - 170, target.x, target.y, 0xfacc15, 0.95)
      .setLineWidth(5);
    this.scene.tweens.add({
      targets: bolt,
      alpha: 0,
      duration: 220,
      ease: 'Cubic.easeOut',
      onComplete: () => bolt.destroy()
    });
    this.showCastText(skill.name, '#facc15');
    return true;
  }

  castSpinAttack(skill, stats) {
    const targets = this.getMonstersInArea(this.player.x, this.player.y, stats.area);

    if (targets.length === 0) {
      return false;
    }

    targets.forEach((monster) => {
      this.combatSystem.applyDamage(monster, stats.damage);
    });

    const ring = this.scene.add.circle(this.player.x, this.player.y, stats.area, 0x38bdf8, 0.12)
      .setStrokeStyle(4, 0x67e8f9, 0.8);
    this.scene.tweens.add({
      targets: ring,
      scale: 1.18,
      alpha: 0,
      duration: 260,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
    this.showCastText(skill.name, '#67e8f9');
    return true;
  }

  fireProjectile(target, damage, speed, color) {
    const projectile = new Projectile(this.scene, this.player.x, this.player.y, target, speed, damage);

    projectile.setTint(color);
    this.scene.physics.add.overlap(projectile, target, () => {
      if (!projectile.active || !target.active || target.isDying || target.isDead) {
        return;
      }

      this.combatSystem.applyDamage(target, projectile.damage);
      projectile.destroy();
    });
  }

  findNearestMonster(range) {
    return this.findNearestMonsters(range, 1)[0] || null;
  }

  findNearestMonsters(range, count) {
    const rangeSq = range * range;

    return this.spawnSystem.getMonsters()
      .map((monster) => ({
        monster,
        distance: Phaser.Math.Distance.Squared(this.player.x, this.player.y, monster.x, monster.y)
      }))
      .filter((entry) => entry.distance <= rangeSq)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map((entry) => entry.monster);
  }

  getMonstersInArea(x, y, area) {
    const areaSq = area * area;

    return this.spawnSystem.getMonsters().filter((monster) => (
      Phaser.Math.Distance.Squared(x, y, monster.x, monster.y) <= areaSq
    ));
  }

  showCastText(text, color) {
    const label = this.scene.add.text(this.player.x, this.player.y - 72, text, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '16px',
      color,
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: label,
      y: label.y - 26,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy()
    });
  }

  getOwnedSkills() {
    return this.ownedSkills.map((skill) => ({ ...skill }));
  }

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(callback);
  }

  emit(eventName, value) {
    if (!this.listeners[eventName]) {
      return;
    }

    this.listeners[eventName].forEach((callback) => callback(value));
  }
}
