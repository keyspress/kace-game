import Phaser from 'phaser';
import { ResourceDrop } from './ResourceDrop';
import { audioSystem } from '../systems/AudioSystem';

const TEXTURE_KEY = 'cactus-texture';
const DISPLAY_W = 32;
const DISPLAY_H = 56;
const HITBOX_W = 14;
const HITBOX_H = 48;

function ensureTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURE_KEY)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });

  const dark  = 0x2d6e2d;
  const mid   = 0x3d9e3d;
  const light = 0x5abf5a;
  const spine = 0xf0e8c0;

  // Main trunk
  g.fillStyle(mid, 1);
  g.fillRect(11, 8, 10, 44);
  // Trunk shading left
  g.fillStyle(dark, 1);
  g.fillRect(11, 8, 3, 44);
  // Trunk highlight right
  g.fillStyle(light, 1);
  g.fillRect(18, 8, 3, 44);

  // Left arm
  g.fillStyle(mid, 1);
  g.fillRect(3, 22, 11, 8);
  g.fillRect(3, 14, 8, 10);
  g.fillStyle(dark, 1);
  g.fillRect(3, 22, 8, 3);
  g.fillStyle(light, 1);
  g.fillRect(3, 14, 8, 3);

  // Right arm
  g.fillStyle(mid, 1);
  g.fillRect(18, 28, 11, 8);
  g.fillRect(21, 20, 8, 10);
  g.fillStyle(dark, 1);
  g.fillRect(18, 28, 11, 3);
  g.fillStyle(light, 1);
  g.fillRect(21, 20, 8, 3);

  // Spines on trunk
  g.fillStyle(spine, 1);
  [[10, 12], [10, 20], [10, 30], [10, 40],
   [21, 16], [21, 26], [21, 36], [21, 46]].forEach(([sx, sy]) => {
    g.fillRect(sx, sy, 2, 1);
    g.fillRect(sx, sy + 1, 1, 1);
  });
  // Spines on arms
  [[4, 17], [4, 25], [22, 23], [22, 31]].forEach(([sx, sy]) => {
    g.fillRect(sx, sy, 2, 1);
  });

  // Base / ground shadow
  g.fillStyle(0x1a4a1a, 0.4);
  g.fillEllipse(16, 52, 18, 5);

  g.generateTexture(TEXTURE_KEY, DISPLAY_W, DISPLAY_H);
  g.destroy();
}

export class Cactus extends Phaser.GameObjects.Image {
  health: number;
  readonly id: number;
  private static nextId: number = 30000;
  private isAlive: boolean = true;
  private spawnX: number;
  private spawnY: number;
  private shaking: boolean = false;
  private maxHealth: number;
  private healthBar!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, health: number = 3) {
    ensureTexture(scene);
    super(scene, x, y, TEXTURE_KEY);
    this.id = Cactus.nextId++;
    this.health = health;
    this.maxHealth = health;
    this.spawnX = x;
    this.spawnY = y;
    this.setOrigin(0.5, 0.9);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(HITBOX_W, HITBOX_H);
    body.setOffset((DISPLAY_W - HITBOX_W) / 2, 4);
    this.setDepth(y);
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
  }

  hit(damage: number, scene: Phaser.Scene): void {
    if (!this.isAlive) return;
    this.health -= damage;
    audioSystem.playChop();
    scene.events.emit('damage', this.x, this.y - 50, damage);
    this.setTint(0xffffff);
    scene.time.delayedCall(80, () => { if (this.active) this.clearTint(); });
    this.shake(scene);
    this.updateHealthBar();
    if (this.health <= 0) this.die(scene);
  }

  private updateHealthBar(): void {
    this.healthBar.clear();
    if (this.health >= this.maxHealth) return;
    const barW = 28;
    const barH = 4;
    const bx = this.x - barW / 2;
    const by = this.y - 58;
    const pct = Math.max(0, this.health / this.maxHealth);
    this.healthBar.fillStyle(0x000000, 0.6);
    this.healthBar.fillRect(bx, by, barW, barH);
    const color = pct > 0.5 ? 0x44dd44 : pct > 0.25 ? 0xddaa00 : 0xdd3333;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(bx, by, barW * pct, barH);
    this.healthBar.setDepth(this.depth + 1);
  }

  private shake(scene: Phaser.Scene): void {
    if (this.shaking) return;
    this.shaking = true;
    const originX = this.x;
    scene.tweens.add({
      targets: this,
      x: originX + 3,
      duration: 40,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (this.active) this.x = originX;
        this.shaking = false;
      },
    });
  }

  private die(scene: Phaser.Scene): void {
    this.isAlive = false;
    this.healthBar.destroy();
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
    const mh = this.maxHealth;
    scene.time.delayedCall(30_000, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worldScene = scene as any;
      if (worldScene.addCactus) worldScene.addCactus(new Cactus(scene, sx, sy, mh));
    });
  }

  update(): void {
    this.setDepth(this.y);
    this.healthBar.setDepth(this.depth + 1);
  }
}
