import Phaser from 'phaser';
import { Player } from './Player';

const TEXTURE_KEY = 'knife-texture';

function ensureTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURE_KEY)) return;
  // Draw a slim dagger: long blade, tiny handle
  const g = scene.make.graphics({ x: 0, y: 0 });
  // Blade — long silver triangle (tip at top)
  g.fillStyle(0xdce8f0, 1);
  g.fillTriangle(16, 0, 19, 18, 13, 18);
  // Blade centre highlight
  g.fillStyle(0xffffff, 0.8);
  g.fillTriangle(16, 1, 17, 15, 16, 15);
  // Guard — narrow bar
  g.fillStyle(0x8b6914, 1);
  g.fillRect(11, 18, 10, 2);
  // Handle — short and thin
  g.fillStyle(0x5a3a1a, 1);
  g.fillRect(14, 20, 4, 4);
  g.generateTexture(TEXTURE_KEY, 32, 26);
  g.destroy();
}

export class KnifeOrbit extends Phaser.GameObjects.Image {
  private player: Player;
  orbitRadius: number;
  orbitSpeed: number;
  private currentAngle: number;
  angleOffset: number;
  damage: number = 1;
  private hitCooldowns: Map<number, number> = new Map();
  private hitCooldownMs: number = 500;
  readonly id: number;
  private static nextId = 80000;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    _slotIndex: number = 1,
    angleOffset: number = 0,
    orbitSpeed: number = 0.002
  ) {
    ensureTexture(scene);
    super(scene, player.x, player.y, TEXTURE_KEY);
    this.id = KnifeOrbit.nextId++;
    this.player = player;
    this.orbitRadius = 80;
    this.orbitSpeed = orbitSpeed;
    this.currentAngle = angleOffset;
    this.angleOffset = angleOffset;
    this.setScale(1.5);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setSize(18, 18);
  }

  update(_time: number, delta: number): void {
    this.currentAngle += this.orbitSpeed * delta;
    this.x = this.player.x + Math.cos(this.currentAngle) * this.orbitRadius;
    this.y = this.player.y + Math.sin(this.currentAngle) * this.orbitRadius * 0.5;
    // Spin faster than orbit for a nice throwing-knife look
    this.setRotation(this.currentAngle * 4);
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
