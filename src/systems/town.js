// ============================================================
// TOWN SYSTEM — plots, buildings, staff, stock and the business tick
// ============================================================
import { state } from '../core/state.js';
import { BUILDINGS, BUILDING_LIST, getBuilding, BUILDING_UNLOCK_LEVEL,
         MAX_BUILDING_LEVEL, PLOT_COUNT, plotCost, upgradeCostFor,
         INPUT_CATEGORIES, STAFF_TRAITS, rollApplicant, APPLICANT_POOL_SIZE,
         REROLL_COST, plotsUnlockedAt } from '../data/town.js';
import { getItem } from '../data/items.js';
import { addGold, spendGold, addItem, removeItem, itemCount } from './inventory.js';
import { emit } from '../core/events.js';
import { plotHalted } from './unstable.js';
import { residentBonus } from './npcs.js';

// ---------------- Helpers ----------------

export function town() { return state.town; }

export function ownedPlots() {
  return state.town.plots.filter(p => p.owned);
}

export function totalBuildingLevels() {
  return state.town.plots.reduce((s, p) => s + (p.building ? p.level : 0), 0);
}

export function townLevel() {
  return totalBuildingLevels();
}

export function plotsAvailable() {
  return plotsUnlockedAt(townLevel());
}

export function buildingUnlocked(buildingId) {
  return townLevel() >= (BUILDING_UNLOCK_LEVEL[buildingId] ?? 0);
}

function staffOnPlot(plotIndex) {
  return Object.values(state.town.staff).filter(s => s.assigned === plotIndex);
}

export function plotStaff(plotIndex) { return staffOnPlot(plotIndex); }

export function unassignedStaff() {
  return Object.values(state.town.staff).filter(s => s.assigned === null || s.assigned === undefined);
}

// ---------------- Purchasing & building ----------------

export function buyPlot(index) {
  const plot = state.town.plots[index];
  if (!plot || plot.owned) return false;
  if (index >= plotsAvailable()) {
    emit('notify', { type: 'sys', text: `That parcel isn't for sale yet — grow the town first.` });
    return false;
  }
  const cost = plotCost(index);
  if (state.gold < cost.gold) return false;
  for (const [id, qty] of Object.entries(cost.items)) {
    if (itemCount(id) < qty) return false;
  }
  spendGold(cost.gold);
  for (const [id, qty] of Object.entries(cost.items)) removeItem(id, qty);
  plot.owned = true;
  if (!state.town.unlocked) {
    state.town.unlocked = true;
    emit('notify', { type: 'sys', text: `[ SYSTEM ] You own land. The System did not plan for this.` });
  }
  emit('notify', { type: 'gold', text: `🏞️ Parcel ${index + 1} purchased.` });
  emit('town-changed', {});
  emit('state-changed');
  return true;
}

export function canAfford(cost) {
  if (state.gold < cost.gold) return false;
  return Object.entries(cost.items || {}).every(([id, q]) => itemCount(id) >= q);
}

export function build(plotIndex, buildingId) {
  const plot = state.town.plots[plotIndex];
  const def = getBuilding(buildingId);
  if (!plot || !plot.owned || plot.building || !def) return false;
  if (!buildingUnlocked(buildingId)) return false;
  if (!canAfford(def.cost)) return false;

  spendGold(def.cost.gold);
  for (const [id, qty] of Object.entries(def.cost.items)) removeItem(id, qty);
  plot.building = buildingId;
  plot.level = 1;
  plot.stock = {};
  plot.progress = 0;
  emit('notify', { type: 'gold', text: `${def.icon} ${def.name} built on parcel ${plotIndex + 1}.` });
  emit('town-changed', {});
  emit('state-changed');
  return true;
}

export function upgradeBuilding(plotIndex) {
  const plot = state.town.plots[plotIndex];
  if (!plot?.building || plot.level >= MAX_BUILDING_LEVEL) return false;
  const def = getBuilding(plot.building);
  const cost = upgradeCostFor(def, plot.level);
  if (!canAfford(cost)) return false;
  spendGold(cost.gold);
  for (const [id, qty] of Object.entries(cost.items)) removeItem(id, qty);
  plot.level++;
  emit('notify', { type: 'gold', text: `${def.icon} ${def.name} upgraded to level ${plot.level}.` });
  emit('town-changed', {});
  emit('state-changed');
  return true;
}

export function demolish(plotIndex) {
  const plot = state.town.plots[plotIndex];
  if (!plot?.building) return false;
  // return stock to your bags, free the staff
  for (const [id, qty] of Object.entries(plot.stock || {})) addItem(id, qty);
  for (const s of staffOnPlot(plotIndex)) s.assigned = null;
  const def = getBuilding(plot.building);
  plot.building = null; plot.level = 0; plot.stock = {}; plot.progress = 0;
  emit('notify', { type: 'sys', text: `${def?.name || 'The building'} demolished. Materials were not recovered; the stock was.` });
  emit('town-changed', {});
  emit('state-changed');
  return true;
}

// ---------------- Staff ----------------

export function refreshApplicants({ free = false } = {}) {
  if (!free) {
    if (!spendGold(REROLL_COST)) return false;
  }
  state.town.applicants = Array.from({ length: APPLICANT_POOL_SIZE },
    (_, i) => rollApplicant(Math.random, i));
  state.town.applicantsAt = Date.now();
  emit('state-changed');
  return true;
}

export function hire(applicantId) {
  const idx = state.town.applicants.findIndex(a => a.id === applicantId);
  if (idx === -1) return false;
  const applicant = state.town.applicants[idx];
  const signingFee = applicant.wage * 5;
  if (!spendGold(signingFee)) {
    emit('notify', { type: 'sys', text: `You can't cover ${applicant.name}'s signing fee (${signingFee} gold).` });
    return false;
  }
  state.town.staff[applicant.id] = { ...applicant, assigned: null };
  state.town.applicants.splice(idx, 1);
  emit('notify', { type: 'sys', text: `${applicant.icon} ${applicant.name} joins the payroll — ${applicant.wage}g per shift.` });
  emit('town-changed', {});
  emit('state-changed');
  return true;
}

export function fire(staffId) {
  const s = state.town.staff[staffId];
  if (!s) return false;
  delete state.town.staff[staffId];
  emit('notify', { type: 'sys', text: `${s.name} has been let go. They take it about as well as you'd expect.` });
  emit('town-changed', {});
  emit('state-changed');
  return true;
}

export function assignStaff(staffId, plotIndex) {
  const s = state.town.staff[staffId];
  if (!s) return false;
  if (plotIndex === null) { s.assigned = null; emit('state-changed'); return true; }
  const plot = state.town.plots[plotIndex];
  if (!plot?.building) return false;
  const def = getBuilding(plot.building);
  if (staffOnPlot(plotIndex).length >= def.staffSlots) {
    emit('notify', { type: 'sys', text: `${def.name} has no free positions.` });
    return false;
  }
  s.assigned = plotIndex;
  emit('town-changed', {});
  emit('state-changed');
  return true;
}

// ---------------- Stocking ----------------

/** Items in your bags that satisfy a building's input categories. */
export function eligibleStock(buildingId) {
  const def = getBuilding(buildingId);
  if (!def) return [];
  const cats = Object.keys(def.inputs || {});
  if (!cats.length) return [];
  const out = [];
  for (const itemId of Object.keys(state.inventory)) {
    const item = getItem(itemId);
    if (!item) continue;
    if (cats.some(c => INPUT_CATEGORIES[c]?.match(item))) out.push(item);
  }
  return out;
}

export function stockBuilding(plotIndex, itemId, qty) {
  const plot = state.town.plots[plotIndex];
  if (!plot?.building) return false;
  const have = itemCount(itemId);
  const n = Math.min(have, qty === 'all' ? have : qty);
  if (n <= 0) return false;
  removeItem(itemId, n);
  plot.stock[itemId] = (plot.stock[itemId] || 0) + n;
  emit('town-changed', {});
  emit('state-changed');
  return true;
}

export function withdrawStock(plotIndex, itemId) {
  const plot = state.town.plots[plotIndex];
  const qty = plot?.stock?.[itemId] || 0;
  if (qty <= 0) return false;
  addItem(itemId, qty);
  delete plot.stock[itemId];
  emit('town-changed', {});
  emit('state-changed');
  return true;
}

/** Total units of stock a building holds that count toward a category. */
function stockForCategory(plot, category) {
  const cat = INPUT_CATEGORIES[category];
  if (!cat) return 0;
  let total = 0;
  for (const [id, qty] of Object.entries(plot.stock || {})) {
    const item = getItem(id);
    if (item && cat.match(item)) total += qty;
  }
  return total;
}

/** Consume `need` units matching a category, cheapest items first. */
function consumeCategory(plot, category, need) {
  const cat = INPUT_CATEGORIES[category];
  if (!cat) return 0;
  const entries = Object.entries(plot.stock || {})
    .map(([id, qty]) => ({ id, qty, item: getItem(id) }))
    .filter(e => e.item && cat.match(e.item))
    .sort((a, b) => (a.item.sell || 0) - (b.item.sell || 0));
  let taken = 0;
  for (const e of entries) {
    if (taken >= need) break;
    const take = Math.min(e.qty, need - taken);
    plot.stock[e.id] -= take;
    if (plot.stock[e.id] <= 0) delete plot.stock[e.id];
    taken += take;
  }
  return taken;
}

// ---------------- Business modifiers ----------------

function plotModifiers(plotIndex) {
  const mods = { output: 1, revenue: 1, inputSave: 0, speed: 1, wage: 0, skill: 0, count: 0 };
  for (const s of staffOnPlot(plotIndex)) {
    const t = STAFF_TRAITS[s.trait];
    mods.output   *= 1 + (t?.output ?? 0);
    mods.revenue  *= 1 + (t?.revenue ?? 0);
    mods.inputSave = Math.min(0.7, mods.inputSave + (t?.inputSave ?? 0));
    mods.speed    *= 1 - (t?.speed ?? 0);
    mods.wage     += s.wage;
    mods.skill    += s.skill;
    mods.count++;
  }
  return mods;
}

/** Everything the UI needs to describe a plot's economics. */
export function plotReport(plotIndex) {
  const plot = state.town.plots[plotIndex];
  if (!plot?.building) return null;
  const def = getBuilding(plot.building);
  const mods = plotModifiers(plotIndex);
  const levelMult = 1 + (plot.level - 1) * 0.6;
  const skillMult = 1 + mods.skill * 0.08;

  const cycleMs = Math.max(4000, def.cycleMs * mods.speed);
  const revMid = ((def.revenue[0] + def.revenue[1]) / 2) * levelMult * mods.revenue * skillMult;
  const needs = {};
  for (const [cat, qty] of Object.entries(def.inputs || {})) {
    needs[cat] = Math.max(1, Math.ceil(qty * plot.level * (1 - mods.inputSave)));
  }
  const stocked = Object.fromEntries(Object.keys(needs).map(c => [c, stockForCategory(plot, c)]));
  const cyclesLeft = Object.keys(needs).length
    ? Math.min(...Object.entries(needs).map(([c, n]) => Math.floor(stocked[c] / n)))
    : Infinity;

  return {
    plot, def, mods, levelMult, cycleMs,
    staffed: mods.count > 0,
    fullyStaffed: mods.count >= def.staffSlots,
    needs, stocked, cyclesLeft,
    wagePerCycle: mods.wage,
    revenuePerCycle: revMid,
    profitPerCycle: revMid - mods.wage,
    profitPerMin: (revMid - mods.wage) / (cycleMs / 60000),
    starved: Object.keys(needs).length > 0 && cyclesLeft < 1,
  };
}

// ---------------- The business tick ----------------

function completeCycle(plotIndex, plot, def, mods) {
  const levelMult = 1 + (plot.level - 1) * 0.6;
  const skillMult = 1 + mods.skill * 0.08;

  // consume inputs
  for (const [cat, qty] of Object.entries(def.inputs || {})) {
    const need = Math.max(1, Math.ceil(qty * plot.level * (1 - mods.inputSave)));
    if (stockForCategory(plot, cat) < need) return false;
  }
  for (const [cat, qty] of Object.entries(def.inputs || {})) {
    const need = Math.max(1, Math.ceil(qty * plot.level * (1 - mods.inputSave)));
    consumeCategory(plot, cat, need);
  }

  // wages first — no coin, no shift
  if (mods.wage > 0) {
    if (state.gold < mods.wage) {
      state.town.unpaid = (state.town.unpaid || 0) + 1;
      return false;
    }
    spendGold(mods.wage);
  }

  // revenue
  const rev = def.revenue[0] + Math.random() * (def.revenue[1] - def.revenue[0]);
  const gained = addGold(rev * levelMult * mods.revenue * skillMult, { silent: true });
  state.town.lifetimeRevenue = (state.town.lifetimeRevenue || 0) + gained;
  state.town.cycles = (state.town.cycles || 0) + 1;

  // passive resource generation
  for (const [itemId, qty] of Object.entries(def.generates || {})) {
    const n = Math.max(1, Math.round(qty * plot.level * mods.output));
    addItem(itemId, n);
  }
  // exclusive goods
  for (const [itemId, qty] of Object.entries(def.produces || {})) {
    const n = Math.max(1, Math.round(qty * mods.output));
    addItem(itemId, n);
  }
  emit('town-cycle', { plotIndex, gained });
  return true;
}

export function tickTown(dt) {
  const t = state.town;
  if (!t?.unlocked) return;
  let any = false;

  for (let i = 0; i < t.plots.length; i++) {
    const plot = t.plots[i];
    if (!plot.building) continue;
    const def = getBuilding(plot.building);
    if (!def) continue;
    const mods = plotModifiers(i);
    if (mods.count === 0) continue;          // unstaffed buildings sit idle
    if (plotHalted(plot)) continue;          // shut down after a raid

    const cycleMs = Math.max(4000, def.cycleMs * mods.speed);
    plot.progress = (plot.progress || 0) + dt;
    let guard = 0;
    while (plot.progress >= cycleMs && guard++ < 40) {
      plot.progress -= cycleMs;
      if (!completeCycle(i, plot, def, mods)) { plot.progress = 0; break; }
      any = true;
    }
  }
  if (any) emit('town-earned', {});
}

// ---------------- Town-wide buffs ----------------

/** Aggregate buff value across all staffed buildings of every type. */
export function townBuff(key) {
  const t = state.town;
  if (!t?.unlocked) return 0;
  // Notable residents contribute their own permanent bonuses
  let total = residentBonus(key);
  for (let i = 0; i < t.plots.length; i++) {
    const plot = t.plots[i];
    if (!plot.building) continue;
    const def = getBuilding(plot.building);
    if (def?.buff?.key !== key) continue;
    if (staffOnPlot(i).length === 0) continue;   // must be staffed to count
    total += def.buff.value * plot.level;
  }
  return total;
}

export function activeTownBuffs() {
  const out = [];
  const seen = new Set();
  for (let i = 0; i < state.town.plots.length; i++) {
    const plot = state.town.plots[i];
    if (!plot.building) continue;
    const def = getBuilding(plot.building);
    if (!def?.buff) continue;
    if (staffOnPlot(i).length === 0) continue;
    if (seen.has(def.buff.key)) continue;
    seen.add(def.buff.key);
    out.push({ key: def.buff.key, label: def.buff.label, total: townBuff(def.buff.key) });
  }
  return out;
}

// ---------------- Offline ----------------

export function processTownOffline(seconds) {
  const t = state.town;
  if (!t?.unlocked) return null;
  const gains = { gold: 0, items: {}, cycles: 0 };
  const goldBefore = state.gold;

  for (let i = 0; i < t.plots.length; i++) {
    const plot = t.plots[i];
    if (!plot.building) continue;
    const def = getBuilding(plot.building);
    const mods = plotModifiers(i);
    if (!def || mods.count === 0) continue;
    const cycleMs = Math.max(4000, def.cycleMs * mods.speed);
    let cycles = Math.floor((seconds * 1000) / cycleMs);
    let done = 0;
    while (cycles-- > 0) {
      const before = { ...plot.stock };
      if (!completeCycle(i, plot, def, mods)) break;
      void before;
      done++;
      for (const [itemId, qty] of Object.entries(def.generates || {})) {
        gains.items[itemId] = (gains.items[itemId] || 0) + Math.max(1, Math.round(qty * plot.level * mods.output));
      }
      for (const [itemId, qty] of Object.entries(def.produces || {})) {
        gains.items[itemId] = (gains.items[itemId] || 0) + Math.max(1, Math.round(qty * mods.output));
      }
    }
    gains.cycles += done;
  }
  gains.gold = Math.max(0, state.gold - goldBefore);
  return gains.cycles > 0 ? gains : null;
}

// ---------------- Init ----------------

export function initTown() {
  const t = state.town;
  if (!t.plots || t.plots.length !== PLOT_COUNT) {
    t.plots = Array.from({ length: PLOT_COUNT }, () => ({
      owned: false, building: null, level: 0, stock: {}, progress: 0,
    }));
  }
  if (!t.applicants || t.applicants.length === 0) refreshApplicants({ free: true });
}
