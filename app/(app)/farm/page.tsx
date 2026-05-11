'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { TierBadge } from '@/components/ui/TierBadge';
import { STAT_TAGS } from '@/lib/engine/statTags';
import type { FarmEntry } from '@/types/game';

const SLOT_ICONS = { ring: '◌', necklace: '◎', earring: '⟡' } as const;

const IMPACT_COLOR = (n: number) =>
  n >= 3 ? '#F5C84B' : n === 2 ? '#FFA958' : 'rgba(255,255,255,0.40)';

export default function FarmPage() {
  const userId = useAnonymousAuth();
  const [entries, setEntries] = useState<FarmEntry[]>([]);
  const [inventoryEmpty, setInventoryEmpty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId === null) return; // wait for auth to resolve
    setLoading(true);

    Promise.all([
      fetch(`/api/farm?userId=${userId}`).then(r => r.json()),
      fetch(`/api/inventory?userId=${userId}`).then(r => r.json()),
    ])
      .then(([farmData, invData]: [FarmEntry[], Record<string, boolean>]) => {
        setEntries(Array.isArray(farmData) ? farmData : []);
        const hasGear = Object.values(invData).some(Boolean);
        setInventoryEmpty(!hasGear);
      })
      .catch(() => { setEntries([]); })
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="pt-5">
      {/* Header */}
      <div className="px-5 mb-4">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
          7DS Origin · Smart Strategist
        </div>
        <h1 className="font-mono font-bold text-2xl text-white">Farm Plan</h1>
        {!loading && !inventoryEmpty && entries.length > 0 && (
          <p className="text-[11px] font-mono text-white/40 mt-1">
            {entries.length} item{entries.length !== 1 ? 's' : ''} would improve your builds
          </p>
        )}
      </div>

      {/* Loading skeleton */}
      {(loading || userId === null) && (
        <div className="px-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty vault state */}
      {!loading && userId !== null && inventoryEmpty && (
        <div className="mx-5 mt-8 text-center">
          <div className="text-4xl mb-4">⬡</div>
          <div className="font-mono font-bold text-white/60 text-base mb-2">Vault is empty</div>
          <p className="text-[11px] font-mono text-white/30 mb-6 leading-relaxed">
            Add gear to your Vault first so we can calculate your gaps.
          </p>
          <Link
            href="/vault"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono font-semibold text-[12px] transition-all"
            style={{ background: 'rgba(245,200,75,0.12)', color: '#F5C84B', border: '1px solid rgba(245,200,75,0.25)' }}
          >
            Open Vault →
          </Link>
        </div>
      )}

      {/* All clear state */}
      {!loading && userId !== null && !inventoryEmpty && entries.length === 0 && (
        <div className="mx-5 mt-8 text-center">
          <div className="text-4xl mb-4">✦</div>
          <div className="font-mono font-bold text-[#F5C84B] text-base mb-2">Nothing to farm!</div>
          <p className="text-[11px] font-mono text-white/30 leading-relaxed">
            You own BiS gear for every boss slot. Incredible.
          </p>
        </div>
      )}

      {/* Farm entries list */}
      {!loading && !inventoryEmpty && entries.length > 0 && (
        <div className="px-5 space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.item.id}
              className="rounded-2xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Top row: slot icon + name + tier badge */}
              <div className="flex items-start gap-2.5 mb-2">
                <span className="text-white/40 text-base flex-shrink-0 mt-0.5">
                  {SLOT_ICONS[entry.item.slot]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <TierBadge tier={entry.item.tier} />
                    <span className="text-[9px] font-mono text-white/30 uppercase">{entry.item.slot}</span>
                  </div>
                  <div className="font-mono font-semibold text-[12px] text-white/90 leading-tight">
                    {entry.item.name}
                  </div>
                </div>
                {/* Impact badge */}
                <div
                  className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-mono font-bold"
                  style={{
                    background: `${IMPACT_COLOR(entry.affectedBossCount)}18`,
                    color: IMPACT_COLOR(entry.affectedBossCount),
                    border: `1px solid ${IMPACT_COLOR(entry.affectedBossCount)}30`,
                  }}
                >
                  ↑ {entry.affectedBossCount} {entry.affectedBossCount === 1 ? 'build' : 'builds'}
                </div>
              </div>

              {/* Stat tags */}
              <div className="flex flex-wrap gap-1 mb-2 ml-6">
                {entry.item.stat_tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40"
                  >
                    {STAT_TAGS[tag as keyof typeof STAT_TAGS] ?? tag}
                  </span>
                ))}
              </div>

              {/* Drop source */}
              {entry.dropBoss && (
                <div className="text-[10px] font-mono text-teal-400/70 ml-6">
                  ⬢ Farm: {entry.dropBoss}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}
