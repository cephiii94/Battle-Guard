import Phaser from 'phaser';
import Player from '../entities/Player.js';
import baseHeroStats from '../data/baseHero.js';
import skills from '../data/skills.js';
import skins from '../data/skins.js';
import { getStageById } from '../data/stages.js';
import { getEquippedItems } from '../systems/EquipmentInventory.js';
import { getSelectedHero, getSelectedHeroBaseStats } from '../systems/HeroSelection.js';
import ActiveSkillSystem from '../systems/ActiveSkillSystem.js';
import BossSystem from '../systems/BossSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import GameStats from '../systems/GameStats.js';
import { calculateFinalStats } from '../systems/HeroStats.js';
import LootSystem from '../systems/LootSystem.js';
import SpawnSystem from '../systems/SpawnSystem.js';
import StageSystem from '../systems/StageSystem.js';
import StatsPanel from '../ui/StatsPanel.js';
import StageHud from '../ui/StageHud.js';
import StageResultOverlay from '../ui/StageResultOverlay.js';
import SkillHud from '../ui/SkillHud.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.isGameplayPaused = false;
  }

  init(data) {
    this.stage = getStageById(data.stageId || 1);
    this.selectedHero = data.selectedHero || getSelectedHero(this);
    this.baseHeroStats = data.baseHeroStats || getSelectedHeroBaseStats(this) || baseHeroStats;
    this.equippedItems = data.equippedItems || getEquippedItems(this);
    this.activeSkin = data.activeSkin || skins[0];
    this.finalStats = data.finalStats || calculateFinalStats(
      this.baseHeroStats,
      this.equippedItems,
      this.activeSkin,
      1
    );
    this.enemyDamageCooldown = 0;
    this.isStageFinished = false;
  }

  preload() {
    skills.forEach((skill) => {
      this.load.svg(skill.assetKey, skill.assetPath, { width: 96, height: 96 });
    });
  }

  create() {
    this.mapBounds = {
      x: 0,
      y: 0,
      width: 2000,
      height: 1400
    };

    this.cameras.main.setBackgroundColor('#08111f');
    this.cameras.main.setBounds(
      this.mapBounds.x,
      this.mapBounds.y,
      this.mapBounds.width,
      this.mapBounds.height
    );
    this.physics.world.setBounds(
      this.mapBounds.x,
      this.mapBounds.y,
      this.mapBounds.width,
      this.mapBounds.height
    );

    this.add.rectangle(
      this.mapBounds.width / 2,
      this.mapBounds.height / 2,
      this.mapBounds.width,
      this.mapBounds.height,
      0x182536
    );

    this.drawArena();

    this.player = new Player(
      this,
      this.mapBounds.width / 2,
      this.mapBounds.height / 2,
      this.mapBounds,
      this.finalStats,
      this.activeSkin
    );

    this.gameStats = new GameStats();
    this.statsPanel = new StatsPanel(this, this.gameStats, this.activeSkin);
    this.stageSystem = new StageSystem(this, this.stage, this.gameStats);
    this.stageHud = new StageHud(this, this.stageSystem, this.gameStats);
    this.resultOverlay = new StageResultOverlay(this);
    this.gameStats.on('levelUp', (level) => this.applyLevelScaling(level));
    this.stageSystem.on('victory', (result) => this.showVictory(result));
    this.stageSystem.on('defeat', (result) => this.showDefeat(result));

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.spawnSystem = new SpawnSystem(this, this.player, this.mapBounds, this.stage);
    this.bossSystem = new BossSystem(this, this.player, this.spawnSystem, this.stageSystem, this.mapBounds);
    this.lootSystem = new LootSystem(this, this.player, this.gameStats);
    this.combatSystem = new CombatSystem(
      this,
      this.player,
      this.spawnSystem,
      this.gameStats,
      this.lootSystem
    );
    this.activeSkillSystem = new ActiveSkillSystem(
      this,
      this.player,
      this.spawnSystem,
      this.combatSystem,
      this.gameStats
    );
    this.skillHud = new SkillHud(this, this.activeSkillSystem);
  }

  drawArena() {
    const gridColor = 0x26384f;
    for (let x = 0; x <= this.mapBounds.width; x += 120) {
      this.add.line(0, 0, x, 0, x, this.mapBounds.height, gridColor, 0.32);
    }
    for (let y = 0; y <= this.mapBounds.height; y += 120) {
      this.add.line(0, 0, 0, y, this.mapBounds.width, y, gridColor, 0.32);
    }

    this.add.rectangle(this.mapBounds.width / 2, this.mapBounds.height / 2, this.mapBounds.width - 70, this.mapBounds.height - 70, 0xffffff, 0)
      .setStrokeStyle(6, 0xf59e0b, 0.35);
    this.add.rectangle(this.mapBounds.width / 2, this.mapBounds.height / 2, this.mapBounds.width - 150, this.mapBounds.height - 150, 0xffffff, 0)
      .setStrokeStyle(2, 0x38bdf8, 0.28);

    this.add.text(this.mapBounds.width / 2, 150, 'BATTLE GUARD', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '62px',
      color: '#f8fafc',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(this.mapBounds.width / 2, 210, 'Hold the line', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '22px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 5
    }).setOrigin(0.5);
  }

  update(_, delta) {
    if (this.isGameplayPaused) {
      return;
    }

    this.player.update(delta);
    this.spawnSystem.update();
    this.bossSystem.update(delta);
    this.combatSystem.update(delta);
    this.activeSkillSystem.update(delta);
    this.lootSystem.update();
    this.updateEnemyDamage(delta);
  }

  setGameplayPaused(isPaused) {
    this.isGameplayPaused = isPaused;
    this.spawnSystem.setPaused(isPaused);
    this.stageSystem.setPaused(isPaused);

    if (isPaused) {
      this.physics.pause();
    } else {
      this.physics.resume();
    }
  }

  applyLevelScaling(level) {
    const nextStats = calculateFinalStats(
      this.baseHeroStats,
      this.equippedItems,
      this.activeSkin,
      level
    );
    const hpIncrease = nextStats.hp - this.finalStats.hp;

    this.finalStats = nextStats;
    this.player.baseDamage = nextStats.damage;
    this.player.attackRange = nextStats.attackRange;
    this.combatSystem.attackRadius = nextStats.attackRange;
    this.combatSystem.baseDamage = nextStats.damage;

    if (hpIncrease > 0) {
      this.player.maxHp += hpIncrease;
      this.player.hp += hpIncrease;
    }
  }

  updateEnemyDamage(delta) {
    this.enemyDamageCooldown = Math.max(0, this.enemyDamageCooldown - delta);

    if (this.enemyDamageCooldown > 0) {
      return;
    }

    const attacker = this.spawnSystem.getMonsters().find((monster) => (
      Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y) <= this.player.radius + monster.displayWidth / 2
    ));

    if (!attacker) {
      return;
    }

    this.player.takeDamage(attacker.damage);
    this.showPlayerHit(attacker.damage);
    this.enemyDamageCooldown = 700;

    if (this.player.hp <= 0) {
      this.stageSystem.completeDefeat();
    }
  }

  showPlayerHit(damage) {
    const hpText = this.add.text(this.player.x, this.player.y - 54, `-${damage} HP`, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '18px',
      color: '#f87171',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hpText,
      y: hpText.y - 28,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => hpText.destroy()
    });
  }

  showVictory(result) {
    this.isStageFinished = true;
    this.setGameplayPaused(true);
    this.resultOverlay.showVictory(result);
  }

  showDefeat(result) {
    this.isStageFinished = true;
    this.setGameplayPaused(true);
    this.resultOverlay.showDefeat(result);
  }
}
