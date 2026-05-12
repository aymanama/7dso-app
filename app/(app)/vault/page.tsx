'use client';
import { useState, useEffect, useMemo } from 'react';
import { GearToggleItem } from '@/components/vault/GearToggleItem';
import { ArmorToggleItem } from '@/components/vault/ArmorToggleItem';
import { WeaponToggleItem, WEAPON_ICONS } from '@/components/vault/WeaponToggleItem';
import { EngravementToggleItem } from '@/components/vault/EngravementToggleItem';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { useInventory } from '@/hooks/useInventory';
import { useArmorInventory } from '@/hooks/useArmorInventory';
import { useWeaponInventory } from '@/hooks/useWeaponInventory';
import { useEngravementInventory } from '@/hooks/useEngravementInventory';
import { cn } from '@/lib/utils/cn';
import type { Accessory, ArmorPiece, Weapon, Character, Engravement } from '@/types/game';

type Tab = 'accessories' | 'armor' | 'weapons' | 'engravements';
const SLOT_ORDER = ['ring', 'necklace', 'earring'] as const;

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-16 px-5 text-center">
      <span className="text-5xl text-white/10">⬡</span>
      <p className="text-sm font-mono text-white/40 mt-3">No {label} data yet</p>
      <p className="text-[11px] font-mono text-white/20 mt-1">
        Data will appear once your Supabase tables are seeded.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-5 space-y-3 mt-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />
      ))}
    </div>
  );
}

export default function VaultPage() {
  const userId = useAnonymousAuth();

  const [activeTab, setActiveTab] = useState<Tab>('accessories');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showUnownedOnly, setShowUnownedOnly] = useState(false);

  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [accessoriesLoading, setAccessoriesLoading] = useState(true);
  const { owned: accessoryOwned, toggle: toggleAccessory, setMany: setManyAccessory } = useInventory(userId);

  const [armorPieces, setArmorPieces] = useState<ArmorPiece[]>([]);
  const [armorLoading, setArmorLoading] = useState(true);
  const { owned: armorOwned, toggle: toggleArmor, setMany: setManyArmor } = useArmorInventory(userId);

  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [weaponsLoading, setWeaponsLoading] = useState(true);
  const { owned: weaponOwned, toggle: toggleWeapon, setMany: setManyWeapon } = useWeaponInventory(userId);

  const [engravements, setEngravements] = useState<Engravement[]>([]);
  const [engravementsLoading, setEngravementsLoading] = useState(true);
  const { owned: engravementOwned, toggle: toggleEngravement, setMany: setManyEngravement } = useEngravementInventory(userId);

  const [characterMap, setCharacterMap] = useState<Record<string, Character>>({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetch('/api/accessories')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : [])
      .then(setAccessories)
      .finally(() => setAccessoriesLoading(false));

    fetch('/api/armor')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : [])
      .then(setArmorPieces)
      .finally(() => setArmorLoading(false));

    fetch('/api/weapons')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : [])
      .then(setWeapons)
      .finally(() => setWeaponsLoading(false));

    fetch('/api/engravements')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : [])
      .then(setEngravements)
      .finally(() => setEngravementsLoading(false));

    fetch('/api/characters')
      .then(r => r.json())
      .then((chars: Character[]) => {
        if (!Array.isArray(chars)) return;
        const map: Record<string, Character> = {};
        for (const c of chars) map[c.id] = c;
        setCharacterMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/inventory?userId=${userId}`)
      .then(r => r.json())
      .then((data: Record<string, boolean>) => setManyAccessory(data))
      .catch(() => {});
    fetch(`/api/inventory?userId=${userId}&type=armor`)
      .then(r => r.json())
      .then((data: Record<string, boolean>) => setManyArmor(data))
      .catch(() => {});
    fetch(`/api/inventory?userId=${userId}&type=weapon`)
      .then(r => r.json())
      .then((data: Record<string, boolean>) => setManyWeapon(data))
      .catch(() => {});
    fetch(`/api/inventory?userId=${userId}&type=engravement`)
      .then(r => r.json())
      .then((data: Record<string, boolean>) => setManyEngravement(data))
      .catch(() => {});
  }, [userId, setManyAccessory, setManyArmor, setManyWeapon, setManyEngravement]);

  const filteredAccessories = useMemo(() =>
    accessories
      .filter(a => a.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .filter(a => !showUnownedOnly || !accessoryOwned[a.id]),
    [accessories, debouncedSearch, showUnownedOnly, accessoryOwned]
  );

  const filteredArmor = useMemo(() =>
    armorPieces
      .filter(a => a.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .filter(a => !showUnownedOnly || !armorOwned[a.id]),
    [armorPieces, debouncedSearch, showUnownedOnly, armorOwned]
  );

  const filteredWeapons = useMemo(() =>
    weapons
      .filter(w => w.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .filter(w => !showUnownedOnly || !weaponOwned[w.id]),
    [weapons, debouncedSearch, showUnownedOnly, weaponOwned]
  );

  const filteredEngravements = useMemo(() =>
    engravements
      .filter(e => {
        const charName = characterMap[e.character_id]?.name ?? e.character_id;
        const q = debouncedSearch.toLowerCase();
        return e.name.toLowerCase().includes(q) || charName.toLowerCase().includes(q);
      })
      .filter(e => !showUnownedOnly || !engravementOwned[e.id]),
    [engravements, debouncedSearch, showUnownedOnly, engravementOwned, characterMap]
  );

  const groupedAccessories = useMemo(() => {
    const map: Record<string, Accessory[]> = { ring: [], necklace: [], earring: [] };
    for (const a of filteredAccessories) map[a.slot]?.push(a);
    return map;
  }, [filteredAccessories]);

  const groupedArmor = useMemo(() => {
    const map: Record<string, ArmorPiece[]> = {};
    for (const a of filteredArmor) {
      const key = a.set_name ?? 'Uncategorized';
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [filteredArmor]);

  const groupedWeapons = useMemo(() => {
    const map: Record<string, Weapon[]> = {};
    for (const w of filteredWeapons) {
      if (!map[w.weapon_type]) map[w.weapon_type] = [];
      map[w.weapon_type].push(w);
    }
    return map;
  }, [filteredWeapons]);

  const groupedEngravements = useMemo(() => {
    const map: Record<string, Engravement[]> = {};
    for (const e of filteredEngravements) {
      const charName = characterMap[e.character_id]?.name ?? e.character_id;
      if (!map[charName]) map[charName] = [];
      map[charName].push(e);
    }
    return map;
  }, [filteredEngravements, characterMap]);

  const activeOwnedCount = activeTab === 'accessories'
    ? accessories.filter(a => accessoryOwned[a.id]).length
    : activeTab === 'armor'
    ? armorPieces.filter(a => armorOwned[a.id]).length
    : activeTab === 'engravements'
    ? engravements.filter(e => engravementOwned[e.id]).length
    : weapons.filter(w => weaponOwned[w.id]).length;

  const activeTotalCount = activeTab === 'accessories'
    ? accessories.length
    : activeTab === 'armor'
    ? armorPieces.length
    : activeTab === 'engravements'
    ? engravements.length
    : weapons.length;

  const isLoading = activeTab === 'accessories' ? accessoriesLoading
    : activeTab === 'armor' ? armorLoading
    : activeTab === 'engravements' ? engravementsLoading
    : weaponsLoading;

  return (
    <div className="pt-5">
      <div className="px-5 mb-4">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
          7DS Origin · Smart Strategist
        </div>
        <h1 className="font-mono font-bold text-2xl text-white">Vault</h1>
        <p className="text-xs font-mono text-white/30 mt-1">
          {activeOwnedCount} / {activeTotalCount} pieces owned
        </p>
      </div>

      <div className="sticky top-0 z-10 bg-[#0B0E14]/90 backdrop-blur-sm px-5 pb-3 pt-1">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search gear..."
            className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 outline-none focus:border-white/20"
          />
          <button
            onClick={() => setShowUnownedOnly(v => !v)}
            className={cn(
              'text-[11px] font-mono font-semibold px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors',
              showUnownedOnly
                ? 'bg-[#F5C84B]/15 text-[#F5C84B] border-[#F5C84B]/30'
                : 'bg-white/[0.04] text-white/40 border-white/[0.06]'
            )}
          >
            Not owned only
          </button>
          <span className="text-[11px] font-mono text-white/30 whitespace-nowrap">
            {activeOwnedCount} / {activeTotalCount}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['accessories', 'armor', 'weapons', 'engravements'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-mono font-semibold capitalize transition-all',
                activeTab === tab
                  ? 'bg-[#F5C84B] text-[#0B0E14]'
                  : 'bg-white/[0.06] text-white/40'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : activeTab === 'accessories' ? (
        <div>
          {filteredAccessories.length === 0 ? (
            <EmptyState label={accessories.length === 0 ? 'accessories' : 'matching items'} />
          ) : (
            SLOT_ORDER.map(slot => {
              const items = groupedAccessories[slot] ?? [];
              if (!items.length) return null;
              return (
                <div key={slot} className="mb-4">
                  <div className="px-5 py-2 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/[0.04]">
                    {slot}s ({items.filter(a => accessoryOwned[a.id]).length}/{items.length})
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {items.map(a => (
                      <GearToggleItem
                        key={a.id}
                        accessory={a}
                        owned={!!accessoryOwned[a.id]}
                        onToggle={() => toggleAccessory(a.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'armor' ? (
        <div>
          {filteredArmor.length === 0 ? (
            <EmptyState label={armorPieces.length === 0 ? 'armor' : 'matching items'} />
          ) : (
            Object.entries(groupedArmor).map(([setName, items]) => {
              const ownedCount = items.filter(a => armorOwned[a.id]).length;
              const sample = items[0];
              return (
                <div key={setName} className="mb-4">
                  <div className="px-5 py-2 border-b border-white/[0.04]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                        {setName}
                      </span>
                      <span className="text-[10px] font-mono text-white/30">
                        {ownedCount}/{items.length} pieces
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {ownedCount >= 2 && sample?.two_pc_bonus && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#FFA958]/15 text-[#FFA958]">
                          2pc: {sample.two_pc_bonus}
                        </span>
                      )}
                      {ownedCount >= 4 && sample?.four_pc_bonus && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#5EEAD4]/15 text-[#5EEAD4]">
                          4pc: {sample.four_pc_bonus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {items.map(a => (
                      <ArmorToggleItem
                        key={a.id}
                        armor={a}
                        owned={!!armorOwned[a.id]}
                        onToggle={() => toggleArmor(a.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'engravements' ? (
        <div>
          {filteredEngravements.length === 0 ? (
            <EmptyState label={engravements.length === 0 ? 'engravements' : 'matching items'} />
          ) : (
            Object.entries(groupedEngravements).map(([charName, items]) => {
              const ownedCount = items.filter(e => engravementOwned[e.id]).length;
              return (
                <div key={charName} className="mb-4">
                  <div className="px-5 py-2 border-b border-white/[0.04] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      {charName}
                    </span>
                    <span className="text-[10px] font-mono text-white/30">
                      {ownedCount}/{items.length} owned
                    </span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {items.map(e => (
                      <EngravementToggleItem
                        key={e.id}
                        engravement={e}
                        characterName={charName}
                        owned={!!engravementOwned[e.id]}
                        onToggle={() => toggleEngravement(e.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div>
          {filteredWeapons.length === 0 ? (
            <EmptyState label={weapons.length === 0 ? 'weapons' : 'matching items'} />
          ) : (
            Object.entries(groupedWeapons).map(([weaponType, items]) => {
              const ownedCount = items.filter(w => weaponOwned[w.id]).length;
              return (
                <div key={weaponType} className="mb-4">
                  <div className="px-5 py-2 border-b border-white/[0.04] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      {WEAPON_ICONS[weaponType] ?? '•'} {weaponType}
                    </span>
                    <span className="text-[10px] font-mono text-white/30">
                      {ownedCount}/{items.length} owned
                    </span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {items.map(w => (
                      <WeaponToggleItem
                        key={w.id}
                        weapon={w}
                        owned={!!weaponOwned[w.id]}
                        onToggle={() => toggleWeapon(w.id)}
                        characterMap={characterMap}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
