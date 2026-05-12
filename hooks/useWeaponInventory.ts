'use client';
import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useWeaponInventory(
  userId: string | null,
  initial: Record<string, boolean> = {}
) {
  const ownedRef = useRef(initial);
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (weaponId: string) => {
    const next = !ownedRef.current[weaponId];
    const newState = { ...ownedRef.current, [weaponId]: next };
    ownedRef.current = newState;
    setOwned(newState);
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_weapons').upsert(
      { user_id: userId, weapon_id: weaponId, owned: next },
      { onConflict: 'user_id,weapon_id' }
    );
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    ownedRef.current = map;
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
