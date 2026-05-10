export const STAT_TAGS = {
  crit_dmg:    'Crit DMG',
  crit_rate:   'Crit Rate',
  dark_dmg:    'Dark DMG',
  ignite_dmg:  'Ignite DMG',
  ground_dmg:  'Ground DMG',
  phys_dmg:    'Phys DMG',
  shield:      'Shield',
  hp_recovery: 'HP Recovery',
  cdr:         'CDR',
  debuff_amp:  'Debuff Amp',
  passive_amp: 'Passive Amp',
  support_amp: 'Support Amp',
} as const;

export type StatTag = keyof typeof STAT_TAGS;
