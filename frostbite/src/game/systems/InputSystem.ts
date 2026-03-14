import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class InputSystem {
  private player: Player;
  private anchor: { x: number; y: number } | null = null;
  private readonly deadZone: number = 10;
  private readonly maxDistance: number = 100;

  constructor(scene: Phaser.Scene, player: Player) {
    this.player = player;

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.anchor) return; // ignore second finger
      this.anchor = { x: pointer.x, y: pointer.y };
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.anchor || !pointer.isDown) return;
      const dx = pointer.x - this.anchor.x;
      const dy = pointer.y - this.anchor.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.deadZone) {
        this.player.velocity = { x: 0, y: 0 };
        return;
      }

      const clamped = Math.min(dist, this.maxDistance);
      const ratio = clamped / this.maxDistance;
      const nx = dx / dist;
      const ny = dy / dist;

      this.player.velocity = {
        x: nx * this.player.speed * ratio,
        y: ny * this.player.speed * ratio,
      };
    });

    scene.input.on('pointerup', () => {
      this.anchor = null;
      this.player.velocity = { x: 0, y: 0 };
    });
  }
}
