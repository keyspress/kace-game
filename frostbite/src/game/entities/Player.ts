import Phaser from 'phaser';

// Source image: 1024×1536 — display at 48×64
const SCALE_X = 48 / 1024;
const SCALE_Y = 64 / 1536;
// Physics hitbox (smaller than visual for feel)
const HITBOX_W = 28;
const HITBOX_H = 28;

export class Player extends Phaser.GameObjects.Sprite {
  speed: number = 200;
  velocity: { x: number; y: number } = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    this.setScale(SCALE_X, SCALE_Y);
    this.setOrigin(0.5, 0.85); // anchor near base for isometric grounding
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(HITBOX_W, HITBOX_H);
    body.setOffset(
      (this.width - HITBOX_W) / 2,
      this.height - HITBOX_H - 4
    );
    this.setDepth(y);
  }

  update(_time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.velocity.x, this.velocity.y);
    this.setDepth(this.y);

    // Flip sprite based on horizontal movement direction
    if (this.velocity.x < -5) this.setFlipX(true);
    else if (this.velocity.x > 5) this.setFlipX(false);
  }
}
