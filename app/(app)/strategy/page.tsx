'use client';
import { useState, useEffect, useCallback } from 'react';
import { BossRail } from '@/components/strategy/BossRail';
import { BossSpecCard } from '@/components/strategy/BossSpecCard';
import { CharacterCard } from '@/components/strategy/CharacterCard';
import { StrategyVerdict } from '@/components/strategy/StrategyVerdict';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import type { Boss, ResolvedBuild, ResolvedGear, Verdict } from '@/types/game';

// In "My Gear" mode, unowned slots show the BiS target without any FARM badge.
function applyMyGearMode(build: ResolvedBuild): ResolvedBuild {
  const neutralize = (gear: ResolvedGear): ResolvedGear =>
    gear.isOwned ? gear : { ...gear, isBis: true };

  return {
    ...build,
    slots: build.slots.map(slot => ({
      ...slot,
      ring:     neutralize(slot.ring),
      necklace: neutralize(slot.necklace),
      earring:  neutralize(slot.earring),
    })),
  };
}

export default function StrategyPage() {
  const userId = useAnonymousAuth();
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [selectedBossId, setSelectedBossId] = useState<string>('galland');
  const [builds, setBuilds] = useState<ResolvedBuild[]>([]);
  const [activeTeam, setActiveTeam] = useState(0);
  const [loadingBosses, setLoadingBosses] = useState(true);
  const [loadingBuild, setLoadingBuild] = useState(false);
  const [mode, setMode] = useState<'optimal' | 'my_gear'>('optimal');
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});

  useEffect(() => {
    fetch('/api/bosses')
      .then(r => r.json())
      .then((data: Boss[]) => {
        if (!Array.isArray(data)) return;
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
    setActiveTeam(0);
    const params = userId ? `?userId=${userId}` : '';
    fetch(`/api/builds/${selectedBossId}${params}`)
      .then(r => r.json())
      .then((data: ResolvedBuild[]) => {
        if (Array.isArray(data) && data[0]?.slots) {
          setBuilds(data);
          setVerdicts(prev => ({ ...prev, [selectedBossId]: data[0].verdict }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBuild(false));
  }, [selectedBossId, userId]);

  useEffect(() => { fetchBuild(); }, [fetchBuild]);

  const selectedBoss = bosses.find(b => b.id === selectedBossId) ?? null;
  const rawBuild = builds[activeTeam] ?? null;
  const activeBuild = rawBuild && mode === 'my_gear' ? applyMyGearMode(rawBuild) : rawBuild;

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
        <BossRail bosses={bosses} selectedId={selectedBossId} onSelect={setSelectedBossId} verdicts={verdicts} />
      )}

      {selectedBoss && <BossSpecCard boss={selectedBoss} />}

      {/* Team switcher */}
      {builds.length > 1 && (
        <div className="px-5 mb-3">
          <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1.5">Formation</div>
          <div className="flex gap-2">
            {builds.map((b, i) => {
              const label = i === 0 ? '★ Recommended' : '◇ Alternative';
              const full = b.ownedCharacterCount === b.slots.length;
              return (
                <button
                  key={i}
                  onClick={() => setActiveTeam(i)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold transition-all"
                  style={{
                    background: activeTeam === i ? 'rgba(245,200,75,0.12)' : 'rgba(255,255,255,0.04)',
                    color: activeTeam === i ? '#F5C84B' : 'rgba(255,255,255,0.40)',
                    border: activeTeam === i ? '1px solid rgba(245,200,75,0.30)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {label}
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      background: full ? 'rgba(94,234,212,0.15)' : 'rgba(255,169,88,0.15)',
                      color: full ? '#5EEAD4' : '#FFA958',
                    }}
                  >
                    {b.ownedCharacterCount}/{b.slots.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loadingBuild ? (
        <div className="mx-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : activeBuild ? (
        <>
          {/* Mode toggle */}
          <div className="px-5 mb-3 flex items-center gap-2">
            {(['optimal', 'my_gear'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold transition-all"
                style={{
                  background: mode === m ? 'rgba(181,140,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: mode === m ? '#B58CFF' : 'rgba(255,255,255,0.35)',
                  border: mode === m ? '1px solid rgba(181,140,255,0.30)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {m === 'optimal' ? '◈ Optimal' : '⬡ My Gear'}
              </button>
            ))}
          </div>

          {/* My Gear banner */}
          {mode === 'my_gear' && (
            <div
              className="mx-5 mb-3 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(94,234,212,0.05)', border: '1px solid rgba(94,234,212,0.12)' }}
            >
              <div className="text-[10px] font-mono text-teal-400/80">
                ✦ Your best current loadout · Gold slots are BiS targets you don&apos;t own yet
              </div>
            </div>
          )}

          <StrategyVerdict verdict={activeBuild.verdict} bisCount={activeBuild.bisCount} totalSlots={activeBuild.totalSlots} />
          {activeBuild.slots.map((slot, i) => (
            <CharacterCard key={slot.character.id} resolved={slot} delay={i * 0.07} />
          ))}
        </>
      ) : null}
    </div>
  );
}
