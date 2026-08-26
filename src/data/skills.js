// ============================================================
// SKILL & ACTION DEFINITIONS
// Gathering: produce items from nothing.
// Crafting: consume inputs, produce outputs.
// Combat skills (attack/strength/defense/hitpoints) train in combat.
// baseTime in ms; xp per completed action.
// ============================================================

export const SKILLS = {
  woodcutting: {
    id: 'woodcutting', name: 'Woodcutting', icon: '🪓', kind: 'gathering',
    desc: 'Fell trees for logs. Logs sell for gold — the forest is your first paycheck.',
    actions: [
      { id: 'oak',    name: 'Oak Tree',       icon: '🌳', level: 1,  baseTime: 3000, xp: 10,  output: { oak_log: 1 } },
      { id: 'willow', name: 'Willow Tree',    icon: '🌳', level: 10, baseTime: 4000, xp: 22,  output: { willow_log: 1 } },
      { id: 'maple',  name: 'Maple Tree',     icon: '🍁', level: 25, baseTime: 5000, xp: 48,  output: { maple_log: 1 } },
      { id: 'yew',    name: 'Yew Tree',       icon: '🌲', level: 45, baseTime: 7000, xp: 110, output: { yew_log: 1 } },
      { id: 'elder',  name: 'Elderwood Tree', icon: '🌳', level: 65, baseTime: 9000, xp: 250, output: { elder_log: 1 } },
    ],
  },
  mining: {
    id: 'mining', name: 'Mining', icon: '⛏️', kind: 'gathering',
    desc: 'Crack open the earth for ore. Feeds the forge — and your coin purse.',
    actions: [
      { id: 'copper',  name: 'Copper Vein',   icon: '🪨', level: 1,  baseTime: 3200, xp: 11,  output: { copper_ore: 1 } },
      { id: 'iron',    name: 'Iron Vein',     icon: '🪨', level: 10, baseTime: 4200, xp: 24,  output: { iron_ore: 1 } },
      { id: 'coal',    name: 'Coal Seam',     icon: '⚫', level: 20, baseTime: 4800, xp: 40,  output: { coal: 1 } },
      { id: 'mythril', name: 'Mythril Vein',  icon: '💎', level: 40, baseTime: 7500, xp: 105, output: { mythril_ore: 1 } },
      { id: 'runite',  name: 'Runite Deposit', icon: '🔷', level: 60, baseTime: 10000, xp: 240, output: { runite_ore: 1 } },
    ],
  },
  fishing: {
    id: 'fishing', name: 'Fishing', icon: '🎣', kind: 'gathering',
    desc: 'Patience and a sharp hook. Raw catches become combat rations at the cookfire.',
    actions: [
      { id: 'shrimp',   name: 'Shrimp Shallows', icon: '🦐', level: 1,  baseTime: 2800, xp: 9,   output: { raw_shrimp: 1 } },
      { id: 'trout',    name: 'River Trout',     icon: '🐟', level: 12, baseTime: 4000, xp: 25,  output: { raw_trout: 1 } },
      { id: 'salmon',   name: 'Salmon Run',      icon: '🐟', level: 28, baseTime: 5200, xp: 52,  output: { raw_salmon: 1 } },
      { id: 'lobster',  name: 'Lobster Pots',    icon: '🦞', level: 42, baseTime: 6800, xp: 100, output: { raw_lobster: 1 } },
      { id: 'leviathan', name: 'Leviathan Deep', icon: '🐋', level: 62, baseTime: 9500, xp: 230, output: { raw_leviathan: 1 } },
    ],
  },
  smithing: {
    id: 'smithing', name: 'Smithing', icon: '🔨', kind: 'crafting',
    desc: 'Smelt ore into bars, hammer bars into steel worth bleeding for.',
    actions: [
      // Smelting
      { id: 'bronze_bar',  name: 'Smelt Bronze',  icon: '🟫', level: 1,  baseTime: 3000, xp: 12,  input: { copper_ore: 2 }, output: { bronze_bar: 1 } },
      { id: 'iron_bar',    name: 'Smelt Iron',    icon: '⬜', level: 12, baseTime: 3800, xp: 28,  input: { iron_ore: 2 }, output: { iron_bar: 1 } },
      { id: 'steel_bar',   name: 'Smelt Steel',   icon: '🔩', level: 25, baseTime: 4600, xp: 55,  input: { iron_ore: 1, coal: 2 }, output: { steel_bar: 1 } },
      { id: 'mythril_bar', name: 'Smelt Mythril', icon: '🟦', level: 45, baseTime: 6500, xp: 120, input: { mythril_ore: 2, coal: 2 }, output: { mythril_bar: 1 } },
      { id: 'runite_bar',  name: 'Smelt Runite',  icon: '🟪', level: 65, baseTime: 9000, xp: 260, input: { runite_ore: 2, coal: 4 }, output: { runite_bar: 1 } },
      // Forging — generated below (one per smithed gear piece)
    ],
  },
  cooking: {
    id: 'cooking', name: 'Cooking', icon: '🍳', kind: 'crafting',
    desc: 'Turn raw catches into food. Food keeps you alive when the monsters hit back.',
    actions: [
      { id: 'shrimp',  name: 'Cook Shrimp',  icon: '🍤', level: 1,  baseTime: 2400, xp: 8,   input: { raw_shrimp: 1 }, output: { shrimp: 1 } },
      { id: 'trout',   name: 'Cook Trout',   icon: '🐟', level: 12, baseTime: 3200, xp: 22,  input: { raw_trout: 1 }, output: { trout: 1 } },
      { id: 'salmon',  name: 'Cook Salmon',  icon: '🍣', level: 28, baseTime: 4000, xp: 46,  input: { raw_salmon: 1 }, output: { salmon: 1 } },
      { id: 'lobster', name: 'Cook Lobster', icon: '🦞', level: 42, baseTime: 5000, xp: 92,  input: { raw_lobster: 1 }, output: { lobster: 1 } },
      { id: 'leviathan_steak', name: 'Sear Leviathan', icon: '🥩', level: 62, baseTime: 7000, xp: 210, input: { raw_leviathan: 1 }, output: { leviathan_steak: 1 } },
      // Farm-fed line. Gives Farming somewhere to go, and gives pets and
      // combat a food ladder that does not depend on Fishing.
      { id: 'bread',      name: 'Bake Bread',       icon: '🍞', level: 5,  baseTime: 3000, xp: 18,
        input: { wheat: 3 }, output: { bread: 1 } },
      { id: 'root_stew',  name: 'Simmer Root Stew', icon: '🍲', level: 18, baseTime: 4000, xp: 40,
        input: { root_veg: 2, wheat: 1 }, output: { root_stew: 1 } },
      { id: 'ember_stew', name: 'Ember Stew',       icon: '🥘', level: 32, baseTime: 5000, xp: 76,
        input: { emberpepper: 2, root_veg: 2 }, output: { ember_stew: 1 } },
      { id: 'gourd_pie',  name: 'Bake Gourd Pie',   icon: '🥧', level: 46, baseTime: 6000, xp: 130,
        input: { moon_gourd: 2, wheat: 2 }, output: { gourd_pie: 1 } },
      { id: 'silk_broth', name: 'Silkleaf Broth',   icon: '🍜', level: 60, baseTime: 7200, xp: 205,
        input: { silkleaf: 2, moon_gourd: 1 }, output: { silk_broth: 1 } },
      { id: 'sunfruit_tart', name: 'Sunfruit Tart', icon: '🥮', level: 76, baseTime: 8800, xp: 330,
        input: { sunfruit: 2, silkleaf: 1 }, output: { sunfruit_tart: 1 } },
    ],
  },
  alchemy: {
    id: 'alchemy', name: 'Alchemy', icon: '⚗️', kind: 'crafting',
    desc: 'Forage strange herbs and brew them into power. The System labels this skill "volatile." It means that as a compliment.',
    actions: [
      // Foraging
      { id: 'sagewort',   name: 'Forage Sagewort',    icon: '🌿', level: 1,  baseTime: 3000, xp: 10,  output: { herb_sagewort: 1 } },
      { id: 'mooncap',    name: 'Forage Mooncap',     icon: '🍄', level: 15, baseTime: 4200, xp: 26,  output: { herb_mooncap: 1 } },
      { id: 'emberpetal', name: 'Forage Emberpetal',  icon: '🌺', level: 30, baseTime: 5500, xp: 56,  output: { herb_emberpetal: 1 } },
      { id: 'voidbloom',  name: 'Forage Voidbloom',   icon: '🥀', level: 50, baseTime: 7500, xp: 125, output: { herb_voidbloom: 1 } },
      { id: 'kingsleaf',  name: "Forage King's Leaf", icon: '☘️', level: 68, baseTime: 9500, xp: 265, output: { herb_kingsleaf: 1 } },
      // Brewing
      { id: 'minor_strength_potion', name: 'Brew Minor Strength', icon: '🧪', level: 5,  baseTime: 3600, xp: 20,
        input: { herb_sagewort: 2 }, output: { minor_strength_potion: 1 } },
      { id: 'sage_elixir', name: 'Brew Sage Elixir', icon: '⚗️', level: 12, baseTime: 4200, xp: 32,
        input: { herb_sagewort: 3 }, output: { sage_elixir: 1 } },
      { id: 'healing_salve', name: 'Mix Healing Salve', icon: '🩹', level: 18, baseTime: 4400, xp: 40,
        input: { herb_sagewort: 2, herb_mooncap: 1 }, output: { healing_salve: 1 } },
      { id: 'stoneskin_tonic', name: 'Brew Stoneskin Tonic', icon: '🫙', level: 25, baseTime: 5000, xp: 55,
        input: { herb_mooncap: 2 }, output: { stoneskin_tonic: 1 } },
      { id: 'haste_tonic', name: 'Brew Haste Tonic', icon: '💨', level: 34, baseTime: 5600, xp: 75,
        input: { herb_mooncap: 2, herb_emberpetal: 1 }, output: { haste_tonic: 1 } },
      { id: 'strength_potion', name: 'Brew Strength Potion', icon: '🧪', level: 42, baseTime: 6400, xp: 105,
        input: { herb_emberpetal: 2 }, output: { strength_potion: 1 } },
      { id: 'lucky_brew', name: 'Brew Lucky Brew', icon: '🍀', level: 52, baseTime: 7200, xp: 150,
        input: { herb_emberpetal: 1, herb_voidbloom: 1 }, output: { lucky_brew: 1 } },
      { id: 'void_draught', name: 'Distill Void Draught', icon: '🌌', level: 66, baseTime: 9000, xp: 280,
        input: { herb_voidbloom: 2, herb_kingsleaf: 1 }, output: { void_draught: 1 } },
    ],
  },

  // ------------------------------------------------------------
  // FARMING — the most idle-native skill in the game. You plant, you
  // leave, it grows on a real clock. Feeds Cooking, Alchemy and the town.
  // ------------------------------------------------------------
  farming: {
    id: 'farming', name: 'Farming', icon: '🌾', kind: 'gathering',
    desc: 'Turn a patch of dirt into something that grows while you are not looking. Feeds the kitchens, the cauldrons and the town.',
    actions: [
      { id: 'wheat',    name: 'Wheat Field',     icon: '🌾', level: 1,  baseTime: 3400, xp: 11,  output: { wheat: 1 } },
      { id: 'roots',    name: 'Root Vegetables', icon: '🥕', level: 8,  baseTime: 4200, xp: 24,  output: { root_veg: 1 } },
      { id: 'pepper',   name: 'Emberpeppers',    icon: '🌶️', level: 20, baseTime: 5200, xp: 46,  output: { emberpepper: 1 } },
      { id: 'gourd',    name: 'Moon Gourds',     icon: '🎃', level: 35, baseTime: 6600, xp: 95,  output: { moon_gourd: 1 } },
      { id: 'silkleaf', name: 'Silkleaf Vines',  icon: '🍃', level: 52, baseTime: 8200, xp: 175, output: { silkleaf: 1 } },
      { id: 'sunfruit', name: 'Sunfruit Orchard',icon: '🍑', level: 70, baseTime: 10000, xp: 300, output: { sunfruit: 1 } },
    ],
  },

  // ------------------------------------------------------------
  // THIEVING — the gold skill. Scales with LUK, which previously did
  // very little outside drop tables.
  // ------------------------------------------------------------
  thieving: {
    id: 'thieving', name: 'Thieving', icon: '🗝️', kind: 'gathering',
    desc: 'Take what is not nailed down. Every point of LUK is a 0.4% chance to come away with twice as much, so this is the one skill where that stat is the whole discipline. Spoils are pure gold: nothing crafts with them and no business will touch them.',
    actions: [
      { id: 'pockets',  name: 'Pick Pockets',     icon: '👛', level: 1,  baseTime: 2600, xp: 12,  output: { cutpurse_coin: 1 } },
      { id: 'stall',    name: 'Rob a Market Stall', icon: '🍎', level: 12, baseTime: 3600, xp: 30, output: { pilfered_goods: 1 } },
      { id: 'chest',    name: 'Crack a Strongbox', icon: '🧰', level: 26, baseTime: 5000, xp: 62,  output: { strongbox_haul: 1 } },
      { id: 'caravan',  name: 'Waylay a Caravan',  icon: '🐎', level: 40, baseTime: 6800, xp: 120, output: { caravan_spoils: 1 } },
      { id: 'vault',    name: 'The Sealed Vault',  icon: '🔐', level: 58, baseTime: 8600, xp: 215, output: { vault_prize: 1 } },
      { id: 'system',   name: 'Pickpocket the System', icon: '⬛', level: 75, baseTime: 11000, xp: 380, output: { stolen_fragment: 1 } },
    ],
  },

  // ------------------------------------------------------------
  // RUNECRAFTING — closes the enchanting loop. Rune shards used to be
  // drop-only, so a player who wanted +5 gear had no way to work toward it.
  // ------------------------------------------------------------
  runecrafting: {
    id: 'runecrafting', name: 'Runecrafting', icon: '🔮', kind: 'crafting',
    desc: 'Grind shards into essence and bind essence into runes. Enchanting and ability tomes stop being a matter of luck.',
    actions: [
      // 4 essence, not 2: at 2 a shard was worth less ground than sold, so
      // the whole point of the skill (turning drop-only shards into a
      // craftable supply) would never have been used.
      { id: 'grind',    name: 'Grind Shards',     icon: '⚱️', level: 1,  baseTime: 3000, xp: 14,
        input: { rune_shard: 1 }, output: { rune_essence: 4 } },
      { id: 'chip',     name: 'Chip Raw Runestone', icon: '🪨', level: 1, baseTime: 3800, xp: 12,
        output: { rune_essence: 1 } },
      { id: 'minor',    name: 'Bind Minor Rune',  icon: '🔹', level: 10, baseTime: 4200, xp: 34,
        input: { rune_essence: 3 }, output: { minor_rune: 1 } },
      { id: 'greater',  name: 'Bind Greater Rune', icon: '🔷', level: 28, baseTime: 5600, xp: 78,
        input: { rune_essence: 5, minor_rune: 1 }, output: { greater_rune: 1 } },
      { id: 'binding',  name: 'Weave Binding Sigil', icon: '🌀', level: 44, baseTime: 7200, xp: 145,
        input: { greater_rune: 2, rune_essence: 6 }, output: { binding_sigil: 1 } },
      { id: 'void',     name: 'Distil Void Rune',  icon: '🌑', level: 62, baseTime: 9200, xp: 265,
        input: { greater_rune: 3, herb_voidbloom: 1 }, output: { void_rune: 1 } },
      { id: 'tome',     name: 'Scribe a Blank Tome', icon: '📕', level: 70, baseTime: 11000, xp: 340,
        input: { binding_sigil: 2, void_rune: 1 }, output: { blank_tome: 1 } },
      // Era II. A corrupt sigil is a rune somebody else bound and abandoned.
      // Ollun says unpicking one is like reading a stranger's handwriting.
      { id: 'decode',   name: 'Unpick a Corrupt Sigil', icon: '🕳️', level: 50, baseTime: 7000, xp: 300,
        input: { corrupt_sigil: 1 }, output: { greater_rune: 4, rune_essence: 10 } },
    ],
  },
  // Combat skills — no actions; trained through combat
  attack:    { id: 'attack',    name: 'Attack',    icon: '⚔️', kind: 'combat', desc: 'Accuracy. Higher Attack means fewer whiffed swings.' },
  strength:  { id: 'strength',  name: 'Strength',  icon: '💪', kind: 'combat', desc: 'Raw power. Raises your max hit.' },
  defense:   { id: 'defense',   name: 'Defense',   icon: '🛡️', kind: 'combat', desc: 'Take less damage. Armor works better on a trained body.' },
  hitpoints: { id: 'hitpoints', name: 'Hitpoints', icon: '❤️', kind: 'combat', desc: 'Your life total. Trains passively as you deal damage.' },
};

// Generate forging recipes from smithed gear
const FORGE_RECIPES = [
  { tier: 'bronze',  bar: 'bronze_bar',  level: 5,  xpBase: 20,  timeBase: 4000 },
  { tier: 'iron',    bar: 'iron_bar',    level: 15, xpBase: 45,  timeBase: 5000 },
  { tier: 'steel',   bar: 'steel_bar',   level: 30, xpBase: 90,  timeBase: 6000 },
  { tier: 'mythril', bar: 'mythril_bar', level: 50, xpBase: 190, timeBase: 8000 },
  { tier: 'runite',  bar: 'runite_bar',  level: 70, xpBase: 400, timeBase: 11000 },
];
const SLOT_BARS = { weapon: 3, helmet: 2, chest: 5, legs: 3, boots: 1 };
const SLOT_ICONS = { weapon: '⚔️', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' };

for (const r of FORGE_RECIPES) {
  for (const [slot, bars] of Object.entries(SLOT_BARS)) {
    SKILLS.smithing.actions.push({
      id: `forge_${r.tier}_${slot}`,
      name: `Forge ${r.tier[0].toUpperCase() + r.tier.slice(1)} ${slot === 'weapon' ? 'Blade' : slot[0].toUpperCase() + slot.slice(1)}`,
      icon: SLOT_ICONS[slot],
      level: r.level,
      baseTime: r.timeBase + bars * 400,
      xp: Math.floor(r.xpBase * (0.6 + bars * 0.25)),
      input: { [r.bar]: bars },
      output: { [`${r.tier}_${slot}`]: 1 },
    });
  }
}

export const SKILL_IDS = Object.keys(SKILLS);
export const TRAINABLE_SKILLS = SKILL_IDS.filter(id => SKILLS[id].actions);
export const COMBAT_SKILLS = ['attack', 'strength', 'defense', 'hitpoints'];

export function getAction(skillId, actionId) {
  return SKILLS[skillId]?.actions?.find(a => a.id === actionId);
}
