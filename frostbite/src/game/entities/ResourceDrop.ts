import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import { audioSystem } from '../systems/AudioSystem';
import type { ResourceDropPool } from '../systems/ResourceDropPool';

type ResourceType = 'wood' | 'meat' | 'stone';

const COLORS: Record<ResourceType, number> = {
  wood:  0xd2a679,
  meat:  0xcc4444,
  stone: 0x888888,
};

export class ResourceDrop extends Phaser.GameObjects.Rectangle {
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
    super(scene, x, y, 12, 12, COLORS[resourceType]);
    this.resourceType = resourceType;
    this.amount = amount;
    this.pool = pool;
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

    scene.tweens.add({
      targets: this,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 100,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: this,
          scaleX: 1,
          scaleY: 1,
          y: startY - 20,
          duration: 150,
          ease: 'Quad.easeOut',
          onComplete: () => {
            scene.time.delayedCall(250, () => {
              if (this.collected || !this.active) return;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const player = (scene as any).player as Phaser.GameObjects.Rectangle | undefined;
              if (!player) return;
              scene.tweens.add({
                targets: this,
                x: player.x,
                y: player.y,
                scaleX: 0.6,
                scaleY: 0.6,
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
        const player = (scene as any).player as Phaser.GameObjects.Rectangle | undefined;
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
