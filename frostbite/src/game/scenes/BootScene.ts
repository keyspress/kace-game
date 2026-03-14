import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Phase 1: no external assets — all entities are drawn as colored rectangles.
    // Phase 2+: load spritesheets and tilemaps here.
  }

  create(): void {
    this.scene.start('WorldScene');
  }
}
