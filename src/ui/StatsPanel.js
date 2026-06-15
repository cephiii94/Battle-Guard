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
    const height = 178;

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
    bgGraphics.lineBetween(x + 12, y + 90, x + width - 12, y + 90);
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
    const matchY = y + 96;
    
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

    // 5. Timeline System Initialization
    this.flashTimer = 0;
    this.flashVisible = true;
    this.timelineSetupComplete = false;
    this.bossIcons = [];

    this.timelineStartX = x + 30;
    this.timelineStartY = y + 154;
    this.timelineBarWidth = 180;

    this.timelineGraphics = scene.add.graphics();
    this.add(this.timelineGraphics);

    this.playerMarker = this.add(
      scene.add.circle(this.timelineStartX, this.timelineStartY, 4.5, 0xffffff, 1)
        .setStrokeStyle(2, 0x00d6ff, 1)
    );

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

    const isBossActive = this.scene && this.scene.bossSystem && this.scene.bossSystem.activeBosses.length > 0;
    const isAlert = isBossActive || (gameMode !== 'campaign' && timeToDisplay <= 15);

    // Timer Alert State
    if (isAlert) {
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

  setupTimeline() {
    if (this.timelineSetupComplete) return;
    if (!this.scene.bossSystem) return;

    this.timelineSetupComplete = true;
    this.bossIcons = [];

    const gameMode = this.scene.gameMode || 'campaign';

    if (gameMode === 'campaign') {
      const interval = this.stageSystem.stage.bossInterval || 60;
      const totalBosses = this.stageSystem.stage.bossCount || 1;
      const totalDuration = totalBosses * interval;

      for (let i = 1; i <= totalBosses; i++) {
        const spawnTime = i * interval;
        const ratio = spawnTime / totalDuration;
        const xPos = this.timelineStartX + this.timelineBarWidth * ratio;

        const icon = this.scene.add.text(xPos, this.timelineStartY - 12, '💀', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          stroke: '#020617',
          strokeThickness: 2.5
        }).setOrigin(0.5, 0.5);

        this.add(icon);
        this.bossIcons.push({ icon, index: i });
      }
    } else if (gameMode === 'looting') {
      const duration = this.stageSystem.stage.duration || 120;
      const xPos = this.timelineStartX + this.timelineBarWidth * (5 / duration);

      const icon = this.scene.add.text(xPos, this.timelineStartY - 12, '💀', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        stroke: '#020617',
        strokeThickness: 2.5
      }).setOrigin(0.5, 0.5);

      this.add(icon);
      this.bossIcons.push({ icon, index: 1 });
    } else if (gameMode === 'survival') {
      const icon = this.scene.add.text(this.timelineStartX + this.timelineBarWidth, this.timelineStartY - 12, '🚩', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        stroke: '#020617',
        strokeThickness: 2.5
      }).setOrigin(0.5, 0.5);

      this.add(icon);
      this.bossIcons.push({ icon, index: 1 });
    }
  }

  update(delta) {
    if (!this.timelineSetupComplete) {
      this.setupTimeline();
    }

    const snapshot = this.stageSystem.getSnapshot();
    if (!snapshot) return;

    const gameMode = this.scene.gameMode || 'campaign';
    const isBossActive = this.scene.bossSystem && this.scene.bossSystem.activeBosses.length > 0;

    // Timer flashing alert
    if (isBossActive) {
      this.flashTimer += delta;
      if (this.flashTimer >= 300) {
        this.flashTimer = 0;
        this.flashVisible = !this.flashVisible;
      }
    } else {
      this.flashVisible = true;
    }

    // Force alert color immediately on timer if boss active
    const timeToDisplay = gameMode === 'campaign' ? (snapshot.elapsedTime || 0) : snapshot.remainingTime;
    const isAlert = isBossActive || (gameMode !== 'campaign' && timeToDisplay <= 15);
    if (isAlert) {
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

    const bossesSpawned = this.scene.bossSystem ? this.scene.bossSystem.bossesSpawned : 0;
    const bossesDefeated = this.scene.bossSystem ? this.scene.bossSystem.bossesDefeated : 0;

    let ratio = 0;

    if (gameMode === 'campaign') {
      const interval = this.stageSystem.stage.bossInterval || 60;
      const totalBosses = this.stageSystem.stage.bossCount || 1;
      const totalDuration = totalBosses * interval;
      const elapsedTime = snapshot.elapsedTime || 0;

      ratio = Phaser.Math.Clamp(elapsedTime / totalDuration, 0, 1);

      if (this.bossIcons) {
        this.bossIcons.forEach((item) => {
          if (item.index <= bossesDefeated) {
            item.icon.setText('✔️');
            item.icon.setColor('#22c55e');
            item.icon.setAlpha(0.7);
          } else if (item.index === bossesSpawned && isBossActive) {
            item.icon.setText('💀');
            item.icon.setColor(this.flashVisible ? '#ef4444' : '#ffffff');
            item.icon.setAlpha(1);
          } else {
            item.icon.setText('💀');
            item.icon.setColor('#cbd5e1');
            item.icon.setAlpha(0.8);
          }
        });
      }
    } else if (gameMode === 'looting') {
      const duration = this.stageSystem.stage.duration || 120;
      const elapsedTime = snapshot.elapsedTime || 0;
      ratio = Phaser.Math.Clamp(elapsedTime / duration, 0, 1);

      if (this.bossIcons) {
        this.bossIcons.forEach((item) => {
          if (bossesDefeated >= 1) {
            item.icon.setText('✔️');
            item.icon.setColor('#22c55e');
            item.icon.setAlpha(0.7);
          } else if (isBossActive) {
            item.icon.setText('💀');
            item.icon.setColor(this.flashVisible ? '#ef4444' : '#ffffff');
            item.icon.setAlpha(1);
          } else {
            item.icon.setText('💀');
            item.icon.setColor('#cbd5e1');
            item.icon.setAlpha(0.85);
          }
        });
      }
    } else if (gameMode === 'survival') {
      const duration = this.stageSystem.stage.duration || 90;
      const elapsedTime = snapshot.elapsedTime || 0;
      ratio = Phaser.Math.Clamp(elapsedTime / duration, 0, 1);

      if (this.bossIcons) {
        this.bossIcons.forEach((item) => {
          if (ratio >= 1.0) {
            item.icon.setColor('#22c55e');
          } else {
            item.icon.setColor('#cbd5e1');
          }
        });
      }
    }

    // 1. Redraw track and fill graphics
    this.timelineGraphics.clear();

    // Background track line (Dark slate)
    this.timelineGraphics.lineStyle(3, 0x1e293b, 0.7);
    this.timelineGraphics.lineBetween(this.timelineStartX, this.timelineStartY, this.timelineStartX + this.timelineBarWidth, this.timelineStartY);

    // Active progress fill line
    if (ratio > 0) {
      const fillColor = isBossActive ? (this.flashVisible ? 0xef4444 : 0x7f1d1d) : 0x0ea5e9; // Cyan active fill color (matching StatsPanel theme)
      this.timelineGraphics.lineStyle(3, fillColor, 1.0);
      this.timelineGraphics.lineBetween(this.timelineStartX, this.timelineStartY, this.timelineStartX + this.timelineBarWidth * ratio, this.timelineStartY);
    }

    // 2. Position Player Marker
    this.playerMarker.x = this.timelineStartX + this.timelineBarWidth * ratio;

    // Change marker color based on alert
    if (isBossActive) {
      this.playerMarker.setFillStyle(this.flashVisible ? 0xef4444 : 0xffffff, 1);
      this.playerMarker.setStrokeStyle(2, 0xffffff, 1);
    } else {
      this.playerMarker.setFillStyle(0xffffff, 1);
      this.playerMarker.setStrokeStyle(2, 0x0ea5e9, 1); // Cyan border
    }
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(1000);
    this.items.push(item);
    return item;
  }
}
