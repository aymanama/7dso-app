'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ELEMENT_META } from '@/lib/utils/elements';
import { cn } from '@/lib/utils/cn';
import type { Boss, Verdict } from '@/types/game';

const VERDICT_COLORS: Record<Verdict, string> = {
  perfect:      '#F5C84B',
  battle_ready: '#4ADE80',
  viable:       '#FFA958',
  high_risk:    '#F87171',
};

interface Props {
  bosses: Boss[];
  selectedId: string;
  onSelect: (id: string) => void;
  verdicts?: Record<string, Verdict>;
}

export function BossRail({ bosses, selectedId, onSelect, verdicts }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto px-5 py-2" style={{ scrollbarWidth: 'none' }}>
      {bosses.map((boss, i) => {
        const meta = ELEMENT_META[boss.element_id];
        const isSelected = boss.id === selectedId;
        const verdict = verdicts?.[boss.id];
        return (
          <motion.button
            key={boss.id}
            className={cn(
              'flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer',
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
              className="text-[10px] font-mono font-semibold tracking-wide leading-none"
              style={{ color: isSelected ? meta.color : 'rgba(255,255,255,0.40)' }}
            >
              {boss.short_name.length > 7 ? boss.short_name.slice(0, 7) + '…' : boss.short_name}
            </span>
            <div className="h-3.5 flex items-center justify-center">
              {verdict ? (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: VERDICT_COLORS[verdict] }}
                />
              ) : boss.content_order < 99 ? (
                <span className="text-[8px] font-mono text-white/20 leading-none">
                  #{boss.content_order}
                </span>
              ) : null}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
