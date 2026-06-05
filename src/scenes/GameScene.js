import Phaser from 'phaser';
import Player from '../entities/Player.js';
import CombatSystem from '../systems/CombatSystem.js';
import GameStats from '../systems/GameStats.js';
import LootSystem from '../systems/LootSystem.js';
import SpawnSystem from '../systems/SpawnSystem.js';
import UpgradeSystem from '../systems/UpgradeSystem.js';
import StatsPanel from '../ui/StatsPanel.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.isGameplayPaused = false;
  }

  create() {
    this.mapBounds = {
      x: 0,
      y: 0,
      width: 2000,
      height: 1400
    };

    this.cameras.main.setBackgroundColor('#111827');
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
      0x334155
    );

    this.add.text(this.mapBounds.width / 2, 160, 'Battle Guard', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.player = new Player(
      this,
      this.mapBounds.width / 2,
      this.mapBounds.height / 2,
      this.mapBounds
    );

    this.gameStats = new GameStats();
    this.statsPanel = new StatsPanel(this, this.gameStats);

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
}
