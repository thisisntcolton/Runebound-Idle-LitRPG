// ============================================================
// TOWN SYSTEM — plots, buildings, staff, stock and the business tick
// ============================================================
import { state } from '../core/state.js';
import { BUILDINGS, BUILDING_LIST, getBuilding, BUILDING_UNLOCK_LEVEL,
         MAX_BUILDING_LEVEL, PLOT_COUNT, plotCost, upgradeCostFor,
         INPUT_CATEGORIES, STAFF_TRAITS, rollApplicant, APPLICANT_POOL_SIZE,
         REROLL_COST, plotsUnlockedAt, WAGES } from '../data/town.js';
import { getItem } from '../data/items.js';
import { addGold, spendGold, addItem, removeItem, itemCount } from './inventory.js';
import { emit } from '../core/events.js';
import { plotHalted } from './unstable.js';
import { residentBonus } from './npcs.js';
import { classBonus } from '../core/state.js';

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

/** Staff slots on a building, including the Artisan's extra. */
export function staffSlotsFor(def) {
  return (def?.staffSlots || 0) + classBonus('staff_slots');
}

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
  const cost = discounted(plotCost(index));
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

/**
 * Apply the Artisan's construction discount to any cost.
 * Everything that quotes OR charges a build price goes through this, so a
 * discount can never be shown and then not honoured.
 */
export function discounted(cost) {
  const off = classBonus('build_cost');   // negative for a discount
  if (!off) return cost;
  const mult = Math.max(0.1, 1 + off);
  return {
    gold: Math.floor(cost.gold * mult),
    items: Object.fromEntries(Object.entries(cost.items || {})
      .map(([id, q]) => [id, Math.max(1, Math.ceil(q * mult))])),
  };
}

export function canAfford(cost) {
  const c = discounted(cost);
  if (state.gold < c.gold) return false;
  return Object.entries(c.items || {}).every(([id, q]) => itemCount(id) >= q);
}

export function build(plotIndex, buildingId) {
  const plot = state.town.plots[plotIndex];
  const def = getBuilding(buildingId);
  if (!plot || !plot.owned || plot.building || !def) return false;
  if (!buildingUnlocked(buildingId)) return false;
  if (!canAfford(def.cost)) return false;

  const price = discounted(def.cost);
  spendGold(price.gold);
  for (const [id, qty] of Object.entries(price.items)) removeItem(id, qty);
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
  const cost = discounted(upgradeCostFor(def, plot.level));
  if (!canAfford(upgradeCostFor(def, plot.level))) return false;
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
  if (staffOnPlot(plotIndex).length >= staffSlotsFor(def)) {
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
  plot.stockWarned = false;      // fresh stock, fresh warning if it runs dry again
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

/** Items in a plot's stock matching a category, cheapest first. */
function categoryEntries(plot, category) {
  const cat = INPUT_CATEGORIES[category];
  if (!cat) return [];
  return Object.entries(plot.stock || {})
    .map(([id, qty]) => ({ id, qty, item: getItem(id) }))
    .filter(e => e.item && cat.match(e.item))
    .sort((a, b) => (a.item.sell || 0) - (b.item.sell || 0));
}

/**
 * What `need` units of a category are WORTH, without consuming them.
 * Cheapest first, matching what consumeCategory will actually take, so the
 * projection the UI shows is the number the next shift really pays.
 */
function categoryValue(plot, category, need) {
  let taken = 0, value = 0;
  for (const e of categoryEntries(plot, category)) {
    if (taken >= need) break;
    const take = Math.min(e.qty, need - taken);
    value += take * (e.item.sell || 0);
    taken += take;
  }
  return value;
}

/**
 * Consume `need` units matching a category, cheapest items first, and
 * return the vendor value of what was taken.
 *
 * That value is the whole point: a shift's pay is mostly a markup on the
 * goods it moved, so ten mythril ore through a stall is worth vastly more
 * than ten logs. Cheapest-first is deliberate — it burns your junk before
 * it touches the good stuff.
 */
function consumeCategory(plot, category, need) {
  let taken = 0, value = 0;
  for (const e of categoryEntries(plot, category)) {
    if (taken >= need) break;
    const take = Math.min(e.qty, need - taken);
    plot.stock[e.id] -= take;
    if (plot.stock[e.id] <= 0) delete plot.stock[e.id];
    value += take * (e.item.sell || 0);
    taken += take;
  }
  return { taken, value };
}

/**
 * How hard a building marks up the goods it moves. Rises with level, so
 * upgrading a Market Stall is what makes high-tier ore worth routing
 * through it rather than dumping on a vendor.
 */
export function markupFor(def, level) {
  return (def.markup ?? 1.0) * (1 + (level - 1) * 0.22);
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
  const needs = {};
  for (const [cat, qty] of Object.entries(def.inputs || {})) {
    needs[cat] = Math.max(1, Math.ceil(qty * plot.level * (1 - mods.inputSave)));
  }
  const stocked = Object.fromEntries(Object.keys(needs).map(c => [c, stockForCategory(plot, c)]));
  const cyclesLeft = Object.keys(needs).length
    ? Math.min(...Object.entries(needs).map(([c, n]) => Math.floor(stocked[c] / n)))
    : Infinity;

  // Pay = a flat wage for the labour, plus a markup on the value of the
  // goods this shift will actually move. Projected off the real stock, so
  // the panel tells you what the NEXT shift pays, not a generic average.
  const markup = markupFor(def, plot.level);
  let goodsValue = 0;
  for (const [cat, n] of Object.entries(needs)) goodsValue += categoryValue(plot, cat, n);
  const labour = ((def.revenue[0] + def.revenue[1]) / 2) * levelMult;
  const revMid = (labour + goodsValue * markup) * mods.revenue * skillMult * (1 + classBonus('town_revenue'));

  // Payroll: the hired rate, scaled by how big an operation they are
  // running, plus a commission on the goods they actually move. Without
  // the commission a mature building's wage bill is a rounding error
  // against its revenue and the entire staffing system stops mattering.
  const wageLevelMult = 1 + (plot.level - 1) * WAGES.PER_LEVEL;
  const commission = goodsValue * markup * WAGES.COMMISSION * mods.count;
  const payroll = mods.wage * wageLevelMult + commission;

  return {
    plot, def, mods, levelMult, cycleMs,
    staffed: mods.count > 0,
    fullyStaffed: mods.count >= staffSlotsFor(def),
    needs, stocked, cyclesLeft,
    markup, goodsValue, labour,
    wagePerCycle: payroll,
    baseWagePerCycle: mods.wage * wageLevelMult,
    commissionPerCycle: commission,
    revenuePerCycle: revMid,
    profitPerCycle: revMid - payroll,
    profitPerMin: (revMid - payroll) / (cycleMs / 60000),
    starved: Object.keys(needs).length > 0 && cyclesLeft < 1,
  };
}

// ---------------- Shift problems, reported once ----------------
//
// A halted building used to just go quiet, which reads as "working" until
// you happen to open the town and notice the profit is zero. These fire a
// single loud warning per outage and re-arm only once the building runs
// again, so a permanently empty stall never becomes wallpaper.

const STOCKOUT_QUIET_MS = 5 * 60 * 1000;

function reportStockOut(plotIndex, plot, def, category) {
  const now = Date.now();
  if (plot.stockWarned && now - (plot.stockWarnedAt || 0) < STOCKOUT_QUIET_MS) return;
  plot.stockWarned = true;
  plot.stockWarnedAt = now;
  const label = INPUT_CATEGORIES[category]?.label || category;
  emit('notify', { type: 'combat',
    text: `⚠️ ${def.icon} ${def.name} (parcel ${plotIndex + 1}) is out of ${label} and has stopped working.` });
  emit('town-stockout', { plotIndex, building: def.id, name: def.name, icon: def.icon, category, label });
  emit('town-changed', {});
}

function reportUnpaid(plotIndex, plot, def, wage) {
  const now = Date.now();
  if (plot.wageWarned && now - (plot.wageWarnedAt || 0) < STOCKOUT_QUIET_MS) return;
  plot.wageWarned = true;
  plot.wageWarnedAt = now;
  emit('notify', { type: 'combat',
    text: `⚠️ ${def.icon} ${def.name} could not make payroll (${Math.ceil(wage).toLocaleString()} gold). The staff are standing around.` });
  emit('town-stockout', { plotIndex, building: def.id, name: def.name, icon: def.icon, category: 'wages', label: 'wages' });
  emit('town-changed', {});
}

// ---------------- The business tick ----------------

function completeCycle(plotIndex, plot, def, mods) {
  const levelMult = 1 + (plot.level - 1) * 0.6;
  const skillMult = 1 + mods.skill * 0.08;

  // consume inputs — a building that can't fill its order downs tools
  for (const [cat, qty] of Object.entries(def.inputs || {})) {
    const need = Math.max(1, Math.ceil(qty * plot.level * (1 - mods.inputSave)));
    if (stockForCategory(plot, cat) < need) {
      reportStockOut(plotIndex, plot, def, cat);
      return false;
    }
  }
  let goodsValue = 0;
  for (const [cat, qty] of Object.entries(def.inputs || {})) {
    const need = Math.max(1, Math.ceil(qty * plot.level * (1 - mods.inputSave)));
    goodsValue += consumeCategory(plot, cat, need).value;
  }
  plot.stockWarned = false;   // it's working again; re-arm the warning

  // Wages first — no coin, no shift. This must use the SAME payroll the
  // panel quotes, commission included, or the town's projected profit is
  // a number the game never actually charges.
  const payroll = Math.round(
    mods.wage * (1 + (plot.level - 1) * WAGES.PER_LEVEL)
    + goodsValue * markupFor(def, plot.level) * WAGES.COMMISSION * mods.count);
  if (payroll > 0) {
    if (state.gold < payroll) {
      state.town.unpaid = (state.town.unpaid || 0) + 1;
      reportUnpaid(plotIndex, plot, def, payroll);
      return false;
    }
    spendGold(payroll);
  }
  plot.wageWarned = false;

  // Revenue = flat labour + a markup on the value of the goods moved.
  const labour = def.revenue[0] + Math.random() * (def.revenue[1] - def.revenue[0]);
  const rev = labour * levelMult + goodsValue * markupFor(def, plot.level);
  const gained = addGold(rev * mods.revenue * skillMult * (1 + classBonus('town_revenue')), { silent: true });
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
