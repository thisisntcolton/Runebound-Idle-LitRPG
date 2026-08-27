// ============================================================
// ASCENSION (prestige) + upgrade/hireling/perk purchases
// ============================================================
import { state, replaceState, defaultState, pendingShards, totalSkillLevel, perkEffect,
         ascendRequirement, pricedUpgrade } from '../core/state.js';
import { UPGRADES, HIRELINGS, PERKS, upgradeCost, perkCost,
         getUpgrade, getHireling, getPerk } from '../data/upgrades.js';
import { emit } from '../core/events.js';
import { spendGold } from './inventory.js';
import { save } from '../core/save.js';
import { snapshotCycle, showReturnReport } from './codex.js';

export function canAscend() {
  return totalSkillLevel() >= ascendRequirement() && pendingShards() > 0;
}


/**
 * Hearthwick survives Era II — but not untouched.
 *
 * "The town stays" was the reward for breaking the cycle, and it read as
 * one: a returning player found nine level-5 buildings fully staffed and
 * stocked, which is most of an economy handed over for free and a large
 * part of why the late cycles felt like they were already over.
 *
 * So it stays standing and takes a real hit instead. The buildings lose a
 * level, the stock is gone, and the staff do not wait around through a
 * reset for a landlord who stopped existing. Rebuilding is an evening's
 * work, not a fresh start — which is the difference between a cost and a
 * punishment.
 */
function strainTown(town) {
  const t = JSON.parse(JSON.stringify(town));
  let downgraded = 0, emptied = 0;
  for (const plot of t.plots || []) {
    if (!plot.building) continue;
    if (plot.level > 1) { plot.level--; downgraded++; }
    if (Object.keys(plot.stock || {}).length) emptied++;
    plot.stock = {};
    plot.progress = 0;
  }
  const lost = Object.keys(t.staff || {}).length;
  t.staff = {};
  t.applicants = [];
  t.applicantsAt = 0;
  t.lifetimeRevenue = 0;
  t.strain = { downgraded, emptied, staffLost: lost };
  return t;
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
    // Masteries — and ONLY Masteries. The talent trees themselves now go
    // with everything else: keeping every rank bought forever meant a
    // cycle-seven player walked back in already finished, and the late
    // cycles took minutes. What survives is one distilled bonus per class
    // CAPPED, and it stacks every time you cap that class again, so the
    // long game compounds instead of front-loading.
    masteries: state.masteries,
    casino: state.casino,
    // You cannot fall back into the box.
    era: state.era,
    eraEnteredAt: state.eraEnteredAt,
    eraSeen: state.eraSeen,
    // The Wastes do not reset with the world. Neither does what you owe,
    // nor what the Syndicate is holding of yours.
    ledger: state.ledger,
    repo: state.repo,
    salvage: state.salvage,
    // And the Vigil. Its health pool is measured in sessions; a reset that
    // took it back would make the whole encounter unfightable.
    worldBoss: state.worldBoss,
  };

  // What the road remembers, and how far down you have been, now reset
  // with the rest of it. Both were kept on the argument that they were
  // "yours" — but between them they meant a returning player skipped the
  // Descent's whole ramp and had already read every chain. The flags the
  // road sets are the exception: people still know your face, so the
  // chains that gate on having helped someone still fire.
  keep.adventure = {
    travelled: 0, encounters: 0, chains: 0,
    flags: state.adventure?.flags || {},
    seen: {}, active: null, nextAt: 0, progress: 0,
  };

  // Quests completed stay completed. Deeds read counters that survive the
  // reset — pets hatched, hands played, Wardens felled — so wiping the
  // completed list handed the player every one of their rewards again on
  // every single Ascension: 1,147,000 gold and 18 Fate Shards a cycle.
  keep.quests = {
    completed: state.quests?.completed || {},
    flags: state.quests?.flags || {},
    seenOffers: state.quests?.seenOffers || {},
    progress: {},
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

  // The Long Memory. The only Fate Perk that touches the reset itself:
  // every skill keeps a slice of its XP rather than going to zero. It is
  // deliberately the most expensive thing on the board, because it is the
  // only one that makes the next cycle shorter instead of richer.
  const carry = perkEffect('xp_carry');
  if (carry > 0) {
    for (const [id, s] of Object.entries(state.skills || {})) {
      if (!fresh.skills[id]) continue;
      const kept = Math.floor((s.xp || 0) * carry);
      // Hitpoints starts at level 10, so never drop it BELOW its floor.
      fresh.skills[id].xp = Math.max(fresh.skills[id].xp, kept);
    }
  }
  fresh.town = inTheWastes ? strainTown(state.town) : razed.town;
  replaceState(fresh);
  save();
  emit('ascended', { shards, razed: razed?.summary || null, era: fresh.era });
  emit('notify', { type: 'sys', text: inTheWastes
    ? `[ SYSTEM ] Reset logged: +${shards} Fate Shards. Settlement not reclaimed. Escalating.`
    : `[ SYSTEM ] ASCENSION COMPLETE — +${shards} Fate Shards. The world resets; you do not.` });
  if (inTheWastes) {
    const s = fresh.town.strain || {};
    emit('notify', { type: 'gold', text: 'Hearthwick is still standing. It is going to keep standing.' });
    emit('notify', { type: 'combat',
      text: `The reset still cost it: ${s.staffLost || 0} worker${s.staffLost === 1 ? '' : 's'} gone, `
          + `${s.downgraded || 0} building${s.downgraded === 1 ? '' : 's'} back a level, every storeroom empty.` });
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
  const cost = pricedUpgrade(def, lvl);
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
  const cost = pricedUpgrade(def, lvl);
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
