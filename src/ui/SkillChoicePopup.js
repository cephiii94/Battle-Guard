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
    const overlay = this.add(this.scene.add.rectangle(centerX, centerY, this.scene.scale.width, this.scene.scale.height, 0x020617, 0.62));
    const panel = this.add(this.scene.add.rectangle(centerX, centerY, 700, 390, 0x091525, 0.97));
    const title = this.add(this.scene.add.text(centerX, centerY - 158, 'LEVEL UP — PILIH SKILL', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '27px',
      color: '#f8fafc',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 5
    }).setOrigin(0.5));

    panel.setStrokeStyle(3, 0x38bdf8, 0.85);
    this.add(this.scene.add.rectangle(centerX, centerY - 194, 700, 5, 0xf59e0b, 1));
    this.add(this.scene.add.rectangle(centerX, centerY + 194, 700, 5, 0x38bdf8, 0.9));

    skillChoices.forEach((skill, index) => {
      this.addSkillButton(centerX, centerY - 78 + (index * 92), skill);
    });
  }

  hide() {
    this.items.forEach((item) => item.destroy());
    this.items = [];
  }

  addSkillButton(x, y, skill) {
    const isPassive = skill.type === 'passive';
    const accentColor = isPassive ? 0x22c55e : 0xfacc15;
    const badgeColor = isPassive ? '#22c55e' : '#f59e0b';
    const badgeLabel = isPassive ? '● PASIF' : '▶ AKTIF';

    const button = this.add(this.scene.add.rectangle(x, y, 590, 74, 0x132033, 1));
    const accent = this.add(this.scene.add.rectangle(x - 278, y, 8, 52, accentColor, 1));
    const icon = this.add(this.scene.add.image(x - 244, y, skill.assetKey).setDisplaySize(48, 48));
    const title = this.add(this.scene.add.text(x - 206, y - 23, this.getChoiceTitle(skill), {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '20px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }));
    const description = this.add(this.scene.add.text(x - 206, y + 7, skill.description, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '15px',
      color: '#cbd5e1',
      wordWrap: { width: 340 }
    }));
    // Type badge
    this.add(this.scene.add.text(x + 240, y - 24, badgeLabel, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '11px',
      color: badgeColor,
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2
    }).setOrigin(1, 0.5));
    const chevron = this.add(this.scene.add.text(x + 258, y + 8, '>', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '28px',
      color: '#facc15',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    button.setStrokeStyle(2, 0x64748b);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-295, -37, 590, 74),
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
    button.on('pointerdown', () => this.onChoose(skill));
    title.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onChoose(skill));
    description.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onChoose(skill));
    icon.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onChoose(skill));
    chevron.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onChoose(skill));

    this.add(accent);
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
