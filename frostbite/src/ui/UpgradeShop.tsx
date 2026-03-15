import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { UPGRADES, upgradeCost } from '../game/data/upgrades';

const RESOURCE_ICONS: Record<string, string> = { wood: '🪵', meat: '🥩', stone: '🪨' };

interface Props {
  gameEvents: Phaser.Events.EventEmitter | null;
}

export function UpgradeShop({ gameEvents }: Props) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const wood          = useGameStore((s) => s.wood);
  const meat          = useGameStore((s) => s.meat);
  const stone         = useGameStore((s) => s.stone);
  const upgrades      = useGameStore((s) => s.upgrades);
  const unlockedZones = useGameStore((s) => s.unlockedZones);
  const spendResource   = useGameStore((s) => s.spendResource);
  const purchaseUpgrade = useGameStore((s) => s.purchaseUpgrade);

  const openShop = () => {
    setOpen(true);
    gameEvents?.emit('shop:open');
  };

  const closeShop = () => {
    setOpen(false);
    gameEvents?.emit('shop:close');
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeShop();
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleBuy = (id: string) => {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return;
    const level = upgrades[id] ?? 0;
    if (level >= def.maxLevel) return;
    const cost = upgradeCost(def, level);
    const resources: Record<string, number> = { wood, meat, stone };
    if ((resources[def.costResource] ?? 0) < cost) return;

    const ok = spendResource(def.costResource, cost);
    if (!ok) return;
    purchaseUpgrade(id);

    if (def.special === 'extra-axe') {
      gameEvents?.emit('upgrade:extra-axe');
    }
  };

  const resources: Record<string, number> = { wood, meat, stone };
  const visibleUpgrades = UPGRADES.filter(
    (def) => !def.requiredZone || unlockedZones.includes(def.requiredZone)
  );

  return (
    <>
      <button
        onClick={openShop}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          zIndex: 20,
          padding: '12px 20px',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: 20,
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: 12,
          cursor: 'pointer',
        }}
      >
        🪓 Shop
      </button>

      {open && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }} />
      )}

      <div
        ref={drawerRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: '#1a2233',
          borderRadius: '18px 18px 0 0',
          padding: '20px 16px 32px',
          transform: open ? 'translateY(0)' : 'translateY(105%)',
          transition: 'transform 0.3s ease',
          maxHeight: '70vh',
          overflowY: 'auto',
          color: '#fff',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 20, fontWeight: 'bold' }}>🪓 Upgrades</span>
          <button
            onClick={closeShop}
            style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 24, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {visibleUpgrades.map((def) => {
            const level     = upgrades[def.id] ?? 0;
            const maxed     = level >= def.maxLevel;
            const cost      = upgradeCost(def, level);
            const canAfford = (resources[def.costResource] ?? 0) >= cost;

            return (
              <div
                key={def.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  gap: 12,
                  opacity: maxed ? 0.5 : 1,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 15 }}>{def.label}</div>
                  <div style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>{def.description}</div>
                  <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                    Level {level} / {def.maxLevel}
                  </div>
                </div>

                <button
                  disabled={maxed || !canAfford}
                  onClick={() => handleBuy(def.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: maxed ? '#444' : canAfford ? '#3a7bd5' : '#333',
                    color: maxed || !canAfford ? '#888' : '#fff',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    cursor: maxed || !canAfford ? 'default' : 'pointer',
                    minWidth: 80,
                    textAlign: 'center',
                  }}
                >
                  {maxed ? 'MAX' : `${RESOURCE_ICONS[def.costResource]} ${cost}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
