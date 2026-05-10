'use client';
import { motion } from 'framer-motion';
import { Sigil } from '@/components/ui/Sigil';
import { SynergyDial } from '@/components/ui/SynergyDial';
import { ElementPip } from '@/components/ui/ElementPip';
import { GearSlot } from './GearSlot';
import type { ResolvedCharacter } from '@/types/game';

const SLOT_LABELS = ['MAIN', 'SUP 1', 'SUP 2', 'AUX'];

interface Props {
  resolved: ResolvedCharacter;
  delay?: number;
}

export function CharacterCard({ resolved, delay = 0 }: Props) {
  const { character, slotIndex, ring, necklace, earring, synergyScore, isOwned, countersWeakness, isMetapick } = resolved;

  return (
    <motion.div
      className="mx-5 mb-3 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: isOwned ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,87,87,0.20)',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex items-center gap-3 p-3 pb-2">
        <div className="relative flex-shrink-0">
          <Sigil name={character.name} portraitUrl={character.portrait_url} element={character.primary_element} size={48} />
          {!isOwned && (
            <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
              <span className="text-[10px] font-mono text-red-400 font-bold">✕</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
              {SLOT_LABELS[slotIndex] ?? `SLOT ${slotIndex}`}
            </span>
            <span className="text-[9px] font-mono text-white/20">·</span>
            <span className="text-[9px] font-mono text-white/30 uppercase">{character.tier_rank}</span>
            {countersWeakness && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 leading-none">
                WEAK↑
              </span>
            )}
            {isMetapick && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 leading-none">
                META
              </span>
            )}
            {!isOwned && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 leading-none">
                NOT OWNED
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <ElementPip element={character.primary_element} size={6} />
            <div className="font-mono font-bold text-[13px] text-white leading-tight truncate">{character.name}</div>
          </div>
          <div className="text-[10px] font-mono text-white/40 capitalize">{character.primary_role}</div>
        </div>

        <SynergyDial score={synergyScore} size={36} />
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
        <GearSlot slot="ring"     gear={ring}     />
        <GearSlot slot="necklace" gear={necklace} />
        <GearSlot slot="earring"  gear={earring}  />
      </div>
    </motion.div>
  );
}
