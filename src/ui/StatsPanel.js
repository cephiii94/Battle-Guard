export default class StatsPanel {
  constructor(scene, gameStats, activeSkin) {
    this.scene = scene;
    this.gameStats = gameStats;
    this.activeSkin = activeSkin;
    this.items = [];
    this.panel = this.add(scene.add.rectangle(178, 72, 316, 104, 0x07111f, 0.88));
    this.panel.setStrokeStyle(2, 0xf59e0b, 0.85);
    this.add(scene.add.rectangle(178, 20, 316, 4, 0xfacc15, 0.95));
    this.add(scene.add.rectangle(44, 72, 46, 62, 0x111827, 0.95)).setStrokeStyle(2, activeSkin.colors.border, 0.95);
    this.add(scene.add.circle(44, 72, 14, activeSkin.colors.hero, 1)).setStrokeStyle(3, activeSkin.colors.border, 1);

    this.text = this.add(scene.add.text(76, 31, '', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold',
      lineSpacing: 7,
      stroke: '#020617',
      strokeThickness: 4
    }));

    this.gameStats.on('stats', (stats) => this.update(stats));
    this.update({
      level: this.gameStats.level,
      exp: this.gameStats.exp,
      expToNextLevel: this.gameStats.getExpToNextLevel(),
      gold: this.gameStats.gold
    });
  }

  update(stats) {
    this.text.setText([
      `${this.activeSkin.name}`,
      `LV ${stats.level}    EXP ${stats.exp}/${stats.expToNextLevel}`,
      `Gold ${stats.gold}`
    ]);
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(1000);
    this.items.push(item);
    return item;
  }
}
