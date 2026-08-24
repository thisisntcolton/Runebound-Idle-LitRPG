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

export function canAscend() {
  return totalSkillLevel() >= ASCEND_MIN_TOTAL_LEVEL && pendingShards() > 0;
}

export function ascend() {
  if (!canAscend()) return false;
  const shards = pendingShards();
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
  };
  const fresh = defaultState();
  Object.assign(fresh, keep);
  replaceState(fresh);
  save();
  emit('ascended', { shards });
  emit('notify', { type: 'sys', text: `[ SYSTEM ] ASCENSION COMPLETE — +${shards} Fate Shards. The world resets; you do not.` });
  emit('state-changed');
  return true;
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
