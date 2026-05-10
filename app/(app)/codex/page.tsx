'use client';
import { useState, useEffect, useMemo } from 'react';
import { CodexFilters } from '@/components/codex/CodexFilters';
import { CodexCard } from '@/components/codex/CodexCard';
import { CharacterDetail } from '@/components/codex/CharacterDetail';
import type { Character, ElementId, Tier } from '@/types/game';

export default function CodexPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<Tier | 'ALL'>('ALL');
  const [element, setElement] = useState<ElementId | 'ALL'>('ALL');
  const [selected, setSelected] = useState<Character | null>(null);

  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then(setCharacters)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return characters.filter(c => {
      if (tier !== 'ALL' && c.tier !== tier) return false;
      if (element !== 'ALL' && !c.elements.includes(element)) return false;
      return true;
    });
  }, [characters, tier, element]);

  return (
    <div className="pt-5 relative">
      <div className="px-5 mb-4">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
          7DS Origin · Smart Strategist
        </div>
        <h1 className="font-mono font-bold text-2xl text-white">Codex</h1>
      </div>

      <div className="mb-4">
        <CodexFilters tier={tier} element={element} onTier={setTier} onElement={setElement} />
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-5 space-y-2">
          {filtered.map((c, i) => (
            <CodexCard
              key={c.id}
              character={c}
              delay={i * 0.04}
              onClick={() => setSelected(c)}
            />
          ))}
        </div>
      )}

      <CharacterDetail character={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
