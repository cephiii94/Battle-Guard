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
    const panelWidth = 620;
    const panelHeight = 360;
    const panel = this.scene.add.rectangle(
      centerX,
      centerY,
      panelWidth,
      panelHeight,
      0x0f172a,
      0.94
    );
    const border = this.scene.add.rectangle(
      centerX,
      centerY,
      panelWidth,
      panelHeight,
      0xffffff,
      0
    );

    border.setStrokeStyle(3, 0x93c5fd);

    const title = this.scene.add.text(centerX, centerY - 138, 'Level Up', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '34px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.addItem(panel);
    this.addItem(border);
    this.addItem(title);

    upgrades.forEach((upgrade, index) => {
      this.createUpgradeButton(
        centerX,
        centerY - 72 + (index * 86),
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
    const button = this.scene.add.rectangle(x, y, 520, 66, 0x1e293b, 1);
    const title = this.scene.add.text(x - 230, y - 18, upgrade.title, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '21px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    const description = this.scene.add.text(x - 230, y + 8, upgrade.description, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '15px',
      color: '#cbd5e1'
    });

    button.setStrokeStyle(2, 0x475569);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-260, -33, 520, 66),
      Phaser.Geom.Rectangle.Contains
    );
    button.on('pointerover', () => button.setFillStyle(0x334155, 1));
    button.on('pointerout', () => button.setFillStyle(0x1e293b, 1));
    button.on('pointerdown', () => this.onChoose(upgrade));
    title.setInteractive({ useHandCursor: true });
    description.setInteractive({ useHandCursor: true });
    title.on('pointerdown', () => this.onChoose(upgrade));
    description.on('pointerdown', () => this.onChoose(upgrade));

    this.addItem(button);
    this.addItem(title);
    this.addItem(description);
  }

  addItem(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.items.push(item);
  }
}
