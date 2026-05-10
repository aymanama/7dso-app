'use client';
import { motion } from 'framer-motion';
import type { Verdict } from '@/types/game';

const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; text: string }> = {
  perfect:      { label: 'PERFECT',      color: '#F5C84B', text: 'All BiS equipped. Maximum power.' },
  battle_ready: { label: 'BATTLE READY', color: '#4ADE80', text: '75%+ BiS. Competitive loadout.' },
  viable:       { label: 'VIABLE',       color: '#FFA958', text: '50%+ BiS. Some farming needed.' },
  high_risk:    { label: 'HIGH RISK',    color: '#F87171', text: 'Below 50% BiS. Significant gaps.' },
};

interface Props {
  verdict: Verdict;
  bisCount: number;
  totalSlots: number;
}

export function StrategyVerdict({ verdict, bisCount, totalSlots }: Props) {
  const cfg = VERDICT_CONFIG[verdict];
  const pct = totalSlots > 0 ? (bisCount / totalSlots) * 100 : 0;

  return (
    <div className="mx-5 mb-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-0.5">BUILD STATUS</div>
          <div className="font-mono font-bold text-sm" style={{ color: cfg.color }}>{cfg.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-lg" style={{ color: cfg.color }}>
            {bisCount}/{totalSlots}
          </div>
          <div className="text-[9px] font-mono text-white/30">BiS slots</div>
        </div>
      </div>

      {/* Fill bar */}
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: cfg.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>

      <p className="text-[11px] font-mono text-white/40">{cfg.text}</p>
    </div>
  );
}
