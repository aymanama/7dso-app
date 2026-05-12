# 7DSO Smart Strategist — CLAUDE.md

## What this is
A mobile-first iOS-style web companion for **Seven Deadly Sins: Origin**.
Users pick a boss and get an optimal team + gear recommendation based on their owned inventory.

## Stack
- **Next.js 14** App Router, Server Components by default. Pages are in `app/(app)/`.
- **Supabase** — PostgreSQL + anonymous Auth. Two server helpers:
  - `lib/supabase/server.ts` → `createServerClient()` (anon key + cookies, respects RLS — use for user data)
  - `lib/supabase/server.ts` → `createAdminClient()` (service role, bypasses RLS — cron/admin only)
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
- Use `useRef` to track latest owned state synchronously (avoids stale closure and StrictMode double-invoke issues).
- DB write: Supabase `.upsert()` with `onConflict: 'user_id,<item>_id'`.
- `toggle` callback depends only on `[userId]` — not on owned state.

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
