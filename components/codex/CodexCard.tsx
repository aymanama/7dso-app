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
}

export function CodexCard({ character, delay = 0, onClick }: Props) {
  return (
    <motion.button
      className="w-full text-left rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
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
      <div className="text-[10px] font-mono font-bold text-white/20 flex-shrink-0">{character.tier_rank}</div>
    </motion.button>
  );
}
