export default class GameStats {
  constructor() {
    this.killCount = 0;
    this.gold = 0;
    this.level = 1;
    this.exp = 0;
    this.listeners = {
      killCount: [],
      gold: [],
      exp: [],
      level: [],
      levelUp: [],
      stats: []
    };
  }

  addKill(amount = 1) {
    this.killCount += amount;
    this.emit('killCount', this.killCount);
  }

  addGold(amount = 1) {
    this.gold += amount;
    this.emit('gold', this.gold);
    this.emitStats();
  }

  addExp(amount) {
    this.exp += amount;

    while (this.exp >= this.getExpToNextLevel()) {
      this.exp -= this.getExpToNextLevel();
      this.level += 1;
      this.emit('level', this.level);
      this.emit('levelUp', this.level);
    }

    this.emit('exp', this.exp);
    this.emitStats();
  }

  getExpToNextLevel() {
    return 100 + ((this.level - 1) * 50);
  }

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(callback);
  }

  emit(eventName, value) {
    if (!this.listeners[eventName]) {
      return;
    }

    this.listeners[eventName].forEach((callback) => callback(value));
  }

  emitStats() {
    this.emit('stats', {
      killCount: this.killCount,
      gold: this.gold,
      level: this.level,
      exp: this.exp,
      expToNextLevel: this.getExpToNextLevel()
    });
  }
}
