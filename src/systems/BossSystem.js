import Phaser from 'phaser';
import equipment from '../data/equipment.js';
import { getBossForStage } from '../data/bosses.js';
import Boss from '../entities/Boss.js';
import { addEquipmentToInventory } from './EquipmentInventory.js';
import BossHpBar from '../ui/BossHpBar.js';

export default class BossSystem {
  constructor(scene, player, spawnSystem, stageSystem, mapBounds) {
    this.scene = scene;
    this.player = player;
    this.spawnSystem = spawnSystem;
    this.stageSystem = stageSystem;
    this.mapBounds = mapBounds;
    this.spawnThreshold = 30;
    this.hasSpawned = false;
    this.isDefeated = false;
    this.boss = null;
    this.hpBar = new BossHpBar(scene);

    stageSystem.setTimerVictoryBlocked(true);
    stageSystem.on('tick', (snapshot) => this.handleStageTick(snapshot));
  }

  update(delta) {
    if (!this.boss || !this.boss.active || this.boss.isDead) {
      return;
    }

    this.hpBar.update();
    this.updateBossAttack(delta);
  }

  handleStageTick(snapshot) {
    if (
      !this.hasSpawned &&
      !this.stageSystem.isFinished &&
      snapshot.remainingTime <= this.spawnThreshold
    ) {
      this.spawnBoss();
    }
  }

  spawnBoss() {
    if (this.hasSpawned) {
      return;
    }

    const bossData = getBossForStage(this.stageSystem.stage);
    const spawnPoint = this.getBossSpawnPoint();
    this.boss = new Boss(this.scene, spawnPoint.x, spawnPoint.y, this.player, bossData);
    this.hasSpawned = true;
    this.spawnSystem.addMonster(this.boss);
    this.hpBar.show(this.boss);
    this.showWarning(`${bossData.name} muncul!`);
  }

  handleBossKilled(boss) {
    if (this.isDefeated || boss !== this.boss) {
      return;
    }

    this.isDefeated = true;
    this.hpBar.hide();

    const equipmentDrop = this.rollEquipmentDrop(boss.bossData);

    boss.die(() => {
      this.stageSystem.completeVictory({
        bossGoldReward: boss.bossData.goldReward,
        equipmentDrop
      });
    });
  }

  updateBossAttack() {
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);

    if (distance > this.boss.attackRange || !this.boss.canUseSlam()) {
      return;
    }

    this.boss.resetSlamCooldown();
    this.showSlamArea();

    if (distance <= this.boss.slamArea) {
      this.player.takeDamage(this.boss.damage);
      this.scene.showPlayerHit(this.boss.damage);

      if (this.player.hp <= 0) {
        this.stageSystem.completeDefeat();
      }
    }
  }

  rollEquipmentDrop(bossData) {
    if (Math.random() > bossData.equipmentDropChance) {
      return null;
    }

    const item = Phaser.Utils.Array.GetRandom(equipment);
    addEquipmentToInventory(this.scene, item.id);
    return item;
  }

  getBossSpawnPoint() {
    const camera = this.scene.cameras.main;
    const x = Phaser.Math.Clamp(
      camera.worldView.right + 120,
      this.mapBounds.x + 60,
      this.mapBounds.x + this.mapBounds.width - 60
    );
    const y = Phaser.Math.Clamp(
      camera.worldView.centerY,
      this.mapBounds.y + 60,
      this.mapBounds.y + this.mapBounds.height - 60
    );

    return { x, y };
  }

  showWarning(text) {
    const warning = this.scene.add.text(this.scene.scale.width / 2, 148, text, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '26px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1800);

    this.scene.tweens.add({
      targets: warning,
      y: warning.y - 20,
      alpha: 0,
      duration: 1800,
      ease: 'Cubic.easeOut',
      onComplete: () => warning.destroy()
    });
  }

  showSlamArea() {
    const ring = this.scene.add.circle(this.boss.x, this.boss.y, this.boss.slamArea, 0xf97316, 0.12)
      .setStrokeStyle(4, 0xfb923c, 0.75);

    this.scene.tweens.add({
      targets: ring,
      scale: 1.12,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }
}
