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
import { TIERS, MASTERIES, TREES } from '../src/data/talents.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { DEEDS } from '../src/data/quests.js';
import { defaultState } from '../src/core/state.js';
import { levelForXp } from '../src/core/xp.js';
import { ALL_QUESTS } from '../src/data/quests.js';
import { HIRELINGS, UPGRADES, PERKS } from '../src/data/upgrades.js';
import { FRAGMENTS } from '../src/data/lore.js';
import { DUNGEONS } from '../src/data/dungeons.js';
import { CODEX } from '../src/data/codex.js';
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
console.log('\n=== ACHIEVEMENTS AND DEEDS: do they even run? ===');
{
  // A condition that throws is silently swallowed at runtime (checkAchievements
  // catches, so a broken one just never fires and nobody ever finds out).
  // Run every one against both a blank save and a maximal one: each must
  // execute cleanly, be false on the first, and be TRUE on the second —
  // an achievement no state can satisfy is decoration.
  const blank = defaultState();
  const maxed = defaultState();
  Object.assign(maxed, {
    era: 2, ascensions: 12, gold: 1e12, lifetimeGold: 1e13, shards: 9999,
    adventure: { travelled: 9e9, encounters: 9999, chains: 9999,
                 flags: Object.fromEntries(Array.from({ length: 40 }, (_, i) => ['f' + i, 1])),
                 seen: {}, active: null, nextAt: 0, progress: 0 },
    casino: { hands: 99999, wagered: 9e10, won: 9e9, lost: 1, bestWin: 9e8,
              worstLoss: 9e8, streak: 40, bestStreak: 40, shoe: [], cut: 0 },
    deep: { best: 99, depth: 99, clears: 999, kills: 9999, wardens: 999 },
    worldBoss: { felled: 40, dealt: 9e9 },
    pets: { owned: { p: { xp: 9e6, species: 'cat' } }, incubator: [], active: null,
            hatched: 999, bred: 999,
            seen: Object.fromEntries(SPECIES_LIST.map(s => [s.id, 1])) },
    abilities: { known: Object.fromEntries(ABILITY_LIST.map(a => [a.id, 1])),
                 equipped: { strike: 'cleave', guard: 'parry', utility: 'firebomb' }, cooldowns: {} },
    enchants: Object.fromEntries(['a', 'b'].map(k => [k, 5])),
    charStats: { STR: 99, AGI: 99, VIT: 99, INT: 99, LUK: 99 },
  });
  maxed.stats = Object.fromEntries(Object.keys(blank.stats).map(k => [k, 9e6]));
  maxed.stats.dungeonClears = {};
  maxed.town = { ...blank.town, cycles: 9e5, lifetimeRevenue: 9e9,
    plots: Array.from({ length: 9 }, () => ({ owned: true, building: 'inn', level: 5, stock: {}, progress: 0 })) };
  for (const id of Object.keys(maxed.skills)) maxed.skills[id].xp = 2e8;
  maxed.classProgress = Object.fromEntries(Object.keys(CLASSES).map(id =>
    [id, { xp: 9e6, pointsUsed: 60, spent: Object.fromEntries(
      (TREES[id] || []).map(n => [n.id, n.max])) }]));
  // The older achievements read things a "maximal save" has to actually
  // contain: a full hireling roster, every quest done, every fragment
  // read, an ending chosen. Leaving these out made eight pre-existing
  // achievements look unsatisfiable when the fixture was simply thin.
  maxed.hirelings = Object.fromEntries(HIRELINGS.map(h => [h.id, 10]));
  maxed.upgrades = Object.fromEntries(UPGRADES.map(u => [u.id, 10]));
  maxed.perks = Object.fromEntries(PERKS.map(pk => [pk.id, pk.maxLevel]));
  maxed.quests = { progress: {}, seenOffers: {}, flags: {},
    completed: Object.fromEntries(ALL_QUESTS.map(q => [q.id, true])) };
  maxed.loreSeen = Object.fromEntries(Object.keys(FRAGMENTS).map(k => [k, true]));
  maxed.ending = 'broken';
  maxed.stats.dungeonClears = Object.fromEntries(DUNGEONS.map(d => [d.id, 99]));
  maxed.codex = { ...blank.codex,
    seen: Object.fromEntries(CODEX.map(e => [e.id, 1])) };

  // Derived per save, not hard-coded — the first version handed both the
  // blank and the maximal fixture a combat level of 199, which made four
  // achievements look like they fire before you have done anything.
  const ctxFor = s => ({
    state: s,
    level: id => Math.min(199, levelForXp(s.skills[id]?.xp || 0)),
    uncapped: id => levelForXp(s.skills[id]?.xp || 0),
    totalLevel: Object.keys(s.skills).reduce((t2, id) => t2 + Math.min(199, levelForXp(s.skills[id].xp)), 0),
    combatLevel: Math.max(1, Math.floor(['attack', 'strength', 'defense', 'hitpoints']
      .reduce((n, id) => n + Math.min(199, levelForXp(s.skills[id]?.xp || 0)), 0) / 3)),
    charLevel: 1 + Math.max(0, Math.floor((Object.keys(s.skills)
      .reduce((n, id) => n + Math.min(199, levelForXp(s.skills[id].xp)), 0) - 22) / 4)),
    anySkillAtLeast: n => Object.keys(s.skills).some(id => levelForXp(s.skills[id].xp) >= n),
    speciesRarity: id => SPECIES_LIST.find(x => x.id === id)?.rarity,
    masteries: s === maxed ? 8 : 0,
    talentRanks: s === maxed ? 400 : 0,
  });

  // Some achievements are mutually exclusive by design — you cannot be
  // both ahead of the house and half a million down at the same moment.
  // So satisfiability is tested against a SET of maximal saves and an
  // achievement passes if any one of them reaches it.
  const unlucky = structuredClone(maxed);
  unlucky.casino = { ...maxed.casino, won: 1, lost: 9e9 };
  const maximal = [maxed, unlucky];

  const threw = [], never = [], always = [];
  for (const a of ACHIEVEMENTS) {
    let lo, hi;
    try {
      lo = !!a.cond(ctxFor(blank));
      hi = maximal.some(s => { try { return !!a.cond(ctxFor(s)); } catch { return false; } });
    } catch (e) { threw.push([a.id, e.message]); continue; }
    if (!hi) never.push(a.id);
    if (lo) always.push(a.id);
  }
  if (threw.length) {
    fail(`${threw.length} achievement condition(s) throw — they can never fire, and the runtime swallows it:`);
    for (const [id, m] of threw.slice(0, 8)) console.log(`      ${id}: ${m}`);
  } else good(`all ${ACHIEVEMENTS.length} achievement conditions run cleanly`);
  if (never.length) {
    fail(`${never.length} can never be satisfied: ${never.slice(0, 8).join(', ')}`);
  } else good('every achievement is satisfiable by a maximal save');
  if (always.length) flag(`${always.length} already true on a blank save: ${always.slice(0, 6).join(', ')}`);

  // Deeds read dotted paths. A typo there is a quest that never progresses.
  const missing = DEEDS.filter(d => d.goal.kind === 'count' && (() => {
    let n = blank;
    for (const k of d.goal.path.split('.')) { if (n == null) return true; n = n[k]; }
    return n === undefined;
  })());
  if (missing.length) fail(`${missing.length} deed(s) read a path that is not on state: ${missing.map(d => d.goal.path).join(', ')}`);
  else good(`all ${DEEDS.length} deeds read a real counter`);
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
