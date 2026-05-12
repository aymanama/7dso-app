'use client';
import { useState, useCallback, useRef } from 'react';

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
    await fetch('/api/inventory?type=armor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId: armorId, owned: next }),
    });
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    ownedRef.current = map;
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
