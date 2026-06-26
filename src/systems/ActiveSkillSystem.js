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

    const burnDmg = stats.burnDamage || 2;
    this.fireProjectile(target, stats.damage, 640, 0xf97316, (hitTarget) => {
      this.applyBurn(hitTarget, burnDmg, 3);
    });
    this.showCastText(skill.name, '#fb923c');
    return true;
  }

  applyBurn(monster, burnDmg, durationSeconds) {
    if (!monster || !monster.active || monster.isDying || monster.isDead) return;

    if (monster.burnTimer) {
      monster.burnTimer.destroy();
    }

    // Visual burn indicator: Tint monster orange/red
    monster.setTint(0xf97316);

    let ticks = durationSeconds;
    monster.burnTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!monster.active || monster.isDying || monster.isDead) {
          if (monster.burnTimer) monster.burnTimer.destroy();
          monster.burnTimer = null;
          return;
        }

        this.combatSystem.applyDotDamage(monster, burnDmg, '#f97316');
        ticks--;

        if (ticks <= 0 || !monster.active || monster.isDying || monster.isDead) {
          if (monster.active) {
            monster.clearTint();
          }
          if (monster.burnTimer) monster.burnTimer.destroy();
          monster.burnTimer = null;
        }
      },
      repeat: durationSeconds - 1
    });
  }

  createFireMark(x, y) {
    const duration = 5000; // 5 seconds
    const radius = 65;
    const burnDamage = 12;

    const fireGraphics = this.scene.add.graphics();
    fireGraphics.setDepth(this.player.depth - 1); // Below characters

    this.scene.tweens.add({
      targets: fireGraphics,
      alpha: { from: 0.2, to: 0.55 },
      duration: 350,
      yoyo: true,
      repeat: -1
    });

    const drawEvent = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!fireGraphics.active) return;
        fireGraphics.clear();
        fireGraphics.fillStyle(0xf97316, fireGraphics.alpha);
        fireGraphics.fillCircle(x, y, radius);
        fireGraphics.lineStyle(2.5, 0xef4444, fireGraphics.alpha + 0.15);
        fireGraphics.strokeCircle(x, y, radius);
      },
      loop: true
    });

    const damageEvent = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        const targets = this.getMonstersInArea(x, y, radius);
        targets.forEach((monster) => {
          if (!monster.active || monster.isDying || monster.isDead) return;
          this.combatSystem.applyDotDamage(monster, burnDamage, '#f97316');
          this.applyBurn(monster, burnDamage / 2, 3);
        });
      },
      repeat: 4 // 5 ticks total
    });

    this.scene.time.delayedCall(duration, () => {
      if (fireGraphics.active) {
        this.scene.tweens.killTweensOf(fireGraphics);
        drawEvent.destroy();
        damageEvent.destroy();
        fireGraphics.destroy();
      }
    });
  }

  castMultiShot(skill, stats) {
    const targets = this.findNearestMonsters(this.player.attackRange, stats.targets || (1 + skill.level));

    if (targets.length === 0) {
      return false;
    }

    if (this.player.attackType === 'melee') {
      if (skill.level >= 6) {
        // Melee ultimate circular slash
        this.performUltimateMeleeSlash(stats.damage);
      } else {
        // Melee multi-slash flurry (normal)
        targets.forEach((target, index) => {
          this.scene.time.delayedCall(index * 80, () => {
            if (!target || !target.active || target.isDying || target.isDead) {
              return;
            }
            this.performMeleeSlash(target, stats.damage);
          });
        });
      }
    } else {
      // Ranged multi-shot projectiles
      const bounceCount = skill.level >= 6 ? 2 : 0;
      targets.forEach((target) => {
        this.fireProjectile(target, stats.damage, 610, 0x60a5fa, null, bounceCount);
      });
    }
    this.showCastText(skill.name, '#93c5fd');
    return true;
  }

  performUltimateMeleeSlash(damage) {
    if (!this.player || !this.player.active) return;

    const radius = 135;
    const targets = this.getMonstersInArea(this.player.x, this.player.y, radius);
    targets.forEach((monster) => {
      if (!monster.active || monster.isDying || monster.isDead) return;
      this.combatSystem.applyDamage(monster, damage);
    });

    const slash = this.scene.add.graphics();
    slash.setDepth(this.player.depth + 1);

    const slashColor = this.player.activeSkin?.colors?.border || 0x00d6ff;

    this.scene.tweens.add({
      targets: { progress: 0 },
      progress: 1,
      duration: 250,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        if (!this.player || !this.player.active) {
          slash.destroy();
          return;
        }
        slash.clear();
        const t = tween.getValue();

        slash.lineStyle(10, slashColor, 0.6 * (1 - t));
        slash.beginPath();
        slash.arc(this.player.x, this.player.y, radius * t, 0, Math.PI * 2, false);
        slash.strokePath();

        slash.lineStyle(3, 0xffffff, 1 - t);
        slash.beginPath();
        slash.arc(this.player.x, this.player.y, radius * t, 0, Math.PI * 2, false);
        slash.strokePath();
      },
      onComplete: () => {
        slash.destroy();
      }
    });
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
    const targets = this.findNearestMonsters(stats.range, stats.targets || (1 + skill.level));

    if (targets.length === 0) {
      return false;
    }

    targets.forEach((target) => {
      this.combatSystem.applyDamage(target, stats.damage);

      const bolt = this.scene.add.line(0, 0, target.x, target.y - 170, target.x, target.y, 0xfacc15, 0.95)
        .setLineWidth(5);
      this.scene.tweens.add({
        targets: bolt,
        alpha: 0,
        duration: 220,
        ease: 'Cubic.easeOut',
        onComplete: () => bolt.destroy()
      });

      // Ultimate Effect: AoE damage around the struck target
      if (skill.level >= 6) {
        const aoeRadius = 90;
        const aoeDamage = Math.round(stats.damage * 0.5);

        this.getMonstersInArea(target.x, target.y, aoeRadius).forEach((monster) => {
          if (monster !== target && monster.active && !monster.isDying && !monster.isDead) {
            this.combatSystem.applyDamage(monster, aoeDamage);
          }
        });

        const shockwave = this.scene.add.circle(target.x, target.y, aoeRadius, 0xfacc15, 0.15)
          .setStrokeStyle(2.5, 0xffffff, 0.85);
        this.scene.tweens.add({
          targets: shockwave,
          scale: 1.15,
          alpha: 0,
          duration: 250,
          ease: 'Cubic.easeOut',
          onComplete: () => shockwave.destroy()
        });
      }
    });

    this.showCastText(skill.name, '#facc15');
    return true;
  }

  castSpinAttack(skill, stats) {
    if (skill.level >= 6) {
      // Ultimate Spin: Persists for 2 seconds, spinning around the hero
      this.applyPersistentSpin(skill, stats, 2000, 200);
      this.showCastText(skill.name, '#67e8f9');
      return true;
    }

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

  applyPersistentSpin(skill, stats, durationMs, tickIntervalMs) {
    const ticks = durationMs / tickIntervalMs;
    const damagePerTick = Math.round(stats.damage * 0.25);

    const spinGraphics = this.scene.add.graphics();
    spinGraphics.setDepth(this.player.depth + 1);

    let currentAngle = 0;

    const spinTimer = this.scene.time.addEvent({
      delay: tickIntervalMs,
      callback: () => {
        if (!this.player || !this.player.active) {
          spinTimer.destroy();
          spinGraphics.destroy();
          return;
        }

        const targets = this.getMonstersInArea(this.player.x, this.player.y, stats.area);
        targets.forEach((monster) => {
          if (!monster.active || monster.isDying || monster.isDead) return;
          this.combatSystem.applyDamage(monster, damagePerTick);
        });
      },
      repeat: ticks - 1
    });

    const updateEvent = this.scene.time.addEvent({
      delay: 16,
      callback: () => {
        if (!this.player || !this.player.active || !spinTimer.active) {
          updateEvent.destroy();
          spinGraphics.destroy();
          return;
        }

        spinGraphics.clear();
        currentAngle += 0.15;

        const numSlashes = 3;
        const radius = stats.area;
        const slashColor = 0x67e8f9;

        spinGraphics.lineStyle(6, slashColor, 0.65);
        for (let i = 0; i < numSlashes; i++) {
          spinGraphics.beginPath();
          const startAngle = currentAngle + (i * (Math.PI * 2 / numSlashes));
          const endAngle = startAngle + 1.1;
          spinGraphics.arc(this.player.x, this.player.y, radius, startAngle, endAngle, false);
          spinGraphics.strokePath();
        }

        spinGraphics.lineStyle(2.5, 0xffffff, 0.95);
        for (let i = 0; i < numSlashes; i++) {
          spinGraphics.beginPath();
          const startAngle = currentAngle + (i * (Math.PI * 2 / numSlashes));
          const endAngle = startAngle + 1.1;
          spinGraphics.arc(this.player.x, this.player.y, radius, startAngle, endAngle, false);
          spinGraphics.strokePath();
        }
      },
      loop: true
    });

    this.scene.time.delayedCall(durationMs, () => {
      spinTimer.destroy();
      updateEvent.destroy();
      spinGraphics.destroy();
    });
  }

  fireProjectile(target, damage, speed, color, onHit = null, bounceCount = 0) {
    const projectile = new Projectile(this.scene, this.player.x, this.player.y, target, speed, damage);
    projectile.setTint(color);

    const hitMonsters = new Set([target]);

    const setupOverlap = (currentTarget) => {
      const overlapCollider = this.scene.physics.add.overlap(projectile, currentTarget, () => {
        if (!projectile.active || !currentTarget.active || currentTarget.isDying || currentTarget.isDead) {
          return;
        }

        this.combatSystem.applyDamage(currentTarget, projectile.damage);
        if (onHit) {
          onHit(currentTarget);
        }

        overlapCollider.destroy();

        if (bounceCount > 0) {
          const nextTarget = this.findNextBounceTarget(currentTarget, hitMonsters, 250);
          if (nextTarget) {
            bounceCount--;
            hitMonsters.add(nextTarget);
            projectile.launchAt(nextTarget);
            setupOverlap(nextTarget);
            return;
          }
        }

        projectile.destroy();
      });
    };

    setupOverlap(target);
  }

  findNextBounceTarget(currentTarget, hitMonsters, range) {
    const rangeSq = range * range;
    const candidates = this.spawnSystem.getMonsters()
      .filter((monster) => {
        if (!monster.active || monster.isDying || monster.isDead || hitMonsters.has(monster)) {
          return false;
        }
        return Phaser.Math.Distance.Squared(currentTarget.x, currentTarget.y, monster.x, monster.y) <= rangeSq;
      })
      .map((monster) => ({
        monster,
        distance: Phaser.Math.Distance.Squared(currentTarget.x, currentTarget.y, monster.x, monster.y)
      }))
      .sort((a, b) => a.distance - b.distance);

    return candidates[0] ? candidates[0].monster : null;
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
