// ============================================================
// COMBAT ZONES & MONSTERS
//
// Monster: hp, attack (accuracy), maxHit, defense, attackSpeed(ms),
//          gold [min,max], lootProfile, loot (tiered pools)
//
// lootProfile drives the rarity odds (see data/loot.js):
//   'trash' — 1 roll,  mostly common
//   'elite' — 2 rolls, decent rare/epic odds
//   'boss'  — 3 rolls, real legendary chance
//
// Pools are themed per monster. A tier with no pool falls back down
// the ladder, so nothing ever rolls into nothing.
// ============================================================

export const ZONES = [
  {
    id: 'meadow', name: 'Sunlit Meadow', icon: '🌾', level: 1,
    desc: 'Rolling fields at the edge of town. Even the rats here have delusions of grandeur.',
    monsters: [
      {
        id: 'slime', name: 'Gloopy Slime', icon: '🟢', level: 1,
        hp: 8, attack: 4, maxHit: 2, defense: 1, attackSpeed: 3000,
        gold: [1, 4], lootProfile: 'trash',
        loot: {
          common:   [{ item: 'herb_sagewort', qty: [1, 2] }, { item: 'raw_shrimp', qty: 1 }],
          uncommon: [{ item: 'copper_ore', qty: [1, 2] }, { item: 'oak_log', qty: [1, 3] }],
          rare:     [{ item: 'rune_shard', qty: 1 }],
        },
      },
      {
        id: 'rat', name: 'Whisker Bandit', icon: '🐀', level: 3,
        hp: 18, attack: 7, maxHit: 3, defense: 3, attackSpeed: 2800,
        gold: [2, 6], lootProfile: 'trash',
        loot: {
          common:   [{ item: 'raw_shrimp', qty: [1, 2] }, { item: 'herb_sagewort', qty: [1, 2] }],
          uncommon: [{ item: 'oak_log', qty: [2, 4] }, { item: 'copper_ore', qty: [1, 3] }],
          rare:     [{ item: 'bronze_boots', qty: 1 }, { item: 'rune_shard', qty: 1 }],
          epic:     [{ item: 'tome_parry', qty: 1 }],
        },
      },
      {
        id: 'boar', name: 'Tusked Boar', icon: '🐗', level: 6,
        hp: 35, attack: 12, maxHit: 5, defense: 8, attackSpeed: 3200,
        gold: [4, 10], lootProfile: 'trash',
        loot: {
          common:   [{ item: 'raw_trout', qty: 1 }, { item: 'herb_sagewort', qty: [2, 3] }],
          uncommon: [{ item: 'bronze_bar', qty: 1 }, { item: 'raw_shrimp', qty: [2, 4] }],
          rare:     [{ item: 'bronze_helmet', qty: 1 }, { item: 'rune_shard', qty: [1, 2] }],
          epic:     [{ item: 'tome_parry', qty: 1 }],
        },
      },
    ],
  },
  {
    id: 'forest', name: 'Gloomroot Forest', icon: '🌲', level: 8,
    desc: 'The canopy swallows the sun. Things with too many teeth wait between the trees.',
    monsters: [
      {
        id: 'goblin', name: 'Goblin Skirmisher', icon: '👺', level: 9,
        hp: 50, attack: 18, maxHit: 7, defense: 12, attackSpeed: 2600,
        gold: [8, 18], lootProfile: 'trash',
        loot: {
          common:   [{ item: 'copper_ore', qty: [2, 3] }, { item: 'herb_mooncap', qty: 1 }],
          uncommon: [{ item: 'bronze_bar', qty: [1, 2] }, { item: 'willow_log', qty: [2, 3] }],
          rare:     [{ item: 'bronze_weapon', qty: 1 }, { item: 'bronze_chest', qty: 1 }],
          epic:     [{ item: 'tome_heavy_blow', qty: 1 }],
        },
      },
      {
        id: 'wolf', name: 'Duskfang Wolf', icon: '🐺', level: 13,
        hp: 70, attack: 26, maxHit: 10, defense: 16, attackSpeed: 2400,
        gold: [12, 26], lootProfile: 'elite',
        loot: {
          common:   [{ item: 'raw_trout', qty: [1, 2] }, { item: 'herb_mooncap', qty: [1, 2] }],
          uncommon: [{ item: 'iron_ore', qty: [1, 3] }, { item: 'willow_log', qty: [2, 4] }],
          rare:     [{ item: 'wolf_fang_charm', qty: 1 }, { item: 'rune_shard', qty: [2, 3] }],
          epic:     [{ item: 'tome_riposte', qty: 1 }, { item: 'tome_heavy_blow', qty: 1 }, { item: 'iron_weapon', qty: 1 }],
        },
      },
      {
        id: 'ent', name: 'Rotbark Ent', icon: '🌳', level: 18,
        hp: 120, attack: 30, maxHit: 13, defense: 30, attackSpeed: 3600,
        gold: [18, 40], lootProfile: 'elite',
        loot: {
          common:   [{ item: 'willow_log', qty: [3, 5] }, { item: 'herb_mooncap', qty: [1, 3] }],
          uncommon: [{ item: 'maple_log', qty: [2, 3] }, { item: 'iron_ore', qty: [2, 3] }],
          rare:     [{ item: 'iron_chest', qty: 1 }, { item: 'greater_rune', qty: 1 }],
          epic:     [{ item: 'tome_thornmail', qty: 1 }, { item: 'tome_iron_stance', qty: 1 }],
        },
      },
    ],
  },
  {
    id: 'caves', name: 'Hollowdeep Caves', icon: '🕳️', level: 22,
    desc: 'Bones crunch underfoot. Your torchlight is a dinner bell.',
    monsters: [
      {
        id: 'bat', name: 'Shriekwing', icon: '🦇', level: 24,
        hp: 130, attack: 44, maxHit: 16, defense: 28, attackSpeed: 2200,
        gold: [25, 55], lootProfile: 'trash',
        loot: {
          common:   [{ item: 'coal', qty: [1, 3] }, { item: 'herb_emberpetal', qty: 1 }],
          uncommon: [{ item: 'raw_salmon', qty: [1, 2] }, { item: 'iron_bar', qty: 1 }],
          rare:     [{ item: 'rune_shard', qty: [2, 4] }, { item: 'steel_boots', qty: 1 }],
          epic:     [{ item: 'tome_cleave', qty: 1 }],
                  legendary: [{ item: 'tome_wellspring', qty: 1 }],
        },
      },
      {
        id: 'skeleton', name: 'Restless Skeleton', icon: '💀', level: 30,
        hp: 180, attack: 55, maxHit: 20, defense: 45, attackSpeed: 2800,
        gold: [35, 75], lootProfile: 'elite',
        loot: {
          common:   [{ item: 'iron_bar', qty: 1 }, { item: 'herb_emberpetal', qty: [1, 2] }],
          uncommon: [{ item: 'coal', qty: [2, 4] }, { item: 'steel_bar', qty: 1 }],
          rare:     [{ item: 'bone_ring', qty: 1 }, { item: 'greater_rune', qty: [1, 2] }],
          epic:     [{ item: 'tome_field_kit', qty: 1 }, { item: 'tome_cleave', qty: 1 }, { item: 'steel_weapon', qty: 1 }],
                  legendary: [{ item: 'tome_rupture', qty: 1 }],
        },
      },
      {
        id: 'spider', name: 'Broodmother', icon: '🕷️', level: 38,
        hp: 260, attack: 70, maxHit: 26, defense: 60, attackSpeed: 2500,
        gold: [50, 110], lootProfile: 'elite',
        loot: {
          common:   [{ item: 'raw_lobster', qty: [1, 2] }, { item: 'herb_emberpetal', qty: [2, 3] }],
          uncommon: [{ item: 'steel_bar', qty: [1, 2] }, { item: 'mythril_ore', qty: 1 }],
          rare:     [{ item: 'spider_silk_band', qty: 1 }, { item: 'greater_rune', qty: [2, 3] }],
          epic:     [{ item: 'tome_auto_elixir', qty: 1 }, { item: 'steel_chest', qty: 1 }],
          legendary:[{ item: 'tome_sunder', qty: 1 }, { item: 'tome_second_wind', qty: 1 }],
        },
      },
    ],
  },
  {
    id: 'peaks', name: 'Cindershard Peaks', icon: '🌋', level: 45,
    desc: 'The mountain smokes and grumbles. So do its residents.',
    monsters: [
      {
        id: 'orc', name: 'Cinder Orc', icon: '👹', level: 48,
        hp: 380, attack: 100, maxHit: 34, defense: 90, attackSpeed: 2600,
        gold: [90, 180], lootProfile: 'elite',
        loot: {
          common:   [{ item: 'steel_bar', qty: [1, 2] }, { item: 'herb_voidbloom', qty: 1 }],
          uncommon: [{ item: 'mythril_ore', qty: [1, 2] }, { item: 'coal', qty: [3, 5] }],
          rare:     [{ item: 'ember_amulet', qty: 1 }, { item: 'mythril_bar', qty: 1 }],
          epic:     [{ item: 'tome_execute', qty: 1 }, { item: 'mythril_helmet', qty: 1 }],
          legendary:[{ item: 'tome_flurry', qty: 1 }, { item: 'tome_second_wind', qty: 1 }],
        },
      },
      {
        id: 'golem', name: 'Basalt Golem', icon: '🗿', level: 56,
        hp: 550, attack: 110, maxHit: 40, defense: 160, attackSpeed: 3400,
        gold: [130, 260], lootProfile: 'elite',
        loot: {
          common:   [{ item: 'mythril_ore', qty: [2, 3] }, { item: 'coal', qty: [4, 6] }],
          uncommon: [{ item: 'mythril_bar', qty: 1 }, { item: 'herb_voidbloom', qty: [1, 2] }],
          rare:     [{ item: 'golem_core_ring', qty: 1 }, { item: 'greater_rune', qty: [3, 5] }],
          epic:     [{ item: 'tome_iron_stance', qty: 1 }, { item: 'mythril_chest', qty: 1 }],
          legendary:[{ item: 'tome_bloodletter', qty: 1 }, { item: 'tome_firebomb', qty: 1 }],
        },
      },
      {
        id: 'wyvern', name: 'Storm Wyvern', icon: '🐉', level: 64,
        hp: 720, attack: 140, maxHit: 48, defense: 130, attackSpeed: 2400,
        gold: [180, 350], lootProfile: 'elite',
        loot: {
          common:   [{ item: 'runite_ore', qty: 1 }, { item: 'herb_voidbloom', qty: [2, 3] }],
          uncommon: [{ item: 'mythril_bar', qty: [1, 2] }, { item: 'raw_leviathan', qty: 1 }],
          rare:     [{ item: 'stormcaller_amulet', qty: 1 }, { item: 'void_rune', qty: 1 }],
          epic:     [{ item: 'tome_execute', qty: 1 }, { item: 'mythril_weapon', qty: 1 }],
          legendary:[{ item: 'tome_aegis', qty: 1 }, { item: 'tome_firebomb', qty: 1 }],
        },
      },
    ],
  },
  {
    id: 'dragonspire', name: 'The Dragonspire', icon: '🏔️', level: 70,
    desc: 'The top of the world, claimed by something ancient. The System itself seems to hold its breath here.',
    monsters: [
      {
        id: 'drake', name: 'Spire Drake', icon: '🐲', level: 74,
        hp: 1100, attack: 190, maxHit: 60, defense: 200, attackSpeed: 2600,
        gold: [300, 600], lootProfile: 'elite',
        loot: {
          common:   [{ item: 'raw_leviathan', qty: [1, 2] }, { item: 'herb_kingsleaf', qty: 1 }],
          uncommon: [{ item: 'runite_ore', qty: [1, 2] }, { item: 'runite_bar', qty: 1 }],
          rare:     [{ item: 'void_rune', qty: [1, 2] }, { item: 'runite_helmet', qty: 1 }],
          epic:     [{ item: 'runite_legs', qty: 1 }, { item: 'tome_firebomb', qty: 1 }],
          legendary:[{ item: 'tome_spirit_lantern', qty: 1 }, { item: 'tome_rune_of_return', qty: 1 }],
        },
      },
      {
        id: 'knight', name: 'Fallen Dragonknight', icon: '🛡️', level: 82,
        hp: 1500, attack: 230, maxHit: 70, defense: 280, attackSpeed: 2800,
        gold: [420, 800], lootProfile: 'boss',
        loot: {
          common:   [{ item: 'runite_bar', qty: [1, 2] }, { item: 'herb_kingsleaf', qty: [1, 2] }],
          uncommon: [{ item: 'runite_ore', qty: [2, 3] }, { item: 'raw_leviathan', qty: [2, 3] }],
          rare:     [{ item: 'runite_chest', qty: 1 }, { item: 'void_rune', qty: [2, 3] }],
          epic:     [{ item: 'tome_hollow_point', qty: 1 }, { item: 'runite_weapon', qty: 1 }, { item: 'tome_execute', qty: 1 }],
          legendary:[{ item: 'tome_unmaking', qty: 1 }, { item: 'tome_rune_of_return', qty: 1 }],
        },
      },
      {
        id: 'aurelion', name: 'Aurelion, the Last Flame', icon: '🐉', level: 95,
        hp: 3200, attack: 300, maxHit: 95, defense: 350, attackSpeed: 3000, boss: true,
        gold: [1500, 3000], lootProfile: 'boss',
        loot: {
          common:   [{ item: 'runite_bar', qty: [2, 4] }, { item: 'herb_kingsleaf', qty: [2, 3] }],
          uncommon: [{ item: 'void_rune', qty: [1, 2] }, { item: 'runite_ore', qty: [3, 5] }],
          rare:     [{ item: 'runite_weapon', qty: 1 }, { item: 'void_rune', qty: [3, 4] }],
          epic:     [{ item: 'tome_last_word', qty: 1 }, { item: 'runite_chest', qty: 1 }, { item: 'tome_rune_of_return', qty: 1 }],
          legendary:[{ item: 'tome_unyielding', qty: 1 }, { item: 'wyrmslayer_blade', qty: 1 }, { item: 'dragonhide_cloak', qty: 1 }],
        },
      },
    ],
  },

  // ------------------------------------------------------------
  // ERA II. Not a place so much as wherever they have parked. The zone
  // only appears once the Syndicate is holding something of yours, and
  // every kill here counts toward getting it back.
  // ------------------------------------------------------------
  {
    id: 'repo_camp', name: 'A Syndicate Camp', level: 60, era: 2,
    desc: 'A ring of crates and a folding table, somewhere out in the grey. Your property is in one of the crates. The reference number is on the lid.',
    monsters: [
      { id: 'repo_clerk', name: 'Syndicate Clerk', icon: '📋', level: 62,
        hp: 900, defense: 150, attack: 62, attackSpeed: 2500, gold: [400, 900],
        loot: [{ item: 'scrap_code', qty: [2, 6], chance: 0.6 }, { item: 'orphaned_shard', qty: [1, 2], chance: 0.3 }] },
      { id: 'repo_bailiff', name: 'Syndicate Bailiff', icon: '🛡️', level: 72,
        hp: 1500, defense: 230, attack: 88, attackSpeed: 2700, gold: [900, 1800],
        loot: [{ item: 'glitched_ore', qty: [2, 6], chance: 0.5 }, { item: 'deprecated_asset', qty: [1, 1], chance: 0.12 }] },
      { id: 'repo_auditor', name: 'Armoured Auditor', icon: '📄', level: 84, boss: true,
        hp: 3400, defense: 330, attack: 118, attackSpeed: 2900, gold: [3000, 6500],
        // The Ledger of Debts belongs to the people who invented the debt.
        loot: [{ item: 'corrupt_sigil', qty: [1, 3], chance: 0.5 }, { item: 'deprecated_asset', qty: [1, 3], chance: 0.4 },
               { item: 'tome_ledger_of_debts', qty: 1, chance: 0.06 }] },
    ],
  },
];

export function getZone(zoneId) { return ZONES.find(z => z.id === zoneId); }
export function getMonster(zoneId, monsterId) {
  return getZone(zoneId)?.monsters.find(m => m.id === monsterId);
}
