import Phaser from 'phaser';

export default class Monster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player, options = {}) {
    const typeData = options.typeData || { id: 'basic_minion', baseHp: 30, baseDamage: 12, speed: 140, color: 0xef4444, strokeColor: 0xfecaca };
    const textureKey = `monster-circle-${typeData.id}`;

    Monster.createTexture(scene, textureKey, typeData.color, typeData.strokeColor);

    super(scene, x, y, textureKey);

    this.player = player;
    this.speed = typeData.speed;
    this.hp = Math.round(typeData.baseHp * (options.hpMultiplier || 1));
    this.maxHp = this.hp;
    this.damage = Math.round(typeData.baseDamage * (options.damageMultiplier || 1));
    this.color = typeData.color;
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

  static createTexture(scene, textureKey, color, strokeColor) {
    if (scene.textures.exists(textureKey)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(color, 1);
    graphics.fillCircle(22, 22, 20);
    graphics.lineStyle(4, strokeColor, 1);
    graphics.strokeCircle(22, 22, 20);
    graphics.generateTexture(textureKey, 44, 44);
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

    const hpPercent = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const barW = 40;
    const barH = 4;
    const startX = this.x - barW / 2;
    const startY = this.y - 30; // Above monster head

    // 1. HP Background Bar (dark red fill)
    this.hpBar.fillStyle(0x450a0a, 0.65);
    this.hpBar.fillRect(startX, startY, barW, barH);

    // 2. Active HP Bar
    if (hpPercent > 0) {
      this.hpBar.fillStyle(this.color, 0.95);
      this.hpBar.fillRect(startX, startY, barW * hpPercent, barH);
    }
  }

  destroy(fromScene) {
    if (this.burnTimer) {
      this.burnTimer.destroy();
      this.burnTimer = null;
    }
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
