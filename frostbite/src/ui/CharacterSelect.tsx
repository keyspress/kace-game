import { useGameStore } from '../store/gameStore';
import type { CharacterType } from '../store/gameStore';

const CHARACTERS: { id: CharacterType; label: string; img: string; color: string }[] = [
  { id: 'rogue',  label: 'Rogue',  img: 'assets/Rogue/rogue.png',   color: '#3a7d44' },
  { id: 'knight', label: 'Knight', img: 'assets/Knight/knight.png', color: '#2c5f8a' },
  { id: 'mage',   label: 'Mage',   img: 'assets/Mage/mage.png',     color: '#7b2d8b' },
];

interface Props {
  gameEvents: Phaser.Events.EventEmitter | null;
}

export function CharacterSelect({ gameEvents }: Props) {
  const activeCharacter = useGameStore((s) => s.activeCharacter);
  const setCharacter = useGameStore((s) => s.setCharacter);

  function handleSelect(id: CharacterType) {
    if (id === activeCharacter) return;
    setCharacter(id);
    gameEvents?.emit('character:change', id);
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 90,
        right: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 10,
      }}
    >
      {CHARACTERS.map(({ id, label, img, color }) => {
        const active = id === activeCharacter;
        return (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px 4px 4px',
              background: active ? color : 'rgba(0,0,0,0.55)',
              border: active ? `2px solid #fff` : '2px solid rgba(255,255,255,0.25)',
              borderRadius: 8,
              cursor: active ? 'default' : 'pointer',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 13,
              fontWeight: active ? 'bold' : 'normal',
              opacity: active ? 1 : 0.75,
              transition: 'all 0.15s',
            }}
          >
            <img src={img} alt={label} style={{ width: 36, height: 36, imageRendering: 'pixelated' }} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
