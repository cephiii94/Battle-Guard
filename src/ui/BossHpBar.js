export default class BossHpBar {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.boss = null;
  }

  show(boss) {
    this.clear();
    this.boss = boss;

    this.add(this.scene.add.rectangle(640, 92, 560, 54, 0x020617, 0.88))
      .setStrokeStyle(2, 0xfacc15, 0.9);
    this.add(this.scene.add.text(640, 70, boss.bossData.name.toUpperCase(), {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 4
    }).setOrigin(0.5));

    this.barBack = this.add(this.scene.add.rectangle(640, 102, 500, 16, 0x450a0a, 1));
    this.barFill = this.add(this.scene.add.rectangle(390, 102, 500, 16, 0xef4444, 1));
    this.barFill.setOrigin(0, 0.5);
    this.hpText = this.add(this.scene.add.text(640, 101, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: '900',
      stroke: '#020617',
      strokeThickness: 3
    }).setOrigin(0.5));

    this.update();
  }

  update() {
    if (!this.boss || !this.boss.active) {
      return;
    }

    const hpRatio = Math.max(0, this.boss.hp / this.boss.maxHp);
    this.barFill.width = 500 * hpRatio;
    this.hpText.setText(`${Math.max(0, Math.ceil(this.boss.hp))}/${this.boss.maxHp}`);
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
