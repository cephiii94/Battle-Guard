import Phaser from 'phaser';

const PROJECTILE_TEXTURE = 'projectile-circle';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, target, speed, damage) {
    Projectile.createTexture(scene);

    super(scene, x, y, PROJECTILE_TEXTURE);

    this.speed = speed;
    this.damage = damage;
    this.lifeTime = 2500;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(8, 1, 1);
    this.body.setAllowGravity(false);

    this.launchAt(target);

    scene.time.delayedCall(this.lifeTime, () => {
      if (this.active) {
        this.destroy();
      }
    });
  }

  static createTexture(scene) {
    if (scene.textures.exists(PROJECTILE_TEXTURE)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0xfacc15, 1);
    graphics.fillCircle(9, 9, 8);
    graphics.lineStyle(2, 0xfef08a, 1);
    graphics.strokeCircle(9, 9, 8);
    graphics.generateTexture(PROJECTILE_TEXTURE, 18, 18);
    graphics.destroy();
  }

  launchAt(target) {
    const direction = new Phaser.Math.Vector2(target.x - this.x, target.y - this.y);

    if (direction.lengthSq() === 0) {
      this.destroy();
      return;
    }

    direction.normalize();
    this.setVelocity(direction.x * this.speed, direction.y * this.speed);
  }
}
