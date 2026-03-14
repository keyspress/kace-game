# Frostbite — Game Project Plan
> An isometric mobile survival game where a character auto-chops trees and fights bears using orbiting axes, inspired by the Whiteout Survival advertisements.

---

## Overview

Build a mobile-first isometric 2D game where:
- The player drags a finger to move a character around a snowy wilderness
- Axes orbit the character automatically, chopping trees and fighting enemies on contact
- Resources (wood, meat, stone) drop from destroyed objects and fly toward the player
- A shop lets the player spend resources on upgrades that improve axes, speed, and collection
- The world expands in zones as the player progresses

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Game Engine | Phaser 3 + TypeScript | Game world, physics, entities, collision |
| UI Overlays | React + TypeScript | Shop drawer, resource bar, menus |
| State Bridge | Zustand | Shared state between Phaser and React |
| Build Tool | Vite | Dev server and bundling |
| Mobile Wrapper | Capacitor | iOS and Android packaging |
| Map Editor | Tiled | Isometric tile map creation |

### Key Architectural Notes
- Phaser renders to a `<canvas>` element inside a React shell component
- React UI overlays sit on top of the canvas as normal DOM elements using absolute positioning
- Zustand is the bridge: when Phaser collects a resource, it updates the Zustand store, and React re-renders the resource bar automatically
- All game logic lives in Phaser scenes and entity classes — React is only for menus and HUD overlays

---

## Project Structure

```
frostbite/
├── src/
│   ├── game/
│   │   ├── scenes/
│   │   │   ├── BootScene.ts          # Asset preloading
│   │   │   ├── WorldScene.ts         # Main game world (primary scene)
│   │   │   └── UIScene.ts            # Phaser HUD (floating damage numbers)
│   │   ├── entities/
│   │   │   ├── Player.ts             # Character sprite, movement, state
│   │   │   ├── WeaponOrbit.ts        # Axe orbit logic and hitboxes
│   │   │   ├── Tree.ts               # Choppable tree with health
│   │   │   ├── Bear.ts               # Enemy with health and AI
│   │   │   └── ResourceDrop.ts       # Collectible resource with tween arc
│   │   ├── systems/
│   │   │   ├── InputSystem.ts        # Drag input to character velocity
│   │   │   ├── CollisionSystem.ts    # Weapon vs world collision handling
│   │   │   └── ZoneSystem.ts         # Zone unlock progression
│   │   ├── data/
│   │   │   ├── upgrades.ts           # All upgrade definitions and costs
│   │   │   ├── enemies.ts            # Enemy type definitions
│   │   │   └── zones.ts              # Zone definitions and unlock thresholds
│   │   └── PhaserGame.tsx            # React component that hosts the Phaser canvas
│   ├── ui/
│   │   ├── ResourceBar.tsx           # Top HUD showing wood/meat/stone counts
│   │   ├── UpgradeShop.tsx           # Bottom drawer shop menu
│   │   └── FloatingNumbers.tsx       # DOM-based floating number popups (optional)
│   ├── store/
│   │   └── gameStore.ts              # Zustand store — all shared game state
│   ├── App.tsx                       # Root component, composes Phaser + UI layers
│   └── main.tsx                      # Vite entry point
├── assets/
│   ├── sprites/                      # Character, tree, bear, axe sprites
│   ├── tiles/                        # Isometric tile sheets
│   ├── maps/                         # Tiled .tmj map files
│   └── audio/                        # Chop, growl, collect sound effects
├── capacitor.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Core Systems — Detailed Specs

### 1. Input System (`InputSystem.ts`)

The player controls the character by dragging anywhere on the screen.

**Behavior:**
- On `pointerdown`: record the anchor point (where the finger first touched)
- On `pointermove`: calculate the vector from anchor to current finger position
- Normalize the vector and scale by max speed to get character velocity
- The further the finger is dragged from the anchor, the faster the character moves (capped at max speed)
- On `pointerup`: set character velocity to zero (character stops)
- Ignore second finger if multi-touch occurs

**Implementation notes:**
- Use Phaser's built-in pointer input: `this.input.on('pointerdown', ...)`, `this.input.on('pointermove', ...)`, `this.input.on('pointerup', ...)`
- The anchor point should NOT be a visible joystick — it is invisible, just a calculation anchor
- Apply velocity to the Phaser physics body on the Player entity each tick

---

### 2. Player Entity (`Player.ts`)

The player character is an isometric sprite that moves through the world.

**Properties:**
- `speed: number` — base movement speed (upgraded via shop)
- `velocity: { x: number, y: number }` — set by InputSystem each frame
- `weapons: WeaponOrbit[]` — array of orbiting axes attached to this player
- `collectRadius: number` — radius within which resource drops are auto-collected

**Behavior:**
- Each frame: update position based on velocity
- Choose the correct directional sprite frame based on movement direction (8 directions: N, NE, E, SE, S, SW, W, NW)
- Camera follows the player with a small lerp (smooth follow, slight lag for feel)
- When stationary, play idle animation
- Isometric depth sorting: update `depth` value each frame based on Y position so the player renders correctly in front of/behind objects

---

### 3. Weapon Orbit System (`WeaponOrbit.ts`)

Each axe orbits the player at a fixed radius, updating its position every tick.

**Orbit math (isometric ellipse):**
```typescript
const angle = this.currentAngle + this.angleOffset;
this.x = player.x + Math.cos(angle) * this.orbitRadius;
this.y = player.y + Math.sin(angle) * this.orbitRadius * 0.5; // * 0.5 flattens circle to isometric ellipse
this.currentAngle += this.orbitSpeed * delta;
```

**Properties:**
- `orbitRadius: number` — distance from player center
- `orbitSpeed: number` — radians per second (upgradeable)
- `damage: number` — damage dealt per hit
- `angleOffset: number` — starting angle offset (axes are evenly spread: 2 axes = 0° and 180°, 3 axes = 0°, 120°, 240°, etc.)
- `hitCooldown: number` — milliseconds before this axe can hit the same target again (prevents instant kill spam)

**Collision:**
- Each axe has a small circular physics body
- On overlap with a Tree or Bear: deal damage, trigger hit animation on target, start hitCooldown timer for that target
- Do NOT use Phaser arcade physics `collide` — use `overlap` so the axe passes through rather than bouncing

**Multiple axes:**
- Axes are stored in a `weapons` array on the Player
- Upgrades add new WeaponOrbit instances to the array with evenly distributed angle offsets
- Upgrade: Axe I (1 axe) → Axe II (2 axes) → Axe III (3 axes) → Axe IV (4 axes)

---

### 4. Tree Entity (`Tree.ts`)

Trees are static objects scattered on the tile map.

**Properties:**
- `health: number` — starts at a value based on zone (e.g. 3 hits in forest)
- `resourceType: 'wood'` — always drops wood
- `dropAmount: number` — how much wood drops on destruction

**Behavior:**
- When hit by an axe: reduce health, play shake/flash animation
- When health reaches 0: play destruction animation, spawn `ResourceDrop` at this position, remove tree from scene
- Respawn tree at same position after a delay (e.g. 30 seconds) so the world repopulates

**Isometric depth:** set `depth` based on Y position so trees render correctly behind/in front of the player.

---

### 5. Bear Entity (`Bear.ts`)

Bears are enemies that appear in the Bear Territory zone. They do NOT attack the player — they are purely targets.

**Properties:**
- `health: number` — higher than trees
- `resourceType: 'meat'`
- `dropAmount: number`
- `wanderSpeed: number` — bears slowly wander around their spawn point (makes them feel alive)

**Behavior:**
- Bears wander slowly in a small radius using a simple wander behavior (pick random nearby point, move toward it, wait, repeat)
- When hit by an axe: flash red, reduce health, briefly stagger (stop moving for 0.3s)
- When health reaches 0: play death animation, spawn `ResourceDrop`, remove from scene
- Respawn after a delay

---

### 6. Resource Drop (`ResourceDrop.ts`)

Resources that fly toward the player when dropped.

**Behavior:**
1. Spawn at the position of the destroyed tree/bear
2. Play a small "pop up" bounce (tween upward slightly)
3. Wait 0.5 seconds, then tween in an arc toward the player's current position
4. On reaching the player (or on proximity overlap with player's collectRadius): add to resource count in Zustand store, play collect sound, destroy sprite
5. If player does not collect within 8 seconds: auto-collect (tween to player regardless of distance)

**Visuals:**
- Wood = small log sprite
- Meat = small meat sprite
- Resource sprites should have a small bounce scale tween when they spawn for satisfying feel

---

### 7. Zone System (`ZoneSystem.ts`)

The world is divided into zones that unlock as the player accumulates resources.

| Zone | Unlock Condition | Resource | Enemy |
|---|---|---|---|
| Pine Forest | Start | 🪵 Wood | None |
| Bear Territory | 500 Wood collected lifetime | 🥩 Meat | Bears |
| Rocky Tundra | 300 Meat collected lifetime | 🪨 Stone | Wolves (future) |
| Wolf Den | 500 Stone collected lifetime | 🐾 Pelts | Wolves (future) |

**Behavior:**
- Track lifetime resource totals in Zustand (separate from current spendable amounts)
- When a threshold is crossed, show a zone unlock notification and reveal the new area on the map
- New zone tiles and entities activate
- Camera can now pan into the new zone

---

### 8. Upgrade Shop

The shop is a React component (bottom drawer) that reads from and writes to Zustand.

**Opening/closing:**
- A persistent shop button appears in the bottom corner of the screen
- Tapping it slides up the shop drawer from the bottom
- While the shop is open, emit a Phaser event `'shop:open'` that pauses the game world scene (`scene.pause()`)
- On close, emit `'shop:close'` and resume (`scene.resume()`)

**Upgrade categories:**

**Axe Upgrades (cost: Wood)**
| Upgrade | Effect | Max Level |
|---|---|---|
| Axe Damage | +damage per hit | 10 |
| Orbit Speed | +orbit rotation speed | 8 |
| Extra Axe | +1 orbiting axe | 3 (total 4 axes) |
| Orbit Radius | +orbit distance from player | 5 |

**Hunter Upgrades (cost: Meat)**
| Upgrade | Effect | Max Level |
|---|---|---|
| Bear Damage | +damage to bears | 10 |
| Meat Yield | +meat dropped per kill | 8 |
| Attract Radius | resource drops fly to player from further | 6 |
| Stagger Power | bears stagger longer on hit | 5 |

**Explorer Upgrades (cost: Stone)**
| Upgrade | Effect | Max Level |
|---|---|---|
| Move Speed | +character movement speed | 8 |
| Collect Speed | resource tween arc is faster | 5 |
| Auto-Collect Radius | player auto-collects from larger area | 6 |

**Upgrade cost scaling:**
Each upgrade level costs progressively more: `baseCost * (level + 1) * 1.5` rounded to nearest 10.

---

### 9. Zustand Store (`gameStore.ts`)

Central state shared between Phaser and React.

```typescript
interface GameState {
  // Current spendable resources
  wood: number;
  meat: number;
  stone: number;

  // Lifetime totals (used for zone unlocks)
  woodTotal: number;
  meatTotal: number;
  stoneTotal: number;

  // Upgrade levels (key = upgrade id, value = current level)
  upgrades: Record<string, number>;

  // Unlocked zones
  unlockedZones: string[];

  // Shop state
  shopOpen: boolean;

  // Actions
  addResource: (type: 'wood' | 'meat' | 'stone', amount: number) => void;
  spendResource: (type: 'wood' | 'meat' | 'stone', amount: number) => boolean;
  purchaseUpgrade: (upgradeId: string) => void;
  unlockZone: (zoneId: string) => void;
  setShopOpen: (open: boolean) => void;
}
```

**Phaser → Zustand:** Phaser calls `useGameStore.getState().addResource(...)` directly (outside React, using Zustand's `getState()`)

**Zustand → Phaser:** Phaser reads upgrade values from `getState().upgrades` on each relevant tick or event

---

## Isometric Rendering Notes

- Use Phaser 3's built-in isometric support via a standard orthographic camera with manual depth sorting
- Tile map created in **Tiled** app using isometric tile mode, exported as `.tmj` (Tiled JSON format)
- Tile size: 64x32 pixels (standard isometric tile)
- **Depth sorting rule:** Every entity (player, trees, bears, drops) sets `gameObject.depth = gameObject.y` each frame. This ensures entities lower on screen (further from camera) render behind entities higher on screen.
- Tree/object sprites should have their origin set to the base of the sprite, not the center, for correct isometric placement

---

## Save System

- Use Zustand `persist` middleware with Capacitor's `Preferences` plugin as the storage adapter
- Auto-save every 30 seconds
- Save on app backgrounding: listen for Capacitor `App.addListener('appStateChange', ...)`
- On load: rehydrate Zustand store, then Phaser reads upgrade values to initialize entity stats

---

## Visual & Audio Style

**Visual:**
- Clean flat-shaded isometric pixel art style
- Snowy color palette: white, ice blue, dark pine green, brown wood tones, off-white snow
- Particle effects: small snow flurries as background atmosphere
- Hit effects: small white flash on tree/bear when axe connects
- Screen shake: subtle short shake when a bear is killed
- Floating damage numbers: pop up from hit position in `UIScene`, scale up then fade out

**Audio (all optional for MVP but noted for Phase 3):**
- Chop sound: short satisfying thwack
- Bear hit sound: low grunt
- Bear death sound: short roar
- Resource collect sound: soft coin/collect chime
- Background: subtle ambient wind loop

---

## Build Phases

### Phase 1 — Core Feel (MVP)
Goal: A moving character with an orbiting axe that chops a tree. Must feel satisfying before anything else is built.

- [ ] Scaffold project: Vite + Phaser 3 + React + TypeScript
- [ ] Install and configure Zustand
- [ ] Set up Capacitor for iOS
- [ ] Create `BootScene` that loads a placeholder character sprite and axe sprite
- [ ] Create `WorldScene` with a flat isometric tile floor
- [ ] Implement `Player.ts` — renders on screen, moves with drag input
- [ ] Implement `InputSystem.ts` — drag anywhere to steer, proportional speed
- [ ] Implement `WeaponOrbit.ts` — one axe orbits the player in an isometric ellipse
- [ ] Place one tree on the map
- [ ] Axe overlaps tree → tree takes damage → tree dies → `ResourceDrop` spawns → flies to player → Zustand wood count increments
- [ ] `ResourceBar.tsx` renders on top of canvas showing wood count

**Phase 1 is complete when:** You can drag to walk into a tree, watch axes chop it, collect the wood, and see the count go up. This should feel fun before moving on.

---

### Phase 2 — The Loop
Goal: Full core game loop is playable end to end.

- [ ] Place many trees in forest zone with respawn timers
- [ ] Implement `Bear.ts` with wander behavior
- [ ] Bears spawn in Bear Territory zone (gated behind 500 wood lifetime)
- [ ] `ZoneSystem.ts` — unlock Bear Territory when threshold met, show notification
- [ ] Implement `UpgradeShop.tsx` — React bottom drawer with wood-funded axe upgrades
- [ ] Shop opens/closes, pauses/resumes Phaser scene
- [ ] At least 4 functional upgrades (axe damage, orbit speed, extra axe, move speed)
- [ ] Save/load via Capacitor Preferences

---

### Phase 3 — Game Feel & Polish
Goal: It feels like a real game.

- [ ] Sprite art for character (8 directional), axe, tree, bear, resource drops
- [ ] Tree shake animation on hit
- [ ] Bear flash + stagger on hit
- [ ] Resource drop arc tween with bounce
- [ ] Floating damage numbers in `UIScene`
- [ ] Snow particle background
- [ ] Hit sound effects
- [ ] Collect sound effect
- [ ] Screen shake on bear kill
- [ ] Zone transition animation (fog of war lifts)
- [ ] Stone/Rocky Tundra zone (third resource tier)

---

### Phase 4 — Shipping
Goal: Playable on a real iPhone.

- [ ] Capacitor iOS build configured
- [ ] App icon and splash screen
- [ ] Test on physical device — verify drag input, performance at 60fps
- [ ] Performance audit — object pooling for resource drops and particles
- [ ] App Store metadata and screenshots
- [ ] Submit to TestFlight

---

## Implementation Notes for Claude Code

### Starting Point
Begin with Phase 1 only. Do not build Phase 2+ systems until Phase 1 is complete and the core feel is verified.

### Scaffold Commands
```bash
npm create vite@latest frostbite -- --template react-ts
cd frostbite
npm install phaser zustand
npm install -D @types/node
npx cap init
npx cap add ios
```

### Phaser inside React
The `PhaserGame.tsx` component should:
1. Create a `div` ref as the Phaser canvas parent
2. Initialize the Phaser `Game` instance in a `useEffect` with empty deps array
3. Destroy the Phaser instance in the `useEffect` cleanup function
4. Pass the Zustand store reference to Phaser via the game's global registry (`game.registry.set('store', useGameStore)`)

### Phaser + Zustand Bridge Pattern
```typescript
// In Phaser (outside React, in a Scene):
import { useGameStore } from '../../store/gameStore';
const store = useGameStore.getState();
store.addResource('wood', 10);

// Never call React hooks inside Phaser classes — always use getState()
```

### Isometric Depth Sorting
Add this to every entity's `update()` method:
```typescript
this.setDepth(this.y);
```

### Mobile Performance Targets
- Target 60fps on mid-range mobile (iPhone 12 / Android equivalent)
- Use Phaser's object pooling for resource drops (they spawn and die frequently)
- Limit active resource drops to 50 at a time — auto-collect oldest if limit exceeded
- Keep particle counts low (max 30 snow particles at once)

### Asset Placeholders for Phase 1
Use colored rectangles and circles as placeholder sprites during Phase 1:
- Player: green rectangle 32x48
- Axe: small red rectangle 16x8
- Tree: brown rectangle 16x48 with green circle on top
- Bear: dark brown rectangle 40x40
- Wood drop: small tan square 12x12
Do not wait for final art to begin coding.

---

## Definition of Done — Phase 1

The Phase 1 milestone is complete when all of the following are true:
1. Running `npm run dev` shows a Phaser canvas inside a React app
2. A character sprite appears on an isometric tile floor
3. Dragging a finger (or mouse on desktop) moves the character proportionally
4. One axe orbits the character in an isometric ellipse continuously
5. A tree is on the map and the axe collides with it, dealing damage
6. When the tree dies, a wood sprite spawns and tweens to the player
7. The Zustand wood count increments and the React ResourceBar updates
8. No console errors
9. Runs on a physical iOS device via Capacitor (or via Safari mobile simulation at minimum)
