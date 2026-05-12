'use client';
import { useEffect, useState } from 'react';
import { ElementPip } from '@/components/ui/ElementPip';
import type { ElementId } from '@/types/game';

interface GuideSlot {
  slotIndex: number;
  characterName: string;
  characterElement: ElementId;
  tierRank: string;
  bossRank: string | null;
  ring: string[];
  necklace: string[];
  earring: string[];
}

interface GuideTeam {
  teamIndex: number;
  teamName: string;
  slots: GuideSlot[];
}

interface GuideBoss {
  id: string;
  name: string;
  element_id: ElementId;
  weakness_elements: ElementId[];
  threat: number;
  kind: string;
  teams: GuideTeam[];
}

const SLOT_LABELS = ['MAIN', 'SUP 1', 'SUP 2', 'AUX'];

function GearPriority({ icon, items }: { icon: string; items: string[] }) {
  return (
    <div className="flex items-start gap-1.5 mt-0.5">
      <span className="text-[10px] text-white/20 w-4 flex-shrink-0 text-center">{icon}</span>
      <span className="text-[9px] font-mono text-white/50 leading-snug">
        {items.map((item, i) => (
          <span key={i}>
            {i > 0 && <span className="text-white/20"> › </span>}
            <span style={{ color: i === 0 ? 'rgba(245,200,75,0.85)' : undefined }}>{item}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

function SlotRow({ slot }: { slot: GuideSlot }) {
  const allSame =
    JSON.stringify(slot.ring) === JSON.stringify(slot.necklace) &&
    JSON.stringify(slot.necklace) === JSON.stringify(slot.earring);

  return (
    <div className="py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[8px] font-mono text-white/20 uppercase w-8 flex-shrink-0">
          {SLOT_LABELS[slot.slotIndex] ?? `S${slot.slotIndex}`}
        </span>
        <ElementPip element={slot.characterElement} size={6} />
        <span className="text-[12px] font-mono font-semibold text-white/90">{slot.characterName}</span>
        {slot.bossRank === 'S' && (
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 font-bold leading-none">
            META
          </span>
        )}
        <span className="text-[8px] font-mono text-white/20 ml-auto">{slot.tierRank}</span>
      </div>
      <div className="pl-9">
        {allSame ? (
          <GearPriority icon="◌◎⟡" items={slot.ring} />
        ) : (
          <>
            <GearPriority icon="◌" items={slot.ring} />
            <GearPriority icon="◎" items={slot.necklace} />
            <GearPriority icon="⟡" items={slot.earring} />
          </>
        )}
      </div>
    </div>
  );
}

function BossGuideCard({ boss }: { boss: GuideBoss }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <button className="w-full px-4 py-3 flex items-center gap-3 text-left" onClick={() => setOpen(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <ElementPip element={boss.element_id} size={7} showLabel />
            <span className="text-[9px] font-mono text-white/25 uppercase tracking-wide">{boss.kind}</span>
            <span
              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ml-auto"
              style={{
                background: boss.threat >= 85 ? 'rgba(248,113,113,0.15)' : 'rgba(255,169,88,0.15)',
                color: boss.threat >= 85 ? '#F87171' : '#FFA958',
              }}
            >
              {boss.threat}%
            </span>
          </div>
          <div className="font-mono font-bold text-[14px] text-white leading-tight">{boss.name}</div>
          <div className="text-[9px] font-mono text-teal-400/60 mt-0.5">
            Weak: {boss.weakness_elements.join(' · ')}
          </div>
          {!open && (
            <div className="text-[9px] font-mono text-white/25 mt-1">
              {boss.teams[0]?.slots.map(s => s.characterName).join(' · ')}
            </div>
          )}
        </div>
        <span className="text-white/30 text-[11px] font-mono flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-white/[0.05]">
          {boss.teams.map(team => (
            <div key={team.teamIndex} className="px-4 pt-3 pb-1">
              <div
                className="text-[9px] font-mono uppercase tracking-widest mb-2 pb-1 border-b border-white/[0.05]"
                style={{ color: team.teamIndex === 0 ? '#F5C84B' : 'rgba(255,255,255,0.3)' }}
              >
                {team.teamIndex === 0 ? '★ ' : '◇ '}{team.teamName}
              </div>
              {team.slots.map(slot => (
                <SlotRow key={slot.slotIndex} slot={slot} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BossGuideList() {
  const [bosses, setBosses] = useState<GuideBoss[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/guide')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBosses(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-4 space-y-3 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <div className="px-4 mb-3 text-[9px] font-mono text-white/25 leading-relaxed">
        Tap a boss to see full team comps and gear priorities. Gold = BiS · Grey = alt options.
      </div>
      {bosses.map(boss => (
        <BossGuideCard key={boss.id} boss={boss} />
      ))}
    </div>
  );
}
