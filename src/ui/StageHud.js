import Phaser from 'phaser';

export default class StageHud {
  constructor(scene, stageSystem, gameStats) {
    this.scene = scene;
    this.stageSystem = stageSystem;
    this.gameStats = gameStats;
    this.items = [];

    const width = 480;
    const height = 64;
    const x = 640 - width / 2; // Center at 640
    const y = 14;

    // 1. Top Center Glassmorphic HUD Bar
    const bgGraphics = scene.add.graphics();
    bgGraphics.fillStyle(0x07111f, 0.92);
    bgGraphics.fillRoundedRect(x, y, width, height, 12);
    bgGraphics.lineStyle(2, 0x38bdf8, 0.85); // Light blue border
    bgGraphics.strokeRoundedRect(x, y, width, height, 12);
    
    // Add top highlighted highlight strip
    bgGraphics.fillStyle(0x38bdf8, 0.4);
    bgGraphics.fillRoundedRect(x + 10, y + 4, width - 20, 2, 1);
    this.add(bgGraphics);

    // 2. Info Elements
    // Stage Text (Left segment)
    this.stageText = this.add(scene.add.text(x + 24, y + height / 2, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '17px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 3
    }).setOrigin(0, 0.5));

    // Timer Text (Center segment, highlighted)
    this.timerText = this.add(scene.add.text(640, y + height / 2, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '24px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5));

    // Stats: Kills and Gold (Right segment, stacked or side-by-side)
    // Let's stack them nicely
    this.killsText = this.add(scene.add.text(x + 340, y + 16, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '14px',
      color: '#f87171',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 3
    }).setOrigin(0, 0.5));

    this.goldText = this.add(scene.add.text(x + 340, y + 46, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '14px',
      color: '#fbbf24',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 3
    }).setOrigin(0, 0.5));

    stageSystem.on('tick', (snapshot) => this.update(snapshot));
    gameStats.on('killCount', () => this.update(stageSystem.getSnapshot()));
    gameStats.on('gold', () => this.update(stageSystem.getSnapshot()));
    this.update(stageSystem.getSnapshot());
  }

  update(snapshot) {
    if (!snapshot) return;
    
    this.stageText.setText(`🚩 ${snapshot.stage.stageName.toUpperCase()}`);
    
    const gameMode = this.scene.gameMode || 'campaign';
    const timeToDisplay = gameMode === 'campaign' ? (snapshot.elapsedTime || 0) : snapshot.remainingTime;
    
    this.timerText.setText(`⏱️ ${this.formatTime(timeToDisplay)}`);
    
    // Change timer color based on time or warning states
    if (gameMode !== 'campaign' && timeToDisplay <= 15) {
      this.timerText.setColor('#ef4444'); // Red flashing/alert
      // Add a scale pulse effect if not already pulsing
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
