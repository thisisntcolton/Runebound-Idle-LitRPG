// ============================================================
// THE SYNDICATE REPO MEN — Era II's antagonist, and its fail state
//
// Everything you own in the Wastes is, administratively speaking,
// unlicensed. The Repo Men come to correct that. They are not monsters;
// they are a department, and they arrive with paperwork.
//
// The design rule that matters: THEY TAKE SOMETHING REAL, AND YOU CAN GO
// AND GET IT BACK. A raid you lose or sleep through costs you a pet, a
// building level or an enchant — genuine stakes, which the game otherwise
// lacks — but the seized item goes to a camp, and clearing that camp
// returns it. That turns a punishment for being away into a quest, which
// is the only version of real loss that belongs in an idle game.
//
// Nothing is ever destroyed. Only repossessed.
// ============================================================
import { state, combatLevel } from '../core/state.js';
import { getItem, ITEMS } from '../data/items.js';
import { getSpecies } from '../data/pets.js';
import { getBuilding } from '../data/town.js';
import { emit } from '../core/events.js';
import { fmt } from '../core/format.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setRepoUIHooks(h) { hooks = h; }

export const REPO = {
  FIRST_RAID_MS: 25 * 60 * 1000,     // grace period after arriving in the Wastes
  MIN_MS: 30 * 60 * 1000,
  MAX_MS: 55 * 60 * 1000,
  WINDOW_MS: 10 * 60 * 1000,          // how long you have to answer a notice
  CAMP_CLEARS: 12,                    // Repo Men to defeat to recover a seizure
  BRIBE_PER_LEVEL: 2200,              // the cost of simply paying them off

  // ---- Fallbacks, for when there is nothing conventional to take ----
  //
  // A combat player who never builds, never enchants and keeps one pet had
  // an empty candidate list, so the raid silently rescheduled itself and
  // the Syndicate simply never happened to them. An antagonist that
  // no-ops is worse than no antagonist: it is a system the player is told
  // about and never sees. So the department always finds something.
  LEVY_SHARE: 0.12,                   // of gold on hand
  LEVY_MIN: 2500,                     // below this, gold is not worth the trip
  MATERIAL_SHARE: 0.40,               // of the fattest stack in the bag
  MATERIAL_MIN_QTY: 10,
  LIEN_RATE: 0.15,                    // gold penalty while a lien is held
};

export function repo() {
  if (!state.repo) {
    state.repo = { nextAt: 0, notice: null, camps: [], seized: 0, recovered: 0, repelled: 0 };
  }
  return state.repo;
}

export function unlocked() { return (state.era || 1) >= 2; }

// ---------------- What they can take ----------------
//
// Ordered by what hurts least. They will not take your only pet if you
// have a building to lose, and they will never leave you with nothing.

function seizureCandidates() {
  const out = [];

  for (const plot of state.town?.plots || []) {
    if (plot.building && plot.level > 1) {
      out.push({ kind: 'building', plotIndex: state.town.plots.indexOf(plot),
                 building: plot.building, weight: 30 });
    }
  }
  for (const [itemId, lvl] of Object.entries(state.enchants || {})) {
    if (lvl > 0) out.push({ kind: 'enchant', itemId, level: lvl, weight: 22 });
  }
  const pets = Object.values(state.pets?.owned || {});
  // Never the last pet, and never the one at your side: taking the
  // companion you have raised for forty hours while you were asleep is
  // the kind of "stakes" that makes people stop playing.
  const takeable = pets.filter(p => p.id !== state.pets.active);
  if (pets.length > 1 && takeable.length) {
    for (const p of takeable) out.push({ kind: 'pet', petId: p.id, weight: 14 });
  }
  return out;
}

// ---------------- The fallbacks ----------------
//
// Ordered by preference, and the last one always succeeds. The rule from
// the top of the file still holds: nothing is destroyed, everything goes
// into a crate with a reference number, and every crate can be walked
// back out of a camp.

/** The fattest stack in the bag, by total sell value. */
function materialSeizure() {
  let best = null;
  for (const [itemId, qty] of Object.entries(state.inventory || {})) {
    if (qty < REPO.MATERIAL_MIN_QTY) continue;
    const def = ITEMS[itemId];
    // Equipment is worn or sold, not stacked; taking a stack of resources
    // is the recognisable version of "they cleared out the shed".
    if (!def || def.type === 'equipment') continue;
    const value = (def.sell || 0) * qty;
    if (!best || value > best.value) {
      best = { kind: 'materials', itemId, qty: Math.max(1, Math.floor(qty * REPO.MATERIAL_SHARE)),
               value, weight: 20 };
    }
  }
  if (!best || best.value <= 0) return null;
  delete best.value;
  return best;
}

/** A share of the coin on hand. */
function levySeizure() {
  const amount = Math.floor((state.gold || 0) * REPO.LEVY_SHARE);
  if (amount < REPO.LEVY_MIN) return null;
  return { kind: 'levy', amount, weight: 18 };
}

/**
 * The floor. If you own nothing they can crate, they attach a charge to
 * the ground you are standing on, and take a cut of everything you earn
 * until you go and void it. Always available, which is the entire point.
 */
function lienSeizure() {
  return { kind: 'lien', rate: REPO.LIEN_RATE, weight: 1 };
}

function pickSeizure() {
  const pool = seizureCandidates();
  if (pool.length) {
    const total = pool.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * total;
    for (const c of pool) { r -= c.weight; if (r <= 0) return c; }
    return pool[0];
  }
  // Nothing conventional. Go down the list; the last rung never fails.
  const fallbacks = [materialSeizure(), levySeizure()].filter(Boolean);
  if (fallbacks.length) return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  // One lien at a time. A player with nothing should not accumulate five.
  if (camps().some(c => c.held?.kind === 'lien')) return null;
  return lienSeizure();
}

export function describeSeizure(s) {
  if (!s) return 'nothing they could find';
  if (s.kind === 'building') {
    const def = getBuilding(s.building);
    return `${def?.icon || '🏚️'} a level from your ${def?.name || 'building'}`;
  }
  if (s.kind === 'enchant') {
    const item = getItem(s.itemId);
    return `${item?.icon || '✨'} the enchantment on your ${item?.name || 'gear'}`;
  }
  if (s.kind === 'pet') {
    const pet = state.pets?.owned?.[s.petId];
    const sp = pet ? getSpecies(pet.species) : null;
    return `${sp?.icon || '🐾'} ${pet?.name || 'your pet'}`;
  }
  if (s.kind === 'materials') {
    const item = getItem(s.itemId);
    return `${item?.icon || '📦'} ${fmt(s.qty)}× ${item?.name || 'your materials'}`;
  }
  if (s.kind === 'levy') {
    return `🪙 ${fmt(s.amount)} gold, as a levy`;
  }
  if (s.kind === 'lien') {
    return `📎 a lien on the ground you are standing on (−${Math.round(s.rate * 100)}% gold)`;
  }
  return 'something of yours';
}

// ---------------- Liens ----------------
//
// Read by the gold multiplier through the same lazy-hook pattern the
// town, pets, class and Ledger use. Liens stack with nothing; there is
// only ever one, and clearing its camp ends it.

export function repoPenalty(key) {
  if (key !== 'gold') return 0;
  let rate = 0;
  for (const c of camps()) if (c.held?.kind === 'lien') rate += c.held.rate || 0;
  return -Math.min(0.5, rate);
}

// ---------------- Notices ----------------

function schedule(first = false) {
  const r = repo();
  r.nextAt = Date.now() + (first
    ? REPO.FIRST_RAID_MS
    : REPO.MIN_MS + Math.random() * (REPO.MAX_MS - REPO.MIN_MS));
}

export function pendingNotice() {
  const r = repo();
  if (!r.notice) return null;
  if (Date.now() > r.notice.expiresAt) return null;
  return r.notice;
}

export function bribeCost() {
  return Math.floor(REPO.BRIBE_PER_LEVEL * Math.max(1, combatLevel()));
}

function serveNotice() {
  const target = pickSeizure();
  if (!target) { schedule(); return; }   // nothing worth taking; try later
  const r = repo();
  r.notice = { target, servedAt: Date.now(), expiresAt: Date.now() + REPO.WINDOW_MS };

  emit('notify', { type: 'combat',
    text: `📄 SYNDICATE NOTICE OF REPOSSESSION — they are here for ${describeSeizure(target)}.` });
  hooks.popup('NOTICE OF REPOSSESSION',
    `📄 <b>The Syndicate</b><br><span style="font-size:12px;color:var(--text-dim)">They have come for ${describeSeizure(target)}. Answer it from the Wastes.</span>`,
    { ttl: 10 });
  emit('repo-notice', { target });
  emit('state-changed');
}

// ---------------- Answering ----------------

/** Fight them off yourself. Free, but you have to be able to win. */
export function contest() {
  const notice = pendingNotice();
  if (!notice) return false;
  const r = repo();
  r.notice = null;
  r.repelled = (r.repelled || 0) + 1;
  schedule();

  hooks.queueModal(`
    <div class="modal-tag glitch-tag">◈ CONTESTED ◈</div>
    <div class="modal-title">📄 Notice Refused</div>
    <div class="modal-body" style="line-height:1.75">
      <p>You meet them at the edge of the slab. There are four of them and they are
      wearing something between armour and a uniform, and the one at the front is
      already reading from a form.</p>
      <p>Holt does not let him finish it.</p>
      <p class="muted">They will be back. They are always going to be back. But not today,
      and not for ${describeSeizure(notice.target)}.</p>
      <p style="color:var(--sys-blue)">[ SYSTEM ] Collection attempt logged as unsuccessful.
      A stronger team has been requisitioned.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Good</button></div>
  `);
  emit('repo-resolved', { how: 'contest' });
  emit('state-changed');
  return true;
}

/** Pay them off. Costs gold, keeps everything. */
export function settle() {
  const notice = pendingNotice();
  if (!notice) return false;
  const cost = bribeCost();
  if (state.gold < cost) {
    emit('notify', { type: 'sys', text: `You cannot cover that (${fmt(cost)} gold).` });
    return false;
  }
  state.gold -= cost;
  const r = repo();
  r.notice = null;
  schedule();

  hooks.queueModal(`
    <div class="modal-tag">◈ SETTLED ◈</div>
    <div class="modal-title">📄 Account Brought Current</div>
    <div class="modal-body" style="line-height:1.75">
      <p>The one at the front takes the coin, counts it, and issues a receipt. An actual
      receipt, on actual paper, with a reference number.</p>
      <p>Marrow has kept every one of them. He says they will be worth something.</p>
      <p class="muted">Paid ${fmt(cost)} gold. ${describeSeizure(notice.target)} stays where it is.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Take the receipt</button></div>
  `);
  emit('repo-resolved', { how: 'settle', cost });
  emit('state-changed');
  return true;
}

// ---------------- Seizure ----------------

/** Apply the seizure and stand up a camp holding it. Never destroys. */
export function seize(target, { timedOut = false } = {}) {
  const r = repo();
  const held = { ...target };

  if (target.kind === 'building') {
    const plot = state.town.plots[target.plotIndex];
    if (!plot?.building || plot.level <= 1) { schedule(); return null; }
    plot.level -= 1;
    held.building = plot.building;
  } else if (target.kind === 'enchant') {
    const lvl = state.enchants?.[target.itemId] || 0;
    if (lvl <= 0) { schedule(); return null; }
    held.level = lvl;
    delete state.enchants[target.itemId];
  } else if (target.kind === 'pet') {
    const pet = state.pets?.owned?.[target.petId];
    if (!pet) { schedule(); return null; }
    held.pet = pet;                       // the whole record travels with them
    delete state.pets.owned[target.petId];
    if (state.pets.active === target.petId) state.pets.active = null;
  } else if (target.kind === 'materials') {
    // Re-read the bag: the notice was served up to ten minutes ago and the
    // player may well have sold or smelted the stack since.
    const have = state.inventory?.[target.itemId] || 0;
    const take = Math.min(have, target.qty);
    if (take <= 0) { schedule(); return null; }
    held.qty = take;
    state.inventory[target.itemId] -= take;
    if (state.inventory[target.itemId] <= 0) delete state.inventory[target.itemId];
  } else if (target.kind === 'levy') {
    const take = Math.min(state.gold || 0, target.amount);
    if (take <= 0) { schedule(); return null; }
    held.amount = take;
    state.gold -= take;
  } else if (target.kind === 'lien') {
    // Nothing to remove. The charge IS the seizure.
    held.rate = target.rate;
  }

  const camp = {
    id: 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e5).toString(36),
    held,
    cleared: 0,
    needed: REPO.CAMP_CLEARS,
    takenAt: Date.now(),
  };
  r.camps.push(camp);
  r.notice = null;
  r.seized = (r.seized || 0) + 1;
  schedule();

  const isLien = held.kind === 'lien';
  hooks.queueModal(`
    <div class="modal-tag glitch-tag">◈ ${isLien ? 'ENCUMBERED' : 'REPOSSESSED'} ◈</div>
    <div class="modal-title">📄 ${timedOut ? 'You Were Not There' : isLien ? 'Charge Attached' : 'Collection Complete'}</div>
    <div class="modal-body" style="line-height:1.75">
      ${timedOut ? '<p class="muted">The notice expired. They do not need you present to collect.</p>' : ''}
      ${isLien ? `
        <p>They go through everything, twice, with a clipboard. You own nothing they are
        authorised to crate. This does not read to them as a reason to leave.</p>
        <p>So instead the one at the front kneels, drives a numbered stake into the slab,
        and photographs it. A charge has been attached to the ground.</p>
        <p><b>${Math.round((held.rate || 0) * 100)}% of everything you earn</b> now goes
        somewhere else, and will keep going there.</p>`
      : `
        <p>They took ${describeSeizure(held)}, tagged it, logged it, and walked it out
        across the grey with the unhurried confidence of people who have done this before
        and have never once been stopped.</p>
        <p><b>They have not destroyed it.</b> It is in a camp out in the Wastes, in a crate,
        with a reference number on it.</p>`}
      <p style="color:var(--gold)">Find the camp. Clear ${REPO.CAMP_CLEARS} of them.
        ${isLien ? 'Pull the stake.' : 'Take it back.'}</p>
    </div>
    <div class="modal-actions"><button class="btn btn-danger" data-act="close-modal">${isLien ? 'Find the stake' : 'Go and get it'}</button></div>
  `);
  emit('repo-seized', { camp });
  emit('town-changed', {});
  emit('pets-changed', {});
  emit('state-changed');
  return camp;
}

// ---------------- Recovery ----------------

export function camps() { return repo().camps || []; }
export function activeCamp() { return camps()[0] || null; }

/** Called on every Repo Man killed. Returns a camp if one is finished. */
export function creditClear() {
  const camp = activeCamp();
  if (!camp) return null;
  camp.cleared = (camp.cleared || 0) + 1;
  if (camp.cleared < camp.needed) {
    emit('repo-progress', { camp });
    emit('state-changed');
    return null;
  }
  return recoverCamp(camp.id);
}

export function recoverCamp(campId) {
  const r = repo();
  const idx = r.camps.findIndex(c => c.id === campId);
  if (idx === -1) return null;
  const camp = r.camps[idx];
  const held = camp.held;
  r.camps.splice(idx, 1);
  r.recovered = (r.recovered || 0) + 1;

  let what = 'your property';
  if (held.kind === 'building') {
    const plot = state.town.plots[held.plotIndex];
    if (plot?.building) plot.level += 1;
    what = `${getBuilding(held.building)?.name || 'your building'} is whole again`;
  } else if (held.kind === 'enchant') {
    if (!state.enchants) state.enchants = {};
    state.enchants[held.itemId] = held.level;
    what = `the enchantment on your ${getItem(held.itemId)?.name || 'gear'} is back`;
  } else if (held.kind === 'pet') {
    state.pets.owned[held.pet.id] = held.pet;
    // Being in a crate for a while is not good for anyone.
    held.pet.happy = Math.max(10, (held.pet.happy || 100) - 45);
    held.pet.careAt = Date.now();
    if (!state.pets.active) state.pets.active = held.pet.id;
    what = `${held.pet.name} is back, and is not speaking to anyone`;
  } else if (held.kind === 'materials') {
    if (!state.inventory) state.inventory = {};
    state.inventory[held.itemId] = (state.inventory[held.itemId] || 0) + held.qty;
    what = `${fmt(held.qty)}× ${getItem(held.itemId)?.name || 'your materials'} back in the bag`;
  } else if (held.kind === 'levy') {
    // Straight back into the purse, ungarnished. The Ledger did not
    // collect this and has no claim on its return.
    state.gold = (state.gold || 0) + held.amount;
    what = `${fmt(held.amount)} gold back, to the coin`;
  } else if (held.kind === 'lien') {
    what = 'the lien on the ground is void, and your earnings are your own again';
  }

  hooks.queueModal(`
    <div class="modal-tag">◈ RECOVERED ◈</div>
    <div class="modal-title">📦 Reference Number Voided</div>
    <div class="modal-body" style="line-height:1.75">
      <p>The camp is a ring of crates and a folding table. On the table there is a ledger,
      and in the ledger there is a line with your name on it, and next to it a box marked
      <i>COLLECTED</i> with a tick in it.</p>
      <p>Pell takes the pen. Pell unticks it.</p>
      <p style="color:var(--gold)">${what}.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Go home</button></div>
  `);
  emit('repo-recovered', { held });
  emit('town-changed', {});
  emit('pets-changed', {});
  emit('state-changed');
  return held;
}

// ---------------- Tick ----------------

export function tickRepo() {
  if (!unlocked()) return;
  const r = repo();
  const now = Date.now();

  if (r.notice && now > r.notice.expiresAt) {
    seize(r.notice.target, { timedOut: true });
    return;
  }
  if (r.notice) return;
  if (!r.nextAt) { schedule(true); return; }
  if (now >= r.nextAt) serveNotice();
}

export function initRepo() {
  const r = repo();
  if (unlocked() && !r.nextAt) schedule(true);
}
