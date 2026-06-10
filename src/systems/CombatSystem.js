import Phaser from 'phaser';
import Projectile from '../entities/Projectile.js';
import { soundManager } from '../services/soundManager.js';

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

    this.fireAt(target);
    this.cooldownRemaining = this.getAttackCooldown();
  }

  findNearestMonster() {
    let nearestMonster = null;
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
    const projectile = new Projectile(
      this.scene,
      this.player.x,
      this.player.y,
      target,
      this.projectileSpeed,
      this.getProjectileDamage()
    );

    soundManager.playSFX(this.scene, 'attack');

    this.projectiles.push(projectile);
    this.scene.physics.add.overlap(projectile, target, () => {
      if (!projectile.active || !target.active || target.isDying || target.isDead) {
        return;
      }

      this.applyDamage(target, projectile.damage);
      projectile.destroy();
    });
  }

  getAttackCooldown() {
    return this.attackCooldown / this.player.attackSpeedMultiplier;
  }

  getProjectileDamage() {
    let damage = this.baseDamage * this.player.damageMultiplier;

    if (Math.random() < this.player.criticalChance) {
      damage *= 2;
    }

    return Math.round(damage);
  }

  applyDamage(monster, damage) {
    if (!monster.active || monster.isDying || monster.isDead) {
      return;
    }

    monster.hp -= damage;
    this.showDamageText(monster, damage);
    soundManager.playSFX(this.scene, 'hit');

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

    this.gameStats.addKill();
    this.lootSystem.tryDropGold(monster.x, monster.y);
    this.lootSystem.dropExpOrb(monster.x, monster.y);
    soundManager.playSFX(this.scene, 'kill');
    monster.die();
  }

  showDamageText(monster, damage) {
    const damageText = this.scene.add.text(monster.x, monster.y - 34, `-${damage}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '22px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#111827',
      strokeThickness: 4
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
