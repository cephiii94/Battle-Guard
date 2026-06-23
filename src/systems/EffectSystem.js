import Phaser from 'phaser';

export default class EffectSystem {
  static createHitEffect(scene, x, y, isCritical = false) {
    if (!scene || !scene.sys) return;
    
    const emitter = scene.add.particles(x, y, 'aura-particle', {
      speed: isCritical ? { min: 80, max: 250 } : { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: isCritical ? { start: 1.0, end: 0 } : { start: 0.6, end: 0 },
      lifespan: isCritical ? 500 : 350,
      tint: isCritical ? [0xfacc15, 0xeab308, 0xef4444] : 0x38bdf8,
      blendMode: 'ADD',
      emitting: false
    });
    
    emitter.explode(isCritical ? 16 : 8);
    scene.time.delayedCall(isCritical ? 600 : 400, () => {
      if (emitter && emitter.destroy) emitter.destroy();
    });
  }

  static createDeathEffect(scene, x, y) {
    if (!scene || !scene.sys) return;

    const emitter = scene.add.particles(x, y, 'aura-particle', {
      speed: { min: 30, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      lifespan: 400,
      tint: 0xa855f7, // purple
      blendMode: 'ADD',
      emitting: false
    });
    
    emitter.explode(12);
    scene.time.delayedCall(500, () => {
      if (emitter && emitter.destroy) emitter.destroy();
    });
  }

  static createBossDeathEffect(scene, x, y) {
    if (!scene || !scene.sys) return;

    for (let i = 0; i < 4; i++) {
      scene.time.delayedCall(i * 150, () => {
        if (!scene || !scene.sys) return;
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        const emitter = scene.add.particles(x + offsetX, y + offsetY, 'aura-particle', {
          speed: { min: 100, max: 300 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.2, end: 0 },
          lifespan: 800,
          tint: [0xff00ff, 0x00ffff, 0xffff00, 0xff0000],
          blendMode: 'ADD',
          emitting: false
        });
        
        emitter.explode(25);
        scene.time.delayedCall(900, () => {
          if (emitter && emitter.destroy) emitter.destroy();
        });
      });
    }
  }

  static createLevelUpEffect(scene, x, y) {
    if (!scene || !scene.sys) return;

    const emitter = scene.add.particles(x, y, 'aura-particle', {
      x: { min: -20, max: 20 },
      y: 0,
      speedY: { min: -150, max: -300 },
      speedX: { min: -50, max: 50 },
      scale: { start: 1.0, end: 0 },
      lifespan: 1000,
      tint: [0x22c55e, 0xfacc15, 0xffffff], // Green, gold, white
      blendMode: 'ADD',
      emitting: false
    });

    emitter.explode(40);
    scene.time.delayedCall(1200, () => {
      if (emitter && emitter.destroy) emitter.destroy();
    });
  }
}
