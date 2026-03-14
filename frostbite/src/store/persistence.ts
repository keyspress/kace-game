import { Preferences } from '@capacitor/preferences';
import { useGameStore } from './gameStore';

const SAVE_KEY = 'frostbite-save';

type SaveData = {
  wood: number;
  meat: number;
  stone: number;
  woodTotal: number;
  meatTotal: number;
  stoneTotal: number;
  upgrades: Record<string, number>;
  unlockedZones: string[];
};

export async function saveGame(): Promise<void> {
  const s = useGameStore.getState();
  const data: SaveData = {
    wood: s.wood,
    meat: s.meat,
    stone: s.stone,
    woodTotal: s.woodTotal,
    meatTotal: s.meatTotal,
    stoneTotal: s.stoneTotal,
    upgrades: s.upgrades,
    unlockedZones: s.unlockedZones,
  };
  await Preferences.set({ key: SAVE_KEY, value: JSON.stringify(data) });
}

export async function loadGame(): Promise<void> {
  const { value } = await Preferences.get({ key: SAVE_KEY });
  if (!value) return;
  try {
    const data: SaveData = JSON.parse(value);
    useGameStore.setState({
      wood:          data.wood          ?? 0,
      meat:          data.meat          ?? 0,
      stone:         data.stone         ?? 0,
      woodTotal:     data.woodTotal     ?? 0,
      meatTotal:     data.meatTotal     ?? 0,
      stoneTotal:    data.stoneTotal    ?? 0,
      upgrades:      data.upgrades      ?? {},
      unlockedZones: data.unlockedZones ?? ['forest'],
    });
  } catch {
    // Corrupt save — start fresh
    console.warn('Frostbite: corrupt save data, starting fresh.');
  }
}
