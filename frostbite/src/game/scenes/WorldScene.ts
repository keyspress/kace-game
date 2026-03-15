import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { WeaponOrbit } from '../entities/WeaponOrbit';
import { Tree } from '../entities/Tree';
import { Bear } from '../entities/Bear';
import { InputSystem } from '../systems/InputSystem';
import { ZoneSystem } from '../systems/ZoneSystem';
import { audioSystem } from '../systems/AudioSystem';
import { useGameStore } from '../../store/gameStore';

const FOREST_TREES: { x: number; y: number }[] = [
  { x:  150, y:   60 }, { x: -120, y:   80 }, { x:  220, y: -100 },
  { x: -200, y: -130 }, { x:   80, y:  180 }, { x: -160, y:  200 },
  { x:  300, y:  120 }, { x: -280, y:   20 }, { x:  100, y: -220 },
  { x: -100, y: -240 }, { x:  250, y: -200 }, { x: -250, y:  160 },
  { x:  380, y:  -60 }, { x: -340, y: -100 }, { x:  160, y:  300 },
  { x: -180, y:  320 }, { x:  420, y:  200 }, { x: -400, y:  240 },
  { x:   40, y: -300 }, { x:  -60, y:  -340 },
];

export const BEAR_ZONE_OFFSET_X = 900;
const BEAR_SPAWN_POSITIONS: { x: number; y: number }[] = [
  { x:  100, y:   50 }, { x:  -80, y:  120 }, { x:  200, y:  -80 },
  { x: -150, y: -100 }, { x:   50, y:  200 }, { x: -200, y:  180 },
  { x:  280, y:   80 }, { x: -260, y:  -40 },
];

export const TUNDRA_ZONE_OFFSET_X = 1900;
const TUNDRA_TREE_POSITIONS: { x: number; y: number }[] = [
  { x:  80,  y:   40 }, { x: -100, y:  100 }, { x:  180, y:  -60 },
  { x: -160, y:  -80 }, { x:  260, y:  120 }, { x: -240, y:  160 },
  { x:  120, y: -180 }, { x:  -80, y: -200 }, { x:  320, y:  -20 },
  { x: -300, y:   60 },
];

export class WorldScene extends Phaser.Scene {
  player!: Player;
  weapons: WeaponOrbit[] = [];
  private trees: Tree[] = [];
  private bears: Bear[] = [];
  private zoneSystem!: ZoneSystem;
  private snow!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.drawFloor();
    this.createSnow();

    this.player = new Player(this, cx, cy);
    this.addWeapon();

    FOREST_TREES.forEach(({ x, y }) => {
      this.trees.push(new Tree(this, cx + x, cy + y - 24));
    });

    new InputSystem(this, this.player);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    this.zoneSystem = new ZoneSystem(this);

    this.game.events.on('shop:open',  () => this.scene.pause());
    this.game.events.on('shop:close', () => this.scene.resume());

    this.setupOverlaps();

    // Start ambient wind (requires prior user gesture — first pointer down is enough)
    this.input.once('pointerdown', () => audioSystem.startWind());
  }

  addWeapon(): void {
    const count = this.weapons.length;
    const spacing = (Math.PI * 2) / (count + 1);
    this.weapons.forEach((w, i) => { w.angleOffset = spacing * i; });
    const axe = new WeaponOrbit(this, this.player, count + 1);
    axe.angleOffset = spacing * count;
    this.weapons.push(axe);
    this.setupOverlaps();
  }

  spawnBears(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    BEAR_SPAWN_POSITIONS.forEach(({ x, y }) => {
      this.bears.push(new Bear(this, cx + BEAR_ZONE_OFFSET_X + x, cy + y));
    });
    this.setupOverlaps();
  }

  spawnTundra(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    TUNDRA_TREE_POSITIONS.forEach(({ x, y }) => {
      // Stone rocks have 5 health and drop stone
      this.trees.push(new Tree(this, cx + TUNDRA_ZONE_OFFSET_X + x, cy + y - 24, 'stone', 5));
    });
    this.setupOverlaps();
  }

  private setupOverlaps(): void {
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

  addTree(tree: Tree): void { this.trees.push(tree); this.setupOverlaps(); }
  addBear(bear: Bear): void { this.bears.push(bear); this.setupOverlaps(); }

  private createSnow(): void {
    // Use Phaser's built-in particle system with a white square texture
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('snow-particle', 4, 4);
    g.destroy();

    this.snow = this.add.particles(0, 0, 'snow-particle', {
      x: { min: -200, max: this.scale.width + 200 },
      y: -10,
      lifespan: { min: 4000, max: 8000 },
      speedX: { min: -20, max: 20 },
      speedY: { min: 30, max: 70 },
      scale: { min: 0.3, max: 1.0 },
      alpha: { min: 0.3, max: 0.7 },
      quantity: 1,
      frequency: 120, // emit one particle every 120ms (~8/sec)
    });
    this.snow.setScrollFactor(0); // fixed to camera
    this.snow.setDepth(9000);     // above everything except UI
  }

  private drawFloor(): void {
    const graphics = this.add.graphics();
    const tileW = 64;
    const tileH = 32;
    const range = 80;

    for (let row = -range; row < range; row++) {
      for (let col = -range; col < range * 3; col++) {
        const isoX = (col - row) * (tileW / 2);
        const isoY = (col + row) * (tileH / 2);
        const shade = (col + row) % 2 === 0 ? 0xd8ecf3 : 0xc5dfe8;
        graphics.fillStyle(shade, 1);
        graphics.fillPoints(
          [
            { x: isoX,             y: isoY + tileH / 2 },
            { x: isoX + tileW / 2, y: isoY },
            { x: isoX + tileW,     y: isoY + tileH / 2 },
            { x: isoX + tileW / 2, y: isoY + tileH },
          ],
          true
        );
      }
    }
    graphics.setDepth(-1000);

    // Bear zone warm overlay
    const bx = this.scale.width / 2 + BEAR_ZONE_OFFSET_X;
    const by = this.scale.height / 2;
    const bearGraphics = this.add.graphics();
    bearGraphics.fillStyle(0xe8d8c5, 0.35);
    bearGraphics.fillRect(bx - 400, by - 400, 900, 800);
    bearGraphics.setDepth(-999);

    // Tundra zone cool-grey overlay (starts hidden, revealed on unlock)
    const tx = this.scale.width / 2 + TUNDRA_ZONE_OFFSET_X;
    const tundraGraphics = this.add.graphics();
    tundraGraphics.fillStyle(0xaabbcc, 0.4);
    tundraGraphics.fillRect(tx - 400, by - 400, 900, 800);
    tundraGraphics.setAlpha(0);
    tundraGraphics.setDepth(-999);

    // Store reference for ZoneSystem to reveal
    this.data.set('tundraOverlay', tundraGraphics);
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.weapons.forEach((w) => w.update(time, delta));
    this.trees.forEach((t) => t.update());
    this.bears.forEach((b) => b.update(time, delta));
    this.zoneSystem.update();

    const { upgrades } = useGameStore.getState();
    const damageLevel     = upgrades['axe-damage']    ?? 0;
    const speedLevel      = upgrades['orbit-speed']   ?? 0;
    const radiusLevel     = upgrades['orbit-radius']  ?? 0;
    const bearDamageLevel = upgrades['bear-damage']   ?? 0;
    this.weapons.forEach((w) => {
      w.damage      = 1 + damageLevel + bearDamageLevel;
      w.orbitSpeed  = 0.002 + speedLevel * 0.0003;
      w.orbitRadius = 80 + radiusLevel * 15;
    });
    this.player.speed = 200 + (upgrades['move-speed'] ?? 0) * 20;
  }
}
