import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

const BEAR_TERRITORY_THRESHOLD = 500;

export class ZoneSystem {
  private scene: Phaser.Scene;
  private bearZoneUnlocked: boolean = false;
  private notificationShowing: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Check if already unlocked from a prior save
    const { unlockedZones } = useGameStore.getState();
    if (unlockedZones.includes('bear-territory')) {
      this.bearZoneUnlocked = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scene as any).spawnBears?.();
    }
  }

  update(): void {
    if (this.bearZoneUnlocked) return;
    const { woodTotal } = useGameStore.getState();
    if (woodTotal >= BEAR_TERRITORY_THRESHOLD) {
      this.unlockBearTerritory();
    }
  }

  private unlockBearTerritory(): void {
    this.bearZoneUnlocked = true;
    useGameStore.getState().unlockZone('bear-territory');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.scene as any).spawnBears?.();
    this.showUnlockNotification('Bear Territory Unlocked!');
  }

  private showUnlockNotification(message: string): void {
    if (this.notificationShowing) return;
    this.notificationShowing = true;

    const { width, height } = this.scene.scale;
    const text = this.scene.add.text(width / 2, height * 0.35, message, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0); // fixed to camera
    text.setDepth(5000);

    this.scene.tweens.add({
      targets: text,
      alpha: { from: 1, to: 0 },
      delay: 2500,
      duration: 800,
      onComplete: () => {
        text.destroy();
        this.notificationShowing = false;
      },
    });
  }
}
