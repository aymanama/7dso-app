'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { href: '/strategy', icon: '◆', label: 'Strategy' },
  { href: '/codex',    icon: '❒', label: 'Codex' },
  { href: '/vault',    icon: '⬡', label: 'Vault' },
  { href: '/farm',     icon: '⬢', label: 'Farm' },
  { href: '/tier-list', icon: '◈', label: 'Tiers' },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex-shrink-0 flex items-center justify-around px-4"
         style={{ background: 'linear-gradient(to top, #0B0E14 85%, transparent)', paddingTop: '12px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
      {TABS.map(tab => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-200',
              active ? 'bg-[#F5C84B]/10' : 'hover:bg-white/[0.04]'
            )}
          >
            <span
              className="text-lg leading-none"
              style={{ color: active ? '#F5C84B' : 'rgba(255,255,255,0.30)' }}
            >
              {tab.icon}
            </span>
            <span
              className={cn('text-[10px] font-mono font-semibold tracking-wide')}
              style={{ color: active ? '#F5C84B' : 'rgba(255,255,255,0.30)' }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
