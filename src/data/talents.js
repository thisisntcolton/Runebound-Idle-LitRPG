// ============================================================
// TALENT TREES — the one thing that never resets
//
// Each class has a five-tier tree. You earn talent points by playing AS
// that class, and both the points and the spent ranks are stored per
// class and survive Ascension permanently. That makes the trees the
// game's only truly monotonic progression: shards reset your power,
// Hearthwick burns, but a Mage you have played for six cycles is a
// better Mage than one you just picked up.
//
// Structure:
//   - Five tiers, gated by class level (1, 5, 10, 18, 30).
//   - Each tier holds two nodes; you can take both, but points are the
//     constraint, so early on it is a real choice.
//   - Tier 5 is a single capstone that costs several points and changes
//     how the class plays rather than nudging a number.
//
// Every node's effect is a `bonus` bag using the SAME keys as
// classes.js, so talents flow through the exact multiplier chain the
// class passives do. Capstones may instead set a `flag`, which the
// class system reads for behaviour changes.
// ============================================================

/**
 * Class level thresholds. Class XP is all XP earned while that class is active.
 *
 * The exponent is steep on purpose. A player's XP rate grows roughly
 * thirtyfold between the early and late game, so a gentle curve means the
 * whole tree unlocks in an evening once you are strong — which is exactly
 * wrong for the one progression meant to span cycles. At 2.6 the tiers
 * stay meaningful at every stage: a few hours to Adept, tens of hours to
 * the Capstone, regardless of when you get there.
 */
export const CLASS_LEVEL_CURVE = level => Math.floor(450 * Math.pow(level, 2.6));
export const MAX_CLASS_LEVEL = 50;

/** One talent point per class level. Simple, legible, and always felt. */
export const POINTS_PER_LEVEL = 1;

/**
 * A maxed class has 50 points; a full tree costs 78. That gap is
 * deliberate — you are picking a build, not filling in a form. The UI
 * says so rather than letting a player grind toward a total they can
 * never reach.
 */
export const MAX_POINTS = MAX_CLASS_LEVEL * POINTS_PER_LEVEL;

export const TIERS = [
  { tier: 1, atClassLevel: 1,  label: 'Novice' },
  { tier: 2, atClassLevel: 5,  label: 'Adept' },
  { tier: 3, atClassLevel: 10, label: 'Expert' },
  { tier: 4, atClassLevel: 18, label: 'Master' },
  { tier: 5, atClassLevel: 30, label: 'Capstone' },
];

/**
 * Node shape:
 *   id, tier, name, icon, desc
 *   max        ranks you can buy (capstones are always 1)
 *   cost       points per rank
 *   bonus      { key: valuePerRank } using classes.js keys
 *   flag       capstone-only behaviour marker read by systems/classes.js
 */
export const TREES = {
  // ------------------------------------------------------------
  rogue: [
    { id: 'r_edge',    tier: 1, name: 'Whetted Edge',   icon: '🔪', max: 5, cost: 1,
      bonus: { crit: 0.02 }, desc: '+2% critical hit chance per rank.' },
    { id: 'r_quick',   tier: 1, name: 'Quick Hands',    icon: '💨', max: 5, cost: 1,
      bonus: { attack_speed: 0.02 }, desc: '+2% attack speed per rank.' },

    { id: 'r_pockets', tier: 2, name: 'Deep Pockets',   icon: '👝', max: 5, cost: 1,
      bonus: { drop_rate: 0.04 }, desc: '+4% rare drop rate per rank.' },
    { id: 'r_vitals',  tier: 2, name: 'Find the Vitals',icon: '🎯', max: 5, cost: 1,
      bonus: { crit_damage: 0.10 }, desc: 'Critical hits deal +10% more damage per rank.' },

    { id: 'r_fence',   tier: 3, name: 'Fence Contacts', icon: '🪙', max: 5, cost: 2,
      bonus: { gold: 0.06, sell_price: 0.03 }, desc: '+6% gold and +3% sell price per rank.' },
    { id: 'r_shadow',  tier: 3, name: 'Shadowstep',     icon: '🌑', max: 5, cost: 2,
      bonus: { dr: 0.04, attack_speed: 0.02 }, desc: '+4% damage reduction and +2% attack speed per rank.' },

    { id: 'r_lethal',  tier: 4, name: 'Lethality',      icon: '☠️', max: 5, cost: 3,
      bonus: { crit: 0.03, damage: 0.04 }, desc: '+3% crit chance and +4% damage per rank.' },
    { id: 'r_haul',    tier: 4, name: 'Big Haul',       icon: '💰', max: 5, cost: 3,
      bonus: { drop_rate: 0.08 }, desc: '+8% rare drop rate per rank.' },

    { id: 'r_capstone',tier: 5, name: 'Assassinate',    icon: '🗡️', max: 1, cost: 8,
      flag: 'assassinate',
      desc: 'A critical hit that would not kill instead executes anything below 20% health.' },
  ],

  // ------------------------------------------------------------
  ranger: [
    { id: 'g_eye',     tier: 1, name: 'Keen Eye',       icon: '👁️', max: 5, cost: 1,
      bonus: { accuracy: 0.04 }, desc: '+4% accuracy per rank.' },
    { id: 'g_track',   tier: 1, name: 'Tracker',        icon: '🐾', max: 5, cost: 1,
      bonus: { drop_rate: 0.05 }, desc: '+5% rare drop rate per rank.' },

    { id: 'g_draw',    tier: 2, name: 'Strong Draw',    icon: '🏹', max: 5, cost: 1,
      bonus: { damage: 0.04 }, desc: '+4% damage per rank.' },
    { id: 'g_pelt',    tier: 2, name: 'Pelt Trade',     icon: '🦌', max: 5, cost: 1,
      bonus: { gold: 0.05, sell_price: 0.03 }, desc: '+5% gold and +3% sell price per rank.' },

    { id: 'g_camp',    tier: 3, name: 'Field Camp',     icon: '⛺', max: 5, cost: 2,
      bonus: { maxhp: 0.05, dr: 0.03 }, desc: '+5% max health and +3% damage reduction per rank.' },
    { id: 'g_volley',  tier: 3, name: 'Volley',         icon: '🎯', max: 5, cost: 2,
      bonus: { accuracy: 0.05, attack_speed: 0.03 }, desc: '+5% accuracy and +3% attack speed per rank.' },

    { id: 'g_bounty',  tier: 4, name: 'Bounty Hunter',  icon: '📜', max: 5, cost: 3,
      bonus: { drop_rate: 0.09, gold: 0.05 }, desc: '+9% rare drop rate and +5% gold per rank.' },
    { id: 'g_marks',   tier: 4, name: 'Marksmanship',   icon: '✨', max: 5, cost: 3,
      bonus: { damage: 0.06, accuracy: 0.04 }, desc: '+6% damage and +4% accuracy per rank.' },

    { id: 'g_capstone',tier: 5, name: 'Every Shot Counts', icon: '🏹', max: 1, cost: 8,
      flag: 'every_shot',
      desc: 'You can no longer miss. Ever. Quarry becomes permanent.' },
  ],

  // ------------------------------------------------------------
  mage: [
    { id: 'm_focus',   tier: 1, name: 'Focus',          icon: '🔷', max: 5, cost: 1,
      bonus: { int_damage: 0.002 }, desc: '+0.2% damage per point of INT, per rank.' },
    { id: 'm_ward',    tier: 1, name: 'Ward',           icon: '🛡️', max: 5, cost: 1,
      bonus: { dr: 0.05 }, desc: '+5% damage reduction per rank (offsets the robes).' },

    { id: 'm_kindle',  tier: 2, name: 'Kindling',       icon: '🔥', max: 5, cost: 1,
      bonus: { burn: 0.05 }, desc: 'Ember burns for +5% more per rank.' },
    { id: 'm_study',   tier: 2, name: 'Study',          icon: '📘', max: 5, cost: 1,
      bonus: { xp: 0.04 }, desc: '+4% all XP per rank.' },

    { id: 'm_conduit', tier: 3, name: 'Conduit',        icon: '⚡', max: 5, cost: 2,
      bonus: { int_damage: 0.003, damage: 0.03 }, desc: '+0.3% damage per INT and +3% damage per rank.' },
    { id: 'm_flesh',   tier: 3, name: 'Warded Flesh',   icon: '💠', max: 5, cost: 2,
      bonus: { maxhp: 0.07 }, desc: '+7% max health per rank.' },

    { id: 'm_pyre',    tier: 4, name: 'Pyre',           icon: '🌋', max: 5, cost: 3,
      bonus: { burn: 0.08, damage: 0.04 }, desc: 'Ember burns +8% harder and +4% damage per rank.' },
    { id: 'm_archon',  tier: 4, name: 'Archon',         icon: '🔮', max: 5, cost: 3,
      bonus: { int_damage: 0.004 }, desc: '+0.4% damage per point of INT, per rank.' },

    { id: 'm_capstone',tier: 5, name: 'Conflagration',  icon: '☄️', max: 1, cost: 8,
      flag: 'conflagration',
      desc: 'Ember no longer expires. It stacks with every hit and only ends when the target does.' },
  ],

  // ------------------------------------------------------------
  priest: [
    { id: 'p_faith',   tier: 1, name: 'Faith',          icon: '🕯️', max: 5, cost: 1,
      bonus: { overlevel_damage: 0.04 },
      desc: '+4% damage per rank against monsters above your combat level.' },
    { id: 'p_vigil',   tier: 1, name: 'Vigil',          icon: '🛡️', max: 5, cost: 1,
      bonus: { dr: 0.03, maxhp: 0.04 }, desc: '+3% damage reduction and +4% max health per rank.' },

    { id: 'p_zeal',    tier: 2, name: 'Zeal',           icon: '⚔️', max: 5, cost: 1,
      bonus: { damage: 0.04 }, desc: '+4% damage per rank.' },
    { id: 'p_grace',   tier: 2, name: 'Grace',          icon: '💚', max: 5, cost: 1,
      bonus: { mend: 0.015 }, desc: 'Mend restores +1.5% more of your max health per rank.' },

    { id: 'p_martyr',  tier: 3, name: 'Martyr',         icon: '🩸', max: 5, cost: 2,
      bonus: { overlevel_damage: 0.06, overlevel_loot: 0.05 },
      desc: '+6% damage and +5% loot per rank against monsters above your level.' },
    { id: 'p_sermon',  tier: 3, name: 'Sermon',         icon: '📖', max: 5, cost: 2,
      bonus: { xp: 0.05 }, desc: '+5% all XP per rank.' },

    { id: 'p_crusade', tier: 4, name: 'Crusade',        icon: '✝️', max: 5, cost: 3,
      bonus: { overlevel_damage: 0.08, damage: 0.03 },
      desc: '+8% over-level damage and +3% flat damage per rank.' },
    { id: 'p_bulwark', tier: 4, name: 'Bulwark',        icon: '🏰', max: 5, cost: 3,
      bonus: { dr: 0.05, maxhp: 0.08 }, desc: '+5% damage reduction and +8% max health per rank.' },

    { id: 'p_capstone',tier: 5, name: 'Nothing Is Above You', icon: '👑', max: 1, cost: 8,
      flag: 'no_ceiling',
      desc: 'Zone combat-level requirements no longer apply. You may walk into anything.' },
  ],

  // ------------------------------------------------------------
  artisan: [
    { id: 'a_hands',   tier: 1, name: 'Practised Hands',icon: '✋', max: 5, cost: 1,
      bonus: { gather_speed: 0.04 }, desc: '+4% gathering speed per rank.' },
    { id: 'a_ledger',  tier: 1, name: 'The Ledger',     icon: '📒', max: 5, cost: 1,
      bonus: { sell_price: 0.04 }, desc: '+4% sell price per rank.' },

    { id: 'a_yield',   tier: 2, name: 'Careful Yield',  icon: '📦', max: 5, cost: 1,
      bonus: { double_chance: 0.02 }, desc: '+2% chance of a double yield per rank.' },
    { id: 'a_shifts',  tier: 2, name: 'Longer Shifts',  icon: '⏱️', max: 5, cost: 1,
      bonus: { town_revenue: 0.08 }, desc: '+8% town revenue per rank.' },

    { id: 'a_supply',  tier: 3, name: 'Supply Lines',   icon: '🚚', max: 5, cost: 2,
      bonus: { build_cost: -0.05, town_revenue: 0.05 },
      desc: '-5% construction cost and +5% town revenue per rank.' },
    { id: 'a_appr',    tier: 3, name: 'Apprentices',    icon: '🧑‍🏭', max: 5, cost: 2,
      bonus: { hireling_rate: 0.06, gather_speed: 0.03 },
      desc: 'Hirelings work +6% faster and +3% gathering speed per rank.' },

    { id: 'a_monop',   tier: 4, name: 'Monopoly',       icon: '🏦', max: 5, cost: 3,
      bonus: { town_revenue: 0.12, gold: 0.05 }, desc: '+12% town revenue and +5% gold per rank.' },
    { id: 'a_master',  tier: 4, name: 'Masterwork',     icon: '⭐', max: 5, cost: 3,
      bonus: { double_chance: 0.03, gather_speed: 0.04 },
      desc: '+3% double yield and +4% gathering speed per rank.' },

    { id: 'a_capstone',tier: 5, name: 'The Whole Valley', icon: '🏛️', max: 1, cost: 8,
      flag: 'whole_valley',
      desc: 'Every building gains a second extra staff slot, and Hearthwick keeps working at half rate even while you are away.' },
  ],
};

export function treeFor(classId) { return TREES[classId] || []; }
export function nodeById(classId, nodeId) {
  return treeFor(classId).find(n => n.id === nodeId) || null;
}
export function nodesInTier(classId, tier) {
  return treeFor(classId).filter(n => n.tier === tier);
}
export function tierInfo(tier) { return TIERS.find(t => t.tier === tier); }

/** Total points a fully-bought tree costs — used by the UI to show progress. */
export function totalCost(classId) {
  return treeFor(classId).reduce((s, n) => s + n.cost * n.max, 0);
}
