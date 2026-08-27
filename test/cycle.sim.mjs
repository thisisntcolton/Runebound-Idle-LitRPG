// ============================================================
// HOW LONG IS A CYCLE, REALLY?
//
// A tester reached cycle seven and said it felt like he was close to
// beating the game. He was right, and the reason is a single number:
//
//   ASCEND_MIN_TOTAL_LEVEL = 120
//
// Thirteen skills, total level 120, is an average of level NINE — about
// 969 XP each. Aurelion, the boss that opens Era II, needs combat level
// 95, which is 8.8 million XP per combat skill. The bar to end a cycle
// sat at roughly one nine-thousandth of the bar to see the content that
// cycle exists to reach. So the optimal play was to ascend immediately,
// over and over, and the game agreed.
//
// This sim prices a cycle in hours at every ascension count, under the
// old flat threshold and the new curve, and reports when Aurelion first
// comes into range.
// ============================================================

import { xpForLevel } from '../src/core/xp.js';
import { ascendThreshold, ASCEND_MIN_TOTAL_LEVEL, ASCEND_MAX_TOTAL_LEVEL } from '../src/core/state.js';
import { SKILL_IDS } from '../src/data/skills.js';

const N_SKILLS = SKILL_IDS.length;

// XP per hour a player earns per skill, roughly, at a given level band.
// Deliberately generous — hirelings, town buffs, perks and offline all
// push this up, and a sim that flatters the grind is the safe direction
// to be wrong in when the complaint is "too fast".
function xpPerHour(level) {
  if (level < 20) return 9000;
  if (level < 40) return 40000;
  if (level < 60) return 150000;
  if (level < 80) return 480000;
  if (level < 99) return 1400000;
  return 3200000;
}

/** Hours to bring one skill from 1 to `level`. */
function hoursToLevel(level) {
  let hours = 0;
  for (let l = 2; l <= level; l++) {
    const step = xpForLevel(l) - xpForLevel(l - 1);
    hours += step / xpPerHour(l);
  }
  return hours;
}

/**
 * Hours to reach a given TOTAL skill level, assuming a player spreads
 * effort evenly. Not how anyone actually plays, but it is the same
 * assumption on both sides of the comparison, so the ratio holds.
 */
function hoursForTotal(total) {
  const per = Math.max(1, total / N_SKILLS);
  const whole = Math.floor(per);
  const frac = per - whole;
  return N_SKILLS * (hoursToLevel(whole) + frac * (hoursToLevel(whole + 1) - hoursToLevel(whole)));
}

// What Aurelion actually costs: combat level 95 means the four combat
// skills at 95, on top of whatever else you were doing.
const AURELION_COMBAT_LEVEL = 95;
const aurelionHours = 4 * hoursToLevel(AURELION_COMBAT_LEVEL);
const aurelionTotal = 4 * AURELION_COMBAT_LEVEL + (N_SKILLS - 4) * 30;

console.log('\n=== WHAT THE CONTENT COSTS ===');
console.log(`  Aurelion needs combat ${AURELION_COMBAT_LEVEL} — about ${aurelionHours.toFixed(0)}h of combat alone,`);
console.log(`  and a character who got there is around total skill level ${aurelionTotal}.`);

console.log('\n=== THE OLD FLAT BAR ===');
console.log(`  every cycle ended at total ${ASCEND_MIN_TOTAL_LEVEL} — ${hoursForTotal(ASCEND_MIN_TOTAL_LEVEL).toFixed(1)}h,`);
console.log(`  or ${(hoursForTotal(ASCEND_MIN_TOTAL_LEVEL) / aurelionHours * 100).toFixed(2)}% of what the boss costs.`);

console.log('\n=== THE NEW CURVE ===');
console.log('  cycle   required total   hours that cycle   cumulative   reaches Aurelion?');
let cumulative = 0;
let firstReach = null;
for (let n = 0; n <= 11; n++) {
  const need = ascendThreshold(n);
  const h = hoursForTotal(need);
  cumulative += h;
  const reaches = need >= aurelionTotal;
  if (reaches && firstReach === null) firstReach = n + 1;
  console.log(
    `  ${String(n + 1).padStart(5)}   ${String(need).padStart(13)}   ${(h.toFixed(1) + 'h').padStart(16)}   ${(cumulative.toFixed(0) + 'h').padStart(10)}   ${reaches ? 'yes' : ''}`);
}

console.log('\n=== VERDICT ===');
let bad = 0;
const first = hoursForTotal(ascendThreshold(0));
if (first > 6) { console.log(`  ✗ cycle 1 is ${first.toFixed(1)}h — too long for an opening`); bad++; }
else console.log(`  ✓ cycle 1 stays an introduction (${first.toFixed(1)}h)`);

if (firstReach === null) { console.log('  ✗ the curve never demands enough to meet Aurelion'); bad++; }
else if (firstReach > 7) { console.log(`  ✗ Aurelion not in range until cycle ${firstReach} — too far`); bad++; }
else console.log(`  ✓ by cycle ${firstReach} the bar itself puts you in Aurelion's range`);

// The bar must always be reachable. 13 skills at the Era I ceiling is
// 1287 total; a threshold above that is a player who can never Ascend
// again, which is not a difficulty curve, it is an ending.
const ERA1_MAX_TOTAL = N_SKILLS * 99;
const worst = ascendThreshold(50);
if (worst >= ERA1_MAX_TOTAL) {
  console.log(`  ✗ the bar reaches ${worst}, above the ${ERA1_MAX_TOTAL} a sandbox player can ever have`);
  bad++;
} else {
  console.log(`  ✓ the bar plateaus at ${ASCEND_MAX_TOTAL_LEVEL}, inside the ${ERA1_MAX_TOTAL} ceiling`);
}
const plateauHours = hoursForTotal(ASCEND_MAX_TOTAL_LEVEL);
if (plateauHours > 80) { console.log(`  ✗ the plateau is ${plateauHours.toFixed(0)}h a cycle — a wall, not a pace`); bad++; }
else console.log(`  ✓ late cycles settle at about ${plateauHours.toFixed(0)}h each`);

const seven = hoursForTotal(ascendThreshold(6));
if (seven < first * 4) { console.log(`  ✗ cycle 7 (${seven.toFixed(1)}h) is not meaningfully longer than cycle 1`); bad++; }
else console.log(`  ✓ cycle 7 is ${(seven / first).toFixed(0)}x cycle 1 — the loop escalates`);

console.log(`\n${bad === 0 ? 'The cycle grows into its own content.' : bad + ' problem(s).'}\n`);
process.exit(bad ? 1 : 0);
