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

  // ============================================================
  // THE SECOND THREE
  //
  // Five classes covered two ways of hitting things, one way of not
  // dying, and one way of not fighting at all. Three obvious identities
  // were missing, and each of them is a system the game already has that
  // no class had ever looked at:
  //
  //   Nothing was built around TAKING a hit. Every class either avoided
  //   damage or out-raced it. The Warden is the first one that wants to
  //   be hit, which is a real strategy against anything with a health
  //   pool measured in minutes.
  //
  //   Nothing looked at the MENAGERIE. Fifteen species, a whole care and
  //   breeding loop, and not one class that cared whether you had a pet.
  //
  //   Nothing looked at the ROAD. The Wanderer exists because Adventure
  //   does, and a system with no class attached to it reads as a side
  //   feature rather than a third way to play.
  // ============================================================

  warden: {
    id: 'warden', name: 'Warden', icon: '🛡️', school: 'physical',
    tagline: 'Stand in front of it. Keep standing in front of it.',
    blurb: `Holt trained you, in the sense that Holt stood next to you for a year and
            occasionally said "no". You have never won a fight quickly. You have
            never lost one either.<br><br>
            The trick, as far as anyone can tell, is that you simply do not move.`,
    passive: {
      maxhp: 0.55,
      dr: 0.30,
      thorns: 0.25,           // signature: a share of every blow goes back
      damage: -0.10,
      attack_speed: -0.10,
    },
    signature: {
      name: 'Hold the Line', icon: '⛨',
      desc: 'A quarter of every blow that lands on you is returned to whatever threw it.',
    },
    effects: [
      '+55% maximum health',
      '+30% damage reduction',
      '25% of all damage you take is reflected back',
      'Nothing you fight gets to walk away from a long fight',
    ],
    penalty: '-10% damage and -10% attack speed. You will be here a while. That is the plan.',
  },

  beastmaster: {
    id: 'beastmaster', name: 'Beastmaster', icon: '🐾', school: 'wild',
    tagline: 'You are not the dangerous one in this arrangement.',
    blurb: `You have never been the strongest thing in a fight you were in, and you
            have stopped finding that troubling.<br><br>
            Whatever is walking with you today learned its job from you, and has
            improved on it.`,
    passive: {
      pet_amp: 1.00,          // signature: your companion is twice the pet
      pet_damage: 0.35,       // and it fights
      drop_rate: 0.20,
      xp: 0.10,
      dr: -0.10,
    },
    signature: {
      name: 'The Pack', icon: '🐺',
      desc: 'Your companion helps twice as much as it would for anyone else, and fights beside you for a share of your damage.',
    },
    effects: [
      'Your active pet\'s bonus is DOUBLED',
      'Your pet adds 35% of your damage on every swing',
      '+20% rare drop rate, +10% all XP',
      'Every species is worth playing; the roster is the build',
    ],
    penalty: '-10% damage reduction, and every one of these numbers is zero if you have no pet with you or it is miserable.',
  },

  wanderer: {
    id: 'wanderer', name: 'Wanderer', icon: '🧭', school: 'wild',
    tagline: 'The road is the point. The destination keeps moving anyway.',
    blurb: `Quill has nine roads mapped and all nine come back. You have walked all
            nine and you disagree, and you cannot say why, and you keep going out.<br><br>
            Things happen to you that do not happen to people who stay in.`,
    passive: {
      adventure_speed: 0.40,   // signature: the road moves under you
      adventure_reward: 0.35,
      drop_rate: 0.25,
      gold: 0.20,
      gather_speed: 0.15,
      maxhp: -0.10,
    },
    signature: {
      name: 'Far Roads', icon: '🌄',
      desc: 'Encounters find you 40% sooner and pay 35% better. What the road gives you, it gives you more of.',
    },
    effects: [
      '+40% faster Adventure encounters',
      '+35% from every Adventure outcome',
      '+25% rare drop rate, +20% gold',
      '+15% gathering speed — you pick things up on the way',
    ],
    penalty: '-10% maximum health. Nothing about this build wants a long fight.',
  },
};

export const CLASS_LIST = Object.values(CLASSES);
export function getClass(id) { return CLASSES[id]; }

export const SCHOOLS = {
  physical: { id: 'physical', name: 'Physical', icon: '⚔️', desc: 'Weapon damage, speed and spoils.' },
  magical:  { id: 'magical',  name: 'Magical',  icon: '🔯', desc: 'Scaling power and staying power, bought with fragility or patience.' },
  craft:    { id: 'craft',    name: 'Craft',    icon: '⚒️', desc: 'No combat power whatsoever, and the best economy in the game.' },
  wild:     { id: 'wild',     name: 'Wild',     icon: '🌿', desc: 'Company kept and roads walked. Power that comes from somewhere other than you.' },
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
  // Raised, not removed, by the Priest's Ascendant node.
  OVERLEVEL_ASCENDANT_DAMAGE: 4.0,
  OVERLEVEL_ASCENDANT_LOOT: 3.0,
  EXECUTE_THRESHOLD: 0.20,   // Rogue capstone
};
