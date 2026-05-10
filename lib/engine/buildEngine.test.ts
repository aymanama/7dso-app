import { describe, it, expect } from 'vitest';
import { resolveBuild, type EngineInput } from './buildEngine';
import type { Boss, BuildSlot, Accessory, Character } from '@/types/game';

const boss: Boss = {
  id: 'galland', name: 'Galland', short_name: 'Galland', portrait_url: null,
  element_id: 'dark', weakness_elements: ['holy'], threat: 95, kind: 'Dungeon',
  tags: [], blurb: '', bis_set_ids: ['voidedge'],
};

const bisRing: Accessory = {
  id: 'watcherRing', name: "Corrupted Watcher's Ring", tier: 'SSR',
  slot: 'ring', set_id: 'voidedge', stat_tags: ['dark_dmg'], drop_sources: [], sort_order: 0,
};
const altRing: Accessory = {
  id: 'darkAlt', name: 'Dark Alt Ring', tier: 'SSR',
  slot: 'ring', set_id: null, stat_tags: ['dark_dmg'], drop_sources: [], sort_order: 1,
};
const wrongRing: Accessory = {
  id: 'lifeRing', name: 'Life Crystal Ring', tier: 'SSR',
  slot: 'ring', set_id: 'cries', stat_tags: ['hp_recovery'], drop_sources: [], sort_order: 2,
};

const character: Character = {
  id: 'escanor', name: 'Escanor', tier: 'SSR', primary_element: 'fire', elements: ['fire'],
  primary_role: 'attacker', roles: ['attacker'], race: 'Human',
  weapons: ['Axe'], tier_rank: 'S', blurb: '', portrait_url: null,
};

const slot: BuildSlot = {
  boss_id: 'galland', slot_index: 0, character_id: 'escanor',
  ring_priority:     ['watcherRing', 'darkAlt', 'lifeRing'],
  necklace_priority: ['watcherRing'],
  earring_priority:  ['watcherRing'],
};

const accessories = new Map<string, Accessory>([
  ['watcherRing', bisRing],
  ['darkAlt',     altRing],
  ['lifeRing',    wrongRing],
]);

const characters = new Map<string, Character>([['escanor', character]]);

function makeInput(ownedIds: string[]): EngineInput {
  return { boss, buildSlots: [slot], characters, accessories, ownedIds: new Set(ownedIds) };
}

describe('resolveBuild', () => {
  it('returns BiS when user owns it', () => {
    const result = resolveBuild(makeInput(['watcherRing']));
    expect(result.slots[0].ring.isBis).toBe(true);
    expect(result.slots[0].ring.item.id).toBe('watcherRing');
    expect(result.bisCount).toBe(3);
  });

  it('returns highest-priority owned alt with matching stat_tag', () => {
    const result = resolveBuild(makeInput(['darkAlt']));
    const ring = result.slots[0].ring;
    expect(ring.isBis).toBe(false);
    expect(ring.isOwned).toBe(true);
    expect(ring.item.id).toBe('darkAlt');
    expect(ring.matchedStatTag).toBe('dark_dmg');
  });

  it('NEVER returns alt with no overlapping stat_tags (strict rule)', () => {
    const result = resolveBuild(makeInput(['lifeRing']));
    const ring = result.slots[0].ring;
    expect(ring.isOwned).toBe(false);
    expect(ring.item.id).toBe('watcherRing');
  });

  it('returns isOwned:false when nothing matches', () => {
    const result = resolveBuild(makeInput([]));
    expect(result.slots[0].ring.isOwned).toBe(false);
    expect(result.slots[0].ring.isBis).toBe(false);
  });

  it('verdict is perfect when all BiS owned', () => {
    const result = resolveBuild(makeInput(['watcherRing']));
    expect(result.verdict).toBe('perfect');
  });

  it('verdict is high_risk when nothing owned', () => {
    const result = resolveBuild(makeInput([]));
    expect(result.verdict).toBe('high_risk');
  });

  it('counter hint when chosen item set_id is in boss.bis_set_ids', () => {
    const result = resolveBuild(makeInput(['watcherRing']));
    expect(result.slots[0].ring.isCounter).toBe(true);
  });
});
