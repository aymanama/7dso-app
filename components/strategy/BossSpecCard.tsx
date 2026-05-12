'use client';
import { useState } from 'react';
import { Sigil } from '@/components/ui/Sigil';
import { ElementPip } from '@/components/ui/ElementPip';
import { ELEMENT_META } from '@/lib/utils/elements';
import { getDifficultyMeta } from '@/lib/utils/difficulty';
import type { Boss } from '@/types/game';

interface Props {
  boss: Boss;
}

export function BossSpecCard({ boss }: Props) {
  const meta = ELEMENT_META[boss.element_id];
  const [tacticOpen, setTacticOpen] = useState(false);

  return (
    <div className="mx-5 mb-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-start gap-3">
        <Sigil
          name={boss.name}
          portraitUrl={boss.portrait_url}
          element={boss.element_id}
          size={72}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ElementPip element={boss.element_id} size={8} showLabel />
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{boss.kind}</span>
            {boss.content_order < 99 && (
              <span className="ml-auto text-[9px] font-mono text-white/20">#{boss.content_order}</span>
            )}
          </div>
          <h2 className="font-mono font-bold text-lg text-white leading-tight">{boss.name}</h2>
          {boss.blurb && (
            <p className="text-xs text-white/40 mt-1 leading-relaxed line-clamp-2">{boss.blurb}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <StatPill label="ELEMENT" value={meta.label} color={meta.color} />
        <StatPill label="THREAT" value={`${boss.threat}%`} color={boss.threat >= 80 ? '#F87171' : '#FFA958'} />
        <StatPill label="WEAKNESS" value={boss.weakness_elements.join(' · ') || '—'} color="#5EEAD4" />
      </div>

      {boss.difficulties?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 items-center">
          {boss.difficulties.map(d => {
            const m = getDifficultyMeta(d);
            return (
              <span
                key={d}
                className="text-[9px] font-mono font-bold px-2 py-1 rounded-full"
                style={{ background: m.bg, color: m.color }}
              >
                {d}
              </span>
            );
          })}
          {boss.min_gear_score > 0 && (
            <span
              className="text-[9px] font-mono px-2 py-1 rounded-full ml-auto"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.30)' }}
            >
              min {boss.min_gear_score}% BiS
            </span>
          )}
        </div>
      )}

      {boss.mechanics?.length > 0 && (
        <div className="mt-3 border-t border-white/[0.05] pt-3">
          <button
            className="w-full flex items-center justify-between text-left"
            onClick={() => setTacticOpen(v => !v)}
          >
            <span className="text-[10px] font-mono font-semibold text-white/45 uppercase tracking-widest">
              ◈ Tactics
            </span>
            <span className="text-[10px] font-mono text-white/20">{tacticOpen ? '▲' : '▼'}</span>
          </button>
          {tacticOpen && (
            <ul className="mt-2 space-y-2">
              {boss.mechanics.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[8px] text-white/20 mt-1 flex-shrink-0">▸</span>
                  <span className="text-[11px] font-mono text-white/55 leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex-1 bg-white/[0.04] rounded-xl px-2.5 py-2 text-center min-w-0">
      <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[11px] font-mono font-semibold truncate" style={{ color }}>{value}</div>
    </div>
  );
}
