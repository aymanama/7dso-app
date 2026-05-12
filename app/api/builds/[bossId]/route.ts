import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resolveAllBuilds } from '@/lib/engine/buildEngine';
import type { Boss, BuildSlot, Accessory, Character } from '@/types/game';

export async function GET(req: Request, { params }: { params: { bossId: string } }) {
  const { bossId } = params;
  const url = new URL(req.url);
  const userId    = url.searchParams.get('userId');
  const difficulty = url.searchParams.get('difficulty');

  const adminSupabase  = createAdminClient();
  const serverSupabase = createServerClient();

  const [
    { data: boss },
    { data: allBuildSlots },
    { data: allAccessories },
    { data: allCharacters },
    { data: allBosses },
    { data: inventory },
    { data: roster },
  ] = await Promise.all([
    adminSupabase.from('bosses').select('*').eq('id', bossId).single(),
    adminSupabase.from('builds').select('*').eq('boss_id', bossId).order('team_index').order('slot_index'),
    adminSupabase.from('accessories').select('*'),
    adminSupabase.from('characters').select('*'),
    adminSupabase.from('bosses').select('*'),
    userId
      ? serverSupabase.from('user_inventory').select('accessory_id').eq('user_id', userId).eq('owned', true)
      : Promise.resolve({ data: [] }),
    userId
      ? serverSupabase.from('user_characters').select('character_id').eq('user_id', userId).eq('owned', true)
      : Promise.resolve({ data: [] }),
  ]);

  if (!boss || !allBuildSlots) {
    return NextResponse.json({ error: 'Boss not found' }, { status: 404 });
  }

  // Prefer difficulty-specific builds; fall back to 'all'
  const specific = difficulty
    ? allBuildSlots.filter((s: BuildSlot & { difficulty: string }) => s.difficulty === difficulty)
    : [];
  const buildSlots = specific.length > 0
    ? specific
    : allBuildSlots.filter((s: BuildSlot & { difficulty: string }) => s.difficulty === 'all');

  if (buildSlots.length === 0) {
    return NextResponse.json({ error: 'No builds available for this difficulty' }, { status: 404 });
  }

  const accessories       = new Map((allAccessories ?? []).map((a: Accessory) => [a.id, a]));
  const characters        = new Map((allCharacters ?? []).map((c: Character) => [c.id, c]));
  const bosses            = new Map((allBosses ?? []).map((b: Boss) => [b.id, b]));
  const ownedIds          = new Set((inventory ?? []).map((r: { accessory_id: string }) => r.accessory_id));
  const ownedCharacterIds = new Set((roster ?? []).map((r: { character_id: string }) => r.character_id));

  const builds = resolveAllBuilds({
    boss: boss as Boss,
    buildSlots: buildSlots as BuildSlot[],
    characters,
    accessories,
    ownedIds,
    ownedCharacterIds,
    bosses,
  });

  return NextResponse.json(builds);
}
