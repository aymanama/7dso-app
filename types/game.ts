export type ElementId = 'fire'|'ice'|'wind'|'thunder'|'earth'|'holy'|'dark'|'neutral';
export type RoleId    = 'attacker'|'buster'|'warden'|'supporter';
export type Slot      = 'ring'|'necklace'|'earring';
export type Tier      = 'SSR'|'SR';
export type BossKind  = 'Dungeon'|'World'|'Timespace';
export type Verdict   = 'perfect'|'battle_ready'|'viable'|'high_risk';

// Sourced from zeroluck.gg/7dso/weapons — display names matching the game
export type WeaponType =
  | 'Axe' | 'Dual Swords' | 'Gauntlets' | 'Greatsword' | 'Grimoire'
  | 'Lance' | 'Longsword' | 'Nunchaku' | 'Rapier' | 'Staff'
  | 'Sword and Shield' | 'Wand';

export type ArmorSlot = 'top' | 'bottoms' | 'belt' | 'combat_boots';

export interface Element {
  id: ElementId;
  label: string;
  color: string;
  glow: string;
}

export interface Role {
  id: RoleId;
  label: string;
  glyph: string;
}

export interface GearSet {
  id: string;
  name: string;
  short_name: string;
  tier: Tier;
  bonus_text: string;
  stat_tags: string[];
  pieces: string;
  hue: number;
}

export interface Accessory {
  id: string;
  name: string;
  tier: Tier;
  slot: Slot;
  set_id: string | null;
  set_name?: string | null;
  stat_tags: string[];
  drop_sources: string[];
  sort_order: number;
  main_stat?: string | null;
  sub_stat?: string | null;
  passive_description?: string | null;
  image_url?: string | null;
}

export interface ArmorPiece {
  id: string;
  name: string;
  tier: Tier;
  slot: ArmorSlot;
  set_id: string | null;
  set_name: string | null;
  stat_tags: string[];
  drop_sources: string[];
  sort_order: number;
  two_pc_bonus: string | null;
  four_pc_bonus: string | null;
  image_url?: string | null;
}

export interface Weapon {
  id: string;
  name: string;
  tier: Tier;
  weapon_type: WeaponType;
  weapon_set_name: string | null;
  main_stat: string | null;
  sub_stat: string | null;
  max_effect: string | null;
  passive_description: string | null;
  image_url: string | null;
  character_ids: string[];
  drop_sources: string[];
  sort_order: number;
}

export interface CharacterSkill {
  name: string;
  description: string;
  type: 'active' | 'passive' | 'ultimate';
}

export interface Character {
  id: string;
  name: string;
  tier: Tier;
  primary_element: ElementId;
  elements: ElementId[];
  primary_role: RoleId;
  roles: RoleId[];
  race: string;
  weapons: string[];
  tier_rank: string;
  blurb: string;
  portrait_url: string | null;
  updated_at?: string;
  // Phase 4 enrichment fields (nullable — existing records may not have them)
  pve_rank: 'S' | 'A' | 'B' | 'C' | null;
  pvp_rank: 'S' | 'A' | 'B' | 'C' | null;
  boss_rank: 'S' | 'A' | 'B' | 'C' | null;
  skills: CharacterSkill[] | null;
  recommended_weapon_id: string | null;
  f2p_friendly: boolean;
}

export interface Boss {
  id: string;
  name: string;
  short_name: string;
  portrait_url: string | null;
  element_id: ElementId;
  weakness_elements: ElementId[];
  threat: number;
  kind: BossKind;
  tags: string[];
  blurb: string;
  bis_set_ids: string[];
  updated_at?: string;
}

export interface BuildSlot {
  id?: string;
  boss_id: string;
  team_index: number;
  team_name: string;
  slot_index: number;
  character_id: string;
  ring_priority: string[];
  necklace_priority: string[];
  earring_priority: string[];
  source?: string;
}

export interface ResolvedGear {
  item: Accessory;
  isBis: boolean;
  isOwned: boolean;
  matchedStatTag: string | null;
  bisItem: Accessory;
  isCounter: boolean;
  farmFromBoss: string | null;
  allOwnedMatchCount: number;
}

export interface ResolvedCharacter {
  character: Character;
  slotIndex: number;
  ring: ResolvedGear;
  necklace: ResolvedGear;
  earring: ResolvedGear;
  subCount: number;
  synergyScore: number;
  isOwned: boolean;
  countersWeakness: boolean;
  isMetapick: boolean;
}

export interface ResolvedBuild {
  bossId: string;
  teamIndex: number;
  teamName: string;
  slots: ResolvedCharacter[];
  bisCount: number;
  totalSlots: number;
  verdict: Verdict;
  ownedCharacterCount: number;
  alternativeSetName: string | null;
}

export interface FarmEntry {
  item: Accessory;
  affectedBossCount: number;
  impactScore: number;
  dropBoss: string | null;
}

export interface Engravement {
  id: string;
  name: string;
  character_id: string;
  tier: Tier;
  description: string | null;
  main_stats: string[];
  static_sub_stats: string[];
  special_skill_name: string | null;
  special_skill_lv1: string | null;
  special_skill_lv2: string | null;
  special_skill_lv3: string | null;
  crafting_gold: number | null;
  crafting_time_min: number | null;
  crafting_materials: string[];
  image_url: string | null;
  sort_order: number;
}
