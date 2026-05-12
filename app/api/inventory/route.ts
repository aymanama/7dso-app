import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return NextResponse.json({});

  const type = url.searchParams.get('type') ?? 'accessory';
  const supabase = createServerClient();
  const map: Record<string, boolean> = {};

  if (type === 'engravement') {
    const { data } = await supabase
      .from('user_engravements')
      .select('engravement_id, owned')
      .eq('user_id', userId);
    for (const row of data ?? []) map[row.engravement_id] = row.owned;
  } else if (type === 'armor') {
    const { data } = await supabase
      .from('user_armor')
      .select('armor_id, owned')
      .eq('user_id', userId);
    for (const row of data ?? []) map[row.armor_id] = row.owned;
  } else if (type === 'weapon') {
    const { data } = await supabase
      .from('user_weapons')
      .select('weapon_id, owned')
      .eq('user_id', userId);
    for (const row of data ?? []) map[row.weapon_id] = row.owned;
  } else {
    const { data } = await supabase
      .from('user_inventory')
      .select('accessory_id, owned')
      .eq('user_id', userId);
    for (const row of data ?? []) map[row.accessory_id] = row.owned;
  }

  return NextResponse.json(map);
}
