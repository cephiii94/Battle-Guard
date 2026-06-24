import Phaser from 'phaser';
import UI from '../ui/menu/MenuConfig.js';

import { soundManager } from '../services/soundManager.js';
import { GameManager } from '../systems/GameManager.js';

export default class TitleScreen extends Phaser.Scene {
  constructor() {
    super('TitleScreen');
  }

  create() {
    const { width, height } = this.scale;
    const isPortrait = height > width;

    // Background Setup
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a101d, 0x0a101d, 0x111e3b, 0x0a101d, 1);
    bg.fillRect(0, 0, width, height);

    // Cyber grid perspective
    const floorY = height * 0.75;
    bg.lineStyle(1.5, 0x00d6ff, 0.18);
    for (let i = 0; i <= 10; i++) {
      const py = floorY + (height - floorY) * Math.pow(i / 10, 1.8);
      bg.lineBetween(0, py, width, py);
    }
    for (let i = -10; i <= 10; i++) {
      bg.lineBetween(width / 2 + i * (isPortrait ? 8 : 14), floorY - 120, width / 2 + i * (isPortrait ? 60 : 100), height);
    }

    // Logo / Title
    const title = this.add.text(width / 2, height / 3, 'BATTLE GUARD', {
      fontFamily: 'Outfit, "Trebuchet MS", Arial, sans-serif',
      fontSize: isPortrait ? '48px' : '80px',
      color: UI.yellow,
      fontStyle: '900',
      stroke: '#081735',
      strokeThickness: isPortrait ? 5 : 8,
      shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 10, stroke: true, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: height / 3 - 15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const savedName = GameManager.get('playerName');

    if (!savedName || savedName === 'Player') {
      this.showNameInputForm(width, height);
    } else {
      this.showTapToStart(width, height);
    }
    
    this.resizeListener = (gameSize, baseSize, displaySize, prevWidth, prevHeight) => {
      if (prevWidth && prevHeight && (gameSize.width !== prevWidth || gameSize.height !== prevHeight)) {
        this.scene.restart();
      }
    };
    this.scale.on('resize', this.resizeListener);

    this.events.once('shutdown', () => {
      this.scale.off('resize', this.resizeListener);
    });

    // Attempt to start bgm
    soundManager.playBGM(this, 'menu-bgm');
  }

  showNameInputForm(width, height) {
    const cy = height / 2 + 80;

    this.add.text(width / 2, cy - 40, 'ENTER YOUR HERO NAME', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '20px',
      color: '#69e6ff',
      fontStyle: '800',
      stroke: '#07111f',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Create an HTML input element using Phaser's DOM Element
    const inputHtml = `
      <input type="text" id="heroNameInput" name="heroName" placeholder="Novice" autocomplete="off"
        style="
          width: min(300px, 80vw);
          height: 40px;
          padding: 8px 16px;
          font-family: Outfit, Arial, sans-serif;
          font-size: 16px;
          font-weight: bold;
          color: #ffffff;
          background-color: rgba(7, 17, 31, 0.85);
          border: 2px solid #00d6ff;
          border-radius: 8px;
          outline: none;
          text-align: center;
          text-transform: uppercase;
        "
      />
    `;

    const inputElement = this.add.dom(width / 2, cy).createFromHTML(inputHtml);
    
    // Focus the input
    setTimeout(() => {
      const el = document.getElementById('heroNameInput');
      if (el) el.focus();
    }, 100);

    // Confirm Button
    const btnGroup = this.add.container(width / 2, cy + 70);
    const btnBg = this.add.rectangle(0, 0, 160, 44, 0x1d4ed8, 0.9)
      .setStrokeStyle(2, 0x60a5fa, 1)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(0, 0, 'CONFIRM', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: '900'
    }).setOrigin(0.5);

    btnGroup.add([btnBg, btnText]);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x2563eb, 1);
      soundManager.playSFX(this, 'hover');
    });
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x1d4ed8, 0.9));
    
    btnBg.on('pointerup', () => {
      soundManager.playSFX(this, 'click');
      const inputNode = document.getElementById('heroNameInput');
      let nameVal = inputNode ? inputNode.value.trim().toUpperCase() : '';
      if (!nameVal) {
        nameVal = 'NOVICE';
      }

      // Save the name
      GameManager.set('playerName', nameVal);

      // Transition to start
      inputElement.destroy();
      btnGroup.destroy();
      
      this.cameras.main.flash(500, 255, 255, 255);
      this.showTapToStart(width, height);
    });
  }

  showTapToStart(width, height) {
    const savedName = GameManager.get('playerName') || 'HERO';

    this.add.text(width / 2, height * 0.75 - 40, `WELCOME BACK, ${savedName.toUpperCase()}`, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '16px',
      color: '#69e6ff',
      fontStyle: '800',
      stroke: '#081735',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const startText = this.add.text(width / 2, height * 0.75, 'TAP ANYWHERE TO START', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: '900',
      stroke: '#081735',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Make entire screen clickable
    const clickZone = this.add.zone(width / 2, height / 2, width, height).setInteractive({ useHandCursor: true });
    clickZone.on('pointerdown', () => {
      soundManager.playSFX(this, 'click');
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });
  }
}
