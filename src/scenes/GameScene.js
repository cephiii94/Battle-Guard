import Phaser from 'phaser';
import Player from '../entities/Player.js';
import baseHeroStats from '../data/baseHero.js';
import skins from '../data/skins.js';
import CombatSystem from '../systems/CombatSystem.js';
import GameStats from '../systems/GameStats.js';
import { calculateFinalStats } from '../systems/HeroStats.js';
import LootSystem from '../systems/LootSystem.js';
import SpawnSystem from '../systems/SpawnSystem.js';
import UpgradeSystem from '../systems/UpgradeSystem.js';
import StatsPanel from '../ui/StatsPanel.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.isGameplayPaused = false;
  }

  init(data) {
    this.baseHeroStats = data.baseHeroStats || baseHeroStats;
    this.equippedItems = data.equippedItems || [];
    this.activeSkin = data.activeSkin || skins[0];
    this.finalStats = data.finalStats || calculateFinalStats(
      this.baseHeroStats,
      this.equippedItems,
      this.activeSkin,
      1
    );
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
    this.gameStats.on('levelUp', (level) => this.applyLevelScaling(level));

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.spawnSystem = new SpawnSystem(this, this.player, this.mapBounds);
    this.lootSystem = new LootSystem(this, this.player, this.gameStats);
    this.combatSystem = new CombatSystem(
      this,
      this.player,
      this.spawnSystem,
      this.gameStats,
      this.lootSystem
    );
    this.upgradeSystem = new UpgradeSystem(this, this.player, this.gameStats);
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
    this.combatSystem.update(delta);
    this.lootSystem.update();
  }

  setGameplayPaused(isPaused) {
    this.isGameplayPaused = isPaused;
    this.spawnSystem.setPaused(isPaused);

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

    if (hpIncrease > 0) {
      this.player.maxHp += hpIncrease;
      this.player.hp += hpIncrease;
    }
  }
}
