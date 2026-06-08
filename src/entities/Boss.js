import Phaser from 'phaser';

const BOSS_TEXTURE = 'boss-forest-guardian';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player, bossData) {
    Boss.createTexture(scene);

    super(scene, x, y, BOSS_TEXTURE);

    this.player = player;
    this.bossData = bossData;
    this.isBoss = true;
    this.isDying = false;
    this.isDead = false;
    this.maxHp = bossData.hp;
    this.hp = bossData.hp;
    this.damage = bossData.damage;
    this.speed = bossData.moveSpeed;
    this.attackCooldown = bossData.attackCooldown;
    this.attackCooldownRemaining = 900;
    this.attackRange = bossData.attackRange;
    this.slamArea = bossData.slamArea;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(34, 4, 4);
    this.setCollideWorldBounds(true);
    this.body.setAllowGravity(false);
    this.setDepth(20);
  }

  static createTexture(scene) {
    if (scene.textures.exists(BOSS_TEXTURE)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0x14532d, 1);
    graphics.fillCircle(38, 38, 34);
    graphics.fillStyle(0x84cc16, 0.95);
    graphics.fillCircle(26, 31, 7);
    graphics.fillCircle(50, 31, 7);
    graphics.lineStyle(5, 0xbbf7d0, 1);
    graphics.strokeCircle(38, 38, 34);
    graphics.lineStyle(4, 0x422006, 1);
    graphics.strokeLineShape(new Phaser.Geom.Line(18, 15, 4, 0));
    graphics.strokeLineShape(new Phaser.Geom.Line(56, 15, 72, 0));
    graphics.generateTexture(BOSS_TEXTURE, 76, 76);
    graphics.destroy();
  }

  update(delta = 16) {
    if (!this.active || this.isDying || this.isDead) {
      this.setVelocity(0, 0);
      return;
    }

    this.attackCooldownRemaining = Math.max(0, this.attackCooldownRemaining - delta);
    this.chasePlayer();
  }

  chasePlayer() {
    const direction = new Phaser.Math.Vector2(
      this.player.x - this.x,
      this.player.y - this.y
    );

    if (direction.lengthSq() === 0) {
      this.setVelocity(0, 0);
      return;
    }

    direction.normalize();
    this.setVelocity(direction.x * this.speed, direction.y * this.speed);
  }

  canUseSlam() {
    return this.attackCooldownRemaining <= 0;
  }

  resetSlamCooldown() {
    this.attackCooldownRemaining = this.attackCooldown;
  }

  die(onComplete) {
    if (this.isDying || this.isDead) {
      return;
    }

    this.isDying = true;
    this.setVelocity(0, 0);

    if (this.body) {
      this.body.enable = false;
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.2,
      duration: 420,
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
