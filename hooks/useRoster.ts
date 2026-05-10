'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRoster(userId: string | null, initial: Record<string, boolean> = {}) {
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (characterId: string) => {
    const next = !owned[characterId];
    setOwned(prev => ({ ...prev, [characterId]: next }));
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_characters').upsert(
      { user_id: userId, character_id: characterId, owned: next },
      { onConflict: 'user_id,character_id' }
    ).catch(() => {});
  }, [userId, owned]);

  const setMany = useCallback((map: Record<string, boolean>) => setOwned(map), []);

  return { owned, toggle, setMany };
}
