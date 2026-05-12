import * as cheerio from 'cheerio';
import { ITEM_NAME_MAP, BOSS_SLUG_MAP, elementFromImageSrc } from './nameMap';

const BASE = 'https://zeroluck.gg/7dso';
const FETCH_OPTS: RequestInit = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://zeroluck.gg/',
  },
  next: { revalidate: 0 },
};

async function fetchHtml(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, FETCH_OPTS);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.text();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrapedBoss {
  slug: string;
  bossId: string;
  weaknessElements: string[];
  accessoryDrops: string[]; // DB accessory IDs this boss drops
}

export interface ScrapedCharacter {
  slug: string;
  name: string;
  tier: 'SSR' | 'SR';
  elements: string[];
  roles: string[];
  race: string;
  weapons: string[];
  portraitUrl: string | null;
}

// ─── Boss scraper ─────────────────────────────────────────────────────────────

async function scrapeBossPage(slug: string): Promise<ScrapedBoss | null> {
  const bossId = BOSS_SLUG_MAP[slug];
  if (!bossId) return null;

  let html: string;
  try {
    html = await fetchHtml(`/bosses/${slug}/`);
  } catch {
    return null;
  }

  const $ = cheerio.load(html);

  // ── Weaknesses: look for elements paired with a "+" modifier ──────────────
  const weaknessElements: string[] = [];

  $('img[src*="Icon_Element"]').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    const element = elementFromImageSrc(src);
    if (!element) return;

    // Check sibling / parent text for +20% (weakness) vs -20% (resistance)
    const parent = $(el).parent();
    const text = parent.text().replace(/\s+/g, ' ').trim();
    if (text.includes('+') && !text.includes('-20')) {
      weaknessElements.push(element);
    }
  });

  // Deduplicate
  const uniqueWeaknesses = [...new Set(weaknessElements)];

  // ── Drop table: find linked item names that map to accessory IDs ──────────
  const accessoryDrops: string[] = [];

  $('a[href*="/7dso/items/"]').each((_, el) => {
    const name = $(el).text().trim();
    const id = ITEM_NAME_MAP[name];
    if (id && !accessoryDrops.includes(id)) accessoryDrops.push(id);
  });

  return { slug, bossId, weaknessElements: uniqueWeaknesses, accessoryDrops };
}

export async function scrapeAllBosses(): Promise<ScrapedBoss[]> {
  const html = await fetchHtml('/bosses/');
  const $ = cheerio.load(html);

  // Extract boss slugs from links like /7dso/bosses/[slug]/
  const slugs = new Set<string>();
  $('a[href*="/7dso/bosses/"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const m = href.match(/\/7dso\/bosses\/([^/]+)\//);
    if (m && m[1] && m[1] !== 'bosses') slugs.add(m[1]);
  });

  const results: ScrapedBoss[] = [];
  for (const slug of slugs) {
    try {
      const boss = await scrapeBossPage(slug);
      if (boss) results.push(boss);
      // Polite delay
      await new Promise(r => setTimeout(r, 400));
    } catch {
      // skip failed boss
    }
  }
  return results;
}

// ─── Character scraper ────────────────────────────────────────────────────────

async function scrapeCharacterPage(slug: string): Promise<ScrapedCharacter | null> {
  let html: string;
  try {
    html = await fetchHtml(`/characters/${slug}/`);
  } catch {
    return null;
  }

  const $ = cheerio.load(html);

  // Name from <title> or <h1>
  const name = $('h1').first().text().trim() || slug;

  // Rarity: look for "SSR" or "SR" text near the top, or from image filenames
  let tier: 'SSR' | 'SR' = 'SR';
  const rarityImg = $('img[src*="Grade_05"]');
  if (rarityImg.length) tier = 'SSR';
  else {
    const bodyText = $('body').text();
    if (/\bSSR\b/.test(bodyText)) tier = 'SSR';
  }

  // Elements: only collect element icons that are co-located with weapon type icons
  // (i.e. in the character header). Scanning the whole page picks up boss weakness
  // tables and skill effect icons, producing false multi-element results.
  const elements: string[] = [];
  $('img[src*="weapontype"]').each((_, weaponEl) => {
    // Walk up two levels to find the weapon+element row container
    const container = $(weaponEl).parent().parent();
    container.find('img[src*="Icon_Element"]').each((_, elemEl) => {
      const element = elementFromImageSrc($(elemEl).attr('src') ?? '');
      if (element && !elements.includes(element)) elements.push(element);
    });
  });
  // Fallback to neutral
  if (!elements.length) elements.push('neutral');

  // Roles: look for role keywords in text
  const roleKeywords = ['Attacker', 'Buster', 'Warden', 'Supporter'];
  const roles: string[] = [];
  const bodyText = $('body').text();
  for (const role of roleKeywords) {
    if (bodyText.includes(role) && !roles.includes(role.toLowerCase())) {
      roles.push(role.toLowerCase());
    }
  }
  if (!roles.length) roles.push('attacker');

  // Race: look for known races in text
  const raceKeywords = ['Human', 'Demon', 'Fairy', 'Giant', 'Unknown', 'Mixed'];
  let race = 'Unknown';
  for (const r of raceKeywords) {
    if (bodyText.includes(r)) { race = r; break; }
  }

  // Weapons: extract from weapon icon image filenames
  const weapons: string[] = [];
  $('img[src*="weapontype"]').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    const m = src.match(/weapontype_?(\w+)/i);
    if (m) {
      const w = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      if (!weapons.includes(w)) weapons.push(w);
    }
  });

  // Portrait: look for character portrait image
  const portraitSrc = $('img[src*="character"]').first().attr('src') ?? null;

  return {
    slug,
    name,
    tier,
    elements,
    roles,
    race,
    weapons,
    portraitUrl: portraitSrc,
  };
}

export async function scrapeAllCharacters(): Promise<ScrapedCharacter[]> {
  const html = await fetchHtml('/characters/');
  const $ = cheerio.load(html);

  const slugs = new Set<string>();
  $('a[href*="/7dso/characters/"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const m = href.match(/\/7dso\/characters\/([^/]+)\//);
    if (m && m[1] && m[1] !== 'characters') slugs.add(m[1]);
  });

  const results: ScrapedCharacter[] = [];
  for (const slug of slugs) {
    try {
      const char = await scrapeCharacterPage(slug);
      if (char) results.push(char);
      await new Promise(r => setTimeout(r, 300));
    } catch {
      // skip
    }
  }
  return results;
}
