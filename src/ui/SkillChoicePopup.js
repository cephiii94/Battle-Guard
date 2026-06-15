import Phaser from 'phaser';

export default class SkillChoicePopup {
  constructor(scene, onChoose) {
    this.scene = scene;
    this.onChoose = onChoose;
    this.items = [];
  }

  show(skillChoices) {
    this.hide();

    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    // Wider and taller panel for horizontal card layout
    const panelWidth = 950;
    const panelHeight = 450;
    const overlay = this.add(this.scene.add.rectangle(centerX, centerY, this.scene.scale.width, this.scene.scale.height, 0x020617, 0.62));
    const panel = this.add(this.scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x091525, 0.97));
    const title = this.add(this.scene.add.text(centerX, centerY - 188, 'LEVEL UP — PILIH SKILL', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '27px',
      color: '#f8fafc',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 5
    }).setOrigin(0.5));

    panel.setStrokeStyle(3, 0x38bdf8, 0.85);
    this.add(this.scene.add.rectangle(centerX, centerY - 224, panelWidth, 5, 0xf59e0b, 1));
    this.add(this.scene.add.rectangle(centerX, centerY + 224, panelWidth, 5, 0x38bdf8, 0.9));

    // Dynamic horizontal layout calculations
    const cardWidth = 270;
    const cardHeight = 330;
    const gap = 30;
    const numChoices = skillChoices.length;
    const totalWidth = numChoices * cardWidth + (numChoices - 1) * gap;
    const startX = centerX - (totalWidth / 2) + (cardWidth / 2);
    const cardY = centerY + 25;

    skillChoices.forEach((skill, index) => {
      const x = startX + index * (cardWidth + gap);
      this.addSkillButton(x, cardY, cardWidth, cardHeight, skill);
    });
  }

  hide() {
    this.items.forEach((item) => item.destroy());
    this.items = [];
  }

  addSkillButton(x, y, cardWidth, cardHeight, skill) {
    const isPassive = skill.type === 'passive';
    const accentColor = isPassive ? 0x22c55e : 0xfacc15;
    const badgeColor = isPassive ? '#22c55e' : '#f59e0b';
    const badgeLabel = isPassive ? '● PASIF' : '▶ AKTIF';

    // Main Card background (Only the card itself is interactive, inputs fall through other elements)
    const button = this.add(this.scene.add.rectangle(x, y, cardWidth, cardHeight, 0x132033, 1));
    button.setStrokeStyle(2, 0x64748b);

    // Accent line at top of card
    const accent = this.add(this.scene.add.rectangle(x, y - cardHeight / 2 + 4, cardWidth - 8, 8, accentColor, 1));
    
    // Type badge centered near the top
    const badge = this.add(this.scene.add.text(x, y - cardHeight / 2 + 32, badgeLabel, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '11px',
      color: badgeColor,
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2
    }).setOrigin(0.5));

    // Larger, centered skill icon
    const icon = this.add(this.scene.add.image(x, y - cardHeight / 2 + 85, skill.assetKey).setDisplaySize(64, 64));
    
    // Title
    const title = this.add(this.scene.add.text(x, y - cardHeight / 2 + 145, this.getChoiceTitle(skill), {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: cardWidth - 30 }
    }).setOrigin(0.5));

    // Decorative separator line
    const divider = this.add(this.scene.add.rectangle(x, y - cardHeight / 2 + 178, cardWidth - 40, 2, 0x334155, 0.5));

    // Description text wrapping inside card
    const description = this.add(this.scene.add.text(x, y - cardHeight / 2 + 196, skill.description, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '14px',
      color: '#cbd5e1',
      align: 'center',
      wordWrap: { width: cardWidth - 30 }
    }).setOrigin(0.5, 0));

    // Choose visual button indicator at bottom of card
    const selectText = this.add(this.scene.add.text(x, y + cardHeight / 2 - 26, 'PILIH', {
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
        targets: [button, icon, selectText],
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
        targets: [button, icon, selectText],
        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: 'Quad.easeOut'
      });
    });

    button.on('pointerdown', () => {
      button.setScale(0.96);
      icon.setScale(0.96);
      selectText.setScale(0.96);
    });

    button.on('pointerup', () => {
      button.setScale(1.04);
      icon.setScale(1.04);
      selectText.setScale(1.04);
      this.onChoose(skill);
    });
  }

  getChoiceTitle(skill) {
    const action = skill.level > 0 ? `LEVEL ${skill.level + 1}` : 'UNLOCK';
    return `${skill.name.toUpperCase()}  ${action}`;
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.items.push(item);
    return item;
  }
}
