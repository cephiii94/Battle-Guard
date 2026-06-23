import Phaser from 'phaser';
import Projectile from '../entities/Projectile.js';
import { soundManager } from '../services/soundManager.js';
import { GameManager } from '../systems/GameManager.js';
import EffectSystem from './EffectSystem.js';

export default class CombatSystem {
  constructor(scene, player, spawnSystem, gameStats, lootSystem) {
    this.scene = scene;
    this.player = player;
    this.spawnSystem = spawnSystem;
    this.gameStats = gameStats;
    this.lootSystem = lootSystem;
    this.attackRadius = player.attackRange;
    this.attackCooldown = 650;
    this.baseDamage = player.baseDamage;
    this.projectileSpeed = 520;
    this.cooldownRemaining = 0;
    this.projectiles = [];
  }

  update(delta) {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);
    this.projectiles = this.projectiles.filter((projectile) => projectile.active);

    const target = this.findNearestMonster();

    if (!target || this.cooldownRemaining > 0) {
      return;
    }

    if (this.player.attackType === 'melee') {
      this.meleeAttack(target);
    } else {
      this.fireAt(target);
    }
    this.cooldownRemaining = this.getAttackCooldown();
  }

  findNearestMonster() {
    let nearestMonster = null;
    this.attackRadius = this.player.attackRange;
    let nearestDistance = this.attackRadius * this.attackRadius;

    this.spawnSystem.getMonsters().forEach((monster) => {
      const distance = Phaser.Math.Distance.Squared(
        this.player.x,
        this.player.y,
        monster.x,
        monster.y
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestMonster = monster;
      }
    });

    return nearestMonster;
  }

  fireAt(target) {
    const damageInfo = this.getProjectileDamage();
    const projectile = new Projectile(
      this.scene,
      this.player.x,
      this.player.y,
      target,
      this.projectileSpeed,
      damageInfo.damage
    );
    projectile.isCritical = damageInfo.isCritical;

    soundManager.playSFX(this.scene, 'attack');

    this.projectiles.push(projectile);
    this.scene.physics.add.overlap(projectile, target, () => {
      if (!projectile.active || !target.active || target.isDying || target.isDead) {
        return;
      }

      this.applyDamage(target, projectile.damage, projectile.isCritical);
      projectile.destroy();
    });
  }

  meleeAttack(target) {
    soundManager.playSFX(this.scene, 'attack');

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    const slash = this.scene.add.graphics();
    slash.setDepth(this.player.depth + 1);

    const slashColor = this.player.activeSkin?.colors?.border || 0x00d6ff;
    const range = this.player.attackRange || 80;
    const slashRadius = Math.min(range * 0.75, 120);

    let progress = 0;
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
        
        // Draw the outer slash glow
        slash.lineStyle(10, slashColor, 0.45 * (1 - t));
        slash.beginPath();
        const startAngle = angle - 0.7;
        const endAngle = startAngle + (1.4 * t);
        slash.arc(this.player.x, this.player.y, slashRadius, startAngle, endAngle, false);
        slash.strokePath();

        // Draw the sharp inner slash core
        slash.lineStyle(3, 0xffffff, 1 - t);
        slash.beginPath();
        slash.arc(this.player.x, this.player.y, slashRadius, startAngle, endAngle, false);
        slash.strokePath();
      },
      onComplete: () => {
        slash.destroy();
      }
    });

    // Apply damage to all monsters inside the slash path (AoE)
    const damageInfo = this.getProjectileDamage();
    const monsters = this.spawnSystem.getMonsters();

    monsters.forEach((monster) => {
      if (!monster.active || monster.isDying || monster.isDead) {
        return;
      }

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y);
      if (dist <= range) {
        const monsterAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, monster.x, monster.y);
        let angleDiff = Phaser.Math.Angle.Normalize(monsterAngle - angle);
        if (angleDiff > Math.PI) {
          angleDiff -= 2 * Math.PI;
        }

        // Within 0.8 radians (about 45 degrees) of the slash trajectory
        if (Math.abs(angleDiff) <= 0.8) {
          this.applyDamage(monster, damageInfo.damage, damageInfo.isCritical);
        }
      }
    });
  }

  getAttackCooldown() {
    return this.attackCooldown / this.player.attackSpeedMultiplier;
  }

  getProjectileDamage() {
    let damage = this.baseDamage * this.player.damageMultiplier;
    let isCritical = false;

    if (Math.random() < this.player.criticalChance) {
      damage *= 2;
      isCritical = true;
    }

    return { damage: Math.round(damage), isCritical };
  }

  applyDamage(monster, damage, isCritical = false) {
    if (!monster.active || monster.isDying || monster.isDead) {
      return;
    }

    monster.hp -= damage;
    this.showDamageText(monster, damage, isCritical);
    soundManager.playSFX(this.scene, 'hit');

    // Spawn hit particles!
    EffectSystem.createHitEffect(this.scene, monster.x, monster.y, isCritical);

    // Knockback (Heavy Impact) Passive mechanic
    const playerData = GameManager.getState();
    const globalSkillLevels = playerData?.skillLevels || {};
    const activeSkillSystem = this.scene.activeSkillSystem;
    const ownedKnock = activeSkillSystem?.ownedSkills.find(s => s.id === 'knock');
    const knockLvl = (ownedKnock ? ownedKnock.level : 0) + (globalSkillLevels['knock'] || 0);

    if (knockLvl > 0) {
      const knockChance = knockLvl * 0.10; // 10% per level
      if (Math.random() < knockChance) {
        this.applyKnockback(monster, 24 + knockLvl * 6);
      }
    }

    // Lifesteal Mechanic
    if (this.player.lifesteal > 0 && this.player.hp < this.player.maxHp) {
      const healAmount = Math.max(1, Math.round(damage * this.player.lifesteal));
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
      this.showHealText(healAmount);
    }

    if (monster.hp <= 0) {
      this.killMonster(monster);
    }
  }

  applyKnockback(monster, distance) {
    if (!monster.body) return;
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, monster.x, monster.y);
    const targetX = monster.x + Math.cos(angle) * distance;
    const targetY = monster.y + Math.sin(angle) * distance;

    this.scene.tweens.add({
      targets: monster,
      x: targetX,
      y: targetY,
      duration: 120,
      ease: 'Quad.easeOut'
    });
  }

  showHealText(amount) {
    const healText = this.scene.add.text(this.player.x, this.player.y - 74, `+${amount} HP`, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '18px',
      color: '#4ade80',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: healText,
      y: healText.y - 28,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        healText.destroy();
      }
    });
  }

  killMonster(monster) {
    if (monster.isBoss && this.scene.bossSystem) {
      this.scene.bossSystem.handleBossKilled(monster);
      return;
    }

    this.lootSystem.handleMonsterKilled(monster);
  }

  processPlayerDamage(attacker) {
    // 1. Check Evasion (Dodge)
    if (Math.random() < this.player.evasion) {
      this.scene.showPlayerMiss();
      return true; // dodged
    }

    // 2. Reduce damage using Armor
    const finalDamage = Math.max(1, Math.round(attacker.damage - this.player.armor));

    const hpDamage = this.player.takeDamage(finalDamage);
    if (hpDamage <= 0) {
      this.scene.showPlayerShieldBlock(finalDamage);
    } else {
      this.scene.showPlayerHit(hpDamage);
      if (finalDamage > hpDamage) {
        this.scene.showPlayerShieldBlock(finalDamage - hpDamage);
      }
    }
    soundManager.playSFX(this.scene, 'hit');
    return false; // not dodged
  }

  showDamageText(monster, damage, isCritical = false) {
    const damageText = this.scene.add.text(monster.x, monster.y - 34, `-${damage}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: isCritical ? '28px' : '22px',
      color: isCritical ? '#ef4444' : '#facc15', // Crimson for critical hits, Gold for standard
      fontStyle: 'bold',
      stroke: '#111827',
      strokeThickness: isCritical ? 6 : 4
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 34,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        damageText.destroy();
      }
    });
  }
}
