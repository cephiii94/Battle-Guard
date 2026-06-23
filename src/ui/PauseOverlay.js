import './dom/pause.css';
import { soundManager } from '../services/soundManager.js';

export default class PauseOverlay {
  constructor(scene) {
    this.scene = scene;
    this.overlayElement = null;
    this.isShown = false;
  }

  show(onResume, onRestart, onMainMenu) {
    this.clear();
    this.isShown = true;

    // Disable Phaser inputs
    if (this.scene.input) {
      this.scene.input.enabled = false;
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = false;
      }
    }

    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) {
      uiRoot.style.pointerEvents = 'auto';
    }

    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'pause-overlay';

    // Prevent click propagation to Phaser canvas
    const stopProp = (e) => e.stopPropagation();
    this.overlayElement.addEventListener('pointerdown', stopProp);
    this.overlayElement.addEventListener('pointerup', stopProp);
    this.overlayElement.addEventListener('click', stopProp);
    this.overlayElement.addEventListener('mousedown', stopProp);
    this.overlayElement.addEventListener('mouseup', stopProp);

    this.overlayElement.innerHTML = `
      <div class="pause-container">
        <div class="pause-header">
          <h2 class="pause-title">GAME PAUSED</h2>
        </div>
        <div class="pause-body">
          <button class="pause-btn btn-resume" id="resume-btn">RESUME PLAY</button>
          <button class="pause-btn btn-restart" id="restart-btn">RESTART RUN</button>
          <button class="pause-btn btn-leave" id="leave-btn">LEAVE TO MENU</button>
        </div>
      </div>
    `;

    // Wire up events
    const resumeBtn = this.overlayElement.querySelector('#resume-btn');
    resumeBtn.addEventListener('mouseenter', () => soundManager.playSFX(this.scene, 'hover'));
    resumeBtn.addEventListener('click', () => {
      soundManager.playSFX(this.scene, 'click');
      onResume();
    });

    const restartBtn = this.overlayElement.querySelector('#restart-btn');
    restartBtn.addEventListener('mouseenter', () => soundManager.playSFX(this.scene, 'hover'));
    restartBtn.addEventListener('click', () => {
      soundManager.playSFX(this.scene, 'click');
      onRestart();
    });

    const leaveBtn = this.overlayElement.querySelector('#leave-btn');
    leaveBtn.addEventListener('mouseenter', () => soundManager.playSFX(this.scene, 'hover'));
    leaveBtn.addEventListener('click', () => {
      soundManager.playSFX(this.scene, 'click');
      onMainMenu();
    });

    uiRoot.appendChild(this.overlayElement);
  }

  hide() {
    this.clear();
    this.isShown = false;
  }

  clear() {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }

    // Re-enable Phaser inputs
    if (this.scene.input) {
      this.scene.input.enabled = true;
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = true;
      }
    }

    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) {
      uiRoot.style.pointerEvents = 'none';
    }
  }
}
