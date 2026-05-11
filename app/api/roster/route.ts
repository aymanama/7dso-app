import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return NextResponse.json({});

  const supabase = createServerClient();
  const { data } = await supabase
    .from('user_characters')
    .select('character_id,owned')
    .eq('user_id', userId);

  const result: Record<string, boolean> = {};
  for (const row of data ?? []) result[row.character_id] = row.owned;
  return NextResponse.json(result);
}

async function upsertCharacter(req: Request) {
  const { userId, characterId, owned } = await req.json();
  if (!userId || !characterId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const supabase = createServerClient();
  await supabase.from('user_characters').upsert(
    { user_id: userId, character_id: characterId, owned },
    { onConflict: 'user_id,character_id' }
  );
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) { return upsertCharacter(req); }
export async function PATCH(req: Request) { return upsertCharacter(req); }
