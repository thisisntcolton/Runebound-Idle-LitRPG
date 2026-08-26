// ============================================================
// THE SECOND HUNDRED — what does levelling past 99 actually cost?
//
// Two things have to be true or the band is a mistake:
//
//  1. LEVELS 1-99 ARE UNCHANGED. Not approximately. This asserts the
//     classic thresholds by value, because every save in the world stores
//     raw XP and would silently relevel if they moved.
//
//  2. THE HAUL IS FINISHABLE. The RS curve extended to 199 would cost
//     about a trillion times level 99. The point of the second band is
//     that it is long, not that it is impossible.
//
// Run with `node test/levels.sim.mjs`.
// ============================================================
import { xpForLevel, levelForXp, MAX_LEVEL, SOFT_CAP } from '../src/core/xp.js';

let bad = 0;
const fail = m => { console.log('  ✗', m); bad++; };

console.log('=== BAND ONE IS FROZEN ===\n');
// The canonical RuneScape totals. If any of these move, saves relevel.
const CANON = {
  1: 0, 2: 83, 10: 1154, 20: 4470, 30: 13363, 40: 37224,
  50: 101333, 60: 273742, 70: 737627, 80: 1986068, 90: 5346332, 99: 13034431,
};
for (const [lvl, want] of Object.entries(CANON)) {
  const got = xpForLevel(Number(lvl));
  if (got !== want) fail(`level ${lvl} is ${got.toLocaleString()}, should be ${want.toLocaleString()}`);
}
if (!bad) console.log(`  ✓ all ${Object.keys(CANON).length} canonical thresholds match to the XP`);
console.log(`  ✓ level ${SOFT_CAP} still costs ${xpForLevel(SOFT_CAP).toLocaleString()}`);

console.log('\n=== BAND TWO ===\n');
console.log('   level        total xp      step from previous   x total-to-99');
for (const lvl of [100, 110, 125, 150, 175, 199]) {
  const total = xpForLevel(lvl);
  const step = total - xpForLevel(lvl - 1);
  console.log(`   ${String(lvl).padStart(5)}  ${total.toLocaleString().padStart(15)}  ` +
    `${step.toLocaleString().padStart(18)}   ${(total / xpForLevel(99)).toFixed(1)}x`);
}

// Sanity: monotonic, and every level distinguishable.
for (let l = 2; l <= MAX_LEVEL; l++) {
  if (xpForLevel(l) <= xpForLevel(l - 1)) fail(`level ${l} does not cost more than ${l - 1}`);
  if (levelForXp(xpForLevel(l)) !== l) fail(`levelForXp round-trip broken at ${l}`);
}
if (!bad) console.log('\n  ✓ strictly increasing, and levelForXp round-trips at every level');

console.log('\n=== WHAT THAT IS IN HOURS ===\n');
// XP rates a player plausibly has, per minute, in each era. These are the
// same ballpark the skills sim uses for a capped action with hirelings.
const RATES = [
  { name: 'mid game, one skill, no help',   xpm: 900 },
  { name: 'late Era I, hirelings + buffs',  xpm: 3200 },
  { name: 'Era II, everything running',     xpm: 9000 },
];
const to99 = xpForLevel(99);
const to199 = xpForLevel(199);
for (const r of RATES) {
  const h99 = to99 / r.xpm / 60;
  const hBand = (to199 - to99) / r.xpm / 60;
  console.log(`   ${r.name.padEnd(32)} ${r.xpm.toLocaleString().padStart(6)} xp/min  ` +
    `1-99: ${h99.toFixed(0).padStart(4)}h    100-199: ${hBand.toFixed(0).padStart(5)}h`);
}
console.log(`\n   The band is ${((to199 - to99) / to99).toFixed(1)}x the whole climb to 99.`);
console.log('   That is deliberate: it is the Era II pursuit, not a weekend.');

console.log('\n=== WHERE THE NEW CONTENT SHOULD SIT ===\n');
// A new action gated at level L is reachable after this much of the band.
for (const lvl of [105, 115, 130, 150, 165, 185]) {
  const frac = (xpForLevel(lvl) - to99) / (to199 - to99);
  const hrs = (xpForLevel(lvl) - to99) / 9000 / 60;
  console.log(`   an action gated at ${String(lvl).padStart(3)} opens ${(frac * 100).toFixed(0).padStart(3)}% into the band` +
    `  (~${hrs.toFixed(0).padStart(3)}h past 99 at endgame rates)`);
}

console.log(`\n${bad ? bad + ' PROBLEMS' : 'no problems'}\n`);
process.exit(bad ? 1 : 0);
