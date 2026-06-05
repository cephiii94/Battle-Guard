import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import './style.css';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#111827',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [GameScene]
};

new Phaser.Game(config);
