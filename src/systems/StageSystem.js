import { addPlayerGold, unlockStage } from './PlayerProgress.js';
import { getNextStage } from '../data/stages.js';

export default class StageSystem {
  constructor(scene, stage, gameStats) {
    this.scene = scene;
    this.stage = stage;
    this.gameStats = gameStats;
    this.remainingTime = stage.duration;
    this.isFinished = false;
    this.isTimerVictoryBlocked = false;
    this.listeners = {
      tick: [],
      victory: [],
      defeat: []
    };

    this.timer = scene.time.addEvent({
      delay: 1000,
      callback: this.tick,
      callbackScope: this,
      loop: true
    });
  }

  tick() {
    if (this.isFinished) {
      return;
    }

    this.remainingTime = Math.max(0, this.remainingTime - 1);
    this.emit('tick', this.getSnapshot());

    if (this.remainingTime <= 0 && !this.isTimerVictoryBlocked) {
      this.completeVictory();
    }
  }

  completeVictory(rewards = {}) {
    if (this.isFinished) {
      return null;
    }

    this.isFinished = true;
    this.timer.paused = true;

    const bossGoldReward = rewards.bossGoldReward || 0;
    const goldReward = this.stage.goldReward + bossGoldReward;
    const totalGold = addPlayerGold(this.scene, goldReward);
    const nextStage = getNextStage(this.stage.stageId);

    unlockStage(this.scene, nextStage.stageId, this.stage.stageId);

    const result = {
      stage: this.stage,
      nextStage,
      totalGold,
      temporaryGold: this.gameStats.gold,
      goldReward,
      stageGoldReward: this.stage.goldReward,
      bossGoldReward,
      equipmentDrop: rewards.equipmentDrop || null,
      kills: this.gameStats.killCount
    };

    this.emit('victory', result);
    return result;
  }

  completeDefeat() {
    if (this.isFinished) {
      return null;
    }

    this.isFinished = true;
    this.timer.paused = true;

    const result = {
      stage: this.stage,
      temporaryGold: this.gameStats.gold,
      kills: this.gameStats.killCount
    };

    this.emit('defeat', result);
    return result;
  }

  setPaused(isPaused) {
    if (!this.isFinished) {
      this.timer.paused = isPaused;
    }
  }

  setTimerVictoryBlocked(isBlocked) {
    this.isTimerVictoryBlocked = isBlocked;
  }

  getSnapshot() {
    return {
      stage: this.stage,
      remainingTime: this.remainingTime,
      kills: this.gameStats.killCount,
      temporaryGold: this.gameStats.gold
    };
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
}
