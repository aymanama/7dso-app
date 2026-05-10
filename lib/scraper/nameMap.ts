// Maps ZeroLuck.GG item display names → our DB accessory IDs
// Also maps boss page slugs → our DB boss IDs
// and element strings → our ElementId values

export const ITEM_NAME_MAP: Record<string, string> = {
  // Rings
  "Arachne's Melody Ring":        'arachneRing',
  "Corrupted Watcher's Ring":     'watcherRing',
  "Crimson Flame Oath Ring":      'crimsonRing',
  "Cursed Pulse Ring":            'cursedRing',
  "Life Crystal Ring":            'lifeRing',
  "Twisted Thought Ring":         'twistedRing',
  "Mad Miner Ring":               'madRing',
  "Gentle Breeze Ring":           'breezeRing',
  "Noble Hero's Ring":            'nobleRing',
  "Scorching Gust Ring":          'gustRing',
  // Necklaces
  "Arachne's Melody Necklace":    'arachneNeck',
  "Corrupted Watcher's Necklace": 'watcherNeck',
  "Cursed Pulse Necklace":        'cursedNeck',
  "Life Crystal Necklace":        'lifeNeck',
  "Shadowstorm Necklace":         'shadowNeck',
  "Twisted Thought Necklace":     'twistedNeck',
  "Mad Miner Necklace":           'madNeck',
  "Gentle Breeze Necklace":       'breezeNeck',
  "Noble Hero's Necklace":        'nobleNeck',
  "Scorching Gust Necklace":      'gustNeck',
  // Earrings
  "Arachne's Melody Earrings":    'arachneEar',
  "Corrupted Watcher's Earrings": 'watcherEar',
  "Cursed Pulse Earrings":        'cursedEar',
  "Dark Chaos Earrings":          'darkEar',
  "Life Crystal Earrings":        'lifeEar',
  "Twisted Thought Earrings":     'twistedEar',
  "Mad Miner Earrings":           'madEar',
  "Gentle Breeze Earrings":       'breezeEar',
  "Noble Hero's Earrings":        'nobleEar',
  "Scorching Gust Earrings":      'gustEar',
};

// ZeroLuck boss page slug → our DB boss ID
export const BOSS_SLUG_MAP: Record<string, string> = {
  'galland-of-truth':            'galland',
  'corrupted-ancient-dragon':    'ancient',
  'deep-spider-nest':            'spiderNest',
  'draco-king-drake':            'drake',
  'corrupted-guardian-golem':    'golem',
  'albion-mutant':               'albion',
  'corrupted-warden-orgot':      'orgot',
  'the-capital-of-the-dead':     'capital',
  'ferzen-mines':                'ferzen',
  'banakro':                     'banakro',
  'molbog-the-poisonous-toad':   'molbog',
  'red-demon':                   'redDemon',
  'scorpy-beast':                'scorpy',
  'holy-knight-marmas':          'marmas',
  'gray-demon':                  'grayDemon',
};

// Normalizes element strings from the page → our ElementId
function parseElement(raw: string): string | null {
  const map: Record<string, string> = {
    fire: 'fire', ice: 'ice', wind: 'wind',
    thunder: 'thunder', earth: 'earth', holy: 'holy',
    dark: 'dark', neutral: 'neutral', physical: 'neutral',
  };
  return map[raw.toLowerCase().trim()] ?? null;
}

// Extracts element name from ZeroLuck image filenames
// e.g. "common_Icon_Element_Fire.png" → "fire"
export function elementFromImageSrc(src: string): string | null {
  const m = src.match(/Icon_Element_(\w+)/i);
  if (!m) return null;
  return parseElement(m[1]);
}
