import Phaser from 'phaser';
import { Player } from './Player';

export class WeaponOrbit extends Phaser.GameObjects.Rectangle {
  private player: Player;
  private orbitRadius: number;
  private orbitSpeed: number; // radians per ms
  private currentAngle: number;
  angleOffset: number;
  damage: number = 1;
  private hitCooldowns: Map<number, number> = new Map();
  private hitCooldownMs: number = 500;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    orbitRadius: number = 80,
    angleOffset: number = 0,
    orbitSpeed: number = 0.002
  ) {
    super(scene, player.x, player.y, 16, 8, 0xdd3333);
    this.player = player;
    this.orbitRadius = orbitRadius;
    this.orbitSpeed = orbitSpeed;
    this.currentAngle = angleOffset;
    this.angleOffset = angleOffset;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body).setImmovable(true);
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
