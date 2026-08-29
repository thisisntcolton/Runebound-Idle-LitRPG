// ============================================================
// THE HOUSE — owning it, extending it, furnishing it
//
// state.home is { level, placed: { roomId: [furnitureId, ...] }, owned:
// { furnitureId: qty } }. Placement is a list per room rather than a slot
// map because the drawing decides where things sit; the player decides
// what is in the room, which is the interesting half.
//
// The bonus chain deliberately reuses the same keys as everything else,
// so a chair and a Fate Perk are summed by identical code and a set
// bonus cannot invent a stat nothing reads.
// ============================================================
import { state } from '../core/state.js';
import { ROOMS, MAX_HOUSE_LEVEL, houseUpgradeCost, FURNITURE_BY_ID, SETS,
         getFurniture, furnitureForRoom } from '../data/home.js';
import { addItem, removeItem, itemCount, spendGold } from './inventory.js';
import { buyPrice } from '../core/state.js';
import { emit } from '../core/events.js';

export function home() {
  if (!state.home) {
    state.home = { level: 1, placed: {}, owned: {}, visits: 0 };
  }
  if (!state.home.placed) state.home.placed = {};
  if (!state.home.owned) state.home.owned = {};
  return state.home;
}

export function houseLevel() { return home().level || 1; }

export function unlockedRooms() {
  return ROOMS.filter(r => r.atHouseLevel <= houseLevel());
}

export function placedIn(roomId) {
  return (home().placed[roomId] || []).map(getFurniture).filter(Boolean);
}

export function slotsUsed(roomId) { return (home().placed[roomId] || []).length; }

export function slotsIn(roomId) {
  return ROOMS.find(r => r.id === roomId)?.slots || 0;
}

/** How many of a piece you own but have not put out. */
export function spare(furnitureId) {
  const total = home().owned[furnitureId] || 0;
  const out = Object.values(home().placed).flat().filter(id => id === furnitureId).length;
  return Math.max(0, total - out);
}

export function ownsAny(furnitureId) { return (home().owned[furnitureId] || 0) > 0; }

// ---------------- Acquiring ----------------

export function acquire(furnitureId, qty = 1, { silent = false } = {}) {
  const f = getFurniture(furnitureId);
  if (!f) return false;
  const h = home();
  h.owned[furnitureId] = (h.owned[furnitureId] || 0) + qty;
  if (!silent) {
    emit('notify', { type: 'loot', text: `${f.icon} ${f.name} — for the house.` });
    emit('rare-drop', { itemId: furnitureId, rarity: f.rarity });
  }
  emit('home-changed', {});
  return true;
}

export function buyFurniture(furnitureId) {
  const f = getFurniture(furnitureId);
  if (!f?.gold) return false;
  const price = buyPrice(f.gold);
  if (!spendGold(price)) {
    emit('notify', { type: 'sys', text: `You cannot afford the ${f.name}.` });
    return false;
  }
  acquire(furnitureId, 1, { silent: true });
  emit('notify', { type: 'gold', text: `${f.icon} Bought ${f.name} for ${price.toLocaleString()} gold.` });
  emit('state-changed');
  return true;
}

/** Price a piece for display. Same function the purchase uses. */
export function furniturePrice(furnitureId) {
  const f = getFurniture(furnitureId);
  return f?.gold ? buyPrice(f.gold) : 0;
}

// ---------------- Placing ----------------

export function place(furnitureId, roomId) {
  const f = getFurniture(furnitureId);
  if (!f) return false;
  if (f.room !== roomId) {
    emit('notify', { type: 'sys', text: `The ${f.name} does not belong in there.` });
    return false;
  }
  if (spare(furnitureId) < 1) return false;
  const h = home();
  h.placed[roomId] = h.placed[roomId] || [];
  if (h.placed[roomId].length >= slotsIn(roomId)) {
    emit('notify', { type: 'sys', text: 'There is no room left in there.' });
    return false;
  }
  h.placed[roomId].push(furnitureId);
  emit('home-changed', {});
  emit('state-changed');
  return true;
}

export function unplace(roomId, index) {
  const h = home();
  const list = h.placed[roomId];
  if (!list || index < 0 || index >= list.length) return false;
  list.splice(index, 1);
  emit('home-changed', {});
  emit('state-changed');
  return true;
}

// ---------------- Extending ----------------

export function nextRoom() {
  return ROOMS.find(r => r.atHouseLevel === houseLevel() + 1) || null;
}

export function extendCost() {
  const lvl = houseLevel();
  if (lvl >= MAX_HOUSE_LEVEL) return null;
  const raw = houseUpgradeCost(lvl);
  return { gold: buyPrice(raw.gold), items: raw.items };
}

export function canExtend() {
  const cost = extendCost();
  if (!cost) return false;
  if (state.gold < cost.gold) return false;
  return Object.entries(cost.items).every(([id, q]) => itemCount(id) >= q);
}

export function extend() {
  const cost = extendCost();
  if (!cost || !canExtend()) return false;
  spendGold(cost.gold);
  for (const [id, q] of Object.entries(cost.items)) removeItem(id, q);
  const h = home();
  h.level = (h.level || 1) + 1;
  const room = ROOMS.find(r => r.atHouseLevel === h.level);
  emit('notify', { type: 'gold', text: `${room?.icon || '🏠'} ${room?.name || 'A new room'} — the house is bigger than it was.` });
  emit('home-changed', {});
  emit('state-changed');
  return true;
}

// ---------------- What it is worth ----------------

/**
 * A room counts as a complete SET when every slot is filled and every
 * piece in it belongs to the same set. Partial credit would make the
 * whole system a shopping list; all-or-nothing makes it a puzzle.
 */
export function completedSets() {
  const done = [];
  for (const room of unlockedRooms()) {
    const list = placedIn(room.id);
    if (list.length < room.slots) continue;
    const first = list[0]?.set;
    if (first && list.every(f => f.set === first)) done.push(first);
  }
  return done;
}

/** Every furniture bonus, plus completed set bonuses, for one key. */
export function homeBonus(key) {
  let total = 0;
  for (const room of unlockedRooms()) {
    for (const f of placedIn(room.id)) {
      if (f.bonus?.[key]) total += f.bonus[key];
    }
  }
  for (const setId of completedSets()) {
    const s = SETS[setId];
    if (s?.bonus?.[key]) total += s.bonus[key];
  }
  return total;
}

/** Everything the panel needs, and everything a visitor sees. */
export function homeView() {
  const h = home();
  return {
    level: houseLevel(),
    maxLevel: MAX_HOUSE_LEVEL,
    rooms: unlockedRooms().map(r => ({
      ...r,
      placed: placedIn(r.id),
      used: slotsUsed(r.id),
      complete: (() => {
        const list = placedIn(r.id);
        if (list.length < r.slots) return null;
        const first = list[0]?.set;
        return first && list.every(f => f.set === first) ? SETS[first] : null;
      })(),
    })),
    next: nextRoom(),
    cost: extendCost(),
    canExtend: canExtend(),
    sets: completedSets().map(id => SETS[id]),
    owned: h.owned,
  };
}

/** A compact snapshot, for showing somebody else's house. */
export function homeSnapshot() {
  const h = home();
  return {
    level: houseLevel(),
    placed: JSON.parse(JSON.stringify(h.placed || {})),
    sets: completedSets(),
  };
}
