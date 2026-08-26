// ============================================================
// HEARTHWICK — the town layer
//
// Design notes:
//  - Buildings cost LUMBER, which finally gives Woodcutting a purpose.
//  - Staff cost WAGES per business cycle — the game's first recurring
//    gold sink, so gold stops being worthless once upgrades are maxed.
//  - Businesses consume what your skills produce and sell it at a
//    markup, so every skill feeds the town.
//  - A shift pays a flat wage for the LABOUR plus `markup` times the
//    vendor value of the goods it moved. That is what stops ten logs
//    and ten mythril ore from earning the same coin.
//  - The town is RAZED on Ascension. It was persisting, which let a
//    returning player rebuy their whole hireling roster inside ten
//    minutes and skip the early cycle entirely.
// ============================================================

// ---------------- Plots ----------------
// A 3x3 parcel grid. Cost escalates; the first one unlocks the town.
export const PLOT_COUNT = 9;

// Parcel costs climb steeply and demand progressively better lumber,
// so every tier of Woodcutting has something to buy.
const PLOT_LOG_TIER = [null, 'oak_log', 'oak_log', 'willow_log', 'willow_log',
                       'maple_log', 'maple_log', 'yew_log', 'yew_log'];

export function plotCost(index) {
  if (index === 0) return { gold: 5000, items: {} };
  const log = PLOT_LOG_TIER[index] || 'yew_log';
  return {
    gold: Math.floor(5000 * Math.pow(3.0, index)),
    items: { [log]: 30 * index },
  };
}

// Where each plot sits on the SVG map (viewBox 960x620)
export const PLOT_POSITIONS = [
  { x: 70,  y: 90 },  { x: 370, y: 90 },  { x: 670, y: 90 },
  { x: 70,  y: 275 }, { x: 370, y: 275 }, { x: 670, y: 275 },
  { x: 70,  y: 460 }, { x: 370, y: 460 }, { x: 670, y: 460 },
];
export const PLOT_W = 220;
export const PLOT_H = 150;

// ---------------- Buildings ----------------
// cycleMs      — one business cycle
// inputs       — consumed per cycle from the building's own stock
// revenue      — gold per cycle [min,max] before trait/level modifiers
// produces     — exclusive goods you cannot obtain elsewhere
// generates    — passive raw resources (no input needed)
// buff         — town-wide bonus while at least one is staffed
export const BUILDINGS = {
  lumber_yard: {
    id: 'lumber_yard', name: 'Lumber Yard', icon: '🪵',
    blurb: 'Saws run all day. Baldric approves, loudly, from a distance.',
    desc: 'Generates logs on its own — the only building that needs no stock.',
    cost: { gold: 4000, items: { oak_log: 30 } },
    staffSlots: 2, cycleMs: 45000,
    inputs: {},
    generates: { oak_log: 6, willow_log: 2 },
    revenue: [55, 110],
    buff: { key: 'woodcutting_speed', value: 0.05, label: '+5% Woodcutting speed per level' },
  },
  market_stall: {
    id: 'market_stall', name: 'Market Stall', icon: '🏪',
    blurb: 'A plank, a canopy, and an alarming confidence about prices.',
    desc: 'Sells raw materials at a heavy markup over the vendor price.',
    cost: { gold: 6000, items: { oak_log: 40 } },
    staffSlots: 1, cycleMs: 30000,
    inputs: { any_resource: 4 },
    revenue: [55, 100], markup: 1.4,
    buff: { key: 'sell_price', value: 0.06, label: '+6% sell price per level' },
  },
  cafe: {
    id: 'cafe', name: 'The Gilded Bean', icon: '☕',
    blurb: 'Bumblewort consults here. Nobody asked him to.',
    desc: 'Turns cooked food into coin and brews Town Coffee — a buff you cannot make yourself.',
    cost: { gold: 22000, items: { willow_log: 60 } },
    staffSlots: 2, cycleMs: 60000,
    inputs: { any_food: 3 },
    revenue: [90, 170], markup: 1.8,
    produces: { town_coffee: 1 },
    buff: { key: 'xp', value: 0.03, label: '+3% all XP per level' },
  },
  apothecary: {
    id: 'apothecary', name: 'Apothecary', icon: '⚗️',
    blurb: 'Mirella subcontracts here when the cauldron is sulking.',
    desc: 'Refines herbs into coin and bottles Refined Tonics beyond your Alchemy level.',
    cost: { gold: 35000, items: { willow_log: 80, iron_bar: 20 } },
    staffSlots: 2, cycleMs: 70000,
    inputs: { any_herb: 4 },
    revenue: [120, 220], markup: 2.0,
    produces: { refined_tonic: 1 },
    buff: { key: 'drop_rate', value: 0.04, label: '+4% rare drop rate per level' },
  },
  smithy: {
    id: 'smithy', name: 'Town Smithy', icon: '🔨',
    blurb: "Vera's apprentices. They are learning. Slowly. Loudly.",
    desc: 'Works bars into trade goods, and occasionally a Masterwork Rune.',
    cost: { gold: 60000, items: { maple_log: 90, steel_bar: 30 } },
    staffSlots: 3, cycleMs: 80000,
    inputs: { any_bar: 3 },
    revenue: [200, 380], markup: 2.2,
    produces: { rune_shard: 1 },
    buff: { key: 'damage', value: 0.03, label: '+3% damage per level' },
  },
  inn: {
    id: 'inn', name: 'The Long Rest', icon: '🛏️',
    blurb: 'Beds, stew, and a landlord who never asks where you have been.',
    desc: 'Feeds travellers for good coin. Its rooms let you rest longer while away.',
    cost: { gold: 120000, items: { yew_log: 120, mythril_bar: 20 } },
    staffSlots: 3, cycleMs: 90000,
    inputs: { any_food: 4, any_resource: 2 },
    revenue: [400, 700], markup: 1.6,
    buff: { key: 'offline_hours', value: 1, label: '+1 offline hour per level' },
  },

  // ============================================================
  // THE GENERATORS
  //
  // The Lumber Yard was the only building that fed itself — everything
  // else needs you to walk over and stock it. That made one building
  // structurally different from the other five and gave Woodcutting a
  // town presence nothing else had.
  //
  // These three fix that. Each pairs with a gathering skill, generates its
  // raw material on its own, and pays a modest flat wage against a modest
  // flat revenue: no goods move, so there is no commission and no runaway.
  // They are the quiet, reliable half of the town, and they are what keeps
  // the other half stocked.
  // ============================================================
  hatchery: {
    id: 'hatchery', name: 'The Fish Hatchery', icon: '🐟',
    blurb: 'Hemlock consulted on the design and then refused to set foot in it.',
    desc: 'Raises fish in stocked ponds — needs no input, and keeps the Gilded Bean fed.',
    cost: { gold: 18000, items: { willow_log: 50 } },
    staffSlots: 2, cycleMs: 50000,
    inputs: {},
    generates: { raw_shrimp: 5, raw_trout: 3, raw_salmon: 1 },
    revenue: [70, 130],
    buff: { key: 'fishing_speed', value: 0.05, label: '+5% Fishing speed per level' },
  },
  herb_garden: {
    id: 'herb_garden', name: 'The Walled Garden', icon: '🌿',
    blurb: 'Mirella walks the rows at dusk and talks to the kingsleaf. It seems to help.',
    desc: 'Grows herbs without stock of any kind — the Apothecary\'s supply line.',
    cost: { gold: 42000, items: { willow_log: 70, iron_bar: 25 } },
    staffSlots: 2, cycleMs: 65000,
    inputs: {},
    generates: { herb_sagewort: 4, herb_mooncap: 2, herb_emberpetal: 1 },
    revenue: [110, 200],
    buff: { key: 'farming_speed', value: 0.05, label: '+5% Farming speed per level' },
  },
  quarry: {
    id: 'quarry', name: 'The Shale Quarry', icon: '⛰️',
    blurb: 'Grimda calls it "the shallow end" and will not be drawn further.',
    desc: 'Cuts ore and coal out of the hillside on its own — the Smithy\'s supply line.',
    cost: { gold: 95000, items: { maple_log: 100, steel_bar: 35 } },
    staffSlots: 3, cycleMs: 75000,
    inputs: {},
    generates: { copper_ore: 5, iron_ore: 3, coal: 3, mythril_ore: 1 },
    revenue: [230, 400],
    buff: { key: 'mining_speed', value: 0.05, label: '+5% Mining speed per level' },
  },
};

export const BUILDING_LIST = Object.values(BUILDINGS);
export function getBuilding(id) { return BUILDINGS[id]; }

// Buildings unlock as the town grows
export const BUILDING_UNLOCK_LEVEL = {
  lumber_yard: 0, market_stall: 0, hatchery: 1, cafe: 2, apothecary: 4,
  herb_garden: 5, smithy: 7, quarry: 8, inn: 10,
};

export const MAX_BUILDING_LEVEL = 5;

// Upgrading a building: cost scales, output scales
export function upgradeCostFor(building, level) {
  const mult = Math.pow(2.6, level);
  return {
    gold: Math.floor(building.cost.gold * 0.8 * mult),
    items: Object.fromEntries(
      Object.entries(building.cost.items).map(([k, v]) => [k, Math.ceil(v * 0.6 * Math.pow(1.8, level))])
    ),
  };
}

// ---------------- Input categories ----------------
// Buildings accept a category rather than one exact item, so you can
// stock whatever you happen to have. Higher-value items count for more.
export const INPUT_CATEGORIES = {
  any_resource: { label: 'any raw resource', match: item => item.type === 'resource' },
  any_food:     { label: 'any cooked food',  match: item => item.type === 'food' },
  any_herb:     { label: 'any herb',         match: item => item.id.startsWith('herb_') },
  any_bar:      { label: 'any metal bar',    match: item => item.id.endsWith('_bar') },
  any_log:      { label: 'any log',          match: item => item.id.endsWith('_log') },
};

// ---------------- Staff ----------------
export const STAFF_TRAITS = {
  diligent:  { id: 'diligent',  name: 'Diligent',   icon: '💪', desc: '+20% output',            output: 0.20 },
  charming:  { id: 'charming',  name: 'Charming',   icon: '😊', desc: '+25% revenue',           revenue: 0.25 },
  thrifty:   { id: 'thrifty',   name: 'Thrifty',    icon: '🧵', desc: '-30% materials used',    inputSave: 0.30 },
  swift:     { id: 'swift',     name: 'Swift',      icon: '💨', desc: '-20% cycle time',        speed: 0.20 },
  green:     { id: 'green',     name: 'Green',      icon: '🌱', desc: 'Cheap, but -15% revenue', revenue: -0.15, wageMult: 0.5 },
  sticky:    { id: 'sticky',    name: 'Sticky-Fingered', icon: '🤏', desc: 'Skims 10% of revenue', revenue: -0.10, wageMult: 0.4 },
};
export const TRAIT_LIST = Object.values(STAFF_TRAITS);

const FIRST_NAMES = ['Perrin', 'Tamsin', 'Oder', 'Wynn', 'Bex', 'Halla', 'Corwin', 'Nesta',
  'Fitch', 'Maribel', 'Dunstan', 'Ilse', 'Roswell', 'Petra', 'Cael', 'Junia', 'Torbin', 'Elowen'];
const LAST_NAMES = ['Ashdown', 'Merrow', 'Quill', 'Stubb', 'Wexley', 'Thorne', 'Barrow', 'Pike',
  'Hollis', 'Vane', 'Crake', 'Dimble', 'Ferrow', 'Ockham', 'Ruddock', 'Sable'];
const FACES = ['🧑‍🌾', '👩‍🍳', '🧑‍🔧', '👨‍🌾', '🧑‍🍳', '👩‍🔧', '🧕', '🧔', '👵', '👴', '🧑‍🎨', '👩‍🌾'];

export const APPLICANT_POOL_SIZE = 4;
export const REROLL_COST = 750;

// ============================================================
// WAGES
//
// The town used to pay a flat wage forever: 22 to 70 gold a shift, set
// once when the worker was hired and never moving again. Revenue, by
// contrast, scales with the building's level AND with the value of the
// goods the shift moves — so a level-5 Market Stall running rich stock
// cleared ninety-two thousand gold a minute against a payroll of a
// hundred and eighty-eight. Payroll was a rounding error, which meant the
// whole staffing system — traits, skill, who you hire — was decoration.
//
// Wages now have three parts, and the last one is the important one:
//
//   BASE        — the flat rate, raised outright.
//   PER_LEVEL   — a worker at a bigger operation costs more.
//   COMMISSION  — a share of the value of goods moved. This is what stops
//                 rich materials being free money: the people handling
//                 nine thousand gold of stock want paying like it.
//
// Calibrated in test/balance.mjs, which prints profit per minute at every
// building and level for both the cheapest and richest stock you could
// put through it.
// ============================================================
export const WAGES = {
  // Left at the hired rate on purpose. The flat wage was never the
  // problem, and it is the ONLY cost the Lumber Yard has — raising it
  // even 25% cut the first building a new player owns from a 25% margin
  // to 7%, which taxes the early game to fix a late-game excess.
  BASE: 1.0,
  // Growth comes from scale instead: a worker running a level-5 operation
  // costs a bit over twice what one running a level-1 does, against
  // revenue that grows 3.4x. Still a real raise, still leaves headroom.
  PER_LEVEL: 0.32,
  // The actual fix. Staff take a third of the value of the goods they
  // move, which leaves a cheap-stock operation roughly where it was and
  // takes a level-5 building running runite bars from a 94% margin to
  // about 58%. Rich materials are still the right play — they are just no
  // longer free money.
  COMMISSION: 0.35,
};

export function rollApplicant(rng = Math.random, seedIdx = 0) {
  const trait = TRAIT_LIST[Math.floor(rng() * TRAIT_LIST.length)];
  const skill = 1 + Math.floor(rng() * 5);            // 1..5, scales output
  // Wages are per completed shift, and this is only the LABOUR half —
  // see WAGES below for the level scaling and the commission, which are
  // what actually keep a mature town honest.
  const baseWage = Math.floor((10 + skill * 12) * WAGES.BASE * (trait.wageMult ?? 1));
  return {
    id: `s${Date.now().toString(36)}${seedIdx}${Math.floor(rng() * 1e6).toString(36)}`,
    name: `${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]}`,
    icon: FACES[Math.floor(rng() * FACES.length)],
    trait: trait.id,
    skill,
    wage: baseWage,        // gold per completed business cycle
    assigned: null,        // plot index
  };
}

// ---------------- Town level ----------------
// Rises with total building levels; gates plots and building types.
export function townLevelFor(totalBuildingLevels) {
  return Math.floor(totalBuildingLevels);
}

// Every point of town level opens another parcel. That means the very
// first building you put up immediately earns you somewhere to put the
// next one — the town sprawls instead of forcing you to upgrade one
// building over and over before anything visible happens.
export function plotsUnlockedAt(townLevel) {
  return Math.min(PLOT_COUNT, 1 + townLevel);
}

/** Town level needed before parcel `index` can be bought. */
export function townLevelForPlot(index) {
  return Math.max(0, index);
}
