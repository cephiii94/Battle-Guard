import Phaser from 'phaser';
import { getHeroById, getHeroBaseStats } from '../data/heroes.js';
import { GameManager } from '../systems/GameManager.js';



export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y, mapBounds, finalStats, activeSkin) {
    super(scene, x, y);

    const skinColors = activeSkin.colors;

    // Define collision radius
    this.radius = 24;

    this.finalStats = finalStats;
    this.activeSkin = activeSkin;
    this.speed = finalStats.moveSpeed;
    this.maxHp = finalStats.hp;
    this.hp = this.maxHp;
    this.damageMultiplier = 1;
    this.attackSpeedMultiplier = 1;
    this.baseDamage = finalStats.damage;
    this.attackRange = finalStats.attackRange;
    this.criticalChance = finalStats.criticalChance;
    this.healthRegen = finalStats.healthRegen || 0;
    this.armor = finalStats.armor || 0;
    this.lifesteal = finalStats.lifesteal || 0;
    this.evasion = finalStats.evasion || 0;
    this.cooldownReduction = finalStats.cooldownReduction || 0;
    this.attackType = finalStats.attackType || 'ranged';
    
    // Shield Stats
    this.shield = 0;
    this.maxShield = 0;
    this.lastHitTime = 0;
    
    this.mapBounds = mapBounds;

    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
      arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT
    });

    // Add to scene and set a clear baseline depth
    scene.add.existing(this);
    this.setDepth(5);

    // 1. Create dynamic particle aura (frost / flame / sparks trail)
    this.currentWindX = 0;
    this.currentWindY = 0;

    // 2. Create the inner fill circle (solid skin color)
    this.fillCircle = scene.add.circle(0, 0, 21, skinColors.hero, 1);
    this.add(this.fillCircle);

    // 3. Create the Hero Sprite on top of the fill circle (scaled to fit inside)
    const visualKey = activeSkin.assetKey || scene.selectedHero?.assetKey;
    if (visualKey && scene.textures.exists(visualKey)) {
      this.heroSprite = scene.add.image(0, 0, visualKey);
      this.heroSprite.setOrigin(0.5);
      this.heroSprite.setDisplaySize(38, 38);
      this.add(this.heroSprite);
    }

    // 4. Create the inner border ring (styled with skin border color)
    this.innerBorder = scene.add.circle(0, 0, 21);
    this.innerBorder.setStrokeStyle(3, skinColors.border, 1);
    this.add(this.innerBorder);

    // Shield visual overlay glow
    this.shieldRing = scene.add.circle(0, 0, 26)
      .setStrokeStyle(3.5, 0x00d6ff, 0.85)
      .setVisible(false);
    this.add(this.shieldRing);

    // Dynamic Epic Level Frame
    this.gameplayFrameTweens = [];
    this.drawGameplayFrame(scene);

    // === RPG CLASS SYSTEM: Floating Weapon & Shield ===
    this.weaponTween = null;
    this.shieldOrbitTween = null;
    this.weaponAngle = 0;     // Current angle (radians) of weapon around player
    this.weaponOrbitRadius = 30; // Distance from center to weapon
    this._lastAttackTime = 0;
    this.drawFloatingWeapon(scene);
    // === END RPG CLASS SYSTEM ===

    // 5. Create the outer HP bar (draws dynamically)
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(10);
    this.add(this.hpBar);
  }

  static createParticleTexture(scene) {
    const key = 'aura-particle';
    if (scene.textures.exists(key)) {
      return key;
    }

    const size = 16;
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Draw blurry dot by blending alpha circles
    for (let r = size / 2; r > 0; r--) {
      const alpha = (1 - (r / (size / 2))) * 0.38;
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(size / 2, size / 2, r);
    }

    graphics.generateTexture(key, size, size);
    graphics.destroy();
    return key;
  }



  update(delta, monsters) {
    const direction = new Phaser.Math.Vector2(0, 0);

    if (this.keys.left.isDown || this.keys.arrowLeft.isDown) {
      direction.x -= 1;
    }

    if (this.keys.right.isDown || this.keys.arrowRight.isDown) {
      direction.x += 1;
    }

    if (this.keys.up.isDown || this.keys.arrowUp.isDown) {
      direction.y -= 1;
    }

    if (this.keys.down.isDown || this.keys.arrowDown.isDown) {
      direction.y += 1;
    }

    if (direction.lengthSq() > 0) {
      direction.normalize();
      const distance = this.speed * (delta / 1000);
      this.x += direction.x * distance;
      this.y += direction.y * distance;
    }

    // Dynamic wind effect on the aura when moving
    let targetWindX = 0;
    let targetWindY = 0;
    if (direction.lengthSq() > 0) {
      const windStrength = 180 * (this.auraScaleFactor || 1);
      targetWindX = -direction.x * windStrength;
      targetWindY = -direction.y * windStrength;
    }

    // Smooth lerp wind transitions
    const lerpFactor = 0.15;
    this.currentWindX += (targetWindX - this.currentWindX) * lerpFactor;
    this.currentWindY += (targetWindY - this.currentWindY) * lerpFactor;

    // Apply 2D wind to the shader uniform
    if (this.auraShader && typeof this.auraShader.setUniform === 'function') {
      this.auraShader.setUniform('wind.value', { x: this.currentWindX, y: this.currentWindY });
    }

    // Health Regeneration
    if (this.healthRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.healthRegen * (delta / 1000));
    }

    // Shield Regeneration (Regenerate 5 shield per second after 5 seconds of not being hit)
    if (this.maxShield > 0 && this.shield < this.maxShield) {
      const now = this.scene.time.now;
      if (now - this.lastHitTime > 5000) {
        this.shield = Math.min(this.maxShield, this.shield + 5 * (delta / 1000));
      }
    }

    // Shield Visual Pulse Effect
    if (this.shieldRing) {
      if (this.shield > 0) {
        this.shieldRing.setVisible(true);
        this.shieldRing.setAlpha(0.6 + Math.sin(this.scene.time.now * 0.007) * 0.2);
        this.shieldRing.setScale(1 + Math.sin(this.scene.time.now * 0.007) * 0.05);
      } else {
        this.shieldRing.setVisible(false);
      }
    }

    this.keepInsideMap();
    this.updateHpBar();
    // Rotate weapon toward nearest enemy
    if (monsters && monsters.length > 0) {
      this.updateWeaponDirection(monsters);
    }
  }

  updateHpBar() {
    if (!this.hpBar) return;
    this.hpBar.clear();

    const hpPercent = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const hpRadius = 31;

    // Faint dark border background
    this.hpBar.lineStyle(3.5, 0x1e293b, 0.7);
    this.hpBar.strokeCircle(0, 0, hpRadius);

    // Glowing dynamic active HP border
    if (hpPercent > 0) {
      let hpColor = 0x10b981; // Green by default
      if (hpPercent < 0.3) {
        hpColor = 0xef4444; // Red when low
      } else if (hpPercent < 0.6) {
        hpColor = 0xf59e0b; // Yellow when medium
      }

      this.hpBar.lineStyle(3.5, hpColor, 0.95);
      this.hpBar.beginPath();
      this.hpBar.arc(
        0,
        0,
        hpRadius,
        Phaser.Math.DegToRad(-90),
        Phaser.Math.DegToRad(-90 + 360 * hpPercent),
        false
      );
      this.hpBar.strokePath();
    }

    // Glowing concentric Shield border (slightly wider than HP bar)
    if (this.maxShield > 0) {
      const shieldPercent = Phaser.Math.Clamp(this.shield / this.maxShield, 0, 1);
      const shieldRadius = 36;

      // Faint dark border background for shield
      this.hpBar.lineStyle(2.5, 0x1e293b, 0.65);
      this.hpBar.strokeCircle(0, 0, shieldRadius);

      if (shieldPercent > 0) {
        this.hpBar.lineStyle(2.5, 0x00d6ff, 0.95);
        this.hpBar.beginPath();
        this.hpBar.arc(
          0,
          0,
          shieldRadius,
          Phaser.Math.DegToRad(-90),
          Phaser.Math.DegToRad(-90 + 360 * shieldPercent),
          false
        );
        this.hpBar.strokePath();
      }
    }
  }

  destroy(fromScene) {
    if (this.gameplayFrameTweens) {
      this.gameplayFrameTweens.forEach(t => t.destroy());
      this.gameplayFrameTweens = [];
    }
    if (this.weaponTween)     { this.weaponTween.destroy();     this.weaponTween = null; }
    if (this.shieldOrbitTween){ this.shieldOrbitTween.destroy(); this.shieldOrbitTween = null; }
    if (this.auraShader) {
      this.auraShader.destroy();
    }
    if (this.hpBar) {
      this.hpBar.destroy();
    }
    super.destroy(fromScene);
  }

  keepInsideMap() {
    const radius = this.radius;

    this.x = Phaser.Math.Clamp(
      this.x,
      this.mapBounds.x + radius,
      this.mapBounds.x + this.mapBounds.width - radius
    );

    this.y = Phaser.Math.Clamp(
      this.y,
      this.mapBounds.y + radius,
      this.mapBounds.y + this.mapBounds.height - radius
    );
  }

  increaseDamage(percent) {
    this.damageMultiplier += percent;
  }

  increaseAttackSpeed(percent) {
    this.attackSpeedMultiplier += percent;
  }

  increaseMaxHp(percent) {
    const increase = Math.round(this.maxHp * percent);

    this.maxHp += increase;
    this.hp += increase;
  }

  increaseMovementSpeed(percent) {
    this.speed += this.speed * percent;
  }

  increaseCriticalChance(amount) {
    this.criticalChance += amount;
  }

  increaseHealthRegen(amount) {
    this.healthRegen += amount;
  }

  increaseArmor(amount) {
    this.armor += amount;
  }

  increaseLifesteal(amount) {
    this.lifesteal += amount;
  }

  increaseEvasion(amount) {
    this.evasion += amount;
  }

  increaseCooldownReduction(amount) {
    this.cooldownReduction += amount;
  }

  takeDamage(amount) {
    if (this.shield && this.shield > 0) {
      if (this.shield >= amount) {
        this.shield -= amount;
        this.lastHitTime = this.scene.time.now;
        return 0; // 0 actual HP damage
      } else {
        const remainingDmg = amount - this.shield;
        this.shield = 0;
        this.hp = Math.max(0, this.hp - remainingDmg);
        this.lastHitTime = this.scene.time.now;
        return remainingDmg;
      }
    }
    this.hp = Math.max(0, this.hp - amount);
    this.lastHitTime = this.scene.time.now;
    return amount;
  }

  drawGameplayFrame(scene) {
    if (this.gameplayFrameContainer) {
      this.gameplayFrameContainer.destroy();
    }
    this.gameplayFrameContainer = scene.add.container(0, 0);
    this.add(this.gameplayFrameContainer);

    const level = scene.heroLevel || 1;

    if (level < 5) {
      this.drawMiniTier1(scene);
    } else if (level < 10) {
      this.drawMiniTier2(scene);
    } else if (level < 15) {
      this.drawMiniTier3(scene);
    } else {
      this.drawMiniTier4(scene);
    }
  }

  drawMiniTier1(scene) {
    const g = scene.add.graphics();
    g.lineStyle(2, 0x06b6d4, 0.85);
    g.strokeCircle(0, 0, 24.5);
    this.gameplayFrameContainer.add(g);

    const tween = scene.tweens.add({
      targets: this.gameplayFrameContainer,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.gameplayFrameTweens.push(tween);
  }

  drawMiniTier2(scene) {
    // Inner Ring
    const inner = scene.add.graphics();
    inner.lineStyle(1.5, 0x06b6d4, 0.85);
    inner.strokeCircle(0, 0, 23);
    this.gameplayFrameContainer.add(inner);

    // Outer gold hexagon
    const outer = scene.add.graphics();
    outer.lineStyle(1.5, 0xeab308, 0.8);
    const sides = 6;
    const radius = 26;
    outer.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (i === 0) outer.moveTo(x, y);
      else outer.lineTo(x, y);
    }
    outer.closePath();
    outer.strokePath();
    this.gameplayFrameContainer.add(outer);

    // Animate outer rotation
    const rTween = scene.tweens.add({
      targets: outer,
      angle: 360,
      duration: 8000,
      repeat: -1
    });
    this.gameplayFrameTweens.push(rTween);

    // Animate inner breathing
    const bTween = scene.tweens.add({
      targets: inner,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.gameplayFrameTweens.push(bTween);
  }

  drawMiniTier3(scene) {
    const inner = scene.add.graphics();
    inner.lineStyle(1.5, 0xec4899, 0.9);
    inner.strokeCircle(0, 0, 23);
    this.gameplayFrameContainer.add(inner);

    const outer = scene.add.graphics();
    outer.lineStyle(1.5, 0x8b5cf6, 0.8);
    const sides = 8;
    const radius = 26;
    outer.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (i === 0) outer.moveTo(x, y);
      else outer.lineTo(x, y);
    }
    outer.closePath();
    outer.strokePath();
    this.gameplayFrameContainer.add(outer);

    const rTween = scene.tweens.add({
      targets: outer,
      angle: -360,
      duration: 9000,
      repeat: -1
    });
    this.gameplayFrameTweens.push(rTween);

    const bTween = scene.tweens.add({
      targets: inner,
      alpha: { from: 0.5, to: 1.0 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    this.gameplayFrameTweens.push(bTween);

    // 2 mini orbiting dots
    for (let i = 0; i < 2; i++) {
      const dot = scene.add.circle(0, 0, 1.5, 0x34d399, 1);
      this.gameplayFrameContainer.add(dot);
      
      const angleOffset = (i * Math.PI);
      const orbitRadius = 27.5;

      const cTween = scene.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 5000,
        repeat: -1,
        onUpdate: (tween) => {
          const val = tween.getValue();
          const rad = Phaser.Math.DegToRad(val) + angleOffset;
          dot.x = orbitRadius * Math.cos(rad);
          dot.y = orbitRadius * Math.sin(rad);
        }
      });
      this.gameplayFrameTweens.push(cTween);
    }
  }

  drawMiniTier4(scene) {
    const inner = scene.add.graphics();
    inner.lineStyle(1.5, 0xef4444, 0.9);
    inner.strokeCircle(0, 0, 22.5);
    this.gameplayFrameContainer.add(inner);

    const mid = scene.add.graphics();
    mid.lineStyle(1.5, 0xfacc15, 0.85);
    const teeth = 8;
    const rIn = 24.5;
    const rOut = 26.5;
    mid.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth;
      const r = i % 2 === 0 ? rIn : rOut;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      if (i === 0) mid.moveTo(x, y);
      else mid.lineTo(x, y);
    }
    mid.closePath();
    mid.strokePath();
    this.gameplayFrameContainer.add(mid);

    const outer = scene.add.graphics();
    outer.lineStyle(1, 0xec4899, 0.85);
    outer.strokeCircle(0, 0, 28);
    this.gameplayFrameContainer.add(outer);

    const rTween = scene.tweens.add({
      targets: mid,
      angle: 360,
      duration: 10000,
      repeat: -1
    });
    this.gameplayFrameTweens.push(rTween);

    const oTween = scene.tweens.add({
      targets: outer,
      angle: -360,
      duration: 12000,
      repeat: -1
    });
    this.gameplayFrameTweens.push(oTween);

    // Breathing glow
    const bTween = scene.tweens.add({
      targets: [inner, outer],
      scaleX: 1.025,
      scaleY: 1.025,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.gameplayFrameTweens.push(bTween);

    // 3 orbiting stars/flares (tiny circles)
    for (let i = 0; i < 3; i++) {
      const dot = scene.add.circle(0, 0, 1.5, 0xf59e0b, 1);
      this.gameplayFrameContainer.add(dot);
      
      const angleOffset = (i * 2 * Math.PI) / 3;
      const orbitRadius = 28;

      const cTween = scene.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 6000,
        repeat: -1,
        onUpdate: (tween) => {
          const val = tween.getValue();
          const rad = Phaser.Math.DegToRad(val) + angleOffset;
          dot.x = orbitRadius * Math.cos(rad);
          dot.y = orbitRadius * Math.sin(rad);
        }
      });
      this.gameplayFrameTweens.push(cTween);
    }
  }

  // ============================================================
  // RPG CLASS SYSTEM — Floating Weapon
  // ============================================================

  /**
   * Returns the weapon emoji and style for a given class name.
   */
  static getClassWeaponConfig(className) {
    switch (className) {
      case 'Swordsman': return { emoji: '🗡️', fontSize: '20px', type: 'melee',  shield: false };
      case 'Knight':    return { emoji: '⚔️', fontSize: '22px', type: 'melee',  shield: true  };
      case 'Archer':    return { emoji: '🏹', fontSize: '20px', type: 'ranged', shield: false };
      case 'Hunter':    return { emoji: '🏹', fontSize: '22px', type: 'ranged', shield: false };
      case 'Mage':      return { emoji: '🪄', fontSize: '20px', type: 'magic',  shield: false };
      case 'Wizard':    return { emoji: '🔮', fontSize: '22px', type: 'magic',  shield: false };
      default:          return { emoji: '🗡️', fontSize: '16px', type: 'melee',  shield: false }; // Novice
    }
  }

  /**
   * Create the floating weapon sprite around the hero circle.
   */
  drawFloatingWeapon(scene) {
    // Destroy any existing weapon objects
    if (this.floatingWeapon) { this.floatingWeapon.destroy(); this.floatingWeapon = null; }
    if (this.floatingShield) { this.floatingShield.destroy(); this.floatingShield = null; }

    const className = GameManager.get('currentClass') || 'Novice';
    const config = Player.getClassWeaponConfig(className);
    this._weaponType = config.type;

    // Create weapon emoji text object at orbit position
    this.floatingWeapon = scene.add.text(this.weaponOrbitRadius, 0, config.emoji, {
      fontSize: config.fontSize,
    }).setOrigin(0.5);
    this.add(this.floatingWeapon);

    // Knight gets an orbiting shield as well
    if (config.shield) {
      this.floatingShield = scene.add.text(-this.weaponOrbitRadius, 0, '🛡️', {
        fontSize: '18px',
      }).setOrigin(0.5);
      this.add(this.floatingShield);
    }
  }

  /**
   * Rotate weapon to face nearest monster, and trigger attack animation when ready.
   */
  updateWeaponDirection(monsters) {
    if (!this.floatingWeapon || !monsters || monsters.length === 0) return;

    // Find nearest alive monster
    let nearest = null;
    let minDist = Infinity;
    monsters.forEach(m => {
      if (!m || !m.active) return;
      const d = Phaser.Math.Distance.Between(this.x, this.y, m.x, m.y);
      if (d < minDist) { minDist = d; nearest = m; }
    });
    if (!nearest) return;

    // Angle from player to nearest monster
    const angle = Phaser.Math.Angle.Between(this.x, this.y, nearest.x, nearest.y);

    // Smoothly move weapon along orbit to face the enemy
    const r = this.weaponOrbitRadius;
    this.floatingWeapon.x = r * Math.cos(angle);
    this.floatingWeapon.y = r * Math.sin(angle);

    // Flip shield to opposite side if it exists
    if (this.floatingShield) {
      this.floatingShield.x = r * Math.cos(angle + Math.PI);
      this.floatingShield.y = r * Math.sin(angle + Math.PI);
    }

    // Trigger attack animation at cooldown based on attackType
    const now = this.scene.time.now;
    // Map attackType to animation cooldown (ms): melee=600, ranged=500, magic=800
    const attackCooldowns = { melee: 600, ranged: 500, magic: 800 };
    const cooldown = attackCooldowns[this._weaponType] || 600;

    if (now - this._lastAttackTime > cooldown) {
      this._lastAttackTime = now;
      this.playAttackAnimation(angle);
    }
  }

  /**
   * Play a class-appropriate attack animation on the floating weapon.
   */
  playAttackAnimation(angle) {
    if (!this.floatingWeapon) return;
    const r = this.weaponOrbitRadius;

    if (this._weaponType === 'melee') {
      // Slash: weapon swings in an arc ±50 degrees and snaps back
      const swingDeg = 50;
      const baseAngleDeg = Phaser.Math.RadToDeg(angle);

      this.scene.tweens.add({
        targets: this.floatingWeapon,
        props: {
          x: { value: r * Math.cos(Phaser.Math.DegToRad(baseAngleDeg + swingDeg)), ease: 'Cubic.easeOut' },
          y: { value: r * Math.sin(Phaser.Math.DegToRad(baseAngleDeg + swingDeg)), ease: 'Cubic.easeOut' },
          scaleX: { value: 1.4, ease: 'Quad.easeOut' },
          scaleY: { value: 1.4, ease: 'Quad.easeOut' },
        },
        duration: 120,
        yoyo: true,
        onComplete: () => {
          if (this.floatingWeapon) {
            this.floatingWeapon.x = r * Math.cos(angle);
            this.floatingWeapon.y = r * Math.sin(angle);
            this.floatingWeapon.setScale(1);
          }
        }
      });

    } else if (this._weaponType === 'ranged') {
      // Recoil: weapon pulls back toward player center then returns
      this.scene.tweens.add({
        targets: this.floatingWeapon,
        props: {
          x: { value: (r * 0.45) * Math.cos(angle), ease: 'Cubic.easeOut' },
          y: { value: (r * 0.45) * Math.sin(angle), ease: 'Cubic.easeOut' },
        },
        duration: 80,
        yoyo: true,
        onComplete: () => {
          if (this.floatingWeapon) {
            this.floatingWeapon.x = r * Math.cos(angle);
            this.floatingWeapon.y = r * Math.sin(angle);
          }
        }
      });

    } else if (this._weaponType === 'magic') {
      // Magic pulse: scale up and fade briefly, then return
      this.scene.tweens.add({
        targets: this.floatingWeapon,
        scaleX: 1.7,
        scaleY: 1.7,
        alpha: 0.5,
        duration: 150,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (this.floatingWeapon) { this.floatingWeapon.setScale(1).setAlpha(1); }
        }
      });
    }
  }

  /**
   * Called when the player promotes to a new class.
   * Redraws the floating weapon with the new class emoji.
   */
  updateClass(newClassName) {
    this.drawFloatingWeapon(this.scene);
  }
}
