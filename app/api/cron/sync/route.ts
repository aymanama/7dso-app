import '@/lib/polyfills/nodeFile';
import { NextResponse } from 'next/server';
import { scrapeAllBosses, scrapeAllCharacters } from '@/lib/scraper/zeroluckScraper';
import { syncBossesToDB, syncCharactersToDB } from '@/lib/scraper/syncToDB';

export const maxDuration = 300; // 5 min — Vercel Pro max
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  const report = {
    bossesUpdated: 0,
    accessorySourcesUpdated: 0,
    charactersUpdated: 0,
    errors: [] as string[],
    durationMs: 0,
  };

  try {
    // Scrape and sync bosses + accessory drop sources
    const bosses = await scrapeAllBosses();
    const bossSync = await syncBossesToDB(bosses);
    report.bossesUpdated = bossSync.bossesUpdated;
    report.accessorySourcesUpdated = bossSync.accessorySourcesUpdated;
    report.errors.push(...bossSync.errors);
  } catch (err) {
    report.errors.push(`boss scrape failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    // Scrape and sync character data (tier, elements, roles, race, weapons)
    const characters = await scrapeAllCharacters();
    const charSync = await syncCharactersToDB(characters);
    report.charactersUpdated = charSync.charactersUpdated;
    report.errors.push(...charSync.errors);
  } catch (err) {
    report.errors.push(`character scrape failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  report.durationMs = Date.now() - started;

  const status = report.errors.length === 0 ? 200 : 207;
  return NextResponse.json(report, { status });
}
