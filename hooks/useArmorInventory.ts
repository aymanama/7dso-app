'use client';
import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useArmorInventory(
  userId: string | null,
  initial: Record<string, boolean> = {}
) {
  const ownedRef = useRef(initial);
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (armorId: string) => {
    const next = !ownedRef.current[armorId];
    const newState = { ...ownedRef.current, [armorId]: next };
    ownedRef.current = newState;
    setOwned(newState);
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_armor').upsert(
      { user_id: userId, armor_id: armorId, owned: next },
      { onConflict: 'user_id,armor_id' }
    );
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    ownedRef.current = map;
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
