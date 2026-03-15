import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Listen for damage events emitted by WorldScene
    this.scene.get('WorldScene').events.on(
      'damage',
      (worldX: number, worldY: number, amount: number) => {
        this.showDamageNumber(worldX, worldY, amount);
      }
    );
  }

  private showDamageNumber(worldX: number, worldY: number, amount: number): void {
    // Convert world coords to screen coords via the WorldScene camera
    const worldScene = this.scene.get('WorldScene');
    const cam = worldScene.cameras.main;
    const screenX = (worldX - cam.scrollX) * cam.zoom;
    const screenY = (worldY - cam.scrollY) * cam.zoom;

    const text = this.add.text(screenX, screenY, `-${amount}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(9999);

    this.tweens.add({
      targets: text,
      y: screenY - 40,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }
}
