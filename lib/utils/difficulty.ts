export const DIFFICULTY_META: Record<string, { color: string; bg: string }> = {
  'Easy':      { color: '#86E3A1', bg: 'rgba(134,227,161,0.15)' },
  'Normal':    { color: '#7FD8FF', bg: 'rgba(127,216,255,0.15)' },
  'Hard':      { color: '#FFA958', bg: 'rgba(255,169,88,0.15)'  },
  'Nightmare': { color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  'Hell':      { color: '#FF4444', bg: 'rgba(255,68,68,0.15)'   },
  'Abyss':     { color: '#B58CFF', bg: 'rgba(181,140,255,0.15)' },
  'Timespace': { color: '#F5C84B', bg: 'rgba(245,200,75,0.15)'  },
};

export function getDifficultyMeta(d: string) {
  if (d.startsWith('World')) return { color: '#5EEAD4', bg: 'rgba(94,234,212,0.15)' };
  return DIFFICULTY_META[d] ?? { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.08)' };
}
