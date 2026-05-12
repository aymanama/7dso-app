// scripts/patch-boss-knowledge.ts
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

// Polyfill WebSocket for Node 18 (no native WebSocket)
if (typeof globalThis.WebSocket === 'undefined') {
  const req = createRequire(import.meta.url);
  const wsPaths = [
    join(process.cwd(), 'node_modules/.pnpm/ws@8.20.0/node_modules/ws/index.js'),
    join(process.cwd(), 'node_modules/ws/index.js'),
  ];
  for (const p of wsPaths) {
    if (existsSync(p)) {
      const wsModule = req(p);
      (globalThis as any).WebSocket = wsModule.WebSocket ?? wsModule;
      break;
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { bosses } = JSON.parse(readFileSync(join(process.cwd(), 'scripts/data/boss-knowledge.json'), 'utf-8'));

async function main() {
  console.log('Patching boss knowledge…\n');
  for (const boss of bosses) {
    const { error } = await supabase
      .from('bosses')
      .update({
        content_order:  boss.content_order,
        mechanics:      boss.mechanics,
        min_gear_score: boss.min_gear_score,
        difficulties:   boss.difficulties,
      })
      .eq('id', boss.id);
    if (error) {
      console.error(`  FAILED ${boss.id}: ${error.message}`);
    } else {
      console.log(`  ✓ ${boss.id}  #${boss.content_order}  min:${boss.min_gear_score}%  ${boss.difficulties.join('/')}`);
    }
  }
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
