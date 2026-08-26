// ============================================================
// THE DESCENT — is the ladder climbable, and does it stay worth climbing?
//
// Two questions this answers, both of which are easy to get wrong by eye:
//
//  1. Does a floor stay a FIGHT rather than becoming a wall? A player's
//     power grows across cycles; the floors grow at a fixed rate. If the
//     floors win, the Descent is a wall you hit once and abandon.
//
//  2. Is the gold competitive with the alternatives? The Descent is the
//     fighter's answer to the Artisan's town. If it pays a tenth as well,
//     it is a lore attraction, not a spine.
//
// Run with `node test/deep.sim.mjs`.
// ============================================================
import { DEEP, deepMonster, depthCap, isWardenDepth, stratumFor } from '../src/data/deep.js';

// ---------------- A player, roughly ----------------
//
// Modelled from the same shape core/state.js uses: a max hit, an attack
// interval, an accuracy roll against defence, and damage reduction. The
// absolute numbers matter less than the RATIO across floors, which is
// what tells us whether the curve is survivable.

function player({ cycle, maxHit, accuracy, intervalMs, hp, dr }) {
  return { cycle, maxHit, accuracy, intervalMs, hp, dr };
}

// Three plausible players, at the three points where the Descent matters.
const PLAYERS = [
  player({ cycle: 4,  maxHit: 120, accuracy: 900,  intervalMs: 2400, hp: 900,  dr: 0.35 }),
  player({ cycle: 8,  maxHit: 260, accuracy: 1800, intervalMs: 2200, hp: 1500, dr: 0.45 }),
  player({ cycle: 14, maxHit: 520, accuracy: 3200, intervalMs: 2000, hp: 2400, dr: 0.55 }),
  player({ cycle: 22, maxHit: 980, accuracy: 5600, intervalMs: 1900, hp: 3600, dr: 0.62 }),
];

const hitChance = (acc, def) => Math.max(0.05, Math.min(0.95, acc / (acc + def * 6)));

/** Seconds to kill, and whether the player survives the exchange. */
function fight(p, m, deepDamageBonus) {
  const hc = hitChance(p.accuracy, m.defense);
  const avgHit = (p.maxHit * (1 + deepDamageBonus)) * 0.62;   // min-hit floor pulls the mean up
  const dps = (avgHit * hc) / (p.intervalMs / 1000);
  const ttk = m.hp / dps;

  const theirHc = hitChance(m.attack * 12, 120);              // player defence, roughly
  const theirDps = (m.maxHit * 0.6 * theirHc * (1 - p.dr)) / (m.attackSpeed / 1000);
  const damageTaken = theirDps * ttk;

  return { ttk, damageTaken, survives: damageTaken < p.hp * 0.9, hc };
}

console.log('=== THE DESCENT ===\n');
console.log(`Ladder: ${DEEP.CLEARS_PER_DEPTH} clears per floor, a Warden every ${DEEP.WARDEN_EVERY}.`);
console.log(`Cap: ${DEEP.BASE_CAP} + ${DEEP.CAP_PER_CYCLE} per cycle.\n`);

for (const p of PLAYERS) {
  const cap = depthCap(p.cycle);
  console.log(`--- Cycle ${p.cycle} player (max hit ${p.maxHit}, ${p.hp} HP, ${Math.round(p.dr * 100)}% DR) — cap floor ${cap}`);

  let wall = null;
  let goldAtDeepest = 0, deepest = 0;

  for (let d = 1; d <= cap; d++) {
    // The permanent bonus you would have from having got this far.
    const bonus = DEEP.BONUS_PER_DEPTH.damage * (d - 1);
    const m = deepMonster(d, 0);
    const r = fight(p, m, bonus);
    const goldPerMin = ((m.gold[0] + m.gold[1]) / 2) * (1 + DEEP.BONUS_PER_DEPTH.gold * (d - 1)) * (60 / (r.ttk + 1.2));

    if (!r.survives && wall === null) wall = d;
    if (r.survives) { deepest = d; goldAtDeepest = goldPerMin; }

    const flag = isWardenDepth(d) ? ' 👑' : '';
    if (d <= 3 || isWardenDepth(d) || d === cap || d === wall) {
      console.log(`   floor ${String(d).padStart(3)}${flag.padEnd(3)} ` +
        `${String(Math.round(r.ttk)).padStart(4)}s/kill  ` +
        `hit ${String(Math.round(r.hc * 100)).padStart(3)}%  ` +
        `takes ${String(Math.round(r.damageTaken)).padStart(5)} dmg  ` +
        `${r.survives ? '     ' : ' DIES'}  ` +
        `${Math.round(goldPerMin).toLocaleString().padStart(10)} g/min  ` +
        `${stratumFor(d).name}`);
    }
  }

  const floorTime = deepest ? fight(p, deepMonster(deepest, 0), DEEP.BONUS_PER_DEPTH.damage * deepest).ttk : 0;
  console.log(`   → clears to floor ${deepest}${wall ? ` (wall at ${wall})` : ' (no wall — cycle-capped)'}` +
    `, ${Math.round(goldAtDeepest).toLocaleString()} g/min there,` +
    ` ~${Math.round((floorTime + 1.2) * DEEP.CLEARS_PER_DEPTH / 60)} min per new floor\n`);
}

// ---------------- Time to walk the whole cap ----------------
console.log('=== TIME TO THE CEILING ===\n');
for (const p of PLAYERS) {
  const cap = depthCap(p.cycle);
  let total = 0, reached = 0;
  for (let d = 1; d <= cap; d++) {
    const r = fight(p, deepMonster(d, 0), DEEP.BONUS_PER_DEPTH.damage * (d - 1));
    if (!r.survives) break;
    reached = d;
    total += (r.ttk + 1.2) * (isWardenDepth(d) ? 1 : DEEP.CLEARS_PER_DEPTH);
  }
  console.log(`   cycle ${String(p.cycle).padStart(2)}: floor ${String(reached).padStart(3)} of ${String(cap).padStart(3)}` +
    ` in ${(total / 3600).toFixed(1)}h of active fighting` +
    `  → standing bonus +${Math.round(reached * DEEP.BONUS_PER_DEPTH.damage * 100)}% dmg,` +
    ` +${Math.round(reached * DEEP.BONUS_PER_DEPTH.gold * 100)}% gold`);
}
console.log();
