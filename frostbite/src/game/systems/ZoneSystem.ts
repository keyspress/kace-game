import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

const BEAR_TERRITORY_THRESHOLD  = 5;  // TODO: restore to 500
const ROCKY_TUNDRA_THRESHOLD    = 10; // TODO: restore to 300

export class ZoneSystem {
  private scene: Phaser.Scene;
  private bearZoneUnlocked: boolean   = false;
  private tundraZoneUnlocked: boolean = false;
  private notificationShowing: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { unlockedZones } = useGameStore.getState();

    if (unlockedZones.includes('bear-territory')) {
      this.bearZoneUnlocked = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scene as any).spawnBears?.();
    }
    if (unlockedZones.includes('rocky-tundra')) {
      this.tundraZoneUnlocked = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scene as any).spawnTundra?.();
      this.revealTundraOverlay(true);
    }
  }

  update(): void {
    const { woodTotal, meatTotal } = useGameStore.getState();

    if (!this.bearZoneUnlocked && woodTotal >= BEAR_TERRITORY_THRESHOLD) {
      this.unlockZone('bear-territory', '🐻 Bear Territory Unlocked!', 'spawnBears');
    }
    if (this.bearZoneUnlocked && !this.tundraZoneUnlocked && meatTotal >= ROCKY_TUNDRA_THRESHOLD) {
      this.unlockZone('rocky-tundra', '🪨 Rocky Tundra Unlocked!', 'spawnTundra');
      this.revealTundraOverlay(false);
    }
  }

  private unlockZone(id: string, message: string, spawnMethod: string): void {
    if (id === 'bear-territory') this.bearZoneUnlocked = true;
    if (id === 'rocky-tundra')   this.tundraZoneUnlocked = true;

    useGameStore.getState().unlockZone(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.scene as any)[spawnMethod]?.();
    this.showUnlockNotification(message);
  }

  private revealTundraOverlay(instant: boolean): void {
    const overlay = this.scene.data.get('tundraOverlay') as Phaser.GameObjects.Graphics | undefined;
    if (!overlay) return;
    if (instant) {
      overlay.setAlpha(0.4);
      return;
    }
    // Fog-lifts animation: flash then fade in
    this.scene.tweens.add({
      targets: overlay,
      alpha: { from: 0, to: 0.4 },
      duration: 2000,
      ease: 'Sine.easeInOut',
    });
  }

  private showUnlockNotification(message: string): void {
    if (this.notificationShowing) return;
    this.notificationShowing = true;

    const { width, height } = this.scene.scale;

    // Background pill
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(width / 2 - 220, height * 0.32 - 24, 440, 52, 14);
    bg.setScrollFactor(0);
    bg.setDepth(5000);
    bg.setAlpha(0);

    const text = this.scene.add.text(width / 2, height * 0.35, message, {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(5001);
    text.setAlpha(0);

    // Fade in, hold, fade out
    this.scene.tweens.add({
      targets: [bg, text],
      alpha: 1,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2200, () => {
          this.scene.tweens.add({
            targets: [bg, text],
            alpha: 0,
            duration: 600,
            onComplete: () => {
              bg.destroy();
              text.destroy();
              this.notificationShowing = false;
            },
          });
        });
      },
    });
  }
}
