export default class StageHud {
  constructor(scene, stageSystem, gameStats) {
    this.scene = scene;
    this.stageSystem = stageSystem;
    this.gameStats = gameStats;
    this.items = [];

    this.add(scene.add.rectangle(640, 34, 430, 56, 0x07111f, 0.86))
      .setStrokeStyle(2, 0x38bdf8, 0.75);

    this.stageText = this.add(scene.add.text(456, 18, '', this.getTextStyle(18, '#f8fafc')));
    this.timerText = this.add(scene.add.text(640, 18, '', this.getTextStyle(24, '#facc15'))).setOrigin(0.5, 0);
    this.killsText = this.add(scene.add.text(740, 16, '', this.getTextStyle(15, '#dbeafe')));
    this.goldText = this.add(scene.add.text(740, 38, '', this.getTextStyle(15, '#fef08a')));

    stageSystem.on('tick', (snapshot) => this.update(snapshot));
    gameStats.on('killCount', () => this.update(stageSystem.getSnapshot()));
    gameStats.on('gold', () => this.update(stageSystem.getSnapshot()));
    this.update(stageSystem.getSnapshot());
  }

  update(snapshot) {
    this.stageText.setText(snapshot.stage.stageName);
    this.timerText.setText(this.formatTime(snapshot.remainingTime));
    this.killsText.setText(`Kills ${snapshot.kills}`);
    this.goldText.setText(`Gold ${snapshot.temporaryGold}`);
  }

  formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  getTextStyle(fontSize, color) {
    return {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: `${fontSize}px`,
      color,
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 4
    };
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(1000);
    this.items.push(item);
    return item;
  }
}
