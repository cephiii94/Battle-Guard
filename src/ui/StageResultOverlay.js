import { soundManager } from '../services/soundManager.js';

export default class StageResultOverlay {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }

  showVictory(result) {
    this.clear();
    this.showBasePanel('VICTORY', '#facc15');
    this.addSummary([
      result.stage.stageName,
      `Kills ${result.kills}`,
      `Gold sementara ${result.temporaryGold}`,
      `Stage reward +${result.stageGoldReward || result.goldReward}`,
      `Boss reward +${result.bossGoldReward || 0}`,
      result.equipmentDrop ? `Drop ${result.equipmentDrop.name}` : 'Drop equipment -',
      `Total Gold ${result.totalGold}`
    ]);

    this.addButton(540, 560, 'NEXT STAGE', () => {
      this.scene.scene.start('GameScene', { stageId: result.nextStage.stageId });
    });
    this.addButton(740, 560, 'MAIN MENU', () => {
      this.scene.scene.start('MainMenuScene');
    });
  }

  showDefeat(result) {
    this.clear();
    this.showBasePanel('DEFEAT', '#f87171');
    this.addSummary([
      result.stage.stageName,
      `Kills ${result.kills}`,
      `Gold sementara ${result.temporaryGold}`,
      'Reward stage tidak didapat'
    ]);

    this.addButton(540, 494, 'RETRY', () => {
      this.scene.scene.start('GameScene', { stageId: result.stage.stageId });
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
