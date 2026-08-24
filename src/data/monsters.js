// ============================================================
// COMBAT ZONES & MONSTERS
// Monster: hp, attack (accuracy), maxHit, defense, attackSpeed(ms),
//          gold [min,max], xp bonus, loot table [{item, chance, qty}]
// Zones unlock by combat level (avg of atk/str/def/hp).
// ============================================================

export const ZONES = [
  {
    id: 'meadow', name: 'Sunlit Meadow', icon: '🌾', level: 1,
    desc: 'Rolling fields at the edge of town. Even the rats here have delusions of grandeur.',
    monsters: [
      { id: 'slime', name: 'Gloopy Slime', icon: '🟢', level: 1, hp: 8, attack: 4, maxHit: 2, defense: 1, attackSpeed: 3000,
        gold: [1, 4], loot: [] },
      { id: 'rat', name: 'Whisker Bandit', icon: '🐀', level: 3, hp: 18, attack: 7, maxHit: 3, defense: 3, attackSpeed: 2800,
        gold: [2, 6], loot: [{ item: 'raw_shrimp', chance: 0.15, qty: 1 }] },
      { id: 'boar', name: 'Tusked Boar', icon: '🐗', level: 6, hp: 35, attack: 12, maxHit: 5, defense: 8, attackSpeed: 3200,
        gold: [4, 10], loot: [{ item: 'raw_trout', chance: 0.12, qty: 1 }] },
    ],
  },
  {
    id: 'forest', name: 'Gloomroot Forest', icon: '🌲', level: 8,
    desc: 'The canopy swallows the sun. Things with too many teeth wait between the trees.',
    monsters: [
      { id: 'goblin', name: 'Goblin Skirmisher', icon: '👺', level: 9, hp: 50, attack: 18, maxHit: 7, defense: 12, attackSpeed: 2600,
        gold: [8, 18], loot: [{ item: 'bronze_helmet', chance: 0.04, qty: 1 }, { item: 'copper_ore', chance: 0.2, qty: 2 }] },
      { id: 'wolf', name: 'Duskfang Wolf', icon: '🐺', level: 13, hp: 70, attack: 26, maxHit: 10, defense: 16, attackSpeed: 2400,
        gold: [12, 26], loot: [{ item: 'wolf_fang_charm', chance: 0.03, qty: 1 }] },
      { id: 'ent', name: 'Rotbark Ent', icon: '🌳', level: 18, hp: 120, attack: 30, maxHit: 13, defense: 30, attackSpeed: 3600,
        gold: [18, 40], loot: [{ item: 'willow_log', chance: 0.35, qty: 3 }, { item: 'maple_log', chance: 0.15, qty: 2 }] },
  ],
  },
  {
    id: 'caves', name: 'Hollowdeep Caves', icon: '🕳️', level: 22,
    desc: 'Bones crunch underfoot. Your torchlight is a dinner bell.',
    monsters: [
      { id: 'bat', name: 'Shriekwing', icon: '🦇', level: 24, hp: 130, attack: 44, maxHit: 16, defense: 28, attackSpeed: 2200,
        gold: [25, 55], loot: [] },
      { id: 'skeleton', name: 'Restless Skeleton', icon: '💀', level: 30, hp: 180, attack: 55, maxHit: 20, defense: 45, attackSpeed: 2800,
        gold: [35, 75], loot: [{ item: 'bone_ring', chance: 0.035, qty: 1 }, { item: 'iron_bar', chance: 0.12, qty: 1 }] },
      { id: 'spider', name: 'Broodmother', icon: '🕷️', level: 38, hp: 260, attack: 70, maxHit: 26, defense: 60, attackSpeed: 2500,
        gold: [50, 110], loot: [{ item: 'spider_silk_band', chance: 0.025, qty: 1 }, { item: 'raw_lobster', chance: 0.15, qty: 2 }] },
    ],
  },
  {
    id: 'peaks', name: 'Cindershard Peaks', icon: '🌋', level: 45,
    desc: 'The mountain smokes and grumbles. So do its residents.',
    monsters: [
      { id: 'orc', name: 'Cinder Orc', icon: '👹', level: 48, hp: 380, attack: 100, maxHit: 34, defense: 90, attackSpeed: 2600,
        gold: [90, 180], loot: [{ item: 'ember_amulet', chance: 0.03, qty: 1 }, { item: 'steel_bar', chance: 0.1, qty: 2 }] },
      { id: 'golem', name: 'Basalt Golem', icon: '🗿', level: 56, hp: 550, attack: 110, maxHit: 40, defense: 160, attackSpeed: 3400,
        gold: [130, 260], loot: [{ item: 'golem_core_ring', chance: 0.02, qty: 1 }, { item: 'mythril_ore', chance: 0.18, qty: 2 }] },
      { id: 'wyvern', name: 'Storm Wyvern', icon: '🐉', level: 64, hp: 720, attack: 140, maxHit: 48, defense: 130, attackSpeed: 2400,
        gold: [180, 350], loot: [{ item: 'stormcaller_amulet', chance: 0.02, qty: 1 }, { item: 'runite_ore', chance: 0.12, qty: 1 }] },
    ],
  },
  {
    id: 'dragonspire', name: 'The Dragonspire', icon: '🏔️', level: 70,
    desc: 'The top of the world, claimed by something ancient. The System itself seems to hold its breath here.',
    monsters: [
      { id: 'drake', name: 'Spire Drake', icon: '🐲', level: 74, hp: 1100, attack: 190, maxHit: 60, defense: 200, attackSpeed: 2600,
        gold: [300, 600], loot: [{ item: 'runite_bar', chance: 0.1, qty: 1 }, { item: 'raw_leviathan', chance: 0.15, qty: 2 }] },
      { id: 'knight', name: 'Fallen Dragonknight', icon: '🛡️', level: 82, hp: 1500, attack: 230, maxHit: 70, defense: 280, attackSpeed: 2800,
        gold: [420, 800], loot: [{ item: 'runite_weapon', chance: 0.03, qty: 1 }, { item: 'runite_chest', chance: 0.02, qty: 1 }] },
      { id: 'aurelion', name: 'Aurelion, the Last Flame', icon: '🐉', level: 95, hp: 3200, attack: 300, maxHit: 95, defense: 350, attackSpeed: 3000, boss: true,
        gold: [1500, 3000], loot: [{ item: 'wyrmslayer_blade', chance: 0.05, qty: 1 }, { item: 'dragonhide_cloak', chance: 0.05, qty: 1 }, { item: 'runite_bar', chance: 0.5, qty: 3 }] },
    ],
  },
];

export function getZone(zoneId) { return ZONES.find(z => z.id === zoneId); }
export function getMonster(zoneId, monsterId) {
  return getZone(zoneId)?.monsters.find(m => m.id === monsterId);
}
