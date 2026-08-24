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
def({ id: 'mythril_bar', name: 'Mythril Bar', icon: '🟦', type: 'resource', rarity: 'rare',     sell: 130 });
def({ id: 'runite_bar',  name: 'Runite Bar',  icon: '🟪', type: 'resource', rarity: 'epic',     sell: 480 });

// ---------- Food (cooking outputs) ----------
def({ id: 'shrimp',  name: 'Cooked Shrimp',   icon: '🍤', type: 'food', rarity: 'common',   sell: 5,   heal: 8 });
def({ id: 'trout',   name: 'Cooked Trout',    icon: '🐟', type: 'food', rarity: 'common',   sell: 14,  heal: 20 });
def({ id: 'salmon',  name: 'Cooked Salmon',   icon: '🍣', type: 'food', rarity: 'uncommon', sell: 30,  heal: 38 });
def({ id: 'lobster', name: 'Cooked Lobster',  icon: '🦞', type: 'food', rarity: 'rare',     sell: 90,  heal: 70 });
def({ id: 'leviathan_steak', name: 'Leviathan Steak', icon: '🥩', type: 'food', rarity: 'epic', sell: 320, heal: 150 });

// ---------- Smithed equipment (5 tiers x 5 slots) ----------
const TIERS = [
  { key: 'bronze',  name: 'Bronze',  rarity: 'common',   mult: 1,  sellBase: 15,   icon: { weapon: '🗡️', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
  { key: 'iron',    name: 'Iron',    rarity: 'common',   mult: 2,  sellBase: 45,   icon: { weapon: '🗡️', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
  { key: 'steel',   name: 'Steel',   rarity: 'uncommon', mult: 4,  sellBase: 120,  icon: { weapon: '⚔️', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
  { key: 'mythril', name: 'Mythril', rarity: 'rare',     mult: 8,  sellBase: 400,  icon: { weapon: '⚔️', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
  { key: 'runite',  name: 'Runic',   rarity: 'epic',     mult: 16, sellBase: 1400, icon: { weapon: '🔱', helmet: '🪖', chest: '🦺', legs: '👖', boots: '🥾' } },
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

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const EQUIP_SLOTS = ['weapon', 'helmet', 'chest', 'legs', 'boots', 'ring', 'amulet'];

export function getItem(id) { return ITEMS[id]; }
