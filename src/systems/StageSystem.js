import { addPlayerGold, unlockStage, addPlayerTicket, addPlayerExp } from './PlayerProgress.js';
import { getNextStage } from '../data/stages.js';

export default class StageSystem {
  constructor(scene, stage, gameStats) {
    this.scene = scene;
    this.stage = stage;
    this.gameStats = gameStats;
    this.remainingTime = stage.duration;
    this.elapsedTime = 0;
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

    const gameMode = this.scene.gameMode || 'campaign';
    if (gameMode === 'campaign') {
      this.elapsedTime += 1;
    } else {
      this.remainingTime = Math.max(0, this.remainingTime - 1);
    }
    this.emit('tick', this.getSnapshot());

    if (gameMode !== 'campaign' && this.remainingTime <= 0 && !this.isTimerVictoryBlocked) {
      this.completeVictory();
    }
  }

  completeVictory(rewards = {}) {
    if (this.isFinished) {
      return null;
    }

    this.isFinished = true;
    this.timer.paused = true;

    const gameMode = this.scene.gameMode || 'campaign';
    const bossGoldReward = rewards.bossGoldReward || 0;
    
    // Scale gold rewards in gold_farm mode (10x gold)
    let baseGoldReward = this.stage.goldReward;
    if (gameMode === 'gold_farm') {
      baseGoldReward = this.stage.goldReward * 3; // 3x base gold reward
    }
    
    // Let's count collected gold from the gameplay!
    const collectedGold = this.gameStats.gold;
    const goldReward = baseGoldReward + bossGoldReward + (gameMode === 'gold_farm' ? collectedGold : 0);
    const totalGold = addPlayerGold(this.scene, goldReward);
    const nextStage = getNextStage(this.stage.stageId);

    // Give Player EXP on victory
    const expReward = this.stage.stageId * 50 + this.gameStats.killCount * 2;
    const expResult = addPlayerExp(this.scene, expReward);

    // Only unlock next campaign stage if we are playing campaign mode!
    if (gameMode === 'campaign') {
      unlockStage(this.scene, nextStage.stageId, this.stage.stageId, this.elapsedTime);
    }

    // Roll ticket drop (e.g., 25% chance to drop one random entry ticket on victory of campaign/survival)
    let ticketDrop = null;
    if ((gameMode === 'campaign' || gameMode === 'survival') && Math.random() < 0.25) {
      const tickets = ['survival-ticket', 'gold-ticket', 'boss-ticket'];
      ticketDrop = Phaser.Utils.Array.GetRandom(tickets);
      addPlayerTicket(this.scene, ticketDrop, 1);
    }

    const result = {
      stage: this.stage,
      gameMode,
      nextStage,
      totalGold,
      temporaryGold: this.gameStats.gold,
      goldReward,
      stageGoldReward: baseGoldReward,
      bossGoldReward,
      equipmentDrop: rewards.equipmentDrop || null,
      materialDrops: rewards.materialDrops || null,
      ticketDrop,
      kills: this.gameStats.killCount,
      expGained: expReward,
      playerLevel: expResult.level,
      playerLeveledUp: expResult.leveledUp
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
      elapsedTime: this.elapsedTime,
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
