import {
  getPlayerProgress,
  getDailyAttemptsRemaining,
  consumeDailyAttempt,
  hasTicket,
  consumeTicket
} from '../../systems/PlayerProgress.js';
import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';

export class ModeSelectionTab {
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
    this.scene.refreshHeroLoadout();
    this.scene.playerProgress = getPlayerProgress(this.scene);

    const { width, height } = this.scene.scale;

    // Dim Background
    this.add(this.scene.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.75));

    // Main Dialog Panel
    this.add(
      this.scene.add.rectangle(width / 2, height / 2, 880, 530, 0x0f172a, 0.98)
        .setStrokeStyle(3, 0x00bcd4, 0.9)
    );

    // Decorative Title bar
    const titleBg = this.scene.add.graphics();
    titleBg.fillStyle(0x1e293b, 1);
    titleBg.fillRoundedRect(width / 2 - 220, height / 2 - 240, 440, 48, 8);
    titleBg.lineStyle(2, 0x00bcd4, 1);
    titleBg.strokeRoundedRect(width / 2 - 220, height / 2 - 240, 440, 48, 8);
    this.add(titleBg);

    // Title text
    this.add(
      this.scene.add.text(width / 2, height / 2 - 216, 'SELECT GAME MODE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0f172a',
        strokeThickness: 3,
      }).setOrigin(0.5)
    );

    // Close Button
    const closeBtn = this.add(
      this.scene.add.rectangle(width / 2 + 405, height / 2 - 230, 36, 36, 0xd97706, 1)
        .setStrokeStyle(2, 0xfef08a, 1)
        .setInteractive({ useHandCursor: true })
    );
    const closeText = this.add(
      this.scene.add.text(width / 2 + 405, height / 2 - 230, 'X', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: UI.white,
        fontStyle: '900',
      }).setOrigin(0.5)
    );
    closeBtn.on('pointerover', () => { closeBtn.setScale(1.1); closeText.setScale(1.1); soundManager.playSFX(this.scene, 'hover'); });
    closeBtn.on('pointerout', () => { closeBtn.setScale(1); closeText.setScale(1); });
    closeBtn.on('pointerup', () => {
      soundManager.playSFX(this.scene, 'click');
      this.clear();
    });

    // Modes configuration
    const modes = [
      {
        id: 'survival',
        name: 'SURVIVAL',
        desc: 'Bertahan hidup selama 90 detik.\nMusuh terus menggila.',
        limitText: '3x / day',
        color: 0xe040fb,
        btnLabel: 'ENTER SURVIVAL',
        ticketKey: 'survival-ticket',
      },
      {
        id: 'gold_farm',
        name: 'GOLD FARMING',
        desc: 'Dapatkan gold berlimpah\ndari monster dalam 60s.',
        limitText: '3x / day',
        color: 0x4caf50,
        btnLabel: 'ENTER FARMING',
        ticketKey: 'gold-ticket',
      },
      {
        id: 'looting',
        name: 'LOOTING BOSS',
        desc: 'Kalahkan Boss kuat.\nDapatkan material crafting.',
        limitText: '3x / day',
        color: 0x00bcd4,
        btnLabel: 'ENTER LOOTING',
        ticketKey: 'boss-ticket',
      }
    ];

    const cardW = 230;
    const cardH = 340;
    const startX = width / 2 - 270;
    const gapX = 270;
    const centerY = height / 2 + 30;

    modes.forEach((mode, index) => {
      const x = startX + index * gapX;

      // Card Background
      const card = this.add(
        this.scene.add.rectangle(x, centerY, cardW, cardH, 0x1e293b, 0.95)
          .setStrokeStyle(2.5, mode.color, 0.8)
          .setInteractive({ useHandCursor: true })
      );

      // Title
      this.add(
        this.scene.add.text(x, centerY - 130, mode.name, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '18px',
          color: UI.yellow,
          fontStyle: '900',
          align: 'center'
        }).setOrigin(0.5)
      );

      // Description
      this.add(
        this.scene.add.text(x, centerY - 70, mode.desc, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: '#e2e8f0',
          fontStyle: '700',
          align: 'center',
          lineSpacing: 4
        }).setOrigin(0.5)
      );

      // Limit Info & Ticket count
      let limitValueText = mode.limitText;
      let ticketCountText = '';
      let remaining = 3;

      remaining = getDailyAttemptsRemaining(this.scene, mode.id);
      const ticketQty = this.scene.playerProgress.tickets ? (this.scene.playerProgress.tickets[mode.ticketKey] || 0) : 0;
      limitValueText = `Attempts: ${remaining}/3`;
      ticketCountText = `Tickets: ${ticketQty} 🎟️`;

      this.add(
        this.scene.add.text(x, centerY + 10, limitValueText, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: remaining > 0 ? '#4ade80' : '#f87171',
          fontStyle: '900',
          align: 'center'
        }).setOrigin(0.5)
      );

      if (ticketCountText) {
        this.add(
          this.scene.add.text(x, centerY + 36, ticketCountText, {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: '12px',
            color: '#38bdf8',
            fontStyle: '900',
            align: 'center'
          }).setOrigin(0.5)
        );
      }

      // Enter Button
      const btnBg = this.add(
        this.scene.add.rectangle(x, centerY + 110, 160, 40, mode.color, 1)
          .setStrokeStyle(1.5, 0xffffff, 1)
      );
      const btnText = this.add(
        this.scene.add.text(x, centerY + 110, mode.btnLabel, {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: '900'
        }).setOrigin(0.5)
      );

      card.on('pointerover', () => {
        card.setScale(1.03);
        card.setStrokeStyle(3.5, mode.color, 1);
        btnBg.setScale(1.04);
        btnText.setScale(1.04);
        soundManager.playSFX(this.scene, 'hover');
      });
      card.on('pointerout', () => {
        card.setScale(1);
        card.setStrokeStyle(2.5, mode.color, 0.8);
        btnBg.setScale(1);
        btnText.setScale(1);
      });

      card.on('pointerup', () => {
        soundManager.playSFX(this.scene, 'click');
        let canEnter = false;
        let useTicket = false;
        if (remaining > 0) {
          canEnter = true;
        } else {
          const hasTkt = hasTicket(this.scene, mode.ticketKey);
          if (hasTkt) {
            canEnter = true;
            useTicket = true;
          }
        }

        if (canEnter) {
          if (useTicket) {
            consumeTicket(this.scene, mode.ticketKey);
            this.showFeedback('Ticket consumed for entry!');
          } else {
            consumeDailyAttempt(this.scene, mode.id);
          }

          this.clear();

          // Start game on player highest unlocked campaign stage number but in target game mode!
          const highestStageId = this.scene.playerProgress.highestStageUnlocked || 1;
          this.scene.scene.start('GameScene', {
            stageId: highestStageId,
            gameMode: mode.id,
            selectedHero: this.scene.selectedHero,
            baseHeroStats: this.scene.selectedHeroBaseStats,
            equippedItems: this.scene.equippedItems,
            activeSkin: this.scene.activeSkin,
            finalStats: this.scene.finalHeroStats,
            heroLevel: this.scene.heroLevel
          });
        } else {
          soundManager.playSFX(this.scene, 'hit');
          this.showFeedback('No attempts or tickets remaining!');
        }
      });
    });
  }

  showFeedback(message) {
    const { width, height } = this.scene.scale;
    const text = this.scene.add.text(width / 2, height / 2, message, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '20px',
      color: '#f87171',
      fontStyle: '900',
      stroke: '#000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(3000);

    this.scene.tweens.add({
      targets: text,
      y: height / 2 - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy()
    });
  }
}
