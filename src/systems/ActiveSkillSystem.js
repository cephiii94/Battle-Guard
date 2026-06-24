import Phaser from 'phaser';
import skills, { createSkillState, getSkillLevelStats } from '../data/skills.js';
import Projectile from '../entities/Projectile.js';
import SkillChoicePopup from '../ui/SkillChoicePopup.js';
import { soundManager } from '../services/soundManager.js';
import { GameManager } from './GameManager.js';

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
    
    // Apply global main menu upgrades at start of battle run
    this.applyGlobalPassiveUpgrades();
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

    const MAX_SKILL_SLOTS = 5;
    const ownedSkill = this.ownedSkills.find((skill) => skill.id === skillChoice.id);

    // Safety: never add a new skill if all slots are occupied
    if (!ownedSkill && this.ownedSkills.length >= MAX_SKILL_SLOTS) {
      this.popup.hide();
      this.showNextChoice();
      return;
    }

    if (skillChoice.type === 'passive') {
      let newLvl = 1;
      if (ownedSkill) {
        ownedSkill.level = Math.min(ownedSkill.maxLevel, ownedSkill.level + 1);
        newLvl = ownedSkill.level;
      } else {
        const newState = createSkillState(skillChoice);
        this.ownedSkills.push(newState);
        newLvl = newState.level;
      }
      this.applyPassiveInGameBonus(skillChoice.id, newLvl);
    } else {
      if (ownedSkill) {
        ownedSkill.level = Math.min(ownedSkill.maxLevel, ownedSkill.level + 1);
        ownedSkill.cooldownRemaining = 0;
      } else {
        this.ownedSkills.push(createSkillState(skillChoice));
      }
    }

    this.emit('skillsChanged', this.getOwnedSkills());
    this.popup.hide();
    this.showNextChoice();
  }

  applyGlobalPassiveUpgrades() {
    const playerData = GameManager.getState();
    const globalSkillLevels = playerData?.skillLevels || {};

    // Magnet
    let magnetLvl = globalSkillLevels['magnet'] || 0;
    this.player.magnetRange = 150 + (magnetLvl * 20);

    // Movespeed
    let moveLvl = globalSkillLevels['movespeed'] || 0;
    if (moveLvl > 0) {
      this.player.speed = this.player.finalStats.moveSpeed * (1 + (moveLvl * 0.04));
    }

    // ASPD
    let aspdLvl = globalSkillLevels['aspd'] || 0;
    if (aspdLvl > 0) {
      this.player.attackSpeedMultiplier = 1 + (aspdLvl * 0.05);
    }

    // HP Regen
    let regenLvl = globalSkillLevels['hp-regen'] || 0;
    if (regenLvl > 0) {
      this.player.healthRegen = (this.player.finalStats.healthRegen || 0) + (regenLvl * 0.5);
    }

    // Shield
    let shieldLvl = globalSkillLevels['shield'] || 0;
    if (shieldLvl > 0) {
      this.player.maxShield = shieldLvl * 10;
      this.player.shield = this.player.maxShield;
    }

    // Attack Range (Eagle Eye) - Only for ranged heroes
    let rangeLvl = globalSkillLevels['attack-range'] || 0;
    if (rangeLvl > 0 && this.player.attackType === 'ranged') {
      this.player.attackRange = this.player.finalStats.attackRange * (1 + (rangeLvl * 0.05));
    }
  }

  applyPassiveInGameBonus(id, level) {
    const playerData = GameManager.getState();
    const globalSkillLevels = playerData?.skillLevels || {};
    const globalLvl = globalSkillLevels[id] || 0;
    const totalLvl = globalLvl + level;

    switch (id) {
      case 'magnet':
        this.player.magnetRange = 150 + (totalLvl * 20);
        break;
      case 'movespeed':
        this.player.speed = this.player.finalStats.moveSpeed * (1 + (totalLvl * 0.04));
        break;
      case 'aspd':
        this.player.attackSpeedMultiplier = 1 + (totalLvl * 0.05);
        break;
      case 'hp-regen':
        this.player.healthRegen = (this.player.finalStats.healthRegen || 0) + (totalLvl * 0.5);
        break;
      case 'shield':
        this.player.maxShield = totalLvl * 10;
        this.player.shield = Math.min(this.player.maxShield, this.player.shield + 10);
        break;
      case 'attack-range':
        if (this.player.attackType === 'ranged') {
          this.player.attackRange = this.player.finalStats.attackRange * (1 + (totalLvl * 0.05));
        }
        break;
      case 'knock':
        // Handled dynamically in CombatSystem.applyDamage()
        break;
    }
  }

  getRandomSkillChoices(count) {
    const MAX_SKILL_SLOTS = 5;
    const slotsFull = this.ownedSkills.length >= MAX_SKILL_SLOTS;

    const choicePool = skills
      .map((skill) => {
        const ownedSkill = this.ownedSkills.find((owned) => owned.id === skill.id);

        // Skip maxed skills
        if (ownedSkill && ownedSkill.level >= ownedSkill.maxLevel) {
          return null;
        }

        // If slots are full, only show skills already owned (for level-up), never new ones
        if (slotsFull && !ownedSkill) {
          return null;
        }

        // Eagle Eye (attack-range) is for ranged heroes only
        if (skill.id === 'attack-range' && this.player.attackType === 'melee') {
          return null;
        }

        // Prerequisite check: new skill requires its parent to be owned first
        if (skill.dependsOn) {
          const hasParent = this.ownedSkills.some((owned) => owned.id === skill.dependsOn);
          if (!hasParent) {
            return null;
          }
        }

        return ownedSkill || skill;
      })
      .filter(Boolean);

    return Phaser.Utils.Array.Shuffle(choicePool).slice(0, count);
  }

  castSkill(skill) {
    const stats = getSkillLevelStats(skill);
    
    // Apply passive buffs from main menu skill levels
    const playerData = GameManager.getState();
    const mainMenuSkillLevels = playerData?.skillLevels || {};
    const buffLvl = mainMenuSkillLevels[skill.id] || 0;
    
    if (buffLvl > 0) {
      stats.damage = Math.round(stats.damage * (1 + buffLvl * 0.08));
      stats.cooldown = Math.max(400, Math.round(stats.cooldown * (1 - buffLvl * 0.05)));
      stats.range = Math.round(stats.range * (1 + buffLvl * 0.04));
      stats.area = Math.round(stats.area * (1 + buffLvl * 0.04));
    }

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
    const cdrMultiplier = Math.max(0.4, 1 - (this.player.cooldownReduction || 0));
    skill.cooldownRemaining = stats.cooldown * cdrMultiplier;
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

    if (this.player.attackType === 'melee') {
      // Melee multi-slash flurry
      targets.forEach((target, index) => {
        this.scene.time.delayedCall(index * 80, () => {
          if (!target || !target.active || target.isDying || target.isDead) {
            return;
          }
          this.performMeleeSlash(target, stats.damage);
        });
      });
    } else {
      // Ranged multi-shot projectiles
      targets.forEach((target) => {
        this.fireProjectile(target, stats.damage, 610, 0x60a5fa);
      });
    }
    this.showCastText(skill.name, '#93c5fd');
    return true;
  }

  performMeleeSlash(target, damage) {
    if (!this.player || !this.player.active) return;

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    const slash = this.scene.add.graphics();
    slash.setDepth(this.player.depth + 1);

    const slashColor = this.player.activeSkin?.colors?.border || 0x00d6ff;
    const slashRadius = 90;

    this.scene.tweens.add({
      targets: { progress: 0 },
      progress: 1,
      duration: 160,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        if (!this.player || !this.player.active) {
          slash.destroy();
          return;
        }
        slash.clear();
        const t = tween.getValue();
        
        slash.lineStyle(8, slashColor, 0.45 * (1 - t));
        slash.beginPath();
        const startAngle = angle - 0.7;
        const endAngle = startAngle + (1.4 * t);
        slash.arc(this.player.x, this.player.y, slashRadius, startAngle, endAngle, false);
        slash.strokePath();

        slash.lineStyle(2.5, 0xffffff, 1 - t);
        slash.beginPath();
        slash.arc(this.player.x, this.player.y, slashRadius, startAngle, endAngle, false);
        slash.strokePath();
      },
      onComplete: () => {
        slash.destroy();
      }
    });

    this.combatSystem.applyDamage(target, damage);
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

  off(eventName, callback) {
    if (!this.listeners[eventName]) {
      return;
    }
    this.listeners[eventName] = this.listeners[eventName].filter((cb) => cb !== callback);
  }

  emit(eventName, value) {
    if (!this.listeners[eventName]) {
      return;
    }

    this.listeners[eventName].forEach((callback) => callback(value));
  }
}
