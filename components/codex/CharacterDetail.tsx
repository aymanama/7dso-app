'use client';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Sigil } from '@/components/ui/Sigil';
import { TierBadge } from '@/components/ui/TierBadge';
import { ElementPip } from '@/components/ui/ElementPip';
import type { Character } from '@/types/game';

const WEAPON_ICONS: Record<string, string> = {
  Sword: '⚔', Axe: '🪓', Spear: '🗡', Bow: '🏹', Staff: '⚕', Hammer: '🔨', Scythe: '⚰',
};

interface Props {
  character: Character | null;
  onClose: () => void;
}

export function CharacterDetail({ character, onClose }: Props) {
  return (
    <BottomSheet open={!!character} onClose={onClose} title={character?.name}>
      {character && (
        <div className="px-5 py-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Sigil name={character.name} portraitUrl={character.portrait_url} element={character.primary_element} size={72} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TierBadge tier={character.tier} />
                <span className="text-[11px] font-mono text-white/40">{character.race}</span>
              </div>
              <div className="font-mono font-bold text-xl text-white">{character.name}</div>
              <div className="text-xs font-mono text-white/40 capitalize mt-0.5">{character.primary_role}</div>
            </div>
          </div>

          {/* Elements */}
          <div>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Elements</div>
            <div className="flex gap-3">
              {character.elements.map(e => (
                <ElementPip key={e} element={e} size={10} showLabel />
              ))}
            </div>
          </div>

          {/* Weapons */}
          <div>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Weapons</div>
            <div className="flex gap-2">
              {character.weapons.map(w => (
                <span key={w} className="text-[11px] font-mono bg-white/[0.06] px-2.5 py-1 rounded-full text-white/70">
                  {WEAPON_ICONS[w] ?? '•'} {w}
                </span>
              ))}
            </div>
          </div>

          {/* Blurb */}
          {character.blurb && (
            <div>
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">About</div>
              <p className="text-xs font-mono text-white/50 leading-relaxed">{character.blurb}</p>
            </div>
          )}

          {/* Tier rank */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Tier Rank</span>
            <span className="text-sm font-mono font-bold text-[#F5C84B]">{character.tier_rank}</span>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
