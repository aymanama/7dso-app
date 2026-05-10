import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return NextResponse.json({});

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('user_inventory')
    .select('accessory_id, owned')
    .eq('user_id', userId);

  if (error) return NextResponse.json({});

  const map: Record<string, boolean> = {};
  for (const row of data ?? []) {
    map[row.accessory_id] = row.owned;
  }
  return NextResponse.json(map);
}
