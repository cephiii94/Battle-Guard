import Phaser from 'phaser';
import { getBossForStage } from '../data/bosses.js';
import Boss from '../entities/Boss.js';
import BossHpBar from '../ui/BossHpBar.js';
import EffectSystem from './EffectSystem.js';

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

    this.bossesSpawned = 0;
    this.bossesDefeated = 0;
    this.activeBosses = [];

    const gameMode = scene.gameMode || 'campaign';
    const isBossMode = gameMode === 'campaign' || gameMode === 'looting';
    stageSystem.setTimerVictoryBlocked(isBossMode);
    stageSystem.on('tick', (snapshot) => this.handleStageTick(snapshot));
  }

  update(delta) {
    if (this.activeBosses.length === 0) {
      return;
    }

    this.hpBar.update();
    
    this.activeBosses.forEach((boss) => {
      if (boss && boss.active && !boss.isDead) {
        this.updateBossAttack(boss, delta);
      }
    });
  }

  handleStageTick(snapshot) {
    const gameMode = this.scene.gameMode || 'campaign';
    
    if (gameMode === 'campaign') {
      const totalBosses = this.stageSystem.stage.bossCount || 1;
      const interval = this.stageSystem.stage.bossInterval || 60;
      const nextSpawnTime = (this.bossesSpawned + 1) * interval;
      
      if (this.bossesSpawned < totalBosses && snapshot.elapsedTime >= nextSpawnTime) {
        this.spawnBoss();
      }
      return;
    }

    const isBossMode = gameMode === 'campaign' || gameMode === 'looting';
    if (!isBossMode) {
      return;
    }

    const threshold = gameMode === 'looting' ? (this.stageSystem.stage.duration - 5) : this.spawnThreshold;
    if (
      !this.hasSpawned &&
      !this.stageSystem.isFinished &&
      snapshot.remainingTime <= threshold
    ) {
      this.spawnBoss();
    }
  }

  spawnBoss() {
    const gameMode = this.scene.gameMode || 'campaign';
    if (gameMode !== 'campaign' && this.hasSpawned) {
      return;
    }

    const bossData = getBossForStage(this.stageSystem.stage);
    const spawnPoint = this.getBossSpawnPoint();
    const newBoss = new Boss(this.scene, spawnPoint.x, spawnPoint.y, this.player, bossData);
    
    this.bossesSpawned++;
    this.hasSpawned = true;
    this.activeBosses.push(newBoss);
    
    // Default current tracked boss for health bar
    this.boss = newBoss;
    
    this.spawnSystem.addMonster(newBoss);
    this.hpBar.show(newBoss);
    this.showWarning(`${bossData.name} muncul!`);
  }

  handleBossKilled(boss) {
    const index = this.activeBosses.indexOf(boss);
    if (index !== -1) {
      this.activeBosses.splice(index, 1);
    }
    
    this.bossesDefeated++;

    // Trigger Boss Death Particles!
    EffectSystem.createBossDeathEffect(this.scene, boss.x, boss.y);

    const { equipmentDrop, materialDrops } = this.scene.lootSystem.rollBossLoot(boss);

    if (this.boss === boss) {
      if (this.activeBosses.length > 0) {
        this.boss = this.activeBosses[0];
        this.hpBar.show(this.boss);
      } else {
        this.boss = null;
        this.hpBar.hide();
      }
    }

    const totalBossesToDefeat = (this.scene.gameMode || 'campaign') === 'campaign' ? (this.stageSystem.stage.bossCount || 1) : 1;

    boss.die(() => {
      if (this.bossesDefeated >= totalBossesToDefeat) {
        this.isDefeated = true;
        this.stageSystem.completeVictory({
          bossGoldReward: boss.bossData.goldReward,
          equipmentDrop,
          materialDrops
        });
      }
    });
  }

  updateBossAttack(boss, delta) {
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y);

    if (distance > boss.attackRange || !boss.canUseSlam()) {
      return;
    }

    boss.resetSlamCooldown();
    this.showSlamArea(boss);

    if (distance <= boss.slamArea) {
      this.player.takeDamage(boss.damage);
      this.scene.showPlayerHit(boss.damage);

      if (this.player.hp <= 0) {
        this.stageSystem.completeDefeat();
      }
    }
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

  showSlamArea(boss) {
    const ring = this.scene.add.circle(boss.x, boss.y, boss.slamArea, 0xf97316, 0.12)
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
