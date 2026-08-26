// ============================================================
// THE XP CURVE — two bands, and a hard rule about the first one
//
// Levels 1-99 are the RuneScape/Melvor curve and are FROZEN. Not
// "basically the same", not "close enough" — byte-for-byte the numbers
// they have always been. Every existing save stores raw XP, every balance
// number in the game was tuned against these thresholds, and the server's
// anti-cheat check derives levels from this same file. Changing the first
// band would silently relevel every player in the world and invalidate a
// year of tuning to save one `if`.
//
// Levels 100-199 are a SECOND BAND with a different shape, and the
// difference is the point.
//
// The RS curve roughly doubles every seven levels. Extended to 199 that
// puts level 199 at something like a trillion times level 99 — content
// nobody would ever see. So the second band grows LINEARLY instead: each
// level past 99 costs a little more than the last, rather than a constant
// factor more. That turns the second hundred from an exponential wall
// into a long, legible haul: roughly forty times the total cost of
// reaching 99, spread evenly enough that every level up there feels
// like the same size of achievement.
//
// See `npm run sim:levels` for what that actually costs in hours.
// ============================================================

/** Where the RuneScape curve stops and the long band begins. */
export const SOFT_CAP = 99;
export const MAX_LEVEL = 199;

/**
 * Where the band starts, as a fraction of the 98->99 step.
 *
 * The first draft used the full step and the simulation said level 199
 * would take nine hundred hours per skill at endgame rates, which put
 * every new action gated above 130 out of reach of anyone who was ever
 * going to see it. Starting the band at under half the final RS step
 * makes the first new level up there cost about what level 96 did — a
 * continuation rather than a wall — and the last one about seven times
 * that.
 */
const BAND_BASE = 0.45;

/**
 * How much steeper each level past the soft cap is than the one before.
 * Linear, deliberately: another exponential is the thing this band exists
 * to avoid.
 */
const BAND_GROWTH = 0.03;

const xpTable = [0, 0]; // xpTable[level] = total xp required to BE that level
{
  // ---- Band one: 1-99, untouched ----
  let points = 0;
  for (let lvl = 1; lvl < SOFT_CAP + 1; lvl++) {
    points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
    xpTable[lvl + 1] = Math.floor(points / 4);
  }

  // ---- Band two: 100-199, linear growth off the last real step ----
  const step99 = xpTable[SOFT_CAP] - xpTable[SOFT_CAP - 1];
  for (let lvl = SOFT_CAP + 1; lvl <= MAX_LEVEL; lvl++) {
    const n = lvl - SOFT_CAP;                       // 1 at level 100
    const step = Math.floor(step99 * BAND_BASE * (1 + (n - 1) * BAND_GROWTH));
    xpTable[lvl] = xpTable[lvl - 1] + step;
  }
}

export function levelForXp(xp) {
  let lvl = 1;
  while (lvl < MAX_LEVEL && xp >= xpTable[lvl + 1]) lvl++;
  return lvl;
}

export function xpForLevel(level) {
  return xpTable[Math.min(Math.max(level, 1), MAX_LEVEL)];
}

// Progress fraction toward next level: 0..1 (1 when maxed)
export function levelProgress(xp) {
  const lvl = levelForXp(xp);
  if (lvl >= MAX_LEVEL) return 1;
  const cur = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  return (xp - cur) / (next - cur);
}

/**
 * Past the soft cap you are in the long band. Used by the UI to mark the
 * boundary, because "level 104" should not look like the same kind of
 * number as "level 4".
 */
export function inLongBand(level) { return level > SOFT_CAP; }
