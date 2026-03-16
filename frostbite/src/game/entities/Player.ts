import Phaser from 'phaser';
import type { CharacterType } from '../../store/gameStore';

// All frames are 128×128 — display at 64×64
const SCALE = 64 / 128;
const HITBOX_W = 24;
const HITBOX_H = 24;

const CHAR_FRAMES: Record<CharacterType, { idle: number; walk: number; run: number }> = {
  rogue:  { idle: 18, walk: 6, run: 8 },
  knight: { idle: 12, walk: 6, run: 8 },
  mage:   { idle: 14, walk: 6, run: 8 },
};

export class Player extends Phaser.GameObjects.Sprite {
  speed: number = 200;
  velocity: { x: number; y: number } = { x: 0, y: 0 };
  private currentCharacter: CharacterType = 'rogue';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'rogue-idle-1');
    this.setScale(SCALE);
    this.setOrigin(0.5, 0.85);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(HITBOX_W, HITBOX_H);
    body.setOffset(
      (this.displayWidth - HITBOX_W) / 2,
      this.displayHeight - HITBOX_H - 4
    );
    this.setDepth(y);

    this.createAnims(scene);
    this.play('rogue-idle');
  }

  private createAnims(scene: Phaser.Scene): void {
    const chars: CharacterType[] = ['rogue', 'knight', 'mage'];
    chars.forEach((char) => {
      const f = CHAR_FRAMES[char];

      // Idle — skip missing frames (e.g. rogue has no idle11)
      const idleFrames: { key: string }[] = [];
      for (let i = 1; i <= f.idle; i++) {
        const key = `${char}-idle-${i}`;
        if (scene.textures.exists(key)) idleFrames.push({ key });
      }
      scene.anims.create({ key: `${char}-idle`, frames: idleFrames, frameRate: 10, repeat: -1 });

      scene.anims.create({
        key: `${char}-walk`,
        frames: Array.from({ length: f.walk }, (_, i) => ({ key: `${char}-walk-${i + 1}` })),
        frameRate: 10,
        repeat: -1,
      });

      scene.anims.create({
        key: `${char}-run`,
        frames: Array.from({ length: f.run }, (_, i) => ({ key: `${char}-run-${i + 1}` })),
        frameRate: 12,
        repeat: -1,
      });
    });
  }

  switchCharacter(character: CharacterType): void {
    if (character === this.currentCharacter) return;
    this.currentCharacter = character;
    this.play(`${character}-idle`);
  }

  update(_time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.velocity.x, this.velocity.y);
    this.setDepth(this.y);

    const char = this.currentCharacter;
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    const currentAnim = this.anims.currentAnim?.key;

    if (speed > 150) {
      if (currentAnim !== `${char}-run`) this.play(`${char}-run`);
    } else if (speed > 5) {
      if (currentAnim !== `${char}-walk`) this.play(`${char}-walk`);
    } else {
      if (currentAnim !== `${char}-idle`) this.play(`${char}-idle`);
    }

    if (this.velocity.x < -5) this.setFlipX(true);
    else if (this.velocity.x > 5) this.setFlipX(false);
  }
}
