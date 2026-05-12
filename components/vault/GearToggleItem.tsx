'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { Accessory, Tier } from '@/types/game';

const SLOT_ICONS: Record<string, string> = { ring: '◌', necklace: '◎', earring: '⟡' };

const TIER_COLORS: Record<Tier, string> = {
  SSR: '#F5C84B',
  SR:  '#B58CFF',
};

interface Props {
  accessory: Accessory;
  owned: boolean;
  onToggle: () => void;
}

export function GearToggleItem({ accessory, owned, onToggle }: Props) {
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
        {accessory.image_url ? (
          <Image src={accessory.image_url} alt={accessory.name} width={28} height={28} className="object-contain" />
        ) : (
          <span className="text-white/40 text-base">{SLOT_ICONS[accessory.slot]}</span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-mono font-bold" style={{ color: TIER_COLORS[accessory.tier] }}>
            {accessory.tier}
          </span>
          {accessory.set_name && (
            <span className="text-[9px] font-mono text-white/30">· {accessory.set_name}</span>
          )}
        </div>
        <div className="text-[12px] font-mono text-white/80 leading-tight truncate">{accessory.name}</div>

        {(accessory.main_stat || accessory.sub_stat) && (
          <div className="flex items-center gap-2 mt-0.5">
            {accessory.main_stat && (
              <span className="text-[9px] font-mono text-white/35">{accessory.main_stat}</span>
            )}
            {accessory.main_stat && accessory.sub_stat && (
              <span className="text-[9px] font-mono text-white/20">·</span>
            )}
            {accessory.sub_stat && (
              <span className="text-[9px] font-mono text-[#F5C84B]/50">{accessory.sub_stat}</span>
            )}
          </div>
        )}

        {accessory.passive_description && (
          <p className="text-[10px] font-mono text-white/40 line-clamp-2 mt-0.5 leading-tight">
            {accessory.passive_description}
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
