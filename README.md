# 7DSO Smart Strategist

A mobile-first iOS-style web companion for **Seven Deadly Sins: Origin**.  
Pick a boss → see the optimal team, gear, and fallback substitutions for your inventory.

---

## Setup

1. Clone the repo
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Seed the database (run once, safe to re-run):
   ```bash
   npx tsx scripts/seed.ts
   ```
5. Start the dev server:
   ```bash
   pnpm dev
   ```

---

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only — never exposed to client

CRON_SECRET=<random-256bit>         # Vercel Cron authorization
ADMIN_SECRET=<random-256bit>        # Manual scraper trigger
```

---

## Supabase tables

### `bosses`
| Column | Type | Notes |
|---|---|---|
| id | text PK | e.g. `galland` |
| name | text | Full display name |
| short_name | text | Abbreviated name |
| portrait_url | text? | Boss image |
| element_id | text | FK→elements |
| weakness_elements | text[] | Elements that deal bonus damage |
| threat | integer | 0–100 threat rating |
| kind | text | `Dungeon` \| `World` \| `Timespace` |
| tags | text[] | |
| blurb | text | |
| bis_set_ids | text[] | Preferred gear set IDs |

### `characters`
| Column | Type | Notes |
|---|---|---|
| id | text PK | e.g. `escanor` |
| name | text | |
| tier | text | `SSR` \| `SR` |
| primary_element | text | FK→elements |
| elements | text[] | All elements used |
| primary_role | text | FK→roles |
| roles | text[] | All roles |
| race | text | Human / Demon / Fairy / Giant / Goddess / Doll |
| weapons | text[] | Compatible weapon types |
| tier_rank | text | `S` \| `A` \| `B` |
| blurb | text | Short lore description |
| portrait_url | text? | Character portrait |
| pve_rank | text? | `S`/`A`/`B`/`C` PvE ranking |
| pvp_rank | text? | `S`/`A`/`B`/`C` PvP ranking |
| boss_rank | text? | `S`/`A`/`B`/`C` boss ranking |
| skills | jsonb? | Array of `{name, description, type}` |
| recommended_weapon_id | text? | FK→weapons |
| f2p_friendly | boolean | Default false |

### `accessories`
| Column | Type | Notes |
|---|---|---|
| id | text PK | e.g. `arachneRing` |
| name | text | |
| tier | text | `SSR` \| `SR` |
| slot | text | `ring` \| `necklace` \| `earring` |
| set_id | text? | FK→gear_sets |
| stat_tags | text[] | Functional stat archetypes |
| drop_sources | text[] | Boss IDs |
| sort_order | integer | |

### `armor_pieces`
| Column | Type | Notes |
|---|---|---|
| id | text PK | e.g. `spider_top` |
| name | text | |
| tier | text | `SSR` \| `SR` |
| slot | text | `top` \| `bottoms` \| `belt` \| `combat_boots` |
| set_id | text? | |
| set_name | text? | Display name of the set |
| stat_tags | text[] | |
| two_pc_bonus | text? | Bonus at 2 pieces |
| four_pc_bonus | text? | Bonus at 4 pieces |
| image_url | text? | |

### `weapons`
| Column | Type | Notes |
|---|---|---|
| id | text PK | e.g. `bfw_axe` |
| name | text | |
| tier | text | `SSR` \| `SR` |
| weapon_type | text | Axe / Greatsword / etc. |
| weapon_set_name | text? | |
| main_stat | text? | |
| sub_stat | text? | |
| passive_description | text? | |
| image_url | text? | |
| character_ids | text[] | Compatible character IDs |

### `engravements`
| Column | Type | Notes |
|---|---|---|
| id | text PK | e.g. `escanor_northern_wildness` |
| name | text | Outfit name |
| character_id | text | FK→characters |
| tier | text | `SSR` \| `SR` |
| description | text? | |
| main_stats | text[] | HP/DEF values |
| static_sub_stats | text[] | |
| special_skill_name | text? | |
| special_skill_lv1/2/3 | text? | Skill descriptions per level |
| crafting_gold | integer? | |
| crafting_time_min | integer? | |
| crafting_materials | text[] | |
| image_url | text? | CDN icon URL |
| sort_order | integer | |

### `builds`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| boss_id | text | FK→bosses |
| slot_index | integer | 0–3 |
| character_id | text | FK→characters |
| ring_priority | text[] | Accessory IDs in priority order |
| necklace_priority | text[] | |
| earring_priority | text[] | |
| source | text | `manual` \| `zeroluck` \| `scraper` |

### User tables (RLS-protected)
| Table | Key columns |
|---|---|
| `user_profiles` | id (FK→auth.users), display_name |
| `user_inventory` | user_id, accessory_id, owned |
| `user_armor` | user_id, armor_id, owned |
| `user_weapons` | user_id, weapon_id, owned |
| `user_engravements` | user_id, engravement_id, owned |
| `user_characters` | user_id, character_id, owned |

---

## Architecture

### Pages (5)

| Route | Purpose |
|---|---|
| `/strategy` | Boss selector → optimal team + gear with BiS/SUB/FARM badges |
| `/codex` | Character roster browser with filter by tier + element |
| `/vault` | Inventory management — toggle owned accessories, armor, weapons, engravements |
| `/farm` | Priority farming guide — which boss to run for maximum impact |
| `/tier-list` | Character tier rankings (PvE / Boss / PvP) |

### Smart Engine (`lib/engine/buildEngine.ts`)

Pure function — no DB calls. Receives the boss, build slots, owned accessory IDs, and all accessories. Returns a `ResolvedBuild` with per-slot gear resolved to the best owned item sharing the BiS stat archetype, plus a verdict (perfect / battle_ready / viable / high_risk).

The key rule: substitutes must share **at least one `stat_tag`** with the BiS item. Random fills never happen.

### Seed script (`scripts/seed.ts`)

Run manually: `npx tsx scripts/seed.ts`  
Reads `scripts/data/seed-data.json` and upserts all records into Supabase using the service role key. Idempotent — safe to re-run.

---

## Stack

- **Next.js 14** (App Router, Server Components by default)
- **Supabase** (PostgreSQL + Auth + Storage)
- **Tailwind CSS v3** with custom dark design tokens
- **Framer Motion 11** for iOS-like spring animations
- **TypeScript** throughout
