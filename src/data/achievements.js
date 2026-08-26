// ============================================================
// ACHIEVEMENTS & TITLES
// cond(ctx) -> boolean, where ctx = { state, level(id), totalLevel, combatLevel }
// Achievements with `title` grant a selectable title, shown on
// the leaderboard. Everything here is data + pure functions.
// ============================================================

export const ACHIEVEMENTS = [
  // ---------- Slaughter ----------
  { id: 'kills_100', icon: '⚔️', name: 'Blooded', desc: 'Slay 100 monsters',
    cond: c => c.state.stats.kills >= 100 },
  { id: 'kills_1k', icon: '⚔️', name: 'Veteran of the Meadow', desc: 'Slay 1,000 monsters',
    cond: c => c.state.stats.kills >= 1000, title: 'Veteran' },
  { id: 'kills_10k', icon: '🗡️', name: 'Extinction Event', desc: 'Slay 10,000 monsters',
    cond: c => c.state.stats.kills >= 10000, title: 'Extinction Event' },
  { id: 'boss_1', icon: '👑', name: 'Regicide', desc: 'Slay your first boss',
    cond: c => c.state.stats.bossKills >= 1 },
  { id: 'boss_25', icon: '👑', name: 'Habitual Regicide', desc: 'Slay 25 bosses',
    cond: c => c.state.stats.bossKills >= 25, title: 'Kingslayer' },
  { id: 'aurelion_1', icon: '🐉', name: 'The Last Flame Gutters', desc: 'Defeat Aurelion',
    cond: c => (c.state.stats.aurelionKills || 0) >= 1, title: 'Wyrmslayer' },
  { id: 'hit_100', icon: '💥', name: 'Overkill', desc: 'Hit for 100+ damage in one blow',
    cond: c => c.state.stats.highestDamage >= 100 },
  { id: 'hit_500', icon: '☄️', name: 'One Punch', desc: 'Hit for 500+ damage in one blow',
    cond: c => c.state.stats.highestDamage >= 500, title: 'One Punch' },
  { id: 'die_once', icon: '☠️', name: 'Humbled', desc: 'Die. It happens.',
    cond: c => c.state.stats.deaths >= 1 },
  { id: 'die_25', icon: '⚰️', name: 'Frequent Flyer', desc: 'Die 25 times',
    cond: c => c.state.stats.deaths >= 25, title: 'Unkillable (Eventually)' },

  // ---------- Skills ----------
  { id: 'level_50_any', icon: '📗', name: 'Adept', desc: 'Reach level 50 in any skill',
    cond: c => c.anySkillAtLeast(50) },
  { id: 'level_99_any', icon: '📕', name: 'The Long Grind', desc: 'Reach level 99 in any skill',
    cond: c => c.anySkillAtLeast(99), title: 'Grandmaster' },
  { id: 'total_250', icon: '📊', name: 'Well-Rounded', desc: 'Total skill level 250',
    cond: c => c.totalLevel >= 250 },
  { id: 'total_500', icon: '📊', name: 'Polymath', desc: 'Total skill level 500',
    cond: c => c.totalLevel >= 500, title: 'Polymath' },
  { id: 'total_max', icon: '🏔️', name: 'Nothing Left to Learn', desc: 'Total skill level 990 — everything at 99',
    cond: c => c.totalLevel >= 990, title: 'The Completionist' },
  { id: 'combat_50', icon: '🛡️', name: 'Dangerous', desc: 'Combat level 50',
    cond: c => c.combatLevel >= 50 },
  { id: 'combat_100', icon: '🛡️', name: 'Walking Calamity', desc: 'Combat level 100',
    cond: c => c.combatLevel >= 100, title: 'Calamity' },
  { id: 'actions_10k', icon: '🔁', name: 'The Grind Recognizes You', desc: 'Perform 10,000 skill actions',
    cond: c => c.state.stats.actions >= 10000 },

  // ---------- Wealth ----------
  { id: 'gold_10k', icon: '🪙', name: 'Pocket Money', desc: 'Earn 10,000 lifetime gold',
    cond: c => c.state.lifetimeGold >= 10000 },
  { id: 'gold_1m', icon: '💰', name: 'Dragon Logic', desc: 'Earn 1,000,000 lifetime gold',
    cond: c => c.state.lifetimeGold >= 1e6, title: 'He Who Hoards' },
  { id: 'gold_100m', icon: '🏦', name: 'The Economy Is You', desc: 'Earn 100,000,000 lifetime gold',
    cond: c => c.state.lifetimeGold >= 1e8, title: 'The Economy' },
  { id: 'sold_5k', icon: '🧾', name: 'Merchant Prince', desc: 'Sell 5,000 items',
    cond: c => c.state.stats.itemsSold >= 5000, title: 'Merchant Prince' },
  { id: 'hire_all', icon: '🤝', name: 'Full Payroll', desc: 'Hire all six hirelings',
    cond: c => Object.values(c.state.hirelings).filter(v => v > 0).length >= 6 },

  // ---------- Story ----------
  { id: 'main_done', icon: '📜', name: "The Spire's Witness", desc: 'Complete the main quest chain',
    cond: c => c.state.quests.completed.last_flame === true, title: 'Witness' },
  { id: 'all_quests', icon: '🗺️', name: 'No Thread Left Loose', desc: 'Complete every quest, main and side',
    cond: c => Object.keys(c.state.quests.completed).length >= 19 },
  { id: 'lore_all', icon: '📖', name: 'Archivist', desc: 'Recover every lore fragment',
    cond: c => Object.keys(c.state.loreSeen).length >= 12, title: 'Archivist' },
  { id: 'ascend_1', icon: '💠', name: 'Again, Then', desc: 'Ascend for the first time',
    cond: c => c.state.ascensions >= 1 },
  { id: 'ascend_5', icon: '💠', name: 'Cyclewalker', desc: 'Ascend 5 times',
    cond: c => c.state.ascensions >= 5, title: 'Cyclewalker' },
  { id: 'cyclebreaker', icon: '⛓️', name: 'Cyclebreaker', desc: 'Break the Cycle',
    cond: c => c.state.ending === 'broken', title: 'Cyclebreaker' },
  { id: 'warranty_void', icon: '📄', name: 'Warranty Void', desc: 'Leave the sandbox',
    cond: c => (c.state.era || 1) >= 2, title: 'Unindexed' },
  { id: 'first_first_time', icon: '🧱', name: 'The First First Time',
    desc: 'Ascend once in the Wastes and keep your town',
    cond: c => (c.state.era || 1) >= 2 && (c.state.town?.plots || []).some(p => p.building),
    title: 'Still Standing' },
  { id: 'fed_flame', icon: '🔥', name: 'The Patient Ransom', desc: 'Feed the Flame instead',
    cond: c => c.state.ending === 'fed' || (c.state.ending === 'broken' && c.state.stats.flamesFed > 0), title: 'Flamekeeper' },

  // ---------- Rifts ----------
  { id: 'rift_1', icon: '🌀', name: 'Through the Crack', desc: 'Clear your first Rift',
    cond: c => (c.state.stats.dungeonRuns || 0) >= 1 },
  { id: 'rift_25', icon: '🌀', name: 'Riftstalker', desc: 'Clear 25 Rifts',
    cond: c => (c.state.stats.dungeonRuns || 0) >= 25, title: 'Riftstalker' },
  { id: 'rift_100', icon: '🌀', name: 'Seam Ripper', desc: 'Clear 100 Rifts',
    cond: c => (c.state.stats.dungeonRuns || 0) >= 100, title: 'Seam Ripper' },
  { id: 'seam_clear', icon: '📃', name: 'Editor', desc: 'Defeat The Unwritten at the bottom of The Seam',
    cond: c => (c.state.stats.dungeonClears?.seam || 0) >= 1, title: 'The Editor' },
  { id: 'warrens_10', icon: '👑', name: 'Pest Control', desc: 'Clear The Warrens Below 10 times',
    cond: c => (c.state.stats.dungeonClears?.warrens || 0) >= 10 },

  // ---------- Enchanting ----------
  { id: 'enchant_1', icon: '🔹', name: 'First Spark', desc: 'Enchant a piece of gear',
    cond: c => (c.state.stats.enchants || 0) >= 1 },
  { id: 'enchant_plus5', icon: '💠', name: 'Runesmith', desc: 'Take any item to +5',
    cond: c => Object.values(c.state.enchants || {}).some(v => v >= 5), title: 'Runesmith' },
  { id: 'enchant_20', icon: '🔷', name: 'Glowing Wardrobe', desc: 'Apply 20 enchantments',
    cond: c => (c.state.stats.enchants || 0) >= 20 },

  // ---------- Alchemy ----------
  { id: 'potion_1', icon: '🧪', name: 'Bottoms Up', desc: 'Drink your first potion',
    cond: c => (c.state.stats.potionsDrunk || 0) >= 1 },
  { id: 'potion_100', icon: '⚗️', name: 'Potion Goblin', desc: 'Drink 100 potions',
    cond: c => (c.state.stats.potionsDrunk || 0) >= 100, title: 'Potion Goblin' },
  { id: 'alchemy_99', icon: '🌌', name: 'Transmutation Complete', desc: 'Reach Alchemy 99',
    cond: c => c.level('alchemy') >= 99, title: 'Alchemist Supreme' },

  // ---------- Character ----------
  { id: 'char_25', icon: '🎖️', name: 'Somebody', desc: 'Reach Character Level 25',
    cond: c => c.charLevel >= 25 },
  { id: 'char_50', icon: '🎖️', name: 'Main Character', desc: 'Reach Character Level 50',
    cond: c => c.charLevel >= 50, title: 'Main Character' },
  { id: 'stat_50', icon: '💪', name: 'Specialist', desc: 'Put 50 points into a single stat',
    cond: c => Object.values(c.state.charStats).some(v => v >= 50) },
];

export const TITLES = ACHIEVEMENTS.filter(a => a.title).map(a => ({ achievementId: a.id, title: a.title }));
export const TITLE_SET = new Set(TITLES.map(t => t.title));

export function getAchievement(id) { return ACHIEVEMENTS.find(a => a.id === id); }
