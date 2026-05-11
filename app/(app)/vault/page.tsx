'use client';
import { useState, useEffect, useMemo } from 'react';
import { GearToggleItem } from '@/components/vault/GearToggleItem';
import { Sigil } from '@/components/ui/Sigil';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { useInventory } from '@/hooks/useInventory';
import { useRoster } from '@/hooks/useRoster';
import type { Accessory, Character } from '@/types/game';

const SLOT_ORDER = ['ring', 'necklace', 'earring'] as const;

export default function VaultPage() {
  const userId = useAnonymousAuth();
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gear' | 'heroes'>('heroes');

  const [initialOwned, setInitialOwned] = useState<Record<string, boolean>>({});
  const { owned, toggle, setMany } = useInventory(userId, initialOwned);

  const [initialRoster, setInitialRoster] = useState<Record<string, boolean>>({});
  const { owned: roster, toggle: toggleRoster, setMany: setManyRoster } = useRoster(userId, initialRoster);

  useEffect(() => {
    Promise.all([
      fetch('/api/accessories').then(r => r.json()),
      fetch('/api/characters').then(r => r.json()),
    ]).then(([acc, chars]) => {
      if (Array.isArray(acc)) setAccessories(acc);
      if (Array.isArray(chars)) setCharacters(chars);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/inventory?userId=${userId}`)
      .then(r => r.json())
      .then((data: Record<string, boolean>) => { setInitialOwned(data); setMany(data); })
      .catch(() => {});
    fetch(`/api/roster?userId=${userId}`)
      .then(r => r.json())
      .then((data: Record<string, boolean>) => { setInitialRoster(data); setManyRoster(data); })
      .catch(() => {});
  }, [userId, setMany, setManyRoster]);

  const grouped = useMemo(() => {
    const map: Record<string, Accessory[]> = { ring: [], necklace: [], earring: [] };
    for (const a of accessories) map[a.slot]?.push(a);
    return map;
  }, [accessories]);

  const ownedGearCount = accessories.filter(a => owned[a.id]).length;
  const ownedHeroCount = characters.filter(c => roster[c.id]).length;

  const ssrChars = characters.filter(c => c.tier === 'SSR');
  const srChars  = characters.filter(c => c.tier === 'SR');

  return (
    <div className="pt-5">
      <div className="px-5 mb-4">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
          7DS Origin · Smart Strategist
        </div>
        <h1 className="font-mono font-bold text-2xl text-white">Vault</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 px-5 mb-4">
        {(['heroes', 'gear'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold transition-all"
            style={{
              background: activeTab === tab ? 'rgba(245,200,75,0.12)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab ? '#F5C84B' : 'rgba(255,255,255,0.40)',
              border: activeTab === tab ? '1px solid rgba(245,200,75,0.30)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {tab === 'heroes' ? '⚔ Heroes' : '◈ Gear'}
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            >
              {tab === 'heroes' ? `${ownedHeroCount}/${characters.length}` : `${ownedGearCount}/${accessories.length}`}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'heroes' ? (
        <div>
          {[{ label: 'SSR', chars: ssrChars }, { label: 'SR', chars: srChars }].map(({ label, chars }) => {
            if (!chars.length) return null;
            return (
              <div key={label} className="mb-4">
                <div className="px-5 py-2 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/[0.04]">
                  {label} ({chars.filter(c => roster[c.id]).length}/{chars.length})
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {chars.map(c => {
                    const isOwned = !!roster[c.id];
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleRoster(c.id)}
                        className="w-full flex items-center gap-3 px-5 py-3 transition-all text-left"
                        style={{ background: isOwned ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                      >
                        <div className="relative flex-shrink-0">
                          <Sigil name={c.name} portraitUrl={c.portrait_url} element={c.primary_element} size={48} />
                          {!isOwned && (
                            <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                              <span className="text-[9px] font-mono text-white/40 font-bold">✕</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-semibold text-[13px] leading-tight truncate"
                            style={{ color: isOwned ? '#E8ECF5' : 'rgba(232,236,245,0.35)' }}>
                            {c.name}
                          </div>
                          <div className="text-[10px] font-mono capitalize"
                            style={{ color: isOwned ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.20)' }}>
                            {c.primary_element} · {c.primary_role}
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            background: isOwned ? '#F5C84B' : 'transparent',
                            borderColor: isOwned ? '#F5C84B' : 'rgba(255,255,255,0.20)',
                          }}
                        >
                          {isOwned && <span className="text-[9px] text-black font-bold">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {SLOT_ORDER.map(slot => {
            const items = grouped[slot] ?? [];
            if (!items.length) return null;
            return (
              <div key={slot} className="mb-4">
                <div className="px-5 py-2 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/[0.04]">
                  {slot}s ({items.filter(a => owned[a.id]).length}/{items.length})
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {items.map(a => (
                    <GearToggleItem
                      key={a.id}
                      accessory={a}
                      owned={!!owned[a.id]}
                      onToggle={() => toggle(a.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
