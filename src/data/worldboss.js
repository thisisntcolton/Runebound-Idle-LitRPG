// ============================================================
// THE WORLD BOSS — beta
//
// Everything else in this game is a treadmill you can step onto at any
// moment. This is the one thing that is not: it surfaces on its own
// schedule, it is far too large to kill in a sitting, and — the part that
// makes it worth building — it is the only fight in the game where your
// PREPARATION is a stat.
//
// Three rules, and the second is the whole design:
//
//  1. THE HEALTH POOL PERSISTS. Every point of damage you land is banked
//     in your save. You will not kill this thing today. You will spend
//     four sessions on it and then you will, and nothing you did in
//     session one was wasted.
//
//  2. PREPARATION IS A MULTIPLIER, AND IT IS PRINTED ON THE SCREEN. A
//     brewed potion, town buffs running, a pet at your side, a class
//     walked, food in the bag, full health at the door, depth behind you.
//     Each is a listed line with a number. Walk in cold and you do half
//     damage and take double; walk in ready and it is a fight.
//
//     This is deliberately not a gear check. Every input is something the
//     player already built, in a system they already know, and the boss
//     is the first thing that asks them to bring all of it at once.
//
//  3. YOU CANNOT STAND THERE. Its presence gets heavier the longer you
//     are inside it — an aura that ramps for as long as you hold contact
//     and resets when you back off. So an engagement is a ROUND: go in,
//     hold as long as you can bear, retreat, recover, go again. Without
//     that the whole thing is an idle bar with a big number on it.
//
// No server, no other players, no schedule anybody else can see. If this
// beta proves the fight is fun solo, the shared version is a backend
// problem rather than a design one.
// ============================================================

export const BOSS = {
  /** Ticked play before the first one ever surfaces. */
  FIRST_MS: 45 * 60 * 1000,
  /** And between one submerging and the next surfacing. */
  MIN_MS: 4 * 60 * 60 * 1000,
  MAX_MS: 8 * 60 * 60 * 1000,

  /** How long it stays up once it has surfaced. Real time, not ticked. */
  WINDOW_MS: 36 * 60 * 60 * 1000,

  /**
   * What it takes back when the window closes on a live fight.
   *
   * Note carefully: this is a share of the damage done DURING THAT
   * SURFACING, not of the total missing health. The first version took a
   * share of everything ever done to it, which meant a neglected Vigil
   * healed faster the more wounded it was — a shape that never converges.
   * The simulation says so plainly (`node test/boss.sim.mjs`): every
   * player profile came back "NEVER — regen outruns you". A boss nobody
   * can finish is worse than no boss.
   */
  REGEN_ON_SUBMERGE: 0.30,

  /**
   * Health, before scaling. Tuned by simulation against four player
   * profiles from cycle 4 to cycle 22; the target is two to four sittings
   * for someone who turns up prepared, and roughly four times that for
   * someone who does not.
   *
   * The exponents track how fast a player's damage-per-round actually
   * grows, which is faster than their raw DPS — a tougher player also
   * survives longer in the aura, so a round is both harder-hitting and
   * longer. Scaling this off DPS alone made the late game a two-round
   * fight.
   */
  BASE_HP: 90000,
  HP_PER_CYCLE: 0.14,        // compounding, per Ascension
  HP_PER_DEPTH: 0.015,       // compounding, per floor of your deepest reach

  /** The aura. Damage per second to you, ramping while you hold contact. */
  AURA_BASE: 14,
  AURA_RAMP: 1.030,          // per second of unbroken contact
  AURA_TICK_MS: 1000,
  /** Contact resets this long after you disengage. */
  RECOVERY_MS: 30 * 1000,
};

/**
 * Preparation. Seven lines, each something the player already owns.
 *
 * Weights are not equal and are not meant to be: the potion and the class
 * are the two the game most wants to teach you to bring, and the depth
 * line exists so the Descent feeds something other than itself.
 */
export const PREP = [
  { id: 'potion',  icon: '⚗️', label: 'A potion running',
    detail: 'Any brewed potion active when you engage.', bonus: 0.25 },
  { id: 'town',    icon: '🏘️', label: 'Hearthwick working',
    detail: 'At least two town buffs live — staff on shift, businesses stocked.', bonus: 0.20 },
  { id: 'class',   icon: '🎭', label: 'A path walked',
    detail: 'A class chosen this cycle.', bonus: 0.20 },
  { id: 'depth',   icon: '⬇️', label: 'Ground behind you',
    detail: 'Descent floor 10 or deeper held.', bonus: 0.20 },
  { id: 'pet',     icon: '🐾', label: 'Someone at your side',
    detail: 'A pet along, and not a hungry one.', bonus: 0.15 },
  { id: 'food',    icon: '🍖', label: 'Provisioned',
    detail: '150 or more of your chosen food in the bag.', bonus: 0.10 },
  { id: 'whole',   icon: '❤️', label: 'Whole when you start',
    detail: 'Full health at the moment you engage. Not wounded.', bonus: 0.10 },
];

export const MAX_PREP = PREP.reduce((s, p) => s + p.bonus, 0);   // 1.20 → 2.2x

/**
 * Scales with cycles and with how far down you have been, so it stays a
 * several-session fight rather than becoming a health bar you outgrow.
 */
export function healthFor(ascensions = 0, deepest = 0) {
  return Math.round(BOSS.BASE_HP
    * Math.pow(1 + BOSS.HP_PER_CYCLE, Math.max(0, ascensions - 3))
    * Math.pow(1 + BOSS.HP_PER_DEPTH, Math.max(0, deepest)));
}

// ---------------- Who it is ----------------
//
// Deliberately not a dragon. Era I already had the last flame and killed
// it; the thing that lives under the Wastes should not be a monster at
// all, it should be infrastructure that stopped being switched off.

export const COLOSSUS = {
  id: 'the_vigil',
  name: 'The Vigil',
  icon: '🗼',
  title: 'still running, unassigned',
  blurb: `Something enormous is standing up out of the strata about a mile east, and it
          has been standing up for six hours, and it is not finished. Quill has measured
          the part that is out so far and stopped measuring.`,
  lore: [
    `It is not a creature. Nobody who looks at it thinks it is a creature. It has the
     proportions of a thing that was built to be looked after by people who then left.`,
    `Ferrin found a plate on the ankle with a service interval on it. The interval is
     nine hundred years. The last date stamped under it is blank.`,
    `[ SYSTEM ] Asset VIGIL-1 is not scheduled for decommission. Asset VIGIL-1 has never
     been scheduled for anything. Asset VIGIL-1 is simply, and has always been, on.`,
    `Wren says the worst part is that it is careful. It steps around the town. It has
     stepped around the town four times. Something in it still knows what a town is for.`,
  ],
  /** What it drops. Rolled once, on the kill, and never again per boss. */
  spoils: {
    gold: [900000, 1600000],
    items: [
      { item: 'blank_tome', qty: [3, 6] },
      { item: 'deprecated_asset', qty: [12, 24] },
      { item: 'corrupt_sigil', qty: [20, 40] },
      { item: 'orphaned_shard', qty: [60, 120] },
    ],
    shards: 12,
  },
};

/**
 * The permanent reward, per Vigil felled. Small, compounding, and — like
 * the Descent's depth and the classes' Masteries — never taken back.
 */
export const TROPHY = {
  damage: 0.04,
  maxhp: 0.04,
  gold: 0.05,
};

/** Ramping aura damage after `seconds` of unbroken contact. */
export function auraDps(seconds, prepFraction) {
  const exposure = 2 - Math.max(0, Math.min(1, prepFraction));   // 1x prepared, 2x cold
  return BOSS.AURA_BASE * Math.pow(BOSS.AURA_RAMP, seconds) * exposure;
}
