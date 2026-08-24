// ============================================================
// GOLD UPGRADES (AdCap-style escalating costs),
// HIRELINGS (managers that run skills passively),
// ASCENSION PERKS (bought with Fate Shards)
// ============================================================

// Repeatable upgrades: cost = baseCost * costMult^level
export const UPGRADES = [
  // Tool speed per gathering skill: +12% speed per level (multiplicative time reduction)
  { id: 'axe', name: 'Sharpened Axe', icon: '🪓', skill: 'woodcutting', maxLevel: 10,
    desc: '+12% Woodcutting speed per rank', baseCost: 50, costMult: 6, effect: { speed: 0.12 } },
  { id: 'pick', name: 'Hardened Pickaxe', icon: '⛏️', skill: 'mining', maxLevel: 10,
    desc: '+12% Mining speed per rank', baseCost: 50, costMult: 6, effect: { speed: 0.12 } },
  { id: 'rod', name: 'Braided Line', icon: '🎣', skill: 'fishing', maxLevel: 10,
    desc: '+12% Fishing speed per rank', baseCost: 50, costMult: 6, effect: { speed: 0.12 } },
  { id: 'bellows', name: 'Dwarven Bellows', icon: '🔥', skill: 'smithing', maxLevel: 10,
    desc: '+12% Smithing speed per rank', baseCost: 120, costMult: 6, effect: { speed: 0.12 } },
  { id: 'spices', name: 'Rare Spices', icon: '🧂', skill: 'cooking', maxLevel: 10,
    desc: '+12% Cooking speed per rank', baseCost: 100, costMult: 6, effect: { speed: 0.12 } },
  // Yield doublers: +10% chance per rank to double output
  { id: 'axe2', name: 'Forester\'s Instinct', icon: '🌿', skill: 'woodcutting', maxLevel: 5,
    desc: '+10% chance per rank to double logs', baseCost: 800, costMult: 9, effect: { double: 0.10 } },
  { id: 'pick2', name: 'Prospector\'s Eye', icon: '👁️', skill: 'mining', maxLevel: 5,
    desc: '+10% chance per rank to double ore', baseCost: 800, costMult: 9, effect: { double: 0.10 } },
  { id: 'rod2', name: 'Lucky Lure', icon: '🪝', skill: 'fishing', maxLevel: 5,
    desc: '+10% chance per rank to double catches', baseCost: 800, costMult: 9, effect: { double: 0.10 } },
  // Combat upgrades
  { id: 'whetstone', name: 'Whetstone Ritual', icon: '🪨', skill: 'combat', maxLevel: 10,
    desc: '+6% damage per rank', baseCost: 300, costMult: 7, effect: { damage: 0.06 } },
  { id: 'polish', name: 'Armor Polish', icon: '✨', skill: 'combat', maxLevel: 10,
    desc: '+6% damage reduction per rank', baseCost: 300, costMult: 7, effect: { reduction: 0.06 } },
  { id: 'dummy', name: 'Training Dummy', icon: '🎯', skill: 'combat', maxLevel: 8,
    desc: '+10% combat XP per rank', baseCost: 500, costMult: 8, effect: { combatXp: 0.10 } },
];

// Hirelings: run their skill passively at (25% + 5%/extra rank) of your rate,
// even while you do something else. AdCap "manager" energy.
export const HIRELINGS = [
  { id: 'h_wood', name: 'Baldric the Lumberjack', icon: '🧔', skill: 'woodcutting',
    flavor: 'Smells like sap and honest work.', baseCost: 2000, costMult: 12, maxLevel: 6 },
  { id: 'h_mine', name: 'Grimda Deepdelver', icon: '👷', skill: 'mining',
    flavor: 'Hasn\'t seen the sun since the Third Age. Doesn\'t miss it.', baseCost: 2000, costMult: 12, maxLevel: 6 },
  { id: 'h_fish', name: 'Old Man Hemlock', icon: '🎏', skill: 'fishing',
    flavor: 'Claims he once caught the moon\'s reflection. Twice.', baseCost: 2000, costMult: 12, maxLevel: 6 },
  { id: 'h_smith', name: 'Forge-Sister Vera', icon: '🧕', skill: 'smithing',
    flavor: 'Her hammer has a name. You are not allowed to know it.', baseCost: 6000, costMult: 12, maxLevel: 6 },
  { id: 'h_cook', name: 'Chef Bumblewort', icon: '👨‍🍳', skill: 'cooking',
    flavor: 'Was exiled from the palace over "the gravy incident."', baseCost: 5000, costMult: 12, maxLevel: 6 },
];

export const HIRELING_BASE_RATE = 0.25;   // fraction of your output at rank 1
export const HIRELING_RATE_PER_RANK = 0.05;

// Ascension perks, bought with Fate Shards. cost = baseCost * (level+1)
export const PERKS = [
  { id: 'swift_learner', name: 'Swift Learner', icon: '📖', maxLevel: 10,
    desc: '+10% all XP per rank', baseCost: 2, effect: { xp: 0.10 } },
  { id: 'golden_touch', name: 'Golden Touch', icon: '🤲', maxLevel: 10,
    desc: '+15% gold gained per rank', baseCost: 2, effect: { gold: 0.15 } },
  { id: 'timekeeper', name: 'Timekeeper', icon: '⏳', maxLevel: 4,
    desc: '+6 hours max offline progress per rank', baseCost: 3, effect: { offlineHours: 6 } },
  { id: 'warrior_soul', name: 'Warrior Soul', icon: '⚡', maxLevel: 8,
    desc: '+8% damage per rank', baseCost: 3, effect: { damage: 0.08 } },
  { id: 'ironhide', name: 'Ironhide', icon: '🦏', maxLevel: 8,
    desc: '+8% damage reduction per rank', baseCost: 3, effect: { reduction: 0.08 } },
  { id: 'fortunes_favor', name: 'Fortune\'s Favor', icon: '🍀', maxLevel: 5,
    desc: '+20% rare drop chance per rank', baseCost: 4, effect: { dropRate: 0.20 } },
  { id: 'haste', name: 'Chronomancer\'s Haste', icon: '💨', maxLevel: 5,
    desc: '+5% action speed per rank (all skills)', baseCost: 5, effect: { speed: 0.05 } },
];

export const SHARD_XP_BONUS = 0.02;   // each Fate Shard: +2% XP…
export const SHARD_GOLD_BONUS = 0.02; // …and +2% gold, always on.

export function upgradeCost(def, level) {
  return Math.floor(def.baseCost * Math.pow(def.costMult, level));
}
export function perkCost(def, level) {
  return def.baseCost * (level + 1);
}
export function getUpgrade(id) { return UPGRADES.find(u => u.id === id); }
export function getHireling(id) { return HIRELINGS.find(h => h.id === id); }
export function getPerk(id) { return PERKS.find(p => p.id === id); }
