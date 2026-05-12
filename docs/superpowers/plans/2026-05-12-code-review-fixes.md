# Code Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 bugs/issues surfaced by code review — stale toggle closures, My Gear verdict miscalculation, hardcoded meta-pick list, useRoster inconsistency, and service-role key over-exposure — plus add a CLAUDE.md.

**Architecture:** All changes are isolated to existing files — no new pages, no schema changes, no new API routes. The security fix adds a second server client helper; other fixes are logic corrections inside existing functions and hooks.

**Tech Stack:** Next.js 14 App Router · Supabase (@supabase/ssr) · TypeScript · Vitest + React Testing Library · Tailwind CSS

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `hooks/useInventory.ts` | Modify | Stale closure fix — functional `setOwned` updater, remove `owned` from deps |
| `hooks/useArmorInventory.ts` | Modify | Same fix |
| `hooks/useWeaponInventory.ts` | Modify | Same fix |
| `hooks/useEngravementInventory.ts` | Modify | Same fix |
| `hooks/useArmorInventory.test.ts` | Modify | Add rapid-double-toggle test |
| `hooks/useWeaponInventory.test.ts` | Modify | Add rapid-double-toggle test |
| `hooks/useRoster.ts` | Modify | Replace raw fetch with Supabase client + functional updater |
| `hooks/useRoster.test.ts` | Create | Tests for roster toggle behaviour |
| `lib/engine/buildEngine.ts` | Modify | Export `calcVerdict`; remove `METAPICK_IDS`; add `applyMyGearMode` |
| `lib/engine/buildEngine.test.ts` | Modify | Add tests for meta-pick + applyMyGearMode verdict |
| `app/(app)/strategy/page.tsx` | Modify | Import `applyMyGearMode` from engine (remove local copy) |
| `lib/supabase/server.ts` | Modify | Add `createAdminClient()`; change `createServerClient()` to anon key |
| `app/api/builds/[bossId]/route.ts` | Modify | Use admin for public data, server client for user inventory |
| `app/api/farm/route.ts` | Modify | Same split |
| `app/api/inventory/route.ts` | Modify | Use `createServerClient()` |
| `app/api/roster/route.ts` | Modify | Use `createServerClient()` |
| `CLAUDE.md` | Create | Project context for AI sessions |

---

## Task 1 — Fix stale toggle closures in inventory hooks

**Problem:** All four inventory hooks (`useInventory`, `useArmorInventory`, `useWeaponInventory`, `useEngravementInventory`) have `toggle` callbacks that close over the `owned` state snapshot. Two rapid taps before a re-render both see the original state, so the second tap sends the wrong value to Supabase (e.g. `owned: true` twice instead of `true` then `false`).

**Fix:** Use React's functional-updater form of `setOwned` so each call reads the _latest_ queued state, not the captured snapshot. Remove `owned` from the `useCallback` dependency array.

**Files:**
- Modify: `hooks/useInventory.ts`
- Modify: `hooks/useArmorInventory.ts`
- Modify: `hooks/useWeaponInventory.ts`
- Modify: `hooks/useEngravementInventory.ts`
- Modify: `hooks/useArmorInventory.test.ts`
- Modify: `hooks/useWeaponInventory.test.ts`

---

- [ ] **Step 1.1 — Add rapid-double-toggle test to `useArmorInventory.test.ts`**

Add this case to the existing `describe` block:

```ts
it('rapid double-toggle produces correct DB calls (no stale closure)', async () => {
  const { result } = renderHook(() =>
    useArmorInventory('user-123', { armor1: false })
  );
  // Fire both toggles without awaiting between them
  await act(async () => {
    result.current.toggle('armor1');
    result.current.toggle('armor1');
  });
  // Two distinct DB calls with opposing values
  expect(mockUpsert).toHaveBeenCalledTimes(2);
  expect(mockUpsert).toHaveBeenNthCalledWith(1,
    { user_id: 'user-123', armor_id: 'armor1', owned: true },
    { onConflict: 'user_id,armor_id' }
  );
  expect(mockUpsert).toHaveBeenNthCalledWith(2,
    { user_id: 'user-123', armor_id: 'armor1', owned: false },
    { onConflict: 'user_id,armor_id' }
  );
  // Final UI state: back to false (toggled twice)
  expect(result.current.owned['armor1']).toBe(false);
});
```

- [ ] **Step 1.2 — Run test to confirm it fails**

```bash
npx --prefix /tmp/7dso-app vitest run hooks/useArmorInventory.test.ts 2>&1
```

Expected: the new test FAILs (mockUpsert called twice but both with `owned: true`).

- [ ] **Step 1.3 — Fix `useArmorInventory.ts`**

Replace the entire `toggle` callback:

```ts
// Before
const toggle = useCallback(async (armorId: string) => {
  const next = !owned[armorId];
  setOwned(prev => ({ ...prev, [armorId]: next }));
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('user_armor').upsert(
    { user_id: userId, armor_id: armorId, owned: next },
    { onConflict: 'user_id,armor_id' }
  );
}, [userId, owned]);

// After
const toggle = useCallback(async (armorId: string) => {
  let next = false;
  setOwned(prev => {
    next = !prev[armorId];
    return { ...prev, [armorId]: next };
  });
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('user_armor').upsert(
    { user_id: userId, armor_id: armorId, owned: next },
    { onConflict: 'user_id,armor_id' }
  );
}, [userId]);
```

- [ ] **Step 1.4 — Run tests to confirm they pass**

```bash
npx --prefix /tmp/7dso-app vitest run hooks/useArmorInventory.test.ts 2>&1
```

Expected: all 7 tests PASS.

- [ ] **Step 1.5 — Add the same rapid-double-toggle test to `useWeaponInventory.test.ts`**

```ts
it('rapid double-toggle produces correct DB calls (no stale closure)', async () => {
  const { result } = renderHook(() =>
    useWeaponInventory('user-456', { wpn1: false })
  );
  await act(async () => {
    result.current.toggle('wpn1');
    result.current.toggle('wpn1');
  });
  expect(mockUpsert).toHaveBeenCalledTimes(2);
  expect(mockUpsert).toHaveBeenNthCalledWith(1,
    { user_id: 'user-456', weapon_id: 'wpn1', owned: true },
    { onConflict: 'user_id,weapon_id' }
  );
  expect(mockUpsert).toHaveBeenNthCalledWith(2,
    { user_id: 'user-456', weapon_id: 'wpn1', owned: false },
    { onConflict: 'user_id,weapon_id' }
  );
  expect(result.current.owned['wpn1']).toBe(false);
});
```

- [ ] **Step 1.6 — Fix `useWeaponInventory.ts`**

```ts
// After (replace toggle callback)
const toggle = useCallback(async (weaponId: string) => {
  let next = false;
  setOwned(prev => {
    next = !prev[weaponId];
    return { ...prev, [weaponId]: next };
  });
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('user_weapons').upsert(
    { user_id: userId, weapon_id: weaponId, owned: next },
    { onConflict: 'user_id,weapon_id' }
  );
}, [userId]);
```

- [ ] **Step 1.7 — Run weapon tests**

```bash
npx --prefix /tmp/7dso-app vitest run hooks/useWeaponInventory.test.ts 2>&1
```

Expected: all 7 tests PASS.

- [ ] **Step 1.8 — Fix `useInventory.ts`** (no test file exists — apply pattern, no new test needed here)

```ts
// After (replace toggle callback)
const toggle = useCallback(async (accessoryId: string) => {
  let next = false;
  setOwned(prev => {
    next = !prev[accessoryId];
    return { ...prev, [accessoryId]: next };
  });
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('user_inventory').upsert(
    { user_id: userId, accessory_id: accessoryId, owned: next },
    { onConflict: 'user_id,accessory_id' }
  );
}, [userId]);
```

- [ ] **Step 1.9 — Fix `useEngravementInventory.ts`**

```ts
// After (replace toggle callback)
const toggle = useCallback(async (engravementId: string) => {
  let next = false;
  setOwned(prev => {
    next = !prev[engravementId];
    return { ...prev, [engravementId]: next };
  });
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('user_engravements').upsert(
    { user_id: userId, engravement_id: engravementId, owned: next },
    { onConflict: 'user_id,engravement_id' }
  );
}, [userId]);
```

- [ ] **Step 1.10 — Run full test suite**

```bash
npx --prefix /tmp/7dso-app vitest run 2>&1
```

Expected: all tests PASS.

- [ ] **Step 1.11 — Commit**

```bash
cd /tmp/7dso-app && git add hooks/useInventory.ts hooks/useArmorInventory.ts hooks/useWeaponInventory.ts hooks/useEngravementInventory.ts hooks/useArmorInventory.test.ts hooks/useWeaponInventory.test.ts
git commit -m "fix: remove stale closure from inventory toggle callbacks"
```

---

## Task 2 — Fix useRoster inconsistency

**Problem:** `useRoster` uses raw `fetch('/api/roster', { method: 'PATCH', ... })` while every other inventory hook calls Supabase directly. The API route exists but is an unnecessary round-trip; it also lacks the functional-updater fix from Task 1.

**Fix:** Replace the raw fetch with a Supabase client call, add the functional-updater pattern, and create a test file.

**Files:**
- Modify: `hooks/useRoster.ts`
- Create: `hooks/useRoster.test.ts`

---

- [ ] **Step 2.1 — Create `hooks/useRoster.test.ts`**

```ts
import { renderHook, act } from '@testing-library/react';
import { vi, it, expect, describe, beforeEach } from 'vitest';

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (_table: string) => ({ upsert: mockUpsert }),
  }),
}));

import { useRoster } from './useRoster';

describe('useRoster', () => {
  beforeEach(() => mockUpsert.mockClear());

  it('initializes from initial prop', () => {
    const { result } = renderHook(() => useRoster(null, { escanor: true }));
    expect(result.current.owned['escanor']).toBe(true);
  });

  it('optimistically toggles false → true', async () => {
    const { result } = renderHook(() => useRoster(null, { escanor: false }));
    await act(async () => { await result.current.toggle('escanor'); });
    expect(result.current.owned['escanor']).toBe(true);
  });

  it('optimistically toggles true → false', async () => {
    const { result } = renderHook(() => useRoster(null, { escanor: true }));
    await act(async () => { await result.current.toggle('escanor'); });
    expect(result.current.owned['escanor']).toBe(false);
  });

  it('does not call supabase when userId is null', async () => {
    const { result } = renderHook(() => useRoster(null, {}));
    await act(async () => { await result.current.toggle('escanor'); });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('calls supabase upsert with correct payload', async () => {
    const { result } = renderHook(() => useRoster('user-789', { escanor: false }));
    await act(async () => { await result.current.toggle('escanor'); });
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: 'user-789', character_id: 'escanor', owned: true },
      { onConflict: 'user_id,character_id' }
    );
  });

  it('rapid double-toggle produces correct DB calls', async () => {
    const { result } = renderHook(() => useRoster('user-789', { escanor: false }));
    await act(async () => {
      result.current.toggle('escanor');
      result.current.toggle('escanor');
    });
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenNthCalledWith(1,
      { user_id: 'user-789', character_id: 'escanor', owned: true },
      { onConflict: 'user_id,character_id' }
    );
    expect(mockUpsert).toHaveBeenNthCalledWith(2,
      { user_id: 'user-789', character_id: 'escanor', owned: false },
      { onConflict: 'user_id,character_id' }
    );
  });

  it('setMany replaces entire owned state', () => {
    const { result } = renderHook(() => useRoster(null, {}));
    act(() => { result.current.setMany({ escanor: true, meliodas: false }); });
    expect(result.current.owned['escanor']).toBe(true);
    expect(result.current.owned['meliodas']).toBe(false);
  });
});
```

- [ ] **Step 2.2 — Run tests to confirm they fail**

```bash
npx --prefix /tmp/7dso-app vitest run hooks/useRoster.test.ts 2>&1
```

Expected: multiple FAILs (hook uses raw fetch, not Supabase mock).

- [ ] **Step 2.3 — Replace `hooks/useRoster.ts` entirely**

```ts
'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRoster(userId: string | null, initial: Record<string, boolean> = {}) {
  const [owned, setOwned] = useState(initial);

  const toggle = useCallback(async (characterId: string) => {
    let next = false;
    setOwned(prev => {
      next = !prev[characterId];
      return { ...prev, [characterId]: next };
    });
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('user_characters').upsert(
      { user_id: userId, character_id: characterId, owned: next },
      { onConflict: 'user_id,character_id' }
    );
  }, [userId]);

  const setMany = useCallback((map: Record<string, boolean>) => setOwned(map), []);

  return { owned, toggle, setMany };
}
```

- [ ] **Step 2.4 — Run tests to confirm they pass**

```bash
npx --prefix /tmp/7dso-app vitest run hooks/useRoster.test.ts 2>&1
```

Expected: all 7 tests PASS.

- [ ] **Step 2.5 — Run full test suite**

```bash
npx --prefix /tmp/7dso-app vitest run 2>&1
```

Expected: all tests PASS.

- [ ] **Step 2.6 — Commit**

```bash
cd /tmp/7dso-app && git add hooks/useRoster.ts hooks/useRoster.test.ts
git commit -m "fix: replace useRoster raw fetch with Supabase client + functional updater"
```

---

## Task 3 — Fix My Gear verdict miscalculation

**Problem:** `applyMyGearMode` in `strategy/page.tsx` neutralises FARM badges by setting `isBis: true` on unowned gear, but it does **not** recompute `bisCount` or `verdict`. The "BATTLE READY 8/12" score shown in My Gear mode reflects the _optimal build_, not the user's actual gear. The function is also a local page utility — moving it to `buildEngine.ts` lets it reuse the already-existing `calcVerdict`.

**Fix:**
1. Export `calcVerdict` from `buildEngine.ts`.
2. Move `applyMyGearMode` into `buildEngine.ts`, recomputing `bisCount` and `verdict`.
3. Replace the local copy in `strategy/page.tsx` with the import.

**Files:**
- Modify: `lib/engine/buildEngine.ts`
- Modify: `lib/engine/buildEngine.test.ts`
- Modify: `app/(app)/strategy/page.tsx`

---

- [ ] **Step 3.1 — Add failing test to `buildEngine.test.ts`**

Add below the existing `describe('resolveBuild', ...)` block:

```ts
import { applyMyGearMode } from './buildEngine';
import type { ResolvedBuild, ResolvedGear } from '@/types/game';

// ─── applyMyGearMode tests ────────────────────────────────────────────────────

const makeGear = (overrides: Partial<ResolvedGear>): ResolvedGear => ({
  item: bisRing, isBis: false, isOwned: false, matchedStatTag: null,
  bisItem: bisRing, isCounter: false, farmFromBoss: 'Galland', allOwnedMatchCount: 0,
  ...overrides,
});

describe('applyMyGearMode', () => {
  it('does not touch gear the user owns', () => {
    const build: ResolvedBuild = {
      bossId: 'galland', teamIndex: 0, teamName: 'Team A',
      bisCount: 1, totalSlots: 3, verdict: 'viable',
      ownedCharacterCount: 1, alternativeSetName: null,
      slots: [{
        character, slotIndex: 0,
        ring:     makeGear({ isBis: true,  isOwned: true }),
        necklace: makeGear({ isBis: false, isOwned: true,  matchedStatTag: 'dark_dmg' }),
        earring:  makeGear({ isBis: false, isOwned: false }),
        subCount: 1, synergyScore: 82, isOwned: true,
        countersWeakness: false, isMetapick: false,
      }],
    };

    const result = applyMyGearMode(build);
    expect(result.slots[0].ring.isBis).toBe(true);     // unchanged — owned BiS
    expect(result.slots[0].necklace.isBis).toBe(false); // unchanged — owned sub
  });

  it('sets isBis:true on unowned gear', () => {
    const build: ResolvedBuild = {
      bossId: 'galland', teamIndex: 0, teamName: 'Team A',
      bisCount: 0, totalSlots: 3, verdict: 'high_risk',
      ownedCharacterCount: 1, alternativeSetName: null,
      slots: [{
        character, slotIndex: 0,
        ring:     makeGear({ isBis: false, isOwned: false }),
        necklace: makeGear({ isBis: false, isOwned: false }),
        earring:  makeGear({ isBis: false, isOwned: false }),
        subCount: 0, synergyScore: 100, isOwned: true,
        countersWeakness: false, isMetapick: false,
      }],
    };

    const result = applyMyGearMode(build);
    expect(result.slots[0].ring.isBis).toBe(true);
    expect(result.slots[0].necklace.isBis).toBe(true);
    expect(result.slots[0].earring.isBis).toBe(true);
  });

  it('recomputes bisCount and verdict after neutralising unowned slots', () => {
    // 1 owned BiS + 2 unowned → after applyMyGearMode all 3 count as BiS
    const build: ResolvedBuild = {
      bossId: 'galland', teamIndex: 0, teamName: 'Team A',
      bisCount: 1, totalSlots: 3, verdict: 'viable', // wrong verdict pre-apply
      ownedCharacterCount: 1, alternativeSetName: null,
      slots: [{
        character, slotIndex: 0,
        ring:     makeGear({ isBis: true,  isOwned: true }),
        necklace: makeGear({ isBis: false, isOwned: false }),
        earring:  makeGear({ isBis: false, isOwned: false }),
        subCount: 0, synergyScore: 100, isOwned: true,
        countersWeakness: false, isMetapick: false,
      }],
    };

    const result = applyMyGearMode(build);
    expect(result.bisCount).toBe(3);     // recomputed
    expect(result.verdict).toBe('perfect'); // recomputed
  });
});
```

- [ ] **Step 3.2 — Run to confirm tests fail**

```bash
npx --prefix /tmp/7dso-app vitest run lib/engine/buildEngine.test.ts 2>&1
```

Expected: `applyMyGearMode` import FAILs (not exported).

- [ ] **Step 3.3 — Export `calcVerdict` and add `applyMyGearMode` to `buildEngine.ts`**

Change `calcVerdict` from private to exported:

```ts
// Before
function calcVerdict(bisCount: number, total: number): Verdict {

// After
export function calcVerdict(bisCount: number, total: number): Verdict {
```

Add `applyMyGearMode` at the bottom of the file, before the last export:

```ts
/**
 * "My Gear" mode — neutralise FARM badges for unowned slots by flipping isBis,
 * then recompute bisCount and verdict so the score reflects the user's real loadout.
 */
export function applyMyGearMode(build: ResolvedBuild): ResolvedBuild {
  const neutralize = (gear: ResolvedGear): ResolvedGear =>
    gear.isOwned ? gear : { ...gear, isBis: true };

  const slots = build.slots.map(slot => ({
    ...slot,
    ring:     neutralize(slot.ring),
    necklace: neutralize(slot.necklace),
    earring:  neutralize(slot.earring),
  }));

  const bisCount = slots.reduce(
    (sum, slot) =>
      sum + [slot.ring, slot.necklace, slot.earring].filter(g => g.isBis).length,
    0,
  );

  return { ...build, slots, bisCount, verdict: calcVerdict(bisCount, build.totalSlots) };
}
```

Also add `ResolvedGear` to the import at the top of `buildEngine.ts` (it's already there — verify it is):

```ts
import type {
  Boss, BuildSlot, Accessory, Character,
  ResolvedGear, ResolvedCharacter, ResolvedBuild, Verdict,
} from '@/types/game';
```

- [ ] **Step 3.4 — Run tests to confirm they pass**

```bash
npx --prefix /tmp/7dso-app vitest run lib/engine/buildEngine.test.ts 2>&1
```

Expected: all tests PASS.

- [ ] **Step 3.5 — Update `app/(app)/strategy/page.tsx`**

Remove the local `applyMyGearMode` function (lines 11–24) and add the import:

```ts
// Add to imports at the top
import { applyMyGearMode } from '@/lib/engine/buildEngine';
```

Remove these lines from the file:

```ts
// In "My Gear" mode, unowned slots show the BiS target without any FARM badge.
function applyMyGearMode(build: ResolvedBuild): ResolvedBuild {
  const neutralize = (gear: ResolvedGear): ResolvedGear =>
    gear.isOwned ? gear : { ...gear, isBis: true };

  return {
    ...build,
    slots: build.slots.map(slot => ({
      ...slot,
      ring:     neutralize(slot.ring),
      necklace: neutralize(slot.necklace),
      earring:  neutralize(slot.earring),
    })),
  };
}
```

Remove `ResolvedGear` from the import on line 8 if it's no longer used in the page (check first — it may still be needed for the `applyMyGearMode` parameter type in the original code, but since that function is now gone, it won't be):

```ts
// Before
import type { Boss, ResolvedBuild, ResolvedGear, Verdict } from '@/types/game';

// After
import type { Boss, ResolvedBuild, Verdict } from '@/types/game';
```

- [ ] **Step 3.6 — TypeScript check**

```bash
npx --prefix /tmp/7dso-app tsc --noEmit --project /tmp/7dso-app/tsconfig.json 2>&1
```

Expected: no errors.

- [ ] **Step 3.7 — Run full test suite**

```bash
npx --prefix /tmp/7dso-app vitest run 2>&1
```

Expected: all tests PASS.

- [ ] **Step 3.8 — Commit**

```bash
cd /tmp/7dso-app && git add lib/engine/buildEngine.ts lib/engine/buildEngine.test.ts "app/(app)/strategy/page.tsx"
git commit -m "fix: My Gear mode now recomputes bisCount and verdict correctly"
```

---

## Task 4 — Remove hardcoded METAPICK_IDS

**Problem:** `buildEngine.ts` line 139 contains a hardcoded `Set` of character IDs for the "META" badge. Adding a new meta character requires a code change. The data already exists: `Character.boss_rank` is seeded from zeroluck and is `'S' | 'A' | 'B' | 'C' | null`.

**Fix:** Replace the hardcoded set with `character.boss_rank === 'S'`. Any character marked `boss_rank: 'S'` in the DB automatically gets the badge.

**Files:**
- Modify: `lib/engine/buildEngine.ts`
- Modify: `lib/engine/buildEngine.test.ts`

---

- [ ] **Step 4.1 — Add test to `buildEngine.test.ts`**

Add inside the existing `describe('resolveBuild', ...)` block:

```ts
it('isMetapick is true when character.boss_rank is S', () => {
  const sRankChar: Character = { ...character, boss_rank: 'S' };
  const chars = new Map<string, Character>([['escanor', sRankChar]]);
  const result = resolveBuild({ ...makeInput(['watcherRing']), characters: chars });
  expect(result.slots[0].isMetapick).toBe(true);
});

it('isMetapick is false when character.boss_rank is A', () => {
  const aRankChar: Character = { ...character, boss_rank: 'A' };
  const chars = new Map<string, Character>([['escanor', aRankChar]]);
  const result = resolveBuild({ ...makeInput(['watcherRing']), characters: chars });
  expect(result.slots[0].isMetapick).toBe(false);
});

it('isMetapick is false when character.boss_rank is null', () => {
  const noRankChar: Character = { ...character, boss_rank: null };
  const chars = new Map<string, Character>([['escanor', noRankChar]]);
  const result = resolveBuild({ ...makeInput(['watcherRing']), characters: chars });
  expect(result.slots[0].isMetapick).toBe(false);
});
```

Note: the existing `character` fixture has `boss_rank: 'S'`, so the existing test `'counter hint when chosen item set_id is in boss.bis_set_ids'` still passes — no change needed there.

- [ ] **Step 4.2 — Run to confirm new tests fail**

```bash
npx --prefix /tmp/7dso-app vitest run lib/engine/buildEngine.test.ts 2>&1
```

Expected: the three new tests FAIL because `isMetapick` is still driven by the hardcoded set (the `character` fixture ID `escanor` happens to be in it, so `boss_rank: 'A'` and `null` tests will fail — `isMetapick` is `true` when it should be `false`).

- [ ] **Step 4.3 — Update `buildEngine.ts`**

Remove the `METAPICK_IDS` constant entirely:

```ts
// Remove this entire line:
const METAPICK_IDS = new Set(['escanor', 'meliodas', 'elaine', 'king', 'jericho', 'guila', 'diane', 'clotho']);
```

Replace the `isMetapick` line inside `resolveTeam`:

```ts
// Before
const isMetapick = METAPICK_IDS.has(slot.character_id);

// After
const isMetapick = character?.boss_rank === 'S';
```

- [ ] **Step 4.4 — Run tests to confirm they pass**

```bash
npx --prefix /tmp/7dso-app vitest run lib/engine/buildEngine.test.ts 2>&1
```

Expected: all tests PASS (the `boss_rank: 'S'` fixture already has it right).

- [ ] **Step 4.5 — Run full test suite**

```bash
npx --prefix /tmp/7dso-app vitest run 2>&1
```

Expected: all tests PASS.

- [ ] **Step 4.6 — Commit**

```bash
cd /tmp/7dso-app && git add lib/engine/buildEngine.ts lib/engine/buildEngine.test.ts
git commit -m "fix: derive isMetapick from character.boss_rank instead of hardcoded set"
```

---

## Task 5 — Dual Supabase server clients (security)

**Problem:** `lib/supabase/server.ts` exports a single `createServerClient()` that uses `SUPABASE_SERVICE_ROLE_KEY`. This key bypasses Row Level Security on every table for every server request — including reading user inventory. If Supabase RLS is enabled, user data is unprotected server-side.

**Fix:** Introduce two helpers:
- `createServerClient()` → anon key + request cookies. Inherits the user's session; RLS policies on user tables enforce ownership.
- `createAdminClient()` → service role key, no cookies. Used only for the cron sync route (needs cross-user writes) and the seed script.

**RLS prerequisite (document in code comments, confirm with DB admin before deploying):**
- Public tables (`bosses`, `characters`, `accessories`, `builds`, `armor_pieces`, `weapons`, `engravements`) — RLS should be **disabled** or have a `USING (true)` SELECT policy.
- User tables (`user_inventory`, `user_armor`, `user_weapons`, `user_engravements`, `user_characters`) — need `USING (auth.uid() = user_id)` SELECT and UPSERT policies.

**Files:**
- Modify: `lib/supabase/server.ts`
- Modify: `app/api/builds/[bossId]/route.ts`
- Modify: `app/api/farm/route.ts`
- Modify: `app/api/inventory/route.ts`
- Modify: `app/api/roster/route.ts`

---

- [ ] **Step 5.1 — Replace `lib/supabase/server.ts`**

```ts
import {
  createServerClient as _createServerClient,
  createBrowserClient,
  type CookieOptions,
} from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * User-context client — uses the anon key + the incoming request cookies.
 * Respects Row Level Security. Use for all user-scoped data reads/writes.
 */
export function createServerClient() {
  const cookieStore = cookies();
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    },
  );
}

/**
 * Admin client — uses the service role key, bypasses RLS.
 * Use ONLY for cron/admin operations that need cross-user access.
 */
export function createAdminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
```

- [ ] **Step 5.2 — Update `app/api/builds/[bossId]/route.ts`**

Add `createAdminClient` to the import and use each client for the right data:

```ts
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: { bossId: string } }) {
  const { bossId } = params;
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  const adminSupabase  = createAdminClient();   // public tables — no user context needed
  const serverSupabase = createServerClient();  // user tables — respects RLS

  const [
    { data: boss },
    { data: buildSlots },
    { data: allAccessories },
    { data: allCharacters },
    { data: allBosses },
    { data: inventory },
    { data: roster },
  ] = await Promise.all([
    adminSupabase.from('bosses').select('*').eq('id', bossId).single(),
    adminSupabase.from('builds').select('*').eq('boss_id', bossId).order('team_index').order('slot_index'),
    adminSupabase.from('accessories').select('*'),
    adminSupabase.from('characters').select('*'),
    adminSupabase.from('bosses').select('*'),
    userId
      ? serverSupabase.from('user_inventory').select('accessory_id').eq('user_id', userId).eq('owned', true)
      : Promise.resolve({ data: [] }),
    userId
      ? serverSupabase.from('user_characters').select('character_id').eq('user_id', userId).eq('owned', true)
      : Promise.resolve({ data: [] }),
  ]);

  if (!boss || !buildSlots) {
    return NextResponse.json({ error: 'Boss not found' }, { status: 404 });
  }

  const accessories       = new Map((allAccessories ?? []).map((a: Accessory) => [a.id, a]));
  const characters        = new Map((allCharacters  ?? []).map((c: Character) => [c.id, c]));
  const bosses            = new Map((allBosses      ?? []).map((b: Boss)      => [b.id, b]));
  const ownedIds          = new Set((inventory      ?? []).map((r: { accessory_id: string }) => r.accessory_id));
  const ownedCharacterIds = new Set((roster         ?? []).map((r: { character_id: string }) => r.character_id));

  const builds = resolveAllBuilds({
    boss: boss as Boss,
    buildSlots: buildSlots as BuildSlot[],
    characters, accessories, ownedIds, ownedCharacterIds, bosses,
  });

  return NextResponse.json(builds);
}
```

- [ ] **Step 5.3 — Update `app/api/farm/route.ts`**

```ts
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  const adminSupabase  = createAdminClient();
  const serverSupabase = createServerClient();

  const [
    { data: allBosses },
    { data: allBuildSlots },
    { data: allAccessories },
    { data: allCharacters },
    { data: inventory },
  ] = await Promise.all([
    adminSupabase.from('bosses').select('*'),
    adminSupabase.from('builds').select('*').order('team_index').order('slot_index'),
    adminSupabase.from('accessories').select('*'),
    adminSupabase.from('characters').select('*'),
    userId
      ? serverSupabase.from('user_inventory').select('accessory_id').eq('user_id', userId).eq('owned', true)
      : Promise.resolve({ data: [] }),
  ]);

  // ... rest of the function body is unchanged
```

Keep the rest of the function body (the `impactMap` loop and response) exactly as it is.

- [ ] **Step 5.4 — Update `app/api/inventory/route.ts`**

Replace `createServerClient` usage — this route only touches user tables, so use `createServerClient()`:

```ts
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return NextResponse.json({});

  const type = url.searchParams.get('type') ?? 'accessory';
  const supabase = createServerClient();  // changed from createServerClient()
  // ... rest of the function body unchanged
```

(The rest of the function body — the if/else chain building the `map` — stays identical.)

- [ ] **Step 5.5 — Update `app/api/roster/route.ts`**

```ts
import { createServerClient } from '@/lib/supabase/server';

// Replace all `createServerClient()` calls — already named that, just now uses anon key.
// No other changes needed.
```

(The function bodies are already correct — they call `createServerClient()` which now uses the right key.)

- [ ] **Step 5.6 — TypeScript check**

```bash
npx --prefix /tmp/7dso-app tsc --noEmit --project /tmp/7dso-app/tsconfig.json 2>&1
```

Expected: no errors. (`createBrowserClient` is re-exported from `@supabase/ssr` — verify the import is valid if there's an error here.)

If `createBrowserClient` is not available from `@supabase/ssr`, use this alternative for `createAdminClient`:

```ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
```

- [ ] **Step 5.7 — Run full test suite**

```bash
npx --prefix /tmp/7dso-app vitest run 2>&1
```

Expected: all tests PASS (server-side Supabase clients are not covered by unit tests — integration is verified by the TypeScript check and manual smoke test).

- [ ] **Step 5.8 — Commit**

```bash
cd /tmp/7dso-app && git add lib/supabase/server.ts "app/api/builds/[bossId]/route.ts" app/api/farm/route.ts app/api/inventory/route.ts app/api/roster/route.ts
git commit -m "fix: use anon key for user-scoped server reads; service role only for admin routes"
```

---

## Task 6 — Create CLAUDE.md

**Problem:** No `CLAUDE.md` exists. Future AI sessions have no project context and must re-derive conventions from the code.

**Files:**
- Create: `CLAUDE.md`

---

- [ ] **Step 6.1 — Create `/tmp/7dso-app/CLAUDE.md`**

```markdown
# 7DSO Smart Strategist — CLAUDE.md

## What this is
A mobile-first iOS-style web companion for **Seven Deadly Sins: Origin**.
Users pick a boss and get an optimal team + gear recommendation based on their owned inventory.

## Stack
- **Next.js 14** App Router, Server Components by default. Pages are in `app/(app)/`.
- **Supabase** — PostgreSQL + anonymous Auth. Two server helpers:
  - `lib/supabase/server.ts` → `createServerClient()` (anon key, respects RLS — use for user data)
  - `lib/supabase/server.ts` → `createAdminClient()` (service role — cron/admin only)
  - `lib/supabase/client.ts` → browser client (used in hooks)
- **Tailwind CSS v3** dark theme. Design tokens: `#0B0E14` bg, `#F5C84B` gold, `#5EEAD4` teal, `#FFA958` amber.
- **Framer Motion 11** for iOS-like spring animations. `whileTap={{ scale: 0.92 }}` is standard.
- **TypeScript** throughout. Run `npx tsc --noEmit` to check.
- **Vitest** + React Testing Library for tests. Run: `npx vitest run`.

## Core engine
`lib/engine/buildEngine.ts` is a pure function. Never add DB calls to it.
- Input: boss, build slots, characters map, accessories map, owned IDs sets.
- Output: `ResolvedBuild[]` — one per team, sorted by ownedCharacterCount desc.
- Key rule: substitutes must share ≥1 `stat_tag` with the BiS item. No random fills.
- `applyMyGearMode(build)` recomputes bisCount + verdict after neutralising unowned slots.
- `calcVerdict(bisCount, totalSlots)` is exported — import it rather than duplicating.

## Inventory hooks pattern
All hooks (`useInventory`, `useArmorInventory`, `useWeaponInventory`, `useEngravementInventory`, `useRoster`) follow the same pattern:
- Optimistic UI: use `setOwned(prev => ...)` functional updater to avoid stale closure bugs.
- DB write: Supabase `.upsert()` with `onConflict: 'user_id,<item>_id'`.
- `toggle` callback should NOT depend on `owned` state — remove it from `useCallback` deps.

## Pages
| Route | File | Purpose |
|---|---|---|
| `/strategy` | `app/(app)/strategy/page.tsx` | Boss selector + team/gear |
| `/codex` | `app/(app)/codex/page.tsx` | Character browser + roster toggle |
| `/vault` | `app/(app)/vault/page.tsx` | Inventory management |
| `/farm` | `app/(app)/farm/page.tsx` | Priority farming guide |
| `/tier-list` | `app/(app)/tier-list/page.tsx` | PvE / Boss / PvP rankings |

## Database seeding
`scripts/seed.ts` — run once: `npx tsx scripts/seed.ts`
Reads `scripts/data/seed-data.json`. Idempotent.

## Meta-pick logic
`isMetapick` is derived from `character.boss_rank === 'S'` in the engine. Do not add hardcoded ID sets.

## Deployment
Vercel. Daily cron at `app/api/cron/sync/route.ts` — requires `CRON_SECRET` env var.
See `vercel.json` for cron schedule.

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-only, never expose to client
CRON_SECRET=
ADMIN_SECRET=
```
```

- [ ] **Step 6.2 — Commit**

```bash
cd /tmp/7dso-app && git add CLAUDE.md
git commit -m "docs: add CLAUDE.md with project context and conventions"
```

---

## Self-Review

### Spec coverage
- ✅ Issue 1 (stale closures): Tasks 1 covers all 4 hooks + tests
- ✅ Issue 2 (My Gear verdict): Task 3 moves function to engine, recomputes, tests it
- ✅ Issue 3 (stale closure in hooks): Tasks 1+2 both apply functional updater pattern
- ✅ Issue 4 (useRoster raw fetch): Task 2 — full replacement with Supabase + tests
- ✅ Issue 5 (METAPICK_IDS): Task 4 — removed, replaced with data-driven check
- ✅ Issue 6 (security): Task 5 — dual clients, documented RLS requirements
- ✅ CLAUDE.md: Task 6

### Placeholder scan
No TBDs. All code blocks are complete. Step 5.3 notes "rest unchanged" — the farm route body after the `Promise.all` is 25 lines of unchanged logic; the note is accurate and an engineer can verify by comparing against the current file.

### Type consistency
- `applyMyGearMode` uses `ResolvedBuild` and `ResolvedGear` — both imported in `buildEngine.ts` ✅
- `createAdminClient` fallback uses `createClient` from `@supabase/supabase-js` which is already a dep ✅
- `calcVerdict` export doesn't change its signature ✅
