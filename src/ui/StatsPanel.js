import Phaser from 'phaser';

export default class StatsPanel {
  constructor(scene, gameStats, stageSystem, activeSkin) {
    this.scene = scene;
    this.gameStats = gameStats;
    this.stageSystem = stageSystem;
    this.activeSkin = activeSkin;
    this.items = [];

    const x = 16;
    const y = 16;
    const width = 240;
    const height = 150;

    // 1. Super Compact Glassmorphic Background Panel
    const bgGraphics = scene.add.graphics();
    bgGraphics.fillStyle(0x07111f, 0.92);
    bgGraphics.fillRoundedRect(x, y, width, height, 12);
    bgGraphics.lineStyle(1.5, 0x0ea5e9, 0.85); // Neon cyan border
    bgGraphics.strokeRoundedRect(x, y, width, height, 12);
    
    // Top highlight line
    bgGraphics.fillStyle(0x38bdf8, 0.4);
    bgGraphics.fillRoundedRect(x + 8, y + 4, width - 16, 1.5, 1);

    // Separator line between Hero Info and Match Info
    bgGraphics.lineStyle(1.2, 0x1e293b, 0.7);
    bgGraphics.lineBetween(x + 12, y + 80, x + width - 12, y + 80);
    this.add(bgGraphics);

    // 2. Compact Avatar ring & frame
    const avatarX = x + 28;
    const avatarY = y + 42;
    const skinColor = activeSkin.colors.border || 0x38bdf8;
    
    const avatarBg = scene.add.circle(avatarX, avatarY, 20, 0x111e30, 1);
    avatarBg.setStrokeStyle(2, skinColor, 0.9);
    this.add(avatarBg);

    // Visual Avatar (Skin Sprite/Image)
    const visualKey = activeSkin.assetKey || (scene.selectedHero && scene.selectedHero.assetKey);
    if (visualKey && scene.textures.exists(visualKey)) {
      this.avatarImg = scene.add.image(avatarX, avatarY, visualKey).setDisplaySize(30, 30);
      this.add(this.avatarImg);
    } else {
      this.avatarImg = scene.add.circle(avatarX, avatarY, 12, activeSkin.colors.hero || 0x2f6dff, 1);
      this.add(this.avatarImg);
    }

    // Pulse animation on avatar frame
    scene.tweens.add({
      targets: avatarBg,
      alpha: 0.75,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3. Level Text
    this.lvText = this.add(scene.add.text(x + 58, y + 14, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '11px',
      color: '#38bdf8',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2.5
    }));

    // EXP Progress Bar (Compact Width)
    const expBarX = x + 58;
    const expBarY = y + 32;
    this.expBarWidth = 166;
    this.expBarHeight = 7;

    const expBg = scene.add.graphics();
    expBg.fillStyle(0x1e293b, 1);
    expBg.fillRoundedRect(expBarX, expBarY, this.expBarWidth, this.expBarHeight, 3.5);
    this.add(expBg);

    this.expFill = scene.add.graphics();
    this.add(this.expFill);

    this.expText = this.add(scene.add.text(x + 58, y + 43, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#94a3b8',
      fontStyle: 'bold'
    }));

    // Gold Display
    this.goldText = this.add(scene.add.text(x + 152, y + 43, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '11px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2.5
    }));

    // 4. Match Statistics Section (Lower Half, Compact)
    const matchY = y + 88;
    
    // Stage Title
    this.matchStageText = this.add(scene.add.text(x + 14, matchY + 2, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '10.5px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2.5
    }));

    // Timer
    this.matchTimerText = this.add(scene.add.text(x + 14, matchY + 22, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '15px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2.5
    }));

    // Kills
    this.matchKillsText = this.add(scene.add.text(x + 130, matchY + 2, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '10.5px',
      color: '#f87171',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2.5
    }));

    // Gold Earned in Stage
    this.matchGoldText = this.add(scene.add.text(x + 130, matchY + 22, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '10.5px',
      color: '#fbbf24',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2.5
    }));

    // Listeners
    this.gameStats.on('stats', (stats) => this.updateHeroStats(stats));
    this.stageSystem.on('tick', (snapshot) => this.updateMatchStats(snapshot));
    this.gameStats.on('killCount', () => this.updateMatchStats(this.stageSystem.getSnapshot()));
    this.gameStats.on('gold', () => this.updateMatchStats(this.stageSystem.getSnapshot()));

    // Initial population
    this.updateHeroStats({
      level: this.gameStats.level,
      exp: this.gameStats.exp,
      expToNextLevel: this.gameStats.getExpToNextLevel(),
      gold: this.gameStats.gold
    });
    this.updateMatchStats(this.stageSystem.getSnapshot());
  }

  updateHeroStats(stats) {
    this.lvText.setText(`LEVEL ${stats.level}`);
    this.expText.setText(`EXP ${stats.exp}/${stats.expToNextLevel}`);
    this.goldText.setText(`🪙 ${stats.gold.toLocaleString()}`);

    // Update EXP Progress Bar Fill
    const ratio = Phaser.Math.Clamp(stats.exp / stats.expToNextLevel, 0, 1);
    const expBarX = 16 + 58;
    const expBarY = 16 + 32;

    this.expFill.clear();
    if (ratio > 0) {
      this.expFill.fillStyle(0xa855f7, 0.9); // Violet exp bar
      this.expFill.fillRoundedRect(expBarX, expBarY, this.expBarWidth * ratio, this.expBarHeight, 3.5);
    }
  }

  updateMatchStats(snapshot) {
    if (!snapshot) return;

    this.matchStageText.setText(`🚩 ${snapshot.stage.stageName.toUpperCase()}`);

    const gameMode = this.scene.gameMode || 'campaign';
    const timeToDisplay = gameMode === 'campaign' ? (snapshot.elapsedTime || 0) : snapshot.remainingTime;
    this.matchTimerText.setText(`⏱️ ${this.formatTime(timeToDisplay)}`);

    // Timer Alert State
    if (gameMode !== 'campaign' && timeToDisplay <= 15) {
      this.matchTimerText.setColor('#ef4444');
      if (!this.timerPulsing) {
        this.timerPulsing = true;
        this.scene.tweens.add({
          targets: this.matchTimerText,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 350,
          yoyo: true,
          repeat: -1
        });
      }
    } else {
      this.matchTimerText.setColor('#facc15');
      if (this.timerPulsing) {
        this.timerPulsing = false;
        this.scene.tweens.killTweensOf(this.matchTimerText);
        this.matchTimerText.setScale(1);
      }
    }

    this.matchKillsText.setText(`💀 Kills: ${snapshot.kills}`);
    this.matchGoldText.setText(`🪙 Stage: +${snapshot.temporaryGold}`);
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
