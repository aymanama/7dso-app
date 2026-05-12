'use client';
import { useState, useCallback, useRef } from 'react';

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
    await fetch('/api/inventory?type=weapon', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId: weaponId, owned: next }),
    });
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => {
    ownedRef.current = map;
    setOwned(map);
  }, []);

  return { owned, toggle, setMany };
}
