import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createAdminClient();

  const [
    { data: bosses },
    { data: builds },
    { data: accessories },
    { data: characters },
    { data: gearSets },
  ] = await Promise.all([
    supabase.from('bosses').select('id,name,short_name,element_id,weakness_elements,threat,kind,bis_set_ids').order('threat', { ascending: false }),
    supabase.from('builds').select('boss_id,team_index,team_name,slot_index,character_id,ring_priority,necklace_priority,earring_priority').order('team_index').order('slot_index'),
    supabase.from('accessories').select('id,name,set_id'),
    supabase.from('characters').select('id,name,primary_element,tier_rank,boss_rank'),
    supabase.from('gear_sets').select('id,short_name'),
  ]);

  if (!bosses || !builds || !accessories || !characters || !gearSets) {
    return NextResponse.json({ error: 'Failed to load guide data' }, { status: 500 });
  }

  const setNames = new Map(gearSets.map((s: { id: string; short_name: string }) => [s.id, s.short_name]));

  const accessoryLabel = new Map(
    accessories.map((a: { id: string; name: string; set_id: string | null }) => {
      if (a.set_id) return [a.id, setNames.get(a.set_id) ?? a.name];
      const short = a.name
        .replace(/\s*\(Finest\)/i, '')
        .replace(/\s*(Ring|Necklace|Earrings?)$/i, '')
        .trim();
      return [a.id, short];
    })
  );

  const charMap = new Map(characters.map((c: { id: string; name: string; primary_element: string; tier_rank: string; boss_rank: string | null }) => [c.id, c]));

  const buildsByBoss = new Map<string, typeof builds>();
  for (const b of builds) {
    if (!buildsByBoss.has(b.boss_id)) buildsByBoss.set(b.boss_id, []);
    buildsByBoss.get(b.boss_id)!.push(b);
  }

  const guide = bosses.map((boss: { id: string; name: string; short_name: string; element_id: string; weakness_elements: string[]; threat: number; kind: string; bis_set_ids: string[] }) => {
    const bossBuilds = buildsByBoss.get(boss.id) ?? [];

    const teamMap = new Map<number, typeof builds>();
    for (const slot of bossBuilds) {
      if (!teamMap.has(slot.team_index)) teamMap.set(slot.team_index, []);
      teamMap.get(slot.team_index)!.push(slot);
    }

    return {
      ...boss,
      teams: Array.from(teamMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([teamIndex, slots]) => ({
          teamIndex,
          teamName: slots[0]?.team_name ?? `Team ${teamIndex + 1}`,
          slots: [...slots]
            .sort((a, b) => a.slot_index - b.slot_index)
            .map((slot: { slot_index: number; character_id: string; ring_priority: string[]; necklace_priority: string[]; earring_priority: string[] }) => {
              const char = charMap.get(slot.character_id);
              return {
                slotIndex: slot.slot_index,
                characterName: char?.name ?? slot.character_id,
                characterElement: char?.primary_element ?? 'neutral',
                tierRank: char?.tier_rank ?? '?',
                bossRank: char?.boss_rank ?? null,
                ring: slot.ring_priority.map((id: string) => accessoryLabel.get(id) ?? id),
                necklace: slot.necklace_priority.map((id: string) => accessoryLabel.get(id) ?? id),
                earring: slot.earring_priority.map((id: string) => accessoryLabel.get(id) ?? id),
              };
            }),
        })),
    };
  });

  return NextResponse.json(guide);
}
