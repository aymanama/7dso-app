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

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') ?? 'accessory';
    const { userId, itemId, owned } = await req.json();

    const supabase = createServerClient();

    if (type === 'armor') {
      const { error } = await supabase.from('user_armor').upsert(
        { user_id: userId, armor_id: itemId, owned },
        { onConflict: 'user_id,armor_id' }
      );
      if (error) throw error;
    } else if (type === 'weapon') {
      const { error } = await supabase.from('user_weapons').upsert(
        { user_id: userId, weapon_id: itemId, owned },
        { onConflict: 'user_id,weapon_id' }
      );
      if (error) throw error;
    } else if (type === 'engravement') {
      const { error } = await supabase.from('user_engravements').upsert(
        { user_id: userId, engravement_id: itemId, owned },
        { onConflict: 'user_id,engravement_id' }
      );
      if (error) throw error;
    } else {
      const { error } = await supabase.from('user_inventory').upsert(
        { user_id: userId, accessory_id: itemId, owned },
        { onConflict: 'user_id,accessory_id' }
      );
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
