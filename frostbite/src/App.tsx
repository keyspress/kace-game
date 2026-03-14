import { useRef, useState, useCallback, useEffect } from 'react';
import Phaser from 'phaser';
import { App as CapApp } from '@capacitor/app';
import { PhaserGame } from './game/PhaserGame';
import { ResourceBar } from './ui/ResourceBar';
import { UpgradeShop } from './ui/UpgradeShop';
import { saveGame } from './store/persistence';

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [gameEvents, setGameEvents] = useState<Phaser.Events.EventEmitter | null>(null);

  const handleGameReady = useCallback((game: Phaser.Game) => {
    gameRef.current = game;
    setGameEvents(game.events);
  }, []);

  useEffect(() => {
    // Auto-save every 30 seconds
    const interval = setInterval(() => { saveGame(); }, 30_000);

    // Save when app goes to background (Capacitor)
    let removeListener: (() => void) | null = null;
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) saveGame();
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => {
      clearInterval(interval);
      removeListener?.();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PhaserGame onGameReady={handleGameReady} />
      <ResourceBar />
      <UpgradeShop gameEvents={gameEvents} />
    </div>
  );
}
