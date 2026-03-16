import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import { audioSystem } from '../systems/AudioSystem';
import type { ResourceDropPool } from '../systems/ResourceDropPool';

type ResourceType = 'wood' | 'meat' | 'stone';

// Source images: 1024×1536 — display at 24×24
const SCALE_X = 24 / 1024;
const SCALE_Y = 24 / 1536;

export class ResourceDrop extends Phaser.GameObjects.Sprite {
  private resourceType: ResourceType;
  private amount: number;
  private collected: boolean = false;
  private pool: ResourceDropPool | null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    resourceType: ResourceType,
    amount: number,
    pool: ResourceDropPool | null = null
  ) {
    super(scene, x, y, `drop-${resourceType}`);
    this.resourceType = resourceType;
    this.amount = amount;
    this.pool = pool;
    this.setScale(SCALE_X, SCALE_Y);
    scene.add.existing(this);
    this.setDepth(y);
    this.setScale(0);
    this.flyToPlayer(scene);
  }

  /** Called by the pool when the cap is exceeded — instantly collect without animation */
  forceCollect(): void {
    this.collect();
  }

  private flyToPlayer(scene: Phaser.Scene): void {
    const startY = this.y;
    const collectSpeedLevel = useGameStore.getState().upgrades['collect-speed'] ?? 0;
    const arcDuration = Math.max(150, 350 - collectSpeedLevel * 40);

    const sx = SCALE_X;
    const sy = SCALE_Y;

    scene.tweens.add({
      targets: this,
      scaleX: sx * 1.4,
      scaleY: sy * 1.4,
      duration: 100,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: this,
          scaleX: sx,
          scaleY: sy,
          y: startY - 20,
          duration: 150,
          ease: 'Quad.easeOut',
          onComplete: () => {
            scene.time.delayedCall(250, () => {
              if (this.collected || !this.active) return;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const player = (scene as any).player as Phaser.GameObjects.Sprite | undefined;
              if (!player) return;
              scene.tweens.add({
                targets: this,
                x: player.x,
                y: player.y,
                scaleX: sx * 0.6,
                scaleY: sy * 0.6,
                duration: arcDuration,
                ease: 'Quad.easeIn',
                onComplete: () => this.collect(),
              });
            });
          },
        });
      },
    });

    // Auto-collect after 8 seconds
    scene.time.delayedCall(8000, () => {
      if (!this.collected && this.active) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const player = (scene as any).player as Phaser.GameObjects.Sprite | undefined;
        if (!player) { this.collect(); return; }
        scene.tweens.add({
          targets: this,
          x: player.x,
          y: player.y,
          duration: 300,
          ease: 'Quad.easeIn',
          onComplete: () => this.collect(),
        });
      }
    });
  }

  private collect(): void {
    if (this.collected) return;
    this.collected = true;
    this.pool?.remove(this);
    audioSystem.playCollect();
    useGameStore.getState().addResource(this.resourceType, this.amount);
    if (this.active) this.destroy();
  }
}
