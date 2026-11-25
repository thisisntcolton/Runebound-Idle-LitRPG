// ============================================================
// LINEAGE — Starting Traits, Family Backgrounds & Name Pools
// Traits modify starting stats, yearly drift, AND the Energy & Strain pool!
// ============================================================

export const FIRST_NAMES = [
  'Arthur', 'Clara', 'Julian', 'Maeve', 'Rowan', 'Elena', 'Miles', 'Nora',
  'Silas', 'Hazel', 'Felix', 'Iris', 'Caleb', 'Tessa', 'Owen', 'Lydia',
  'Leo', 'Ruby', 'Ezra', 'June', 'Sam', 'Ada', 'Theo', 'Vera'
];

export const LAST_NAMES = [
  'Mercer', 'Holloway', 'Vance', 'Miller', 'Fletcher', 'Hale', 'Keller',
  'Sutton', 'Bennett', 'Ashford', 'Porter', 'Quinn', 'Hayes', 'Sawyer'
];

export const TRAITS = [
  {
    id: 'ambitious',
    name: '🏔️ Ambitious',
    desc: 'Driven to climb higher than where they started, though slow to switch off.',
    mods: { smarts: 4, happiness: -3 },
    passive: {
      incomeMult: 1.18,
      happyBaseline: -5,
      energyBonus: 1,
      strainGainMult: 1.28,
    },
    effectsSummary: '+1 Max Energy · +18% Adult Income · Builds Strain 28% faster · -5 Happiness baseline',
  },
  {
    id: 'laid_back',
    name: '🌿 Laid-Back',
    desc: 'Never in a rush; shakes off stress overnight even if their schedule stays light.',
    mods: { happiness: 5 },
    passive: {
      happyBaseline: 5,
      energyBonus: -1,
      strainGainMult: 0.75,
      strainRecoveryMult: 1.40,
    },
    effectsSummary: '-1 Max Energy cap · Recovers Strain 40% faster & builds 25% less · +5 Happiness baseline',
  },
  {
    id: 'curious',
    name: '🔍 Curious',
    desc: 'Always poking into books and odd questions.',
    mods: { smarts: 6 },
    passive: { smartsGainMult: 1.25 },
    effectsSummary: '+6 Starting Smarts · +25% Smarts gains from study & choices',
  },
  {
    id: 'scrappy',
    name: '🥊 Scrappy',
    desc: 'Tough constitution and stubborn grit.',
    mods: { health: 7 },
    passive: { healthLossMult: 0.75, riskBonus: 0.06, energyBonus: 1 },
    effectsSummary: '+1 Max Energy · +7 Starting Health · -25% Health loss · +6% risky odds',
  },
  {
    id: 'sunny',
    name: '☀️ Sunny',
    desc: 'Finds silver linings even in rough years.',
    mods: { happiness: 7 },
    passive: { happyBaseline: 8, happyLossMult: 0.75, strainRecoveryMult: 1.15 },
    effectsSummary: '+7 Starting Happiness · +8 Happiness baseline · -25% Happiness loss · +15% Strain recovery',
  },
  {
    id: 'charming',
    name: '✨ Charming',
    desc: 'Wins people over effortlessly.',
    mods: { looks: 7, happiness: 3 },
    passive: { looksDecayMult: 0.65, incomeBonus: 350 },
    effectsSummary: '+7 Looks, +3 Happiness · Slower Looks aging · +$350/yr adult income',
  },
  {
    id: 'reckless',
    name: '🎲 Reckless',
    desc: 'Loves high stakes, rarely reads the warning label.',
    mods: { happiness: 4, health: -4 },
    passive: { riskBonus: 0.10, healthLossMult: 1.15, strainGainMult: 1.15 },
    effectsSummary: '+4 Happiness, -4 Health · +10% risky choice odds · +15% Health loss & Strain',
  },
  {
    id: 'bookworm',
    name: '📚 Bookworm',
    desc: 'Lives at the library; allergic to gym class.',
    mods: { smarts: 9, health: -4 },
    passive: { smartsGainMult: 1.2, smartsFloor: 55 },
    effectsSummary: '+9 Smarts, -4 Health · +20% Smarts gains · Smarts resists rust',
  },
  {
    id: 'frail',
    name: '🥀 Delicate',
    desc: 'Catches every winter cold, yet deeply observant.',
    mods: { health: -8, smarts: 6 },
    passive: { healthLossMult: 1.2, smartsGainMult: 1.15, energyBonus: -1 },
    effectsSummary: '-1 Max Energy · -8 Health, +6 Smarts · +20% Health loss · +15% Smarts gains',
  },
  {"id": "disciplined", "name": "Disciplined", "desc": "Disciplined temperament.", "mods": {}, "passive": {"smartsGainMult": 1.15, "strainRecoveryMult": 0.9}, "effectsSummary": "smartsGainMult: 1.15 \u00b7 strainRecoveryMult: 0.9"},
  {"id": "creative", "name": "Creative", "desc": "Creative temperament.", "mods": {}, "passive": {"happyBaseline": 4, "strainGainMult": 1.1}, "effectsSummary": "happyBaseline: 4 \u00b7 strainGainMult: 1.1"},
  {"id": "introverted", "name": "Introverted", "desc": "Introverted temperament.", "mods": {}, "passive": {"smartsGainMult": 1.1, "happyBaseline": -2}, "effectsSummary": "smartsGainMult: 1.1 \u00b7 happyBaseline: -2"},
  {"id": "extroverted", "name": "Extroverted", "desc": "Extroverted temperament.", "mods": {}, "passive": {"happyBaseline": 5, "strainGainMult": 1.1}, "effectsSummary": "happyBaseline: 5 \u00b7 strainGainMult: 1.1"},
  {"id": "frugal", "name": "Frugal", "desc": "Frugal temperament.", "mods": {}, "passive": {"incomeBonus": 300, "happyBaseline": -2}, "effectsSummary": "incomeBonus: 300 \u00b7 happyBaseline: -2"},
  {"id": "materialistic", "name": "Materialistic", "desc": "Materialistic temperament.", "mods": {}, "passive": {"incomeMult": 1.08, "happyBaseline": -4}, "effectsSummary": "incomeMult: 1.08 \u00b7 happyBaseline: -4"},
  {"id": "compassionate", "name": "Compassionate", "desc": "Compassionate temperament.", "mods": {}, "passive": {"happyBaseline": 4, "strainGainMult": 1.1}, "effectsSummary": "happyBaseline: 4 \u00b7 strainGainMult: 1.1"},
  {"id": "competitive", "name": "Competitive", "desc": "Competitive temperament.", "mods": {}, "passive": {"incomeMult": 1.1, "strainGainMult": 1.15}, "effectsSummary": "incomeMult: 1.1 \u00b7 strainGainMult: 1.15"},
  {"id": "perfectionist", "name": "Perfectionist", "desc": "Perfectionist temperament.", "mods": {}, "passive": {"smartsGainMult": 1.2, "strainGainMult": 1.2}, "effectsSummary": "smartsGainMult: 1.2 \u00b7 strainGainMult: 1.2"},
  {"id": "entrepreneurial", "name": "Entrepreneurial", "desc": "Entrepreneurial temperament.", "mods": {}, "passive": {"incomeMult": 1.1, "riskBonus": 0.03}, "effectsSummary": "incomeMult: 1.1 \u00b7 riskBonus: 0.03"},
  {"id": "adventurous", "name": "Adventurous", "desc": "Adventurous temperament.", "mods": {}, "passive": {"riskBonus": 0.05, "healthLossMult": 1.1}, "effectsSummary": "riskBonus: 0.05 \u00b7 healthLossMult: 1.1"},
];

export const BACKGROUNDS = [
  {
    id: 'shopkeepers',
    name: 'Corner-Store Shopkeepers',
    startingMoney: 450,
    blurb: 'Raised above a busy neighborhood grocery. Money is counted carefully, and everybody knows your name.',
    mods: { smarts: 3, happiness: 3 },
    effectsSummary: 'Starts with $450 · +3 Smarts, +3 Happiness · Unlocks Shopkeeper family events',
  },
  {
    id: 'mechanics',
    name: 'Working-Class Mechanics',
    startingMoney: 200,
    blurb: 'Calloused hands, salvaged car parts in the yard, and fierce family loyalty when bills get tight.',
    mods: { health: 5, happiness: 2 },
    effectsSummary: 'Starts with $200 · +5 Health, +2 Happiness · Unlocks Garage & Mechanic family events',
  },
  {
    id: 'gentry',
    name: 'Fading Old-Money Family',
    startingMoney: 2400,
    blurb: 'A drafty manor, a prestigious surname, and dinner-table pressure to restore the family fortune.',
    mods: { looks: 5, smarts: 4, happiness: -5 },
    effectsSummary: 'Starts with $2,400 · +5 Looks, +4 Smarts, -5 Happiness · Unlocks Old-Money Manor events',
  },
  {
    id: 'artists',
    name: 'Wandering Musicians',
    startingMoney: 120,
    blurb: 'Packed vans, late-night diner pancakes, very little savings, and a house full of songs.',
    mods: { happiness: 7, looks: 3 },
    effectsSummary: 'Starts with $120 · +7 Happiness, +3 Looks · Unlocks Touring & Bohemian family events',
  },
  {
    id: 'teachers',
    name: 'Public-School Teachers',
    startingMoney: 650,
    blurb: 'Walls of paperbacks, secondhand bicycles, and gentle lectures at breakfast.',
    mods: { smarts: 7 },
    effectsSummary: 'Starts with $650 · +7 Smarts · Unlocks Academic household events',
  },
];

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rollDraftCharacter(overrides = {}) {
  const bg = pickRandom(BACKGROUNDS);
  const pool = [...TRAITS];
  const t1 = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  const t2 = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];

  return {
    firstName: overrides.firstName ?? pickRandom(FIRST_NAMES),
    lastName: overrides.lastName ?? pickRandom(LAST_NAMES),
    birthYear: overrides.birthYear ?? (1975 + Math.floor(Math.random() * 30)),
    backgroundId: bg.id,
    traits: [t1.id, t2.id],
  };
}

export function getTrait(id) {
  return TRAITS.find(t => t.id === id);
}

export function getBackground(id) {
  return BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0];
}
