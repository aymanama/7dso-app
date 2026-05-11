'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { Weapon, Tier, Character } from '@/types/game';

export const WEAPON_ICONS: Record<string, string> = {
  Axe: '🪓', Book: '📖', Cudgel: '🏏',
  'Dual Swords': '⚔', Gauntlets: '🥊', Greatsword: '🗡',
  Lance: '🏹', Longsword: '⚔', Rapier: '🤺',
  Shield: '🛡', Staff: '⚕', Wand: '🪄',
};

const TIER_COLORS: Record<Tier, string> = {
  SSR: '#F5C84B',
  SR:  '#B58CFF',
};

interface Props {
  weapon: Weapon;
  owned: boolean;
  onToggle: () => void;
  characterMap: Record<string, Character>;
}

export function WeaponToggleItem({ weapon, owned, onToggle, characterMap }: Props) {
  const charName = weapon.character_id
    ? (characterMap[weapon.character_id]?.name ?? 'Universal')
    : 'Universal';

  return (
    <motion.button
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 transition-colors',
        owned ? 'bg-white/[0.04]' : 'bg-transparent'
      )}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
    >
      <span className="text-white/40 text-base flex-shrink-0">
        {WEAPON_ICONS[weapon.weapon_type] ?? '•'}
      </span>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-mono font-bold" style={{ color: TIER_COLORS[weapon.tier] }}>
            {weapon.tier}
          </span>
          <span className="text-[9px] font-mono text-white/30">{charName}</span>
        </div>
        <div className="text-[12px] font-mono text-white/80 leading-tight truncate">
          {weapon.name}
        </div>
        {weapon.passive_description && (
          <p className="text-[10px] font-mono text-white/40 line-clamp-2 mt-0.5 leading-tight">
            {weapon.passive_description}
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
