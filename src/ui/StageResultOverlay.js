import { soundManager } from '../services/soundManager.js';

export default class StageResultOverlay {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }

  showVictory(result) {
    this.clear();
    this.showBasePanel('VICTORY', '#facc15');
    
    const gameMode = result.gameMode || 'campaign';
    const summaryLines = [
      result.stage.stageName.toUpperCase() + ` (${gameMode.replace('_', ' ').toUpperCase()})`,
      `Kills: ${result.kills}`,
    ];

    if (gameMode === 'gold_farm') {
      summaryLines.push(`Gold Farmed: +${result.temporaryGold}`);
    } else {
      summaryLines.push(`Gold gathered: ${result.temporaryGold}`);
    }
    
    summaryLines.push(`Clear Reward: +${result.stageGoldReward || result.goldReward}`);
    if (result.bossGoldReward > 0) {
      summaryLines.push(`Boss Bonus: +${result.bossGoldReward}`);
    }

    if (result.equipmentDrop) {
      summaryLines.push(`Equipment Drop: ${result.equipmentDrop.name}`);
    }

    if (result.materialDrops) {
      Object.entries(result.materialDrops).forEach(([matId, qty]) => {
        const labels = { 'iron-ore': 'Iron Ore 🪨', 'magic-gem': 'Magic Gem 💎', 'dragon-scale': 'Dragon Scale 🐉' };
        summaryLines.push(`Loot: +${qty} ${labels[matId] || matId}`);
      });
    }

    if (result.ticketDrop) {
      const labels = { 'survival-ticket': 'Survival Ticket 🎟️', 'gold-ticket': 'Gold Ticket 🎟️', 'boss-ticket': 'Boss Ticket 🎫' };
      summaryLines.push(`Bonus: +1 ${labels[result.ticketDrop] || result.ticketDrop}`);
    }

    summaryLines.push(`Total Gold: ${result.totalGold}`);
    summaryLines.push(`EXP Gained: +${result.expGained}`);
    if (result.playerLeveledUp) {
      summaryLines.push(`GLOBAL LEVEL UP! Now Lv. ${result.playerLevel} 🌟`);
    }

    this.addSummary(summaryLines);

    if (gameMode === 'campaign') {
      this.addButton(540, 560, 'NEXT STAGE', () => {
        this.scene.scene.start('GameScene', { stageId: result.nextStage.stageId, gameMode: 'campaign' });
      });
      this.addButton(740, 560, 'MAIN MENU', () => {
        this.scene.scene.start('MainMenuScene');
      });
    } else {
      this.addButton(540, 560, 'RETRY', () => {
        this.scene.scene.start('GameScene', { stageId: result.stage.stageId, gameMode });
      });
      this.addButton(740, 560, 'MAIN MENU', () => {
        this.scene.scene.start('MainMenuScene');
      });
    }
  }

  showDefeat(result) {
    this.clear();
    this.showBasePanel('DEFEAT', '#f87171');
    
    const gameMode = this.scene.gameMode || 'campaign';
    this.addSummary([
      result.stage.stageName.toUpperCase() + ` (${gameMode.replace('_', ' ').toUpperCase()})`,
      `Kills: ${result.kills}`,
      `Gold gathered: ${result.temporaryGold}`,
      'Reward stage tidak didapat'
    ]);

    this.addButton(540, 494, 'RETRY', () => {
      this.scene.scene.start('GameScene', { stageId: result.stage.stageId, gameMode });
    });
    this.addButton(740, 494, 'MAIN MENU', () => {
      this.scene.scene.start('MainMenuScene');
    });
  }

  showBasePanel(title, color) {
    this.add(this.scene.add.rectangle(640, 360, 1280, 720, 0x020617, 0.68));
    this.add(this.scene.add.rectangle(640, 360, 500, 440, 0x0f172a, 0.96))
      .setStrokeStyle(3, 0x38bdf8, 0.85);
    this.add(this.scene.add.text(640, 190, title, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '48px',
      color,
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 8
    }).setOrigin(0.5));
  }

  addSummary(lines) {
    this.add(this.scene.add.text(640, 260, lines, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '21px',
      color: '#f8fafc',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 10,
      stroke: '#020617',
      strokeThickness: 5
    }).setOrigin(0.5, 0));
  }

  addButton(x, y, label, onClick) {
    const button = this.add(this.scene.add.rectangle(x, y, 164, 54, 0x2563eb, 1))
      .setStrokeStyle(2, 0x93c5fd, 1)
      .setInteractive({ useHandCursor: true });
    const text = this.add(this.scene.add.text(x, y, label, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '17px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 4
    }).setOrigin(0.5));

    button.on('pointerover', () => {
      button.setFillStyle(0x1d4ed8);
      soundManager.playSFX(this.scene, 'hover');
    });
    button.on('pointerout', () => button.setFillStyle(0x2563eb));
    button.on('pointerdown', () => {
      button.setScale(0.97);
      text.setScale(0.97);
    });
    button.on('pointerup', () => {
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
    this.items.forEach((item) => item.destroy());
    this.items = [];
  }
}
