import Phaser from 'phaser';
import { Player } from './Player';

// Fire frames are 32×32 — display at 32×32
const DISPLAY = 32;
const SCALE = DISPLAY / 32;

export class FireballOrbit extends Phaser.GameObjects.Sprite {
  private player: Player;
  orbitRadius: number;
  orbitSpeed: number;
  private currentAngle: number;
  angleOffset: number;
  damage: number = 1;
  private hitCooldowns: Map<number, number> = new Map();
  private hitCooldownMs: number = 500;
  readonly id: number;
  private static nextId = 90000;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    _slotIndex: number = 1,
    angleOffset: number = 0,
    orbitSpeed: number = 0.002
  ) {
    super(scene, player.x, player.y, 'fireball-1');
    this.id = FireballOrbit.nextId++;
    this.player = player;
    this.orbitRadius = 80;
    this.orbitSpeed = orbitSpeed;
    this.currentAngle = angleOffset;
    this.angleOffset = angleOffset;
    this.setScale(SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setSize(20, 20);

    // Create fireball animation if not already defined
    if (!scene.anims.exists('fireball-spin')) {
      scene.anims.create({
        key: 'fireball-spin',
        frames: Array.from({ length: 9 }, (_, i) => ({ key: `fireball-${i + 1}` })),
        frameRate: 14,
        repeat: -1,
      });
    }
    this.play('fireball-spin');
  }

  update(_time: number, delta: number): void {
    this.currentAngle += this.orbitSpeed * delta;
    this.x = this.player.x + Math.cos(this.currentAngle) * this.orbitRadius;
    this.y = this.player.y + Math.sin(this.currentAngle) * this.orbitRadius * 0.5;
    (this.body as Phaser.Physics.Arcade.Body).reset(this.x, this.y);
    this.setDepth(this.y);
  }

  canHit(targetId: number, time: number): boolean {
    const last = this.hitCooldowns.get(targetId) ?? 0;
    return time - last >= this.hitCooldownMs;
  }

  recordHit(targetId: number, time: number): void {
    this.hitCooldowns.set(targetId, time);
  }
}
