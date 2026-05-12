'use client';
import { useState, useEffect } from 'react';
import { BossRail } from '@/components/strategy/BossRail';
import { BossSpecCard } from '@/components/strategy/BossSpecCard';
import { BossGuideList } from '@/components/strategy/BossGuideList';
import { CharacterCard } from '@/components/strategy/CharacterCard';
import { StrategyVerdict } from '@/components/strategy/StrategyVerdict';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { applyMyGearMode } from '@/lib/engine/buildEngine';
import { getDifficultyMeta } from '@/lib/utils/difficulty';
import type { Boss, ResolvedBuild, Verdict } from '@/types/game';

export default function StrategyPage() {
  const userId = useAnonymousAuth();
  const [view, setView] = useState<'guide' | 'detail'>('guide');
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [selectedBossId, setSelectedBossId] = useState<string>('galland');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
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

  // Single effect: resolve difficulty for the selected boss, then fetch.
  // Combining these avoids the double-fetch caused by having a separate
  // difficulty-setter effect and a separate fetch effect that fire in sequence.
  useEffect(() => {
    if (loadingBosses) return;

    const boss = bosses.find(b => b.id === selectedBossId);
    const hardest = boss?.difficulties?.length
      ? boss.difficulties[boss.difficulties.length - 1]
      : '';

    // If difficulty isn't set yet for this boss, set it and wait for re-render.
    // The next run will have selectedDifficulty === hardest and will proceed to fetch.
    if (hardest && !selectedDifficulty) {
      setSelectedDifficulty(hardest);
      return;
    }

    setLoadingBuild(true);
    setActiveTeam(0);

    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
    const qs = params.toString() ? `?${params}` : '';

    let cancelled = false;
    fetch(`/api/builds/${selectedBossId}${qs}`)
      .then(r => r.json())
      .then((data: ResolvedBuild[]) => {
        if (cancelled) return;
        if (Array.isArray(data) && data[0]?.slots) {
          setBuilds(data);
          setVerdicts(prev => ({ ...prev, [selectedBossId]: data[0].verdict }));
        } else {
          setBuilds([]);
        }
      })
      .catch(() => { if (!cancelled) setBuilds([]); })
      .finally(() => { if (!cancelled) setLoadingBuild(false); });

    return () => { cancelled = true; };
  }, [selectedBossId, selectedDifficulty, userId, bosses, loadingBosses]);

  // Reset difficulty when switching boss so the effect above re-resolves it.
  const handleSelectBoss = (id: string) => {
    setSelectedDifficulty('');
    setSelectedBossId(id);
  };

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

      {/* View toggle */}
      <div className="px-5 mb-4 flex gap-2">
        {(['guide', 'detail'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold transition-all"
            style={{
              background: view === v ? 'rgba(245,200,75,0.12)' : 'rgba(255,255,255,0.04)',
              color: view === v ? '#F5C84B' : 'rgba(255,255,255,0.35)',
              border: view === v ? '1px solid rgba(245,200,75,0.30)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {v === 'guide' ? '◈ All Bosses' : '⬡ Build Check'}
          </button>
        ))}
      </div>

      {view === 'guide' && <BossGuideList />}

      {view === 'detail' && (
        <>
          {loadingBosses ? (
            <div className="flex gap-3 px-5 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-14 h-14 rounded-2xl bg-white/[0.04] animate-pulse flex-shrink-0" />
              ))}
            </div>
          ) : (
            <BossRail bosses={bosses} selectedId={selectedBossId} onSelect={handleSelectBoss} verdicts={verdicts} />
          )}

          {selectedBoss && <BossSpecCard boss={selectedBoss} />}

          {/* Difficulty selector */}
          {(selectedBoss?.difficulties?.length ?? 0) > 0 && (
            <div className="px-5 mb-3">
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1.5">Difficulty</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedBoss!.difficulties.map(d => {
                  const m = getDifficultyMeta(d);
                  const active = selectedDifficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDifficulty(d)}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full transition-all"
                      style={{
                        background: active ? m.bg : 'rgba(255,255,255,0.04)',
                        color: active ? m.color : 'rgba(255,255,255,0.30)',
                        border: active ? `1px solid ${m.color}55` : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: active ? `0 0 8px ${m.bg}` : 'none',
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
        </>
      )}
    </div>
  );
}
