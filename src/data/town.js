// ============================================================
// HEARTHWICK — the town layer
//
// Design notes:
//  - Buildings cost LUMBER, which finally gives Woodcutting a purpose.
//  - Staff cost WAGES per business cycle — the game's first recurring
//    gold sink, so gold stops being worthless once upgrades are maxed.
//  - Businesses consume what your skills produce and sell it at a
//    markup, so every skill feeds the town.
//  - The town PERSISTS through Ascension. It is the one thing the
//    loop cannot take from you.
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
    revenue: [130, 250],
    buff: { key: 'sell_price', value: 0.06, label: '+6% sell price per level' },
  },
  cafe: {
    id: 'cafe', name: 'The Gilded Bean', icon: '☕',
    blurb: 'Bumblewort consults here. Nobody asked him to.',
    desc: 'Turns cooked food into coin and brews Town Coffee — a buff you cannot make yourself.',
    cost: { gold: 22000, items: { willow_log: 60 } },
    staffSlots: 2, cycleMs: 60000,
    inputs: { any_food: 3 },
    revenue: [300, 520],
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
    revenue: [480, 850],
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
    revenue: [1000, 1750],
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
    revenue: [2400, 4000],
    buff: { key: 'offline_hours', value: 1, label: '+1 offline hour per level' },
  },
};

export const BUILDING_LIST = Object.values(BUILDINGS);
export function getBuilding(id) { return BUILDINGS[id]; }

// Buildings unlock as the town grows
export const BUILDING_UNLOCK_LEVEL = {
  lumber_yard: 0, market_stall: 0, cafe: 2, apothecary: 3, smithy: 5, inn: 7,
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

export function rollApplicant(rng = Math.random, seedIdx = 0) {
  const trait = TRAIT_LIST[Math.floor(rng() * TRAIT_LIST.length)];
  const skill = 1 + Math.floor(rng() * 5);            // 1..5, scales output
  // Wages are per completed shift. Kept low enough that the starter
  // buildings turn a profit, high enough to matter once you run six of them.
  const baseWage = Math.floor((10 + skill * 12) * (trait.wageMult ?? 1));
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
export function plotsUnlockedAt(townLevel) {
  return Math.min(PLOT_COUNT, 1 + Math.floor(townLevel / 2));
}
