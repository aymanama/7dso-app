'use client';
import { motion } from 'framer-motion';
import { STAT_TAGS } from '@/lib/engine/statTags';
import { cn } from '@/lib/utils/cn';
import type { ArmorPiece, Tier } from '@/types/game';

const SLOT_ICONS: Record<string, string> = {
  top: '▲',
  bottoms: '▼',
  belt: '◉',
  combat_boots: '⬟',
};

const TIER_COLORS: Record<Tier, string> = {
  SSR: '#F5C84B',
  SR:  '#B58CFF',
};

interface Props {
  armor: ArmorPiece;
  owned: boolean;
  onToggle: () => void;
}

export function ArmorToggleItem({ armor, owned, onToggle }: Props) {
  return (
    <motion.button
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 transition-colors',
        owned ? 'bg-white/[0.04]' : 'bg-transparent'
      )}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
    >
      <span className="text-white/40 text-base flex-shrink-0">
        {SLOT_ICONS[armor.slot]}
      </span>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-mono font-bold" style={{ color: TIER_COLORS[armor.tier] }}>
            {armor.tier}
          </span>
          <span className="text-[9px] font-mono text-white/30 uppercase">
            {armor.slot.replace('_', ' ')}
          </span>
        </div>
        <div className="text-[12px] font-mono text-white/80 leading-tight truncate">
          {armor.name}
        </div>
        <div className="flex gap-1 mt-1 flex-wrap">
          {armor.stat_tags.map(tag => (
            <span
              key={tag}
              className="text-[9px] font-mono bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded-full"
            >
              {STAT_TAGS[tag as keyof typeof STAT_TAGS] ?? tag}
            </span>
          ))}
        </div>
      </div>

      <div
        className={cn(
          'w-10 h-6 rounded-full flex-shrink-0 relative transition-colors duration-200',
          owned ? 'bg-[#F5C84B]' : 'bg-white/10'
        )}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          animate={{ left: owned ? '22px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        />
      </div>
    </motion.button>
  );
}
