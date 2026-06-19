import Phaser from 'phaser';
import TitleScreen from './scenes/TitleScreen.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameScene from './scenes/GameScene.js';
import {
  loadPlayerData,
  savePlayerData,
  setSaveStorageAdapter,
  firebaseAdapter
} from './services/saveService.js';
import {
  initializeAuth,
  loadFromFirestore,
  saveToFirestore,
  isFirebaseConfigured
} from './services/firebase.js';
import './style.css';
import './ui/dom/inventory.css';
import './ui/dom/hero.css';

const savedScaleMode = localStorage.getItem('game-scale-mode') || 'stretch';
let initialScaleMode = Phaser.Scale.FIT;
if (savedScaleMode === 'canvas') {
  initialScaleMode = Phaser.Scale.NONE;
} else if (savedScaleMode === 'stretch_exact') {
  initialScaleMode = Phaser.Scale.EXACT_FIT;
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#111827',
  resolution: window.devicePixelRatio || 1,
  antialias: true,
  antialiasGL: true,
  scale: {
    mode: initialScaleMode,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  dom: {
    createContainer: true
  },
  scene: [TitleScreen, MainMenuScene, GameScene]
};

async function startApp() {
  const loader = showLoadingScreen();

  if (isFirebaseConfigured) {
    try {
      // Switch to Firebase Adapter (dual write)
      setSaveStorageAdapter(firebaseAdapter);

      // Authenticate and load cloud save
      const uid = await initializeAuth();
      if (uid) {
        const cloudData = await loadFromFirestore();
        if (cloudData) {
          console.log('Firebase Cloud Save loaded successfully.');
          savePlayerData(cloudData); // This writes to local cache
        } else {
          console.log('No cloud save found. Uploading current local progress to cloud.');
          const currentLocal = loadPlayerData();
          await saveToFirestore(currentLocal);
        }
      }
    } catch (err) {
      console.error('Error syncing with Firebase Cloud:', err);
    }
  }

  // Remove loading screen
  loader.remove();

  // Launch Phaser Game
  const game = new Phaser.Game(config);
  const playerData = loadPlayerData();

  savePlayerData(playerData);
}

function showLoadingScreen() {
  const loader = document.createElement('div');
  loader.id = 'firebase-loader';
  loader.style.position = 'fixed';
  loader.style.top = '0';
  loader.style.left = '0';
  loader.style.width = '100vw';
  loader.style.height = '100vh';
  loader.style.display = 'flex';
  loader.style.flexDirection = 'column';
  loader.style.alignItems = 'center';
  loader.style.justifyContent = 'center';
  loader.style.background = 'radial-gradient(circle, #151038 0%, #070b14 100%)';
  loader.style.color = '#ffffff';
  loader.style.fontFamily = '"Trebuchet MS", Arial, sans-serif';
  loader.style.zIndex = '9999';

  const spinner = document.createElement('div');
  spinner.style.width = '50px';
  spinner.style.height = '50px';
  spinner.style.border = '5px solid rgba(255, 255, 255, 0.1)';
  spinner.style.borderTop = '5px solid #00d6ff';
  spinner.style.borderRadius = '50%';
  spinner.style.animation = 'spin 1s linear infinite';
  loader.appendChild(spinner);

  const styleSheet = document.createElement('style');
  styleSheet.innerText = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);

  const text = document.createElement('div');
  text.style.marginTop = '20px';
  text.style.fontSize = '18px';
  text.style.fontWeight = 'bold';
  text.style.letterSpacing = '2px';
  text.style.color = '#69e6ff';
  text.innerText = 'CONNECTING TO BATTLE GUARD CLOUD...';
  loader.appendChild(text);

  document.body.appendChild(loader);
  return loader;
}

startApp();
