import Phaser from 'phaser';
import { Player } from './Player';

// Source image: 1024×1536 — display at 32×24
const SCALE_X = 32 / 1024;
const SCALE_Y = 24 / 1536;

export class WeaponOrbit extends Phaser.GameObjects.Sprite {
  private player: Player;
  orbitRadius: number;
  orbitSpeed: number; // radians per ms
  private currentAngle: number;
  angleOffset: number;
  damage: number = 1;
  private hitCooldowns: Map<number, number> = new Map();
  private hitCooldownMs: number = 500;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    _slotIndex: number = 1,
    angleOffset: number = 0,
    orbitSpeed: number = 0.002
  ) {
    super(scene, player.x, player.y, 'axe');
    this.player = player;
    this.orbitRadius = 80;
    this.orbitSpeed = orbitSpeed;
    this.currentAngle = angleOffset;
    this.angleOffset = angleOffset;
    this.setScale(SCALE_X, SCALE_Y);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setSize(20, 14);
  }

  update(_time: number, delta: number): void {
    this.currentAngle += this.orbitSpeed * delta;
    this.x = this.player.x + Math.cos(this.currentAngle) * this.orbitRadius;
    this.y = this.player.y + Math.sin(this.currentAngle) * this.orbitRadius * 0.5;
    // Rotate sprite to match orbit direction
    this.setRotation(this.currentAngle);
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
