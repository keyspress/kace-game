import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.image('player',           'assets/Player.png');
    // Rogue frames
    for (let i = 1; i <= 6;  i++) this.load.image(`rogue-walk-${i}`, `assets/Rogue/Walk/walk${i}.png`);
    for (let i = 1; i <= 18; i++) this.load.image(`rogue-idle-${i}`, `assets/Rogue/Idle/idle${i}.png`);
    for (let i = 1; i <= 8;  i++) this.load.image(`rogue-run-${i}`,  `assets/Rogue/Run/run${i}.png`);
    // Knight frames
    for (let i = 1; i <= 6;  i++) this.load.image(`knight-walk-${i}`, `assets/Knight/Walk/walk${i}.png`);
    for (let i = 1; i <= 12; i++) this.load.image(`knight-idle-${i}`, `assets/Knight/Idle/idle${i}.png`);
    for (let i = 1; i <= 8;  i++) this.load.image(`knight-run-${i}`,  `assets/Knight/Run/run${i}.png`);
    // Mage frames
    for (let i = 1; i <= 6;  i++) this.load.image(`mage-walk-${i}`, `assets/Mage/Walk/walk${i}.png`);
    for (let i = 1; i <= 14; i++) this.load.image(`mage-idle-${i}`, `assets/Mage/Idle/idle${i}.png`);
    for (let i = 1; i <= 8;  i++) this.load.image(`mage-run-${i}`,  `assets/Mage/Run/run${i}.png`);
    this.load.image('axe',              'assets/Axe.png');
    this.load.image('tree',             'assets/Tree.png');
    this.load.image('rock',             'assets/Rock.png');
    this.load.image('bear',             'assets/Bear.png');
    this.load.image('drop-wood',        'assets/drop-wood.png');
    this.load.image('drop-meat',        'assets/drop-meat.png');
    this.load.image('drop-stone',       'assets/drop-stone.png');
    this.load.image('ground-light',     'assets/Ground_Texture.png');
    this.load.image('ground-dark',      'assets/Ground_Texture_Dark.png');
  }

  create(): void {
    this.scene.start('WorldScene');
    this.scene.launch('UIScene');
  }
}
