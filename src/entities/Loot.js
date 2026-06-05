import Phaser from 'phaser';

const LOOT_TEXTURES = {
  gold: 'gold-loot-circle',
  exp: 'exp-loot-circle'
};

export default class Loot extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type, value) {
    Loot.createTextures(scene);

    super(scene, x, y, LOOT_TEXTURES[type]);

    this.type = type;
    this.value = value;
    this.pickupRadius = 28;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(12, 1, 1);
    this.body.setAllowGravity(false);
  }

  static createTextures(scene) {
    Loot.createGoldTexture(scene);
    Loot.createExpTexture(scene);
  }

  static createGoldTexture(scene) {
    if (scene.textures.exists(LOOT_TEXTURES.gold)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0xfacc15, 1);
    graphics.fillCircle(13, 13, 12);
    graphics.lineStyle(3, 0xfef08a, 1);
    graphics.strokeCircle(13, 13, 12);
    graphics.generateTexture(LOOT_TEXTURES.gold, 26, 26);
    graphics.destroy();
  }

  static createExpTexture(scene) {
    if (scene.textures.exists(LOOT_TEXTURES.exp)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0x22c55e, 1);
    graphics.fillCircle(13, 13, 12);
    graphics.lineStyle(3, 0xbbf7d0, 1);
    graphics.strokeCircle(13, 13, 12);
    graphics.generateTexture(LOOT_TEXTURES.exp, 26, 26);
    graphics.destroy();
  }
}
