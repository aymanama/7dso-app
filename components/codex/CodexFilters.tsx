'use client';
import { cn } from '@/lib/utils/cn';
import { ELEMENT_META } from '@/lib/utils/elements';
import type { ElementId, Tier } from '@/types/game';

const ELEMENTS: ElementId[] = ['fire','ice','wind','thunder','earth','holy','dark','neutral'];
const TIERS: Array<Tier | 'ALL'> = ['ALL', 'SSR', 'SR'];

interface Props {
  tier: Tier | 'ALL';
  element: ElementId | 'ALL';
  onTier: (t: Tier | 'ALL') => void;
  onElement: (e: ElementId | 'ALL') => void;
}

export function CodexFilters({ tier, element, onTier, onElement }: Props) {
  return (
    <div className="px-5 space-y-2">
      {/* Tier pills */}
      <div className="flex gap-2">
        {TIERS.map(t => (
          <button
            key={t}
            onClick={() => onTier(t)}
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-mono font-semibold transition-all',
              tier === t
                ? 'bg-[#F5C84B] text-[#0B0E14]'
                : 'bg-white/[0.06] text-white/40 hover:bg-white/[0.10]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Element chips */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => onElement('ALL')}
          className={cn(
            'px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all',
            element === 'ALL'
              ? 'bg-white/20 text-white'
              : 'bg-white/[0.04] text-white/30 hover:bg-white/[0.08]'
          )}
        >
          ALL
        </button>
        {ELEMENTS.map(e => {
          const meta = ELEMENT_META[e];
          const active = element === e;
          return (
            <button
              key={e}
              onClick={() => onElement(e)}
              className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all"
              style={{
                background: active ? `${meta.color}22` : 'rgba(255,255,255,0.04)',
                color: active ? meta.color : 'rgba(255,255,255,0.30)',
                outline: active ? `1px solid ${meta.color}55` : 'none',
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
