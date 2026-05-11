import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resolveAllBuilds } from '@/lib/engine/buildEngine';
import type { Boss, BuildSlot, Accessory, Character, FarmEntry } from '@/types/game';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  const supabase = createServerClient();

  const [
    { data: allBosses },
    { data: allBuildSlots },
    { data: allAccessories },
    { data: allCharacters },
    { data: inventory },
  ] = await Promise.all([
    supabase.from('bosses').select('*'),
    supabase.from('builds').select('*').order('team_index').order('slot_index'),
    supabase.from('accessories').select('*'),
    supabase.from('characters').select('*'),
    userId
      ? supabase.from('user_inventory').select('accessory_id').eq('user_id', userId).eq('owned', true)
      : Promise.resolve({ data: [] }),
  ]);

  const accessories = new Map((allAccessories ?? []).map((a: Accessory) => [a.id, a]));
  const characters  = new Map((allCharacters  ?? []).map((c: Character)  => [c.id, c]));
  const bossMap     = new Map((allBosses      ?? []).map((b: Boss)       => [b.id, b]));
  const ownedIds    = new Set((inventory      ?? []).map((r: { accessory_id: string }) => r.accessory_id));

  // impactMap: bisItem.id → { item, bossIds that need it }
  const impactMap = new Map<string, { item: Accessory; bossIds: Set<string> }>();

  for (const boss of (allBosses ?? []) as Boss[]) {
    // Use only the recommended team (team_index 0) for each boss
    const bossSlots = ((allBuildSlots ?? []) as BuildSlot[])
      .filter(s => s.boss_id === boss.id && (s.team_index ?? 0) === 0);
    if (!bossSlots.length) continue;

    const builds = resolveAllBuilds({
      boss,
      buildSlots: bossSlots,
      characters,
      accessories,
      ownedIds,
      ownedCharacterIds: new Set(),
      bosses: bossMap,
    });

    const mainBuild = builds[0];
    if (!mainBuild) continue;

    for (const slot of mainBuild.slots) {
      for (const gear of [slot.ring, slot.necklace, slot.earring]) {
        if (gear.isBis) continue; // user owns BiS here — nothing to farm
        const bisId = gear.bisItem.id;
        if (!impactMap.has(bisId)) {
          impactMap.set(bisId, { item: gear.bisItem, bossIds: new Set() });
        }
        impactMap.get(bisId)!.bossIds.add(boss.id);
      }
    }
  }

  const entries: FarmEntry[] = [];
  for (const [, { item, bossIds }] of impactMap) {
    const affectedBossCount = bossIds.size;
    const dropBossId = item.drop_sources?.[0];
    const dropBoss   = dropBossId ? (bossMap.get(dropBossId)?.short_name ?? null) : null;
    entries.push({ item, dropBoss, impactScore: affectedBossCount, affectedBossCount });
  }

  entries.sort((a, b) => b.impactScore - a.impactScore);
  return NextResponse.json(entries.slice(0, 20));
}
