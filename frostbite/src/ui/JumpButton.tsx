import { useState } from 'react';

interface Props {
  gameEvents: Phaser.Events.EventEmitter | null;
}

export function JumpButton({ gameEvents }: Props) {
  const [pressed, setPressed] = useState(false);

  function handleJump() {
    if (pressed) return;
    setPressed(true);
    gameEvents?.emit('player:jump');
    setTimeout(() => setPressed(false), 600);
  }

  return (
    <button
      onPointerDown={handleJump}
      style={{
        position: 'absolute',
        bottom: 40,
        left: 40,
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.5)',
        border: '3px solid rgba(255,255,255,0.6)',
        color: '#fff',
        fontSize: 28,
        cursor: 'pointer',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: pressed ? 'scale(0.9)' : 'scale(1)',
        transition: 'transform 0.1s, background 0.1s',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      ↑
    </button>
  );
}
