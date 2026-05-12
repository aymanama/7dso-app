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
  try {
    const { userId, characterId, owned } = await req.json();
    if (!userId || !characterId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const supabase = createServerClient();
    const { error } = await supabase.from('user_characters').upsert(
      { user_id: userId, character_id: characterId, owned },
      { onConflict: 'user_id,character_id' }
    );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) { return upsertCharacter(req); }
export async function PATCH(req: Request) { return upsertCharacter(req); }
