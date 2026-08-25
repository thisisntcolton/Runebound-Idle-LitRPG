// ============================================================
// ABILITIES — three loadout slots, auto-fired on cooldown.
//
// This is an idle game, so abilities never require clicking:
// you pick the loadout, the game executes it. A manual trigger
// exists for the Strike slot if you feel like being involved.
//
// Learned permanently from Tomes (Rare/Epic drops).
// Slot 1 is always open; slots 2 and 3 unlock at weapon +3 / +5.
// ============================================================

export const SLOTS = [
  { id: 'strike',  name: 'Strike',  icon: '⚔️', desc: 'Offensive — fires on your attack' },
  { id: 'guard',   name: 'Guard',   icon: '🛡️', desc: 'Defensive — reacts when you are hit' },
  { id: 'utility', name: 'Utility', icon: '📜', desc: 'Scrolls, elixirs and last resorts' },
];

export const SLOT_UNLOCK_ENCHANT = { strike: 0, guard: 3, utility: 5 };

export const ABILITIES = {
  // ---------------- STRIKE ----------------
  heavy_blow: {
    id: 'heavy_blow', name: 'Heavy Blow', icon: '💥', slot: 'strike',
    cooldown: 12000, rarity: 'rare',
    desc: 'Every 12s your next hit lands for ×2.5 damage.',
    flavor: 'Wind up. Commit. Apologize later.',
    effect: { type: 'damageMult', value: 2.5 },
  },
  cleave: {
    id: 'cleave', name: 'Cleave', icon: '🌀', slot: 'strike',
    cooldown: 9000, rarity: 'rare',
    desc: 'Every 9s strike twice, each for 65% damage.',
    flavor: 'Why hit something once when the swing is already moving?',
    effect: { type: 'multiHit', hits: 2, value: 0.65 },
  },
  execute: {
    id: 'execute', name: 'Execute', icon: '☠️', slot: 'strike',
    cooldown: 6000, rarity: 'epic',
    desc: 'Every 6s, if the enemy is below 30% HP, hit for ×3.5.',
    flavor: 'The System files this under "efficiency."',
    effect: { type: 'execute', threshold: 0.30, value: 3.5 },
  },

  // ---------------- GUARD ----------------
  parry: {
    id: 'parry', name: 'Parry', icon: '🤺', slot: 'guard',
    cooldown: 0, rarity: 'rare',
    desc: 'Passive: 18% chance to negate an incoming hit entirely.',
    flavor: 'Mostly a matter of standing somewhere the sword is not.',
    effect: { type: 'parry', value: 0.18 },
  },
  iron_stance: {
    id: 'iron_stance', name: 'Iron Stance', icon: '🧱', slot: 'guard',
    cooldown: 20000, rarity: 'rare',
    desc: 'Every 20s, take 50% less damage for 5 seconds.',
    flavor: 'Root, brace, endure. The mountain does not dodge.',
    effect: { type: 'drBurst', value: 0.5, duration: 5000 },
  },
  second_wind: {
    id: 'second_wind', name: 'Second Wind', icon: '💨', slot: 'guard',
    cooldown: 45000, rarity: 'epic',
    desc: 'When you drop below 30% HP, heal 35% of max HP. Every 45s.',
    flavor: 'Your body files a complaint. The System overrules it.',
    effect: { type: 'heal', threshold: 0.30, value: 0.35 },
  },

  // ---------------- UTILITY ----------------
  auto_elixir: {
    id: 'auto_elixir', name: 'Auto-Elixir', icon: '🧪', slot: 'utility',
    cooldown: 5000, rarity: 'rare',
    desc: 'Automatically re-drinks your chosen combat potion when its buff lapses.',
    flavor: 'A bandolier, a bad habit, and impeccable timing.',
    effect: { type: 'autoElixir' },
  },
  firebomb: {
    id: 'firebomb', name: 'Firebomb Scroll', icon: '🔥', slot: 'utility',
    cooldown: 15000, rarity: 'epic',
    desc: 'Every 15s hurl a bomb for damage equal to 150% of your max hit, ignoring defense.',
    flavor: 'Scribed by someone who clearly enjoyed their work.',
    effect: { type: 'bomb', value: 1.5 },
  },
  rune_of_return: {
    id: 'rune_of_return', name: 'Rune of Return', icon: '🔁', slot: 'utility',
    cooldown: 120000, rarity: 'legendary',
    desc: 'Survive one otherwise-lethal hit at 1 HP, then heal 25%. Every 2 minutes.',
    flavor: 'The System permits exactly one clerical error per attempt.',
    effect: { type: 'cheatDeath', value: 0.25 },
  },
};

export const ABILITY_LIST = Object.values(ABILITIES);

export function getAbility(id) { return ABILITIES[id]; }
export function abilitiesForSlot(slot) { return ABILITY_LIST.filter(a => a.slot === slot); }

// Tome item id for an ability, e.g. heavy_blow -> tome_heavy_blow
export const tomeIdFor = abilityId => `tome_${abilityId}`;
export const abilityIdFromTome = tomeId => tomeId.replace(/^tome_/, '');
