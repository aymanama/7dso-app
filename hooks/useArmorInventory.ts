'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useArmorInventory(
  userId: string | null,
  initial: Record<string, boolean> = {}
) {
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (armorId: string) => {
    const next = !owned[armorId];
    setOwned(prev => ({ ...prev, [armorId]: next }));
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_armor').upsert(
      { user_id: userId, armor_id: armorId, owned: next },
      { onConflict: 'user_id,armor_id' }
    );
  }, [userId, owned]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
