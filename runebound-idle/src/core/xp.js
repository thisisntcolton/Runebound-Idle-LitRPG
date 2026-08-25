// RuneScape/Melvor-style XP curve, capped at level 99.
export const MAX_LEVEL = 99;

const xpTable = [0, 0]; // xpTable[level] = total xp required to BE that level
{
  let points = 0;
  for (let lvl = 1; lvl < 100; lvl++) {
    points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
    xpTable[lvl + 1] = Math.floor(points / 4);
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
