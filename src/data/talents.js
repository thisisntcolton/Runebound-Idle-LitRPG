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
//   - Tier 6, "Ascendant", is gated on the ERA rather than on class level
//     alone. It does not exist inside the sandbox and cannot be bought
//     there. It holds the strongest single node in the game per class.
//
// And one thing that outlives even the tree: buying a class's tier-5
// capstone earns its MASTERY (see the bottom of this file), a small
// permanent bonus that applies regardless of what you are currently
// playing — including nothing at all.
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

/**
 * The Ascendant tier is gated on ERA rather than on another number, which
 * is the point: it is the first progression in the game that requires you
 * to have got out of the box, not merely to have ground longer inside it.
 * Nothing in Era I can reach it, and no amount of class levels will open
 * it early.
 */
export const ASCENDANT_TIER = 6;
export const ASCENDANT_ERA = 2;

export const TIERS = [
  { tier: 1, atClassLevel: 1,  label: 'Novice' },
  { tier: 2, atClassLevel: 5,  label: 'Adept' },
  { tier: 3, atClassLevel: 10, label: 'Expert' },
  { tier: 4, atClassLevel: 18, label: 'Master' },
  { tier: 5, atClassLevel: 30, label: 'Capstone' },
  { tier: 6, atClassLevel: 40, label: 'Ascendant', era: ASCENDANT_ERA,
    note: 'Sealed while you are still inside the sandbox.' },
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

    { id: 'r_ascend',  tier: 6, name: 'Nothing Personal', icon: '🌒', max: 1, cost: 10,
      bonus: { crit: 0.10, crit_damage: 0.50, attack_speed: 0.08 },
      desc: '+10% critical chance, crits hit for half again as much, +8% attack speed. There is no craft left in it; there is only the arithmetic.' },
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

    { id: 'g_ascend',  tier: 6, name: 'Ten Thousand Hours', icon: '🌘', max: 1, cost: 10,
      bonus: { damage: 0.25, drop_rate: 0.25, gold: 0.10 },
      desc: '+25% damage, +25% rare drop rate, +10% gold. You have now watched the same things die in four different worlds. It shows.' },
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

    { id: 'm_ascend',  tier: 6, name: 'Runaway Reaction', icon: '🌗', max: 1, cost: 10,
      bonus: { int_damage: 0.010, burn: 0.40, xp: 0.10 },
      desc: '+1% damage per point of INT, Ember burns 40% harder, +10% all XP. The discipline the System indexes as "unsupported" turns out to run rather well on unsupported hardware.' },
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

    { id: 'p_ascend',  tier: 6, name: 'Past the Ceiling', icon: '🌖', max: 1, cost: 10,
      flag: 'past_ceiling', bonus: { overlevel_damage: 0.05 },
      desc: 'The cap on Trial by Fire rises from +150% damage and +100% loot to +300% and +200%, and you gain another +5% per level of gap. There was never a ceiling; there was a config value.' },
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

    // The staff slot rides on `bonus` rather than on the flag, so it flows
    // through the same classBonus('staff_slots') read that the town panel
    // already makes. A capstone that needed its own bespoke lookup was how
    // the slot went missing in the first place.
    { id: 'a_capstone',tier: 5, name: 'The Whole Valley', icon: '🏛️', max: 1, cost: 8,
      flag: 'whole_valley', bonus: { staff_slots: 1 },
      desc: 'Every building gains a second extra staff slot, and Hearthwick keeps working at half rate even while you are away.' },

    { id: 'a_ascend',  tier: 6, name: 'Company Town',   icon: '🌕', max: 1, cost: 10,
      bonus: { town_revenue: 0.40, gold: 0.15, staff_slots: 1, build_cost: -0.10 },
      desc: '+40% town revenue, +15% gold, -10% construction cost, and a third extra staff slot on every building. Somebody out here has to be solvent.' },
  ],

  // ------------------------------------------------------------
  warden: [
    { id: 'w_root',    tier: 1, name: 'Rooted',         icon: '🌲', max: 5, cost: 1,
      bonus: { maxhp: 0.05 }, desc: '+5% maximum health per rank.' },
    { id: 'w_barbs',   tier: 1, name: 'Barbed Plate',   icon: '🌵', max: 5, cost: 1,
      bonus: { thorns: 0.02 }, desc: 'Reflect +2% more of every blow per rank.' },

    { id: 'w_brace',   tier: 2, name: 'Brace',          icon: '🧱', max: 5, cost: 1,
      bonus: { dr: 0.03 }, desc: '+3% damage reduction per rank.' },
    { id: 'w_weight',  tier: 2, name: 'Weight Behind It',icon: '🔨', max: 5, cost: 1,
      bonus: { damage: 0.04 }, desc: '+4% damage per rank — you are slow, not soft.' },

    { id: 'w_spite',   tier: 3, name: 'Spite',          icon: '😤', max: 5, cost: 2,
      bonus: { thorns: 0.03, damage: 0.02 }, desc: 'Reflect +3% more and +2% damage per rank.' },
    { id: 'w_endure',  tier: 3, name: 'Endure',         icon: '🗿', max: 5, cost: 2,
      bonus: { maxhp: 0.07, dr: 0.02 }, desc: '+7% max health and +2% damage reduction per rank.' },

    { id: 'w_anvil',   tier: 4, name: 'The Anvil',      icon: '⚒️', max: 5, cost: 3,
      bonus: { thorns: 0.05, maxhp: 0.05 }, desc: 'Reflect +5% more and +5% max health per rank.' },
    { id: 'w_immov',   tier: 4, name: 'Immovable',      icon: '⛰️', max: 5, cost: 3,
      bonus: { dr: 0.05, damage: 0.03 }, desc: '+5% damage reduction and +3% damage per rank.' },

    { id: 'w_capstone',tier: 5, name: 'Nothing Gets Past', icon: '⛨', max: 1, cost: 8,
      flag: 'nothing_past', bonus: { thorns: 0.15 },
      desc: 'No single blow can take more than a third of your maximum health, whatever threw it, and you reflect a further 15%.' },

    { id: 'w_ascend',  tier: 6, name: 'The Long Watch', icon: '🌑', max: 1, cost: 10,
      bonus: { thorns: 0.35, dr: 0.10, maxhp: 0.30 },
      desc: 'Reflect a further 35%, +10% damage reduction, +30% maximum health. At this point most things die of hitting you.' },
  ],

  // ------------------------------------------------------------
  beastmaster: [
    { id: 'bm_bond',   tier: 1, name: 'Bonded',         icon: '❤️', max: 5, cost: 1,
      bonus: { pet_amp: 0.06 }, desc: 'Your companion helps +6% more per rank.' },
    { id: 'bm_feed',   tier: 1, name: 'Well Fed',       icon: '🍖', max: 5, cost: 1,
      bonus: { pet_care: 0.08 }, desc: 'Hunger and happiness fall 8% slower per rank.' },

    { id: 'bm_tooth',  tier: 2, name: 'Tooth and Claw', icon: '🐺', max: 5, cost: 1,
      bonus: { pet_damage: 0.05 }, desc: 'Your pet adds +5% more of your damage per rank.' },
    { id: 'bm_track',  tier: 2, name: 'It Finds Things',icon: '🐾', max: 5, cost: 1,
      bonus: { drop_rate: 0.05 }, desc: '+5% rare drop rate per rank.' },

    { id: 'bm_kin',    tier: 3, name: 'Kinship',        icon: '🫂', max: 5, cost: 2,
      bonus: { pet_amp: 0.08, pet_xp: 0.15 }, desc: 'Companion bonus +8% and bond XP +15% per rank.' },
    { id: 'bm_pack',   tier: 3, name: 'Pack Tactics',   icon: '🐕‍🦺', max: 5, cost: 2,
      bonus: { pet_damage: 0.06, damage: 0.02 }, desc: 'Pet damage +6% and your own +2% per rank.' },

    { id: 'bm_alpha',  tier: 4, name: 'Alpha',          icon: '👑', max: 5, cost: 3,
      bonus: { pet_amp: 0.10, pet_damage: 0.05 }, desc: 'Companion bonus +10% and pet damage +5% per rank.' },
    { id: 'bm_menag',  tier: 4, name: 'The Menagerie',  icon: '🏡', max: 5, cost: 3,
      bonus: { pet_care: 0.10, pet_xp: 0.20 }, desc: 'Care decays 10% slower and bond XP +20% per rank.' },

    { id: 'bm_capstone',tier: 5, name: 'Two of Them',   icon: '🐾', max: 1, cost: 8,
      flag: 'second_companion', bonus: { pet_amp: 0.25 },
      desc: 'A SECOND pet walks with you, and its bonus counts in full. Nobody has explained how you convinced them to get along.' },

    { id: 'bm_ascend', tier: 6, name: 'Something Answered', icon: '👁️', max: 1, cost: 10,
      bonus: { pet_amp: 0.60, pet_damage: 0.30, drop_rate: 0.15 },
      desc: 'Companion bonus +60%, pet damage +30%, +15% rare drops. You called out here and the thing that came back was not a stray.' },
  ],

  // ------------------------------------------------------------
  wanderer: [
    { id: 'wd_pace',   tier: 1, name: 'Good Pace',      icon: '👣', max: 5, cost: 1,
      bonus: { adventure_speed: 0.06 }, desc: 'Encounters find you 6% sooner per rank.' },
    { id: 'wd_eye',    tier: 1, name: 'An Eye Out',     icon: '👁️', max: 5, cost: 1,
      bonus: { drop_rate: 0.05 }, desc: '+5% rare drop rate per rank.' },

    { id: 'wd_haggle', tier: 2, name: 'Road Manners',   icon: '🤝', max: 5, cost: 1,
      bonus: { adventure_reward: 0.06 }, desc: '+6% from every Adventure outcome per rank.' },
    { id: 'wd_light',  tier: 2, name: 'Travelling Light',icon: '🎒', max: 5, cost: 1,
      bonus: { gather_speed: 0.04, gold: 0.03 }, desc: '+4% gathering speed and +3% gold per rank.' },

    { id: 'wd_luck',   tier: 3, name: 'Fortunate',      icon: '🍀', max: 5, cost: 2,
      bonus: { adventure_luck: 0.05, drop_rate: 0.04 },
      desc: 'Adventure outcomes go your way 5% more often, and +4% rare drops, per rank.' },
    { id: 'wd_far',    tier: 3, name: 'Further Out',    icon: '🗺️', max: 5, cost: 2,
      bonus: { adventure_speed: 0.07, adventure_reward: 0.04 },
      desc: 'Encounters 7% sooner and 4% richer per rank.' },

    { id: 'wd_teller', tier: 4, name: 'Worth Listening To', icon: '📖', max: 5, cost: 3,
      bonus: { adventure_reward: 0.09, xp: 0.04 }, desc: '+9% Adventure rewards and +4% all XP per rank.' },
    { id: 'wd_known',  tier: 4, name: 'Known On The Road', icon: '🏮', max: 5, cost: 3,
      bonus: { adventure_luck: 0.06, gold: 0.05 },
      desc: 'Outcomes go your way 6% more often and +5% gold per rank.' },

    { id: 'wd_capstone',tier: 5, name: 'The Road Remembers', icon: '🌄', max: 1, cost: 8,
      flag: 'road_remembers', bonus: { adventure_reward: 0.20 },
      desc: 'Every Adventure chain you have ever finished can find you again — and when it does, the people in it know you.' },

    { id: 'wd_ascend', tier: 6, name: 'No Road Comes Back', icon: '🌌', max: 1, cost: 10,
      bonus: { adventure_speed: 0.50, adventure_reward: 0.45, adventure_luck: 0.15, drop_rate: 0.20 },
      desc: 'Encounters 50% sooner, 45% richer, 15% kinder, +20% rare drops. Quill was wrong about the nine roads. You have found the tenth.' },
  ],
};

// ============================================================
// MASTERIES — what capping a tree leaves behind
//
// A talent tree is permanent, but a CLASS is not: Ascension clears
// state.classId, and every bonus in this file is read through the active
// class. So a player who spent forty hours maxing the Artisan and then
// Ascended watched the extra staff slot vanish, which read — correctly —
// as the game taking something back.
//
// A Mastery is the fix, and it is deliberately narrow. Capping a class's
// tier-5 capstone earns that class's Mastery once, forever, and its bonus
// applies whatever you are playing, or nothing at all. It is not the tree
// going permanent — most of those ranks still only work when you walk the
// path. It is one distilled thing you keep for having finished.
//
// They stack. All five is hundreds of hours of play and is meant to feel
// like it.
// ============================================================

export const MASTERIES = {
  rogue: {
    id: 'rogue', name: 'Muscle Memory', icon: '🗡️',
    bonus: { crit: 0.03, drop_rate: 0.05 },
    desc: '+3% critical hit chance and +5% rare drop rate, permanently, whatever you are.',
    flavour: 'Your hands keep the habit even when the character sheet forgets it.',
  },
  ranger: {
    id: 'ranger', name: 'The Long Watch', icon: '🏹',
    bonus: { drop_rate: 0.08, gold: 0.05 },
    desc: '+8% rare drop rate and +5% gold, permanently, whatever you are.',
    flavour: 'You still notice what the ground is doing. You cannot stop.',
  },
  mage: {
    id: 'mage', name: 'Residual Heat', icon: '🔮',
    bonus: { xp: 0.06, int_damage: 0.002 },
    desc: '+6% all XP and +0.2% damage per point of INT, permanently, whatever you are.',
    flavour: 'Something you learned is still running in the background. It has not been indexed.',
  },
  priest: {
    id: 'priest', name: 'The Vigil Holds', icon: '✨',
    bonus: { maxhp: 0.10, dr: 0.04 },
    desc: '+10% maximum health and +4% damage reduction, permanently, whatever you are.',
    flavour: 'Wren wrote your name down once. It seems to have taken.',
  },
  artisan: {
    id: 'artisan', name: 'The Valley Remembers', icon: '⚒️',
    bonus: { staff_slots: 1, town_revenue: 0.12 },
    desc: '+1 staff slot on every building and +12% town revenue, permanently, whatever you are.',
    flavour: 'You are not the foreman any more. They still keep the chair.',
  },
  warden: {
    id: 'warden', name: 'Still Standing', icon: '🛡️',
    bonus: { dr: 0.06, thorns: 0.08 },
    desc: '+6% damage reduction and 8% of every blow reflected, permanently, whatever you are.',
    flavour: 'You have been hit by worse than this and you are still the same size.',
  },
  beastmaster: {
    id: 'beastmaster', name: 'They Still Come', icon: '🐾',
    bonus: { pet_amp: 0.20, drop_rate: 0.05 },
    desc: 'Your companion helps 20% more and +5% rare drop rate, permanently, whatever you are.',
    flavour: 'You put the whistle away four lifetimes ago. It has never once been needed.',
  },
  wanderer: {
    id: 'wanderer', name: 'The Tenth Road', icon: '🧭',
    bonus: { adventure_speed: 0.15, adventure_reward: 0.12, gold: 0.05 },
    desc: '+15% faster and +12% richer Adventure encounters, and +5% gold, permanently, whatever you are.',
    flavour: 'You cannot stop noticing turnings. It is not always convenient.',
  },
};

/** The node whose purchase earns a class its Mastery. */
export function capstoneNode(classId) {
  return treeFor(classId).find(n => n.tier === 5) || null;
}

export function masteryFor(classId) { return MASTERIES[classId] || null; }

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
