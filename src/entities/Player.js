import Phaser from 'phaser';

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
    this.createAura(scene, activeSkin);

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

  createAura(scene, activeSkin) {
    const skinColors = activeSkin.colors;
    const particleKey = Player.createParticleTexture(scene);

    let particleConfig = {
      speed: { min: 10, max: 25 },
      scale: { start: 1.4, end: 0.1 },
      alpha: { start: 0.45, end: 0 },
      lifespan: { min: 500, max: 900 },
      blendMode: 'ADD',
      frequency: 25,
      tint: skinColors.aura
    };

    // Customize behavior based on active skin
    if (activeSkin.id === 'crimson-shadow') {
      // Crimson Shadow: Flame aura (sparks rising upward)
      particleConfig.angle = { min: -115, max: -65 };
      particleConfig.speed = { min: 20, max: 45 };
      particleConfig.lifespan = { min: 400, max: 700 };
      particleConfig.scale = { start: 1.5, end: 0.2 };
    } else if (activeSkin.id === 'azure-knight' || activeSkin.id === 'default-guard') {
      // Azure Knight & Default Guard: Frost aura (slow drift, expanding uap es)
      particleConfig.angle = { min: 0, max: 360 };
      particleConfig.speed = { min: 4, max: 15 };
      particleConfig.scale = { start: 0.9, end: 1.8 };
    } else if (activeSkin.id === 'golden-ranger') {
      // Golden Ranger: Lightning / golden sparks aura (fast, flickering)
      particleConfig.angle = { min: 0, max: 360 };
      particleConfig.speed = { min: 15, max: 50 };
      particleConfig.lifespan = { min: 200, max: 400 };
      particleConfig.scale = { start: 0.8, end: 0.1 };
    } else {
      particleConfig.angle = { min: 0, max: 360 };
    }

    // Spawn emitter attached to player position, drawing under the player
    this.auraParticles = scene.add.particles(0, 0, particleKey, particleConfig);
    this.auraParticles.startFollow(this);
    this.auraParticles.setDepth(this.depth - 1);
  }

  update(delta) {
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

    this.keepInsideMap();
    this.updateHpBar();
  }

  updateHpBar() {
    if (!this.hpBar) return;
    this.hpBar.clear();

    const hpPercent = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const hpRadius = 29;

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
  }

  destroy(fromScene) {
    if (this.auraParticles) {
      this.auraParticles.destroy();
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

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp;
  }
}
