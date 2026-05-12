'use client';
import { useState, useEffect } from 'react';
import { Sigil } from '@/components/ui/Sigil';
import { CharacterDetail } from '@/components/codex/CharacterDetail';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { useRoster } from '@/hooks/useRoster';
import { cn } from '@/lib/utils/cn';
import type { Character } from '@/types/game';

type Mode = 'pve' | 'boss' | 'pvp';
type Rank = 'S' | 'A' | 'B' | 'C';
type TierData = Record<Rank, Character[]>;
type TierListData = Record<Mode, TierData>;

const RANKS: Rank[] = ['S', 'A', 'B', 'C'];

const RANK_COLORS: Record<Rank, string> = {
  S: '#F5C84B',
  A: '#4ADE80',
  B: '#FFA958',
  C: '#F87171',
};

const MODE_LABELS: Record<Mode, string> = {
  pve:  'PvE',
  boss: 'Boss',
  pvp:  'PvP',
};

export default function TierListPage() {
  const userId = useAnonymousAuth();
  const [data, setData] = useState<TierListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('pve');
  const [selected, setSelected] = useState<Character | null>(null);

  const { owned: roster, toggle: toggleRoster, setMany: setManyRoster } = useRoster(userId);

  useEffect(() => {
    fetch('/api/tier-list')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/roster?userId=${userId}`)
      .then(r => r.json())
      .then((d: Record<string, boolean>) => setManyRoster(d))
      .catch(() => {});
  }, [userId, setManyRoster]);

  const currentTiers = data?.[mode];
  const hasAnyData = currentTiers && RANKS.some(r => (currentTiers[r]?.length ?? 0) > 0);

  return (
    <div className="pt-5">
      <div className="px-5 mb-4">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
          7DS Origin · Smart Strategist
        </div>
        <h1 className="font-mono font-bold text-2xl text-white">Tier List</h1>
      </div>

      {/* Mode switcher */}
      <div className="sticky top-0 z-10 bg-[#0B0E14]/90 backdrop-blur-sm px-5 pb-3 pt-1">
        <div className="flex gap-2">
          {(Object.keys(MODE_LABELS) as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-4 py-1.5 rounded-full text-[11px] font-mono font-semibold transition-all',
                mode === m
                  ? 'bg-[#F5C84B] text-[#0B0E14]'
                  : 'bg-white/[0.06] text-white/40'
              )}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="px-5 space-y-3 mt-4">
          {RANKS.map(r => (
            <div key={r} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : !hasAnyData ? (
        <div className="flex flex-col items-center py-16 px-5 text-center">
          <span className="text-5xl text-white/10">◈</span>
          <p className="text-sm font-mono text-white/40 mt-3">No tier data available</p>
          <p className="text-[11px] font-mono text-white/20 mt-1">Run the seed script to populate rankings.</p>
          <code className="text-[10px] font-mono text-white/30 mt-3 bg-white/[0.04] px-3 py-1.5 rounded-lg">
            npx tsx scripts/seed.ts
          </code>
        </div>
      ) : (
        <div className="mt-2">
          {RANKS.map(rank => {
            const chars = currentTiers?.[rank] ?? [];
            if (!chars.length) return null;
            return (
              <div
                key={rank}
                className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04]"
              >
                {/* Tier label */}
                <div className="w-8 flex-shrink-0 flex items-center justify-center">
                  <span
                    className="font-mono font-bold text-2xl leading-none"
                    style={{ color: RANK_COLORS[rank] }}
                  >
                    {rank}
                  </span>
                </div>

                {/* Character row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1 scrollbar-hide">
                  {chars.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="flex-shrink-0 focus:outline-none"
                      aria-label={c.name}
                    >
                      <Sigil
                        name={c.name}
                        portraitUrl={c.portrait_url}
                        element={c.primary_element}
                        size={48}
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CharacterDetail
        character={selected}
        onClose={() => setSelected(null)}
        owned={!!roster[selected?.id ?? '']}
        onToggle={toggleRoster}
      />
    </div>
  );
}
