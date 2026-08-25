// ============================================================
// INVENTORY, SELLING, EQUIPMENT
// ============================================================
import { state, goldMultiplier } from '../core/state.js';
import { getItem } from '../data/items.js';
import { emit } from '../core/events.js';

export function addItem(itemId, qty = 1) {
  state.inventory[itemId] = (state.inventory[itemId] || 0) + qty;
}

export function removeItem(itemId, qty = 1) {
  const have = state.inventory[itemId] || 0;
  if (have < qty) return false;
  if (have === qty) delete state.inventory[itemId];
  else state.inventory[itemId] = have - qty;
  return true;
}

export function itemCount(itemId) {
  return state.inventory[itemId] || 0;
}

export function hasInputs(inputs) {
  if (!inputs) return true;
  return Object.entries(inputs).every(([id, q]) => itemCount(id) >= q);
}

export function consumeInputs(inputs) {
  if (!inputs) return true;
  if (!hasInputs(inputs)) return false;
  for (const [id, q] of Object.entries(inputs)) removeItem(id, q);
  return true;
}

export function addGold(amount, { silent = false } = {}) {
  const gained = Math.floor(amount * goldMultiplier());
  state.gold += gained;
  state.lifetimeGold += gained;
  if (!silent) emit('gold', { amount: gained, total: state.gold });
  return gained;
}

export function spendGold(amount) {
  if (state.gold < amount) return false;
  state.gold -= amount;
  return true;
}

export function sellItem(itemId, qty) {
  const item = getItem(itemId);
  if (!item) return 0;
  const have = itemCount(itemId);
  const n = Math.min(have, qty === 'all' ? have : qty);
  if (n <= 0) return 0;
  removeItem(itemId, n);
  const gained = addGold(item.sell * n);
  state.stats.itemsSold += n;
  emit('notify', { type: 'gold', text: `Sold ${n}× ${item.name} for ${gained} gold` });
  emit('state-changed');
  return gained;
}

const KEEP_ON_SELL_ALL = new Set(['rune_shard', 'greater_rune', 'void_rune']); // enchanting fuel

export function sellAllOfType(type) {
  let total = 0;
  for (const [itemId, qty] of Object.entries({ ...state.inventory })) {
    const item = getItem(itemId);
    if (!item) continue;
    if (KEEP_ON_SELL_ALL.has(itemId)) continue;
    if (type === 'resources' && item.type !== 'resource') continue;
    if (type === 'all' && item.type === 'food') continue; // keep food when selling "all"
    removeItem(itemId, qty);
    total += item.sell * qty;
    state.stats.itemsSold += qty;
  }
  if (total > 0) {
    const gained = addGold(total);
    emit('notify', { type: 'gold', text: `Sold your haul for ${gained} gold` });
    emit('state-changed');
  }
  return total;
}

export function equipItem(itemId) {
  const item = getItem(itemId);
  if (!item || item.type !== 'equipment') return false;
  if (itemCount(itemId) < 1) return false;
  const slot = item.slot;
  const current = state.equipment[slot];
  removeItem(itemId, 1);
  if (current) addItem(current, 1);
  state.equipment[slot] = itemId;
  emit('notify', { type: 'loot', text: `Equipped ${item.name}` });
  emit('state-changed');
  return true;
}

export function unequipItem(slot) {
  const current = state.equipment[slot];
  if (!current) return false;
  state.equipment[slot] = null;
  addItem(current, 1);
  emit('state-changed');
  return true;
}
