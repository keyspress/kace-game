import Phaser from 'phaser';
import { ResourceDrop } from '../entities/ResourceDrop';

type ResourceType = 'wood' | 'meat' | 'stone';

const MAX_ACTIVE_DROPS = 50;

/**
 * Object pool for ResourceDrop.
 * Keeps a list of active drops. When the cap is exceeded, the oldest drop
 * is force-collected before a new one is spawned.
 */
export class ResourceDropPool {
  private active: ResourceDrop[] = [];

  spawn(
    scene: Phaser.Scene,
    x: number,
    y: number,
    resourceType: ResourceType,
    amount: number
  ): void {
    // Cull oldest if at cap
    if (this.active.length >= MAX_ACTIVE_DROPS) {
      const oldest = this.active.shift();
      oldest?.forceCollect();
    }

    const drop = new ResourceDrop(scene, x, y, resourceType, amount, this);
    this.active.push(drop);
  }

  remove(drop: ResourceDrop): void {
    const idx = this.active.indexOf(drop);
    if (idx !== -1) this.active.splice(idx, 1);
  }
}
