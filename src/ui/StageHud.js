import Phaser from 'phaser';

export default class StageHud {
  constructor(scene, stageSystem, gameStats) {
    this.scene = scene;
    this.stageSystem = stageSystem;
    this.gameStats = gameStats;
    this.items = [];

    this.buildPanel();

    const tickHandler = (snapshot) => this.update(snapshot);
    const killHandler = () => this.update(stageSystem.getSnapshot());
    const goldHandler = () => this.update(stageSystem.getSnapshot());

    stageSystem.on('tick', tickHandler);
    gameStats.on('killCount', killHandler);
    gameStats.on('gold', goldHandler);

    this.resizeListener = () => this.rebuild();
    this.scene.scale.on('resize', this.resizeListener);

    this.scene.events.once('shutdown', () => {
      this.scene.scale.off('resize', this.resizeListener);
      this.stageSystem.off('tick', tickHandler);
      this.gameStats.off('killCount', killHandler);
      this.gameStats.off('gold', goldHandler);
    });
  }

  clearPanel() {
    this.items.forEach((item) => {
      if (item && item.destroy) {
        item.destroy();
      }
    });
    this.items = [];
  }

  rebuild() {
    this.clearPanel();
    this.buildPanel();
  }

  buildPanel() {
    const scene = this.scene;
    const scaleFactor = Math.min(scene.scale.width / 1280, scene.scale.height / 720, 1.0);
    this.scaleFactor = scaleFactor;

    // In portrait, narrow the bar width to fit mobile screens
    const width = Math.min(480 * scaleFactor, scene.scale.width - 24);
    const height = 54 * scaleFactor;
    const x = (scene.scale.width - width) / 2;
    const y = 10;

    // 1. Top Center Glassmorphic HUD Bar
    const bgGraphics = scene.add.graphics();
    bgGraphics.fillStyle(0x07111f, 0.92);
    bgGraphics.fillRoundedRect(x, y, width, height, 12 * scaleFactor);
    bgGraphics.lineStyle(2 * scaleFactor, 0x38bdf8, 0.85); // Light blue border
    bgGraphics.strokeRoundedRect(x, y, width, height, 12 * scaleFactor);
    
    // Add top highlighted highlight strip
    bgGraphics.fillStyle(0x38bdf8, 0.4);
    bgGraphics.fillRoundedRect(x + 10 * scaleFactor, y + 4 * scaleFactor, width - 20 * scaleFactor, 2 * scaleFactor, 1 * scaleFactor);
    this.add(bgGraphics);

    // 2. Info Elements
    // Stage Text (Left segment)
    this.stageText = this.add(scene.add.text(x + 16 * scaleFactor, y + height / 2, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: `${13 * scaleFactor}px`,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 3 * scaleFactor
    }).setOrigin(0, 0.5));

    // Timer Text (Center segment, highlighted)
    this.timerText = this.add(scene.add.text(scene.scale.width / 2, y + height / 2, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: `${18 * scaleFactor}px`,
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 4 * scaleFactor
    }).setOrigin(0.5, 0.5));

    // Stats: Kills and Gold (Right segment, stacked)
    this.killsText = this.add(scene.add.text(x + width - 90 * scaleFactor, y + 14 * scaleFactor, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: `${11 * scaleFactor}px`,
      color: '#f87171',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 3 * scaleFactor
    }).setOrigin(0, 0.5));

    this.goldText = this.add(scene.add.text(x + width - 90 * scaleFactor, y + 38 * scaleFactor, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: `${11 * scaleFactor}px`,
      color: '#fbbf24',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 3 * scaleFactor
    }).setOrigin(0, 0.5));

    this.update(this.stageSystem.getSnapshot());
  }

  update(snapshot) {
    if (!snapshot || !this.stageText) return;
    
    this.stageText.setText(`🚩 ${snapshot.stage.stageName.toUpperCase()}`);
    
    const gameMode = this.scene.gameMode || 'campaign';
    const timeToDisplay = gameMode === 'campaign' ? (snapshot.elapsedTime || 0) : snapshot.remainingTime;
    
    this.timerText.setText(`⏱️ ${this.formatTime(timeToDisplay)}`);
    
    // Change timer color based on time or warning states
    if (gameMode !== 'campaign' && timeToDisplay <= 15) {
      this.timerText.setColor('#ef4444'); // Red flashing/alert
      // Add scale pulse effect if not already pulsing
      if (!this.timerPulsing) {
        this.timerPulsing = true;
        this.scene.tweens.add({
          targets: this.timerText,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 350,
          yoyo: true,
          repeat: -1
        });
      }
    } else {
      this.timerText.setColor('#facc15');
      if (this.timerPulsing) {
        this.timerPulsing = false;
        this.scene.tweens.killTweensOf(this.timerText);
        this.timerText.setScale(1);
      }
    }

    this.killsText.setText(`💀 ${snapshot.kills}`);
    this.goldText.setText(`🪙 ${snapshot.temporaryGold}`);
  }

  formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(1000);
    this.items.push(item);
    return item;
  }
}
