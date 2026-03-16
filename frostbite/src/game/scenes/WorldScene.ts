import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { WeaponOrbit } from '../entities/WeaponOrbit';
import { FireballOrbit } from '../entities/FireballOrbit';
import { KnifeOrbit } from '../entities/KnifeOrbit';
import { Tree } from '../entities/Tree';
import { Bear } from '../entities/Bear';
import { Scorpion } from '../entities/Scorpion';
import { Cactus } from '../entities/Cactus';
import { InputSystem } from '../systems/InputSystem';
import { ZoneSystem } from '../systems/ZoneSystem';
import { ResourceDropPool } from '../systems/ResourceDropPool';
import { audioSystem } from '../systems/AudioSystem';
import { useGameStore } from '../../store/gameStore';

export type CharacterType = 'knight' | 'mage' | 'rogue';

type AnyWeapon = WeaponOrbit | FireballOrbit | KnifeOrbit;

// Generate a dense, evenly-distributed forest using a seeded grid with jitter
function generateTreeGrid(
  cols: number, rows: number,
  spacingX: number, spacingY: number,
  clearRadius: number = 90
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const offsetX = ((cols - 1) * spacingX) / 2;
  const offsetY = ((rows - 1) * spacingY) / 2;
  // Simple deterministic pseudo-random using index
  let seed = 42;
  function rand(): number { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * spacingX - offsetX + (rand() - 0.5) * spacingX * 0.7;
      const y = row * spacingY - offsetY + (rand() - 0.5) * spacingY * 0.7;
      // Leave a clear circle around the player spawn
      if (Math.sqrt(x * x + y * y) < clearRadius) continue;
      positions.push({ x: Math.round(x), y: Math.round(y) });
    }
  }
  return positions;
}

const FOREST_TREES = generateTreeGrid(22, 18, 90, 80, 90);

export const BEAR_ZONE_OFFSET_X = 900;
const BEAR_SPAWN_POSITIONS: { x: number; y: number }[] = [
  { x:  100, y:   50 }, { x:  -80, y:  120 }, { x:  200, y:  -80 },
  { x: -150, y: -100 }, { x:   50, y:  200 }, { x: -200, y:  180 },
  { x:  280, y:   80 }, { x: -260, y:  -40 }, { x:  350, y: -160 },
  { x: -320, y:  220 }, { x:  180, y:  300 }, { x:  -60, y: -280 },
];
const BEAR_ZONE_TREES = generateTreeGrid(16, 14, 90, 80, 0);

export const TUNDRA_ZONE_OFFSET_X = 1900;
const TUNDRA_TREE_POSITIONS = generateTreeGrid(14, 12, 90, 80, 0);

// Desert sits below the forest (positive Y offset)
export const DESERT_ZONE_OFFSET_Y = 900;
// Sparse cacti — use rock texture with green tint, fewer and more spread out
const DESERT_CACTUS_POSITIONS = generateTreeGrid(12, 10, 120, 100, 0).filter((_, i) => i % 3 !== 0);
const SCORPION_SPAWN_POSITIONS: { x: number; y: number }[] = [
  { x:  80,  y:  60 }, { x: -100, y:  140 }, { x:  220, y: -60 },
  { x: -180, y: -80 }, { x:  320, y:  100 }, { x: -280, y: 160 },
  { x:  100, y: -200 }, { x:  -60, y: 220 }, { x:  260, y: -160 },
  { x: -220, y: -180 },
];

export class WorldScene extends Phaser.Scene {
  player!: Player;
  weapons: AnyWeapon[] = [];
  private trees: Tree[] = [];
  private bears: Bear[] = [];
  private scorpions: Scorpion[] = [];
  private cacti: Cactus[] = [];
  private zoneSystem!: ZoneSystem;
  private snow!: Phaser.GameObjects.Particles.ParticleEmitter;
  dropPool: ResourceDropPool = new ResourceDropPool();

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

  private createWeapon(character: CharacterType, slotIndex: number, angleOffset: number): AnyWeapon {
    if (character === 'mage') {
      const fb = new FireballOrbit(this, this.player, slotIndex, angleOffset);
      fb.angleOffset = angleOffset;
      return fb;
    }
    if (character === 'rogue') {
      const knife = new KnifeOrbit(this, this.player, slotIndex, angleOffset);
      knife.angleOffset = angleOffset;
      return knife;
    }
    const axe = new WeaponOrbit(this, this.player, slotIndex, angleOffset);
    axe.angleOffset = angleOffset;
    return axe;
  }

  addWeapon(): void {
    const character = useGameStore.getState().activeCharacter;
    const count = this.weapons.length;
    const spacing = (Math.PI * 2) / (count + 1);
    this.weapons.forEach((w, i) => { w.angleOffset = spacing * i; });
    const weapon = this.createWeapon(character, count + 1, spacing * count);
    this.weapons.push(weapon);
    this.setupOverlaps();
  }

  private rebuildWeapons(character: CharacterType): void {
    const count = this.weapons.length;
    this.weapons.forEach((w) => w.destroy());
    this.weapons = [];
    const spacing = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      this.weapons.push(this.createWeapon(character, i + 1, spacing * i));
    }
    this.setupOverlaps();
  }

  spawnBears(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    BEAR_ZONE_TREES.forEach(({ x, y }) => {
      this.trees.push(new Tree(this, cx + BEAR_ZONE_OFFSET_X + x, cy + y - 24));
    });
    BEAR_SPAWN_POSITIONS.forEach(({ x, y }) => {
      this.bears.push(new Bear(this, cx + BEAR_ZONE_OFFSET_X + x, cy + y));
    });
    this.setupOverlaps();
  }

  spawnDesert(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    DESERT_CACTUS_POSITIONS.forEach(({ x, y }) => {
      this.cacti.push(new Cactus(this, cx + x, cy + DESERT_ZONE_OFFSET_Y + y));
    });
    SCORPION_SPAWN_POSITIONS.forEach(({ x, y }) => {
      this.scorpions.push(new Scorpion(this, cx + x, cy + DESERT_ZONE_OFFSET_Y + y));
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
        const w = _axe as AnyWeapon;
        const t = _tree as Tree;
        const time = this.time.now;
        if (w.canHit(t.id, time)) {
          w.recordHit(t.id, time);
          t.hit(w.damage, this);
          this.trees = this.trees.filter((tr) => tr.active);
        }
      });

      this.physics.add.overlap(weapon, this.bears, (_axe, _bear) => {
        const w = _axe as AnyWeapon;
        const b = _bear as Bear;
        const time = this.time.now;
        if (w.canHit(b.id, time)) {
          w.recordHit(b.id, time);
          b.hit(w.damage, this);
          this.bears = this.bears.filter((br) => br.active);
        }
      });

      this.physics.add.overlap(weapon, this.cacti, (_axe, _cactus) => {
        const w = _axe as AnyWeapon;
        const c = _cactus as Cactus;
        const time = this.time.now;
        if (w.canHit(c.id, time)) {
          w.recordHit(c.id, time);
          c.hit(w.damage, this);
          this.cacti = this.cacti.filter((ca) => ca.active);
        }
      });

      this.physics.add.overlap(weapon, this.scorpions, (_axe, _scorpion) => {
        const w = _axe as AnyWeapon;
        const s = _scorpion as Scorpion;
        const time = this.time.now;
        if (w.canHit(s.id, time)) {
          w.recordHit(s.id, time);
          s.hit(w.damage, this);
          this.scorpions = this.scorpions.filter((sc) => sc.active);
        }
      });
    });
  }

  addTree(tree: Tree): void { this.trees.push(tree); this.setupOverlaps(); }
  addBear(bear: Bear): void { this.bears.push(bear); this.setupOverlaps(); }
  addScorpion(scorpion: Scorpion): void { this.scorpions.push(scorpion); this.setupOverlaps(); }
  addCactus(cactus: Cactus): void { this.cacti.push(cactus); this.setupOverlaps(); }
  switchCharacter(character: CharacterType): void {
    this.player.switchCharacter(character);
    this.rebuildWeapons(character);
  }
  playerJump(): void { this.player.jump(this); }

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
    // Tile images are 1024×1536; display as 64×32 isometric diamonds
    const tileW = 64;
    const tileH = 32;
    const scaleX = tileW / 1024;
    const scaleY = tileH / 1536;
    const range = 80;

    for (let row = -range; row < range; row++) {
      for (let col = -range; col < range * 3; col++) {
        const isoX = (col - row) * (tileW / 2);
        const isoY = (col + row) * (tileH / 2);
        const key = (col + row) % 2 === 0 ? 'ground-light' : 'ground-dark';
        const tile = this.add.image(isoX + tileW / 2, isoY + tileH / 2, key);
        tile.setScale(scaleX, scaleY);
        tile.setDepth(-1000);
      }
    }

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

    // Desert zone warm sand overlay (starts hidden, revealed on unlock)
    const dcx = this.scale.width / 2;
    const dy2 = this.scale.height / 2 + DESERT_ZONE_OFFSET_Y;
    const desertGraphics = this.add.graphics();
    desertGraphics.fillStyle(0xe8c97a, 0.5);
    desertGraphics.fillRect(dcx - 700, dy2 - 400, 1400, 900);
    desertGraphics.setAlpha(0);
    desertGraphics.setDepth(-999);

    // Store references for ZoneSystem to reveal
    this.data.set('tundraOverlay', tundraGraphics);
    this.data.set('desertOverlay', desertGraphics);
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.weapons.forEach((w) => w.update(time, delta));
    this.trees.forEach((t) => t.update());
    this.bears.forEach((b) => b.update(time, delta));
    this.scorpions.forEach((s) => s.update(time, delta));
    this.cacti.forEach((c) => c.update());
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
