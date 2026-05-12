'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useEngravementInventory(userId: string | null, initial: Record<string, boolean> = {}) {
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (engravementId: string) => {
    let next = false;
    setOwned(prev => {
      next = !prev[engravementId];
      return { ...prev, [engravementId]: next };
    });
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_engravements').upsert(
      { user_id: userId, engravement_id: engravementId, owned: next },
      { onConflict: 'user_id,engravement_id' }
    );
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
