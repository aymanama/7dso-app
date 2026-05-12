import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resolveAllBuilds } from '@/lib/engine/buildEngine';
import type {
  Boss, BuildSlot, Accessory, Character,
  BossReadiness, PlannerCard, PlannerResult, Verdict,
} from '@/types/game';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  const admin  = createAdminClient();
  const server = createServerClient();

  const [
    { data: allBosses },
    { data: allBuildSlots },
    { data: allAccessories },
    { data: allCharacters },
    { data: inventory },
    { data: rosterRows },
  ] = await Promise.all([
    admin.from('bosses').select('*').order('content_order', { ascending: true }),
    admin.from('builds').select('*').eq('team_index', 0).order('slot_index'),
    admin.from('accessories').select('*'),
    admin.from('characters').select('*'),
    userId
      ? server.from('user_inventory').select('accessory_id').eq('user_id', userId).eq('owned', true)
      : Promise.resolve({ data: [] }),
    userId
      ? server.from('user_characters').select('character_id').eq('user_id', userId).eq('owned', true)
      : Promise.resolve({ data: [] }),
  ]);

  const accessories        = new Map((allAccessories  ?? []).map((a: Accessory)  => [a.id, a]));
  const characters         = new Map((allCharacters   ?? []).map((c: Character)  => [c.id, c]));
  const bossMap            = new Map((allBosses        ?? []).map((b: Boss)       => [b.id, b]));
  const ownedIds           = new Set((inventory       ?? []).map((r: { accessory_id: string }) => r.accessory_id));
  const ownedCharacterIds  = new Set((rosterRows      ?? []).map((r: { character_id: string }) => r.character_id));
  const hasRoster          = ownedCharacterIds.size > 0;

  // ── Per-boss readiness ───────────────────────────────────────────────────
  const readiness: BossReadiness[] = [];

  for (const boss of (allBosses ?? []) as Boss[]) {
    const bossSlots = ((allBuildSlots ?? []) as (BuildSlot & { difficulty: string })[])
      .filter(s => s.boss_id === boss.id);

    if (!bossSlots.length) continue;

    const ownedSlots   = hasRoster ? bossSlots.filter(s => ownedCharacterIds.has(s.character_id)).length : bossSlots.length;
    const totalSlots   = bossSlots.length;
    const canField     = !hasRoster || ownedSlots / totalSlots >= 0.5;

    let verdict: Verdict | 'no_roster' = 'no_roster';
    let bisCount = 0;
    const totalBisSlots = totalSlots * 3;

    if (canField) {
      const builds = resolveAllBuilds({
        boss: boss as Boss,
        buildSlots: bossSlots as BuildSlot[],
        characters,
        accessories,
        ownedIds,
        ownedCharacterIds,
        bosses: bossMap,
      });
      if (builds[0]) {
        bisCount = builds[0].bisCount;
        verdict  = builds[0].verdict;
      }
    }

    const ready = verdict === 'perfect' || verdict === 'battle_ready';

    readiness.push({
      bossId:        boss.id,
      bossName:      boss.name,
      elementId:     boss.element_id,
      contentOrder:  (boss as Boss & { content_order: number }).content_order ?? 99,
      verdict,
      ownedSlots,
      totalSlots,
      bisCount,
      totalBisSlots,
      minGearScore:  (boss as Boss & { min_gear_score: number }).min_gear_score ?? 0,
      ready,
    });
  }

  // ── Recommendation cards ─────────────────────────────────────────────────
  const cards: PlannerCard[] = [];

  // Card 1 — Boss to focus on
  const notReady = readiness
    .filter(r => r.verdict !== 'no_roster' && !r.ready)
    .sort((a, b) => a.contentOrder - b.contentOrder);

  const focusBoss = notReady[0] ?? readiness.sort((a, b) => {
    const pctA = a.totalBisSlots > 0 ? a.bisCount / a.totalBisSlots : 0;
    const pctB = b.totalBisSlots > 0 ? b.bisCount / b.totalBisSlots : 0;
    return pctA - pctB;
  })[0];

  if (focusBoss) {
    const bisPct = focusBoss.totalBisSlots > 0
      ? Math.round((focusBoss.bisCount / focusBoss.totalBisSlots) * 100)
      : 0;
    cards.push({
      kind:     'boss',
      title:    focusBoss.bossName,
      subtitle: 'Focus boss — run this until your verdict improves',
      detail:   `${bisPct}% BiS · ${focusBoss.ownedSlots}/${focusBoss.totalSlots} characters owned`,
      meta:     focusBoss.verdict === 'no_roster' ? 'no team' : focusBoss.verdict.replace('_', ' '),
      bossId:   focusBoss.bossId,
    });
  }

  // Card 2 — Priority gear to farm
  const impactMap = new Map<string, { item: Accessory; bossCount: number }>();
  for (const r of readiness) {
    if (r.ready) continue;
    const boss = bossMap.get(r.bossId);
    if (!boss) continue;
    const bossSlots = ((allBuildSlots ?? []) as (BuildSlot & { difficulty: string })[])
      .filter(s => s.boss_id === r.bossId);
    if (!bossSlots.length) continue;

    const builds = resolveAllBuilds({
      boss: boss as Boss,
      buildSlots: bossSlots as BuildSlot[],
      characters,
      accessories,
      ownedIds,
      ownedCharacterIds,
      bosses: bossMap,
    });

    for (const slot of (builds[0]?.slots ?? [])) {
      for (const gear of [slot.ring, slot.necklace, slot.earring]) {
        if (gear.isBis) continue;
        const bisId = gear.bisItem.id;
        const existing = impactMap.get(bisId);
        if (existing) {
          existing.bossCount++;
        } else {
          impactMap.set(bisId, { item: gear.bisItem, bossCount: 1 });
        }
      }
    }
  }

  const topGear = [...impactMap.values()].sort((a, b) => b.bossCount - a.bossCount)[0];
  if (topGear) {
    const dropBossId = topGear.item.drop_sources?.[0];
    const dropBoss   = dropBossId ? (bossMap.get(dropBossId)?.short_name ?? null) : null;
    cards.push({
      kind:     'gear',
      title:    topGear.item.name,
      subtitle: dropBoss ? `Farm: ${dropBoss}` : 'Check item source',
      detail:   `Improves ${topGear.bossCount} boss ${topGear.bossCount === 1 ? 'build' : 'builds'}`,
      meta:     topGear.item.slot,
      itemId:   topGear.item.id,
    });
  }

  // Card 3 — Priority character to obtain
  if (hasRoster) {
    const charCount = new Map<string, number>();
    for (const r of readiness) {
      if (r.ready) continue;
      const bossSlots = ((allBuildSlots ?? []) as (BuildSlot & { difficulty: string })[])
        .filter(s => s.boss_id === r.bossId);
      for (const s of bossSlots) {
        if (!ownedCharacterIds.has(s.character_id)) {
          charCount.set(s.character_id, (charCount.get(s.character_id) ?? 0) + 1);
        }
      }
    }

    const topCharEntry = [...charCount.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topCharEntry) {
      const char = characters.get(topCharEntry[0]);
      if (char) {
        cards.push({
          kind:        'character',
          title:       char.name,
          subtitle:    'Priority pull — appears in the most uncleared teams',
          detail:      `Needed in ${topCharEntry[1]} boss ${topCharEntry[1] === 1 ? 'build' : 'builds'} you can\'t clear`,
          meta:        char.tier_rank ?? char.tier,
          characterId: char.id,
        });
      }
    }
  }

  const result: PlannerResult = { cards, readiness };
  return NextResponse.json(result);
}
