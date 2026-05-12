-- Initial schema: tables that exist in production but were missing from migration files.
-- All statements use IF NOT EXISTS / IF EXISTS guards so they are safe to replay.

-- ─── armor_pieces ─────────────────────────────────────────────────────────────
create table if not exists armor_pieces (
  id            text primary key,
  name          text not null,
  tier          text not null check (tier in ('SSR','SR')),
  slot          text not null check (slot in ('top','bottoms','belt','combat_boots')),
  set_id        text references gear_sets(id),
  set_name      text,
  stat_tags     text[] not null default '{}',
  drop_sources  text[] default '{}',
  sort_order    integer default 0,
  two_pc_bonus  text,
  four_pc_bonus text,
  image_url     text
);

-- ─── weapons ──────────────────────────────────────────────────────────────────
create table if not exists weapons (
  id                  text primary key,
  name                text not null,
  tier                text not null check (tier in ('SSR','SR')),
  weapon_type         text not null,
  weapon_set_name     text,
  main_stat           text,
  sub_stat            text,
  max_effect          text,
  passive_description text,
  image_url           text,
  character_ids       text[] default '{}',
  drop_sources        text[] default '{}',
  sort_order          integer default 0
);

-- ─── user_armor ───────────────────────────────────────────────────────────────
create table if not exists user_armor (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id),
  armor_id   text not null references armor_pieces(id),
  owned      boolean not null default true,
  updated_at timestamptz default now(),
  unique (user_id, armor_id)
);
alter table user_armor enable row level security;
drop policy if exists "users manage own armor" on user_armor;
create policy "users manage own armor" on user_armor
  for all using (auth.uid() = user_id);

-- ─── user_weapons ─────────────────────────────────────────────────────────────
create table if not exists user_weapons (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id),
  weapon_id  text not null references weapons(id),
  owned      boolean not null default true,
  updated_at timestamptz default now(),
  unique (user_id, weapon_id)
);
alter table user_weapons enable row level security;
drop policy if exists "users manage own weapons" on user_weapons;
create policy "users manage own weapons" on user_weapons
  for all using (auth.uid() = user_id);

-- ─── user_characters ──────────────────────────────────────────────────────────
create table if not exists user_characters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id),
  character_id text not null references characters(id),
  owned        boolean not null default true,
  updated_at   timestamptz default now(),
  unique (user_id, character_id)
);
alter table user_characters enable row level security;
drop policy if exists "users manage own characters" on user_characters;
create policy "users manage own characters" on user_characters
  for all using (auth.uid() = user_id);

-- ─── engravements ─────────────────────────────────────────────────────────────
create table if not exists engravements (
  id                 text primary key,
  name               text not null,
  tier               text not null check (tier in ('SSR','SR')),
  character_id       text references characters(id),
  slot               text not null,
  engravement_type   text not null,
  effect_description text,
  max_effect         text,
  image_url          text,
  drop_sources       text[] default '{}',
  sort_order         integer default 0,
  updated_at         timestamptz default now()
);

-- ─── user_engravements ────────────────────────────────────────────────────────
create table if not exists user_engravements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id),
  engravement_id text not null references engravements(id),
  owned          boolean not null default true,
  updated_at     timestamptz default now(),
  unique (user_id, engravement_id)
);
alter table user_engravements enable row level security;
drop policy if exists "users manage own engravements" on user_engravements;
create policy "users manage own engravements" on user_engravements
  for all using (auth.uid() = user_id);

-- ─── builds table: fix unique constraint + add columns ────────────────────────
alter table builds add column if not exists team_index integer not null default 0;
alter table builds add column if not exists team_name  text not null default 'Team A';

-- Drop old single-column unique constraint if it exists, add composite one
alter table builds drop constraint if exists builds_boss_id_slot_index_key;
alter table builds drop constraint if exists builds_boss_id_team_index_slot_index_key;
alter table builds add constraint builds_boss_id_team_index_slot_index_key
  unique (boss_id, team_index, slot_index);
