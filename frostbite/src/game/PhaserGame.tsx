import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';

interface Props {
  onGameReady: (game: Phaser.Game) => void;
}

export function PhaserGame({ onGameReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#c5dfe8',
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      scene: [BootScene, WorldScene, UIScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
    gameRef.current = game;

    // Listen for extra-axe upgrade and forward to WorldScene
    game.events.on('upgrade:extra-axe', () => {
      const worldScene = game.scene.getScene('WorldScene') as WorldScene | null;
      worldScene?.addWeapon();
    });

    // Forward character switch to WorldScene
    game.events.on('character:change', (character: string) => {
      const worldScene = game.scene.getScene('WorldScene') as WorldScene | null;
      worldScene?.switchCharacter(character as import('./scenes/WorldScene').CharacterType);
    });

    // Forward jump to WorldScene
    game.events.on('player:jump', () => {
      const worldScene = game.scene.getScene('WorldScene') as WorldScene | null;
      worldScene?.playerJump();
    });

    onGameReady(game);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  // onGameReady is stable (defined inline in App) — dep array intentionally empty
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}
