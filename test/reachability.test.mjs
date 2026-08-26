// ============================================================
// REACHABILITY — can a player actually GET this?
//
// v1.5 shipped ten abilities whose tomes existed as items, were rendered
// in the abilities panel, and dropped from precisely nothing. The item
// generator built them from the ability list, so every automated check
// passed: the item existed, the panel found it, the "study" button worked.
// Nobody asked the only question that mattered, which is whether anything
// in the game ever hands one to you.
//
// So this asks it two ways, because there are two distinct failures:
//
//   REACHABLE — the drop roll can actually produce it. Checked by running
//   the real roll thousands of times against a blank save and seeing what
//   comes out. Grepping for the id would not do: the pools are derived
//   from the data now, so no id appears literally anywhere. Exercising the
//   code is the only honest test, and it is the one that would have caught
//   the original bug.
//
//   DISCOVERABLE — something in the game names it, so a player can learn
//   it exists and go after it. Not a failure, but content nobody can know
//   about is nearly as wasted as content nobody can reach.
//
// It also reports what is Era II only. Gating is deliberate; a player
// being the last to know is not.
// ============================================================

import { readFileSync, readdirSync } from 'node:fs';
import { state } from '../src/core/state.js';
import { ABILITY_LIST, tomeIdFor } from '../src/data/abilities.js';
import { SPECIES_LIST, EGG_SHOP, eggItemId } from '../src/data/pets.js';
import { CLASSES } from '../src/data/classes.js';
import { SKILLS } from '../src/data/skills.js';
import { CHAINS } from '../src/data/adventure.js';
import { TIERS, MASTERIES } from '../src/data/talents.js';
import { SOFT_CAP } from '../src/core/xp.js';
import { rollTome } from '../src/systems/abilities.js';
import { rollEggDrop } from '../src/systems/pets.js';

let bad = 0, warn = 0;
const fail = m => { console.log(`  ✗ ${m}`); bad++; };
const flag = m => { console.log(`  ⚠ ${m}`); warn++; };
const good = m => console.log(`  ✓ ${m}`);

// A blank-ish save: nothing known, nothing owned, so every pool is open.
state.abilities = { known: {}, equipped: {}, cooldowns: {} };
state.pets = { owned: {}, incubator: [], active: null, hatched: 0, bred: 0 };
state.inventory = {};

/** Run a roll until it stops producing anything new, and report coverage. */
function coverage(roll, source, expected, rounds = 60000) {
  const got = new Set();
  for (let i = 0; i < rounds && got.size < expected.size; i++) {
    const id = roll(source);
    if (id) got.add(id);
    state.inventory = {};              // the bag is not what we are testing
  }
  return { got, missing: [...expected].filter(id => !got.has(id)) };
}

// ============================================================
console.log('\n=== ABILITY TOMES: can they drop? ===');
{
  const expected = new Set(ABILITY_LIST.map(a => tomeIdFor(a.id)));
  const { got, missing } = coverage(rollTome, 'vigil', expected);
  if (missing.length) {
    fail(`${missing.length} of ${expected.size} ability tomes never dropped in 60,000 rolls:`);
    for (const id of missing) {
      const ab = ABILITY_LIST.find(a => tomeIdFor(a.id) === id);
      console.log(`      ${ab.icon} ${ab.name.padEnd(20)} (${ab.slot}, ${ab.rarity}) — ${id}`);
    }
  } else {
    good(`all ${got.size} ability tomes are obtainable`);
  }
}

// ============================================================
console.log('\n=== PET EGGS: can they drop? ===');
{
  const expected = new Set(SPECIES_LIST.map(sp => eggItemId(sp.id)));
  const { got, missing } = coverage(rollEggDrop, 'vigil', expected);
  if (missing.length) {
    fail(`${missing.length} of ${expected.size} eggs never dropped in 60,000 rolls:`);
    for (const id of missing) {
      const sp = SPECIES_LIST.find(s => eggItemId(s.id) === id);
      console.log(`      ${sp.icon} ${sp.name.padEnd(20)} (${sp.rarity}) — ${id}`);
    }
  } else {
    good(`all ${got.size} eggs are obtainable`);
  }
}

// ============================================================
// Now the softer question: does anything NAME these, so a player can find
// out they exist? Read the data and system files and look for the id.
const corpus = [];
for (const dir of ['src/data', 'src/systems']) {
  for (const f of readdirSync(new URL(`../${dir}`, import.meta.url))) {
    if (!f.endsWith('.js')) continue;
    corpus.push({ path: `${dir}/${f}`, text: readFileSync(new URL(`../${dir}/${f}`, import.meta.url), 'utf8') });
  }
}
const named = (id, ignore = []) => {
  const needle = new RegExp(`['"\`]${id}['"\`]`);
  return corpus.filter(f => !ignore.includes(f.path) && needle.test(f.text)).map(f => f.path);
};

console.log('\n=== IS IT DISCOVERABLE? ===');
{
  const anon = ABILITY_LIST.filter(a =>
    !named(tomeIdFor(a.id), ['src/data/abilities.js', 'src/data/items.js']).length);
  if (anon.length) {
    flag(`${anon.length} of ${ABILITY_LIST.length} tomes drop only from the generic pool — no specific monster or chest names one, so nothing points a player at them.`);
  } else good('every tome has a named source somewhere');

  // Pets are answered by the Menagerie's compendium rather than by drop
  // tables, so the check is whether that compendium is built from the
  // species list — a hand-written one would go stale exactly the way the
  // old two-entry "Not for sale" list did.
  const petsUi = readFileSync(new URL('../src/ui/pets.js', import.meta.url), 'utf8');
  const hasCompendium = /function compendium\(\)/.test(petsUi);
  const dataDriven = /SPECIES_LIST\.filter|SPECIES_LIST\.map/.test(petsUi);
  if (!hasCompendium) fail('the Menagerie has no compendium — species can exist with nothing telling a player so');
  else if (!dataDriven) fail('the compendium does not read SPECIES_LIST, so it will go stale');
  else good(`the compendium lists all ${SPECIES_LIST.length} species, built from the data`);

  const shopSpecies = new Set(EGG_SHOP.map(e => e.species));
  console.log(`      (${shopSpecies.size} buyable in town; the rest are found, and the compendium says where)`);
}

// ============================================================
console.log('\n=== CLASSES ===');
for (const c of Object.values(CLASSES)) {
  const hasTree = corpus.some(f => f.path === 'src/data/talents.js' && new RegExp(`['"\`]${c.id}['"\`]`).test(f.text));
  if (!hasTree) fail(`class "${c.id}" has no talent tree`);
}
good(`${Object.keys(CLASSES).length} classes, all with trees`);
const masteryless = Object.keys(CLASSES).filter(id => !MASTERIES[id]);
if (masteryless.length) fail(`classes with no Mastery to earn: ${masteryless.join(', ')}`);
else good(`${Object.keys(MASTERIES).length} Masteries, one per class`);

// ============================================================
console.log('\n=== WHAT IS ERA II ONLY ===');
let eraLocked = 0, eraOpen = 0;
for (const id of Object.keys(SKILLS)) {
  const acts = SKILLS[id].actions || [];
  const locked = acts.filter(a => a.level > SOFT_CAP).length;
  eraLocked += locked; eraOpen += acts.length - locked;
  if (locked) console.log(`  ${SKILLS[id].icon || ' '} ${SKILLS[id].name.padEnd(14)} ${String(acts.length - locked).padStart(3)} in Era I, ${String(locked).padStart(3)} above the ceiling`);
}
console.log(`  → ${eraOpen} actions playable now, ${eraLocked} waiting on Era II`);
const chainsEra2 = CHAINS.filter(c => c.when?.era >= 2).length;
console.log(`  → adventure chains: ${CHAINS.length - chainsEra2} in Era I, ${chainsEra2} in Era II`);
const tiersEra2 = TIERS.filter(t => t.era >= 2).length;
console.log(`  → talent tiers: ${TIERS.length - tiersEra2} in Era I, ${tiersEra2} in Era II`);

// ============================================================
console.log(`\n${bad} unreachable, ${warn} undiscoverable`);
process.exit(bad ? 1 : 0);
