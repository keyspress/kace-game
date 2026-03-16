import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.image('player',           'assets/Player.png');
    this.load.spritesheet('player-walk', 'assets/player_walking.png', { frameWidth: 384, frameHeight: 1024 });
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
