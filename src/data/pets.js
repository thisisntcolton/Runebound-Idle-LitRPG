// ============================================================
// THE MENAGERIE — eggs, pets, growth and breeding
//
// Tamagotchi rules, idle-game pacing:
//  - Eggs incubate on a real-time timer.
//  - Pets get hungry and lonely whether or not you're looking.
//  - A neglected pet doesn't die (this is an idle game and that would
//    be miserable) — it sulks, and a sulking pet gives no bonus.
//  - Your one ACTIVE pet grants a passive bonus that scales with its
//    level and current mood.
//  - Two adults can be bred; the egg inherits from both parents and
//    has a shot at climbing a rarity tier.
// ============================================================

export const RARITIES = ['common', 'rare', 'epic', 'legendary'];

// ---------------- Growth stages ----------------
// Pets advance by earning bond XP, not by a wall-clock timer, so an
// attentive owner gets there faster.
export const STAGES = [
  { id: 'egg',      name: 'Egg',      atLevel: 0,  scale: 0.85 },
  { id: 'hatchling',name: 'Hatchling',atLevel: 1,  scale: 0.62 },
  { id: 'juvenile', name: 'Juvenile', atLevel: 8,  scale: 0.80 },
  { id: 'adult',    name: 'Adult',    atLevel: 20, scale: 1.0 },
  { id: 'elder',    name: 'Elder',    atLevel: 45, scale: 1.12 },
];

export function stageFor(level) {
  let s = STAGES[1];
  for (const st of STAGES) if (st.atLevel > 0 && level >= st.atLevel) s = st;
  return s;
}

export const BREEDABLE_STAGE = 'adult';
export const MAX_PET_LEVEL = 60;

// ---------------- Care ----------------
export const CARE = {
  // Hunger and happiness both run 0-100 and decay in real time.
  // Tuned so a full pet survives a night's sleep: 7.8h to hungry,
  // 11.7h to lonely, and it takes BOTH to make one miserable.
  HUNGER_DECAY_PER_HOUR: 9,
  HAPPY_DECAY_PER_HOUR: 6,
  // Below these, the pet stops granting its bonus.
  HUNGRY_AT: 30,
  SAD_AT: 30,
  // Playing costs nothing but has a cooldown, so it's a check-in, not a grind.
  PLAY_COOLDOWN_MS: 20 * 60 * 1000,
  PLAY_HAPPY: 28,
  PLAY_XP: 12,
  // Feeding converts food into fullness AND bond XP, and BOTH scale with
  // what you fed it. A raw shrimp used to bond exactly as well as a
  // leviathan steak, which made the whole cooking chain pointless to a
  // pet owner. Cooked food (anything with a heal value) is worth an
  // explicit premium on top of its price, so the effort counts.
  FEED_XP_BASE: 5,
  FEED_XP_PER_ROOT_VALUE: 1.3,   // multiplied by sqrt(sell price)
  FEED_XP_COOKED_MULT: 1.5,      // properly cooked, not raw
  FEED_XP_CAP: 45,               // before the favourite-food doubling
  // A well-cared-for pet passively earns bond XP over time.
  IDLE_XP_PER_HOUR: 30,
  WELL_KEPT_AT: 70,     // both stats above this = "thriving", double idle XP

  // A pet that comes adventuring bonds far faster than one left at home.
  // Kills and completed skill actions both count, but the total is rate
  // limited against the WALL CLOCK — so an offline catch-up burst of ten
  // thousand hireling actions can't dump a lifetime of XP in one frame.
  ACTIVITY_XP_PER_KILL: 0.5,
  ACTIVITY_XP_PER_ACTION: 0.3,
  ACTIVITY_XP_PER_SECOND_CAP: 0.12,   // ~432/hr ceiling from active play
};

// ---------------- Species ----------------
// bonus.key feeds the same multiplier chain everything else uses.
// perLevel is the bonus added per pet level (at full mood).
export const SPECIES = {
  cat: {
    id: 'cat', name: 'Cat', rarity: 'common', icon: '🐈',
    eggName: 'Speckled Egg', eggIcon: '🥚',
    blurb: 'Arrived uninvited, stayed permanently, acts like it owns the place. It may.',
    desc: 'Cats have an unerring sense for anything shiny and unattended.',
    bonus: { key: 'gold', perLevel: 0.004, label: 'gold' },   // +24% at Lv60
    likes: ['raw_shrimp', 'raw_trout', 'raw_salmon', 'shrimp', 'trout', 'salmon'],
    hatchMs: 20 * 60 * 1000,
    palette: { body: '#8a8f9c', belly: '#d8dce4', accent: '#f0a8b8', eye: '#8fdb6a' },
    idleLines: ['is sitting in a box that is clearly too small.', 'knocked something off a shelf while maintaining eye contact.', 'has decided your lap is public property.'],
  },
  dog: {
    id: 'dog', name: 'Dog', rarity: 'common', icon: '🐕',
    eggName: 'Warm Egg', eggIcon: '🥚',
    blurb: 'Loyal past the point of good sense. Would follow you into a Rift. Has.',
    desc: 'Dogs find things. Mostly the things you were about to trip over, but sometimes treasure.',
    bonus: { key: 'drop_rate', perLevel: 0.004, label: 'rare drop rate' },  // +24% at Lv60
    likes: ['raw_trout', 'trout', 'lobster', 'raw_lobster', 'leviathan_steak'],
    hatchMs: 20 * 60 * 1000,
    palette: { body: '#a9773f', belly: '#e6cfa8', accent: '#5e3e26', eye: '#3a2a1a' },
    idleLines: ['brought you a stick. It is a very good stick.', 'is asleep upside down and dreaming loudly.', 'has not stopped wagging since you walked in.'],
  },
  frog: {
    id: 'frog', name: 'Frog', rarity: 'rare', icon: '🐸',
    eggName: 'Dewy Cluster', eggIcon: '🫧',
    blurb: 'Found in the Gloomroot shallows. Blinks at a rhythm that is almost, but not quite, a language.',
    desc: 'Something about a frog on your shoulder makes the world easier to learn from.',
    bonus: { key: 'xp', perLevel: 0.005, label: 'all XP' },   // +30% at Lv60
    likes: ['herb_sagewort', 'herb_mooncap', 'herb_emberpetal', 'herb_voidbloom'],
    hatchMs: 45 * 60 * 1000,
    palette: { body: '#5aa85c', belly: '#cfe8a8', accent: '#2f6b3a', eye: '#f2d68a' },
    idleLines: ['is blinking in a pattern. You are choosing not to think about it.', 'ate something it definitely should not have.', 'has puffed up to roughly twice its usual volume.'],
  },
  poro: {
    id: 'poro', name: 'Poro', rarity: 'epic', icon: '🐑',
    eggName: 'Frostwool Puff', eggIcon: '❄️',
    blurb: 'A ball of fluff with a tongue and no discernible legs. Emits contentment like a small furnace.',
    desc: 'Nothing that follows a Poro around stays frightening for long. Your swings land harder for it.',
    bonus: { key: 'damage', perLevel: 0.007, label: 'damage' },   // +42% at Lv60
    likes: ['shrimp', 'trout', 'salmon', 'lobster', 'leviathan_steak', 'town_coffee'],
    hatchMs: 90 * 60 * 1000,
    palette: { body: '#f4f1ea', belly: '#ffffff', accent: '#e8a0b4', eye: '#3a3a44' },
    idleLines: ['made a noise like a kettle being hugged.', 'is somehow both asleep and vibrating.', 'has stuck its tongue out and forgotten about it.'],
  },
  wyrmling: {
    id: 'wyrmling', name: 'Wyrmling', rarity: 'legendary', icon: '🐲',
    eggName: 'Ember-Scaled Egg', eggIcon: '🔥',
    blurb: 'The Dragonspire does not give these up willingly. It is very small, very warm, and very sure of itself.',
    desc: 'A creature that will one day be enormous. For now it fits in a satchel and improves everything.',
    bonus: { key: 'xp', perLevel: 0.005, label: 'all XP', second: { key: 'gold', perLevel: 0.005, label: 'gold' } },  // +30%/+30% at Lv60
    likes: ['leviathan_steak', 'lobster', 'runite_bar', 'refined_tonic'],
    hatchMs: 3 * 60 * 60 * 1000,
    palette: { body: '#b8543f', belly: '#e8b45a', accent: '#7a2f24', eye: '#ffd97a' },
    idleLines: ['is hoarding your buttons. All of them.', 'set a small, apologetic fire.', 'attempted a roar. It came out as a hiccup.'],
  },

  // ============================================================
  // THE WIDER MENAGERIE
  //
  // Five species meant five bonuses, and three of those were "a
  // percentage of something you already had a percentage of". Ten more
  // fixes the roster in two ways: there is now a pet for every way of
  // playing — a gatherer's bird, a crafter's beetle, a tank's axolotl —
  // and the rarity ladder has enough rungs that a common egg is a
  // genuine roll rather than a coin flip between a cat and a dog.
  //
  // Each of these declares a `build` instead of bespoke artwork. The five
  // originals are hand-drawn; these are assembled from body plans in
  // ui/petart.js, which is the difference between ten species and ten
  // afternoons. A plan plus a palette plus three feature flags reads as a
  // distinct animal at portrait size, which is the only size they are
  // ever seen at.
  // ============================================================

  // ---- common ----
  sparrow: {
    id: 'sparrow', name: 'Hearth Sparrow', rarity: 'common', icon: '🐦',
    eggName: 'Thatch Egg', eggIcon: '🥚',
    blurb: 'Nests in the eaves of whatever you have most recently built. Supervises.',
    desc: 'Follows you to the treeline and back and somehow the work goes quicker.',
    bonus: { key: 'gather_speed', perLevel: 0.003, label: 'gathering speed' },
    likes: ['wheat', 'root_veg', 'bread', 'herb_sagewort'],
    hatchMs: 18 * 60 * 1000,
    palette: { body: '#a9764a', belly: '#e8d6b4', accent: '#5e3e26', eye: '#2a2a33' },
    build: { plan: 'bird', crest: false, tailFan: true },
    idleLines: ['has taken a piece of your roof for its nest.', 'is shouting at nothing in particular.', 'landed on your head and stayed there.'],
  },
  mouse: {
    id: 'mouse', name: 'Pocket Mouse', rarity: 'common', icon: '🐁',
    eggName: 'Pebble Egg', eggIcon: '🥚',
    blurb: 'Lives in a pocket. Not always the same pocket, and not always yours.',
    desc: 'Comes back with more than it left with. Nobody has established how.',
    bonus: { key: 'double_chance', perLevel: 0.0025, label: 'double yield chance' },
    likes: ['wheat', 'bread', 'root_veg', 'shrimp'],
    hatchMs: 18 * 60 * 1000,
    palette: { body: '#9c9aa4', belly: '#e2dfe8', accent: '#f0a8b8', eye: '#2a2a33' },
    build: { plan: 'quadruped', ears: 'round', tail: 'thin', small: true },
    idleLines: ['has hoarded eleven identical pebbles.', 'is asleep in a boot.', 'stole a crumb it did not need and looked at you while doing it.'],
  },
  beetle: {
    id: 'beetle', name: 'Coin Beetle', rarity: 'common', icon: '🪲',
    eggName: 'Lacquered Case', eggIcon: '🟤',
    blurb: 'Its shell is the exact colour of a coin that has been in circulation too long.',
    desc: 'Merchants find it hard to argue with something that is watching them like that.',
    bonus: { key: 'sell_price', perLevel: 0.003, label: 'sell price' },
    likes: ['oak_log', 'willow_log', 'herb_mooncap', 'root_veg'],
    hatchMs: 22 * 60 * 1000,
    palette: { body: '#8a6b2f', belly: '#c9a24a', accent: '#5a4520', eye: '#f2d68a' },
    build: { plan: 'insect', shell: true, antennae: true },
    idleLines: ['has rolled a coin into a corner and is sitting on it.', 'clicks twice whenever you are being overcharged.', 'is upside down again.'],
  },

  // ---- rare ----
  owl: {
    id: 'owl', name: 'Ledger Owl', rarity: 'rare', icon: '🦉',
    eggName: 'Vellum Egg', eggIcon: '🫧',
    blurb: 'Ferrin swears it reads over his shoulder. Ferrin is correct.',
    desc: 'Watches you work and, somehow, you notice more of what you are doing.',
    bonus: { key: 'xp', perLevel: 0.0045, label: 'all XP' },
    likes: ['raw_trout', 'raw_salmon', 'herb_mooncap', 'herb_voidbloom'],
    hatchMs: 50 * 60 * 1000,
    palette: { body: '#7a6a58', belly: '#ddd0bc', accent: '#4a3f34', eye: '#f5c542' },
    build: { plan: 'bird', crest: true, tailFan: false, bigEyes: true },
    idleLines: ['has rotated its head further than seems structurally advisable.', 'is judging your inventory management.', 'brought back a page from something. It is numbered 4,412.'],
  },
  fox: {
    id: 'fox', name: 'Ashfox', rarity: 'rare', icon: '🦊',
    eggName: 'Cinder Egg', eggIcon: '🔥',
    blurb: 'Turns up after a fire, sits in the warm part, and will not be moved.',
    desc: 'Finds the good thing in the wreckage before anybody else has stopped coughing.',
    bonus: { key: 'drop_rate', perLevel: 0.0055, label: 'rare drop rate' },
    likes: ['raw_lobster', 'lobster', 'leviathan_steak', 'ember_stew'],
    hatchMs: 55 * 60 * 1000,
    palette: { body: '#c2673a', belly: '#efdcc4', accent: '#7a3a22', eye: '#8fdb6a' },
    build: { plan: 'quadruped', ears: 'pointed', tail: 'bushy' },
    idleLines: ['has buried something and forgotten where.', 'is sitting exactly where the fire was.', 'stared at the treeline for four minutes without blinking.'],
  },
  axolotl: {
    id: 'axolotl', name: 'Sump Axolotl', rarity: 'rare', icon: '🦎',
    eggName: 'Gelid Cluster', eggIcon: '🫧',
    blurb: 'Came up out of the standing water under the old builds. Perpetually delighted.',
    desc: 'Regrows things. Being near one, so do you, a bit.',
    bonus: { key: 'maxhp', perLevel: 0.005, label: 'maximum health' },
    likes: ['raw_shrimp', 'raw_glasseel', 'herb_nullbud', 'silkleaf'],
    hatchMs: 55 * 60 * 1000,
    palette: { body: '#e8a0b4', belly: '#f8dde4', accent: '#c96f88', eye: '#2a2a33' },
    build: { plan: 'serpent', frills: true, legs: true },
    idleLines: ['is smiling. It is always smiling. It has no choice.', 'regrew a limb overnight and seems unbothered.', 'is standing on the bottom of the bucket, thinking.'],
  },

  // ---- epic ----
  moth: {
    id: 'moth', name: 'Lanternmoth', rarity: 'epic', icon: '🦋',
    eggName: 'Silk Bundle', eggIcon: '🕸️',
    blurb: 'Its wings hold a light that does not come from anywhere. Vera has checked.',
    desc: 'Things swing at where the light is. The light is not quite where you are.',
    bonus: { key: 'dr', perLevel: 0.0035, label: 'damage reduction' },
    likes: ['herb_emberpetal', 'herb_voidbloom', 'herb_dawnthistle', 'silkleaf'],
    hatchMs: 100 * 60 * 1000,
    palette: { body: '#8f7fc4', belly: '#ded4f5', accent: '#5b4d8a', eye: '#ffd97a' },
    build: { plan: 'insect', wings: true, antennae: true, glow: true },
    idleLines: ['is throwing a shadow in the wrong direction.', 'has settled on the lamp and dimmed it.', 'left dust on everything. The dust is faintly warm.'],
  },
  stag: {
    id: 'stag', name: 'Worldroot Stag', rarity: 'epic', icon: '🦌',
    eggName: 'Bark-Wrapped Egg', eggIcon: '🌰',
    blurb: 'Its antlers are growing. Not the way antlers grow — the way roots do.',
    desc: 'Walks the ground ahead of you and the ground is better for it.',
    bonus: { key: 'gather_speed', perLevel: 0.004, label: 'gathering speed',
             second: { key: 'xp', perLevel: 0.004, label: 'all XP' } },
    likes: ['maple_log', 'yew_log', 'heartwood_log', 'moon_gourd'],
    hatchMs: 110 * 60 * 1000,
    palette: { body: '#6b5a3c', belly: '#c8b995', accent: '#3f7a4a', eye: '#f2d68a' },
    build: { plan: 'quadruped', ears: 'pointed', tail: 'thin', horns: 'branching', tall: true },
    idleLines: ['has put down roots. Literally. You will need a spade.', 'is standing perfectly still where a tree used to be.', 'shed an antler. It sprouted.'],
  },

  // ---- legendary ----
  serpent: {
    id: 'serpent', name: 'Seam Serpent', rarity: 'legendary', icon: '🐍',
    eggName: 'Hairline Egg', eggIcon: '⚡',
    blurb: 'Found coiled in the join where two identical skies were fitted together.',
    desc: 'It goes into the seam and comes out somewhere else with something in its mouth.',
    bonus: { key: 'damage', perLevel: 0.006, label: 'damage',
             second: { key: 'drop_rate', perLevel: 0.005, label: 'rare drop rate' } },
    likes: ['raw_kraken', 'kraken_platter', 'null_rune', 'void_rune'],
    hatchMs: 3.5 * 60 * 60 * 1000,
    palette: { body: '#3f6b8a', belly: '#a8d4e8', accent: '#7ee0ff', eye: '#ffd97a' },
    build: { plan: 'serpent', frills: false, legs: false, spark: true },
    idleLines: ['went into the wall. It has not come out of the wall.', 'is eating something that is not from here.', 'shed a skin with somebody else\'s markings on it.'],
  },
  familiar: {
    id: 'familiar', name: 'Orphaned Familiar', rarity: 'legendary', icon: '👁️',
    eggName: 'Unindexed Object', eggIcon: '⬛',
    blurb: 'It was somebody\'s. The record of whose is one of the things that was thrown away.',
    desc: 'It knows the work. It does not know who taught it, and neither do you.',
    bonus: { key: 'xp', perLevel: 0.0055, label: 'all XP',
             second: { key: 'gold', perLevel: 0.0055, label: 'gold' } },
    likes: ['scrap_code', 'orphaned_shard', 'deprecated_asset', 'prime_essence'],
    hatchMs: 4 * 60 * 60 * 1000,
    palette: { body: '#2f3a52', belly: '#5a6a8f', accent: '#7ee0ff', eye: '#ffffff' },
    build: { plan: 'blob', eyes: 3, drift: true, glow: true },
    idleLines: ['performed a trick nobody taught it and looked for praise from a direction you are not standing in.', 'is doing a task. There is no task.', 'answered to a name you have not used.'],
  },
};

export const SPECIES_LIST = Object.values(SPECIES);
export function getSpecies(id) { return SPECIES[id]; }

export const RARITY_RANK = { common: 0, rare: 1, epic: 2, legendary: 3 };

// ---------------- Traits ----------------
// Inherited on breeding. Each pet has one.
export const PET_TRAITS = {
  greedy:   { id: 'greedy',   name: 'Greedy',   icon: '🪙', desc: '+25% to this pet\'s bonus', bonusMult: 0.25 },
  hardy:    { id: 'hardy',    name: 'Hardy',    icon: '🛡️', desc: 'Hunger falls 40% slower',  hungerSlow: 0.40 },
  cheerful: { id: 'cheerful', name: 'Cheerful', icon: '☀️', desc: 'Happiness falls 40% slower', happySlow: 0.40 },
  clever:   { id: 'clever',   name: 'Clever',   icon: '📘', desc: '+50% bond XP gained',      xpMult: 0.50 },
  fertile:  { id: 'fertile',  name: 'Fertile',  icon: '🍀', desc: 'Better odds of a rarity climb when bred', breedLuck: 0.15 },
  bottomless: { id: 'bottomless', name: 'Bottomless', icon: '🍖', desc: 'Feeding restores 50% more', feedMult: 0.50 },
};
export const TRAIT_LIST = Object.values(PET_TRAITS);
export function getTrait(id) { return PET_TRAITS[id]; }

// ---------------- Breeding ----------------
export const BREEDING = {
  COOLDOWN_MS: 4 * 60 * 60 * 1000,   // per parent
  BASE_UPGRADE_CHANCE: 0.12,          // chance the child climbs a rarity tier
  SAME_SPECIES_BONUS: 0.08,           // both parents same species
  COST_GOLD: 120000,                  // a real sink by the time you own two adults
};

// ---------------- Names ----------------
const PET_NAMES = [
  'Biscuit', 'Mochi', 'Pebble', 'Turnip', 'Sir Fluff', 'Noodle', 'Bramble', 'Widget',
  'Marmalade', 'Socks', 'Dumpling', 'Rook', 'Clover', 'Pip', 'Thistle', 'Waffles',
  'Barnaby', 'Juniper', 'Cinder', 'Tuppence', 'Gravy', 'Moss', 'Puddle', 'Sprocket',
];

export function randomPetName(rng = Math.random) {
  return PET_NAMES[Math.floor(rng() * PET_NAMES.length)];
}

// ---------------- Egg sources ----------------
// Where eggs come from, so the system plugs into the game you already have.
export const EGG_SHOP = [
  { species: 'cat',     gold: 8000,   label: 'A stray left this on your doorstep. It wants money for it somehow.' },
  { species: 'dog',     gold: 8000,   label: 'Bought from a farmer who insists it is "definitely a dog egg".' },
  { species: 'sparrow', gold: 12000,  label: 'Fell out of the inn thatch. Bram charged you for it anyway.' },
  { species: 'mouse',   gold: 14000,  label: 'Found behind the grain sacks. Technically it found you.' },
  { species: 'beetle',  gold: 26000,  label: 'The smith keeps these in a tin. He will not say why.' },
  { species: 'frog',    gold: 45000,  label: 'Dredged out of the Gloomroot shallows. Still faintly humming.' },
];

/**
 * Where the eggs you cannot buy actually come from.
 *
 * This used to list two species and was three versions out of date, which
 * meant twelve of fifteen pets existed with nothing in the game willing to
 * say so. It is now keyed by RARITY rather than by species, because that
 * is how the drop actually works — the roll picks a tier and then picks
 * uniformly within it — and a rarity has only four values, so it cannot
 * fall behind the species list the way a species map did.
 */
export const EGG_SOURCES = {
  common:    'Bought in town, or off almost anything that drops an egg at all.',
  rare:      'Boss kills and sealed Unstable Rifts, reliably enough to plan around.',
  epic:      'Boss kills and Rifts, but you will be a while. Wardens in the Descent are kinder.',
  legendary: 'Rifts, Wardens, and whatever the Vigil was carrying. Mostly it is patience.',
};

/** Odds of each tier when an egg does drop — mirrors EGG_RARITY_WEIGHTS. */
export const EGG_RARITY_ODDS = { common: '75%', rare: '20%', epic: '4.5%', legendary: '0.5%' };

export function eggItemId(speciesId) { return `egg_${speciesId}`; }
