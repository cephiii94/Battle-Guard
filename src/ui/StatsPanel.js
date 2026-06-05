export default class StatsPanel {
  constructor(scene, gameStats, activeSkin) {
    this.scene = scene;
    this.gameStats = gameStats;
    this.activeSkin = activeSkin;
    this.text = scene.add.text(24, 20, '', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      lineSpacing: 6,
      stroke: '#111827',
      strokeThickness: 5
    });

    this.text.setScrollFactor(0);
    this.text.setDepth(1000);
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
      `Skin: ${this.activeSkin.name}`,
      `Level: ${stats.level}`,
      `EXP: ${stats.exp}/${stats.expToNextLevel}`,
      `Gold: ${stats.gold}`
    ]);
  }
}
