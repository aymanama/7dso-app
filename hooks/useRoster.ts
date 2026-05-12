'use client';
import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRoster(userId: string | null, initial: Record<string, boolean> = {}) {
  const ownedRef = useRef(initial);
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (characterId: string) => {
    const next = !ownedRef.current[characterId];
    const newState = { ...ownedRef.current, [characterId]: next };
    ownedRef.current = newState;
    setOwned(newState);
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_characters').upsert(
      { user_id: userId, character_id: characterId, owned: next },
      { onConflict: 'user_id,character_id' }
    );
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    ownedRef.current = map;
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
