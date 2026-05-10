'use client';
import { useState, useCallback } from 'react';

export function useRoster(userId: string | null, initial: Record<string, boolean> = {}) {
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (characterId: string) => {
    const next = !owned[characterId];
    setOwned(prev => ({ ...prev, [characterId]: next }));
    if (!userId) return;
    fetch('/api/roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, characterId, owned: next }),
    }).catch(() => {});
  }, [userId, owned]);

  const setMany = useCallback((map: Record<string, boolean>) => setOwned(map), []);

  return { owned, toggle, setMany };
}
