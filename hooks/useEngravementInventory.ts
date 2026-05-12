'use client';
import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useEngravementInventory(userId: string | null, initial: Record<string, boolean> = {}) {
  const ownedRef = useRef(initial);
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (engravementId: string) => {
    const next = !ownedRef.current[engravementId];
    const newState = { ...ownedRef.current, [engravementId]: next };
    ownedRef.current = newState;
    setOwned(newState);
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_engravements').upsert(
      { user_id: userId, engravement_id: engravementId, owned: next },
      { onConflict: 'user_id,engravement_id' }
    );
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    ownedRef.current = map;
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
