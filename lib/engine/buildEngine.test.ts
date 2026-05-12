import { describe, it, expect } from 'vitest';
import { resolveBuild, applyMyGearMode } from './buildEngine';
import type { Boss, BuildSlot, Accessory, Character } from '@/types/game';

// ─── shared fixtures ──────────────────────────────────────────────────────────

const boss: Boss = {
  id: 'galland', name: 'Galland', short_name: 'Galland', portrait_url: null,
  element_id: 'dark', weakness_elements: ['holy'], threat: 95, kind: 'Dungeon',
  tags: [], blurb: '', bis_set_ids: ['voidedge'], difficulties: ['Nightmare', 'Hell', 'Abyss'],
  content_order: 1, mechanics: [], min_gear_score: 50,
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
// NOT in any priority list — used for full-scan tests
const offListRing: Accessory = {
  id: 'offListRing', name: 'Off-List Dark Ring', tier: 'SR',
  slot: 'ring', set_id: null, stat_tags: ['dark_dmg', 'crit_dmg'], drop_sources: [], sort_order: 3,
};
// Off-list ring with zero matching tags
const noMatchRing: Accessory = {
  id: 'noMatchRing', name: 'No Match Ring', tier: 'SR',
  slot: 'ring', set_id: null, stat_tags: ['shield', 'support_amp'], drop_sources: [], sort_order: 4,
};

const character: Character = {
  id: 'escanor', name: 'Escanor', tier: 'SSR', primary_element: 'fire', elements: ['fire'],
  primary_role: 'attacker', roles: ['attacker'], race: 'Human',
  weapons: ['Axe'], tier_rank: 'S', blurb: '', portrait_url: null,
  pve_rank: 'S', pvp_rank: 'A', boss_rank: 'S',
  skills: null, recommended_weapon_id: null, f2p_friendly: false,
};

const slot: BuildSlot = {
  boss_id: 'galland', slot_index: 0, character_id: 'escanor',
  team_index: 0, team_name: 'Team A',
  ring_priority:     ['watcherRing', 'darkAlt', 'lifeRing'],
  necklace_priority: ['watcherRing'],
  earring_priority:  ['watcherRing'],
};

const baseAccessories = new Map<string, Accessory>([
  ['watcherRing', bisRing],
  ['darkAlt',     altRing],
  ['lifeRing',    wrongRing],
]);

const characters = new Map<string, Character>([['escanor', character]]);

function makeInput(ownedIds: string[], accessories = baseAccessories) {
  return { boss, buildSlots: [slot], characters, accessories, ownedIds: new Set(ownedIds) };
}

// ─── existing tests (unchanged) ───────────────────────────────────────────────

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

  // ─── new tests: full-scan fallback behavior ─────────────────────────────────

  it('full scan picks owned ring NOT in priority list when it shares stat_tag with BiS', () => {
    const accessories = new Map([...baseAccessories, ['offListRing', offListRing]]);
    // Priority list only has BiS (watcherRing); user doesn't own it
    const shortSlot: BuildSlot = { ...slot, ring_priority: ['watcherRing'] };
    const result = resolveBuild({
      boss, buildSlots: [shortSlot], characters, accessories,
      ownedIds: new Set(['offListRing']),
    });
    const ring = result.slots[0].ring;
    expect(ring.isOwned).toBe(true);
    expect(ring.item.id).toBe('offListRing');
    expect(ring.matchedStatTag).toBe('dark_dmg');
    expect(ring.isBis).toBe(false);
  });

  it('full scan rejects owned ring with zero overlapping stat_tags', () => {
    const accessories = new Map([...baseAccessories, ['noMatchRing', noMatchRing]]);
    const shortSlot: BuildSlot = { ...slot, ring_priority: ['watcherRing'] };
    const result = resolveBuild({
      boss, buildSlots: [shortSlot], characters, accessories,
      ownedIds: new Set(['noMatchRing']),
    });
    const ring = result.slots[0].ring;
    // noMatchRing has shield/support_amp — zero overlap with dark_dmg → must not appear
    expect(ring.isOwned).toBe(false);
    expect(ring.item.id).toBe('watcherRing');
  });

  it('allOwnedMatchCount > 0 when the full scan finds owned matching accessories outside the priority list', () => {
    const accessories = new Map([...baseAccessories, ['offListRing', offListRing]]);
    const shortSlot: BuildSlot = { ...slot, ring_priority: ['watcherRing'] };
    const result = resolveBuild({
      boss, buildSlots: [shortSlot], characters, accessories,
      ownedIds: new Set(['offListRing']),
    });
    expect(result.slots[0].ring.allOwnedMatchCount).toBeGreaterThan(0);
  });

  it('isMetapick is true when character.boss_rank is S', () => {
    const sRankChar: Character = { ...character, boss_rank: 'S' };
    const chars = new Map<string, Character>([['escanor', sRankChar]]);
    const result = resolveBuild({ ...makeInput(['watcherRing']), characters: chars });
    expect(result.slots[0].isMetapick).toBe(true);
  });

  it('isMetapick is false when character.boss_rank is A', () => {
    const aRankChar: Character = { ...character, boss_rank: 'A' };
    const chars = new Map<string, Character>([['escanor', aRankChar]]);
    const result = resolveBuild({ ...makeInput(['watcherRing']), characters: chars });
    expect(result.slots[0].isMetapick).toBe(false);
  });

  it('isMetapick is false when character.boss_rank is null', () => {
    const noRankChar: Character = { ...character, boss_rank: null };
    const chars = new Map<string, Character>([['escanor', noRankChar]]);
    const result = resolveBuild({ ...makeInput(['watcherRing']), characters: chars });
    expect(result.slots[0].isMetapick).toBe(false);
  });
});

describe('applyMyGearMode', () => {
  it('does not touch owned gear', () => {
    const build = resolveBuild(makeInput(['watcherRing']));
    const result = applyMyGearMode(build);
    // watcherRing is owned + BiS — should remain unchanged
    expect(result.slots[0].ring.isBis).toBe(true);
    expect(result.slots[0].ring.isOwned).toBe(true);
  });

  it('sets isBis:true on unowned slots', () => {
    const build = resolveBuild(makeInput([]));
    const result = applyMyGearMode(build);
    expect(result.slots[0].ring.isBis).toBe(true);
    expect(result.slots[0].necklace.isBis).toBe(true);
    expect(result.slots[0].earring.isBis).toBe(true);
  });

  it('recomputes bisCount and verdict after neutralising unowned slots', () => {
    // User owns nothing → original verdict is high_risk, bisCount = 0
    const build = resolveBuild(makeInput([]));
    expect(build.verdict).toBe('high_risk');
    expect(build.bisCount).toBe(0);

    const result = applyMyGearMode(build);
    // After applyMyGearMode, all 3 slots count as BiS → perfect
    expect(result.bisCount).toBe(3);
    expect(result.verdict).toBe('perfect');
  });
});
