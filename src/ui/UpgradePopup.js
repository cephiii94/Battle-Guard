import Phaser from 'phaser';

export default class UpgradePopup {
  constructor(scene, onChoose) {
    this.scene = scene;
    this.onChoose = onChoose;
    this.items = [];
    this.isVisible = false;
  }

  show(upgrades) {
    this.hide();

    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    const panelWidth = 680;
    const panelHeight = 386;
    const overlay = this.scene.add.rectangle(
      centerX,
      centerY,
      this.scene.scale.width,
      this.scene.scale.height,
      0x020617,
      0.62
    );
    const panel = this.scene.add.rectangle(
      centerX,
      centerY,
      panelWidth,
      panelHeight,
      0x091525,
      0.97
    );
    const header = this.scene.add.rectangle(centerX, centerY - 154, panelWidth - 34, 54, 0x1f2937, 1);
    const topLine = this.scene.add.rectangle(centerX, centerY - 193, panelWidth, 5, 0xf59e0b, 1);
    const bottomLine = this.scene.add.rectangle(centerX, centerY + 193, panelWidth, 5, 0x38bdf8, 0.9);
    const border = this.scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xffffff, 0);

    panel.setStrokeStyle(3, 0x334155);
    header.setStrokeStyle(2, 0xfacc15, 0.8);
    border.setStrokeStyle(2, 0xf8fafc, 0.35);

    const title = this.scene.add.text(centerX, centerY - 154, 'LEVEL UP - CHOOSE A BATTLE MOD', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '28px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.addItem(overlay);
    this.addItem(panel);
    this.addItem(header);
    this.addItem(topLine);
    this.addItem(bottomLine);
    this.addItem(border);
    this.addItem(title);

    upgrades.forEach((upgrade, index) => {
      this.createUpgradeButton(
        centerX,
        centerY - 78 + (index * 90),
        upgrade
      );
    });

    this.isVisible = true;
  }

  hide() {
    this.items.forEach((item) => item.destroy());
    this.items = [];
    this.isVisible = false;
  }

  createUpgradeButton(x, y, upgrade) {
    const button = this.scene.add.rectangle(x, y, 568, 72, 0x132033, 1);
    const accent = this.scene.add.rectangle(x - 268, y, 8, 50, 0xf59e0b, 1);
    const chevron = this.scene.add.text(x + 242, y, '>', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '28px',
      color: '#facc15',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const title = this.scene.add.text(x - 236, y - 21, upgrade.title.toUpperCase(), {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '20px',
      color: '#f8fafc',
      fontStyle: 'bold'
    });
    const description = this.scene.add.text(x - 236, y + 9, upgrade.description, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '15px',
      color: '#cbd5e1',
      wordWrap: { width: 430 }
    });

    button.setStrokeStyle(2, 0x64748b);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-284, -36, 568, 72),
      Phaser.Geom.Rectangle.Contains
    );
    button.on('pointerover', () => {
      button.setFillStyle(0x1f3a56, 1);
      button.setStrokeStyle(2, 0xfacc15);
    });
    button.on('pointerout', () => {
      button.setFillStyle(0x132033, 1);
      button.setStrokeStyle(2, 0x64748b);
    });
    button.on('pointerdown', () => this.onChoose(upgrade));
    title.setInteractive({ useHandCursor: true });
    description.setInteractive({ useHandCursor: true });
    chevron.setInteractive({ useHandCursor: true });
    title.on('pointerdown', () => this.onChoose(upgrade));
    description.on('pointerdown', () => this.onChoose(upgrade));
    chevron.on('pointerdown', () => this.onChoose(upgrade));

    this.addItem(button);
    this.addItem(accent);
    this.addItem(chevron);
    this.addItem(title);
    this.addItem(description);
  }

  addItem(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.items.push(item);
  }
}
