'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { ArmorPiece, Tier } from '@/types/game';

const SLOT_ICONS: Record<string, string> = {
  top: '▲',
  bottoms: '▼',
  belt: '◉',
  combat_boots: '⬟',
};

const SLOT_LABELS: Record<string, string> = {
  top: 'Chest',
  bottoms: 'Bottoms',
  belt: 'Belt',
  combat_boots: 'Boots',
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
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden bg-white/[0.04]">
        {armor.image_url ? (
          <img src={armor.image_url} alt={armor.name} className="w-7 h-7 object-contain" />
        ) : (
          <span className="text-white/40 text-base">{SLOT_ICONS[armor.slot]}</span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-mono font-bold" style={{ color: TIER_COLORS[armor.tier] }}>
            {armor.tier}
          </span>
          {armor.set_name && (
            <span className="text-[9px] font-mono text-white/30">· {armor.set_name}</span>
          )}
        </div>
        <div className="text-[12px] font-mono text-white/80 leading-tight truncate">{armor.name}</div>
        <div className="text-[9px] font-mono text-white/25 mt-0.5 uppercase tracking-wide">
          {SLOT_LABELS[armor.slot]}
        </div>
        {armor.four_pc_bonus && (
          <p className="text-[10px] font-mono text-white/40 line-clamp-2 mt-0.5 leading-tight">
            {armor.four_pc_bonus}
          </p>
        )}
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
