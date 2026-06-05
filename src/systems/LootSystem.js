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
    this.loots.forEach((loot) => this.collectIfTouched(loot));
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

  collectIfTouched(loot) {
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      loot.x,
      loot.y
    );

    if (distance > loot.pickupRadius + this.player.radius) {
      return;
    }

    if (loot.type === 'gold') {
      this.gameStats.addGold(loot.value);
    } else if (loot.type === 'exp') {
      this.gameStats.addExp(loot.value);
    }

    loot.destroy();
  }
}
