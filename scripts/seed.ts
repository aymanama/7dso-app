import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const dataPath = join(process.cwd(), 'scripts', 'data', 'seed-data.json');
const seed = JSON.parse(readFileSync(dataPath, 'utf-8'));

async function upsert(table: string, rows: object[]) {
  if (!rows.length) { console.log(`  Skipping ${table} (empty)`); return; }
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length} upserted`);
}

async function main() {
  console.log('Seeding 7DSO database…\n');

  console.log('Seeding bosses…');
  await upsert('bosses', seed.bosses);

  console.log('Seeding characters…');
  await upsert('characters', seed.characters);

  if (seed.accessories?.length) {
    console.log('Seeding accessories…');
    await upsert('accessories', seed.accessories);
  }

  if (seed.armor_pieces?.length) {
    console.log('Seeding armor_pieces…');
    await upsert('armor_pieces', seed.armor_pieces);
  }

  if (seed.weapons?.length) {
    console.log('Seeding weapons…');
    await upsert('weapons', seed.weapons);
  }

  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
