// ============================================================
// ENCHANTING — runes from Rifts push gear to +1…+5
// Each + adds +10% to the item's stats (floored, in gearStats).
// ============================================================
import { state, enchantLevel } from '../core/state.js';
import { getItem } from '../data/items.js';
import { itemCount, removeItem, spendGold } from './inventory.js';
import { emit } from '../core/events.js';

export const MAX_ENCHANT = 5;

// Cost scales with item rarity and target level.
export function enchantCost(itemId) {
  const item = getItem(itemId);
  if (!item || item.type !== 'equipment') return null;
  const next = enchantLevel(itemId) + 1;
  if (next > MAX_ENCHANT) return null;

  const byRarity = {
    common:    { rune: 'rune_shard',   base: 2, gold: 200 },
    uncommon:  { rune: 'rune_shard',   base: 3, gold: 500 },
    rare:      { rune: 'greater_rune', base: 1, gold: 1500 },
    epic:      { rune: 'greater_rune', base: 2, gold: 4000 },
    legendary: { rune: 'void_rune',    base: 1, gold: 10000 },
  }[item.rarity] || { rune: 'rune_shard', base: 2, gold: 200 };

  return {
    next,
    rune: byRarity.rune,
    runeQty: byRarity.base * next,
    gold: byRarity.gold * Math.pow(2, next - 1),
  };
}

export function canEnchant(itemId) {
  const cost = enchantCost(itemId);
  if (!cost) return false;
  return itemCount(cost.rune) >= cost.runeQty && state.gold >= cost.gold;
}

export function enchantItem(itemId) {
  const item = getItem(itemId);
  const cost = enchantCost(itemId);
  if (!item || !cost) return false;
  if (itemCount(cost.rune) < cost.runeQty) return false;
  if (!spendGold(cost.gold)) return false;
  removeItem(cost.rune, cost.runeQty);

  state.enchants[itemId] = cost.next;
  state.stats.enchants = (state.stats.enchants || 0) + 1;
  emit('notify', { type: 'loot', text: `✨ ${item.name} is now +${cost.next}` });
  emit('enchanted', { itemId, level: cost.next });
  emit('state-changed');
  return true;
}
