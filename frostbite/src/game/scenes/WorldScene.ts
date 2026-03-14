import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { WeaponOrbit } from '../entities/WeaponOrbit';
import { Tree } from '../entities/Tree';
import { Bear } from '../entities/Bear';
import { InputSystem } from '../systems/InputSystem';
import { ZoneSystem } from '../systems/ZoneSystem';
import { useGameStore } from '../../store/gameStore';

// Forest zone tree positions (spread around center)
const FOREST_TREES: { x: number; y: number }[] = [
  { x:  150, y:   60 }, { x: -120, y:   80 }, { x:  220, y: -100 },
  { x: -200, y: -130 }, { x:   80, y:  180 }, { x: -160, y:  200 },
  { x:  300, y:  120 }, { x: -280, y:   20 }, { x:  100, y: -220 },
  { x: -100, y: -240 }, { x:  250, y: -200 }, { x: -250, y:  160 },
  { x:  380, y:  -60 }, { x: -340, y: -100 }, { x:  160, y:  300 },
  { x: -180, y:  320 }, { x:  420, y:  200 }, { x: -400, y:  240 },
  { x:   40, y: -300 }, { x:  -60, y:  -340 },
];

// Bear Territory positions (offset far to the right/east)
const BEAR_ZONE_OFFSET_X = 900;
const BEAR_SPAWN_POSITIONS: { x: number; y: number }[] = [
  { x:  100, y:   50 }, { x: -80,  y:  120 }, { x:  200, y: -80  },
  { x: -150, y: -100 }, { x:  50,  y:  200 }, { x: -200, y:  180 },
  { x:  280, y:   80 }, { x: -260, y:  -40 },
];

export class WorldScene extends Phaser.Scene {
  player!: Player;
  weapons: WeaponOrbit[] = [];
  private trees: Tree[] = [];
  private bears: Bear[] = [];
  private zoneSystem!: ZoneSystem;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.drawFloor();

    this.player = new Player(this, cx, cy);

    // One axe to start (upgrades can add more)
    this.addWeapon();

    // Spawn forest trees
    FOREST_TREES.forEach(({ x, y }) => {
      const tree = new Tree(this, cx + x, cy + y);
      this.trees.push(tree);
    });

    new InputSystem(this, this.player);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    this.zoneSystem = new ZoneSystem(this);

    // Listen for shop open/close to pause/resume
    this.game.events.on('shop:open',  () => this.scene.pause());
    this.game.events.on('shop:close', () => this.scene.resume());

    this.setupOverlaps();
  }

  // Called by upgrade system to add a new orbiting axe
  addWeapon(): void {
    const count = this.weapons.length;
    // Evenly distribute angle offsets
    const spacing = (Math.PI * 2) / (count + 1);
    // Re-offset existing weapons
    this.weapons.forEach((w, i) => { w.angleOffset = spacing * i; });
    const axe = new WeaponOrbit(this, this.player, count + 1);
    axe.angleOffset = spacing * count;
    this.weapons.push(axe);
    this.setupOverlaps();
  }

  // Called by ZoneSystem when Bear Territory unlocks
  spawnBears(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    BEAR_SPAWN_POSITIONS.forEach(({ x, y }) => {
      const bear = new Bear(this, cx + BEAR_ZONE_OFFSET_X + x, cy + y);
      this.bears.push(bear);
    });
    this.setupOverlaps();
  }

  private setupOverlaps(): void {
    // Re-register overlaps for all weapons vs trees and bears
    // (Phaser overlap callbacks accumulate; duplicates are harmless but
    //  we clear physics world overlaps and re-add for cleanliness)
    this.physics.world.colliders.destroy();

    this.weapons.forEach((weapon) => {
      this.physics.add.overlap(weapon, this.trees, (_axe, _tree) => {
        const w = _axe as WeaponOrbit;
        const t = _tree as Tree;
        const time = this.time.now;
        if (w.canHit(t.id, time)) {
          w.recordHit(t.id, time);
          t.hit(w.damage, this);
          this.trees = this.trees.filter((tr) => tr.active);
        }
      });

      this.physics.add.overlap(weapon, this.bears, (_axe, _bear) => {
        const w = _axe as WeaponOrbit;
        const b = _bear as Bear;
        const time = this.time.now;
        if (w.canHit(b.id, time)) {
          w.recordHit(b.id, time);
          b.hit(w.damage, this);
          this.bears = this.bears.filter((br) => br.active);
        }
      });
    });
  }

  // Called by Tree/Bear when they respawn after a delay
  addTree(tree: Tree): void  { this.trees.push(tree);  this.setupOverlaps(); }
  addBear(bear: Bear): void  { this.bears.push(bear);  this.setupOverlaps(); }

  private drawFloor(): void {
    const graphics = this.add.graphics();
    const tileW = 64;
    const tileH = 32;
    // Large enough to cover forest + bear zone + camera movement
    const range = 60;

    for (let row = -range; row < range; row++) {
      for (let col = -range; col < range * 2; col++) {
        const isoX = (col - row) * (tileW / 2);
        const isoY = (col + row) * (tileH / 2);
        const shade = (col + row) % 2 === 0 ? 0xd8ecf3 : 0xc5dfe8;
        graphics.fillStyle(shade, 1);
        graphics.fillPoints(
          [
            { x: isoX,              y: isoY + tileH / 2 },
            { x: isoX + tileW / 2,  y: isoY },
            { x: isoX + tileW,      y: isoY + tileH / 2 },
            { x: isoX + tileW / 2,  y: isoY + tileH },
          ],
          true
        );
      }
    }
    graphics.setDepth(-1000);

    // Bear territory visual marker — slightly warmer tint tiles
    const bearGraphics = this.add.graphics();
    const bx = this.scale.width / 2 + BEAR_ZONE_OFFSET_X;
    const by = this.scale.height / 2;
    bearGraphics.fillStyle(0xe8d8c5, 0.35);
    bearGraphics.fillRect(bx - 400, by - 300, 800, 600);
    bearGraphics.setDepth(-999);
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.weapons.forEach((w) => w.update(time, delta));
    this.trees.forEach((t) => t.update());
    this.bears.forEach((b) => b.update(time, delta));
    this.zoneSystem.update();

    // Sync weapon stats from upgrades every frame (cheap store.getState read)
    const { upgrades } = useGameStore.getState();
    const damageLevel  = upgrades['axe-damage']    ?? 0;
    const speedLevel   = upgrades['orbit-speed']   ?? 0;
    const radiusLevel  = upgrades['orbit-radius']  ?? 0;
    this.weapons.forEach((w) => {
      w.damage      = 1 + damageLevel;
      w.orbitSpeed  = 0.002 + speedLevel * 0.0003;
      w.orbitRadius = 80 + radiusLevel * 15;
    });
    this.player.speed = 200 + (upgrades['move-speed'] ?? 0) * 20;
  }
}
