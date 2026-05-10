import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resolveBuild } from '@/lib/engine/buildEngine';
import type { Boss, BuildSlot, Accessory, Character } from '@/types/game';

export async function GET(req: Request, { params }: { params: { bossId: string } }) {
  const { bossId } = params;
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  const supabase = createServerClient();

  const [
    { data: boss },
    { data: buildSlots },
    { data: allAccessories },
    { data: allCharacters },
    { data: inventory },
  ] = await Promise.all([
    supabase.from('bosses').select('*').eq('id', bossId).single(),
    supabase.from('builds').select('*').eq('boss_id', bossId).order('slot_index'),
    supabase.from('accessories').select('*'),
    supabase.from('characters').select('*'),
    userId
      ? supabase.from('user_inventory').select('accessory_id').eq('user_id', userId).eq('owned', true)
      : Promise.resolve({ data: [] }),
  ]);

  if (!boss || !buildSlots) {
    return NextResponse.json({ error: 'Boss not found' }, { status: 404 });
  }

  const accessories = new Map((allAccessories ?? []).map((a: Accessory) => [a.id, a]));
  const characters  = new Map((allCharacters  ?? []).map((c: Character)  => [c.id, c]));
  const ownedIds    = new Set(
    (inventory ?? []).map((r: { accessory_id: string }) => r.accessory_id)
  );

  const resolved = resolveBuild({
    boss: boss as Boss,
    buildSlots: buildSlots as BuildSlot[],
    characters,
    accessories,
    ownedIds,
  });

  return NextResponse.json(resolved);
}
