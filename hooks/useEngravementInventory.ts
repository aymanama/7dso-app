'use client';
import { useState, useCallback, useRef } from 'react';

export function useEngravementInventory(userId: string | null, initial: Record<string, boolean> = {}) {
  const ownedRef = useRef(initial);
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (engravementId: string) => {
    const next = !ownedRef.current[engravementId];
    const newState = { ...ownedRef.current, [engravementId]: next };
    ownedRef.current = newState;
    setOwned(newState);
    if (!userId) return;
    await fetch('/api/inventory?type=engravement', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId: engravementId, owned: next }),
    });
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    ownedRef.current = map;
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
