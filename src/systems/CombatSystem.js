import Phaser from 'phaser';
import Projectile from '../entities/Projectile.js';

export default class CombatSystem {
  constructor(scene, player, spawnSystem, gameStats, lootSystem) {
    this.scene = scene;
    this.player = player;
    this.spawnSystem = spawnSystem;
    this.gameStats = gameStats;
    this.lootSystem = lootSystem;
    this.attackRadius = 420;
    this.attackCooldown = 650;
    this.baseDamage = 10;
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

    if (monster.hp <= 0) {
      this.killMonster(monster);
    }
  }

  killMonster(monster) {
    this.gameStats.addKill();
    this.lootSystem.tryDropGold(monster.x, monster.y);
    this.lootSystem.dropExpOrb(monster.x, monster.y);
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
