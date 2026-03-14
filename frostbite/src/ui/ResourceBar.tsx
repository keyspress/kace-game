import { useGameStore } from '../store/gameStore';

export function ResourceBar() {
  const wood = useGameStore((s) => s.wood);
  const meat = useGameStore((s) => s.meat);
  const stone = useGameStore((s) => s.stone);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        gap: 24,
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.45)',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 18,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <span>🪵 {wood}</span>
      <span>🥩 {meat}</span>
      <span>🪨 {stone}</span>
    </div>
  );
}
