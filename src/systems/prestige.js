// ============================================================
// ASCENSION (prestige) + upgrade/hireling/perk purchases
// ============================================================
import { state, replaceState, defaultState, pendingShards, totalSkillLevel,
         ASCEND_MIN_TOTAL_LEVEL } from '../core/state.js';
import { UPGRADES, HIRELINGS, PERKS, upgradeCost, perkCost,
         getUpgrade, getHireling, getPerk } from '../data/upgrades.js';
import { emit } from '../core/events.js';
import { spendGold } from './inventory.js';
import { save } from '../core/save.js';
import { snapshotCycle, showReturnReport } from './codex.js';

export function canAscend() {
  return totalSkillLevel() >= ASCEND_MIN_TOTAL_LEVEL && pendingShards() > 0;
}

export function ascend() {
  if (!canAscend()) return false;
  const shards = pendingShards();
  // Record what this cycle cost before the numbers stop existing.
  snapshotCycle();
  const keep = {
    shards: state.shards + shards,
    ascensions: state.ascensions + 1,
    perks: state.perks,
    stats: state.stats,
    settings: state.settings,
    createdAt: state.createdAt,
    log: state.log,
    // the story remembers, even when the world doesn't
    loreSeen: state.loreSeen,
    cycleSeen: state.cycleSeen,
    ending: state.ending,
    endingOfferedCycle: state.endingOfferedCycle,
    // so do your deeds
    achievements: state.achievements,
    activeTitle: state.activeTitle,
    // Your pets come with you. They were never the System's to take.
    pets: state.pets,
    // And everything you have worked out about this place.
    codex: state.codex,
    // You walk back in as yourself.
    look: state.look,
    // Talent trees are the one progression nothing ever takes back.
    classProgress: state.classProgress,
    // You cannot fall back into the box.
    era: state.era,
    eraEnteredAt: state.eraEnteredAt,
    eraSeen: state.eraSeen,
  };

  // Hearthwick falls — but only while the loop still owns it.
  //
  // In Era 1 the buildings, staff, stock and coin are gone every cycle. That
  // is the reset working: a town that survived intact let a returning player
  // rebuy their whole hireling roster inside ten minutes and skip the early
  // game entirely.
  //
  // In Era 2 it stops. Breaking the cycle is what takes the town off the
  // loop's books, and the raze the player has endured four times becomes the
  // thing they escaped rather than a rule they live under. By then the early
  // game is sixty hours behind them and there is nothing left to skip.
  const inTheWastes = (state.era || 1) >= 2;
  const razed = inTheWastes ? null : razeTown(state.town);

  const fresh = defaultState();
  Object.assign(fresh, keep);
  fresh.town = inTheWastes ? state.town : razed.town;
  replaceState(fresh);
  save();
  emit('ascended', { shards, razed: razed?.summary || null, era: fresh.era });
  emit('notify', { type: 'sys', text: inTheWastes
    ? `[ SYSTEM ] Reset logged: +${shards} Fate Shards. Settlement not reclaimed. Escalating.`
    : `[ SYSTEM ] ASCENSION COMPLETE — +${shards} Fate Shards. The world resets; you do not.` });
  if (inTheWastes) {
    emit('notify', { type: 'gold', text: 'Hearthwick is still standing. It is going to keep standing.' });
  } else if (razed.summary.buildings > 0) {
    emit('notify', { type: 'combat',
      text: `Hearthwick is gone. ${razed.summary.buildings} building${razed.summary.buildings === 1 ? '' : 's'} and ${razed.summary.staff} worker${razed.summary.staff === 1 ? '' : 's'} unmade with the rest of the world.` });
  }
  showReturnReport();
  emit('state-changed');
  return true;
}

/**
 * Return a blank town that still remembers who lives in this valley.
 *
 * Wiping `metNotables` too would be the harsher reset, but it would also
 * mean re-introducing yourself to the same six characters every cycle,
 * which is tedious rather than meaningful. The land resets; the
 * acquaintances don't.
 */
function razeTown(old = {}) {
  const summary = {
    buildings: (old.plots || []).filter(p => p.building).length,
    staff: Object.keys(old.staff || {}).length,
    revenue: old.lifetimeRevenue || 0,
  };
  const blank = defaultState().town;
  return {
    summary,
    town: {
      ...blank,
      name: old.name || blank.name,
      // the valley remembers its people, and that you have built here before
      metNotables: old.metNotables || {},
      timesRazed: (old.timesRazed || 0) + (summary.buildings > 0 ? 1 : 0),
      lifetimeRevenueAllCycles: (old.lifetimeRevenueAllCycles || 0) + summary.revenue,
    },
  };
}

// ---------- Purchases ----------
export function buyUpgrade(id) {
  const def = getUpgrade(id);
  if (!def) return false;
  const lvl = state.upgrades[id] || 0;
  if (lvl >= def.maxLevel) return false;
  const cost = upgradeCost(def, lvl);
  if (!spendGold(cost)) return false;
  state.upgrades[id] = lvl + 1;
  emit('notify', { type: 'sys', text: `Purchased ${def.name} (Rank ${lvl + 1})` });
  emit('state-changed');
  return true;
}

export function buyHireling(id) {
  const def = getHireling(id);
  if (!def) return false;
  const lvl = state.hirelings[id] || 0;
  if (lvl >= def.maxLevel) return false;
  const cost = upgradeCost(def, lvl);
  if (!spendGold(cost)) return false;
  state.hirelings[id] = lvl + 1;
  emit('notify', { type: 'sys', text: lvl === 0
    ? `${def.name} joins your cause!`
    : `${def.name} grows more diligent (Rank ${lvl + 1})` });
  if (lvl === 0) emit('hireling-hired', { id });
  emit('state-changed');
  return true;
}

export function buyPerk(id) {
  const def = getPerk(id);
  if (!def) return false;
  const lvl = state.perks[id] || 0;
  if (lvl >= def.maxLevel) return false;
  const cost = perkCost(def, lvl);
  if (state.shards < cost) return false;
  state.shards -= cost;
  state.perks[id] = lvl + 1;
  emit('notify', { type: 'sys', text: `[ SYSTEM ] Perk unlocked: ${def.name} ${lvl + 1}` });
  emit('state-changed');
  return true;
}
