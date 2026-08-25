// ============================================================
// POTIONS — drink to gain a timed buff (10 min, refreshable)
// ============================================================
import { state } from '../core/state.js';
import { getItem } from '../data/items.js';
import { removeItem, itemCount } from './inventory.js';
import { emit } from '../core/events.js';

export function drinkPotion(itemId) {
  const item = getItem(itemId);
  if (!item || item.type !== 'potion') return false;
  if (itemCount(itemId) < 1) return false;

  removeItem(itemId, 1);
  const duration = (item.duration || 600) * 1000;
  const existing = state.buffs[itemId];
  const base = existing && existing.expiresAt > Date.now() ? existing.expiresAt : Date.now();
  state.buffs[itemId] = {
    expiresAt: Math.min(base + duration, Date.now() + duration * 3), // stack up to 3x duration
    effects: item.effects,
    name: item.name,
    icon: item.icon,
  };
  state.stats.potionsDrunk = (state.stats.potionsDrunk || 0) + 1;
  emit('notify', { type: 'sys', text: `${item.icon} ${item.name} — ${effectText(item.effects)}` });
  emit('potion-drunk', { itemId });
  emit('state-changed');
  return true;
}

export function effectText(effects) {
  const labels = {
    damage: 'damage', xp: 'XP', gold: 'gold', speed: 'speed',
    dropRate: 'drop rate', reduction: 'damage reduction',
  };
  return Object.entries(effects || {})
    .map(([k, v]) => `+${Math.round(v * 100)}% ${labels[k] || k}`)
    .join(', ');
}

// Purge expired buffs occasionally so the save doesn't grow stale entries.
export function cleanupBuffs() {
  const now = Date.now();
  for (const [id, b] of Object.entries(state.buffs || {})) {
    if (b.expiresAt <= now) delete state.buffs[id];
  }
}
