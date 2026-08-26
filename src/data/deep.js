// ============================================================
// THE DESCENT — Era II's combat spine
//
// Era II shipped with exactly one place to fight, and you could only get
// to it by being robbed first. That is a fine consequence and a terrible
// destination: a player who arrived in the Wastes as a fighter had a
// digging system gated on gathering skills, a tax on their gold, and an
// antagonist who only turned up on a timer. Nothing to hit.
//
// The Descent is the answer. The Wastes are made of discarded places
// stacked on each other, so you go DOWN through them. Three rules:
//
//  1. IT IS A LADDER, NOT A MENU. One depth at a time. Clear the denizens
//     at your deepest to open the next. You always know exactly what the
//     next thing to do is, which is the property a combat loop needs and
//     a zone list does not have.
//
//  2. IT IS CAPPED BY CYCLES, NOT BY LEVEL. How deep you may go is set by
//     how many times you have Ascended. Era II keeps the town through
//     Ascension, which removed most of the reason to do it; this puts a
//     reason back, and puts it in the fighter's hands specifically.
//
//  3. DEPTH IS PERMANENT. Your deepest reach survives Ascension and pays
//     a standing bonus forever. It is the fighter's version of the
//     Artisan's town and the digger's keyring: a number that only ever
//     goes up, earned the way they like to play.
// ============================================================

export const DEEP = {
  /** Denizens to put down at a depth before the next one opens. */
  CLEARS_PER_DEPTH: 8,

  /** Every fifth floor is held by a Warden instead. One kill, much harder. */
  WARDEN_EVERY: 5,

  /**
   * Depth ceiling. Four cycles is the earliest anyone reaches the Wastes,
   * so a fresh arrival gets 20 floors — enough to be a real run — and each
   * Ascension after that opens three more.
   *
   * The cap is meant to be the thing that stops you, not the difficulty.
   * That is the whole reason it exists: Era II keeps the town through
   * Ascension, which took away most of the reason to Ascend, and this puts
   * one back where the fighter can see it.
   */
  BASE_CAP: 8,
  CAP_PER_CYCLE: 3,

  /** Permanent, per depth ever reached. Small numbers; they add up. */
  BONUS_PER_DEPTH: { damage: 0.01, gold: 0.015, drop_rate: 0.008 },

  /** Nothing below this is worth the walk. */
  FIRST_DEPTH_LEVEL: 62,
  LEVEL_PER_DEPTH: 1.6,
};

export function depthCap(ascensions = 0) {
  return Math.max(1, (DEEP.BASE_CAP + DEEP.CAP_PER_CYCLE * Math.max(0, ascensions)));
}

export function isWardenDepth(depth) {
  return depth > 0 && depth % DEEP.WARDEN_EVERY === 0;
}

// ---------------- The denizens ----------------
//
// Named, not generated-sounding. A player who fights the same six things
// for two hundred floors should at least be able to tell you what they
// are called and what they are doing down there.

const DENIZENS = [
  { name: 'Orphaned Process',  icon: '⬛', line: 'Still running. Nobody has told it what for.' },
  { name: 'Sump Crawler',      icon: '🪲', line: 'It eats the parts of places that nobody indexed.' },
  { name: 'Half-Deleted Man',  icon: '👤', line: 'Above the waist he is very detailed indeed.' },
  { name: 'Stack of Wolves',   icon: '🐺', line: 'Six wolves in one wolf-shaped space. A packing error.' },
  { name: 'Cache Revenant',    icon: '💀', line: 'Whatever it was, it was saved. Repeatedly.' },
  { name: 'Sediment Golem',    icon: '🗿', line: 'Four different floors, compressed, with opinions.' },
  { name: 'Null Weaver',       icon: '🕷️', line: 'It is making something out of the gaps between things.' },
  { name: 'Recursion',         icon: '🌀', line: 'It is fighting you. It is also fighting itself. It is losing both.' },
];

const WARDENS = [
  { name: 'The Foreman',        icon: '🔨', line: 'Somebody has to hold the floor. Nobody asked him to.' },
  { name: 'Archivist of Silt',  icon: '📜', line: 'It has a record of every thing that was thrown down here, including you.' },
  { name: 'The Long Auditor',   icon: '📐', line: 'Taller than the room it is standing in, which it has not remarked on.' },
  { name: 'Compression Wyrm',   icon: '🐉', line: 'Four hundred metres of it, in nine metres of tunnel.' },
  { name: 'The Understudy',     icon: '🎭', line: 'It is wearing your build. It is wearing it slightly better.' },
];

/** The strata you are cutting through, purely for flavour and legibility. */
export const STRATA = [
  { at: 1,  name: 'The Overburden',   desc: 'Loose debris and last week. It has not settled yet.' },
  { at: 6,  name: 'The Packed Layer', desc: 'Places that were deleted carefully, in the right order.' },
  { at: 13, name: 'The Old Builds',   desc: 'Whole towns, face down, with their lights still on.' },
  { at: 22, name: 'The Sump',         desc: 'Where everything that was never finished ended up together.' },
  { at: 34, name: 'The Understructure',desc: 'You are below the part that was meant to have a floor.' },
  { at: 50, name: 'Unnamed',          desc: 'The Codex stops here. Quill will not draw past this line.' },
];

export function stratumFor(depth) {
  let out = STRATA[0];
  for (const s of STRATA) if (depth >= s.at) out = s;
  return out;
}

// ---------------- Scaling ----------------
//
// These four exponents were picked by simulation (test/deep.sim.mjs), and
// the first draft of them was wrong in an instructive way, so it is worth
// recording why they are what they are.
//
// The naive version scaled DEFENCE steeply — 1.13 a floor. Defence in this
// game denies hits, and hit chance has a hard 5% floor, so within fifteen
// floors every player of every build was reduced to missing 95% of their
// swings against something that killed them in four hits. That is not a
// difficulty curve; it is a cliff with a number on it.
//
// So the axes are deliberately unequal:
//
//   HEALTH scales fastest (1.085). Health costs you TIME, and time is the
//   correct currency for an idle wall: a floor you cannot beat yet is a
//   floor that takes twenty minutes a kill, which you notice and walk away
//   from, rather than one you bounce off and conclude is broken.
//
//   DEFENCE barely moves (1.035). You should always be landing blows.
//
//   DAMAGE moves gently (1.055), so the floors get genuinely dangerous
//   without outrunning food and damage reduction in a dozen floors.
//
//   GOLD outruns health (1.13 vs 1.085), so deeper is ALWAYS worth it —
//   the property that makes a descent a descent rather than a set of zones
//   with an optimum in the middle. Only just, though: the first pass used
//   1.16, which had floor 70 paying four million a minute and made every
//   other economy in the game a rounding error. The real reason to
//   descend is meant to be the standing bonus and the haul table, not a
//   gold faucet that eats the rest of the design.

function pow(base, depth) { return Math.pow(base, depth - 1); }

export function deepMonster(depth, index = 0) {
  const warden = isWardenDepth(depth);
  const pool = warden ? WARDENS : DENIZENS;
  const flavour = pool[(warden ? Math.floor(depth / DEEP.WARDEN_EVERY) - 1 : index) % pool.length];
  const level = Math.round(DEEP.FIRST_DEPTH_LEVEL + depth * DEEP.LEVEL_PER_DEPTH);

  // A Warden is one kill instead of eight, so it is worth roughly three of
  // them and hits like five. It is not a separate difficulty tier.
  const hp   = Math.round(620 * pow(1.085, depth) * (warden ? 2.2 : 1));
  const def  = Math.round(130 * pow(1.035, depth) * (warden ? 1.20 : 1));
  const atk  = Math.round(60  * pow(1.040, depth) * (warden ? 1.25 : 1));
  const hit  = Math.round(28  * pow(1.055, depth) * (warden ? 1.35 : 1));
  const goldBase = 520 * pow(1.13, depth) * (warden ? 6 : 1);

  return {
    id: `deep_${depth}_${warden ? 'warden' : index}`,
    name: warden ? flavour.name : flavour.name,
    icon: flavour.icon,
    line: flavour.line,
    level,
    hp, defense: def, attack: atk, maxHit: hit,
    attackSpeed: warden ? 2900 : 2500,
    boss: warden,
    depth,
    gold: [Math.round(goldBase * 0.75), Math.round(goldBase * 1.35)],
    lootProfile: warden ? 'boss' : depth >= 10 ? 'elite' : 'trash',
    loot: haulFor(depth, warden),
  };
}

/**
 * Loot tables shift down the material ladder as you descend, so the
 * Descent stays worth running when the shallow floors stop being a fight.
 */
function haulFor(depth, warden) {
  const deep = depth >= 12, deeper = depth >= 24, deepest = depth >= 38;
  const table = {
    common:   [{ item: 'scrap_code', qty: [4, 12] },
               { item: 'glitched_ore', qty: [2, 6] }],
    uncommon: [{ item: 'glitched_ore', qty: [6, 16] },
               { item: 'orphaned_shard', qty: [1, 4] }],
    rare:     [{ item: 'glitched_bar', qty: [2, 7] },
               { item: 'orphaned_shard', qty: [4, 10] }],
    epic:     [{ item: 'corrupt_sigil', qty: [1, 3] },
               { item: 'deprecated_asset', qty: [1, 2] }],
    legendary:[{ item: 'blank_tome', qty: 1 }],
  };
  if (deep) {
    table.common = [{ item: 'glitched_ore', qty: [4, 10] }, { item: 'scrap_code', qty: [8, 20] }];
    table.uncommon.push({ item: 'glitched_bar', qty: [1, 3] });
  }
  if (deeper) {
    table.uncommon = [{ item: 'glitched_bar', qty: [2, 6] }, { item: 'orphaned_shard', qty: [4, 9] }];
    table.rare.push({ item: 'corrupt_sigil', qty: [1, 2] });
  }
  if (deepest) {
    table.rare = [{ item: 'corrupt_sigil', qty: [2, 4] }, { item: 'glitched_bar', qty: [8, 18] }];
    table.epic.push({ item: 'blank_tome', qty: 1 });
  }
  if (warden) {
    table.epic.push({ item: 'deprecated_asset', qty: [2, 5] });
    table.legendary = [{ item: 'blank_tome', qty: [1, 2] }, { item: 'deprecated_asset', qty: [4, 8] }];
  }
  return table;
}
