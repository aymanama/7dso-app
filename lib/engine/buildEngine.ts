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

function resolveGear(
  priority: string[],
  accessories: Map<string, Accessory>,
  ownedIds: Set<string>,
  boss: Boss,
  bosses: Map<string, Boss>,
): ResolvedGear {
  const bisId = priority[0];
  const bisItem = accessories.get(bisId)!;

  if (ownedIds.has(bisId)) {
    const isCounter = !!(bisItem.set_id && boss.bis_set_ids.includes(bisItem.set_id));
    return { item: bisItem, isBis: true, isOwned: true, matchedStatTag: null, bisItem, isCounter, farmFromBoss: null };
  }

  const bisTags = new Set(bisItem.stat_tags);
  for (const altId of priority.slice(1)) {
    if (!ownedIds.has(altId)) continue;
    const alt = accessories.get(altId);
    if (!alt) continue;
    const match = alt.stat_tags.find(t => bisTags.has(t));
    if (!match) continue;
    const isCounter = !!(alt.set_id && boss.bis_set_ids.includes(alt.set_id));
    return { item: alt, isBis: false, isOwned: true, matchedStatTag: match, bisItem, isCounter, farmFromBoss: null };
  }

  return {
    item: bisItem,
    isBis: false,
    isOwned: false,
    matchedStatTag: null,
    bisItem,
    isCounter: false,
    farmFromBoss: farmFromBoss(bisItem, bosses),
  };
}

function calcVerdict(bisCount: number, total: number): Verdict {
  const pct = bisCount / total;
  if (pct === 1)   return 'perfect';
  if (pct >= 0.75) return 'battle_ready';
  if (pct >= 0.50) return 'viable';
  return 'high_risk';
}

// S-tier characters considered metapicks
const METAPICK_IDS = new Set(['escanor', 'meliodas', 'elaine', 'king', 'jericho', 'guila', 'diane', 'clotho']);

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
    const isMetapick = METAPICK_IDS.has(slot.character_id);

    return { character, slotIndex: slot.slot_index, ring, necklace, earring, subCount, synergyScore, isOwned, countersWeakness, isMetapick };
  });

  const ownedCharacterCount = hasRoster
    ? resolvedSlots.filter(s => s.isOwned).length
    : resolvedSlots.length;

  return {
    bossId: boss.id,
    teamIndex,
    teamName,
    slots: resolvedSlots,
    bisCount,
    totalSlots,
    verdict: calcVerdict(bisCount, totalSlots),
    ownedCharacterCount,
  };
}

export function resolveAllBuilds(input: EngineInput): ResolvedBuild[] {
  const { boss, buildSlots, characters, accessories, ownedIds, ownedCharacterIds, bosses } = input;

  // Group slots by team_index
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

  // Sort: most owned characters first
  teams.sort((a, b) => b.ownedCharacterCount - a.ownedCharacterCount);
  return teams;
}

// Keep for test backward compat
export function resolveBuild(input: Omit<EngineInput, 'ownedCharacterIds' | 'bosses'>): ResolvedBuild {
  const slotsWithTeam = input.buildSlots.map(s => ({ ...s, team_index: 0, team_name: 'Team A' }));
  return resolveAllBuilds({
    ...input,
    buildSlots: slotsWithTeam,
    ownedCharacterIds: new Set(),
    bosses: new Map(),
  })[0];
}
