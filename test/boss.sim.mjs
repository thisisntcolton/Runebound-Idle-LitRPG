// ============================================================
// THE VIGIL — is it a several-session fight, and does preparation matter?
//
// Two numbers decide whether this encounter works, and both are easy to
// get wrong by feel:
//
//   THE POOL. Too small and it dies in one sitting, which makes the
//   persistence pointless. Too large and nobody finishes one, which makes
//   the whole thing decorative. The target is roughly three to six
//   sessions for a player who turns up ready.
//
//   THE AURA. It has to end a round. If a prepared player can stand in it
//   forever the fight is an idle bar; if an unprepared one lasts nine
//   seconds it is a wall. The target is a round of one to three minutes
//   prepared, and something visibly worse when cold.
//
// Run with `node test/boss.sim.mjs`.
// ============================================================
import { BOSS, PREP, MAX_PREP, healthFor, auraDps } from '../src/data/worldboss.js';

const PLAYERS = [
  { name: 'cycle 4, fresh out of the box', cycle: 4,  depth: 4,  dps: 55,  hp: 900,  heal: 22 },
  { name: 'cycle 8, geared',               cycle: 8,  depth: 18, dps: 150, hp: 1500, heal: 40 },
  { name: 'cycle 14, deep',                cycle: 14, depth: 30, dps: 320, hp: 2400, heal: 70 },
  { name: 'cycle 22, everything',          cycle: 22, depth: 44, dps: 620, hp: 3600, heal: 120 },
];

// How long a round lasts: aura ramps, food heals at a flat rate, you are
// out when the ramp overtakes the healing and eats the bar.
function roundLength(p, prepFraction) {
  let hp = p.hp, t = 0;
  const step = 0.5;
  while (hp > 0 && t < 3600) {
    hp -= auraDps(t, prepFraction) * step;
    hp = Math.min(p.hp, hp + p.heal * step);
    t += step;
  }
  return t;
}

console.log('=== THE VIGIL ===\n');
console.log('Preparation lines:');
for (const l of PREP) console.log(`   ${l.icon} ${l.label.padEnd(26)} +${Math.round(l.bonus * 100)}%`);
console.log(`   → cold ×1.00, ready ×${(1 + MAX_PREP).toFixed(2)}\n`);

for (const p of PLAYERS) {
  const pool = healthFor(p.cycle, p.depth);
  console.log(`--- ${p.name}  (${p.dps} dps, ${p.hp} hp, heals ${p.heal}/s)`);
  console.log(`    pool: ${pool.toLocaleString()}`);

  for (const [label, frac] of [['cold', 0], ['half ready', 0.5], ['ready', 1]]) {
    const mult = 1 + MAX_PREP * frac;
    const round = roundLength(p, frac);
    const perRound = p.dps * mult * round;
    const rounds = pool / perRound;
    // A session is maybe four rounds with recovery between them.
    const sessionMin = 4 * (round + BOSS.RECOVERY_MS / 1000) / 60;
    const sessions = rounds / 4;
    console.log(`      ${label.padEnd(11)} ×${mult.toFixed(2)}  ` +
      `round ${String(Math.round(round)).padStart(4)}s  ` +
      `${Math.round(perRound).toLocaleString().padStart(9)} dmg/round  ` +
      `${String(Math.ceil(rounds)).padStart(4)} rounds  ` +
      `≈ ${sessions.toFixed(1)} sessions (${Math.round(sessionMin)} min each)`);
  }
  console.log();
}

console.log('=== THE WINDOW ===\n');
console.log(`   It stays up ${BOSS.WINDOW_MS / 3600000}h of real time and takes back ` +
  `${Math.round(BOSS.REGEN_ON_SUBMERGE * 100)}% of the damage done when it goes.`);
console.log(`   Surfaces after ${BOSS.FIRST_MS / 60000} min of play the first time, then every ` +
  `${BOSS.MIN_MS / 3600000}-${BOSS.MAX_MS / 3600000}h of TICKED play.\n`);

// Does a neglected fight ever converge? Damage carries over between
// surfacings, so the question is whether progress outruns the regen.
console.log('=== DOES IT EVER DIE IF YOU ONLY DO ONE SESSION PER SURFACING? ===\n');
for (const p of PLAYERS) {
  const pool = healthFor(p.cycle, p.depth);
  const round = roundLength(p, 1);
  const perSession = 4 * p.dps * (1 + MAX_PREP) * round;
  let hp = pool, surfacings = 0;
  while (hp > 0 && surfacings < 200) {
    hp -= perSession;
    surfacings++;
    // Regen is a share of what was done during THAT surfacing, which is
    // what makes the sequence converge.
    if (hp > 0) hp = Math.min(pool, hp + perSession * BOSS.REGEN_ON_SUBMERGE);
  }
  console.log(`   ${p.name.padEnd(32)} ${surfacings >= 200 ? 'NEVER — regen outruns you' : surfacings + ' surfacings'}`);
}
console.log();
