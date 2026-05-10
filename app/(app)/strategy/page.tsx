'use client';
import { useState, useEffect, useCallback } from 'react';
import { BossRail } from '@/components/strategy/BossRail';
import { BossSpecCard } from '@/components/strategy/BossSpecCard';
import { CharacterCard } from '@/components/strategy/CharacterCard';
import { StrategyVerdict } from '@/components/strategy/StrategyVerdict';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import type { Boss, ResolvedBuild } from '@/types/game';

export default function StrategyPage() {
  const userId = useAnonymousAuth();
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [selectedBossId, setSelectedBossId] = useState<string>('galland');
  const [build, setBuild] = useState<ResolvedBuild | null>(null);
  const [loadingBosses, setLoadingBosses] = useState(true);
  const [loadingBuild, setLoadingBuild] = useState(false);

  useEffect(() => {
    fetch('/api/bosses')
      .then(r => r.json())
      .then((data: Boss[]) => {
        setBosses(data);
        if (data.length > 0 && !data.find((b: Boss) => b.id === 'galland')) {
          setSelectedBossId(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBosses(false));
  }, []);

  const fetchBuild = useCallback(() => {
    if (!selectedBossId) return;
    setLoadingBuild(true);
    const params = userId ? `?userId=${userId}` : '';
    fetch(`/api/builds/${selectedBossId}${params}`)
      .then(r => r.json())
      .then((data: ResolvedBuild) => setBuild(data))
      .catch(() => {})
      .finally(() => setLoadingBuild(false));
  }, [selectedBossId, userId]);

  useEffect(() => { fetchBuild(); }, [fetchBuild]);

  const selectedBoss = bosses.find(b => b.id === selectedBossId) ?? null;

  return (
    <div className="pt-5">
      <div className="px-5 mb-4">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
          7DS Origin · Smart Strategist
        </div>
        <h1 className="font-mono font-bold text-2xl text-white">Strategy</h1>
      </div>

      {loadingBosses ? (
        <div className="flex gap-3 px-5 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-14 h-14 rounded-2xl bg-white/[0.04] animate-pulse flex-shrink-0" />
          ))}
        </div>
      ) : (
        <BossRail bosses={bosses} selectedId={selectedBossId} onSelect={setSelectedBossId} />
      )}

      {selectedBoss && <BossSpecCard boss={selectedBoss} />}

      {loadingBuild ? (
        <div className="mx-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : build ? (
        <>
          <StrategyVerdict verdict={build.verdict} bisCount={build.bisCount} totalSlots={build.totalSlots} />
          {build.slots.map((slot, i) => (
            <CharacterCard key={slot.character.id} resolved={slot} delay={i * 0.07} />
          ))}
        </>
      ) : null}
    </div>
  );
}
