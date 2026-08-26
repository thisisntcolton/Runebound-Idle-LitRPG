// ============================================================
// SALVAGE — excavating the Scrap Wastes
//
// One dig at a time, running against the wall clock so it behaves the
// same whether the tab is open or not. Sites rotate in and expire, so
// the Wastes are a place you check on rather than a menu you clear.
//
// The gating is the whole design: Salvage has no level, and every site is
// locked by a skill you already have. Reaching Mining 55 does not make
// your mining faster here, it makes a door open. That is what stops Era II
// from being a tenth progress bar.
// ============================================================
import { state, skillLevel, dropRateMultiplier } from '../core/state.js';
import { SITES, getSite, LOCKS, SITE_SLOTS, SITE_LIFETIME_MS, SITE_REFRESH_MS,
         MISHAPS } from '../data/salvage.js';
import { getItem } from '../data/items.js';
import { addItem } from './inventory.js';
import { emit } from '../core/events.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setSalvageUIHooks(h) { hooks = h; }

export function salvage() {
  if (!state.salvage) {
    state.salvage = { sites: [], active: null, nextSiteAt: 0, digs: 0, hauls: {} };
  }
  return state.salvage;
}

export function unlocked() { return (state.era || 1) >= 2; }

// ---------------- Lock checks ----------------

/** Every requirement on a site, with whether you currently meet it. */
export function requirementsFor(def) {
  return Object.entries(def.requires || {}).map(([lockId, level]) => {
    const lock = LOCKS[lockId];
    const have = lock?.skill ? skillLevel(lock.skill) : 999;
    return { lock, level, have, met: have >= level };
  });
}

export function canDig(def) {
  return requirementsFor(def).every(r => r.met);
}

// ---------------- Site rotation ----------------

function rollSiteDef() {
  const total = SITES.reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * total;
  for (const d of SITES) { r -= d.weight; if (r <= 0) return d; }
  return SITES[0];
}

function spawnSite() {
  const s = salvage();
  if (s.sites.length >= SITE_SLOTS) return;
  const def = rollSiteDef();
  s.sites.push({
    uid: 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e5).toString(36),
    site: def.id,
    foundAt: Date.now(),
    expiresAt: Date.now() + SITE_LIFETIME_MS,
  });
  emit('salvage-changed', {});
}

/** Drop expired sites and top the board back up. */
function rotateSites() {
  const s = salvage();
  const now = Date.now();
  const before = s.sites.length;
  s.sites = s.sites.filter(x => now < x.expiresAt || s.active?.uid === x.uid);
  if (s.sites.length !== before) emit('salvage-changed', {});

  if (!s.nextSiteAt) s.nextSiteAt = now + SITE_REFRESH_MS;
  if (now >= s.nextSiteAt) {
    s.nextSiteAt = now + SITE_REFRESH_MS;
    spawnSite();
  }
  // A completely empty board is dead air; fill it immediately on arrival.
  while (s.sites.length < 2) spawnSite();
}

export function sites() {
  return salvage().sites.map(x => ({ ...x, def: getSite(x.site) })).filter(x => x.def);
}

// ---------------- Digging ----------------

export function activeDig() {
  const s = salvage();
  if (!s.active) return null;
  const def = getSite(s.active.site);
  if (!def) { s.active = null; return null; }
  const elapsed = Date.now() - s.active.startedAt;
  return {
    ...s.active, def,
    elapsed,
    total: def.ms,
    remaining: Math.max(0, def.ms - elapsed),
    ready: elapsed >= def.ms,
  };
}

export function startDig(uid) {
  const s = salvage();
  if (s.active) return false;
  const entry = s.sites.find(x => x.uid === uid);
  if (!entry) return false;
  const def = getSite(entry.site);
  if (!def || !canDig(def)) return false;

  s.active = { uid, site: def.id, startedAt: Date.now() };
  emit('notify', { type: 'sys', text: `${def.icon} Digging: ${def.name}.` });
  emit('salvage-changed', {});
  emit('state-changed');
  return true;
}

export function cancelDig() {
  const s = salvage();
  if (!s.active) return false;
  s.active = null;
  emit('notify', { type: 'sys', text: 'You leave the dig where it is.' });
  emit('salvage-changed', {});
  emit('state-changed');
  return true;
}

function rollHaul(def) {
  const total = def.haul.reduce((a, h) => a + h.w, 0);
  let r = Math.random() * total;
  let pick = def.haul[def.haul.length - 1];
  for (const h of def.haul) { r -= h.w; if (r <= 0) { pick = h; break; } }
  const [lo, hi] = pick.qty;
  // Luck and drop-rate bonuses widen the haul rather than adding a
  // separate roll, so the number on the screen is the number you get.
  const mult = Math.min(2.2, dropRateMultiplier());
  const qty = Math.max(1, Math.round((lo + Math.random() * (hi - lo)) * mult));
  return { item: pick.item, qty };
}

function rollMishap() {
  const total = MISHAPS.reduce((a, m) => a + m.w, 0);
  let r = Math.random() * total;
  for (const m of MISHAPS) { r -= m.w; if (r <= 0) return m; }
  return MISHAPS[0];
}

/** Collect a finished dig. Returns a report, or null if it isn't done. */
export function collectDig() {
  const dig = activeDig();
  if (!dig || !dig.ready) return null;
  const s = salvage();
  const def = dig.def;

  // Two rolls per dig: what was down there, and whether it went wrong.
  const base = rollHaul(def);
  const wentWrong = Math.random() < def.instability;
  const mishap = wentWrong ? rollMishap() : null;
  const qty = wentWrong ? Math.max(1, Math.round(base.qty * (1 - mishap.lose))) : base.qty;

  addItem(base.item, qty);
  s.digs = (s.digs || 0) + 1;
  s.hauls[base.item] = (s.hauls[base.item] || 0) + qty;
  s.active = null;
  s.sites = s.sites.filter(x => x.uid !== dig.uid);

  const item = getItem(base.item);
  const report = { def, item, qty, mishap, wokeRepo: false };

  if (wentWrong) {
    emit('notify', { type: 'combat', text: `${def.icon} ${mishap.text}` });
    if (mishap.repo) report.wokeRepo = true;
  }
  emit('notify', { type: 'loot',
    text: `${def.icon} Salvaged ${item?.icon || ''} ${item?.name} ×${qty} from ${def.name}.` });
  emit('salvage-collected', report);
  emit('salvage-changed', {});
  emit('state-changed');
  return report;
}

// ---------------- Tick ----------------

let sweep = 0;
export function tickSalvage(dt) {
  if (!unlocked()) return;
  sweep += dt;
  if (sweep < 2000) return;
  sweep = 0;
  rotateSites();

  const dig = activeDig();
  if (dig?.ready) {
    // Digs complete on their own; leaving one finished forever would make
    // offline salvage strictly worse than sitting and watching it.
    collectDig();
  }
}

export function initSalvage() {
  salvage();
  if (unlocked()) rotateSites();
}

/** Everything the panel needs, in one call. */
export function salvageView() {
  return {
    unlocked: unlocked(),
    active: activeDig(),
    sites: sites().map(x => ({
      ...x,
      requirements: requirementsFor(x.def),
      diggable: canDig(x.def),
      expiresIn: Math.max(0, x.expiresAt - Date.now()),
    })).sort((a, b) => a.def.tier - b.def.tier),
    digs: salvage().digs || 0,
  };
}
