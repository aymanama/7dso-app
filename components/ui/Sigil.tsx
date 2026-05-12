'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { ELEMENT_META } from '@/lib/utils/elements';
import type { ElementId } from '@/types/game';

interface Props {
  name: string;
  portraitUrl?: string | null;
  element: ElementId;
  size?: 48 | 72;
  className?: string;
}

export function Sigil({ name, portraitUrl, element, size = 48, className }: Props) {
  const [imgError, setImgError] = useState(false);
  const meta = ELEMENT_META[element];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const px = size === 72 ? 'w-[72px] h-[72px]' : 'w-12 h-12';
  const ringWidth = size === 72 ? '3px' : '2px';

  const showImage = portraitUrl && !imgError;

  return (
    <div className={cn('relative flex-shrink-0', px, className)}>
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-[#1A1E2E]"
        style={{
          outline: `${ringWidth} solid ${meta.color}`,
          outlineOffset: '2px',
          boxShadow: `0 0 16px ${meta.glow}`,
        }}
      >
        {showImage ? (
          <Image
            src={portraitUrl}
            alt={name}
            fill
            className="object-cover object-top"
            sizes="72px"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="font-mono font-bold select-none"
            style={{ fontSize: size === 72 ? 22 : 14, color: meta.color }}
          >
            {initials}
          </span>
        )}
      </div>
      {/* corner element notch */}
      <div
        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B0E14]"
        style={{ background: meta.color, boxShadow: `0 0 6px ${meta.glow}` }}
      />
    </div>
  );
}
