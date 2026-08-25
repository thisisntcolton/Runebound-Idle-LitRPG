// CONTENT VALIDATION — every unlockable must be reachable.
//
// A Codex entry whose condition can never be satisfied, or an encounter
// option nobody can afford, is invisible content: it costs the same to
// write and delivers nothing. This checks both by construction.
import { CODEX, CATEGORIES } from '../src/data/codex.js';
import { ITEMS } from '../src/data/items.js';
import { ZONES } from '../src/data/monsters.js';
import { SKILLS, SKILL_IDS } from '../src/data/skills.js';
import { BUILDINGS } from '../src/data/town.js';
import { ENCOUNTERS } from '../src/data/encounters.js';

const monsterIds = new Set();
for (const z of ZONES) for (const m of z.monsters) monsterIds.add(m.id);
const statKeys = new Set(['kills','deaths','actions','itemsSold','bossKills','highestDamage',
  'offlineEarnings','aurelionKills','flamesFed','dungeonRuns','potionsDrunk','enchants','riftsSealed']);
const FLAGS = new Set(['first_hireling','town_razed']);

let bad = 0, ok = 0;
const seenIds = new Set();
for (const e of CODEX) {
  const fail = m => { console.log(`  ✗ ${e.id}: ${m}`); bad++; };
  if (seenIds.has(e.id)) fail('duplicate id');
  seenIds.add(e.id);
  if (!CATEGORIES[e.cat]) fail(`unknown category "${e.cat}"`);
  if (!e.title || !e.text) fail('missing title or text');
  const w = e.when;
  if (!w) { fail('no unlock condition'); continue; }
  const keys = Object.keys(w);
  if (keys.length !== 1) fail(`expected exactly one condition, got ${keys.join(',')}`);
  if (w.skill) {
    if (!SKILLS[w.skill.id]) fail(`unknown skill "${w.skill.id}"`);
    else if (w.skill.level > 99) fail(`skill level ${w.skill.level} above the cap`);
  }
  if (w.killsOf && !monsterIds.has(w.killsOf.id)) fail(`unknown monster "${w.killsOf.id}"`);
  if (w.stat && !statKeys.has(w.stat.key)) fail(`unknown stat "${w.stat.key}"`);
  if (w.item && !ITEMS[w.item]) fail(`unknown item "${w.item}"`);
  if (w.flag && !FLAGS.has(w.flag)) fail(`flag "${w.flag}" is never set by any system`);
  if (w.townBuilding && !BUILDINGS[w.townBuilding]) fail(`unknown building "${w.townBuilding}"`);
  if (w.cycle !== undefined && w.cycle > 4) fail(`cycle ${w.cycle} is past the ending`);
  // deeper passes must be in ascending cycle order and reachable
  let prev = -1;
  for (const d of e.deeper || []) {
    if (d.cycle <= prev) fail(`deeper passes out of order at cycle ${d.cycle}`);
    if (d.cycle > 4) fail(`deeper pass at cycle ${d.cycle} is unreachable`);
    if (!d.text) fail('deeper pass with no text');
    prev = d.cycle;
  }
  ok++;
}

// coverage report
console.log('\nEntries per category:');
for (const c of Object.values(CATEGORIES)) {
  const n = CODEX.filter(e => e.cat === c.id).length;
  console.log(`  ${c.icon} ${c.name.padEnd(11)} ${n}`);
}
const withDepth = CODEX.filter(e => e.deeper?.length).length;
const totalPasses = CODEX.reduce((s,e)=>s+(e.deeper?.length||0),0);
console.log(`\n${CODEX.length} entries, ${withDepth} of which deepen across cycles (${totalPasses} extra passes)`);
console.log(`${ok} valid, ${bad} problems`);



console.log('\n=== ENCOUNTERS ===');
const encFail = (e,m)=>{ console.log(`  \u2717 ${e.id}: ${m}`); bad++; };
const BUFF_KEYS = new Set(['xp','gold','dropRate','speed','damage','reduction']);

for (const e of ENCOUNTERS) {
  if (!e.options?.length) encFail(e,'no options');
  if (e.options.length < 2) encFail(e,'needs at least two real choices');
  const ids = e.options.map(o=>o.id);
  if (new Set(ids).size !== ids.length) encFail(e,'duplicate option ids');
  if (!ids.includes(e.timeout)) encFail(e,`timeout "${e.timeout}" is not one of its options`);
  const free = e.options.filter(o=>!o.cost);
  if (!free.length) encFail(e,'every option costs gold — a broke player is stuck');
  for (const o of e.options) {
    if (!o.label || !o.desc) encFail(e,`option ${o.id} missing label/desc`);
    if (!o.outcome && !o.effects?.chase) encFail(e,`option ${o.id} has no outcome text`);
    const fx = o.effects || {};
    for (const [id,q] of Object.entries(fx.items||{})) if (!ITEMS[id]) encFail(e,`unknown item "${id}"`);
    for (const sk of Object.keys(fx.xp||{})) if (!SKILLS[sk]) encFail(e,`unknown skill "${sk}"`);
    if (fx.buff) {
      for (const k of Object.keys(fx.buff.effects||{}))
        if (!BUFF_KEYS.has(k)) encFail(e,`buff key "${k}" is not read by any multiplier`);
      if (!fx.buff.minutes) encFail(e,'buff with no duration');
    }
    if (fx.hp && (fx.hp <= 0 || fx.hp >= 1)) encFail(e,`hp fraction ${fx.hp} out of range`);
  }
}

// Cost curve: is the "pay" option ever absurd relative to town income?
console.log('\nCost of the paid option by town level:');
console.log('  lvl ' + [1,5,10,20,35].map(n=>String(n).padStart(9)).join(''));
for (const e of ENCOUNTERS) {
  const paid = e.options.find(o=>o.cost);
  if (!paid) continue;
  const row = [1,5,10,20,35].map(lvl =>
    Math.floor((paid.cost.gold||0) + (paid.cost.goldPerLevel||0)*lvl).toLocaleString().padStart(9));
  console.log(`  ${e.icon} ${e.name.slice(0,18).padEnd(19)}` + row.join(''));
}
console.log(`\n${ENCOUNTERS.length} encounters, ${ENCOUNTERS.reduce((s,e)=>s+e.options.length,0)} options, ${bad} problems`);


process.exit(bad ? 1 : 0);
