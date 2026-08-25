// Do the three new skills pay competitively, and do their chains resolve?
import { SKILLS, TRAINABLE_SKILLS } from '../src/data/skills.js';
import { ITEMS, getItem } from '../src/data/items.js';
import { HIRELINGS } from '../src/data/upgrades.js';

let bad = 0;
const fail = m => { console.log('  ✗', m); bad++; };

// Every action's inputs and outputs must exist.
for (const id of TRAINABLE_SKILLS) {
  const sk = SKILLS[id];
  if (!HIRELINGS.find(h => h.skill === id)) fail(`${id} has no hireling`);
  for (const a of sk.actions) {
    for (const k of Object.keys(a.output || {})) if (!ITEMS[k]) fail(`${id}/${a.id} outputs unknown item "${k}"`);
    for (const k of Object.keys(a.input || {}))  if (!ITEMS[k]) fail(`${id}/${a.id} inputs unknown item "${k}"`);
    if (a.level > 99) fail(`${id}/${a.id} needs level ${a.level}`);
  }
}

// Gold per minute for every gathering action, so no skill is a trap.
console.log('GOLD PER MINUTE, raw output at vendor price (no multipliers)\n');
for (const id of TRAINABLE_SKILLS) {
  const sk = SKILLS[id];
  const rows = sk.actions.filter(a => !a.input).map(a => {
    const gold = Object.entries(a.output).reduce((s,[k,q]) => s + (getItem(k)?.sell||0)*q, 0);
    return { a, gpm: gold / (a.baseTime/60000), xpm: a.xp / (a.baseTime/60000) };
  });
  if (!rows.length) continue;
  console.log(`${sk.icon} ${sk.name}`);
  for (const r of rows) {
    console.log(`   Lv${String(r.a.level).padStart(2)} ${r.a.name.padEnd(24)} ${Math.round(r.gpm).toLocaleString().padStart(7)} g/min   ${Math.round(r.xpm).toLocaleString().padStart(6)} xp/min`);
  }
}

// Crafting chains: does the output beat the sum of its inputs?
console.log('\nCRAFTING MARGIN (output value minus input value)\n');
for (const id of TRAINABLE_SKILLS) {
  const sk = SKILLS[id];
  const rows = sk.actions.filter(a => a.input);
  if (!rows.length) continue;
  console.log(`${sk.icon} ${sk.name}`);
  for (const a of rows) {
    const inV = Object.entries(a.input).reduce((s,[k,q]) => s + (getItem(k)?.sell||0)*q, 0);
    const outV = Object.entries(a.output).reduce((s,[k,q]) => s + (getItem(k)?.sell||0)*q, 0);
    const margin = outV - inV;
    // Equipment is worn, not sold. A chestplate costing more in bars than
    // a vendor pays for it is intended, not a bug.
    const isGear = Object.keys(a.output).some(k => getItem(k)?.type === 'equipment');
    const flag = margin < 0 ? (isGear ? '  (gear, worn not sold)' : '  ⚠ LOSS') : '';
    console.log(`   Lv${String(a.level).padStart(2)} ${a.name.padEnd(24)} ${String(inV).padStart(6)}g in -> ${String(outV).padStart(6)}g out   ${(margin>=0?'+':'')+margin}g${flag}`);
    if (margin < 0 && !isGear) fail(`${id}/${a.id} destroys value (${margin}g)`);
  }
}
console.log(`\n${TRAINABLE_SKILLS.length} trainable skills, ${HIRELINGS.length} hirelings, ${bad} problems`);
process.exit(bad?1:0);
