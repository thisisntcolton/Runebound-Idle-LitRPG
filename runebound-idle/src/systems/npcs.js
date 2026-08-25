// ============================================================
// NPC SYSTEM — population, notables, and visitor events
// ============================================================
import { state } from '../core/state.js';
import { NOTABLES, notablesAt, populationFor, VISITORS,
         VISITOR_MIN_MS, VISITOR_MAX_MS } from '../data/npcs.js';
import { getItem } from '../data/items.js';
import { addGold, spendGold, addItem } from './inventory.js';
import { emit } from '../core/events.js';
import { townLevel } from './town.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setNpcUIHooks(h) { hooks = h; }

export function buildingCount() {
  return state.town.plots.filter(p => p.building).length;
}

export function population() {
  const base = populationFor(townLevel(), buildingCount());
  return Math.max(0, base + (state.town.extraPopulation || 0));
}

// ---------------- Notables ----------------

/** Notables who have moved in, checked against the current town level. */
export function residents() {
  return notablesAt(townLevel());
}

export function checkArrivals() {
  const lvl = townLevel();
  if (!state.town.metNotables) state.town.metNotables = {};
  let arrived = false;
  for (const n of NOTABLES) {
    if (lvl < n.atLevel || state.town.metNotables[n.id]) continue;
    state.town.metNotables[n.id] = Date.now();
    arrived = true;
    emit('notify', { type: 'sys', text: `${n.icon} ${n.name} has moved to Hearthwick — ${n.perkLabel}` });
    hooks.queueModal(`
      <div class="modal-tag">◈ A NEW RESIDENT ◈</div>
      <div class="modal-title">${n.icon} ${n.name}</div>
      <div class="modal-body" style="line-height:1.7">
        <p class="muted">${n.role}</p>
        <p>${n.greeting}</p>
        <p style="color:var(--xp)"><b>Permanent town bonus: ${n.perkLabel}</b></p>
      </div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Welcome them</button></div>
    `);
  }
  if (arrived) emit('state-changed');
}

/** Sum of resident perks for a given buff key — folds into townBuff. */
export function residentBonus(key) {
  let total = 0;
  for (const n of residents()) {
    if (n.perk?.key === key) total += n.perk.value;
  }
  return total;
}

// ---------------- Visitors ----------------

function scheduleVisitor(now = Date.now()) {
  state.town.nextVisitorAt = now + VISITOR_MIN_MS + Math.random() * (VISITOR_MAX_MS - VISITOR_MIN_MS);
}

export function pendingVisitor() {
  return state.town.visitor || null;
}

export function tickNpcs() {
  if (!state.town?.unlocked) return;
  checkArrivals();

  const now = Date.now();
  if (!state.town.nextVisitorAt) { scheduleVisitor(now); return; }
  if (state.town.visitor) return;                 // one at a time
  if (buildingCount() === 0) return;              // nothing to visit yet
  if (now < state.town.nextVisitorAt) return;

  const v = VISITORS[Math.floor(Math.random() * VISITORS.length)];
  state.town.visitor = { id: v.id, arrivedAt: now };
  emit('notify', { type: 'sys', text: `${v.icon} ${v.name} has arrived in Hearthwick.` });
  hooks.popup('A VISITOR', `${v.icon} ${v.name}<br><span style="font-size:12px;color:var(--text-dim)">Waiting in the square — see the Town view.</span>`, { ttl: 6 });
  scheduleVisitor(now);
  emit('state-changed');
}

export function resolveVisitor(choice) {
  const active = state.town.visitor;
  if (!active) return false;
  const v = VISITORS.find(x => x.id === active.id);
  state.town.visitor = null;
  if (!v) { emit('state-changed'); return false; }

  if (choice === 'decline') {
    emit('notify', { type: 'sys', text: v.decline.text });
    emit('state-changed');
    return true;
  }

  const a = v.accept;
  // cost first
  if (a.cost === 'gold') {
    const price = Math.max(500, Math.floor(state.gold * 0.08));
    if (!spendGold(price)) {
      emit('notify', { type: 'sys', text: `You can't cover his prices. He rolls east.` });
      emit('state-changed');
      return false;
    }
    emit('notify', { type: 'gold', text: `Paid the merchant 🪙 ${price.toLocaleString()}.` });
  }
  if (a.cost === 'tax') {
    const tax = Math.floor(state.gold * 0.05);
    state.gold -= tax;
    emit('notify', { type: 'sys', text: `[ SYSTEM ] Assessment fee applied: 🪙 ${tax.toLocaleString()}.` });
  }

  // reward
  const lvl = Math.max(1, townLevel());
  switch (a.gift) {
    case 'materials': {
      const pool = ['oak_log', 'willow_log', 'maple_log', 'iron_ore', 'coal', 'herb_sagewort'];
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const qty = 20 + lvl * 6;
      addItem(pick, qty);
      emit('notify', { type: 'loot', text: `📦 ${getItem(pick)?.name} ×${qty}` });
      break;
    }
    case 'potions': {
      const pool = ['town_coffee', 'refined_tonic', 'strength_potion', 'lucky_brew'];
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const qty = 2 + Math.floor(lvl / 4);
      addItem(pick, qty);
      emit('notify', { type: 'loot', text: `🧪 ${getItem(pick)?.name} ×${qty}` });
      break;
    }
    case 'population': {
      state.town.extraPopulation = (state.town.extraPopulation || 0) + 3;
      emit('notify', { type: 'sys', text: 'They find a corner to sleep in. Hearthwick is three people larger.' });
      break;
    }
    case 'blessing': {
      const gold = addGold(2000 * lvl, { silent: true });
      emit('notify', { type: 'gold', text: `[ SYSTEM ] Settlement provisionally approved. Grant issued: 🪙 ${gold.toLocaleString()}.` });
      break;
    }
    case 'morale': {
      state.buffs.town_song = {
        expiresAt: Date.now() + 30 * 60 * 1000,
        effects: { xp: 0.10, gold: 0.10 },
        name: "The Bard's Song",
        icon: '🪕',
      };
      emit('notify', { type: 'sys', text: 'The song is not very good. Everyone feels better anyway. (+10% XP and gold, 30 min)' });
      break;
    }
  }
  emit('visitor-resolved', { id: v.id, choice });
  emit('state-changed');
  return true;
}

export function getVisitorDef(id) { return VISITORS.find(v => v.id === id); }
