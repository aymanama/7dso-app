import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('bosses')
    .select('*')
    .order('threat', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
