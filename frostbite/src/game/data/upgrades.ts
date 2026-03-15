export type ResourceType = 'wood' | 'meat' | 'stone';

export interface UpgradeDef {
  id: string;
  label: string;
  description: string;
  costResource: ResourceType;
  baseCost: number;
  maxLevel: number;
  /** special: 'extra-axe' triggers addWeapon() on the scene */
  special?: 'extra-axe';
  /** zone that must be unlocked before this upgrade appears */
  requiredZone?: string;
}

export const UPGRADES: UpgradeDef[] = [
  // Axe upgrades (cost: wood)
  {
    id: 'axe-damage',
    label: 'Axe Damage',
    description: '+1 damage per hit',
    costResource: 'wood',
    baseCost: 30,
    maxLevel: 10,
  },
  {
    id: 'orbit-speed',
    label: 'Orbit Speed',
    description: 'Axes spin faster',
    costResource: 'wood',
    baseCost: 40,
    maxLevel: 8,
  },
  {
    id: 'extra-axe',
    label: 'Extra Axe',
    description: '+1 orbiting axe',
    costResource: 'wood',
    baseCost: 100,
    maxLevel: 3,
    special: 'extra-axe',
  },
  {
    id: 'orbit-radius',
    label: 'Orbit Radius',
    description: 'Wider orbit path',
    costResource: 'wood',
    baseCost: 35,
    maxLevel: 5,
  },
  // Hunter upgrades (cost: meat)
  {
    id: 'bear-damage',
    label: 'Bear Damage',
    description: '+1 damage to bears',
    costResource: 'meat',
    baseCost: 30,
    maxLevel: 10,
  },
  {
    id: 'meat-yield',
    label: 'Meat Yield',
    description: '+1 meat per kill',
    costResource: 'meat',
    baseCost: 40,
    maxLevel: 8,
  },
  // Explorer upgrades (cost: stone — unlocked with Rocky Tundra)
  {
    id: 'move-speed',
    label: 'Move Speed',
    description: '+20 movement speed',
    costResource: 'stone',
    baseCost: 30,
    maxLevel: 8,
    requiredZone: 'rocky-tundra',
  },
  {
    id: 'collect-speed',
    label: 'Collect Speed',
    description: 'Resources arc faster',
    costResource: 'stone',
    baseCost: 25,
    maxLevel: 5,
    requiredZone: 'rocky-tundra',
  },
];

export function upgradeCost(def: UpgradeDef, currentLevel: number): number {
  return Math.round((def.baseCost * (currentLevel + 1) * 1.5) / 10) * 10;
}
