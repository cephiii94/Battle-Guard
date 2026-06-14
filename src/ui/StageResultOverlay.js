import { soundManager } from '../services/soundManager.js';

export default class StageResultOverlay {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.backdrop = null;
  }

  showVictory(result) {
    this.clear();
    
    // 1. Semi-transparent backdrop
    this.backdrop = this.add(this.scene.add.rectangle(640, 360, 1280, 720, 0x020617, 0.75));

    // 2. Panel Background Box (Gold border for victory)
    const panelWidth = 540;
    const panelHeight = 480;
    const panelBg = this.add(this.scene.add.rectangle(640, 360, panelWidth, panelHeight, 0x0f172a, 0.98))
      .setStrokeStyle(3, 0xfacc15, 0.9);

    // Visual accent light line
    const panelAccent = this.add(this.scene.add.graphics());
    panelAccent.fillStyle(0xfde047, 0.4);
    panelAccent.fillRoundedRect(640 - panelWidth / 2 + 16, 360 - panelHeight / 2 + 6, panelWidth - 32, 3, 1.5);

    // 3. Header Title (VICTORY)
    const title = this.add(this.scene.add.text(640, 180, 'VICTORY', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '48px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 8
    }).setOrigin(0.5));

    // Pulsing animation for title
    this.scene.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle
    const gameMode = result.gameMode || 'campaign';
    const subTitleText = result.stage.stageName.toUpperCase() + ` (${gameMode.replace('_', ' ').toUpperCase()})`;
    this.add(this.scene.add.text(640, 230, subTitleText, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '15px',
      color: '#94a3b8',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Stats Grid Box Left
    const gridLeftX = 640 - 120;
    const gridY = 340;
    const gridW = 210;
    const gridH = 150;

    const leftBox = this.add(this.scene.add.graphics());
    leftBox.fillStyle(0x1e293b, 0.6);
    leftBox.fillRoundedRect(gridLeftX - gridW/2, gridY - gridH/2, gridW, gridH, 8);
    leftBox.lineStyle(1.5, 0x334155, 0.8);
    leftBox.strokeRoundedRect(gridLeftX - gridW/2, gridY - gridH/2, gridW, gridH, 8);

    this.add(this.scene.add.text(gridLeftX, gridY - 50, 'STAGE STATISTICS', {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '11px',
      color: '#38bdf8',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    this.add(this.scene.add.text(gridLeftX, gridY - 10, `💀 Kills: ${result.kills}`, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '14px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    const goldEarned = result.temporaryGold;
    this.add(this.scene.add.text(gridLeftX, gridY + 20, `🪙 Found: +${goldEarned}`, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '14px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Rewards Grid Box Right
    const gridRightX = 640 + 120;
    const rightBox = this.add(this.scene.add.graphics());
    rightBox.fillStyle(0x1e293b, 0.6);
    rightBox.fillRoundedRect(gridRightX - gridW/2, gridY - gridH/2, gridW, gridH, 8);
    rightBox.lineStyle(1.5, 0xfacc15, 0.5);
    rightBox.strokeRoundedRect(gridRightX - gridW/2, gridY - gridH/2, gridW, gridH, 8);

    this.add(this.scene.add.text(gridRightX, gridY - 50, 'REWARDS EARNED', {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '11px',
      color: '#facc15',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    const rewardGold = result.stageGoldReward || result.goldReward || 0;
    const bossGold = result.bossGoldReward || 0;
    const totalGoldGained = rewardGold + bossGold;

    this.add(this.scene.add.text(gridRightX, gridY - 15, `Gold Bonus: +${totalGoldGained}`, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '13px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // EXP
    this.add(this.scene.add.text(gridRightX, gridY + 15, `EXP Gained: +${result.expGained}`, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '13px',
      color: '#c084fc',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Hero XP
    this.add(this.scene.add.text(gridRightX, gridY + 42, `Hero XP: +${result.heroXpGained || 0}`, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '13px',
      color: '#a855f7',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Loot / Drops summary area
    let lootString = 'None';
    if (result.equipmentDrop) {
      lootString = `🛡️ ${result.equipmentDrop.name}`;
    } else if (result.materialDrops) {
      const dropEntries = Object.entries(result.materialDrops);
      if (dropEntries.length > 0) {
        const labels = { 'iron-ore': 'Iron Ore', 'magic-gem': 'Magic Gem', 'dragon-scale': 'Dragon Scale' };
        lootString = dropEntries.map(([mat, qty]) => `${labels[mat] || mat} x${qty}`).join(', ');
      }
    } else if (result.ticketDrop) {
      const labels = { 'survival-ticket': 'Survival Ticket', 'gold-ticket': 'Gold Ticket', 'boss-ticket': 'Boss Ticket' };
      lootString = `🎫 ${labels[result.ticketDrop] || result.ticketDrop}`;
    }

    const lootPanel = this.add(this.scene.add.graphics());
    lootPanel.fillStyle(0x0f172a, 0.8);
    lootPanel.fillRoundedRect(640 - panelWidth/2 + 30, gridY + gridH/2 + 15, panelWidth - 60, 42, 6);
    lootPanel.lineStyle(1, 0x334155);
    lootPanel.strokeRoundedRect(640 - panelWidth/2 + 30, gridY + gridH/2 + 15, panelWidth - 60, 42, 6);

    this.add(this.scene.add.text(640, gridY + gridH/2 + 36, `LOOT DETECTED: ${lootString.toUpperCase()}`, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '12px',
      color: '#34d399',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Global Level up alert
    if (result.playerLeveledUp) {
      const lvUpBg = this.add(this.scene.add.rectangle(640, 470, panelWidth - 60, 26, 0xa855f7, 0.9));
      this.add(this.scene.add.text(640, 470, `🌟 GLOBAL LEVEL UP! NOW LV. ${result.playerLevel} 🌟`, {
        fontFamily: '"Trebuchet MS", Arial, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5));
    }

    // 4. Action buttons (passing full initialization properties to prevent reload freezing)
    if (gameMode === 'campaign') {
      this.addButton(640 - 110, 535, 'NEXT STAGE', 0x2563eb, () => {
        // Safe check for next stage ID casting to Number
        const nextStageId = Number((result && result.nextStage && result.nextStage.stageId) 
          ? result.nextStage.stageId 
          : (this.scene.stage ? (this.scene.stage.stageId + 1) : 1));

        this.scene.scene.start('GameScene', {
          stageId: nextStageId,
          gameMode: 'campaign',
          selectedHero: this.scene.selectedHero || null,
          baseHeroStats: this.scene.baseHeroStats || null,
          equippedItems: this.scene.equippedItems || null,
          activeSkin: this.scene.activeSkin || null,
          finalStats: this.scene.finalStats || null,
          heroLevel: this.scene.heroLevel || 1
        });
      });
      this.addButton(640 + 110, 535, 'MAIN MENU', 0x475569, () => {
        this.scene.scene.start('MainMenuScene');
      });
    } else {
      this.addButton(640 - 110, 535, 'RETRY', 0x2563eb, () => {
        const stageId = Number((result && result.stage && result.stage.stageId) 
          ? result.stage.stageId 
          : (this.scene.stage ? this.scene.stage.stageId : 1));

        this.scene.scene.start('GameScene', {
          stageId: stageId,
          gameMode,
          selectedHero: this.scene.selectedHero || null,
          baseHeroStats: this.scene.baseHeroStats || null,
          equippedItems: this.scene.equippedItems || null,
          activeSkin: this.scene.activeSkin || null,
          finalStats: this.scene.finalStats || null,
          heroLevel: this.scene.heroLevel || 1
        });
      });
      this.addButton(640 + 110, 535, 'MAIN MENU', 0x475569, () => {
        this.scene.scene.start('MainMenuScene');
      });
    }

    // Fade-in entry animation
    this.items.forEach(item => item.setAlpha(0));
    this.scene.tweens.add({
      targets: this.items,
      alpha: 1,
      duration: 350
    });
  }

  showDefeat(result) {
    this.clear();
    
    // 1. Semi-transparent backdrop
    this.backdrop = this.add(this.scene.add.rectangle(640, 360, 1280, 720, 0x020617, 0.75));

    // 2. Panel Background Box (Red border for defeat)
    const panelWidth = 540;
    const panelHeight = 440;
    const panelBg = this.add(this.scene.add.rectangle(640, 360, panelWidth, panelHeight, 0x0f172a, 0.98))
      .setStrokeStyle(3, 0xef4444, 0.9);

    // Visual accent light line
    const panelAccent = this.add(this.scene.add.graphics());
    panelAccent.fillStyle(0xef4444, 0.4);
    panelAccent.fillRoundedRect(640 - panelWidth / 2 + 16, 360 - panelHeight / 2 + 6, panelWidth - 32, 3, 1.5);

    // 3. Header Title (DEFEAT)
    const title = this.add(this.scene.add.text(640, 210, 'DEFEAT', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '48px',
      color: '#f87171',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 8
    }).setOrigin(0.5));

    // Pulsing animation for title
    this.scene.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle
    const gameMode = this.scene.gameMode || 'campaign';
    const subTitleText = result.stage.stageName.toUpperCase() + ` (${gameMode.replace('_', ' ').toUpperCase()})`;
    this.add(this.scene.add.text(640, 260, subTitleText, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '15px',
      color: '#94a3b8',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Stats Box
    const statsBoxX = 640;
    const statsBoxY = 380;
    const boxW = 380;
    const boxH = 120;

    const statsBg = this.add(this.scene.add.graphics());
    statsBg.fillStyle(0x1e293b, 0.6);
    statsBg.fillRoundedRect(statsBoxX - boxW/2, statsBoxY - boxH/2, boxW, boxH, 8);
    statsBg.lineStyle(1.5, 0xef4444, 0.3);
    statsBg.strokeRoundedRect(statsBoxX - boxW/2, statsBoxY - boxH/2, boxW, boxH, 8);

    this.add(this.scene.add.text(statsBoxX, statsBoxY - 30, `💀 Monsters Slain: ${result.kills}`, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '16px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    this.add(this.scene.add.text(statsBoxX, statsBoxY, `🪙 Gold Gathered: ${result.temporaryGold}`, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '15px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    this.add(this.scene.add.text(statsBoxX, statsBoxY + 30, `⚡ Hero XP Gained: +${result.heroXpGained || 0}`, {
      fontFamily: '"Trebuchet MS", Arial, sans-serif',
      fontSize: '14px',
      color: '#a855f7',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Buttons (passing full initialization properties to prevent reload freezing)
    this.addButton(640 - 110, 505, 'RETRY', 0xef4444, () => {
      const stageId = Number((result && result.stage && result.stage.stageId) 
        ? result.stage.stageId 
        : (this.scene.stage ? this.scene.stage.stageId : 1));

      this.scene.scene.start('GameScene', {
        stageId: stageId,
        gameMode,
        selectedHero: this.scene.selectedHero || null,
        baseHeroStats: this.scene.baseHeroStats || null,
        equippedItems: this.scene.equippedItems || null,
        activeSkin: this.scene.activeSkin || null,
        finalStats: this.scene.finalStats || null,
        heroLevel: this.scene.heroLevel || 1
      });
    });
    this.addButton(640 + 110, 505, 'MAIN MENU', 0x475569, () => {
      this.scene.scene.start('MainMenuScene');
    });

    // Fade-in entry animation
    this.items.forEach(item => item.setAlpha(0));
    this.scene.tweens.add({
      targets: this.items,
      alpha: 1,
      duration: 350
    });
  }

  addButton(x, y, label, fillColor, onClick) {
    const btnWidth = 160;
    const btnHeight = 46;

    const button = this.add(this.scene.add.rectangle(x, y, btnWidth, btnHeight, fillColor, 1))
      .setStrokeStyle(1.5, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true });

    const text = this.add(this.scene.add.text(x, y, label, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 3
    }).setOrigin(0.5));

    button.on('pointerover', () => {
      button.setFillStyle(Phaser.Display.Color.IntegerToColor(fillColor).brighten(18).color);
      this.scene.tweens.add({
        targets: [button, text],
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 120
      });
      soundManager.playSFX(this.scene, 'hover');
    });

    button.on('pointerout', () => {
      button.setFillStyle(fillColor);
      this.scene.tweens.add({
        targets: [button, text],
        scaleX: 1,
        scaleY: 1,
        duration: 120
      });
    });

    button.on('pointerdown', () => {
      button.setScale(0.96);
      text.setScale(0.96);
    });

    button.on('pointerup', () => {
      button.setScale(1.04);
      text.setScale(1.04);
      soundManager.playSFX(this.scene, 'click');
      onClick();
    });
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.items.push(item);
    return item;
  }

  clear() {
    if (this.backdrop) {
      this.backdrop.destroy();
      this.backdrop = null;
    }
    this.items.forEach((item) => item.destroy());
    this.items = [];
  }
}
