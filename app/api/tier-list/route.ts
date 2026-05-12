import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { Character } from '@/types/game';

export const revalidate = 3600;

type Rank = 'S' | 'A' | 'B' | 'C';
type TierGroup = Record<Rank, Character[]>;

function emptyGroup(): TierGroup {
  return { S: [], A: [], B: [], C: [] };
}

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const characters = (data ?? []) as Character[];

  const pve  = emptyGroup();
  const boss = emptyGroup();
  const pvp  = emptyGroup();

  for (const c of characters) {
    if (c.pve_rank  && c.pve_rank  in pve)  pve[c.pve_rank].push(c);
    if (c.boss_rank && c.boss_rank in boss) boss[c.boss_rank].push(c);
    if (c.pvp_rank  && c.pvp_rank  in pvp)  pvp[c.pvp_rank].push(c);
  }

  return NextResponse.json({ pve, boss, pvp });
}
