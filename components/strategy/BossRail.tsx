'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ELEMENT_META } from '@/lib/utils/elements';
import { cn } from '@/lib/utils/cn';
import type { Boss } from '@/types/game';

interface Props {
  bosses: Boss[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function BossRail({ bosses, selectedId, onSelect }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto px-5 py-2" style={{ scrollbarWidth: 'none' }}>
      {bosses.map((boss, i) => {
        const meta = ELEMENT_META[boss.element_id];
        const isSelected = boss.id === selectedId;
        return (
          <motion.button
            key={boss.id}
            className={cn(
              'flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer',
              'transition-transform duration-200'
            )}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: isSelected ? -2 : 0 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 28 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onSelect(boss.id)}
          >
            <div
              className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center bg-[#1A1E2E] relative"
              style={
                isSelected
                  ? { outline: `2px solid ${meta.color}`, outlineOffset: '2px', boxShadow: `0 0 18px ${meta.glow}` }
                  : { outline: '2px solid rgba(255,255,255,0.08)', outlineOffset: '2px' }
              }
            >
              {boss.portrait_url ? (
                <Image src={boss.portrait_url} alt={boss.short_name} fill className="object-cover object-top" sizes="56px" />
              ) : (
                <span className="font-mono font-bold text-base" style={{ color: meta.color }}>
                  {boss.short_name.slice(0, 2)}
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-mono font-semibold tracking-wide"
              style={{ color: isSelected ? meta.color : 'rgba(255,255,255,0.40)' }}
            >
              {boss.short_name.length > 7 ? boss.short_name.slice(0, 7) + '…' : boss.short_name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
