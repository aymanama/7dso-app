'use client';

interface Props {
  score: number; // 0–100
  size?: number;
}

const COLORS = ['#F5C84B', '#4ADE80', '#FFA958', '#F87171'] as const;

export function SynergyDial({ score, size = 32 }: Props) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const dash = pct * circ;
  const colorIdx = score >= 100 ? 0 : score >= 70 ? 1 : score >= 40 ? 2 : 3;
  const color = COLORS[colorIdx];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.5s ease' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.3} fontWeight={700}
        fontFamily="monospace" fill={color}
      >
        {score}
      </text>
    </svg>
  );
}
