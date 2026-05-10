'use client';
import { cn } from '@/lib/utils/cn';
import type { Tier } from '@/types/game';

interface Props {
  tier: Tier;
  className?: string;
}

export function TierBadge({ tier, className }: Props) {
  return (
    <span
      className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide', className)}
      style={
        tier === 'SSR'
          ? { background: 'linear-gradient(135deg, #F5C84B, #E8A020)', color: '#0B0E14' }
          : { background: 'linear-gradient(135deg, #B58CFF, #7A4FD4)', color: '#fff' }
      }
    >
      {tier}
    </span>
  );
}
