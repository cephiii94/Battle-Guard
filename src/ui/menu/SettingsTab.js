import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';

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
      this.scene.add.rectangle(width / 2, height / 2, 460, 320, 0x0f172a, 0.98)
        .setStrokeStyle(3, 0x00d6ff, 0.9)
    );

    // Title text
    this.add(
      this.scene.add.text(width / 2, height / 2 - 110, 'SETTINGS', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0f172a',
        strokeThickness: 3,
      }).setOrigin(0.5)
    );

    // Close Button
    this.addCloseButton(width / 2 + 195, height / 2 - 125);

    // Music Setting Container
    const musicY = height / 2 - 20;
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
    const sfxY = height / 2 + 40;
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
