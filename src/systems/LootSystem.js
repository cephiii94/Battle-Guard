import Phaser from 'phaser';
import Loot from '../entities/Loot.js';

export default class LootSystem {
  constructor(scene, player, gameStats) {
    this.scene = scene;
    this.player = player;
    this.gameStats = gameStats;
    this.loots = [];
    this.goldDropChance = 0.5;
    this.goldValue = 1;
    this.expValue = 25;
  }

  update() {
    this.loots = this.loots.filter((loot) => loot.active);
    
    const delta = this.scene.game.loop.delta / 1000;
    // Magnet range scales dynamically with stats and in-game upgrades
    const magnetRange = this.player.magnetRange || this.player.finalStats.magnetRange || 150;

    this.loots.forEach((loot) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        loot.x,
        loot.y
      );

      const pickupRange = loot.pickupRadius + this.player.radius;

      if (distance <= pickupRange) {
        this.collect(loot);
      } else if (distance <= magnetRange) {
        // Accelerate magnet speed towards player
        if (!loot.magnetSpeed) {
          loot.magnetSpeed = 160;
        } else {
          loot.magnetSpeed += 400 * delta; // Smooth acceleration
        }

        const angle = Phaser.Math.Angle.Between(loot.x, loot.y, this.player.x, this.player.y);
        loot.x += Math.cos(angle) * loot.magnetSpeed * delta;
        loot.y += Math.sin(angle) * loot.magnetSpeed * delta;
      }
    });
  }

  tryDropGold(x, y) {
    if (Math.random() > this.goldDropChance) {
      return;
    }

    this.spawnLoot(x, y, 'gold', this.goldValue);
  }

  dropExpOrb(x, y) {
    this.spawnLoot(x + 18, y, 'exp', this.expValue);
  }

  spawnLoot(x, y, type, value) {
    const loot = new Loot(this.scene, x, y, type, value);
    this.loots.push(loot);
  }

  collect(loot) {
    if (loot.type === 'gold') {
      this.gameStats.addGold(loot.value);
    } else if (loot.type === 'exp') {
      this.gameStats.addExp(loot.value);
    }

    loot.destroy();
  }
}
