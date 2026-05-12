'use client';
import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useInventory(userId: string | null, initial: Record<string, boolean> = {}) {
  const ownedRef = useRef(initial);
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (accessoryId: string) => {
    const next = !ownedRef.current[accessoryId];
    const newState = { ...ownedRef.current, [accessoryId]: next };
    ownedRef.current = newState;
    setOwned(newState);
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_inventory').upsert(
      { user_id: userId, accessory_id: accessoryId, owned: next },
      { onConflict: 'user_id,accessory_id' }
    );
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    ownedRef.current = map;
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
