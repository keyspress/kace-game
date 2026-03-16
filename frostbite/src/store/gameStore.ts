import { create } from 'zustand';

export type CharacterType = 'knight' | 'mage' | 'rogue';

interface GameState {
  wood: number;
  meat: number;
  stone: number;
  woodTotal: number;
  meatTotal: number;
  stoneTotal: number;
  upgrades: Record<string, number>;
  unlockedZones: string[];
  shopOpen: boolean;
  activeCharacter: CharacterType;
  addResource: (type: 'wood' | 'meat' | 'stone', amount: number) => void;
  spendResource: (type: 'wood' | 'meat' | 'stone', amount: number) => boolean;
  purchaseUpgrade: (upgradeId: string) => void;
  unlockZone: (zoneId: string) => void;
  setShopOpen: (open: boolean) => void;
  setCharacter: (character: CharacterType) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  wood: 0,
  meat: 0,
  stone: 0,
  woodTotal: 0,
  meatTotal: 0,
  stoneTotal: 0,
  upgrades: {},
  unlockedZones: ['forest'],
  shopOpen: false,
  activeCharacter: 'rogue',

  addResource: (type, amount) =>
    set((state) => ({
      [type]: state[type] + amount,
      [`${type}Total`]: (state[`${type}Total` as 'woodTotal' | 'meatTotal' | 'stoneTotal']) + amount,
    })),

  spendResource: (type, amount) => {
    const state = get();
    if (state[type] < amount) return false;
    set({ [type]: state[type] - amount });
    return true;
  },

  purchaseUpgrade: (upgradeId) =>
    set((state) => ({
      upgrades: {
        ...state.upgrades,
        [upgradeId]: (state.upgrades[upgradeId] ?? 0) + 1,
      },
    })),

  unlockZone: (zoneId) =>
    set((state) => ({
      unlockedZones: state.unlockedZones.includes(zoneId)
        ? state.unlockedZones
        : [...state.unlockedZones, zoneId],
    })),

  setShopOpen: (open) => set({ shopOpen: open }),
  setCharacter: (character) => set({ activeCharacter: character }),
}));
