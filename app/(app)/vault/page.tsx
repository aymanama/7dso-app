'use client';
import { useState, useEffect, useMemo } from 'react';
import { GearToggleItem } from '@/components/vault/GearToggleItem';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { useInventory } from '@/hooks/useInventory';
import type { Accessory } from '@/types/game';

const SLOT_ORDER = ['ring', 'necklace', 'earring'] as const;

export default function VaultPage() {
  const userId = useAnonymousAuth();
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialOwned, setInitialOwned] = useState<Record<string, boolean>>({});
  const { owned, toggle, setMany } = useInventory(userId, initialOwned);

  useEffect(() => {
    fetch('/api/accessories')
      .then(r => r.json())
      .then(setAccessories)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/inventory?userId=${userId}`)
      .then(r => r.json())
      .then((data: Record<string, boolean>) => {
        setInitialOwned(data);
        setMany(data);
      })
      .catch(() => {});
  }, [userId, setMany]);

  const grouped = useMemo(() => {
    const map: Record<string, Accessory[]> = { ring: [], necklace: [], earring: [] };
    for (const a of accessories) map[a.slot]?.push(a);
    return map;
  }, [accessories]);

  const ownedCount = accessories.filter(a => owned[a.id]).length;

  return (
    <div className="pt-5">
      <div className="px-5 mb-4">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
          7DS Origin · Smart Strategist
        </div>
        <h1 className="font-mono font-bold text-2xl text-white">Vault</h1>
        <p className="text-xs font-mono text-white/30 mt-1">
          {ownedCount} / {accessories.length} pieces owned
        </p>
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          {SLOT_ORDER.map(slot => {
            const items = grouped[slot] ?? [];
            if (!items.length) return null;
            return (
              <div key={slot} className="mb-4">
                <div className="px-5 py-2 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/[0.04]">
                  {slot}s ({items.filter(a => owned[a.id]).length}/{items.length})
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {items.map(a => (
                    <GearToggleItem
                      key={a.id}
                      accessory={a}
                      owned={!!owned[a.id]}
                      onToggle={() => toggle(a.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
