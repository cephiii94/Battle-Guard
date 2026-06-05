import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Arc {
  constructor(scene, x, y, mapBounds) {
    super(scene, x, y, 24, 0, 360, false, 0x2f6dff);

    this.setStrokeStyle(4, 0xbfdbfe);

    this.speed = 280;
    this.maxHp = 100;
    this.hp = this.maxHp;
    this.damageMultiplier = 1;
    this.attackSpeedMultiplier = 1;
    this.criticalChance = 0;
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

    scene.add.existing(this);
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
}
