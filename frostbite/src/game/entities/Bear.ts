import Phaser from 'phaser';
import { ResourceDrop } from './ResourceDrop';
import { audioSystem } from '../systems/AudioSystem';

export class Bear extends Phaser.GameObjects.Rectangle {
  health: number = 8;
  readonly id: number;
  private static nextId: number = 10000;
  private isAlive: boolean = true;
  private spawnX: number;
  private spawnY: number;

  // Wander state
  private wanderTargetX: number;
  private wanderTargetY: number;
  private wanderSpeed: number = 50;
  private wanderRadius: number = 120;
  private staggerUntil: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 40, 40, 0x5a3a1a);
    this.id = Bear.nextId++;
    this.spawnX = x;
    this.spawnY = y;
    this.wanderTargetX = x;
    this.wanderTargetY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(false);
    this.setDepth(y);
    this.pickNewWanderTarget(scene);
  }

  hit(damage: number, scene: Phaser.Scene): void {
    if (!this.isAlive) return;
    this.health -= damage;

    audioSystem.playBearHit();
    scene.events.emit('damage', this.x, this.y - 20, damage);

    this.setFillStyle(0xff4444);
    scene.time.delayedCall(150, () => {
      if (this.active) this.setFillStyle(0x5a3a1a);
    });
    this.staggerUntil = scene.time.now + 300;

    if (this.health <= 0) {
      this.die(scene);
    }
  }

  private die(scene: Phaser.Scene): void {
    this.isAlive = false;
    audioSystem.playBearDeath();

    // Screen shake via camera
    scene.cameras.main.shake(250, 0.012);

    new ResourceDrop(scene, this.x, this.y, 'meat', 2);
    this.destroy();

    const sx = this.spawnX;
    const sy = this.spawnY;
    scene.time.delayedCall(20_000, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worldScene = scene as any;
      if (worldScene.addBear) {
        const newBear = new Bear(scene, sx, sy);
        worldScene.addBear(newBear);
      }
    });
  }

  private pickNewWanderTarget(scene: Phaser.Scene): void {
    if (!this.active) return;
    const angle = Math.random() * Math.PI * 2;
    const dist  = Math.random() * this.wanderRadius;
    this.wanderTargetX = this.spawnX + Math.cos(angle) * dist;
    this.wanderTargetY = this.spawnY + Math.sin(angle) * dist;

    scene.time.delayedCall(Phaser.Math.Between(2000, 5000), () => {
      if (this.active) this.pickNewWanderTarget(scene);
    });
  }

  update(time: number, _delta: number): void {
    if (!this.isAlive) return;
    this.setDepth(this.y);

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (time < this.staggerUntil) {
      body.setVelocity(0, 0);
      return;
    }

    const dx = this.wanderTargetX - this.x;
    const dy = this.wanderTargetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 8) {
      body.setVelocity((dx / dist) * this.wanderSpeed, (dy / dist) * this.wanderSpeed);
    } else {
      body.setVelocity(0, 0);
    }
  }
}
