import { soundManager } from '../../services/soundManager.js';
import { resetSaveData } from '../../services/saveService.js';
import { GameManager } from '../../systems/GameManager.js';
import Phaser from 'phaser';

export class SettingsTab {
  constructor(scene) {
    this.scene = scene;
  }

  clear() {
    if (this.scene.domUiManager && this.scene.domUiManager.isActive('settings')) {
      this.scene.domUiManager.closeCurrent();
    }
  }

  isActive() {
    return this.scene.domUiManager && this.scene.domUiManager.isActive('settings');
  }

  show() {
    this.scene.clearAllTabs();
    const isMusicOn = soundManager.isMusicEnabled();
    const isSfxOn = soundManager.isSFXEnabled();
    const currentMode = this.scene.scale.scaleMode;
    const isStretched = currentMode !== Phaser.Scale.NONE;

    const htmlString = `
      <div class="settings-container">
        <div class="settings-header">
          <div class="settings-title">
            <h2>⚙️ SETTINGS</h2>
          </div>
          <button class="settings-close-btn" id="btn-close-settings">✖</button>
        </div>
        <div class="settings-body">
          <div class="settings-row">
            <span class="settings-label">BACKGROUND MUSIC</span>
            <button class="settings-toggle-btn ${isMusicOn ? 'btn-on' : 'btn-off'}" id="btn-toggle-music">
              ${isMusicOn ? 'ON' : 'OFF'}
            </button>
          </div>
          <div class="settings-row">
            <span class="settings-label">SOUND EFFECTS (SFX)</span>
            <button class="settings-toggle-btn ${isSfxOn ? 'btn-on' : 'btn-off'}" id="btn-toggle-sfx">
              ${isSfxOn ? 'ON' : 'OFF'}
            </button>
          </div>
          <div class="settings-row">
            <span class="settings-label">SCREEN SCALE</span>
            <button class="settings-scale-btn ${isStretched ? 'btn-stretch' : 'btn-canvas'}" id="btn-toggle-scale">
              ${isStretched ? 'REGANGKAN' : 'RESOLUSI CANVAS'}
            </button>
          </div>
          <div class="settings-reset-row">
            <button class="settings-reset-btn" id="btn-reset-data">RESET ACCOUNT DATA</button>
          </div>
        </div>
      </div>
    `;

    this.scene.domUiManager.showOverlay('settings', htmlString, 'settings-overlay', (wrapper) => {
      this.wrapper = wrapper;

      // Close button
      wrapper.querySelector('#btn-close-settings').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.clear();
      });

      const musicBtn = wrapper.querySelector('#btn-toggle-music');
      const updateMusicBtn = () => {
        const isMusicOn = soundManager.isMusicEnabled();
        musicBtn.textContent = isMusicOn ? 'ON' : 'OFF';
        if (isMusicOn) {
          musicBtn.classList.remove('btn-off');
          musicBtn.classList.add('btn-on');
        } else {
          musicBtn.classList.remove('btn-on');
          musicBtn.classList.add('btn-off');
        }
      };

      // Toggle Music
      musicBtn.addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        soundManager.setMusicEnabled(!soundManager.isMusicEnabled());
        updateMusicBtn();
      });

      const sfxBtn = wrapper.querySelector('#btn-toggle-sfx');
      const updateSfxBtn = () => {
        const isSfxOn = soundManager.isSFXEnabled();
        sfxBtn.textContent = isSfxOn ? 'ON' : 'OFF';
        if (isSfxOn) {
          sfxBtn.classList.remove('btn-off');
          sfxBtn.classList.add('btn-on');
        } else {
          sfxBtn.classList.remove('btn-on');
          sfxBtn.classList.add('btn-off');
        }
      };

      // Toggle SFX
      sfxBtn.addEventListener('click', () => {
        soundManager.setSFXEnabled(!soundManager.isSFXEnabled());
        soundManager.playSFX(this.scene, 'click');
        updateSfxBtn();
      });

      const scaleBtn = wrapper.querySelector('#btn-toggle-scale');
      const updateScaleBtn = () => {
        const currentScaleMode = this.scene.scale.scaleMode;
        const isStretchedMode = currentScaleMode !== Phaser.Scale.NONE;
        scaleBtn.textContent = isStretchedMode ? 'REGANGKAN' : 'RESOLUSI CANVAS';
        if (isStretchedMode) {
          scaleBtn.classList.remove('btn-canvas');
          scaleBtn.classList.add('btn-stretch');
        } else {
          scaleBtn.classList.remove('btn-stretch');
          scaleBtn.classList.add('btn-canvas');
        }
      };

      // Toggle Scale
      scaleBtn.addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        const currentScaleMode = this.scene.scale.scaleMode;
        const isStretchedMode = currentScaleMode !== Phaser.Scale.NONE;
        if (isStretchedMode) {
          this.scene.scale.scaleMode = Phaser.Scale.NONE;
          localStorage.setItem('game-scale-mode', 'canvas');
          
          // Clear Phaser inline styles from the canvas so it shrinks back to 1280x720
          const canvas = this.scene.sys.game.canvas;
          if (canvas) {
            canvas.style.width = '';
            canvas.style.height = '';
            canvas.style.marginLeft = '';
            canvas.style.marginTop = '';
          }
        } else {
          this.scene.scale.scaleMode = Phaser.Scale.FIT;
          localStorage.setItem('game-scale-mode', 'stretch');
        }
        this.scene.scale.refresh();
        updateScaleBtn();
      });

      // Reset Account Data
      wrapper.querySelector('#btn-reset-data').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        if (window.confirm('Reset data akun? Game akan dimuat ulang ke keadaan awal.')) {
          const newPlayerData = resetSaveData();
          GameManager.setState(newPlayerData);
          this.clear();
          this.scene.scene.restart();
        }
      });
    });
  }
}
