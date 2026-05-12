'use client';
import { useState, useCallback, useRef } from 'react';

export function useInventory(userId: string | null, initial: Record<string, boolean> = {}) {
  const ownedRef = useRef(initial);
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (accessoryId: string) => {
    const next = !ownedRef.current[accessoryId];
    const newState = { ...ownedRef.current, [accessoryId]: next };
    ownedRef.current = newState;
    setOwned(newState);
    if (!userId) return;
    await fetch('/api/inventory?type=accessory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId: accessoryId, owned: next }),
    });
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    ownedRef.current = map;
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
