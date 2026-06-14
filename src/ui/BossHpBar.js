import Phaser from 'phaser';

export default class BossHpBar {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.boss = null;
    this.lagRatio = 1.0;
  }

  show(boss) {
    this.clear();
    this.boss = boss;
    this.lagRatio = Math.max(0, boss.hp / boss.maxHp);

    const width = 420;
    const height = 44;
    const x = 640;
    const y = 92;

    // 1. Sleek Compact Boss Frame (Pulsing Dark Red Shadow)
    this.panelBorder = this.add(this.scene.add.rectangle(x, y, width, height, 0x020617, 0.92))
      .setStrokeStyle(2, 0xef4444, 0.9); // Neon red border

    // Pulse red border shadow
    this.scene.tweens.add({
      targets: this.panelBorder,
      alpha: 0.85,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut'
    });

    // Boss Name (Fiery Uppercase Font, Compact)
    this.add(this.scene.add.text(x, y - 11, `⚠️ ${boss.bossData.name.toUpperCase()} ⚠️`, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '12px',
      color: '#fef08a',
      fontStyle: 'bold',
      stroke: '#991b1b',
      strokeThickness: 3
    }).setOrigin(0.5));

    // HP Bar Track
    const barWidth = 380;
    const barHeight = 10;
    const barX = x - barWidth / 2;
    const barY = y + 10;

    this.add(this.scene.add.rectangle(x, barY, barWidth + 4, barHeight + 4, 0x1e293b, 1))
      .setStrokeStyle(1, 0x475569);

    // Damage Lag Bar (Orange indicator)
    this.barLag = this.add(this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0xf97316, 1));
    this.barLag.setOrigin(0, 0.5);

    // Main Health Bar Fill (Crimson red)
    this.barFill = this.add(this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0xdc2626, 1));
    this.barFill.setOrigin(0, 0.5);

    // Segment Dividers Overlay (Draw lines every 20% of health)
    this.dividerGraphics = this.add(this.scene.add.graphics());
    this.dividerGraphics.lineStyle(1.2, 0x020617, 0.6);
    for (let i = 1; i <= 4; i++) {
      const lineX = barX + (barWidth * (i / 5));
      this.dividerGraphics.lineBetween(lineX, barY - barHeight / 2, lineX, barY + barHeight / 2);
    }

    // Health numeric text
    this.hpText = this.add(this.scene.add.text(x, barY, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2.5
    }).setOrigin(0.5));

    this.update();
  }

  update() {
    if (!this.boss || !this.boss.active) {
      return;
    }

    const hpRatio = Math.max(0, this.boss.hp / this.boss.maxHp);
    const barWidth = 380;

    // Set immediate HP fill width
    this.barFill.width = barWidth * hpRatio;
    
    // Smooth lerp the damage lag bar towards current HP ratio
    this.lagRatio = Phaser.Math.Linear(this.lagRatio, hpRatio, 0.05);
    this.barLag.width = barWidth * this.lagRatio;

    this.hpText.setText(`${Math.max(0, Math.ceil(this.boss.hp))} / ${this.boss.maxHp} HP`);
  }

  hide() {
    this.clear();
    this.boss = null;
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(1500);
    this.items.push(item);
    return item;
  }

  clear() {
    this.items.forEach((item) => item.destroy());
    this.items = [];
  }
}
