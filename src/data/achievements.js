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
    cond: c => (c.state.era || 1) >= 2, title: 'Out of the Box' },
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

  // ============================================================
  // EVERYTHING ADDED SINCE
  //
  // Fifty, covering the systems that shipped with no achievements at all:
  // the road, the Descent, the Vigil, the casino, pet errands, the second
  // hundred levels, the Masteries, and thieving having consequences.
  //
  // The rule followed throughout: an achievement should describe
  // something you DID, not a number you passed on the way to something
  // else. "Walked a hundred miles of road" is a deed. "Had 4,000 gold at
  // some point" is a receipt.
  // ============================================================

  // ---------- The road ----------
  { id: 'road_1', icon: '🧭', name: 'Set Out', desc: 'Answer your first thing on the road',
    cond: c => (c.state.adventure?.encounters || 0) >= 1 },
  { id: 'road_50', icon: '🧭', name: 'Well Travelled', desc: 'Answer 50 encounters',
    cond: c => (c.state.adventure?.encounters || 0) >= 50 },
  { id: 'road_250', icon: '🛤️', name: 'The Road Knows You', desc: 'Answer 250 encounters',
    cond: c => (c.state.adventure?.encounters || 0) >= 250, title: 'Well Travelled' },
  { id: 'chain_1', icon: '📖', name: 'Saw It Through', desc: 'Carry a chain to its ending',
    cond: c => (c.state.adventure?.chains || 0) >= 1 },
  { id: 'chain_10', icon: '📖', name: 'Ten Stories Deep', desc: 'Finish 10 chains',
    cond: c => (c.state.adventure?.chains || 0) >= 10 },
  { id: 'chain_40', icon: '📚', name: 'Everyone Has Heard', desc: 'Finish 40 chains',
    cond: c => (c.state.adventure?.chains || 0) >= 40, title: 'Wayfarer' },
  { id: 'flags_15', icon: '🪧', name: 'A Reputation', desc: 'Leave 15 marks on the road',
    cond: c => Object.keys(c.state.adventure?.flags || {}).length >= 15 },

  // ---------- Thieving has consequences ----------
  { id: 'caught_1', icon: '🤚', name: 'Caught', desc: 'Have a theft go badly wrong',
    cond: c => (c.state.stats.theftsFought || 0) >= 1 },
  { id: 'caught_25', icon: '🏃', name: 'Known to the Watch', desc: 'Fight your way out 25 times',
    cond: c => (c.state.stats.theftsFought || 0) >= 25, title: 'Known to the Watch' },
  { id: 'thieving_99', icon: '🗝️', name: 'Never Noticed', desc: 'Reach Thieving 99',
    cond: c => c.level('thieving') >= 99, title: 'Never Noticed' },

  // ---------- The second hundred ----------
  { id: 'over_99', icon: '📈', name: 'Past the Ceiling', desc: 'Take any skill above 99',
    cond: c => Object.keys(c.state.skills || {}).some(id => c.uncapped(id) > 99) },
  { id: 'level_125', icon: '📈', name: 'Uncharted', desc: 'Take a skill to 125',
    cond: c => Object.keys(c.state.skills || {}).some(id => c.uncapped(id) >= 125) },
  { id: 'level_150', icon: '🌠', name: 'The Long Band', desc: 'Take a skill to 150',
    cond: c => Object.keys(c.state.skills || {}).some(id => c.uncapped(id) >= 150), title: 'Unbounded' },
  { id: 'level_199', icon: '♾️', name: 'The Actual Ceiling', desc: 'Take a skill to 199',
    cond: c => Object.keys(c.state.skills || {}).some(id => c.uncapped(id) >= 199), title: 'The Actual Ceiling' },
  { id: 'total_1500', icon: '🧮', name: 'Broadly Capable', desc: 'Reach 1,500 total skill level',
    cond: c => c.totalLevel >= 1500 },
  { id: 'total_2200', icon: '🧮', name: 'Comprehensively Capable', desc: 'Reach 2,200 total skill level',
    cond: c => c.totalLevel >= 2200, title: 'Comprehensively Capable' },

  // ---------- The Menagerie ----------
  { id: 'pet_hatch_1', icon: '🐣', name: 'Something Is Moving', desc: 'Hatch your first egg',
    cond: c => (c.state.pets?.hatched || 0) >= 1 },
  { id: 'pet_hatch_25', icon: '🐣', name: 'Full House', desc: 'Hatch 25 eggs',
    cond: c => (c.state.pets?.hatched || 0) >= 25 },
  { id: 'pet_bred_10', icon: '💞', name: 'Selective Pressure', desc: 'Breed 10 eggs',
    cond: c => (c.state.pets?.bred || 0) >= 10 },
  { id: 'pet_seen_all', icon: '📖', name: 'The Complete Menagerie', desc: 'Discover every species',
    cond: c => Object.keys(c.state.pets?.seen || {}).length >= 15, title: 'Beastfriend' },
  { id: 'pet_legendary', icon: '✦', name: 'Against the Odds', desc: 'Hold a legendary egg',
    cond: c => Object.keys(c.state.pets?.seen || {}).some(id => c.speciesRarity(id) === 'legendary') },
  { id: 'pet_max', icon: '🐾', name: 'Fully Grown', desc: 'Raise a pet to level 60',
    cond: c => Object.values(c.state.pets?.owned || {}).some(p => (p.xp || 0) >= 500000) },
  { id: 'errand_1', icon: '📮', name: 'Off You Go', desc: 'Send a pet on its first errand',
    cond: c => (c.state.stats.errands || 0) >= 1 },
  { id: 'errand_25', icon: '📮', name: 'Gainfully Employed', desc: 'Complete 25 errands',
    cond: c => (c.state.stats.errands || 0) >= 25, title: 'Employer' },

  // ---------- The Gilded Snake ----------
  { id: 'casino_1', icon: '🎲', name: 'First Hand', desc: 'Play a hand at the Gilded Snake',
    cond: c => (c.state.casino?.hands || 0) >= 1 },
  { id: 'casino_100', icon: '🎲', name: 'A Regular', desc: 'Play 100 hands',
    cond: c => (c.state.casino?.hands || 0) >= 100 },
  { id: 'casino_1000', icon: '🃏', name: 'The Dealer Knows Your Name', desc: 'Play 1,000 hands',
    cond: c => (c.state.casino?.hands || 0) >= 1000, title: 'High Roller' },
  { id: 'casino_streak', icon: '🔥', name: 'On a Run', desc: 'Win 6 in a row',
    cond: c => (c.state.casino?.bestStreak || 0) >= 6 },
  { id: 'casino_up', icon: '💰', name: 'Ahead of the House', desc: 'Be net positive at the tables',
    cond: c => ((c.state.casino?.won || 0) - (c.state.casino?.lost || 0)) > 0, title: 'Ahead of the House' },
  { id: 'casino_down', icon: '📉', name: 'The House Always Wins', desc: 'Be down 500,000 gold at the tables',
    cond: c => ((c.state.casino?.lost || 0) - (c.state.casino?.won || 0)) >= 500000, title: 'Sure Thing' },
  { id: 'casino_wagered', icon: '🪙', name: 'Turnover', desc: 'Wager 5,000,000 gold in total',
    cond: c => (c.state.casino?.wagered || 0) >= 5000000 },

  // ---------- Abilities ----------
  { id: 'tome_1', icon: '📕', name: 'Well Read', desc: 'Learn your first ability',
    cond: c => (c.state.stats.tomesLearned || 0) >= 1 },
  { id: 'tome_12', icon: '📚', name: 'A Deep Bench', desc: 'Learn 12 abilities',
    cond: c => (c.state.stats.tomesLearned || 0) >= 12 },
  { id: 'tome_all', icon: '🎓', name: 'Everything Written Down', desc: 'Learn every ability',
    cond: c => Object.keys(c.state.abilities?.known || {}).length >= 24, title: 'Everything Written Down' },
  { id: 'slots_3', icon: '✨', name: 'Full Loadout', desc: 'Fill all three ability slots',
    cond: c => Object.values(c.state.abilities?.equipped || {}).filter(Boolean).length >= 3 },

  // ---------- Classes & Masteries ----------
  { id: 'mastery_1', icon: '🏅', name: 'Finished Something', desc: 'Earn your first Mastery',
    cond: c => c.masteries >= 1 },
  { id: 'mastery_4', icon: '🏅', name: 'Four Paths Walked', desc: 'Earn 4 Masteries',
    cond: c => c.masteries >= 4, title: 'Many-Pathed' },
  { id: 'mastery_all', icon: '👑', name: 'Every Path', desc: 'Earn every Mastery',
    cond: c => c.masteries >= 8, title: 'Every Path' },
  { id: 'talents_100', icon: '🌳', name: 'Deeply Invested', desc: 'Buy 100 talent ranks across all trees',
    cond: c => c.talentRanks >= 100 },

  // ---------- The town ----------
  { id: 'town_cycles', icon: '🏘️', name: 'Open for Business', desc: 'Run 500 business cycles',
    cond: c => (c.state.town?.cycles || 0) >= 500 },
  { id: 'town_revenue', icon: '💷', name: 'Turning a Profit', desc: 'Take 5,000,000 in town revenue',
    cond: c => (c.state.town?.lifetimeRevenue || 0) >= 5000000, title: 'Proprietor' },
  { id: 'town_full', icon: '🏗️', name: 'Every Parcel', desc: 'Build on all nine parcels',
    cond: c => (c.state.town?.plots || []).filter(p => p.building).length >= 9, title: 'Founder' },

  // ---------- Era II ----------
  { id: 'deep_5', icon: '⬇️', name: 'Downward', desc: 'Reach depth 5 in the Descent',
    cond: c => (c.state.deep?.best || 0) >= 5 },
  { id: 'deep_20', icon: '⬇️', name: 'Further Than Surveyed', desc: 'Reach depth 20',
    cond: c => (c.state.deep?.best || 0) >= 20, title: 'Deepwalker' },
  { id: 'deep_40', icon: '🕳️', name: 'There Is No Bottom', desc: 'Reach depth 40',
    cond: c => (c.state.deep?.best || 0) >= 40, title: 'There Is No Bottom' },
  { id: 'warden_1', icon: '🗿', name: 'Something Was Minding It', desc: 'Fell a Warden',
    cond: c => (c.state.deep?.wardens || 0) >= 1 },
  { id: 'warden_25', icon: '🗿', name: 'Nothing Left Minding It', desc: 'Fell 25 Wardens',
    cond: c => (c.state.deep?.wardens || 0) >= 25 },
  { id: 'vigil_hit', icon: '🗼', name: 'You Did Get Its Attention', desc: 'Damage the Vigil',
    cond: c => (c.state.worldBoss?.dealt || 0) > 0 || (c.state.worldBoss?.felled || 0) >= 1 },
  { id: 'vigil_1', icon: '🗼', name: 'It Was Never Switched Off', desc: 'Bring the Vigil down',
    cond: c => (c.state.worldBoss?.felled || 0) >= 1, title: 'Vigil-Breaker' },
  { id: 'vigil_5', icon: '🌑', name: 'And Again', desc: 'Bring the Vigil down 5 times',
    cond: c => (c.state.worldBoss?.felled || 0) >= 5, title: 'And Again' },
  { id: 'era_2', icon: '🌍', name: 'Out of the Box', desc: 'Break the cycle',
    cond: c => (c.state.era || 1) >= 2, title: 'Unindexed' },
];

export const TITLES = ACHIEVEMENTS.filter(a => a.title).map(a => ({ achievementId: a.id, title: a.title }));
export const TITLE_SET = new Set(TITLES.map(t => t.title));

export function getAchievement(id) { return ACHIEVEMENTS.find(a => a.id === id); }
