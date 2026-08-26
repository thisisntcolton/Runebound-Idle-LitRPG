// ============================================================
// THE ROAD, MEASURED AGAINST THE THING IT IS SUPPOSED TO RIVAL
//
// A player reported a single vignette paying 820,000 gold. The cause was
// not a generous outcome — it was the scale itself:
//
//   rewardUnit = 60 * 1.055^charLevel * (1 + ascensions * 0.25)
//
// written as though charLevel topped out around 100. It does not.
// charLevel is total skill level over four, so thirteen skills at 99 is
// character level 317, and 1.055^317 is twenty-three million. At that
// point a `gold: 20` outcome pays fifty-six billion. The formula was
// never wrong at low levels, which is exactly why it survived review.
//
// The fix is to stop inventing a curve and anchor the road to the thing
// the player would otherwise be doing. So this sim measures both:
//
//   COMBAT  — the best zone monster you can farm at a given combat level,
//             at the game's own kill cadence, in gold and XP per hour.
//   ROAD    — the real CHAINS data, walked, with every option equally
//             likely, plus travel finds, at the real encounter cadence.
//
// Parity is the goal the design asks for: "on par with attacking."
// ============================================================

import { ZONES } from '../src/data/monsters.js';
import { CHAINS, ADVENTURE } from '../src/data/adventure.js';
import { rewardUnit, xpUnit, combatIncome, MAX_PAYOUT_COMBAT_MINUTES } from '../src/data/adventure.js';

const fmt = n => Math.round(n).toLocaleString();

// ---------------- Combat ----------------
//
// The kill cadence a level-appropriate fight actually runs at. Attack
// interval is 2.6s, a healthy character lands 4-6 swings on an on-level
// monster, and RESPAWN_MS is 1.2s — call it twelve seconds door to door.
// Stated here rather than buried, because every number below rests on it.
const KILL_SECS = 12;
const XP_PER_DAMAGE = 4 + 1.33;   // style XP + hitpoints XP, per point dealt

const monsters = ZONES
  .filter(z => (z.era || 1) === 1)
  .flatMap(z => z.monsters.map(m => ({ ...m, zone: z.name })))
  .sort((a, b) => a.level - b.level);

// The baseline is combatIncome() itself — the same function the game uses
// to scale the road. Measuring the road against a second, separately
// written model of combat would just mean two things to keep in sync, and
// a parity check that drifts for reasons nobody can find.
function combatAt(combatLevel, era = 1) {
  const inc = combatIncome(combatLevel, era);
  return { goldPerHour: inc.gold * 60, xpPerHour: inc.xp * 60 };
}

// An independent read of the monster table, purely to check that
// combatIncome has not quietly wandered off from the data it claims to
// describe. If these two disagree badly the model is lying.
function crossCheck(combatLevel) {
  const open = monsters.filter(m => m.level <= combatLevel && !m.boss);
  const m = open[open.length - 1] || monsters[0];
  const kph = 3600 / KILL_SECS;
  return { monster: m, goldPerHour: kph * (m.gold[0] + m.gold[1]) / 2 };
}

// ---------------- The road ----------------
//
// Walk every option of every beat of every chain and average the payouts.
// Risky options are counted at their real odds. This is the load the road
// actually delivers, not a guess at it.
function roadLoad() {
  let goldMult = 0, xpMult = 0, n = 0;
  const bigOutcomes = [];

  const scoreEffects = (fx, weight, label) => {
    if (!fx) return;
    if (fx.gold) { goldMult += fx.gold * weight; if (fx.gold >= 12) bigOutcomes.push([label, fx.gold]); }
    if (fx.xp) for (const v of Object.values(fx.xp)) xpMult += (v / 20) * weight;
  };

  for (const chain of CHAINS) {
    for (const [beatId, beat] of Object.entries(chain.beats || {})) {
      const opts = beat.options || [];
      if (!opts.length) continue;
      n++;
      const w = 1 / opts.length;
      for (const o of opts) {
        const label = `${chain.id}/${beatId}/${o.id || '?'}`;
        if (o.risky && (o.good || o.bad)) {
          const p = o.chance ?? 0.5;
          scoreEffects(o.good?.effects, w * p, label + ' (good)');
          scoreEffects(o.bad?.effects, w * (1 - p), label + ' (bad)');
        } else {
          scoreEffects(o.effects, w, label);
        }
      }
    }
  }
  return { goldPerEncounter: goldMult / n, xpPerEncounter: xpMult / n, beats: n, bigOutcomes };
}

const load = roadLoad();
const secsPerEncounter = (ADVENTURE.MIN_MS + ADVENTURE.MAX_MS) / 2 / 1000;
const encountersPerHour = 3600 / secsPerEncounter;

console.log('\n=== THE ROAD, AS WRITTEN ===');
console.log(`  ${CHAINS.length} chains, ${load.beats} decision points`);
console.log(`  one encounter every ${secsPerEncounter.toFixed(0)}s → ${encountersPerHour.toFixed(0)} per hour`);
console.log(`  average payout: ${load.goldPerEncounter.toFixed(2)} gold-units, ${load.xpPerEncounter.toFixed(2)} xp-units`);
console.log(`  plus travel: ${ADVENTURE.TRAVEL_GOLD} gold-units, ${ADVENTURE.TRAVEL_XP} xp-units per encounter's walk`);

const goldUnitsPerHour = (load.goldPerEncounter + ADVENTURE.TRAVEL_GOLD) * encountersPerHour;
const xpUnitsPerHour = (load.xpPerEncounter + ADVENTURE.TRAVEL_XP) * encountersPerHour;
console.log(`  → ${goldUnitsPerHour.toFixed(0)} gold-units and ${xpUnitsPerHour.toFixed(0)} xp-units per hour`);

// ---------------- The comparison ----------------
//
// charLevel is total skill level / 4; combat level is the combat four / 3.
// A rounded player has both climbing together, so these pairs are the
// shape of a real save rather than a corner case.
const PLAYERS = [
  { name: 'early',        combat: 15,  char: 25,  asc: 0 },
  { name: 'mid',          combat: 40,  char: 70,  asc: 1 },
  { name: 'late Era I',   combat: 70,  char: 150, asc: 3 },
  { name: 'capped Era I', combat: 99,  char: 260, asc: 4 },
  { name: 'the reporter', combat: 60,  char: 101, asc: 4 },
];

function report(title, unitFn, xpUnitFn) {
  console.log(`\n=== ${title} ===`);
  console.log('  player          combat gold/h     road gold/h    ratio      combat xp/h       road xp/h    ratio');
  for (const p of PLAYERS) {
    const c = combatAt(p.combat);
    const u = unitFn(p);
    const xu = xpUnitFn(p);
    const roadGold = goldUnitsPerHour * u;
    const roadXp = xpUnitsPerHour * xu;
    console.log(
      '  ' + p.name.padEnd(14) +
      fmt(c.goldPerHour).padStart(13) + fmt(roadGold).padStart(16) +
      (roadGold / c.goldPerHour).toFixed(1).padStart(9) + 'x' +
      fmt(c.xpPerHour).padStart(16) + fmt(roadXp).padStart(16) +
      (roadXp / c.xpPerHour).toFixed(1).padStart(9) + 'x');
  }
}

report('AS SHIPPED — measured against the real functions',
  p => rewardUnit(p.combat, p.asc, 1),
  p => xpUnit(p.combat, 1));

console.log('\n=== MODEL CROSS-CHECK (combatIncome vs the raw monster table) ===');
for (const p of PLAYERS) {
  const model = combatAt(p.combat).goldPerHour;
  const raw = crossCheck(p.combat);
  const drift = model / raw.goldPerHour;
  console.log(`  ${p.name.padEnd(14)} farming ${raw.monster.name.padEnd(22)} model ${fmt(model).padStart(9)}/h  table ${fmt(raw.goldPerHour).padStart(9)}/h  ${drift.toFixed(2)}x`);
}

// ---------------- The verdict ----------------
//
// Parity means the road pays what fighting pays. A little either side is
// fine — it is a different activity with a different texture — but a
// factor of two in either direction means one of them is pointless.
const TOLERANCE = 1.6;
let bad = 0;
console.log('\n=== PARITY CHECK ===');
for (const p of PLAYERS) {
  const c = combatAt(p.combat);
  const roadGold = goldUnitsPerHour * rewardUnit(p.combat, p.asc, 1);
  const roadXp = xpUnitsPerHour * xpUnit(p.combat, 1);
  const gr = roadGold / c.goldPerHour, xr = roadXp / c.xpPerHour;
  const okG = gr >= 1 / TOLERANCE && gr <= TOLERANCE;
  const okX = xr >= 1 / TOLERANCE && xr <= TOLERANCE;
  if (!okG || !okX) bad++;
  console.log(`  ${okG && okX ? '✓' : '✗'} ${p.name.padEnd(14)} gold ${gr.toFixed(2)}x   xp ${xr.toFixed(2)}x`);
}

// The backstop should sit well above anything actually written, or it is
// silently clipping real content instead of catching a bug.
const worst = load.bigOutcomes.reduce((m, [, g]) => Math.max(m, g), 0);
const worstMinutes = worst * 0.47;
console.log(`\n  biggest written outcome: ${worst} units ≈ ${worstMinutes.toFixed(0)} min of fighting`);
console.log(`  payout cap: ${MAX_PAYOUT_COMBAT_MINUTES} min — ${worstMinutes < MAX_PAYOUT_COMBAT_MINUTES ? 'clear' : 'CLIPPING REAL CONTENT'}`);
if (worstMinutes >= MAX_PAYOUT_COMBAT_MINUTES) bad++;

console.log('\n=== THE OUTCOMES THAT ARE STILL BIG ===');
for (const [label, g] of load.bigOutcomes.sort((a, b) => b[1] - a[1]).slice(0, 8)) {
  console.log(`  ${String(g).padStart(3)}x ≈ ${(g * 0.47).toFixed(0)} min of fighting   ${label}`);
}
console.log(`\n${bad === 0 ? 'On parity.' : bad + ' profile(s) off parity.'}\n`);
process.exit(bad ? 1 : 0);
