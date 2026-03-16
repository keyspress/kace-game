import Phaser from 'phaser';
import { ResourceDrop } from './ResourceDrop';
import { audioSystem } from '../systems/AudioSystem';

const TEXTURE_KEY = 'scorpion-texture';
const DISPLAY_W = 40;
const DISPLAY_H = 28;
const HITBOX_W = 32;
const HITBOX_H = 22;

function ensureTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURE_KEY)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });

  // Body — dark orange-brown oval
  g.fillStyle(0xc1440e, 1);
  g.fillEllipse(20, 14, 22, 14);

  // Head
  g.fillStyle(0xa03008, 1);
  g.fillEllipse(32, 14, 10, 8);

  // Claws
  g.fillStyle(0xc1440e, 1);
  g.fillEllipse(38, 9,  7, 5);
  g.fillEllipse(38, 19, 7, 5);
  g.fillStyle(0xe05010, 1);
  g.fillEllipse(40, 8,  5, 4);
  g.fillEllipse(40, 20, 5, 4);

  // Tail segments
  g.fillStyle(0xc1440e, 1);
  g.fillEllipse(10, 11, 8, 6);
  g.fillEllipse(4,  8,  7, 5);
  // Stinger
  g.fillStyle(0x222222, 1);
  g.fillTriangle(1, 6, 4, 4, 4, 10);

  // Legs (3 each side)
  g.lineStyle(1.5, 0x8b2500, 1);
  [[15,14],[20,14],[25,14]].forEach(([lx]) => {
    g.strokeLineShape(new Phaser.Geom.Line(lx, 12, lx - 3, 6));
    g.strokeLineShape(new Phaser.Geom.Line(lx, 16, lx - 3, 22));
  });

  // Eye
  g.fillStyle(0xffff00, 1);
  g.fillCircle(34, 12, 2);

  g.generateTexture(TEXTURE_KEY, DISPLAY_W, DISPLAY_H);
  g.destroy();
}

export class Scorpion extends Phaser.GameObjects.Image {
  health: number = 4;
  readonly id: number;
  private static nextId: number = 20000;
  private isAlive: boolean = true;
  private spawnX: number;
  private spawnY: number;
  private wanderTargetX: number;
  private wanderTargetY: number;
  private wanderSpeed: number = 80;
  private wanderRadius: number = 150;
  private staggerUntil: number = 0;
  private healthBar!: Phaser.GameObjects.Graphics;
  private readonly maxHealth = 4;
  private walkTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    ensureTexture(scene);
    super(scene, x, y, TEXTURE_KEY);
    this.id = Scorpion.nextId++;
    this.spawnX = x;
    this.spawnY = y;
    this.wanderTargetX = x;
    this.wanderTargetY = y;
    this.setOrigin(0.5, 0.75);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false);
    body.setSize(HITBOX_W, HITBOX_H);
    body.setOffset((DISPLAY_W - HITBOX_W) / 2, (DISPLAY_H - HITBOX_H) / 2);
    this.setDepth(y);
    this.healthBar = scene.add.graphics();
    this.pickNewWanderTarget(scene);
  }

  hit(damage: number, scene: Phaser.Scene): void {
    if (!this.isAlive) return;
    this.health -= damage;
    audioSystem.playBearHit();
    scene.events.emit('damage', this.x, this.y - 24, damage);
    this.setTint(0xff4444);
    scene.time.delayedCall(150, () => { if (this.active) this.clearTint(); });
    this.staggerUntil = scene.time.now + 200;
    this.updateHealthBar();
    if (this.health <= 0) this.die(scene);
  }

  private updateHealthBar(): void {
    this.healthBar.clear();
    const barW = 32;
    const barH = 4;
    const bx = this.x - barW / 2;
    const by = this.y - 28;
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
    scene.cameras.main.shake(150, 0.006);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = (scene as any).dropPool ?? null;
    if (pool) {
      pool.spawn(scene, this.x, this.y, 'stone', 1);
    } else {
      new ResourceDrop(scene, this.x, this.y, 'stone', 1);
    }
    this.destroy();
    const sx = this.spawnX;
    const sy = this.spawnY;
    scene.time.delayedCall(15_000, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worldScene = scene as any;
      if (worldScene.addScorpion) worldScene.addScorpion(new Scorpion(scene, sx, sy));
    });
  }

  private pickNewWanderTarget(scene: Phaser.Scene): void {
    if (!this.active) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.wanderRadius;
    this.wanderTargetX = this.spawnX + Math.cos(angle) * dist;
    this.wanderTargetY = this.spawnY + Math.sin(angle) * dist;
    scene.time.delayedCall(Phaser.Math.Between(1500, 3500), () => {
      if (this.active) this.pickNewWanderTarget(scene);
    });
  }

  update(time: number, delta: number): void {
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
      // Skittering legs animation
      this.walkTime += delta;
      const bob = Math.sin(this.walkTime * 0.02) * 0.04;
      this.setScale(1 + bob, 1 - bob * 0.5);
    } else {
      body.setVelocity(0, 0);
      this.walkTime = 0;
      this.setScale(1, 1);
    }
  }
}
