import Phaser from 'phaser';
import { ResourceDrop } from './ResourceDrop';
import { audioSystem } from '../systems/AudioSystem';

type ResourceType = 'wood' | 'meat' | 'stone';

// Source images: 1024×1536
const TREE_SCALE_X  = 64 / 1024;
const TREE_SCALE_Y  = 96 / 1536;
const ROCK_SCALE_X  = 64 / 1024;
const ROCK_SCALE_Y  = 48 / 1536;

// Physics hitbox sizes
const TREE_HITBOX = { w: 20, h: 20 };
const ROCK_HITBOX = { w: 28, h: 20 };

export class Tree extends Phaser.GameObjects.Sprite {
  health: number;
  readonly id: number;
  private static nextId: number = 1;
  private isAlive: boolean = true;
  private spawnX: number;
  private spawnY: number;
  private shaking: boolean = false;
  private resourceType: ResourceType;
  private maxHealth: number;
  private healthBar!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, resourceType: ResourceType = 'wood', health: number = 3) {
    const textureKey = resourceType === 'stone' ? 'rock' : 'tree';
    super(scene, x, y, textureKey);

    this.id = Tree.nextId++;
    this.health = health;
    this.maxHealth = health;
    this.resourceType = resourceType;
    this.spawnX = x;
    this.spawnY = y;

    if (resourceType === 'stone') {
      this.setScale(ROCK_SCALE_X, ROCK_SCALE_Y);
    } else {
      this.setScale(TREE_SCALE_X, TREE_SCALE_Y);
    }
    this.setOrigin(0.5, 0.9);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    const hb = resourceType === 'stone' ? ROCK_HITBOX : TREE_HITBOX;
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(hb.w, hb.h);
    body.setOffset(
      (this.width - hb.w) / 2,
      this.height - hb.h - 2
    );

    this.setDepth(y);
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
  }

  hit(damage: number, scene: Phaser.Scene): void {
    if (!this.isAlive) return;
    this.health -= damage;

    audioSystem.playChop();
    scene.events.emit('damage', this.x, this.y - 40, damage);

    // White flash tint
    this.setTint(0xffffff);
    scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint();
    });

    this.shake(scene);
    this.updateHealthBar();

    if (this.health <= 0) {
      this.die(scene);
    }
  }

  private updateHealthBar(): void {
    this.healthBar.clear();
    if (this.health >= this.maxHealth) return; // hide at full health

    const barW = 32;
    const barH = 4;
    const bx = this.x - barW / 2;
    const by = this.y - 52;
    const pct = Math.max(0, this.health / this.maxHealth);

    // Background
    this.healthBar.fillStyle(0x000000, 0.6);
    this.healthBar.fillRect(bx, by, barW, barH);
    // Fill
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
      x: originX + 4,
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
      pool.spawn(scene, this.x, this.y, this.resourceType, 1);
    } else {
      new ResourceDrop(scene, this.x, this.y, this.resourceType, 1);
    }
    this.destroy();

    const sx = this.spawnX;
    const sy = this.spawnY;
    const rt = this.resourceType;
    const mh = this.maxHealth;
    scene.time.delayedCall(30_000, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worldScene = scene as any;
      if (worldScene.addTree) {
        worldScene.addTree(new Tree(scene, sx, sy, rt, mh));
      }
    });
  }

  update(): void {
    this.setDepth(this.y);
    this.healthBar.setDepth(this.depth + 1);
  }
}
