import Phaser from 'phaser';
import { ResourceDrop } from './ResourceDrop';
import { audioSystem } from '../systems/AudioSystem';

type ResourceType = 'wood' | 'meat' | 'stone';

const TREE_COLORS: Record<ResourceType, number> = {
  wood:  0x8b5e3c,
  stone: 0x7a8a99, // grey-blue for rocky tundra
  meat:  0x8b5e3c,
};

export class Tree extends Phaser.GameObjects.Rectangle {
  health: number;
  readonly id: number;
  private static nextId: number = 1;
  private isAlive: boolean = true;
  private spawnX: number;
  private spawnY: number;
  private shaking: boolean = false;
  private resourceType: ResourceType;
  private maxHealth: number;

  constructor(scene: Phaser.Scene, x: number, y: number, resourceType: ResourceType = 'wood', health: number = 3) {
    super(scene, x, y, 16, 48, TREE_COLORS[resourceType]);
    this.id = Tree.nextId++;
    this.health = health;
    this.maxHealth = health;
    this.resourceType = resourceType;
    this.spawnX = x;
    this.spawnY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(y);
  }

  hit(damage: number, scene: Phaser.Scene): void {
    if (!this.isAlive) return;
    this.health -= damage;

    audioSystem.playChop();

    // Emit damage number event for UIScene
    scene.events.emit('damage', this.x, this.y - 24, damage);

    // White flash
    const baseColor = TREE_COLORS[this.resourceType];
    this.setFillStyle(0xffffff);
    scene.time.delayedCall(80, () => {
      if (this.active) this.setFillStyle(baseColor);
    });

    // Shake
    this.shake(scene);

    if (this.health <= 0) {
      this.die(scene);
    }
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
  }
}
