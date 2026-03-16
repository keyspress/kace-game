import Phaser from 'phaser';

// Spritesheet: 1536×1024, 4 frames of 384×1024 — display at 48×64
const SCALE_X = 48 / 384;
const SCALE_Y = 64 / 1024;
// Physics hitbox (smaller than visual for feel)
const HITBOX_W = 28;
const HITBOX_H = 28;

export class Player extends Phaser.GameObjects.Sprite {
  speed: number = 200;
  velocity: { x: number; y: number } = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-walk', 1);
    this.setScale(SCALE_X, SCALE_Y);
    this.setOrigin(0.5, 0.85);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(HITBOX_W, HITBOX_H);
    body.setOffset(
      (this.displayWidth - HITBOX_W) / 2,
      this.displayHeight - HITBOX_H - 4
    );
    this.setDepth(y);

    scene.anims.create({
      key: 'walk',
      frames: scene.anims.generateFrameNumbers('player-walk', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: 'idle',
      frames: [{ key: 'player-walk', frame: 1 }],
      frameRate: 1,
      repeat: -1,
    });

    this.play('idle');
  }

  update(_time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.velocity.x, this.velocity.y);
    this.setDepth(this.y);

    const moving = Math.abs(this.velocity.x) > 5 || Math.abs(this.velocity.y) > 5;

    if (moving) {
      if (this.anims.currentAnim?.key !== 'walk') this.play('walk');
    } else {
      if (this.anims.currentAnim?.key !== 'idle') this.play('idle');
    }

    if (this.velocity.x < -5) this.setFlipX(true);
    else if (this.velocity.x > 5) this.setFlipX(false);
  }
}
