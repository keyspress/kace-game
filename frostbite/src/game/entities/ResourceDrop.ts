import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

type ResourceType = 'wood' | 'meat' | 'stone';

const COLORS: Record<ResourceType, number> = {
  wood: 0xd2a679,
  meat: 0xcc4444,
  stone: 0x888888,
};

export class ResourceDrop extends Phaser.GameObjects.Rectangle {
  private resourceType: ResourceType;
  private amount: number;
  private collected: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    resourceType: ResourceType,
    amount: number
  ) {
    super(scene, x, y, 12, 12, COLORS[resourceType]);
    this.resourceType = resourceType;
    this.amount = amount;
    scene.add.existing(this);
    this.setDepth(y);
    this.flyToPlayer(scene);
  }

  private flyToPlayer(scene: Phaser.Scene): void {
    scene.tweens.add({
      targets: this,
      y: this.y - 20,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => {
        scene.time.delayedCall(300, () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const player = (scene as any).player as Phaser.GameObjects.Rectangle | undefined;
          if (!player || this.collected) return;
          scene.tweens.add({
            targets: this,
            x: player.x,
            y: player.y,
            duration: 400,
            ease: 'Quad.easeIn',
            onComplete: () => this.collect(),
          });
        });
      },
    });
  }

  private collect(): void {
    if (this.collected) return;
    this.collected = true;
    useGameStore.getState().addResource(this.resourceType, this.amount);
    this.destroy();
  }
}
