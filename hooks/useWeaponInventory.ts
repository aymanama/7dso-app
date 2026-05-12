'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useWeaponInventory(
  userId: string | null,
  initial: Record<string, boolean> = {}
) {
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (weaponId: string) => {
    let next = false;
    setOwned(prev => {
      next = !prev[weaponId];
      return { ...prev, [weaponId]: next };
    });
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_weapons').upsert(
      { user_id: userId, weapon_id: weaponId, owned: next },
      { onConflict: 'user_id,weapon_id' }
    );
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
