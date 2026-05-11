import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('armor_pieces')
    .select('*')
    .order('set_name')
    .order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
