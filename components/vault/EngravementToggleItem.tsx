'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { TierBadge } from '@/components/ui/TierBadge';
import type { Engravement } from '@/types/game';

interface Props {
  engravement: Engravement;
  characterName: string;
  owned: boolean;
  onToggle: () => void;
}

export function EngravementToggleItem({ engravement, characterName, owned, onToggle }: Props) {
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
        {engravement.image_url ? (
          <Image src={engravement.image_url} alt={engravement.name} width={28} height={28} className="object-contain" />
        ) : (
          <span className="text-white/40 text-xs font-mono font-bold">
            {characterName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <TierBadge tier={engravement.tier} />
          <span className="text-[9px] font-mono text-white/30">· {characterName}</span>
        </div>
        <div className="text-[12px] font-mono text-white/80 leading-tight truncate">{engravement.name}</div>
        {engravement.special_skill_name && (
          <div className="text-[9px] font-mono text-white/35 mt-0.5 uppercase tracking-wide">
            {engravement.special_skill_name}
          </div>
        )}
        {engravement.static_sub_stats.length > 0 && (
          <p className="text-[10px] font-mono text-white/40 line-clamp-2 mt-0.5 leading-tight">
            {engravement.static_sub_stats.join(' · ')}
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
