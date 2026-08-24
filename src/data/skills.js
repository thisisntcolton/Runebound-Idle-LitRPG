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
