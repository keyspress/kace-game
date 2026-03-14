import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { WeaponOrbit } from '../entities/WeaponOrbit';
import { Tree } from '../entities/Tree';
import { InputSystem } from '../systems/InputSystem';

export class WorldScene extends Phaser.Scene {
  player!: Player;
  private weapons: WeaponOrbit[] = [];
  private trees: Tree[] = [];

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.drawFloor(width, height);

    this.player = new Player(this, width / 2, height / 2);

    const axe = new WeaponOrbit(this, this.player, 80, 0);
    this.weapons.push(axe);

    const tree = new Tree(this, width / 2 + 150, height / 2 + 60);
    this.trees.push(tree);

    // InputSystem registers pointer listeners on the scene — no reference needed after construction
    new InputSystem(this, this.player);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Set up physics overlap for each axe against trees
    this.weapons.forEach((weapon) => {
      this.physics.add.overlap(
        weapon,
        this.trees,
        (_axe, _tree) => {
          const w = _axe as WeaponOrbit;
          const t = _tree as Tree;
          const time = this.time.now;
          if (w.canHit(t.id, time)) {
            w.recordHit(t.id, time);
            t.hit(w.damage, this);
            // Clean up destroyed trees
            this.trees = this.trees.filter((tr) => tr.active);
          }
        }
      );
    });
  }

  private drawFloor(width: number, height: number): void {
    const graphics = this.add.graphics();
    const tileW = 64;
    const tileH = 32;
    // Draw a wide enough grid to cover initial view + camera movement
    const cols = Math.ceil(width / tileW) + 20;
    const rows = Math.ceil(height / tileH) + 20;
    const offsetX = width / 2;
    const offsetY = height / 4;

    for (let row = -10; row < rows; row++) {
      for (let col = -10; col < cols; col++) {
        const isoX = (col - row) * (tileW / 2) + offsetX;
        const isoY = (col + row) * (tileH / 2) + offsetY;
        const shade = (col + row) % 2 === 0 ? 0xd8ecf3 : 0xc5dfe8;
        graphics.fillStyle(shade, 1);
        graphics.fillPoints(
          [
            { x: isoX,                y: isoY + tileH / 2 },
            { x: isoX + tileW / 2,   y: isoY },
            { x: isoX + tileW,       y: isoY + tileH / 2 },
            { x: isoX + tileW / 2,   y: isoY + tileH },
          ],
          true
        );
      }
    }
    graphics.setDepth(-1000);
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.weapons.forEach((w) => w.update(time, delta));
    this.trees.forEach((t) => t.update());
  }
}
