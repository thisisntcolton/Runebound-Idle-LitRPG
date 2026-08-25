// ============================================================
// CLASSES — the second decision Ascension asks you to make
//
// Chosen at character level 10 and re-chosen every cycle, so a class is a
// commitment for one run rather than for the whole save. That is the point:
// Ascension already resets your power, and this gives it a reason to also
// reset your *identity*.
//
// Two design rules:
//
//  1. EVERY BONUS IS A NUMBER IN `passive`, read through one hook
//     (classBonus) that plugs into the same multiplier chain as towns,
//     pets and potions. No class gets a private code path except its one
//     signature, so balance stays legible.
//
//  2. THE ARTISAN GETS NO COMBAT KEYS AT ALL. Not small ones — none. A
//     "crafting class" that quietly still helps you fight is just a worse
//     fighter, and nobody would pick it. Instead it is paid in the
//     economy, where it is the strongest thing in the game by a distance.
//
// Bonus keys map onto core/state.js multipliers:
//   xp, gold, drop_rate, damage, accuracy, dr, maxhp, attack_speed
//   gather_speed, town_revenue, build_cost, sell_price, staff_slots
// ============================================================

export const CLASS_UNLOCK_LEVEL = 10;

export const CLASSES = {
  rogue: {
    id: 'rogue', name: 'Rogue', icon: '🗡️', school: 'physical',
    tagline: 'Hit first, hit often, leave before the bill arrives.',
    blurb: `You were never taught to fight. You were taught to <i>finish</i>, quickly,
            and preferably from behind. It has worked out.`,
    passive: {
      attack_speed: 0.18,     // swings land 18% sooner
      crit: 0.20,             // signature, see below
      drop_rate: 0.15,
    },
    signature: {
      name: 'Backstab', icon: '🩸',
      desc: '20% of your swings are critical hits for double damage.',
    },
    effects: [
      '+18% attack speed',
      '20% critical hit chance (double damage)',
      '+15% rare drop rate',
    ],
    penalty: 'No bonus to raw damage or survivability. You are made of paper.',
  },

  ranger: {
    id: 'ranger', name: 'Ranger', icon: '🏹', school: 'physical',
    tagline: 'Patient, precise, and paid by the pelt.',
    blurb: `Someone who has spent more of their life watching things than
            fighting them, and who has noticed that the two are the same job
            done in a different order.`,
    passive: {
      accuracy: 0.30,
      drop_rate: 0.35,
      gold: 0.20,
      damage: 0.16,
    },
    signature: {
      name: 'Quarry', icon: '🎯',
      desc: 'Your first swing at any monster never misses.',
    },
    effects: [
      '+30% accuracy',
      '+16% damage',
      '+35% rare drop rate',
      '+20% gold',
      'First swing on a new monster always lands',
    ],
    penalty: 'No speed, no crits, no toughness. You out-earn the Rogue; you do not out-kill it.',
  },

  mage: {
    id: 'mage', name: 'Mage', icon: '🔮', school: 'magical',
    tagline: 'Damage as an academic exercise.',
    blurb: `The System indexes your discipline as "unsupported". You have taken
            this as encouragement and it has not corrected you, which from the
            System is practically a blessing.`,
    passive: {
      damage: 0.10,
      xp: 0.15,
      int_damage: 0.015,      // extra damage per point of INT — the real scaling
      dr: -0.30,              // robes
      maxhp: -0.15,           // and not many of them
    },
    signature: {
      name: 'Ember', icon: '🔥',
      desc: 'Your hits set the target alight, dealing 25% of the blow again over the next few seconds.',
    },
    effects: [
      '+10% damage, and +1.5% more per point of INT',
      '+15% all XP',
      'Hits burn for an extra 25% over time',
    ],
    penalty: '-30% damage reduction and -15% maximum health. Robes are not armour.',
  },

  priest: {
    id: 'priest', name: 'Priest', icon: '✨', school: 'magical',
    tagline: 'Walk into what is too big for you. Come back out.',
    blurb: `Wren approves of you, which is the only professional endorsement
            available in Hearthwick and worth more than it sounds.<br><br>
            You do not out-damage things. You <i>outlast</i> them, and that turns out
            to mean you can pick fights nobody else can survive long enough to finish.`,
    passive: {
      maxhp: 0.40,
      dr: 0.22,
      xp: 0.20,
      // The old -10% damage made this the only class that made the game
      // SLOWER than no class at all, and auto-eat already prevents most
      // deaths, so its survivability was solving a problem you rarely had.
      // The power now lives where the toughness is actually useful:
      // punching above your weight.
      overlevel_damage: 0.10,   // per level the monster is above you
      overlevel_loot: 0.07,     // per level, to drop rate and gold
    },
    signature: {
      name: 'Trial by Fire', icon: '⚖️',
      desc: 'Against anything stronger than you: +10% damage and +7% loot per level it outranks you, up to +150% damage and +100% loot. Plus 8% of your max health back on every kill.',
    },
    effects: [
      '+40% maximum health',
      '+22% damage reduction',
      '+20% all XP',
      'Heal 8% of max HP on every kill',
      '+10% damage and +7% loot per level the monster outranks you (max +150% / +100%)',
    ],
    penalty: 'Against anything at or below your level you are exactly average. The bonus only exists when the fight is unfair.',
  },

  artisan: {
    id: 'artisan', name: 'Artisan', icon: '⚒️', school: 'craft',
    tagline: 'Let someone else swing things.',
    blurb: `You looked at a world of monsters and loot and infinite respawns
            and thought: <i>there is a margin in this.</i><br><br>
            There was.`,
    passive: {
      gather_speed: 0.30,
      town_revenue: 0.50,
      sell_price: 0.25,
      build_cost: -0.30,
      staff_slots: 1,
      gold: 0.25,
      xp: 0.10,
    },
    signature: {
      name: 'Master of the Trade', icon: '🏗️',
      desc: 'Every building gets one extra staff slot, and construction costs 30% less.',
    },
    effects: [
      '+30% gathering speed on every skill',
      '+50% town revenue',
      '+25% sell price',
      '-30% construction and upgrade cost',
      '+1 staff slot on every building',
      '+25% gold, +10% all XP',
    ],
    penalty: 'Nothing at all for combat. Not damage, not accuracy, not health. Nothing.',
  },
};

export const CLASS_LIST = Object.values(CLASSES);
export function getClass(id) { return CLASSES[id]; }

export const SCHOOLS = {
  physical: { id: 'physical', name: 'Physical', icon: '⚔️', desc: 'Weapon damage, speed and spoils.' },
  magical:  { id: 'magical',  name: 'Magical',  icon: '🔯', desc: 'Scaling power and staying power, bought with fragility or patience.' },
  craft:    { id: 'craft',    name: 'Craft',    icon: '⚒️', desc: 'No combat power whatsoever, and the best economy in the game.' },
};

// Signature tuning, kept out of the prose above so it is tweakable in one place.
export const SIGNATURE = {
  CRIT_MULTIPLIER: 2.0,
  BURN_FRACTION: 0.25,
  BURN_TICKS: 4,
  BURN_INTERVAL_MS: 1000,
  MEND_FRACTION: 0.08,
  // How many levels of over-ranking the Priest can be paid for.
  OVERLEVEL_CAP: 20,
  // And a hard ceiling on what that scaling can become.
  //
  // The per-level rate is additive across the class passive and three
  // separate talents, so a maxed Priest reached +1.00 damage PER LEVEL —
  // eleven times damage at a ten-level gap, and 572x the combat index of
  // no class at all. Capping the resulting multiplier keeps the identity
  // ("you fight above your weight") while making it a bounded, legible
  // number: at most +150% damage and +100% loot, however deep you go.
  OVERLEVEL_MAX_DAMAGE: 2.5,
  OVERLEVEL_MAX_LOOT: 2.0,
  EXECUTE_THRESHOLD: 0.20,   // Rogue capstone
};
