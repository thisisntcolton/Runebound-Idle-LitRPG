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
  // Feeding converts food into fullness + a little bond XP.
  FEED_XP: 6,
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
  { species: 'cat',  gold: 8000,   label: 'A stray left this on your doorstep. It wants money for it somehow.' },
  { species: 'dog',  gold: 8000,   label: 'Bought from a farmer who insists it is "definitely a dog egg".' },
  { species: 'frog', gold: 45000,  label: 'Dredged out of the Gloomroot shallows. Still faintly humming.' },
];

// Rarer eggs drop from content rather than being bought
export const EGG_DROPS = {
  poro:     { from: 'Rift chests and boss kills', chance: 0.02 },
  wyrmling: { from: 'The Dragonspire and sealed Unstable Rifts', chance: 0.01 },
};

export function eggItemId(speciesId) { return `egg_${speciesId}`; }
