'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Sigil } from '@/components/ui/Sigil';
import { TierBadge } from '@/components/ui/TierBadge';
import { ElementPip } from '@/components/ui/ElementPip';
import type { Character, Weapon } from '@/types/game';

const WEAPON_ICONS: Record<string, string> = {
  Axe: '🪓', 'Dual Swords': '⚔', Gauntlets: '🥊',
  Greatsword: '🗡', Grimoire: '📖', Lance: '🏹',
  Longsword: '⚔', Nunchaku: '🏏', Rapier: '🤺',
  Staff: '⚕', 'Sword and Shield': '🛡', Wand: '🪄',
};

const RANK_COLORS: Record<string, string> = {
  S: '#F5C84B',
  A: '#4ADE80',
  B: '#FFA958',
  C: '#F87171',
};

const SKILL_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active:   { bg: 'bg-blue-500/15',   text: 'text-blue-300',   label: 'ACTIVE'   },
  passive:  { bg: 'bg-purple-500/15', text: 'text-purple-300', label: 'PASSIVE'  },
  ultimate: { bg: 'bg-amber-500/15',  text: 'text-amber-300',  label: 'ULTIMATE' },
};

// Module-level cache — weapons fetched once per browser session
const weaponCache = new Map<string, Weapon>();
let weaponFetchPromise: Promise<void> | null = null;

function loadWeapons() {
  if (weaponFetchPromise) return weaponFetchPromise;
  weaponFetchPromise = fetch('/api/weapons')
    .then(r => r.json())
    .then((list: Weapon[]) => {
      if (Array.isArray(list)) for (const w of list) weaponCache.set(w.id, w);
    })
    .catch(() => {});
  return weaponFetchPromise;
}

function RankPill({ label, rank }: { label: string; rank: string | null }) {
  const color = rank ? (RANK_COLORS[rank] ?? 'rgba(255,255,255,0.20)') : 'rgba(255,255,255,0.20)';
  return (
    <div className="flex-1 flex flex-col items-center py-2 px-1 bg-white/[0.04] border border-white/[0.06] rounded-xl">
      <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-1">{label}</span>
      <span className="text-[13px] font-mono font-bold" style={{ color }}>{rank ?? '—'}</span>
    </div>
  );
}

interface Props {
  character: Character | null;
  onClose: () => void;
  owned?: boolean;
  onToggle?: (id: string) => void;
}

export function CharacterDetail({ character, onClose, owned = false, onToggle }: Props) {
  const [weaponName, setWeaponName] = useState<string | null>(null);

  useEffect(() => {
    if (!character?.recommended_weapon_id) { setWeaponName(null); return; }
    const cached = weaponCache.get(character.recommended_weapon_id);
    if (cached) { setWeaponName(cached.name); return; }
    loadWeapons().then(() => {
      const w = weaponCache.get(character.recommended_weapon_id!);
      setWeaponName(w?.name ?? null);
    });
  }, [character?.recommended_weapon_id]);

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
            <div className="flex gap-2 flex-wrap">
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

          {/* Tier Rankings */}
          {(character.pve_rank || character.pvp_rank || character.boss_rank) && (
            <div>
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Tier Rankings</div>
              <div className="flex gap-2">
                <RankPill label="PVE"  rank={character.pve_rank ?? null} />
                <RankPill label="BOSS" rank={character.boss_rank ?? null} />
                <RankPill label="PVP"  rank={character.pvp_rank ?? null} />
              </div>
            </div>
          )}

          {/* Skills */}
          {character.skills && character.skills.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Skills</div>
              <div className="space-y-2">
                {character.skills.map((skill, i) => {
                  const style = SKILL_TYPE_STYLES[skill.type] ?? SKILL_TYPE_STYLES.active;
                  return (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[12px] font-mono font-semibold text-white/90">{skill.name}</span>
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-white/40 leading-relaxed">{skill.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Weapon */}
          {character.recommended_weapon_id && (
            <div>
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Recommended Weapon</div>
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5">
                <span className="text-[12px] font-mono text-white/70 flex-1">
                  {weaponName ?? '…'}
                </span>
                {character.f2p_friendly && (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                    F2P
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Ownership toggle */}
          <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
            <div>
              <div className="text-[12px] font-mono font-semibold text-white/80">I own this character</div>
              <div className="text-[10px] font-mono text-white/30 mt-0.5">Affects team coverage scores</div>
            </div>
            <button
              onClick={() => onToggle?.(character.id)}
              className="w-12 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200"
              style={{ background: owned ? '#F5C84B' : 'rgba(255,255,255,0.10)' }}
              aria-label={owned ? 'Unmark as owned' : 'Mark as owned'}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                animate={{ left: owned ? '24px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              />
            </button>
          </div>

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
