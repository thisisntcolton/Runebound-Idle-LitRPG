// ============================================================
// POTIONS — drink to gain a timed buff (10 min, refreshable)
// ============================================================
import { state, maxHp } from '../core/state.js';
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

// ============================================================
// EATING, OUTSIDE A FIGHT
//
// Health only ever came back mid-combat, through auto-eat. Step out of a
// fight on two hit points and there was nothing to do about it but start
// another fight and hope — which is a strange rule for a game with a
// cooking skill in it.
//
// So food can be eaten whenever. It heals, and if the meal carries a
// buff it applies that too, through exactly the same machinery potions
// use — one code path for timed effects, so a food buff and a potion
// buff can never behave differently.
// ============================================================

export function canEat(itemId) {
  const item = getItem(itemId);
  if (!item || item.type !== 'food') return { ok: false, why: 'Not food.' };
  if (itemCount(itemId) < 1) return { ok: false, why: 'You have none.' };
  const cap = maxHp();
  const hp = state.combat.playerHp ?? cap;
  // A meal that only heals is refused at full health — eating it would
  // throw it away. One that carries a buff is always worth eating.
  if (hp >= cap && !item.effects) {
    return { ok: false, why: 'You are at full health, and this is only food.' };
  }
  return { ok: true, why: '' };
}

export function eat(itemId) {
  const item = getItem(itemId);
  const check = canEat(itemId);
  if (!check.ok) {
    if (item) emit('notify', { type: 'sys', text: check.why });
    return false;
  }
  removeItem(itemId, 1);

  const cap = maxHp();
  const before = state.combat.playerHp ?? cap;
  const healed = Math.min(cap - before, item.heal || 0);
  if (healed > 0) {
    state.combat.playerHp = before + healed;
    emit('combat-hit', { source: 'heal', damage: healed });
  }

  const parts = [];
  if (healed > 0) parts.push(`+${healed} health`);

  if (item.effects) {
    const duration = (item.duration || 600) * 1000;
    const existing = state.buffs[itemId];
    const base = existing && existing.expiresAt > Date.now() ? existing.expiresAt : Date.now();
    state.buffs[itemId] = {
      expiresAt: Math.min(base + duration, Date.now() + duration * 3),
      effects: item.effects,
      name: item.name,
      icon: item.icon,
    };
    parts.push(effectText(item.effects));
  }

  state.stats.mealsEaten = (state.stats.mealsEaten || 0) + 1;
  emit('notify', { type: 'sys',
    text: `${item.icon} ${item.name} — ${parts.join(' · ') || 'and very nice too'}` });
  emit('ate', { itemId });
  emit('state-changed');
  return true;
}

/** Everything edible in the bag, best meal first. */
export function edibles() {
  return Object.keys(state.inventory)
    .map(id => ({ id, item: getItem(id), qty: state.inventory[id] }))
    .filter(e => e.qty > 0 && e.item?.type === 'food')
    .sort((a, b) => (b.item.effects ? 1 : 0) - (a.item.effects ? 1 : 0)
                 || (b.item.heal || 0) - (a.item.heal || 0));
}
