// ============================================================
// ITEM DEFINITIONS
// type: 'resource' | 'food' | 'equipment'
// equipment: slot + stats { atk, str, def, hp }
// rarity: common | uncommon | rare | epic | legendary
// ============================================================

export const ITEMS = {};

function def(item) { ITEMS[item.id] = item; return item; }

// ---------- Gathering resources ----------
def({ id: 'oak_log',    name: 'Oak Log',    icon: '🪵', type: 'resource', rarity: 'common',   sell: 2 });
def({ id: 'willow_log', name: 'Willow Log', icon: '🪵', type: 'resource', rarity: 'common',   sell: 6 });
def({ id: 'maple_log',  name: 'Maple Log',  icon: '🪵', type: 'resource', rarity: 'uncommon', sell: 18 });
def({ id: 'yew_log',    name: 'Yew Log',    icon: '🪵', type: 'resource', rarity: 'rare',     sell: 60 });
def({ id: 'elder_log',  name: 'Elderwood Log', icon: '🪵', type: 'resource', rarity: 'epic', sell: 220 });

def({ id: 'copper_ore',  name: 'Copper Ore',  icon: '🪨', type: 'resource', rarity: 'common',   sell: 3 });
def({ id: 'iron_ore',    name: 'Iron Ore',    icon: '🪨', type: 'resource', rarity: 'common',   sell: 8 });
def({ id: 'coal',        name: 'Coal',        icon: '⚫', type: 'resource', rarity: 'uncommon', sell: 14 });
def({ id: 'mythril_ore', name: 'Mythril Ore', icon: '💎', type: 'resource', rarity: 'rare',     sell: 55 });
def({ id: 'runite_ore',  name: 'Runite Ore',  icon: '🔷', type: 'resource', rarity: 'epic',     sell: 200 });

def({ id: 'raw_shrimp',  name: 'Raw Shrimp',    icon: '🦐', type: 'resource', rarity: 'common',   sell: 2 });
def({ id: 'raw_trout',   name: 'Raw Trout',     icon: '🐟', type: 'resource', rarity: 'common',   sell: 7 });
def({ id: 'raw_salmon',  name: 'Raw Salmon',    icon: '🐟', type: 'resource', rarity: 'uncommon', sell: 16 });
def({ id: 'raw_lobster', name: 'Raw Lobster',   icon: '🦞', type: 'resource', rarity: 'rare',     sell: 50 });
def({ id: 'raw_leviathan', name: 'Leviathan Cut', icon: '🐋', type: 'resource', rarity: 'epic',   sell: 190 });

// ---------- Bars (smithing intermediates) ----------
def({ id: 'bronze_bar',  name: 'Bronze Bar',  icon: '🟫', type: 'resource', rarity: 'common',   sell: 8 });
def({ id: 'iron_bar',    name: 'Iron Bar',    icon: '⬜', type: 'resource', rarity: 'common',   sell: 20 });
def({ id: 'steel_bar',   name: 'Steel Bar',   icon: '🔩', type: 'resource', rarity: 'uncommon', sell: 45 });
def({ id: 'mythril_bar', name: 'Mythril Bar', icon: '🟦', type: 'resource', rarity: 'rare',     sell: 155 });
def({ id: 'runite_bar',  name: 'Runite Bar',  icon: '🟪', type: 'resource', rarity: 'epic',     sell: 480 });

// ---------- Food (cooking outputs) ----------
def({ id: 'shrimp',  name: 'Cooked Shrimp',   icon: '🍤', type: 'food', rarity: 'common',   sell: 5,   heal: 8 });
def({ id: 'trout',   name: 'Cooked Trout',    icon: '🐟', type: 'food', rarity: 'common',   sell: 14,  heal: 20 });
def({ id: 'salmon',  name: 'Cooked Salmon',   icon: '🍣', type: 'food', rarity: 'uncommon', sell: 30,  heal: 38 });
def({ id: 'lobster', name: 'Cooked Lobster',  icon: '🦞', type: 'food', rarity: 'rare',     sell: 90,  heal: 70 });
def({ id: 'leviathan_steak', name: 'Leviathan Steak', icon: '🥩', type: 'food', rarity: 'epic', sell: 320, heal: 150 });
// Farm-fed cooking. Slightly better heal-per-gold than the fish line,
// because it takes two skills to make instead of one.
def({ id: 'bread',        name: 'Fresh Bread',    icon: '🍞', type: 'food', rarity: 'common',   sell: 11,  heal: 16 });
def({ id: 'root_stew',    name: 'Root Stew',      icon: '🍲', type: 'food', rarity: 'common',   sell: 34,  heal: 44 });

// ============================================================
// THE GOOD STUFF
//
// Food used to be one number: how much health it gives back. That made
// Cooking a supply chain for combat and nothing else, and it meant the
// top of the skill was a slightly bigger number than the middle of it.
//
// These are meals. They still heal — generously — but each also carries a
// timed buff, so a cook is doing something for the party rather than
// restocking a first-aid kit. `effects` and `duration` are read by the
// same buff machinery potions use, so nothing new had to be invented and
// nothing can drift out of step with it.
// ============================================================
def({ id: 'hearth_pie',   name: 'Hearthwick Pie',  icon: '🥧', type: 'food', rarity: 'rare', sell: 260, heal: 95,
      duration: 600, effects: { xp: 0.08 },
      blurb: 'Whatever was in the larder, under a lid. It is always slightly different and always right.' });
def({ id: 'anglers_broth', name: "Angler's Broth", icon: '🍜', type: 'food', rarity: 'rare', sell: 340, heal: 120,
      duration: 600, effects: { speed: 0.07 },
      blurb: 'Hemlock will not give up the recipe. He will, however, give up a bowl.' });
def({ id: 'coalfire_roast', name: 'Coalfire Roast', icon: '🍖', type: 'food', rarity: 'rare', sell: 420, heal: 145,
      duration: 600, effects: { damage: 0.09 },
      blurb: 'Cooked directly on the forge. Vera insists this is the correct way and nobody argues with Vera.' });
def({ id: 'gilded_platter', name: 'Gilded Platter', icon: '🍱', type: 'food', rarity: 'epic', sell: 1500, heal: 230,
      duration: 900, effects: { gold: 0.15, dropRate: 0.10 },
      blurb: 'Presented rather than served. You feel briefly and unaccountably wealthy.' });
def({ id: 'wardens_table', name: "The Warden's Table", icon: '🫕', type: 'food', rarity: 'epic', sell: 2200, heal: 320,
      duration: 900, effects: { reduction: 0.12, damage: 0.06 },
      blurb: 'A pot that has never once been emptied, only added to. Nobody knows how old the bottom is.' });
def({ id: 'last_supper',  name: 'Last Supper',      icon: '🍽️', type: 'food', rarity: 'legendary', sell: 9000, heal: 600,
      duration: 1200, effects: { damage: 0.14, xp: 0.14, gold: 0.14, reduction: 0.08 },
      blurb: 'Made once, eaten once, remembered for a very long time. The name is Bumblewort\'s idea of a joke.' });
def({ id: 'ember_stew',   name: 'Ember Stew',     icon: '🥘', type: 'food', rarity: 'uncommon', sell: 88,  heal: 82 });
def({ id: 'gourd_pie',    name: 'Moon Gourd Pie', icon: '🥧', type: 'food', rarity: 'rare',     sell: 195, heal: 130 });
def({ id: 'silk_broth',   name: 'Silkleaf Broth', icon: '🍜', type: 'food', rarity: 'rare',     sell: 420, heal: 205 });
def({ id: 'sunfruit_tart',name: 'Sunfruit Tart',  icon: '🥮', type: 'food', rarity: 'epic',     sell: 880, heal: 320 });

// ---------- Smithed equipment (5 tiers x 5 slots) ----------
const TIERS = [
  { key: 'bronze',  name: 'Bronze',  rarity: 'common',   mult: 1,  sellBase: 15,   icon: { weapon: '🗡️', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
  { key: 'iron',    name: 'Iron',    rarity: 'common',   mult: 2,  sellBase: 45,   icon: { weapon: '🗡️', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
  { key: 'steel',   name: 'Steel',   rarity: 'uncommon', mult: 4,  sellBase: 120,  icon: { weapon: '⚔️', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
  { key: 'mythril', name: 'Mythril', rarity: 'rare',     mult: 8,  sellBase: 400,  icon: { weapon: '⚔️', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
  { key: 'runite',  name: 'Runic',   rarity: 'epic',     mult: 16, sellBase: 1400, icon: { weapon: '🔱', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
  // The second hundred. Two more tiers, forged from bars that only exist
  // once the ceiling comes off. The multiplier jump is large on purpose:
  // Runic gear carried a player from level 70 to the end of Era I, and
  // the Descent's fortieth floor needs something Runic cannot do.
  { key: 'adamant', name: 'Adamant', rarity: 'epic',     mult: 30, sellBase: 9000, icon: { weapon: '⚔️', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
  { key: 'starfall',name: 'Starfall',rarity: 'legendary',mult: 58, sellBase: 130000, icon: { weapon: '🗡️', helmet: '👑', chest: '🦺', legs: '👖', boots: '🥾' } },
];

const SLOT_STATS = {
  weapon: t => ({ atk: 4 * t, str: 5 * t }),
  helmet: t => ({ def: 2 * t, hp: 2 * t }),
  chest:  t => ({ def: 4 * t, hp: 4 * t }),
  legs:   t => ({ def: 3 * t, hp: 2 * t }),
  boots:  t => ({ def: 1 * t, hp: 1 * t, atk: 1 * t }),
};

export const SMITHED_GEAR = [];
for (const tier of TIERS) {
  for (const slot of ['weapon', 'helmet', 'chest', 'legs', 'boots']) {
    const item = def({
      id: `${tier.key}_${slot}`,
      name: `${tier.name} ${slot === 'weapon' ? 'Blade' : slot[0].toUpperCase() + slot.slice(1)}`,
      icon: tier.icon[slot],
      type: 'equipment',
      slot,
      rarity: tier.rarity,
      tier: tier.key,
      sell: Math.floor(tier.sellBase * (slot === 'weapon' ? 1.4 : slot === 'chest' ? 1.2 : 1)),
      stats: SLOT_STATS[slot](tier.mult),
    });
    SMITHED_GEAR.push(item);
  }
}

// ---------- Herbs (alchemy foraging) ----------
def({ id: 'herb_sagewort',   name: 'Sagewort',     icon: '🌿', type: 'resource', rarity: 'common',   sell: 3 });
def({ id: 'herb_mooncap',    name: 'Mooncap',      icon: '🍄', type: 'resource', rarity: 'common',   sell: 9 });
def({ id: 'herb_emberpetal', name: 'Emberpetal',   icon: '🌺', type: 'resource', rarity: 'uncommon', sell: 22 });
def({ id: 'herb_voidbloom',  name: 'Voidbloom',    icon: '🥀', type: 'resource', rarity: 'rare',     sell: 70 });
def({ id: 'herb_kingsleaf',  name: "King's Leaf",  icon: '☘️', type: 'resource', rarity: 'epic',     sell: 240 });

// ---------- Potions (alchemy brews) — timed buffs, 10 min each ----------
// effects keys: damage, xp, gold, speed, dropRate, reduction
def({ id: 'minor_strength_potion', name: 'Minor Strength Potion', icon: '🧪', type: 'potion', rarity: 'common',
      sell: 15, duration: 600, effects: { damage: 0.10 } });
def({ id: 'sage_elixir', name: 'Sage Elixir', icon: '⚗️', type: 'potion', rarity: 'common',
      sell: 35, duration: 600, effects: { xp: 0.15 } });
def({ id: 'stoneskin_tonic', name: 'Stoneskin Tonic', icon: '🫙', type: 'potion', rarity: 'uncommon',
      sell: 50, duration: 600, effects: { reduction: 0.10 } });
def({ id: 'haste_tonic', name: 'Haste Tonic', icon: '💨', type: 'potion', rarity: 'uncommon',
      sell: 70, duration: 600, effects: { speed: 0.10 } });
def({ id: 'strength_potion', name: 'Strength Potion', icon: '🧪', type: 'potion', rarity: 'rare',
      sell: 120, duration: 600, effects: { damage: 0.25 } });
def({ id: 'lucky_brew', name: 'Lucky Brew', icon: '🍀', type: 'potion', rarity: 'rare',
      sell: 160, duration: 600, effects: { gold: 0.20, dropRate: 0.25 } });
def({ id: 'void_draught', name: 'Void Draught', icon: '🌌', type: 'potion', rarity: 'epic',
      sell: 500, duration: 600, effects: { damage: 0.20, xp: 0.20, speed: 0.05 } });
def({ id: 'healing_salve', name: 'Healing Salve', icon: '🩹', type: 'food', rarity: 'uncommon',
      sell: 60, heal: 55 });

// ---------- Runes (rift rewards — fuel for enchanting) ----------
def({ id: 'rune_shard',   name: 'Rune Shard',   icon: '🔹', type: 'resource', rarity: 'uncommon', sell: 40 });
def({ id: 'greater_rune', name: 'Greater Rune', icon: '🔷', type: 'resource', rarity: 'rare',     sell: 180 });
def({ id: 'void_rune',    name: 'Void Rune',    icon: '💠', type: 'resource', rarity: 'epic',     sell: 900 });

// ---------- Rift-exclusive uniques ----------
def({ id: 'rat_king_crown', name: "Rat King's Crown", icon: '👑', type: 'equipment', slot: 'helmet', rarity: 'rare',
      sell: 900, stats: { def: 8, hp: 10, str: 4 } });
def({ id: 'warden_ring', name: "Grave Warden's Band", icon: '💍', type: 'equipment', slot: 'ring', rarity: 'rare',
      sell: 1200, stats: { def: 8, hp: 12 } });
def({ id: 'vulkan_hammer', name: "Vulkan's Forgehammer", icon: '🔨', type: 'equipment', slot: 'weapon', rarity: 'epic',
      sell: 5000, stats: { atk: 40, str: 55 } });
def({ id: 'molten_greaves', name: 'Molten Greaves', icon: '👢', type: 'equipment', slot: 'boots', rarity: 'epic',
      sell: 3800, stats: { def: 18, hp: 14, str: 8 } });
def({ id: 'unwritten_edge', name: 'The Unwritten Edge', icon: '🗡️', type: 'equipment', slot: 'weapon', rarity: 'legendary',
      sell: 20000, stats: { atk: 110, str: 130 } });
def({ id: 'seam_cloak', name: 'Cloak of the Seam', icon: '🧥', type: 'equipment', slot: 'chest', rarity: 'legendary',
      sell: 17000, stats: { def: 95, hp: 110 } });

// ---------- Monster-drop uniques ----------
def({ id: 'wolf_fang_charm', name: 'Wolf Fang Charm', icon: '🦷', type: 'equipment', slot: 'amulet', rarity: 'uncommon',
      sell: 150, stats: { str: 4, atk: 3 } });
def({ id: 'bone_ring',       name: 'Ring of Bone',    icon: '💍', type: 'equipment', slot: 'ring', rarity: 'uncommon',
      sell: 140, stats: { def: 3, hp: 5 } });
def({ id: 'spider_silk_band', name: 'Silkweave Band', icon: '💍', type: 'equipment', slot: 'ring', rarity: 'rare',
      sell: 480, stats: { atk: 6, str: 4 } });
def({ id: 'ember_amulet',    name: 'Ember Amulet',    icon: '📿', type: 'equipment', slot: 'amulet', rarity: 'rare',
      sell: 550, stats: { str: 8, hp: 8 } });
def({ id: 'golem_core_ring', name: 'Golem Core Ring', icon: '💍', type: 'equipment', slot: 'ring', rarity: 'epic',
      sell: 1800, stats: { def: 12, hp: 15, str: 4 } });
def({ id: 'stormcaller_amulet', name: 'Stormcaller Amulet', icon: '📿', type: 'equipment', slot: 'amulet', rarity: 'epic',
      sell: 2200, stats: { atk: 14, str: 10 } });
def({ id: 'wyrmslayer_blade', name: 'Wyrmslayer Blade', icon: '🗡️', type: 'equipment', slot: 'weapon', rarity: 'legendary',
      sell: 12000, stats: { atk: 90, str: 110 } });
def({ id: 'dragonhide_cloak', name: 'Dragonhide Cloak', icon: '🧥', type: 'equipment', slot: 'chest', rarity: 'legendary',
      sell: 10000, stats: { def: 80, hp: 90 } });

// ---------- Town-exclusive goods ----------
// Made only by your own businesses — no skill produces these.
def({ id: 'town_coffee', name: 'Town Coffee', icon: '☕', type: 'potion', rarity: 'uncommon',
      sell: 90, duration: 900, effects: { speed: 0.08, xp: 0.08 } });
def({ id: 'refined_tonic', name: 'Refined Tonic', icon: '🍶', type: 'potion', rarity: 'rare',
      sell: 260, duration: 900, effects: { damage: 0.18, reduction: 0.12 } });

// ---------- Pet eggs (generated from the species list) ----------

// ---------- Farming produce ----------
// Priced between logs and ore: a farm is steadier than a mine and pays
// less per unit, but every one of these is also a Cooking or Alchemy input.
def({ id: 'wheat',       name: 'Wheat',        icon: '🌾', type: 'resource', rarity: 'common',   sell: 3 });
def({ id: 'root_veg',    name: 'Root Vegetables', icon: '🥕', type: 'resource', rarity: 'common', sell: 9 });
def({ id: 'emberpepper', name: 'Emberpepper',  icon: '🌶️', type: 'resource', rarity: 'uncommon', sell: 26 });
def({ id: 'moon_gourd',  name: 'Moon Gourd',   icon: '🎃', type: 'resource', rarity: 'uncommon', sell: 72 });
def({ id: 'silkleaf',    name: 'Silkleaf',     icon: '🍃', type: 'resource', rarity: 'rare',     sell: 165 });
def({ id: 'sunfruit',    name: 'Sunfruit',     icon: '🍑', type: 'resource', rarity: 'epic',     sell: 340 });

// ---------- Thieving spoils ----------
// These exist to be SOLD. No crafting chain, no cooking, no town input:
// Thieving is the gold skill and its output is deliberately terminal.
// Priced so that Thieving's RAW gold is roughly what a gatherer earns
// after routing their produce through an upgraded Market Stall. It should
// be the best direct gold source in the game, not fourteen times the next
// best, which is where the first pass landed it.
def({ id: 'cutpurse_coin',  name: 'Cutpurse Purse', icon: '👛', type: 'valuable', rarity: 'common',   sell: 14 });
def({ id: 'pilfered_goods', name: 'Pilfered Goods', icon: '🍎', type: 'valuable', rarity: 'common',   sell: 36 });
def({ id: 'strongbox_haul', name: 'Strongbox Haul', icon: '🧰', type: 'valuable', rarity: 'uncommon', sell: 95 });
def({ id: 'caravan_spoils', name: 'Caravan Spoils', icon: '🐎', type: 'valuable', rarity: 'rare',     sell: 230 });
def({ id: 'vault_prize',    name: 'Vault Prize',    icon: '🔐', type: 'valuable', rarity: 'epic',     sell: 500 });
def({ id: 'stolen_fragment',name: 'Stolen Fragment',icon: '⬛', type: 'valuable', rarity: 'legendary', sell: 1100 });

// ---------- Era II: salvage from the Wastes ----------
// Priced above the clean equivalent, because it is worth more and behaves
// worse. Glitched ore smelts hotter and cracks; deprecated assets are
// somebody's finished work that nobody came back for.
def({ id: 'scrap_code',       name: 'Scrap Code',        icon: '🧩', type: 'resource', rarity: 'common',   sell: 18 });
def({ id: 'glitched_ore',     name: 'Glitched Ore',      icon: '🟪', type: 'resource', rarity: 'uncommon', sell: 88 });
def({ id: 'glitched_bar',     name: 'Glitched Bar',      icon: '🧱', type: 'resource', rarity: 'rare',     sell: 260 });
def({ id: 'orphaned_shard',   name: 'Orphaned Shard',    icon: '🔻', type: 'resource', rarity: 'rare',     sell: 145 });
def({ id: 'corrupt_sigil',    name: 'Corrupt Sigil',     icon: '🕳️', type: 'resource', rarity: 'epic',     sell: 620 });
def({ id: 'deprecated_asset', name: 'Deprecated Asset',  icon: '📦', type: 'valuable', rarity: 'epic',     sell: 1250 });

// ---------- Runecrafting ----------
def({ id: 'rune_essence',  name: 'Rune Essence',  icon: '⚱️', type: 'resource', rarity: 'common',   sell: 12 });
def({ id: 'minor_rune',    name: 'Minor Rune',    icon: '🔹', type: 'resource', rarity: 'uncommon', sell: 55 });
def({ id: 'binding_sigil', name: 'Binding Sigil', icon: '🌀', type: 'resource', rarity: 'epic',     sell: 640 });
def({ id: 'blank_tome',    name: 'Blank Tome',    icon: '📕', type: 'resource', rarity: 'legendary', sell: 2400 });

// ============================================================
// THE SECOND HUNDRED
//
// Everything below is gathered or made above level 99, which means it only
// exists after the ceiling comes off — so it is all, one way or another,
// material that was always there and that you were not previously
// permitted to notice. Heartwood was in the same forest. The eel was in
// the same river. You were the thing that was capped.
//
// Priced on a ladder above the Era I top end (runite bar 480, blank tome
// 2400): roughly 3x at the first tier, 10x at the second, 30x at the
// third. That gap is what makes the long band worth climbing at all — a
// hundred levels for a 20% better log would be an insult.
// ============================================================

// ---------- Woodcutting ----------
def({ id: 'heartwood_log',  name: 'Heartwood Log',  icon: '🪵', type: 'resource', rarity: 'rare',      sell: 620 });
def({ id: 'ghostwood_log',  name: 'Ghostwood Log',  icon: '🪵', type: 'resource', rarity: 'epic',      sell: 1850 });
def({ id: 'worldroot_log',  name: 'Worldroot Log',  icon: '🪵', type: 'resource', rarity: 'legendary', sell: 5400 });

// ---------- Mining ----------
def({ id: 'adamant_ore',    name: 'Adamant Ore',    icon: '🟩', type: 'resource', rarity: 'rare',      sell: 660 });
def({ id: 'voidiron_ore',   name: 'Voidiron Ore',   icon: '⬛', type: 'resource', rarity: 'epic',      sell: 1950 });
def({ id: 'starfall_ore',   name: 'Starfall Ore',   icon: '🌟', type: 'resource', rarity: 'legendary', sell: 5800 });

// ---------- Smithing ----------
def({ id: 'adamant_bar',    name: 'Adamant Bar',    icon: '🟢', type: 'resource', rarity: 'rare',      sell: 1500 });
def({ id: 'voidiron_bar',   name: 'Voidiron Bar',   icon: '⬜', type: 'resource', rarity: 'epic',      sell: 6200 });
def({ id: 'starfall_bar',   name: 'Starfall Bar',   icon: '✨', type: 'resource', rarity: 'legendary', sell: 22000 });

// ---------- Fishing ----------
def({ id: 'raw_glasseel',   name: 'Glass Eel',      icon: '🐍', type: 'resource', rarity: 'rare',      sell: 580 });
def({ id: 'raw_sunfish',    name: 'Sunfish',        icon: '🐠', type: 'resource', rarity: 'epic',      sell: 1750 });
def({ id: 'raw_kraken',     name: 'Kraken Cut',     icon: '🦑', type: 'resource', rarity: 'legendary', sell: 5100 });

// ---------- Cooking ----------
// Heals scale with the ladder: the top plate is worth carrying into the
// Descent's fortieth floor, which nothing in Era I was.
def({ id: 'glasseel_fillet',name: 'Glass Eel Fillet', icon: '🍥', type: 'food', rarity: 'rare',      sell: 1250, heal: 520 });
def({ id: 'sunfish_roast',  name: 'Sunfish Roast',    icon: '🍛', type: 'food', rarity: 'epic',      sell: 3700, heal: 1150 });
def({ id: 'kraken_platter', name: 'Kraken Platter',   icon: '🍱', type: 'food', rarity: 'legendary', sell: 11000, heal: 2600 });

// ---------- Farming ----------
def({ id: 'frostgrain',     name: 'Frostgrain',     icon: '❄️', type: 'resource', rarity: 'rare',      sell: 540 });
def({ id: 'nullfruit',      name: 'Nullfruit',      icon: '🫐', type: 'resource', rarity: 'epic',      sell: 1620 });
def({ id: 'dawnmelon',      name: 'Dawnmelon',      icon: '🍈', type: 'resource', rarity: 'legendary', sell: 4900 });

// ---------- Alchemy ----------
def({ id: 'herb_glasswort',   name: 'Glasswort',    icon: '🌾', type: 'resource', rarity: 'rare',      sell: 600 });
def({ id: 'herb_nullbud',     name: 'Nullbud',      icon: '🖤', type: 'resource', rarity: 'epic',      sell: 1800 });
def({ id: 'herb_dawnthistle', name: 'Dawnthistle',  icon: '🌼', type: 'resource', rarity: 'legendary', sell: 5200 });
def({ id: 'greater_strength_potion', name: 'Greater Strength Potion', icon: '🧪', type: 'potion',
      rarity: 'rare', sell: 1600, duration: 900, effects: { damage: 0.30 } });
def({ id: 'warding_philtre', name: 'Warding Philtre', icon: '🛡️', type: 'potion',
      rarity: 'epic', sell: 6000, duration: 900, effects: { reduction: 0.22, damage: 0.10 } });
def({ id: 'ascendant_draught', name: 'Ascendant Draught', icon: '🌠', type: 'potion',
      rarity: 'legendary', sell: 14000, duration: 1200, effects: { damage: 0.35, xp: 0.30, gold: 0.30 } });

// ---------- Thieving ----------
// Terminal goods, same as the Era I spoils: nothing crafts with them.
// What changes is who you are stealing from.
def({ id: 'syndicate_ledger', name: 'Syndicate Ledger', icon: '📕', type: 'valuable', rarity: 'rare',      sell: 2400 });
def({ id: 'admin_keycard',    name: 'Admin Keycard',    icon: '💳', type: 'valuable', rarity: 'epic',      sell: 7200 });
def({ id: 'root_token',       name: 'Root Token',       icon: '🔑', type: 'valuable', rarity: 'legendary', sell: 22000 });

// ---------- Runecrafting ----------
def({ id: 'prime_essence',  name: 'Prime Essence',  icon: '🔆', type: 'resource', rarity: 'rare',      sell: 320 });
def({ id: 'binding_lattice',name: 'Binding Lattice',icon: '🕸️', type: 'resource', rarity: 'epic',      sell: 3400 });
def({ id: 'null_rune',      name: 'Null Rune',      icon: '⚫', type: 'resource', rarity: 'legendary', sell: 9800 });
def({ id: 'sealed_tome',    name: 'Sealed Tome',    icon: '📗', type: 'resource', rarity: 'legendary', sell: 26000 });

import { SPECIES_LIST, eggItemId } from './pets.js';

const EGG_SELL = { common: 2000, rare: 12000, epic: 40000, legendary: 150000 };
for (const sp of SPECIES_LIST) {
  def({
    id: eggItemId(sp.id),
    name: sp.eggName,
    icon: sp.eggIcon,
    type: 'egg',
    rarity: sp.rarity,
    sell: EGG_SELL[sp.rarity] || 2000,
    species: sp.id,
  });
}

// ---------- Ability Tomes (generated from the ability list) ----------
// Kept in sync with data/abilities.js so a new ability automatically
// gets a matching tome item.
import { ABILITY_LIST, tomeIdFor } from './abilities.js';

const TOME_SELL = { rare: 800, epic: 3000, legendary: 12000 };
for (const ab of ABILITY_LIST) {
  def({
    id: tomeIdFor(ab.id),
    name: `Tome: ${ab.name}`,
    icon: '📕',
    type: 'tome',
    rarity: ab.rarity,
    sell: TOME_SELL[ab.rarity] || 500,
    teaches: ab.id,
    slot: ab.slot,
  });
}

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const EQUIP_SLOTS = ['weapon', 'helmet', 'chest', 'legs', 'boots', 'ring', 'amulet'];

export function getItem(id) { return ITEMS[id]; }
