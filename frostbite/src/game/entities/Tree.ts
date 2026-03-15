import Phaser from 'phaser';
import { ResourceDrop } from './ResourceDrop';

export class Tree extends Phaser.GameObjects.Rectangle {
  health: number = 3;
  readonly id: number;
  private static nextId: number = 1;
  private isAlive: boolean = true;
  private spawnX: number;
  private spawnY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 16, 48, 0x8b5e3c);
    this.id = Tree.nextId++;
    this.spawnX = x;
    this.spawnY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(y);
  }

  hit(damage: number, scene: Phaser.Scene): void {
    if (!this.isAlive) return;
    this.health -= damage;
    this.setFillStyle(0xffffff);
    scene.time.delayedCall(80, () => {
      if (this.active) this.setFillStyle(0x8b5e3c);
    });
    if (this.health <= 0) {
      this.die(scene);
    }
  }

  private die(scene: Phaser.Scene): void {
    this.isAlive = false;
    new ResourceDrop(scene, this.x, this.y, 'wood', 1);
    this.destroy();

    // Respawn after 30 seconds
    const sx = this.spawnX;
    const sy = this.spawnY;
    scene.time.delayedCall(30_000, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worldScene = scene as any;
      if (worldScene.addTree) {
        const newTree = new Tree(scene, sx, sy);
        worldScene.addTree(newTree);
      }
    });
  }

  update(): void {
    this.setDepth(this.y);
  }
}
