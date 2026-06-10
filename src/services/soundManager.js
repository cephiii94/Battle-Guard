let sfxEnabled = true;
let musicEnabled = true;

// Load settings from localStorage if available
try {
  const storedSfx = window.localStorage.getItem('battle-guard-sfx-enabled');
  if (storedSfx !== null) {
    sfxEnabled = storedSfx === 'true';
  }
  const storedMusic = window.localStorage.getItem('battle-guard-music-enabled');
  if (storedMusic !== null) {
    musicEnabled = storedMusic === 'true';
  }
} catch (e) {
  console.warn('Could not read audio settings from localStorage:', e);
}

// Web Audio API Synthesizer Fallback
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Synthesizer functions for various game events
const synths = {
  click: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  },
  
  hover: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  },
  
  upgrade: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
    
    notes.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * 0.08;
      const duration = 0.2;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + duration);
      
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  },
  
  attack: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.07);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  },
  
  hit: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },
  
  kill: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.22);
    
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  },
  
  skill: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.18);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  },
  
  victory: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    // Triumphant chord: C4, E4, G4, C5, E5, G5
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    notes.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * 0.07;
      const duration = 0.35;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  },
  
  defeat: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    // Descending sad minor chord: C4, Ab3, G3, F3, Eb3, C3
    const notes = [261.63, 207.65, 196.00, 174.61, 155.56, 130.81];
    notes.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * 0.15;
      const duration = 0.45;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }
};

let currentBgmInstance = null;
let currentBgmKey = null;
let activeSceneForBgm = null;

export const soundManager = {
  isSFXEnabled() {
    return sfxEnabled;
  },

  isMusicEnabled() {
    return musicEnabled;
  },

  setSFXEnabled(enabled) {
    sfxEnabled = !!enabled;
    try {
      window.localStorage.setItem('battle-guard-sfx-enabled', String(sfxEnabled));
    } catch (e) {
      console.warn('Could not save sfx setting:', e);
    }
  },

  setMusicEnabled(enabled) {
    musicEnabled = !!enabled;
    try {
      window.localStorage.setItem('battle-guard-music-enabled', String(musicEnabled));
    } catch (e) {
      console.warn('Could not save music setting:', e);
    }

    // Apply setting immediately to currently playing music
    if (currentBgmInstance) {
      if (musicEnabled) {
        if (!currentBgmInstance.isPlaying) {
          currentBgmInstance.play();
        } else {
          currentBgmInstance.resume();
        }
      } else {
        currentBgmInstance.pause();
      }
    }
  },

  playSFX(scene, name, phaserKey = null) {
    if (!sfxEnabled) return;
    
    const targetKey = phaserKey || `${name}-sfx`;
    
    // Attempt Phaser sound first
    if (scene && scene.cache && scene.cache.audio && scene.cache.audio.exists(targetKey)) {
      try {
        scene.sound.play(targetKey);
        return;
      } catch (err) {
        console.warn(`Phaser play failed for ${targetKey}, falling back to synth:`, err);
      }
    }
    
    // Web Audio Synthesizer fallback
    const playSynth = synths[name];
    if (playSynth) {
      playSynth();
    }
  },

  playBGM(scene, key) {
    if (!scene || !scene.sound) return;

    activeSceneForBgm = scene;
    currentBgmKey = key;

    // If music is disabled, we preload/add the BGM but pause it immediately
    if (currentBgmInstance) {
      if (currentBgmInstance.key === key) {
        if (musicEnabled) {
          if (!currentBgmInstance.isPlaying) {
            currentBgmInstance.play();
          }
        } else {
          currentBgmInstance.pause();
        }
        return;
      }
      currentBgmInstance.stop();
    }

    try {
      if (scene.cache && scene.cache.audio && scene.cache.audio.exists(key)) {
        currentBgmInstance = scene.sound.add(key, { loop: true, volume: 0.35 });
        if (musicEnabled) {
          currentBgmInstance.play();
        }
      } else {
        console.log(`BGM key "${key}" not preloaded in Phaser, BGM will not play.`);
      }
    } catch (err) {
      console.error('Failed to start Phaser BGM:', err);
    }
  },

  stopBGM() {
    if (currentBgmInstance) {
      currentBgmInstance.stop();
      currentBgmInstance = null;
    }
    currentBgmKey = null;
    activeSceneForBgm = null;
  }
};
