// ============================================================
// THE PRESTIGE CURVE, WITH AND WITHOUT A TOWN
//
// Era II stopped razing Hearthwick on Ascension. That was the right story
// beat — "nothing resets any more" is the reward for breaking the loop —
// but it was shipped without checking what it does to the cycle, and a
// persisting town is exactly the sort of change that quietly deletes an
// entire phase of the game.
//
// The specific worry: in Era I the first twenty minutes of a cycle are
// broke. You have level-1 skills, no gold, no gear, and rebuilding is the
// loop. If a fully-built town survives the reset and keeps paying out,
// minute zero of the new cycle is rich, the rebuild phase never happens,
// and Ascension becomes a button that gives you shards for free.
//
// This asks three questions:
//   1. What does a surviving town actually pay in the first hour?
//   2. Does its STOCK survive the reset? (Buildings eat materials, and
//      your gathering skills are back at 1 — so maybe it starves.)
//   3. How long is the rebuild phase in each era, in minutes?
//
// Run with `node test/prestige.sim.mjs`.
// ============================================================
import { BUILDINGS } from '../src/data/town.js';
import { getItem } from '../src/data/items.js';
import { xpForLevel, levelForXp } from '../src/core/xp.js';

const markupFor = (def, level) => (def.markup ?? 1.0) * (1 + (level - 1) * 0.30);
const wageFor = skill => Math.floor(10 + skill * 12);

// A representative late-cycle town: six buildings, level 4, fully staffed
// with skill-6 workers. This is what someone Ascending in Era II has.
const TOWN = [
  { id: 'lumber_yard',  level: 4 },
  { id: 'market_stall', level: 4 },
  { id: 'cafe',         level: 4 },
  { id: 'smithy',       level: 3 },
  { id: 'apothecary',   level: 3 },
  { id: 'trade_house',  level: 3 },
].filter(b => BUILDINGS[b.id]);

const STAFF_SKILL = 6;
// What a late-cycle player leaves in the stock bins. Generous on purpose:
// the whole question is whether a well-stocked town carries a new cycle.
const STOCK_UNITS = 400;

const SAMPLE = {
  any_resource: 'maple_log',
  any_food:     'salmon',
  any_herb:     'herb_sagewort',
  any_bar:      'steel_bar',
};

function plotEconomy(b, { stocked = true } = {}) {
  const def = BUILDINGS[b.id];
  const staff = def.staffSlots;
  const wage = wageFor(STAFF_SKILL) * staff;
  const skillMult = 1 + (STAFF_SKILL * staff) * 0.08;
  const levelMult = 1 + (b.level - 1) * 0.6;
  const labour = ((def.revenue[0] + def.revenue[1]) / 2) * levelMult;

  let goods = 0, unitsPerCycle = 0;
  for (const [cat, qty] of Object.entries(def.inputs || {})) {
    const need = Math.max(1, Math.ceil(qty * b.level));
    unitsPerCycle += need;
    goods += need * (getItem(SAMPLE[cat])?.sell || 0);
  }
  // systems/town.js completeCycle() returns BEFORE paying anything if the
  // inputs are not there, so a starved building earns nothing at all — and
  // pays no wages either, so it does not bleed you. A building with no
  // inputs (the Lumber Yard) can never starve and keeps running forever.
  const canStarve = unitsPerCycle > 0;
  const rev = (stocked || !canStarve)
    ? (labour + goods * markupFor(def, b.level)) * skillMult
    : 0;
  const paysWages = stocked || !canStarve;
  const cyclesPerMin = 60000 / def.cycleMs;
  return {
    def, unitsPerCycle, cyclesPerMin,
    profitPerMin: (rev - (paysWages ? wage : 0)) * cyclesPerMin,
    wagePerMin: wage * cyclesPerMin,
    needsInput: unitsPerCycle > 0,
  };
}

console.log('=== 1. WHAT A SURVIVING TOWN PAYS ===\n');
let stockedTotal = 0, starvedTotal = 0, drainPerMin = 0;
for (const b of TOWN) {
  const on = plotEconomy(b, { stocked: true });
  const off = plotEconomy(b, { stocked: false });
  stockedTotal += on.profitPerMin;
  starvedTotal += off.profitPerMin;
  drainPerMin += on.unitsPerCycle * on.cyclesPerMin;
  console.log(`   ${on.def.icon} ${on.def.name.padEnd(14)} Lv${b.level}  ` +
    `stocked ${Math.round(on.profitPerMin).toLocaleString().padStart(8)}/min   ` +
    `starved ${Math.round(off.profitPerMin).toLocaleString().padStart(7)}/min   ` +
    `eats ${on.unitsPerCycle * on.cyclesPerMin < 0.05 ? '  —  ' : (on.unitsPerCycle * on.cyclesPerMin).toFixed(1)} units/min`);
}
console.log(`\n   TOTAL, fully stocked : ${Math.round(stockedTotal).toLocaleString()} g/min`);
console.log(`   TOTAL, out of stock  : ${Math.round(starvedTotal).toLocaleString()} g/min`);
console.log(`   Material drain       : ${drainPerMin.toFixed(1)} units/min`);

console.log('\n\n=== 2. HOW LONG THE INHERITED STOCK LASTS ===\n');
const minutesOfStock = drainPerMin > 0 ? (STOCK_UNITS * TOWN.filter(b => plotEconomy(b).needsInput).length) / drainPerMin : Infinity;
console.log(`   Starting the cycle with ${STOCK_UNITS} units in every bin,`);
console.log(`   the town runs for ${Math.round(minutesOfStock)} minutes and then starves.\n`);
console.log(`   After that it pays ${Math.round(starvedTotal).toLocaleString()} g/min until your gathering`);
console.log(`   skills are high enough to restock it — and they are back at level 1.`);

console.log('\n\n=== 3. THE REBUILD PHASE, ERA I vs ERA II ===\n');

// What the early cycle actually costs, in gold. These are the things a
// player buys in the first hour: hirelings, the first upgrades, food.
const EARLY_SPEND = 45000;

// Gathering income at level 1, roughly: one low-value action every few
// seconds, before any upgrades.
const BARE_HANDS_PER_MIN = 55;

const eras = [
  { name: 'Era I  (town razed)',    income: () => BARE_HANDS_PER_MIN },
  { name: 'Era II (town survives)', income: m => BARE_HANDS_PER_MIN + (m < minutesOfStock ? stockedTotal : starvedTotal) },
];

for (const era of eras) {
  let gold = 0, m = 0;
  while (gold < EARLY_SPEND && m < 60 * 24) { gold += era.income(m); m++; }
  console.log(`   ${era.name.padEnd(26)} reaches ${EARLY_SPEND.toLocaleString()} gold in ` +
    `${m >= 60 * 24 ? '>24h' : m + ' min'}`);
}

console.log('\n   And the part a town cannot buy — skill levels:\n');
// Skill XP is the real gate, and no amount of town gold buys it. Hirelings
// help, which is why gold matters at all, but the ceiling is time.
for (const lvl of [30, 50, 70, 85]) {
  const xp = xpForLevel(lvl);
  // A mid-tier action at ~3s with hirelings running is roughly 900 xp/min.
  const mins = xp / 900;
  console.log(`   level ${String(lvl).padStart(2)} in one skill: ${Math.round(xp).toLocaleString().padStart(10)} xp  ≈ ${(mins / 60).toFixed(1)}h`);
}

console.log('\n\n=== VERDICT ===\n');
const rebuildGone = starvedTotal > EARLY_SPEND / 20;
console.log(`   The town skips the broke phase: ${stockedTotal > 2000 ? 'YES' : 'no'}`);
console.log(`   ...but only for ${Math.round(minutesOfStock)} minutes, because the bins empty and`);
console.log(`   restocking needs the gathering skills the Ascension just reset.`);
console.log(`   Steady-state carry once starved: ${Math.round(starvedTotal).toLocaleString()} g/min` +
  ` — ${rebuildGone ? 'ENOUGH TO TRIVIALISE THE EARLY CYCLE' : 'not enough to trivialise anything'}.`);
console.log(`\n   Skill levels are untouched by any of this: a cycle is gated on XP,`);
console.log(`   and XP is gated on time. Gold was never the long pole.\n`);
