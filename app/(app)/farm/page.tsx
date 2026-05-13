'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { TierBadge } from '@/components/ui/TierBadge';
import { STAT_TAGS } from '@/lib/engine/statTags';
import type { FarmEntry, PlannerResult, PlannerCard } from '@/types/game';

const SLOT_ICONS = { ring: '◌', necklace: '◎', earring: '⟡' } as const;
const IMPACT_COLOR = (n: number) =>
  n >= 3 ? '#F5C84B' : n === 2 ? '#FFA958' : 'rgba(255,255,255,0.40)';

const VERDICT_LABEL: Record<string, string> = {
  perfect:      'Perfect',
  battle_ready: 'Battle Ready',
  viable:       'Viable',
  high_risk:    'High Risk',
  no_roster:    'No Team',
};
const VERDICT_COLOR: Record<string, string> = {
  perfect:      '#F5C84B',
  battle_ready: '#4ADE80',
  viable:       '#FFA958',
  high_risk:    '#F87171',
  no_roster:    'rgba(255,255,255,0.25)',
};

const CARD_ICONS: Record<PlannerCard['kind'], string> = {
  boss:      '◆',
  gear:      '◌',
  character: '❒',
};

function PlannerCardBlock({ card }: { card: PlannerCard }) {
  const icon = CARD_ICONS[card.kind];
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl text-white/20 flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span
              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase"
              style={{
                background: card.kind === 'boss' ? `${VERDICT_COLOR[card.meta] ?? 'rgba(255,255,255,0.08)'}18` : 'rgba(255,255,255,0.06)',
                color:      card.kind === 'boss' ? (VERDICT_COLOR[card.meta] ?? 'rgba(255,255,255,0.40)') : 'rgba(255,255,255,0.40)',
              }}
            >
              {card.kind === 'boss' ? (VERDICT_LABEL[card.meta] ?? card.meta) : card.meta}
            </span>
          </div>
          <div className="font-mono font-bold text-[15px] text-white leading-tight">{card.title}</div>
          <div className="text-[11px] font-mono text-white/50 mt-0.5">{card.subtitle}</div>
          <div className="text-[10px] font-mono text-teal-400/60 mt-1">{card.detail}</div>
        </div>
      </div>
    </div>
  );
}

function ReadinessRow({ r }: { r: PlannerResult['readiness'][number] }) {
  const color = VERDICT_COLOR[r.verdict] ?? 'rgba(255,255,255,0.25)';
  const bisPct = r.totalBisSlots > 0 ? Math.round((r.bisCount / r.totalBisSlots) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-[9px] font-mono text-white/20 w-4 text-right flex-shrink-0">
        {r.contentOrder < 99 ? `#${r.contentOrder}` : '—'}
      </span>
      <span className="flex-1 text-[11px] font-mono text-white/70 truncate">{r.bossName}</span>
      <span className="text-[9px] font-mono text-white/30">{r.ownedSlots}/{r.totalSlots}</span>
      <span
        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
        style={{ background: `${color}18`, color }}
      >
        {bisPct}%
      </span>
    </div>
  );
}

export default function FarmPage() {
  const userId = useAnonymousAuth();
  const [view, setView] = useState<'gaps' | 'today'>('gaps');

  const [entries, setEntries] = useState<FarmEntry[]>([]);
  const [inventoryEmpty, setInventoryEmpty] = useState(false);
  const [loadingGaps, setLoadingGaps] = useState(true);

  const [planner, setPlanner] = useState<PlannerResult | null>(null);
  const [loadingPlanner, setLoadingPlanner] = useState(false);
  const [plannerFetched, setPlannerFetched] = useState(false);
  const [plannerError, setPlannerError] = useState(false);

  useEffect(() => {
    if (userId === null) return;
    setLoadingGaps(true);
    Promise.all([
      fetch(`/api/farm?userId=${userId}`).then(r => r.json()),
      fetch(`/api/inventory?userId=${userId}`).then(r => r.json()),
    ])
      .then(([farmData, invData]: [FarmEntry[], Record<string, boolean>]) => {
        setEntries(Array.isArray(farmData) ? farmData : []);
        setInventoryEmpty(!Object.values(invData).some(Boolean));
      })
      .catch(() => { setEntries([]); })
      .finally(() => setLoadingGaps(false));
  }, [userId]);

  useEffect(() => {
    if (view !== 'today' || plannerFetched || userId === null) return;
    setLoadingPlanner(true);
    setPlannerFetched(true);
    fetch(`/api/planner?userId=${userId}`)
      .then(r => r.json())
      .then((data: PlannerResult) => setPlanner(data))
      .catch(() => { setPlannerError(true); })
      .finally(() => setLoadingPlanner(false));
  }, [view, userId, plannerFetched]);

  return (
    <div className="pt-5">
      <div className="px-5 mb-4">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
          7DS Origin · Smart Strategist
        </div>
        <h1 className="font-mono font-bold text-2xl text-white">Farm Plan</h1>
      </div>

      {/* View toggle */}
      <div className="px-5 mb-4 flex gap-2">
        {(['gaps', 'today'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold transition-all"
            style={{
              background: view === v ? 'rgba(245,200,75,0.12)' : 'rgba(255,255,255,0.04)',
              color:      view === v ? '#F5C84B' : 'rgba(255,255,255,0.35)',
              border:     view === v ? '1px solid rgba(245,200,75,0.30)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {v === 'gaps' ? '⬢ Gear Gaps' : '★ Today'}
          </button>
        ))}
      </div>

      {/* ── GAPS VIEW ─────────────────────────────────────────────────── */}
      {view === 'gaps' && (
        <>
          {!loadingGaps && !inventoryEmpty && entries.length > 0 && (
            <p className="px-5 text-[11px] font-mono text-white/40 mb-3">
              {entries.length} item{entries.length !== 1 ? 's' : ''} would improve your builds
            </p>
          )}

          {(loadingGaps || userId === null) && (
            <div className="px-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          )}

          {!loadingGaps && userId !== null && inventoryEmpty && (
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

          {!loadingGaps && userId !== null && !inventoryEmpty && entries.length === 0 && (
            <div className="mx-5 mt-8 text-center">
              <div className="text-4xl mb-4">✦</div>
              <div className="font-mono font-bold text-[#F5C84B] text-base mb-2">Nothing to farm!</div>
              <p className="text-[11px] font-mono text-white/30 leading-relaxed">
                You own BiS gear for every boss slot. Incredible.
              </p>
            </div>
          )}

          {!loadingGaps && !inventoryEmpty && entries.length > 0 && (
            <div className="px-5 space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.item.id}
                  className="rounded-2xl p-3.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
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
                  {entry.dropBoss && (
                    <div className="text-[10px] font-mono text-teal-400/70 ml-6">
                      ⬢ Farm: {entry.dropBoss}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TODAY VIEW ────────────────────────────────────────────────── */}
      {view === 'today' && (
        <>
          {(loadingPlanner || userId === null) && (
            <div className="px-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          )}

          {!loadingPlanner && plannerError && (
            <div className="mx-5 mt-8 text-center">
              <div className="text-4xl mb-4">◆</div>
              <div className="font-mono font-bold text-white/40 text-base mb-2">Failed to load</div>
              <p className="text-[11px] font-mono text-white/25 leading-relaxed">
                Could not reach the planner. Check your connection and reload.
              </p>
            </div>
          )}

          {!loadingPlanner && planner && (
            <>
              {/* Recommendation cards */}
              {planner.cards.length > 0 && (
                <div className="px-5 space-y-3 mb-6">
                  <div className="text-[9px] font-mono text-white/25 uppercase tracking-widest mb-2">
                    Today&apos;s priorities
                  </div>
                  {planner.cards.map((card, i) => (
                    <PlannerCardBlock key={i} card={card} />
                  ))}
                </div>
              )}

              {/* Readiness breakdown */}
              {planner.readiness.length > 0 && (
                <div className="px-5">
                  <div className="text-[9px] font-mono text-white/25 uppercase tracking-widest mb-2">
                    All bosses — readiness
                  </div>
                  <div
                    className="rounded-2xl px-3 py-1"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {planner.readiness
                      .slice()
                      .sort((a, b) => a.contentOrder - b.contentOrder)
                      .map(r => <ReadinessRow key={r.bossId} r={r} />)}
                  </div>
                </div>
              )}

              {planner.cards.length === 0 && (
                <div className="mx-5 mt-8 text-center">
                  <div className="text-4xl mb-4">✦</div>
                  <div className="font-mono font-bold text-[#F5C84B] text-base mb-2">All clear!</div>
                  <p className="text-[11px] font-mono text-white/30 leading-relaxed">
                    You&apos;re battle-ready for every available boss. Check back after the next update.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="h-6" />
    </div>
  );
}
