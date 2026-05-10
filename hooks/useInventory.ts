'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useInventory(userId: string | null, initial: Record<string, boolean> = {}) {
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (accessoryId: string) => {
    const next = !owned[accessoryId];
    setOwned(prev => ({ ...prev, [accessoryId]: next }));
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_inventory').upsert(
      { user_id: userId, accessory_id: accessoryId, owned: next },
      { onConflict: 'user_id,accessory_id' }
    );
  }, [userId, owned]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
