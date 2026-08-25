// ============================================================
// RIFTS — wave-based dungeons.
// Lore: seams in the cropped world where the loop wears thin.
// Clear every wave + the boss for a chest: gold, runes, and a
// shot at rift-exclusive uniques. Death ends the run.
// ============================================================

export const DUNGEONS = [
  {
    id: 'warrens', name: 'The Warrens Below', icon: '🕳️', level: 5,
    desc: 'A rift under the meadow. The rats down here are organized. They have a king. They have opinions about you.',
    waves: [
      { name: 'Warren Rat', icon: '🐀', hp: 20, attack: 8, maxHit: 3, defense: 4, attackSpeed: 2600, gold: [2, 6] },
      { name: 'Warren Rat', icon: '🐀', hp: 24, attack: 10, maxHit: 4, defense: 6, attackSpeed: 2600, gold: [3, 7] },
      { name: 'Tunnel Guard', icon: '🐀', hp: 34, attack: 14, maxHit: 5, defense: 10, attackSpeed: 2800, gold: [4, 9] },
      { name: 'Plague Biter', icon: '🐀', hp: 40, attack: 18, maxHit: 6, defense: 12, attackSpeed: 2400, gold: [5, 11] },
      { name: 'Royal Ratguard', icon: '⚔️', hp: 55, attack: 24, maxHit: 8, defense: 18, attackSpeed: 2800, gold: [8, 16] },
    ],
    boss: { name: 'The Rat King', icon: '👑', hp: 130, attack: 34, maxHit: 11, defense: 26, attackSpeed: 3000, gold: [40, 80], boss: true },
    rewards: {
      gold: [60, 120],
      runes: { rune_shard: [2, 4] },
      uniques: [{ item: 'rat_king_crown', chance: 0.08 }],
    },
  },
  {
    id: 'crypt', name: 'The Sunken Crypt', icon: '⚰️', level: 25,
    desc: 'The dead here were buried facing the Spire. Something keeps turning them back over.',
    waves: [
      { name: 'Drowned Shambler', icon: '🧟', hp: 90, attack: 40, maxHit: 13, defense: 30, attackSpeed: 2800, gold: [12, 25] },
      { name: 'Drowned Shambler', icon: '🧟', hp: 105, attack: 46, maxHit: 15, defense: 36, attackSpeed: 2800, gold: [14, 28] },
      { name: 'Crypt Wraith', icon: '👻', hp: 120, attack: 58, maxHit: 18, defense: 40, attackSpeed: 2300, gold: [18, 34] },
      { name: 'Bone Choir', icon: '💀', hp: 150, attack: 62, maxHit: 20, defense: 55, attackSpeed: 2600, gold: [22, 40] },
      { name: 'Reliquary Golem', icon: '🗿', hp: 210, attack: 66, maxHit: 24, defense: 85, attackSpeed: 3400, gold: [28, 52] },
      { name: 'Crypt Wraith', icon: '👻', hp: 160, attack: 74, maxHit: 24, defense: 55, attackSpeed: 2300, gold: [24, 44] },
    ],
    boss: { name: 'The Grave Warden', icon: '🪦', hp: 520, attack: 95, maxHit: 32, defense: 110, attackSpeed: 3000, gold: [150, 300], boss: true },
    rewards: {
      gold: [250, 500],
      runes: { rune_shard: [4, 7], greater_rune: [0, 1] },
      uniques: [{ item: 'warden_ring', chance: 0.07 }],
    },
  },
  {
    id: 'molten_hold', name: 'The Molten Hold', icon: '🌋', level: 45,
    desc: 'A forge older than the mountain around it. The anvils still ring. Nobody is swinging the hammers.',
    waves: [
      { name: 'Cinder Whelp', icon: '🔥', hp: 240, attack: 95, maxHit: 30, defense: 80, attackSpeed: 2400, gold: [40, 80] },
      { name: 'Slag Hound', icon: '🐕', hp: 280, attack: 110, maxHit: 35, defense: 95, attackSpeed: 2200, gold: [48, 92] },
      { name: 'Forge Sentinel', icon: '🛡️', hp: 380, attack: 105, maxHit: 38, defense: 150, attackSpeed: 3200, gold: [60, 110] },
      { name: 'Magma Shade', icon: '👤', hp: 320, attack: 135, maxHit: 44, defense: 105, attackSpeed: 2400, gold: [66, 120] },
      { name: 'Anvil Wraith', icon: '⚒️', hp: 420, attack: 130, maxHit: 46, defense: 160, attackSpeed: 2800, gold: [75, 140] },
      { name: 'Forge Sentinel', icon: '🛡️', hp: 430, attack: 125, maxHit: 44, defense: 170, attackSpeed: 3200, gold: [70, 130] },
      { name: 'Ember Colossus', icon: '🗿', hp: 560, attack: 140, maxHit: 52, defense: 200, attackSpeed: 3600, gold: [90, 170] },
    ],
    boss: { name: 'Forgemaster Vulkan', icon: '🔨', hp: 1500, attack: 190, maxHit: 62, defense: 240, attackSpeed: 3000, gold: [500, 900], boss: true },
    rewards: {
      gold: [800, 1500],
      runes: { greater_rune: [2, 4], rune_shard: [3, 6] },
      uniques: [{ item: 'vulkan_hammer', chance: 0.05 }, { item: 'molten_greaves', chance: 0.07 }],
    },
  },
  {
    id: 'seam', name: 'The Seam', icon: '🌀', level: 70,
    desc: 'The place where the horizon\'s bad stitching comes apart. The things in here aren\'t from the world — they\'re from whatever the world was cropped out of. [ SYSTEM ] Entry logged. Good luck. Sincerely.',
    waves: [
      { name: 'Unrendered Thing', icon: '⬜', hp: 700, attack: 210, maxHit: 60, defense: 220, attackSpeed: 2600, gold: [150, 300] },
      { name: 'Static Hound', icon: '📶', hp: 780, attack: 240, maxHit: 68, defense: 240, attackSpeed: 2200, gold: [170, 330] },
      { name: 'Border Warden', icon: '🚫', hp: 950, attack: 250, maxHit: 74, defense: 300, attackSpeed: 3000, gold: [200, 380] },
      { name: 'Memory Leak', icon: '💧', hp: 850, attack: 275, maxHit: 80, defense: 260, attackSpeed: 2400, gold: [210, 400] },
      { name: 'Deprecated Angel', icon: '👼', hp: 1100, attack: 290, maxHit: 88, defense: 330, attackSpeed: 2800, gold: [250, 480] },
      { name: 'Unrendered Thing', icon: '⬜', hp: 1000, attack: 300, maxHit: 90, defense: 300, attackSpeed: 2600, gold: [240, 460] },
      { name: 'Null Choir', icon: '🕳️', hp: 1300, attack: 310, maxHit: 96, defense: 360, attackSpeed: 3000, gold: [280, 540] },
      { name: 'Border Warden', icon: '🚫', hp: 1250, attack: 320, maxHit: 98, defense: 380, attackSpeed: 3000, gold: [280, 540] },
    ],
    boss: { name: 'The Unwritten', icon: '📃', hp: 4200, attack: 380, maxHit: 120, defense: 420, attackSpeed: 3200, gold: [2000, 4000], boss: true },
    rewards: {
      gold: [3000, 6000],
      runes: { void_rune: [1, 3], greater_rune: [2, 5] },
      uniques: [{ item: 'unwritten_edge', chance: 0.04 }, { item: 'seam_cloak', chance: 0.04 }],
    },
  },
];

export function getDungeon(id) { return DUNGEONS.find(d => d.id === id); }

// Monster for the current wave (waves.length === boss wave index)
export function waveMonster(dungeon, wave) {
  return wave >= dungeon.waves.length ? dungeon.boss : dungeon.waves[wave];
}

export function totalWaves(dungeon) { return dungeon.waves.length + 1; }
