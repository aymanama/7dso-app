'use client';
import { motion } from 'framer-motion';
import { Sigil } from '@/components/ui/Sigil';
import { TierBadge } from '@/components/ui/TierBadge';
import { ElementPip } from '@/components/ui/ElementPip';
import type { Character } from '@/types/game';

const ROLE_GLYPHS: Record<string, string> = {
  attacker: '✦',
  buster:   '◇',
  warden:   '◆',
  supporter:'✧',
};

interface Props {
  character: Character;
  delay?: number;
  onClick?: () => void;
  owned?: boolean;
  onToggle?: (id: string) => void;
}

export function CodexCard({ character, delay = 0, onClick, owned = false, onToggle }: Props) {
  return (
    <motion.div
      className="w-full text-left rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3 cursor-pointer"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <Sigil name={character.name} portraitUrl={character.portrait_url} element={character.primary_element} size={48} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <TierBadge tier={character.tier} />
          <span className="text-[10px] font-mono text-white/30">{ROLE_GLYPHS[character.primary_role]} {character.primary_role}</span>
        </div>
        <div className="font-mono font-bold text-[13px] text-white leading-tight truncate">{character.name}</div>
        <div className="flex items-center gap-2 mt-1">
          {character.elements.map(e => (
            <ElementPip key={e} element={e} size={7} showLabel />
          ))}
        </div>
      </div>

      {/* Right column: rank + compact toggle */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-mono font-bold text-white/20">{character.tier_rank}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.(character.id); }}
          className="w-8 h-[18px] rounded-full relative transition-colors duration-200"
          style={{ background: owned ? '#F5C84B' : 'rgba(255,255,255,0.10)' }}
          aria-label={owned ? 'Unmark as owned' : 'Mark as owned'}
        >
          <motion.div
            className="absolute top-[3px] w-3 h-3 rounded-full bg-white shadow"
            animate={{ left: owned ? '17px' : '3px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          />
        </button>
      </div>
    </motion.div>
  );
}
