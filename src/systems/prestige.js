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
  };

  // Hearthwick DOES fall.
  //
  // It used to survive intact, and that quietly broke the reset: a returning
  // player walked out of Ascension into a fully staffed town still printing
  // gold, and rebought their entire hireling roster inside ten minutes. The
  // early cycle — the part the whole game is built around — simply vanished.
  //
  // So the buildings, staff, stock and coin are gone. What survives is
  // knowledge: the people you met, and the fact that you have done this
  // before. That is the seed the next town grows from.
  const razed = razeTown(state.town);

  const fresh = defaultState();
  Object.assign(fresh, keep);
  fresh.town = razed.town;
  replaceState(fresh);
  save();
  emit('ascended', { shards, razed: razed.summary });
  emit('notify', { type: 'sys', text: `[ SYSTEM ] ASCENSION COMPLETE — +${shards} Fate Shards. The world resets; you do not.` });
  if (razed.summary.buildings > 0) {
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
