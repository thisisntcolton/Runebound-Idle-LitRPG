// ============================================================
// LOOT — rarity-tier drop system
//
// Every kill rolls a RARITY first, then picks an item from that
// monster's pool for that tier. Harder enemies use better weight
// profiles and roll more times.
//
// Luck (LUK stat, Fortune's Favor perk, Lucky Brew) does NOT just
// nudge a flat percentage — it shifts weight up the rarity ladder,
// so stacking it visibly changes what you see drop.
// ============================================================

export const RARITY_TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// Base weights per difficulty profile (percentages, sum to 100).
export const RARITY_PROFILES = {
  trash: { common: 75,   uncommon: 20,   rare: 4.5,  epic: 0.48, legendary: 0.02 },
  elite: { common: 55,   uncommon: 30,   rare: 12,   epic: 2.9,  legendary: 0.10 },
  boss:  { common: 30,   uncommon: 35,   rare: 25,   epic: 9,    legendary: 1.00 },
};

// How many independent rarity rolls each profile makes per kill.
export const ROLLS_PER_PROFILE = { trash: 1, elite: 2, boss: 3 };

// How strongly luck pulls weight out of the low tiers into the high ones.
const LUCK_SHIFT = {
  common:    -0.45,
  uncommon:  -0.15,
  rare:       0.80,
  epic:       1.60,
  legendary:  2.50,
};
const LUCK_CAP = 1.5; // luckBonus is clamped here so perks can't guarantee legendaries

/**
 * Rarity weights after luck is applied, renormalised to 100.
 * @param {string} profile 'trash' | 'elite' | 'boss'
 * @param {number} luckBonus dropRateMultiplier() - 1  (0 = no luck)
 */
export function weightsWith(profile, luckBonus = 0) {
  const base = RARITY_PROFILES[profile] || RARITY_PROFILES.trash;
  const k = Math.max(0, Math.min(LUCK_CAP, luckBonus));
  const out = {};
  let sum = 0;
  for (const tier of RARITY_TIERS) {
    const v = Math.max(0, base[tier] * (1 + LUCK_SHIFT[tier] * k));
    out[tier] = v;
    sum += v;
  }
  if (sum <= 0) return { ...base };
  for (const tier of RARITY_TIERS) out[tier] = (out[tier] / sum) * 100;
  return out;
}

/** Pick a rarity tier from weights. */
export function rollRarity(profile, luckBonus = 0, rng = Math.random) {
  const w = weightsWith(profile, luckBonus);
  let roll = rng() * 100;
  for (const tier of RARITY_TIERS) {
    roll -= w[tier];
    if (roll <= 0) return tier;
  }
  return 'common';
}

/**
 * Resolve one kill's drops.
 * @param {object} monster must have `lootProfile` and `loot` (tiered pools)
 * @returns {Array<{item:string, qty:number, tier:string}>}
 */
export function rollLoot(monster, luckBonus = 0, rng = Math.random) {
  const pools = monster.loot;
  if (!pools || Array.isArray(pools)) return []; // legacy/no table
  const profile = monster.lootProfile || 'trash';
  const rolls = ROLLS_PER_PROFILE[profile] || 1;
  const results = [];

  for (let i = 0; i < rolls; i++) {
    let tier = rollRarity(profile, luckBonus, rng);
    // Fall back down the ladder if this monster has nothing at that tier,
    // so a Slime rolling "legendary" still gives you something real.
    let guard = 0;
    while ((!pools[tier] || pools[tier].length === 0) && guard++ < 5) {
      const idx = RARITY_TIERS.indexOf(tier);
      if (idx <= 0) break;
      tier = RARITY_TIERS[idx - 1];
    }
    const pool = pools[tier];
    if (!pool || pool.length === 0) continue;

    const entry = pool[Math.floor(rng() * pool.length)];
    const qty = Array.isArray(entry.qty)
      ? entry.qty[0] + Math.floor(rng() * (entry.qty[1] - entry.qty[0] + 1))
      : (entry.qty || 1);
    results.push({ item: entry.item, qty, tier });
  }
  return results;
}

/** Human-readable odds for the UI, e.g. [{tier:'rare', pct:12.4}, ...] */
export function displayOdds(profile, luckBonus = 0) {
  const w = weightsWith(profile, luckBonus);
  return RARITY_TIERS.map(tier => ({ tier, pct: w[tier] }));
}
