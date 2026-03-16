import Phaser from 'phaser';
import { ResourceDrop } from './ResourceDrop';
import { audioSystem } from '../systems/AudioSystem';

// Source image: 1024×1536 — display at 64×48
const SCALE_X = 64 / 1024;
const SCALE_Y = 48 / 1536;
const HITBOX_W = 36;
const HITBOX_H = 28;

export class Bear extends Phaser.GameObjects.Sprite {
  health: number = 8;
  readonly id: number;
  private static nextId: number = 10000;
  private isAlive: boolean = true;
  private spawnX: number;
  private spawnY: number;
  private wanderTargetX: number;
  private wanderTargetY: number;
  private wanderSpeed: number = 50;
  private wanderRadius: number = 120;
  private staggerUntil: number = 0;
  private healthBar!: Phaser.GameObjects.Graphics;
  private readonly maxHealth = 8;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bear');
    this.id = Bear.nextId++;
    this.spawnX = x;
    this.spawnY = y;
    this.wanderTargetX = x;
    this.wanderTargetY = y;
    this.setScale(SCALE_X, SCALE_Y);
    this.setOrigin(0.5, 0.85);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false);
    body.setSize(HITBOX_W, HITBOX_H);
    body.setOffset((this.width - HITBOX_W) / 2, this.height - HITBOX_H - 2);
    this.setDepth(y);
    this.healthBar = scene.add.graphics();
    this.pickNewWanderTarget(scene);
  }

  hit(damage: number, scene: Phaser.Scene): void {
    if (!this.isAlive) return;
    this.health -= damage;

    audioSystem.playBearHit();
    scene.events.emit('damage', this.x, this.y - 36, damage);

    this.setTint(0xff4444);
    scene.time.delayedCall(150, () => {
      if (this.active) this.clearTint();
    });
    this.staggerUntil = scene.time.now + 300;
    this.updateHealthBar();

    if (this.health <= 0) {
      this.die(scene);
    }
  }

  private updateHealthBar(): void {
    this.healthBar.clear();
    const barW = 40;
    const barH = 5;
    const bx = this.x - barW / 2;
    const by = this.y - 42;
    const pct = Math.max(0, this.health / this.maxHealth);

    this.healthBar.fillStyle(0x000000, 0.6);
    this.healthBar.fillRect(bx, by, barW, barH);
    const color = pct > 0.5 ? 0x44dd44 : pct > 0.25 ? 0xddaa00 : 0xdd3333;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(bx, by, barW * pct, barH);
    this.healthBar.setDepth(this.depth + 1);
  }

  private die(scene: Phaser.Scene): void {
    this.isAlive = false;
    this.healthBar.destroy();
    audioSystem.playBearDeath();
    scene.cameras.main.shake(250, 0.012);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = (scene as any).dropPool ?? null;
    if (pool) {
      pool.spawn(scene, this.x, this.y, 'meat', 2);
    } else {
      new ResourceDrop(scene, this.x, this.y, 'meat', 2);
    }
    this.destroy();

    const sx = this.spawnX;
    const sy = this.spawnY;
    scene.time.delayedCall(20_000, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worldScene = scene as any;
      if (worldScene.addBear) {
        worldScene.addBear(new Bear(scene, sx, sy));
      }
    });
  }

  private pickNewWanderTarget(scene: Phaser.Scene): void {
    if (!this.active) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.wanderRadius;
    this.wanderTargetX = this.spawnX + Math.cos(angle) * dist;
    this.wanderTargetY = this.spawnY + Math.sin(angle) * dist;
    scene.time.delayedCall(Phaser.Math.Between(2000, 5000), () => {
      if (this.active) this.pickNewWanderTarget(scene);
    });
  }

  update(time: number, _delta: number): void {
    if (!this.isAlive) return;
    this.setDepth(this.y);
    this.updateHealthBar();

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
      if (dx < 0) this.setFlipX(true);
      else this.setFlipX(false);
    } else {
      body.setVelocity(0, 0);
    }
  }
}
