import Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Rectangle {
  speed: number = 200;
  velocity: { x: number; y: number } = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 32, 48, 0x44bb44);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(y);
  }

  update(_time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.velocity.x, this.velocity.y);
    this.setDepth(this.y);
  }
}
