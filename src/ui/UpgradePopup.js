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
    
    // Wider and taller panel for horizontal card layout
    const panelWidth = 950;
    const panelHeight = 450;
    const overlay = this.addItem(this.scene.add.rectangle(
      centerX,
      centerY,
      this.scene.scale.width,
      this.scene.scale.height,
      0x020617,
      0.62
    ));
    const panel = this.addItem(this.scene.add.rectangle(
      centerX,
      centerY,
      panelWidth,
      panelHeight,
      0x091525,
      0.97
    ));
    const header = this.addItem(this.scene.add.rectangle(centerX, centerY - 188, panelWidth - 34, 54, 0x1f2937, 1));
    const topLine = this.addItem(this.scene.add.rectangle(centerX, centerY - 224, panelWidth, 5, 0xf59e0b, 1));
    const bottomLine = this.addItem(this.scene.add.rectangle(centerX, centerY + 224, panelWidth, 5, 0x38bdf8, 0.9));
    const border = this.addItem(this.scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xffffff, 0));

    panel.setStrokeStyle(3, 0x38bdf8, 0.85);
    header.setStrokeStyle(2, 0xfacc15, 0.8);
    border.setStrokeStyle(2, 0xf8fafc, 0.35);

    const title = this.addItem(this.scene.add.text(centerX, centerY - 188, 'LEVEL UP - CHOOSE A BATTLE MOD', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '28px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Dynamic horizontal layout calculations
    const cardWidth = 270;
    const cardHeight = 330;
    const gap = 30;
    const numChoices = upgrades.length;
    const totalWidth = numChoices * cardWidth + (numChoices - 1) * gap;
    const startX = centerX - (totalWidth / 2) + (cardWidth / 2);
    const cardY = centerY + 25;

    upgrades.forEach((upgrade, index) => {
      const x = startX + index * (cardWidth + gap);
      this.createUpgradeButton(x, cardY, cardWidth, cardHeight, upgrade);
    });

    this.isVisible = true;
  }

  hide() {
    this.items.forEach((item) => item.destroy());
    this.items = [];
    this.isVisible = false;
  }

  createUpgradeButton(x, y, cardWidth, cardHeight, upgrade) {
    // Main Card background (Only the card itself is interactive, inputs fall through other elements)
    const button = this.addItem(this.scene.add.rectangle(x, y, cardWidth, cardHeight, 0x132033, 1));
    button.setStrokeStyle(2, 0x64748b);

    // Accent line at top of card
    const accent = this.addItem(this.scene.add.rectangle(x, y - cardHeight / 2 + 4, cardWidth - 8, 8, 0xf59e0b, 1));
    
    // Themed symbol badge centered near the top
    const circle = this.addItem(this.scene.add.circle(x, y - cardHeight / 2 + 75, 32, 0x1f2937, 1));
    circle.setStrokeStyle(2, 0xfacc15);
    
    const emoji = this.addItem(this.scene.add.text(x, y - cardHeight / 2 + 75, this.getUpgradeSymbol(upgrade.id), {
      fontSize: '32px'
    }).setOrigin(0.5));
    
    // Title
    const title = this.addItem(this.scene.add.text(x, y - cardHeight / 2 + 145, upgrade.title.toUpperCase(), {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: cardWidth - 30 }
    }).setOrigin(0.5));

    // Decorative separator line
    const divider = this.addItem(this.scene.add.rectangle(x, y - cardHeight / 2 + 178, cardWidth - 40, 2, 0x334155, 0.5));

    // Description text wrapping inside card
    const description = this.addItem(this.scene.add.text(x, y - cardHeight / 2 + 196, upgrade.description, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '14px',
      color: '#cbd5e1',
      align: 'center',
      wordWrap: { width: cardWidth - 30 }
    }).setOrigin(0.5, 0));

    // Choose visual button indicator at bottom of card
    const selectText = this.addItem(this.scene.add.text(x, y + cardHeight / 2 - 26, 'PILIH', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '15px',
      color: '#facc15',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Interactive behaviors
    button.setInteractive({ useHandCursor: true });
    
    button.on('pointerover', () => {
      button.setFillStyle(0x1f3a56, 1);
      button.setStrokeStyle(2.5, 0xfacc15);
      this.scene.tweens.add({
        targets: [button, circle, emoji, selectText],
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 120,
        ease: 'Quad.easeOut'
      });
    });

    button.on('pointerout', () => {
      button.setFillStyle(0x132033, 1);
      button.setStrokeStyle(2, 0x64748b);
      this.scene.tweens.add({
        targets: [button, circle, emoji, selectText],
        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: 'Quad.easeOut'
      });
    });

    button.on('pointerdown', () => {
      button.setScale(0.96);
      circle.setScale(0.96);
      emoji.setScale(0.96);
      selectText.setScale(0.96);
    });

    button.on('pointerup', () => {
      button.setScale(1.04);
      circle.setScale(1.04);
      emoji.setScale(1.04);
      selectText.setScale(1.04);
      this.onChoose(upgrade);
    });
  }

  getUpgradeSymbol(id) {
    const symbols = {
      'damage': '⚔️',
      'attack-speed': '⚡',
      'max-hp': '❤️',
      'movement-speed': '👟',
      'critical-chance': '🎯',
      'health-regen': '🧪',
      'armor': '🛡️',
      'lifesteal': '🩸',
      'evasion': '💨',
      'cooldown-reduction': '⏳'
    };
    return symbols[id] || '⚙️';
  }

  addItem(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.items.push(item);
    return item;
  }
}
