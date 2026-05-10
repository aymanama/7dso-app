import { createClient } from '@supabase/supabase-js';
import type { ScrapedBoss, ScrapedCharacter } from './zeroluckScraper';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface SyncReport {
  bossesUpdated: number;
  accessorySourcesUpdated: number;
  charactersUpdated: number;
  errors: string[];
}

export async function syncBossesToDB(bosses: ScrapedBoss[]): Promise<Pick<SyncReport, 'bossesUpdated' | 'accessorySourcesUpdated' | 'errors'>> {
  const supabase = getServiceClient();
  const errors: string[] = [];
  let bossesUpdated = 0;
  let accessorySourcesUpdated = 0;

  // Build a map: accessory ID → set of boss IDs that drop it
  const accessoryBossMap = new Map<string, Set<string>>();

  for (const boss of bosses) {
    // Update weakness_elements in bosses table
    if (boss.weaknessElements.length > 0) {
      const { error } = await supabase
        .from('bosses')
        .update({ weakness_elements: boss.weaknessElements, updated_at: new Date().toISOString() })
        .eq('id', boss.bossId);

      if (error) {
        errors.push(`boss ${boss.bossId}: ${error.message}`);
      } else {
        bossesUpdated++;
      }
    }

    // Collect drop sources per accessory
    for (const accId of boss.accessoryDrops) {
      if (!accessoryBossMap.has(accId)) {
        accessoryBossMap.set(accId, new Set());
      }
      accessoryBossMap.get(accId)!.add(boss.bossId);
    }
  }

  // Update drop_sources on accessories
  for (const [accId, bossIds] of accessoryBossMap) {
    const { error } = await supabase
      .from('accessories')
      .update({ drop_sources: [...bossIds] })
      .eq('id', accId);

    if (error) {
      errors.push(`accessory ${accId}: ${error.message}`);
    } else {
      accessorySourcesUpdated++;
    }
  }

  return { bossesUpdated, accessorySourcesUpdated, errors };
}

export async function syncCharactersToDB(characters: ScrapedCharacter[]): Promise<Pick<SyncReport, 'charactersUpdated' | 'errors'>> {
  const supabase = getServiceClient();
  const errors: string[] = [];
  let charactersUpdated = 0;

  // Get existing character IDs so we only update known ones (don't insert new ones without review)
  const { data: existingChars } = await supabase
    .from('characters')
    .select('id, name');

  const nameToId = new Map<string, string>();
  for (const c of existingChars ?? []) {
    nameToId.set(c.name.toLowerCase(), c.id);
  }

  for (const char of characters) {
    const charId = nameToId.get(char.name.toLowerCase());
    if (!charId) continue; // Skip new characters not yet in DB

    const primaryElement = char.elements[0] ?? 'neutral';
    const primaryRole = char.roles[0] ?? 'attacker';

    const { error } = await supabase
      .from('characters')
      .update({
        tier: char.tier,
        primary_element: primaryElement,
        elements: char.elements,
        primary_role: primaryRole,
        roles: char.roles,
        race: char.race,
        weapons: char.weapons.length ? char.weapons : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', charId);

    if (error) {
      errors.push(`character ${charId}: ${error.message}`);
    } else {
      charactersUpdated++;
    }
  }

  return { charactersUpdated, errors };
}
