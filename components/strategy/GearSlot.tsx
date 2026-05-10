'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { STAT_TAGS } from '@/lib/engine/statTags';
import type { ResolvedGear, Slot } from '@/types/game';

const SLOT_ICONS: Record<Slot, string> = {
  ring: '◌',
  necklace: '◎',
  earring: '⟡',
};

const SLOT_LABELS: Record<Slot, string> = {
  ring: 'Ring',
  necklace: 'Necklace',
  earring: 'Earring',
};

interface Props {
  slot: Slot;
  gear: ResolvedGear;
}

export function GearSlot({ slot, gear }: Props) {
  const { item, isBis, isOwned, matchedStatTag, isCounter } = gear;

  const borderColor = isBis
    ? '#F5C84B'
    : isOwned
    ? '#FFA958'
    : '#5EEAD4';

  const badgeLabel = !isBis && isOwned ? 'SUB' : !isBis && !isOwned ? 'FARM' : null;
  const badgeColor = isOwned ? '#FFA958' : '#5EEAD4';

  return (
    <div
      className="relative rounded-xl p-2.5 bg-white/[0.03]"
      style={{ border: `1px solid ${borderColor}22`, outline: `1px solid ${borderColor}44` }}
    >
      {/* Badge */}
      {badgeLabel && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold z-10"
          style={{ background: badgeColor, color: '#0B0E14' }}
        >
          {badgeLabel}
        </motion.div>
      )}

      {/* Slot header */}
      <div className="flex items-center gap-1 mb-1.5">
        <span className="text-white/30 text-sm">{SLOT_ICONS[slot]}</span>
        <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">{SLOT_LABELS[slot]}</span>
      </div>

      {/* Item name */}
      <div className="text-[11px] font-mono font-semibold text-white/90 leading-tight line-clamp-2">
        {item.name}
      </div>

      {/* Stat tags */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {item.stat_tags.map(tag => (
          <span
            key={tag}
            className={cn(
              'text-[9px] font-mono px-1.5 py-0.5 rounded-full',
              tag === matchedStatTag
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-white/[0.06] text-white/40'
            )}
          >
            {STAT_TAGS[tag as keyof typeof STAT_TAGS] ?? tag}
          </span>
        ))}
      </div>

      {/* SUB hint */}
      {!isBis && isOwned && matchedStatTag && (
        <div className="mt-1.5 text-[9px] font-mono text-amber-400/70">
          ⚠ Matches {STAT_TAGS[matchedStatTag as keyof typeof STAT_TAGS] ?? matchedStatTag}
        </div>
      )}

      {/* FARM hint */}
      {!isBis && !isOwned && (
        <div className="mt-1.5 text-[9px] font-mono text-teal-400/70">
          ↑ FARM THIS
        </div>
      )}

      {/* Counter hint */}
      {isCounter && (
        <div className="mt-1 text-[9px] font-mono text-teal-300">
          ● COUNTERS WEAKNESS
        </div>
      )}
    </div>
  );
}
