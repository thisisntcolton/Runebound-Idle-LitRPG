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
import { getItem } from '../data/items.js';
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

function pickSeizure() {
  const pool = seizureCandidates();
  if (!pool.length) return null;
  const total = pool.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of pool) { r -= c.weight; if (r <= 0) return c; }
  return pool[0];
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
  return 'something of yours';
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

  hooks.queueModal(`
    <div class="modal-tag glitch-tag">◈ REPOSSESSED ◈</div>
    <div class="modal-title">📄 ${timedOut ? 'You Were Not There' : 'Collection Complete'}</div>
    <div class="modal-body" style="line-height:1.75">
      ${timedOut ? '<p class="muted">The notice expired. They do not need you present to collect.</p>' : ''}
      <p>They took ${describeSeizure(target)}, tagged it, logged it, and walked it out
      across the grey with the unhurried confidence of people who have done this before
      and have never once been stopped.</p>
      <p><b>They have not destroyed it.</b> It is in a camp out in the Wastes, in a crate,
      with a reference number on it.</p>
      <p style="color:var(--gold)">Find the camp. Clear ${REPO.CAMP_CLEARS} of them. Take it back.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-danger" data-act="close-modal">Go and get it</button></div>
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
