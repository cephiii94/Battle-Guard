import Phaser from 'phaser';
import Monster from '../entities/Monster.js';

export default class SpawnSystem {
  constructor(scene, player, mapBounds) {
    this.scene = scene;
    this.player = player;
    this.mapBounds = mapBounds;
    this.monsters = [];
    this.maxMonsters = 20;
    this.spawnDelay = 2000;

    this.spawnTimer = scene.time.addEvent({
      delay: this.spawnDelay,
      callback: this.spawnMonster,
      callbackScope: this,
      loop: true
    });
  }

  spawnMonster() {
    this.monsters = this.monsters.filter((monster) => monster.active && !monster.isDead);

    if (this.monsters.length >= this.maxMonsters) {
      return;
    }

    const spawnPoint = this.getSpawnPointOutsideCamera();
    const monster = new Monster(this.scene, spawnPoint.x, spawnPoint.y, this.player);

    this.monsters.push(monster);
  }

  update() {
    this.monsters = this.monsters.filter((monster) => monster.active && !monster.isDead);
    this.monsters.forEach((monster) => monster.update());
  }

  setPaused(isPaused) {
    this.spawnTimer.paused = isPaused;
  }

  getMonsters() {
    return this.monsters.filter((monster) => (
      monster.active &&
      !monster.isDead &&
      !monster.isDying
    ));
  }

  getSpawnPointOutsideCamera() {
    const camera = this.scene.cameras.main;
    const margin = 80;
    const cameraBounds = {
      left: camera.worldView.left - margin,
      right: camera.worldView.right + margin,
      top: camera.worldView.top - margin,
      bottom: camera.worldView.bottom + margin
    };

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const point = this.getRandomMapPoint();

      if (this.isOutsideCamera(point, cameraBounds)) {
        return point;
      }
    }

    return this.getFallbackSpawnPoint(cameraBounds);
  }

  getRandomMapPoint() {
    return {
      x: Phaser.Math.Between(this.mapBounds.x, this.mapBounds.x + this.mapBounds.width),
      y: Phaser.Math.Between(this.mapBounds.y, this.mapBounds.y + this.mapBounds.height)
    };
  }

  isOutsideCamera(point, cameraBounds) {
    return (
      point.x < cameraBounds.left ||
      point.x > cameraBounds.right ||
      point.y < cameraBounds.top ||
      point.y > cameraBounds.bottom
    );
  }

  getFallbackSpawnPoint(cameraBounds) {
    const side = Phaser.Math.Between(0, 3);
    const radius = 20;
    let x = this.player.x;
    let y = this.player.y;

    if (side === 0) {
      x = cameraBounds.left - radius;
      y = Phaser.Math.Between(cameraBounds.top, cameraBounds.bottom);
    } else if (side === 1) {
      x = cameraBounds.right + radius;
      y = Phaser.Math.Between(cameraBounds.top, cameraBounds.bottom);
    } else if (side === 2) {
      x = Phaser.Math.Between(cameraBounds.left, cameraBounds.right);
      y = cameraBounds.top - radius;
    } else {
      x = Phaser.Math.Between(cameraBounds.left, cameraBounds.right);
      y = cameraBounds.bottom + radius;
    }

    return {
      x: Phaser.Math.Clamp(x, this.mapBounds.x + radius, this.mapBounds.x + this.mapBounds.width - radius),
      y: Phaser.Math.Clamp(y, this.mapBounds.y + radius, this.mapBounds.y + this.mapBounds.height - radius)
    };
  }
}
