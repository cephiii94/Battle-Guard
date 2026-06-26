import Phaser from 'phaser';
import Loot from '../entities/Loot.js';
import { soundManager } from '../services/soundManager.js';
import equipment from '../data/equipment.js';
import { addEquipmentToInventory } from '../systems/EquipmentInventory.js';
import { addPlayerMaterial } from '../systems/PlayerProgress.js';
import EffectSystem from './EffectSystem.js';

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

  handleMonsterKilled(monster) {
    this.gameStats.addKill();
    this.tryDropGold(monster.x, monster.y);
    this.dropExpOrb(monster.x, monster.y);
    soundManager.playSFX(this.scene, 'kill');
    
    // Spawn death particles!
    EffectSystem.createDeathEffect(this.scene, monster.x, monster.y);
    
    // Ultimate Fireball effect: leaves fire mark on corpse
    if (monster.burnTimer && this.scene.activeSkillSystem) {
      const fireball = this.scene.activeSkillSystem.ownedSkills.find(s => s.id === 'fireball');
      if (fireball && fireball.level >= 6) {
        this.scene.activeSkillSystem.createFireMark(monster.x, monster.y);
      }
    }

    monster.die();
  }

  rollBossLoot(boss) {
    const equipmentDrop = this.rollEquipmentDrop(boss.bossData);
    let materialDrops = null;
    const gameMode = this.scene.gameMode || 'campaign';
    
    if (gameMode === 'looting') {
      const ironOreAmount = Phaser.Math.Between(3, 6);
      const magicGemAmount = Math.random() < 0.5 ? Phaser.Math.Between(1, 3) : 0;
      const dragonScaleAmount = Math.random() < 0.25 ? 1 : 0;

      materialDrops = {};
      if (ironOreAmount > 0) {
        addPlayerMaterial(this.scene, 'iron-ore', ironOreAmount);
        materialDrops['iron-ore'] = ironOreAmount;
      }
      if (magicGemAmount > 0) {
        addPlayerMaterial(this.scene, 'magic-gem', magicGemAmount);
        materialDrops['magic-gem'] = magicGemAmount;
      }
      if (dragonScaleAmount > 0) {
        addPlayerMaterial(this.scene, 'dragon-scale', dragonScaleAmount);
        materialDrops['dragon-scale'] = dragonScaleAmount;
      }
    }
    
    return { equipmentDrop, materialDrops };
  }

  rollEquipmentDrop(bossData) {
    if (Math.random() > bossData.equipmentDropChance) {
      return null;
    }

    const item = Phaser.Utils.Array.GetRandom(equipment);
    addEquipmentToInventory(this.scene, item.id);
    return item;
  }
}
