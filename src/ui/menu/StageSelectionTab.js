import { getStageById } from '../../data/stages.js';
import { getPlayerProgress } from '../../systems/PlayerProgress.js';
import { soundManager } from '../../services/soundManager.js';
import UI from './MenuConfig.js';

export class StageSelectionTab {
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
      this.scene.add.rectangle(width / 2, height / 2, 860, 520, 0x0f172a, 0.98)
        .setStrokeStyle(3, 0x3b82f6, 0.9)
    );

    // Decorative Title bar
    const titleBg = this.scene.add.graphics();
    titleBg.fillStyle(0x1e293b, 1);
    titleBg.fillRoundedRect(width / 2 - 200, height / 2 - 235, 400, 48, 8);
    titleBg.lineStyle(2, 0x60a5fa, 1);
    titleBg.strokeRoundedRect(width / 2 - 200, height / 2 - 235, 400, 48, 8);
    this.add(titleBg);

    // Title text
    this.add(
      this.scene.add.text(width / 2, height / 2 - 210, 'SELECT BATTLEFIELD', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: UI.white,
        fontStyle: '900',
        stroke: '#0f172a',
        strokeThickness: 3,
      }).setOrigin(0.5)
    );

    // Close Button
    this.addCloseButton(width / 2 + 395, height / 2 - 225);

    // Stage Grid Configuration
    const highestStage = this.scene.playerProgress.highestStageUnlocked || 1;
    const cols = 3;
    const rows = 2;
    const startX = width / 2 - 260;
    const startY = height / 2 - 90;
    const gapX = 260;
    const gapY = 180;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const stageIndex = r * cols + c;
        const stageId = stageIndex + 1;
        const x = startX + c * gapX;
        const y = startY + r * gapY;

        this.drawStageCard(x, y, stageId, highestStage);
      }
    }
  }

  drawStageCard(x, y, stageId, highestStage) {
    const stage = getStageById(stageId);
    const isUnlocked = stageId <= highestStage;

    if (isUnlocked) {
      // Unlocked Stage Card
      const card = this.add(
        this.scene.add.rectangle(x, y, 230, 150, 0x1e293b, 0.95)
          .setStrokeStyle(2, 0x3b82f6, 0.95)
          .setInteractive({ useHandCursor: true })
      );

      const stageNumText = this.add(
        this.scene.add.text(x, y - 48, stage.stageName.toUpperCase(), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          color: UI.yellow,
          fontStyle: '900',
          stroke: '#0c1648',
          strokeThickness: 3,
        }).setOrigin(0.5)
      );

      const stageTimes = this.scene.playerProgress.stageTimes || {};
      const clearTime = stageTimes[stageId];
      let timeLabel = 'Best Time: --:--';
      if (clearTime !== undefined && clearTime !== null) {
        const mins = Math.floor(clearTime / 60).toString().padStart(2, '0');
        const secs = (clearTime % 60).toString().padStart(2, '0');
        timeLabel = `Best Time: ${mins}:${secs}`;
      }

      this.add(
        this.scene.add.text(x, y - 12, timeLabel, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          color: '#bfdbfe',
          fontStyle: '800',
        }).setOrigin(0.5)
      );

      this.add(
        this.scene.add.text(x, y + 15, `Reward: ${stage.goldReward}g`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          color: UI.cyan,
          fontStyle: '800',
        }).setOrigin(0.5)
      );

      const btnBg = this.add(
        this.scene.add.rectangle(x, y + 50, 130, 28, 0x2563eb, 1)
          .setStrokeStyle(1, 0x60a5fa, 1)
      );

      const btnText = this.add(
        this.scene.add.text(x, y + 50, 'START BATTLE', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: UI.white,
          fontStyle: '900',
        }).setOrigin(0.5)
      );

      // Card hover animation
      card.on('pointerover', () => {
        card.setScale(1.04);
        card.setStrokeStyle(3, 0x60a5fa, 1);
        stageNumText.setScale(1.04);
        btnBg.setScale(1.04);
        btnText.setScale(1.04);
        soundManager.playSFX(this.scene, 'hover');
      });

      card.on('pointerout', () => {
        card.setScale(1);
        card.setStrokeStyle(2, 0x3b82f6, 0.95);
        stageNumText.setScale(1);
        btnBg.setScale(1);
        btnText.setScale(1);
      });

      card.on('pointerup', () => {
        soundManager.playSFX(this.scene, 'click');
        this.clear();
        this.scene.scene.start('GameScene', {
          stageId,
          selectedHero: this.scene.selectedHero,
          baseHeroStats: this.scene.selectedHeroBaseStats,
          equippedItems: this.scene.equippedItems,
          activeSkin: this.scene.activeSkin,
          finalStats: this.scene.finalHeroStats,
          heroLevel: this.scene.heroLevel
        });
      });
    } else {
      // Locked Stage Card
      this.add(
        this.scene.add.rectangle(x, y, 230, 150, 0x0f172a, 0.7)
          .setStrokeStyle(1, 0x475569, 0.8)
      );

      this.add(
        this.scene.add.text(x, y - 48, stage.stageName.toUpperCase(), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          color: '#64748b',
          fontStyle: '900',
          align: 'center'
        }).setOrigin(0.5)
      );

      // Padlock Icon
      this.add(
        this.scene.add.image(x, y, 'ui-lock-icon')
          .setDisplaySize(38, 38)
          .setOrigin(0.5)
      );

      this.add(
        this.scene.add.text(x, y + 44, 'LOCKED', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#64748b',
          fontStyle: '900',
          letterSpacing: 2,
        }).setOrigin(0.5)
      );
    }
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
      soundManager.playSFX(this.scene, 'hover');
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
