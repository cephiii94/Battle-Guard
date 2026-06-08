import Phaser from 'phaser';

const UI = {
  white: '#ffffff',
  cyan: '#69e6ff',
  cyanDark: '#0c86bd',
  blueText: '#dff8ff',
  yellow: '#ffdc5a',
  purple: '#b53cff',
};

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  preload() {
    this.load.image('ui-settings-dot', '/assets/ui/settings-gear.svg');
    this.load.image('ui-icon-gem', '/assets/ui/icon-gem.svg');
    this.load.image('ui-icon-gold', '/assets/ui/icon-gold.svg');
    this.load.image('ui-currency-bar', '/assets/ui/currency-bar.svg');
    this.load.image('ui-side-button', '/assets/ui/neon-side-button.svg');
    this.load.image('ui-battle-button', '/assets/ui/neon-battle-button.svg');
    this.load.image('ui-purple-button', '/assets/ui/neon-purple-button.svg');
    this.load.image('ui-hex-slot', '/assets/ui/neon-hex-slot.svg');
    this.load.image('ui-hex-active', '/assets/ui/neon-hex-active.svg');
    this.load.image('ui-character-orb', '/assets/ui/neon-character-orb.svg');
    this.load.image('ui-bottom-panel', '/assets/ui/neon-panel-bottom.svg');
    this.load.image('ui-stat-damage', '/assets/ui/icon-damage.svg');
    this.load.image('ui-stat-hp', '/assets/ui/icon-hp.svg');
    this.load.image('ui-stat-aspd', '/assets/ui/icon-aspd.svg');
  }

  create() {
    const { width, height } = this.scale;

    this.drawGalaxyBackground(width, height);
    this.addTopBar(width);
    this.addLeftMenu();
    this.addRightRewards(width);
    this.addHeroFocus(width, height);
    this.addBottomActions(width, height);
  }

  drawGalaxyBackground(width, height) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x151038, 0x081c42, 0x10125c, 0x061c35, 1);
    bg.fillRect(0, 0, width, height);

    bg.fillStyle(0x7d39ff, 0.18);
    bg.fillCircle(width * 0.56, height * 0.38, 170);
    bg.fillStyle(0x00d6ff, 0.12);
    bg.fillCircle(width * 0.53, height * 0.45, 230);
    bg.lineStyle(3, 0x4bdbff, 0.25);
    bg.strokeEllipse(width * 0.54, height * 0.5, 430, 270);
    bg.lineStyle(2, 0xd543ff, 0.28);
    bg.strokeEllipse(width * 0.55, height * 0.47, 300, 210);

    const stars = [
      [78, 42, 2], [148, 91, 1], [224, 42, 1], [313, 88, 2], [420, 33, 1],
      [510, 96, 2], [610, 45, 1], [690, 112, 1], [64, 270, 1], [176, 310, 2],
      [298, 302, 1], [438, 276, 1], [548, 318, 2], [705, 286, 1],
    ];

    bg.fillStyle(0xffffff, 0.7);
    stars.forEach(([x, y, r]) => bg.fillCircle(x, y, r));
  }

  addTopBar(width) {
    this.add.image(26, 26, 'ui-settings-dot').setDisplaySize(38, 38).setInteractive({ useHandCursor: true });

    this.drawLevelBadge(91, 27);
    this.add.text(122, 12, 'Player6634', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: UI.white,
      fontStyle: '800',
    });

    this.drawProgressBar(122, 34, 154, 18, 100, 1500);

    this.add.image(width - 118, 24, 'ui-currency-bar').setDisplaySize(242, 46);
    this.addCurrency(width - 208, 24, 'ui-icon-gold', '230 560');
    this.addCurrency(width - 94, 24, 'ui-icon-gem', '640');
    this.add.text(width - 24, 20, '+', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: UI.cyan,
      fontStyle: '800',
      stroke: '#17246c',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  drawLevelBadge(x, y) {
    const badge = this.add.graphics();
    badge.fillStyle(0x2f2a8f, 1);
    badge.lineStyle(3, 0xd8e7ff, 1);
    badge.beginPath();
    badge.moveTo(x, y - 25);
    badge.lineTo(x + 26, y - 10);
    badge.lineTo(x + 20, y + 20);
    badge.lineTo(x, y + 30);
    badge.lineTo(x - 20, y + 20);
    badge.lineTo(x - 26, y - 10);
    badge.closePath();
    badge.fillPath();
    badge.strokePath();

    this.add.text(x, y + 1, '12', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: UI.white,
      fontStyle: '900',
    }).setOrigin(0.5);
  }

  drawProgressBar(x, y, width, height, current, max) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x17205f, 1);
    graphics.fillRoundedRect(x, y, width, height, 3);
    graphics.fillStyle(0x23c7ff, 1);
    graphics.fillRoundedRect(x + 2, y + 2, Math.max(20, (width - 4) * (current / max)), height - 4, 3);
    graphics.lineStyle(2, 0x70eaff, 1);
    graphics.strokeRoundedRect(x, y, width, height, 3);

    this.add.text(x + width / 2, y + height / 2, `${current}/${max}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: UI.blueText,
      fontStyle: '800',
    }).setOrigin(0.5);
  }

  addCurrency(x, y, iconKey, value) {
    this.add.image(x, y, iconKey).setDisplaySize(26, 26);
    this.add.text(x + 22, y, value, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: UI.white,
      fontStyle: '800',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);
  }

  addLeftMenu() {
    const items = [
      { y: 105, icon: '🛒', label: 'TOKO' },
      { y: 177, icon: '🏆', label: 'RANK' },
      { y: 249, icon: '⚗', label: 'LAB' },
    ];

    items.forEach((item) => {
      const button = this.add.image(62, item.y, 'ui-side-button').setInteractive({ useHandCursor: true });
      button.on('pointerover', () => button.setScale(1.05));
      button.on('pointerout', () => button.setScale(1));

      this.add.text(62, item.y - 8, item.icon, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: UI.white,
      }).setOrigin(0.5);
      this.add.text(62, item.y + 22, item.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5);
    });
  }

  addRightRewards(width) {
    this.addRewardBadge(width - 103, 88, '1D 16H');
    this.addCup(width - 43, 92);
    this.add.text(width - 44, 130, '1 526', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.addSmallQuest(width - 43, 178, '!');
    this.addSmallQuest(width - 43, 232, '!');
    this.addSmallQuest(width - 43, 304, '3');
  }

  addRewardBadge(x, y, label) {
    const g = this.add.graphics();
    g.fillStyle(0xff7a0b, 1);
    g.fillCircle(x, y, 27);
    g.lineStyle(3, 0xffd84d, 1);
    g.strokeCircle(x, y, 27);
    this.add.text(x, y + 36, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: UI.white,
      fontStyle: '800',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  addCup(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0xffcc32, 1);
    g.fillEllipse(x, y - 4, 38, 22);
    g.fillRect(x - 12, y - 2, 24, 26);
    g.fillEllipse(x, y + 24, 34, 11);
    g.lineStyle(3, 0xfff2a8, 1);
    g.strokeEllipse(x, y - 4, 38, 22);
  }

  addSmallQuest(x, y, notice) {
    const panel = this.add.graphics();
    panel.fillStyle(0x29339a, 1);
    panel.fillRoundedRect(x - 24, y - 22, 48, 44, 7);
    panel.lineStyle(2, 0x65e8ff, 1);
    panel.strokeRoundedRect(x - 24, y - 22, 48, 44, 7);

    this.add.text(x, y, '✓', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: UI.cyan,
      fontStyle: '900',
    }).setOrigin(0.5);

    this.add.circle(x + 23, y - 20, 10, 0xff3131);
    this.add.text(x + 23, y - 20, notice, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: UI.white,
      fontStyle: '900',
    }).setOrigin(0.5);
  }

  addHeroFocus(width, height) {
    const cx = width / 2 + 20;
    const cy = height / 2 - 18;

    this.add.text(cx, 72, 'BATTLE GUARD', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#1b1b77',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(cx, 101, 'MODIFIKASI HERO', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: UI.yellow,
      fontStyle: '800',
      stroke: '#1b1b77',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(cx - 88, 135, 'Lv. 46', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#1b1b77',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.addEquipmentSlots(cx - 178, cy + 3, -1);
    this.addEquipmentSlots(cx + 178, cy + 3, 1);
    this.add.image(cx, cy, 'ui-character-orb').setDisplaySize(188, 188);

    this.add.text(cx + 68, cy + 75, '1/999', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#1b1b77',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.image(cx + 112, cy + 75, 'ui-icon-gold').setDisplaySize(30, 30);
  }

  addEquipmentSlots(x, y, side) {
    this.add.text(x, y - 124, side < 0 ? 'WEAPON' : 'ARMOR', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: UI.cyan,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.image(x, y - 73, 'ui-hex-active').setDisplaySize(66, 66);

    for (let i = 0; i < 3; i += 1) {
      const slotX = x + side * Math.abs(i - 1) * 8;
      this.add.image(slotX, y - 15 + i * 58, 'ui-hex-slot').setDisplaySize(58, 58).setAlpha(0.95);
    }
  }

  addBottomActions(width, height) {
    const cx = width / 2 + 20;

    const loadoutY = height - 118;
    const statusY = height - 43;

    const cells = this.add.image(cx, loadoutY, 'ui-purple-button').setInteractive({ useHandCursor: true });
    this.add.text(cx, loadoutY, '▦ LOADOUT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#39106a',
      strokeThickness: 3,
    }).setOrigin(0.5);
    cells.on('pointerover', () => cells.setScale(1.04));
    cells.on('pointerout', () => cells.setScale(1));

    this.add.image(cx, statusY, 'ui-bottom-panel').setDisplaySize(332, 66);
    this.addStat(cx - 104, statusY, 'ui-stat-damage', 'DMG', '320');
    this.addStat(cx, statusY, 'ui-stat-hp', 'HP', '220');
    this.addStat(cx + 104, statusY, 'ui-stat-aspd', 'ASPD', '460');

    const battle = this.add.image(width - 92, height - 54, 'ui-battle-button').setInteractive({ useHandCursor: true });
    this.add.text(width - 92, height - 54, 'BATTLE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#9d3300',
      strokeThickness: 4,
    }).setOrigin(0.5);
    battle.on('pointerover', () => battle.setScale(1.04));
    battle.on('pointerout', () => battle.setScale(1));
    battle.on('pointerdown', () => battle.setScale(0.98));
    battle.on('pointerup', () => this.scene.start('GameScene'));

    this.addEventOffer(height);
  }

  addStat(x, y, iconKey, label, value) {
    this.add.image(x - 28, y, iconKey).setDisplaySize(24, 24);
    this.add.text(x + 12, y - 9, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#9af2ff',
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.add.text(x + 12, y + 9, value, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: UI.cyan,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  addEventOffer(height) {
    const g = this.add.graphics();
    g.fillStyle(0x21aaff, 1);
    g.fillRoundedRect(24, height - 70, 170, 50, 8);
    g.lineStyle(2, 0x9af2ff, 1);
    g.strokeRoundedRect(24, height - 70, 170, 50, 8);

    this.add.circle(47, height - 45, 18, 0xff7a0b);
    this.add.text(74, height - 45, 'EVENT HARIAN', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: UI.white,
      fontStyle: '900',
      stroke: '#0c1648',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);
  }
}
