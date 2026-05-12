'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { Weapon, Tier, Character } from '@/types/game';

export const WEAPON_ICONS: Record<string, string> = {
  Axe: '🪓', 'Dual Swords': '⚔', Gauntlets: '🥊',
  Greatsword: '🗡', Grimoire: '📖', Lance: '🏹',
  Longsword: '⚔', Nunchaku: '🏏', Rapier: '🤺',
  Staff: '⚕', 'Sword and Shield': '🛡', Wand: '🪄',
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
  const charNames = weapon.character_ids.length
    ? weapon.character_ids.map(id => characterMap[id]?.name).filter(Boolean).join(', ')
    : null;

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
        {weapon.image_url ? (
          <Image src={weapon.image_url} alt={weapon.weapon_type} width={28} height={28} className="object-contain" />
        ) : (
          <span className="text-white/40 text-base">{WEAPON_ICONS[weapon.weapon_type] ?? '•'}</span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-mono font-bold" style={{ color: TIER_COLORS[weapon.tier] }}>
            {weapon.tier}
          </span>
          {weapon.weapon_set_name && (
            <span className="text-[9px] font-mono text-white/30">· {weapon.weapon_set_name}</span>
          )}
        </div>

        <div className="text-[12px] font-mono text-white/80 leading-tight truncate">
          {weapon.name}
        </div>

        {(weapon.main_stat || weapon.sub_stat) && (
          <div className="flex items-center gap-2 mt-0.5">
            {weapon.main_stat && (
              <span className="text-[9px] font-mono text-white/35">{weapon.main_stat}</span>
            )}
            {weapon.main_stat && weapon.sub_stat && (
              <span className="text-[9px] font-mono text-white/20">·</span>
            )}
            {weapon.sub_stat && (
              <span className="text-[9px] font-mono text-[#F5C84B]/50">{weapon.sub_stat}</span>
            )}
          </div>
        )}

        {weapon.passive_description && (
          <p className="text-[10px] font-mono text-white/40 line-clamp-2 mt-0.5 leading-tight">
            {weapon.passive_description}
          </p>
        )}

        {charNames && (
          <p className="text-[9px] font-mono text-white/25 mt-0.5 truncate">
            {charNames}
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
