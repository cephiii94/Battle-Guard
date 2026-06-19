import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';
import { resetSaveData } from '../../services/saveService.js';
import { GameManager } from '../../systems/GameManager.js';

export class SettingsTab {
  constructor(scene) {
    this.scene = scene;
    this.layer = [];
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(2000);
    this.layer.push(item);
    return item;
  }

  clear() {
    this.layer.forEach((item) => item.destroy());
    this.layer = [];
  }

  isActive() {
    return this.layer.length > 0;
  }

  show() {
    this.scene.clearAllTabs();
    const { width, height } = this.scene.scale;

    // Dim Background
    this.add(this.scene.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.75));

    // Main Settings Panel
    this.add(
      this.scene.add.rectangle(width / 2, height / 2, 460, 380, 0x0f172a, 0.98)
        .setStrokeStyle(3, 0x00d6ff, 0.9)
    );

    // Title text
    this.add(
      this.scene.add.text(width / 2, height / 2 - 140, 'SETTINGS', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0f172a',
        strokeThickness: 3,
      }).setOrigin(0.5)
    );

    // Close Button
    this.addCloseButton(width / 2 + 195, height / 2 - 155);

    // Music Setting Container
    const musicY = height / 2 - 100;
    this.add(
      this.scene.add.text(width / 2 - 130, musicY, 'BACKGROUND MUSIC', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0c1648',
        strokeThickness: 3,
      }).setOrigin(0, 0.5)
    );

    const isMusicOn = soundManager.isMusicEnabled();
    const musicBtn = this.add(
      this.scene.add.rectangle(width / 2 + 80, musicY, 100, 36, isMusicOn ? 0x15803d : 0xb91c1c, 1)
        .setStrokeStyle(2, isMusicOn ? 0x4ade80 : 0xfca5a5, 1)
        .setInteractive({ useHandCursor: true })
    );

    const musicBtnText = this.add(
      this.scene.add.text(width / 2 + 80, musicY, isMusicOn ? 'ON' : 'OFF', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    musicBtn.on('pointerover', () => {
      musicBtn.setScale(1.05);
      musicBtnText.setScale(1.05);
    });
    musicBtn.on('pointerout', () => {
      musicBtn.setScale(1);
      musicBtnText.setScale(1);
    });
    musicBtn.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      soundManager.setMusicEnabled(!soundManager.isMusicEnabled());
      this.show();
    });

    // SFX Setting Container
    const sfxY = height / 2 - 40;
    this.add(
      this.scene.add.text(width / 2 - 130, sfxY, 'SOUND EFFECTS (SFX)', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0c1648',
        strokeThickness: 3,
      }).setOrigin(0, 0.5)
    );

    const isSfxOn = soundManager.isSFXEnabled();
    const sfxBtn = this.add(
      this.scene.add.rectangle(width / 2 + 80, sfxY, 100, 36, isSfxOn ? 0x15803d : 0xb91c1c, 1)
        .setStrokeStyle(2, isSfxOn ? 0x4ade80 : 0xfca5a5, 1)
        .setInteractive({ useHandCursor: true })
    );

    const sfxBtnText = this.add(
      this.scene.add.text(width / 2 + 80, sfxY, isSfxOn ? 'ON' : 'OFF', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    sfxBtn.on('pointerover', () => {
      sfxBtn.setScale(1.05);
      sfxBtnText.setScale(1.05);
    });
    sfxBtn.on('pointerout', () => {
      sfxBtn.setScale(1);
      sfxBtnText.setScale(1);
    });
    sfxBtn.on('pointerup', () => {
      soundManager.setSFXEnabled(!soundManager.isSFXEnabled());
      soundManager.playSFX(this.scene, 'click');
      this.show();
    });

    // Screen Scale Setting Container
    const scaleY = height / 2 + 20;
    this.add(
      this.scene.add.text(width / 2 - 130, scaleY, 'SCREEN SCALE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0c1648',
        strokeThickness: 3,
      }).setOrigin(0, 0.5)
    );

    const currentMode = this.scene.scale.scaleMode;
    const isStretched = currentMode !== Phaser.Scale.NONE;
    const scaleBtn = this.add(
      this.scene.add.rectangle(width / 2 + 85, scaleY, 140, 36, isStretched ? 0x15803d : 0x0284c7, 1)
        .setStrokeStyle(2, isStretched ? 0x4ade80 : 0x38bdf8, 1)
        .setInteractive({ useHandCursor: true })
    );

    const scaleBtnText = this.add(
      this.scene.add.text(width / 2 + 85, scaleY, isStretched ? 'REGANGKAN' : 'RESOLUSI CANVAS', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    scaleBtn.on('pointerover', () => {
      scaleBtn.setScale(1.05);
      scaleBtnText.setScale(1.05);
    });
    scaleBtn.on('pointerout', () => {
      scaleBtn.setScale(1);
      scaleBtnText.setScale(1);
    });
    scaleBtn.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      if (isStretched) {
        this.scene.scale.scaleMode = Phaser.Scale.NONE;
        localStorage.setItem('game-scale-mode', 'canvas');
      } else {
        this.scene.scale.scaleMode = Phaser.Scale.FIT;
        localStorage.setItem('game-scale-mode', 'stretch');
      }
      this.scene.scale.refresh();
      this.show();
    });

    // Reset Account Container (For Development)
    const resetY = height / 2 + 100;
    const resetBtn = this.add(
      this.scene.add.rectangle(width / 2, resetY, 320, 40, 0x991b1b, 1)
        .setStrokeStyle(2, 0xfecaca, 1)
        .setInteractive({ useHandCursor: true })
    );

    const resetBtnText = this.add(
      this.scene.add.text(width / 2, resetY, 'RESET ACCOUNT DATA', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    resetBtn.on('pointerover', () => {
      resetBtn.setScale(1.05);
      resetBtnText.setScale(1.05);
    });
    resetBtn.on('pointerout', () => {
      resetBtn.setScale(1);
      resetBtnText.setScale(1);
    });
    resetBtn.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      if (window.confirm('Reset data akun? Game akan dimuat ulang ke keadaan awal.')) {
        const newPlayerData = resetSaveData();
        GameManager.setState(newPlayerData);
        this.clear();
        this.scene.scene.restart();
      }
    });
  }

  addCloseButton(x, y) {
    const button = this.add(
      this.scene.add.rectangle(x, y, 36, 36, 0xd97706, 1)
        .setStrokeStyle(2, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );

    const text = this.add(
      this.scene.add.text(x, y, 'X', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );

    button.on('pointerover', () => {
      button.setScale(1.1);
      text.setScale(1.1);
    });

    button.on('pointerout', () => {
      button.setScale(1);
      text.setScale(1);
    });

    button.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      this.clear();
    });
  }
}
