import { loadPlayerData, savePlayerData } from '../services/saveService.js';

class GameManagerClass {
  constructor() {
    this.state = null;
  }

  init() {
    if (!this.state) {
      this.state = loadPlayerData();
    }
  }

  getState() {
    if (!this.state) this.init();
    return this.state;
  }

  get(key) {
    if (!this.state) this.init();
    return this.state[key];
  }

  set(key, value) {
    if (!this.state) this.init();
    this.state[key] = value;
    savePlayerData(this.state);
  }

  update(key, partial) {
    if (!this.state) this.init();
    if (typeof this.state[key] === 'object' && this.state[key] !== null) {
      this.state[key] = { ...this.state[key], ...partial };
    } else {
      this.state[key] = partial;
    }
    savePlayerData(this.state);
  }

  setState(newState) {
    if (!this.state) this.init();
    this.state = { ...this.state, ...newState };
    savePlayerData(this.state);
  }
}

export const GameManager = new GameManagerClass();
