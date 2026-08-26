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

  // ============================================================
  // THE SECOND SET
  //
  // Nine abilities across three slots meant three real choices, and two of
  // those were "the epic one". Ten more gives every slot a spread that
  // actually rewards thinking about what you are fighting rather than
  // which tome dropped last.
  //
  // The design brief for these, specifically: the old set was tuned
  // entirely against Era I monsters, which die in a handful of swings.
  // Nothing in it did anything useful against a Descent floor or the
  // Vigil, where the enemy has a hundred thousand health and the fight is
  // measured in minutes. So several of these scale off the TARGET rather
  // than off you — a percentage of a huge health pool, a cap on a huge
  // incoming hit — which makes loadout a real decision for the first time.
  // ============================================================

  // ---------------- STRIKE ----------------
  sunder: {
    id: 'sunder', name: 'Sunder', icon: '🪓', slot: 'strike',
    cooldown: 14000, rarity: 'rare',
    desc: 'Every 14s hit for ×1.6 and break the target\'s guard: -25% of its defence for the rest of the fight.',
    flavor: 'You are not trying to kill it with this one. You are trying to open it.',
    effect: { type: 'sunder', value: 1.6, shred: 0.25 },
  },
  flurry: {
    id: 'flurry', name: 'Flurry', icon: '🌪️', slot: 'strike',
    cooldown: 11000, rarity: 'epic',
    desc: 'Every 11s strike four times, each for 45% damage.',
    flavor: 'Accuracy is a problem for people with fewer arms than this.',
    effect: { type: 'multiHit', hits: 4, value: 0.45 },
  },
  bloodletter: {
    id: 'bloodletter', name: 'Bloodletter', icon: '🩸', slot: 'strike',
    cooldown: 16000, rarity: 'epic',
    desc: 'Every 16s hit for ×2 and take a fifth of the damage back as health.',
    flavor: 'An arrangement. Not a pleasant one, but an arrangement.',
    effect: { type: 'drain', value: 2.0, drain: 0.20 },
  },
  unmaking: {
    id: 'unmaking', name: 'The Unmaking', icon: '🕳️', slot: 'strike',
    cooldown: 25000, rarity: 'legendary',
    desc: 'Every 25s your hit also removes 12% of the target\'s MAXIMUM health, however large that is.',
    flavor: 'It does not care how much of it there is. That is rather the point.',
    effect: { type: 'percentMax', value: 0.12 },
  },

  // ---------------- GUARD ----------------
  thornmail: {
    id: 'thornmail', name: 'Thornmail', icon: '🌵', slot: 'guard',
    cooldown: 0, rarity: 'rare',
    desc: 'Passive: 30% of every hit you take is returned to whatever hit you.',
    flavor: 'Vera made it. Vera says not to hug anyone while wearing it.',
    effect: { type: 'thorns', value: 0.30 },
  },
  aegis: {
    id: 'aegis', name: 'Aegis Oath', icon: '⛨', slot: 'guard',
    cooldown: 30000, rarity: 'epic',
    desc: 'Every 30s the next hit against you is negated entirely, and you take 15% less for 8 seconds after.',
    flavor: 'A promise made to nobody in particular, and kept anyway.',
    effect: { type: 'aegis', value: 0.15, duration: 8000 },
  },
  unyielding: {
    id: 'unyielding', name: 'Unyielding', icon: '🗿', slot: 'guard',
    cooldown: 0, rarity: 'legendary',
    desc: 'Passive: no single blow can take more than a quarter of your maximum health.',
    flavor: 'Things much larger than you have hit you now. You are still the same size.',
    effect: { type: 'capHit', value: 0.25 },
  },

  // ---------------- UTILITY ----------------
  field_kit: {
    id: 'field_kit', name: 'Field Kit', icon: '🩹', slot: 'utility',
    cooldown: 25000, rarity: 'rare',
    desc: 'Every 25s, patch yourself up for 18% of your maximum health.',
    flavor: 'Wren packed it. Wren labelled everything. Wren knows you will not read the labels.',
    effect: { type: 'regen', value: 0.18 },
  },
  spirit_lantern: {
    id: 'spirit_lantern', name: 'Spirit Lantern', icon: '🏮', slot: 'utility',
    cooldown: 0, rarity: 'epic',
    desc: 'Passive: whatever is walking with you helps 50% more.',
    flavor: 'It is not the light they follow. Nobody has worked out what it is.',
    effect: { type: 'passive' }, passive: { pet_amp: 0.50 },
  },
  ledger_of_debts: {
    id: 'ledger_of_debts', name: 'Ledger of Debts', icon: '📓', slot: 'utility',
    cooldown: 0, rarity: 'legendary',
    desc: 'Passive: +25% gold and +15% rare drop rate. Everything that dies owes you, and it is written down.',
    flavor: 'Ferrin has read it. Ferrin would rather not discuss what is in it.',
    effect: { type: 'passive' }, passive: { gold: 0.25, drop_rate: 0.15 },
  },
};

export const ABILITY_LIST = Object.values(ABILITIES);

export function getAbility(id) { return ABILITIES[id]; }
export function abilitiesForSlot(slot) { return ABILITY_LIST.filter(a => a.slot === slot); }

// Tome item id for an ability, e.g. heavy_blow -> tome_heavy_blow
export const tomeIdFor = abilityId => `tome_${abilityId}`;
export const abilityIdFromTome = tomeId => tomeId.replace(/^tome_/, '');
