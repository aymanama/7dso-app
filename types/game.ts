export type ElementId = 'fire'|'ice'|'wind'|'thunder'|'earth'|'holy'|'dark'|'neutral';
export type RoleId    = 'attacker'|'buster'|'warden'|'supporter';
export type Slot      = 'ring'|'necklace'|'earring';
export type Tier      = 'SSR'|'SR';
export type BossKind  = 'Dungeon'|'World'|'Timespace';
export type Verdict   = 'perfect'|'battle_ready'|'viable'|'high_risk';

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
  stat_tags: string[];
  drop_sources: string[];
  sort_order: number;
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
  slot_index: number;
  character_id: string;
  ring_priority: string[];
  necklace_priority: string[];
  earring_priority: string[];
  source?: string;
  updated_at?: string;
}

export interface ResolvedGear {
  item: Accessory;
  isBis: boolean;
  isOwned: boolean;
  matchedStatTag: string | null;
  bisItem: Accessory;
  isCounter: boolean;
}

export interface ResolvedCharacter {
  character: Character;
  slotIndex: number;
  ring: ResolvedGear;
  necklace: ResolvedGear;
  earring: ResolvedGear;
  subCount: number;
  synergyScore: number;
}

export interface ResolvedBuild {
  bossId: string;
  slots: ResolvedCharacter[];
  bisCount: number;
  totalSlots: number;
  verdict: Verdict;
}
