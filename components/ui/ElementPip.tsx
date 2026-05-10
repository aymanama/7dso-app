'use client';
import { ELEMENT_META } from '@/lib/utils/elements';
import type { ElementId } from '@/types/game';
import { cn } from '@/lib/utils/cn';

interface Props {
  element: ElementId;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export function ElementPip({ element, size = 8, className, showLabel = false }: Props) {
  const meta = ELEMENT_META[element];
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span
        className="rounded-full flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: meta.color,
          boxShadow: `0 0 ${size}px ${meta.glow}`,
        }}
      />
      {showLabel && (
        <span className="text-xs font-mono" style={{ color: meta.color }}>
          {meta.label}
        </span>
      )}
    </span>
  );
}
