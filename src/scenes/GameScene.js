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
import StageResultOverlay from '../ui/StageResultOverlay.js';
import SkillHud from '../ui/SkillHud.js';
import { soundManager } from '../services/soundManager.js';
import { GameManager } from '../systems/GameManager.js';
import PauseOverlay from '../ui/PauseOverlay.js';
import { renderMap } from '../maps/MapRenderer.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.isGameplayPaused = false;
  }

  init(data) {
    this.gameMode = data.gameMode || 'campaign';
    const rawStage = getStageById(data.stageId || 1);
    
    // Clone stage to avoid mutating global data
    this.stage = { ...rawStage };
    
    if (this.gameMode === 'survival') {
      this.stage.stageName = 'Survival Mode';
      this.stage.duration = 90;
      this.stage.enemyHpMultiplier = (rawStage.enemyHpMultiplier || 1) * 1.35;
      this.stage.enemyDamageMultiplier = (rawStage.enemyDamageMultiplier || 1) * 1.35;
    } else if (this.gameMode === 'gold_farm') {
      this.stage.stageName = 'Gold Farming';
      this.stage.duration = 60;
    } else if (this.gameMode === 'looting') {
      this.stage.stageName = 'Looting Boss';
      this.stage.duration = 120;
      this.stage.enemyHpMultiplier = (rawStage.enemyHpMultiplier || 1) * 1.5;
    }

    this.selectedHero = data.selectedHero || getSelectedHero(this);
    this.selectedHeroBaseStats = data.baseHeroStats || getSelectedHeroBaseStats(this) || baseHeroStats;
    this.equippedItems = data.equippedItems || getEquippedItems(this);
    this.activeSkin = data.activeSkin || skins[0];
    this.heroLevel = data.heroLevel || 1;
    this.finalStats = data.finalStats || calculateFinalStats(
      this.selectedHeroBaseStats, 
      this.equippedItems, 
      this.activeSkin, 
      this.heroLevel, 
      GameManager.get('allocatedStats'), 
      GameManager.get('currentClass')
    );
    this.enemyDamageCooldown = 0;
    this.isStageFinished = false;
    this.isGameplayPaused = false;
    if (this.physics && this.physics.world) {
      this.physics.resume();
    }
  }

  preload() {
    // Assets are preloaded in LoadingScene
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

    renderMap(this, this.mapBounds, this.stage.mapTheme);


    Player.createParticleTexture(this);

    this.player = new Player(
      this,
      this.mapBounds.width / 2,
      this.mapBounds.height / 2,
      this.mapBounds,
      this.finalStats,
      this.activeSkin
    );

    this.gameStats = new GameStats();
    this.stageSystem = new StageSystem(this, this.stage, this.gameStats);
    this.statsPanel = new StatsPanel(this, this.gameStats, this.stageSystem, this.activeSkin);
    this.resultOverlay = new StageResultOverlay(this);
    this.pauseOverlay = new PauseOverlay(this);

    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.handleEscPress());
    this.gameStats.on('levelUp', (level) => {
      this.applyLevelScaling(level);
      soundManager.playSFX(this, 'upgrade');
    });
    this.stageSystem.on('victory', (result) => this.showVictory(result));
    this.stageSystem.on('defeat', (result) => this.showDefeat(result));

    soundManager.playBGM(this, 'battle-bgm');

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.spawnSystem = new SpawnSystem(this, this.player, this.mapBounds, this.stage);
    this.bossSystem = new BossSystem(this, this.player, this.spawnSystem, this.stageSystem, this.mapBounds);
    this.lootSystem = new LootSystem(this, this.player, this.gameStats);
    
    if (this.gameMode === 'gold_farm') {
      this.lootSystem.goldValue = 15;
      this.lootSystem.goldDropChance = 1.0;
    }
    
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

    this.createPauseButton();
    this.createVirtualJoystick();

    this.resizeListener = () => {
      this.createPauseButton();
    };
    this.scale.on('resize', this.resizeListener);

    this.events.once('shutdown', () => {
      this.scale.off('resize', this.resizeListener);
    });
  }

  update(_, delta) {
    if (this.isGameplayPaused) {
      return;
    }

    const monsters = this.spawnSystem ? this.spawnSystem.getMonsters() : [];
    this.player.update(delta, monsters);

    this.spawnSystem.update();
    this.bossSystem.update(delta);
    this.combatSystem.update(delta);
    this.activeSkillSystem.update(delta);
    this.lootSystem.update();
    this.updateEnemyDamage(delta);
    if (this.statsPanel) {
      this.statsPanel.update(delta);
    }
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
      this.selectedHeroBaseStats,
      this.equippedItems,
      this.activeSkin,
      this.heroLevel,
      GameManager.get('allocatedStats'),
      GameManager.get('currentClass')
    );
    const hpIncrease = nextStats.hp - this.finalStats.hp;

    this.finalStats = nextStats;
    this.player.baseDamage = nextStats.damage;
    this.player.attackRange = nextStats.attackRange;
    this.player.healthRegen = nextStats.healthRegen || 0;
    this.player.armor = nextStats.armor || 0;
    this.player.lifesteal = nextStats.lifesteal || 0;
    this.player.evasion = nextStats.evasion || 0;
    this.player.cooldownReduction = nextStats.cooldownReduction || 0;
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

    // Delegate combat calculation to CombatSystem
    this.combatSystem.processPlayerDamage(attacker);
    this.enemyDamageCooldown = 700;

    if (this.player.hp <= 0) {
      this.stageSystem.completeDefeat();
    }
  }

  showPlayerShieldBlock(amount) {
    const shieldText = this.add.text(this.player.x, this.player.y - 74, `-${amount} SHIELD`, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '18px',
      color: '#38bdf8',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: shieldText,
      y: shieldText.y - 28,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => shieldText.destroy()
    });
  }

  showPlayerMiss() {
    const missText = this.add.text(this.player.x, this.player.y - 54, 'MISS', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '18px',
      color: '#60a5fa',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: missText,
      y: missText.y - 28,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => missText.destroy()
    });
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
    soundManager.stopBGM();
    soundManager.playSFX(this, 'victory');
    this.resultOverlay.showVictory(result);
  }

  showDefeat(result) {
    this.isStageFinished = true;
    this.setGameplayPaused(true);
    soundManager.stopBGM();
    soundManager.playSFX(this, 'defeat');
    this.resultOverlay.showDefeat(result);
  }

  handleEscPress() {
    if (this.isStageFinished) {
      return;
    }

    if (this.pauseOverlay.isShown) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  pauseGame() {
    this.setGameplayPaused(true);
    this.pauseOverlay.show(
      () => this.resumeGame(),
      () => this.restartGame(),
      () => this.exitToMainMenu()
    );
  }

  resumeGame() {
    this.pauseOverlay.hide();
    this.setGameplayPaused(false);
  }

  restartGame() {
    this.pauseOverlay.hide();
    this.scene.start('LoadingScene', {
      stageId: Number(this.stage.stageId),
      gameMode: this.gameMode,
      selectedHero: this.selectedHero,
      baseHeroStats: this.baseHeroStats,
      equippedItems: this.equippedItems,
      activeSkin: this.activeSkin,
      finalStats: this.finalStats,
      heroLevel: this.heroLevel
    });
  }

  exitToMainMenu() {
    this.pauseOverlay.hide();
    soundManager.stopBGM();
    this.scene.start('MainMenuScene');
  }

  createPauseButton() {
    if (this.pauseBtnContainer) {
      this.pauseBtnContainer.destroy();
    }

    const { width, height } = this.scale;
    const isPortrait = height > width;

    let x, y;
    if (isPortrait) {
      x = width - 36;
      y = 36;
    } else {
      // In landscape, put it to the left of Skill HUD
      const slotSize = 36;
      const gap = 8;
      const panelW = 5 * slotSize + 4 * gap + 16; // 228
      x = width - panelW - 40;
      y = 10 + 26; // Center of Skill HUD vertically
    }

    const container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setDepth(2000);

    const bg = this.add.circle(0, 0, 18, 0x07111f, 0.9);
    bg.setStrokeStyle(1.5, 0x0ea5e9, 0.85);
    bg.setInteractive({ useHandCursor: true });

    const pauseIcon = this.add.text(0, 0, '⏸', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#00d6ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, pauseIcon]);

    bg.on('pointerover', () => {
      container.setScale(1.1);
      if (soundManager) soundManager.playSFX(this, 'hover');
    });
    bg.on('pointerout', () => {
      container.setScale(1.0);
    });
    bg.on('pointerup', () => {
      if (soundManager) soundManager.playSFX(this, 'click');
      this.handleEscPress();
    });

    this.pauseBtnContainer = container;
  }

  createVirtualJoystick() {
    this.joystickActive = false;
    this.joystickDirection = null;

    // Outer background circle (translucent with neon cyan border)
    const joystickBg = this.add.graphics();
    joystickBg.fillStyle(0x07111f, 0.45);
    joystickBg.lineStyle(2.5, 0x00d6ff, 0.75);
    joystickBg.fillCircle(0, 0, 52);
    joystickBg.strokeCircle(0, 0, 52);

    // Inner thumb stick circle (translucent neon cyan)
    const joystickThumb = this.add.graphics();
    joystickThumb.fillStyle(0x00d6ff, 0.7);
    joystickThumb.fillCircle(0, 0, 22);

    // Container for dynamic positioning
    this.joystickContainer = this.add.container(0, 0);
    this.joystickContainer.add([joystickBg, joystickThumb]);
    this.joystickContainer.setScrollFactor(0);
    this.joystickContainer.setDepth(3000);
    this.joystickContainer.setVisible(false);

    this.joystickThumbObj = joystickThumb;

    // Pointer event listeners for dynamic spawn joystick on click/touch
    this.input.on('pointerdown', (pointer) => {
      if (this.isGameplayPaused || this.isStageFinished) return;

      // Ignore clicking near the Pause Button
      if (this.pauseBtnContainer) {
        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.pauseBtnContainer.x, this.pauseBtnContainer.y);
        if (dist < 40) return;
      }

      this.joystickActive = true;
      this.joystickBase = new Phaser.Math.Vector2(pointer.x, pointer.y);
      this.joystickContainer.setPosition(pointer.x, pointer.y);
      this.joystickThumbObj.setPosition(0, 0);
      this.joystickContainer.setVisible(true);
      this.joystickDirection = new Phaser.Math.Vector2(0, 0);
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.joystickActive) return;

      const deltaX = pointer.x - this.joystickBase.x;
      const deltaY = pointer.y - this.joystickBase.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const maxDistance = 45;

      if (distance === 0) {
        this.joystickDirection.set(0, 0);
        this.joystickThumbObj.setPosition(0, 0);
      } else {
        const angle = Math.atan2(deltaY, deltaX);
        const clampDist = Math.min(distance, maxDistance);

        const stickX = Math.cos(angle) * clampDist;
        const stickY = Math.sin(angle) * clampDist;
        this.joystickThumbObj.setPosition(stickX, stickY);

        this.joystickDirection.set(Math.cos(angle), Math.sin(angle));
      }
    });

    this.input.on('pointerup', () => {
      this.joystickActive = false;
      this.joystickContainer.setVisible(false);
      this.joystickDirection = null;
    });
  }
}
