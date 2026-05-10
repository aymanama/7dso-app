import type { ElementId } from '@/types/game';

export const ELEMENT_META: Record<ElementId, { label: string; color: string; glow: string }> = {
  fire:    { label: 'Fire',    color: '#FF6B4A', glow: 'rgba(255,107,74,0.45)' },
  ice:     { label: 'Ice',     color: '#7FD8FF', glow: 'rgba(127,216,255,0.45)' },
  wind:    { label: 'Wind',    color: '#86E3A1', glow: 'rgba(134,227,161,0.45)' },
  thunder: { label: 'Thunder', color: '#FFE066', glow: 'rgba(255,224,102,0.45)' },
  earth:   { label: 'Earth',   color: '#A3E635', glow: 'rgba(163,230,53,0.40)' },
  holy:    { label: 'Holy',    color: '#FFD86B', glow: 'rgba(255,216,107,0.45)' },
  dark:    { label: 'Dark',    color: '#B58CFF', glow: 'rgba(181,140,255,0.50)' },
  neutral: { label: 'Neutral', color: '#CFD3E0', glow: 'rgba(207,211,224,0.30)' },
};
