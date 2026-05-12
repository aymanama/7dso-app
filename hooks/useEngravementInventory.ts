'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useEngravementInventory(userId: string | null, initial: Record<string, boolean> = {}) {
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (engravementId: string) => {
    const next = !owned[engravementId];
    setOwned(prev => ({ ...prev, [engravementId]: next }));
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_engravements').upsert(
      { user_id: userId, engravement_id: engravementId, owned: next },
      { onConflict: 'user_id,engravement_id' }
    );
  }, [userId, owned]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
