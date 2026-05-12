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
  ownedCharacterIds: Set<string>;
  bosses: Map<string, Boss>;
}

function farmFromBoss(bisItem: Accessory, bosses: Map<string, Boss>): string | null {
  if (!bisItem.drop_sources?.length) return null;
  const bossId = bisItem.drop_sources[0];
  return bosses.get(bossId)?.short_name ?? bossId;
}

// Count owned accessories outside the priority list that share stat_tags with BiS.
function countFullScanMatches(
  bisTags: Set<string>,
  slot: string,
  accessories: Map<string, Accessory>,
  ownedIds: Set<string>,
  prioritySet: Set<string>,
): number {
  let count = 0;
  for (const [, acc] of accessories) {
    if (prioritySet.has(acc.id)) continue;
    if (!ownedIds.has(acc.id)) continue;
    if (acc.slot !== slot) continue;
    if (acc.stat_tags.some(t => bisTags.has(t))) count++;
  }
  return count;
}

function resolveGear(
  priority: string[],
  accessories: Map<string, Accessory>,
  ownedIds: Set<string>,
  boss: Boss,
  bosses: Map<string, Boss>,
): ResolvedGear {
  const bisId = priority[0];
  const bisItem = accessories.get(bisId)!;
  const bisTags = new Set(bisItem.stat_tags);
  const prioritySet = new Set(priority);

  if (ownedIds.has(bisId)) {
    const isCounter = !!(bisItem.set_id && boss.bis_set_ids.includes(bisItem.set_id));
    return { item: bisItem, isBis: true, isOwned: true, matchedStatTag: null, bisItem, isCounter, farmFromBoss: null, allOwnedMatchCount: 0 };
  }

  // Pass 1: priority list in order
  for (const altId of priority.slice(1)) {
    if (!ownedIds.has(altId)) continue;
    const alt = accessories.get(altId);
    if (!alt) continue;
    const match = alt.stat_tags.find(t => bisTags.has(t));
    if (!match) continue;
    const isCounter = !!(alt.set_id && boss.bis_set_ids.includes(alt.set_id));
    const allOwnedMatchCount = countFullScanMatches(bisTags, bisItem.slot, accessories, ownedIds, prioritySet);
    return { item: alt, isBis: false, isOwned: true, matchedStatTag: match, bisItem, isCounter, farmFromBoss: null, allOwnedMatchCount };
  }

  // Pass 2: full scan — owned accessories not in priority list, same slot, matching tags.
  // Pick by most overlapping stat_tags (more = better fit).
  let bestAlt: { acc: Accessory; matchCount: number; matchTag: string } | null = null;
  let fullScanCount = 0;

  for (const [, acc] of accessories) {
    if (prioritySet.has(acc.id)) continue;
    if (!ownedIds.has(acc.id)) continue;
    if (acc.slot !== bisItem.slot) continue;
    const matchingTags = acc.stat_tags.filter(t => bisTags.has(t));
    if (matchingTags.length === 0) continue;
    fullScanCount++;
    if (!bestAlt || matchingTags.length > bestAlt.matchCount) {
      bestAlt = { acc, matchCount: matchingTags.length, matchTag: matchingTags[0] };
    }
  }

  if (bestAlt) {
    const isCounter = !!(bestAlt.acc.set_id && boss.bis_set_ids.includes(bestAlt.acc.set_id));
    return {
      item: bestAlt.acc,
      isBis: false,
      isOwned: true,
      matchedStatTag: bestAlt.matchTag,
      bisItem,
      isCounter,
      farmFromBoss: null,
      allOwnedMatchCount: fullScanCount,
    };
  }

  return {
    item: bisItem,
    isBis: false,
    isOwned: false,
    matchedStatTag: null,
    bisItem,
    isCounter: false,
    farmFromBoss: farmFromBoss(bisItem, bosses),
    allOwnedMatchCount: 0,
  };
}

// Returns the set_id of a non-BiS set where the user owns 3+ pieces, or null.
function resolveAlternativeSet(
  accessories: Map<string, Accessory>,
  ownedIds: Set<string>,
  bisSetIds: string[],
): string | null {
  const setCounts = new Map<string, number>();

  for (const [, acc] of accessories) {
    if (!ownedIds.has(acc.id) || !acc.set_id) continue;
    if (bisSetIds.includes(acc.set_id)) continue;
    setCounts.set(acc.set_id, (setCounts.get(acc.set_id) ?? 0) + 1);
  }

  let bestSetId: string | null = null;
  let bestCount = 2; // need strictly more than 2 → i.e. ≥ 3

  for (const [setId, count] of setCounts) {
    if (count > bestCount) {
      bestCount = count;
      bestSetId = setId;
    }
  }

  return bestSetId;
}

export function calcVerdict(bisCount: number, total: number): Verdict {
  const pct = bisCount / total;
  if (pct === 1)   return 'perfect';
  if (pct >= 0.75) return 'battle_ready';
  if (pct >= 0.50) return 'viable';
  return 'high_risk';
}


function resolveTeam(
  boss: Boss,
  slots: BuildSlot[],
  teamIndex: number,
  teamName: string,
  characters: Map<string, Character>,
  accessories: Map<string, Accessory>,
  ownedIds: Set<string>,
  ownedCharacterIds: Set<string>,
  bosses: Map<string, Boss>,
): ResolvedBuild {
  let bisCount = 0;
  const totalSlots = slots.length * 3;
  const hasRoster = ownedCharacterIds.size > 0;

  const resolvedSlots: ResolvedCharacter[] = slots.map(slot => {
    const character = characters.get(slot.character_id)!;
    const ring     = resolveGear(slot.ring_priority,     accessories, ownedIds, boss, bosses);
    const necklace = resolveGear(slot.necklace_priority, accessories, ownedIds, boss, bosses);
    const earring  = resolveGear(slot.earring_priority,  accessories, ownedIds, boss, bosses);

    if (ring.isBis)     bisCount++;
    if (necklace.isBis) bisCount++;
    if (earring.isBis)  bisCount++;

    const subCount = [ring, necklace, earring].filter(g => !g.isBis && g.isOwned).length;
    const synergyScore = Math.max(0, 100 - subCount * 18);
    const isOwned = !hasRoster || ownedCharacterIds.has(slot.character_id);
    const countersWeakness = !!(character && boss.weakness_elements.includes(character.primary_element));
    const isMetapick = character?.boss_rank === 'S';

    return { character, slotIndex: slot.slot_index, ring, necklace, earring, subCount, synergyScore, isOwned, countersWeakness, isMetapick };
  });

  const ownedCharacterCount = hasRoster
    ? resolvedSlots.filter(s => s.isOwned).length
    : resolvedSlots.length;

  const alternativeSetName = resolveAlternativeSet(accessories, ownedIds, boss.bis_set_ids);

  return {
    bossId: boss.id,
    teamIndex,
    teamName,
    slots: resolvedSlots,
    bisCount,
    totalSlots,
    verdict: calcVerdict(bisCount, totalSlots),
    ownedCharacterCount,
    alternativeSetName,
  };
}

export function resolveAllBuilds(input: EngineInput): ResolvedBuild[] {
  const { boss, buildSlots, characters, accessories, ownedIds, ownedCharacterIds, bosses } = input;

  const teamMap = new Map<number, { name: string; slots: BuildSlot[] }>();
  for (const slot of buildSlots) {
    const ti = slot.team_index ?? 0;
    const tn = slot.team_name ?? 'Team A';
    if (!teamMap.has(ti)) teamMap.set(ti, { name: tn, slots: [] });
    teamMap.get(ti)!.slots.push(slot);
  }

  const teams: ResolvedBuild[] = [];
  for (const [ti, { name, slots }] of teamMap) {
    teams.push(resolveTeam(boss, slots, ti, name, characters, accessories, ownedIds, ownedCharacterIds, bosses));
  }

  teams.sort((a, b) => b.ownedCharacterCount - a.ownedCharacterCount);
  return teams;
}

export function applyMyGearMode(build: ResolvedBuild): ResolvedBuild {
  const neutralize = (gear: ResolvedGear): ResolvedGear =>
    gear.isOwned ? gear : { ...gear, isBis: true };

  const slots = build.slots.map(slot => ({
    ...slot,
    ring:     neutralize(slot.ring),
    necklace: neutralize(slot.necklace),
    earring:  neutralize(slot.earring),
  }));

  const bisCount = slots.reduce(
    (sum, slot) =>
      sum + [slot.ring, slot.necklace, slot.earring].filter(g => g.isBis).length,
    0,
  );

  return { ...build, slots, bisCount, verdict: calcVerdict(bisCount, build.totalSlots) };
}

// Backward-compat shim for tests
export function resolveBuild(input: Omit<EngineInput, 'ownedCharacterIds' | 'bosses'>): ResolvedBuild {
  const slotsWithTeam = input.buildSlots.map(s => ({ ...s, team_index: 0, team_name: 'Team A' }));
  return resolveAllBuilds({
    ...input,
    buildSlots: slotsWithTeam,
    ownedCharacterIds: new Set(),
    bosses: new Map(),
  })[0];
}
