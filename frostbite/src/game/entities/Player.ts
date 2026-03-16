import Phaser from 'phaser';

// Rogue frames are 128×128 — display at 64×64
const DISPLAY_SIZE = 64;
const SCALE = DISPLAY_SIZE / 128;
// Physics hitbox
const HITBOX_W = 24;
const HITBOX_H = 24;

export class Player extends Phaser.GameObjects.Sprite {
  speed: number = 200;
  velocity: { x: number; y: number } = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'rogue-idle-1');
    this.setScale(SCALE);
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
      key: 'rogue-idle',
      frames: Array.from({ length: 18 }, (_, i) => ({ key: `rogue-idle-${i + 1}` })),
      frameRate: 10,
      repeat: -1,
    });

    scene.anims.create({
      key: 'rogue-walk',
      frames: Array.from({ length: 6 }, (_, i) => ({ key: `rogue-walk-${i + 1}` })),
      frameRate: 10,
      repeat: -1,
    });

    scene.anims.create({
      key: 'rogue-run',
      frames: Array.from({ length: 8 }, (_, i) => ({ key: `rogue-run-${i + 1}` })),
      frameRate: 12,
      repeat: -1,
    });

    this.play('rogue-idle');
  }

  update(_time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.velocity.x, this.velocity.y);
    this.setDepth(this.y);

    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    const currentAnim = this.anims.currentAnim?.key;

    if (speed > 150) {
      if (currentAnim !== 'rogue-run') this.play('rogue-run');
    } else if (speed > 5) {
      if (currentAnim !== 'rogue-walk') this.play('rogue-walk');
    } else {
      if (currentAnim !== 'rogue-idle') this.play('rogue-idle');
    }

    if (this.velocity.x < -5) this.setFlipX(true);
    else if (this.velocity.x > 5) this.setFlipX(false);
  }
}
