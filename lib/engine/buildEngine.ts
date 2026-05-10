import type {
  Boss, BuildSlot, Accessory, Character,
  ResolvedGear, ResolvedCharacter, ResolvedBuild, Verdict,
} from '@/types/game';

export interface EngineInput {
  boss: Boss;
  buildSlots: BuildSlot[];
  characters: Map<string, Character>;
  accessories: Map<string, Accessory>;
  ownedIds: Set<string>;
}

function resolveGear(
  priority: string[],
  accessories: Map<string, Accessory>,
  ownedIds: Set<string>,
  boss: Boss,
): ResolvedGear {
  const bisId = priority[0];
  const bisItem = accessories.get(bisId)!;

  if (ownedIds.has(bisId)) {
    const isCounter = !!(bisItem.set_id && boss.bis_set_ids.includes(bisItem.set_id));
    return { item: bisItem, isBis: true, isOwned: true, matchedStatTag: null, bisItem, isCounter };
  }

  // Strict fallback — must share at least one stat_tag with BiS
  const bisTags = new Set(bisItem.stat_tags);
  for (const altId of priority.slice(1)) {
    if (!ownedIds.has(altId)) continue;
    const alt = accessories.get(altId);
    if (!alt) continue;
    const match = alt.stat_tags.find(t => bisTags.has(t));
    if (!match) continue;
    const isCounter = !!(alt.set_id && boss.bis_set_ids.includes(alt.set_id));
    return { item: alt, isBis: false, isOwned: true, matchedStatTag: match, bisItem, isCounter };
  }

  return { item: bisItem, isBis: false, isOwned: false, matchedStatTag: null, bisItem, isCounter: false };
}

function calcVerdict(bisCount: number, total: number): Verdict {
  const pct = bisCount / total;
  if (pct === 1)   return 'perfect';
  if (pct >= 0.75) return 'battle_ready';
  if (pct >= 0.50) return 'viable';
  return 'high_risk';
}

export function resolveBuild(input: EngineInput): ResolvedBuild {
  const { boss, buildSlots, characters, accessories, ownedIds } = input;
  let bisCount = 0;
  const totalSlots = buildSlots.length * 3;

  const slots: ResolvedCharacter[] = buildSlots.map(slot => {
    const character = characters.get(slot.character_id)!;
    const ring     = resolveGear(slot.ring_priority,     accessories, ownedIds, boss);
    const necklace = resolveGear(slot.necklace_priority, accessories, ownedIds, boss);
    const earring  = resolveGear(slot.earring_priority,  accessories, ownedIds, boss);

    if (ring.isBis)     bisCount++;
    if (necklace.isBis) bisCount++;
    if (earring.isBis)  bisCount++;

    const subCount = [ring, necklace, earring].filter(g => !g.isBis && g.isOwned).length;
    const synergyScore = Math.max(0, 100 - subCount * 18);

    return { character, slotIndex: slot.slot_index, ring, necklace, earring, subCount, synergyScore };
  });

  return { bossId: boss.id, slots, bisCount, totalSlots, verdict: calcVerdict(bisCount, totalSlots) };
}
