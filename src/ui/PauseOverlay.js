import { soundManager } from '../services/soundManager.js';

export default class PauseOverlay {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.backdrop = null;
    this.isShown = false;
  }

  show(onResume, onRestart, onMainMenu) {
    this.clear();
    this.isShown = true;

    // 1. Semi-transparent backdrop overlay
    this.backdrop = this.add(this.scene.add.rectangle(640, 360, 1280, 720, 0x020617, 0.75));

    // 2. Glassmorphic Outer Card
    const panelWidth = 360;
    const panelHeight = 320;
    const panelBg = this.add(this.scene.add.rectangle(640, 360, panelWidth, panelHeight, 0x0f172a, 0.98))
      .setStrokeStyle(3, 0x38bdf8, 0.9); // Cyan glowing border for pause menu

    // Visual accent top line
    const panelAccent = this.add(this.scene.add.graphics());
    panelAccent.fillStyle(0x38bdf8, 0.4);
    panelAccent.fillRoundedRect(640 - panelWidth / 2 + 16, 360 - panelHeight / 2 + 6, panelWidth - 32, 3, 1.5);

    // 3. Header Title (PAUSED)
    const title = this.add(this.scene.add.text(640, 240, 'GAME PAUSED', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '28px',
      color: '#38bdf8',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 5
    }).setOrigin(0.5));

    // Pulsing animation for title
    this.scene.tweens.add({
      targets: title,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 4. Action Buttons (Stacked Vertically)
    // Resume Button
    this.addButton(640, 305, 'RESUME PLAY', 0x0ea5e9, () => {
      onResume();
    });

    // Restart Button
    this.addButton(640, 365, 'RESTART RUN', 0xd97706, () => {
      onRestart();
    });

    // Return Menu Button
    this.addButton(640, 425, 'LEAVE TO MENU', 0x475569, () => {
      onMainMenu();
    });

    // Fade-in entry animation
    this.items.forEach(item => item.setAlpha(0));
    this.scene.tweens.add({
      targets: this.items,
      alpha: 1,
      duration: 250
    });
  }

  hide() {
    this.clear();
    this.isShown = false;
  }

  addButton(x, y, label, fillColor, onClick) {
    const btnWidth = 200;
    const btnHeight = 42;

    const button = this.add(this.scene.add.rectangle(x, y, btnWidth, btnHeight, fillColor, 1))
      .setStrokeStyle(1.5, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true });

    const text = this.add(this.scene.add.text(x, y, label, {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 3
    }).setOrigin(0.5));

    button.on('pointerover', () => {
      button.setFillStyle(Phaser.Display.Color.IntegerToColor(fillColor).brighten(18).color);
      this.scene.tweens.add({
        targets: [button, text],
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 120
      });
      soundManager.playSFX(this.scene, 'hover');
    });

    button.on('pointerout', () => {
      button.setFillStyle(fillColor);
      this.scene.tweens.add({
        targets: [button, text],
        scaleX: 1,
        scaleY: 1,
        duration: 120
      });
    });

    button.on('pointerdown', () => {
      button.setScale(0.96);
      text.setScale(0.96);
    });

    button.on('pointerup', () => {
      button.setScale(1.04);
      text.setScale(1.04);
      soundManager.playSFX(this.scene, 'click');
      onClick();
    });
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(2500); // Higher depth than game result overlays
    this.items.push(item);
    return item;
  }

  clear() {
    if (this.backdrop) {
      this.backdrop.destroy();
      this.backdrop = null;
    }
    this.items.forEach((item) => item.destroy());
    this.items = [];
  }
}
