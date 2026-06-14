import Phaser from 'phaser';

const MONSTER_TEXTURE = 'monster-circle';

export default class Monster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player, options = {}) {
    Monster.createTexture(scene);

    super(scene, x, y, MONSTER_TEXTURE);

    this.player = player;
    this.speed = 140;
    this.hp = Math.round(30 * (options.hpMultiplier || 1));
    this.maxHp = this.hp;
    this.damage = Math.round(12 * (options.damageMultiplier || 1));
    this.isDying = false;
    this.isDead = false;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(25, -3, -3);
    this.setCollideWorldBounds(true);
    this.body.setAllowGravity(false);

    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(this.depth + 1);
  }

  static createTexture(scene) {
    if (scene.textures.exists(MONSTER_TEXTURE)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0xef4444, 1);
    graphics.fillCircle(22, 22, 20);
    graphics.lineStyle(4, 0xfecaca, 1);
    graphics.strokeCircle(22, 22, 20);
    graphics.generateTexture(MONSTER_TEXTURE, 44, 44);
    graphics.destroy();
  }

  update() {
    if (!this.active || this.isDying || this.isDead) {
      this.setVelocity(0, 0);
      if (this.hpBar) {
        this.hpBar.clear();
      }
      return;
    }

    const direction = new Phaser.Math.Vector2(
      this.player.x - this.x,
      this.player.y - this.y
    );

    if (direction.lengthSq() === 0) {
      this.setVelocity(0, 0);
      this.updateHpBar();
      return;
    }

    direction.normalize();
    this.setVelocity(direction.x * this.speed, direction.y * this.speed);
    this.updateHpBar();
  }

  updateHpBar() {
    if (!this.hpBar) return;
    this.hpBar.clear();
    
    // Only draw HP bar if damaged (less than 100% HP) to keep the screen clean
    if (this.hp >= this.maxHp) return;

    const radius = 22; // half of displayWidth (44)
    const hpPercent = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);

    // Dark red border background
    this.hpBar.lineStyle(2.5, 0x450a0a, 0.65);
    this.hpBar.strokeCircle(this.x, this.y, radius);

    // Neon red active HP border
    if (hpPercent > 0) {
      this.hpBar.lineStyle(2.5, 0xef4444, 0.9);
      this.hpBar.beginPath();
      this.hpBar.arc(
        this.x,
        this.y,
        radius,
        Phaser.Math.DegToRad(-90),
        Phaser.Math.DegToRad(-90 + 360 * hpPercent),
        false
      );
      this.hpBar.strokePath();
    }
  }

  destroy(fromScene) {
    if (this.hpBar) {
      this.hpBar.destroy();
    }
    super.destroy(fromScene);
  }

  die(onComplete) {
    if (this.isDying || this.isDead) {
      return;
    }

    this.isDying = true;
    this.setVelocity(0, 0);
    if (this.hpBar) {
      this.hpBar.destroy();
      this.hpBar = null;
    }

    if (this.body) {
      this.body.enable = false;
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.35,
      duration: 220,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.isDead = true;
        this.destroy();

        if (onComplete) {
          onComplete();
        }
      }
    });
  }
}
