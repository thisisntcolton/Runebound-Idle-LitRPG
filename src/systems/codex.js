// ============================================================
// THE CODEX ENGINE — discovery, ambient texture, and cycle memory
//
// Three jobs:
//   1. Watch what you do, and unlock Codex entries when you have earned them.
//   2. Drip ambient world-facts into the log while you play.
//   3. Remember the last cycle by NUMBER, so Ascension can quote it back.
//
// Design note on evaluation cost: unlock checks are declarative and cheap,
// but there is no point re-testing 40 entries on every one of ten ticks a
// second. Checks are debounced and, more importantly, an entry is dropped
// from the candidate list the moment it unlocks — so a long session
// converges on testing almost nothing.
// ============================================================
import { state, charLevel, skillLevel } from '../core/state.js';
import { CODEX, getEntry, TIDBITS, TIDBIT_MIN_MS, TIDBIT_MAX_MS,
         RETURN_LINES, CATEGORIES } from '../data/codex.js';
import { emit, on } from '../core/events.js';
import { fmt } from '../core/format.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setCodexUIHooks(h) { hooks = h; }

// ---------------- State shape ----------------

export function codex() {
  if (!state.codex) {
    state.codex = {
      seen: {},        // entryId -> unlock timestamp
      kills: {},       // monsterId -> count (Codex needs per-monster, stats only has totals)
      items: {},       // itemId -> true, ever held
      flags: {},       // one-off markers set by other systems
      lastCycle: null, // snapshot of the cycle you just finished
      unread: 0,
    };
  }
  return state.codex;
}

// ---------------- Unlock conditions ----------------

/**
 * Is this entry's `when` satisfied right now?
 * Every branch is a plain read of state, so this is safe to call often
 * and trivial to test without a browser.
 */
export function conditionMet(when) {
  if (!when) return false;
  const c = codex();

  if (when.skill) return skillLevel(when.skill.id) >= when.skill.level;
  if (when.charLevel !== undefined) return charLevel() >= when.charLevel;
  if (when.kills !== undefined) return (state.stats?.kills || 0) >= when.kills;
  if (when.killsOf) return (c.kills[when.killsOf.id] || 0) >= when.killsOf.n;
  if (when.stat) return (state.stats?.[when.stat.key] || 0) >= when.stat.n;
  if (when.cycle !== undefined) return (state.ascensions || 0) >= when.cycle;
  if (when.era !== undefined) return (state.era || 1) >= when.era;
  if (when.item) return !!c.items[when.item];
  if (when.flag) return !!c.flags[when.flag];
  if (when.pets !== undefined) return (state.pets?.hatched || 0) >= when.pets;
  if (when.townLevel !== undefined) return townLevelSafe() >= when.townLevel;
  if (when.population !== undefined) return populationSafe() >= when.population;
  if (when.townBuilding) {
    return (state.town?.plots || []).some(p => p.building === when.townBuilding);
  }
  return false;
}

// The town and npc systems import from here indirectly; read defensively
// rather than creating an import cycle for two numbers.
function townLevelSafe() {
  return (state.town?.plots || []).reduce((s, p) => s + (p.building ? p.level : 0), 0);
}
function populationSafe() {
  const buildings = (state.town?.plots || []).filter(p => p.building).length;
  return buildings * 3 + (state.town?.extraPopulation || 0);
}

// ---------------- Discovery ----------------

/** Entries still locked, in declaration order. */
function candidates() {
  const seen = codex().seen;
  return CODEX.filter(e => !seen[e.id]);
}

// Discoveries can arrive in bursts — three at once on a level-up, or a
// pile of them when a long-absent player loads in. A centre-screen popup
// per entry buries the game under its own lore, so only the first in a
// burst gets one; the rest land in the log and on the nav badge.
const POPUP_QUIET_MS = 45000;
let lastDiscoveryPopup = 0;

export function discover(entryId, { silent = false } = {}) {
  const entry = getEntry(entryId);
  const c = codex();
  if (!entry || c.seen[entryId]) return false;
  c.seen[entryId] = Date.now();
  c.unread = (c.unread || 0) + 1;

  const cat = CATEGORIES[entry.cat];
  emit('notify', { type: 'loot', text: `📖 ${cat?.icon || '📖'} Codex: ${entry.title}` });
  const now = Date.now();
  if (!silent && !entry.quiet && now - lastDiscoveryPopup > POPUP_QUIET_MS) {
    lastDiscoveryPopup = now;
    hooks.popup('SOMETHING NOTICED',
      `📖 <b>${entry.title}</b><br><span style="font-size:12px;color:var(--text-dim)">Added to your Codex, under ${cat?.name || 'the world'}.</span>`,
      { ttl: 6 });
  }
  emit('codex-discovered', { id: entryId, entry });
  emit('state-changed');
  return true;
}

/** Sweep the locked entries and unlock anything that has come true. */
export function checkDiscoveries() {
  let found = 0;
  for (const entry of candidates()) {
    if (conditionMet(entry.when)) {
      discover(entry.id);
      if (++found >= 2) break;   // never dump the whole book at once
    }
  }
  return found;
}

/** The text of an entry, including any deeper passes you have earned. */
export function entryText(entry) {
  const cycles = state.ascensions || 0;
  const parts = [entry.text];
  for (const d of entry.deeper || []) {
    if (cycles >= d.cycle) parts.push(d.text);
  }
  return parts;
}

/** How many deeper passes remain hidden — shown as a nudge in the UI. */
export function hiddenDepth(entry) {
  const cycles = state.ascensions || 0;
  return (entry.deeper || []).filter(d => cycles < d.cycle).length;
}

export function progress() {
  const seen = codex().seen;
  return { found: Object.keys(seen).length, total: CODEX.length };
}

export function markRead() {
  codex().unread = 0;
  emit('state-changed');
}

export function setFlag(name) {
  const c = codex();
  if (c.flags[name]) return;
  c.flags[name] = Date.now();
  checkDiscoveries();
}

// ---------------- Ambient tidbits ----------------
//
// A slow drip of world-facts tied to what you are actually doing. They go
// to the log only — never a popup — so they read as background thought
// rather than an interruption.

let nextTidbitAt = 0;
const recentTidbits = [];

function currentContext() {
  const act = state.activity;
  // An excavation is not an `activity` in the state machine sense, so it
  // has to be checked before the idle fallbacks or it never surfaces.
  if ((state.era || 1) >= 2 && state.salvage?.active) return 'wastes';
  // The two Era II fights have their own voice and have to be tested
  // before the generic combat case, which would otherwise swallow them.
  if (act?.type === 'combat' && state.combat?.worldBoss) return 'vigil';
  if (act?.type === 'combat' && state.combat?.deep) return 'descent';
  if (act?.type === 'combat') return 'combat';
  if (act?.type === 'skill') return act.skillId;
  if (state.town?.unlocked) return 'town';
  return null;
}

function tickTidbits() {
  const now = Date.now();
  if (nextTidbitAt === 0) { scheduleTidbit(); return; }
  if (now < nextTidbitAt) return;
  scheduleTidbit();

  const ctx = currentContext();
  const pool = TIDBITS[ctx];
  if (!pool || !pool.length) return;
  // Avoid repeating anything from the last handful
  const fresh = pool.filter(t => !recentTidbits.includes(t));
  const line = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length || pool.length))];
  recentTidbits.push(line);
  if (recentTidbits.length > 6) recentTidbits.shift();
  emit('notify', { type: 'sys', text: `<i style="opacity:0.8">${line}</i>` });
}

function scheduleTidbit() {
  nextTidbitAt = Date.now() + TIDBIT_MIN_MS + Math.random() * (TIDBIT_MAX_MS - TIDBIT_MIN_MS);
}

// ---------------- Cycle memory ----------------

/**
 * Snapshot the cycle that is ending. Called from ascend() BEFORE the
 * state is replaced, because afterwards none of these numbers exist.
 */
export function snapshotCycle() {
  const c = codex();
  const pet = state.pets?.active ? state.pets.owned[state.pets.active] : null;
  c.lastCycle = {
    n: state.ascensions || 0,
    kills: state.stats?.kills || 0,
    deaths: state.stats?.deaths || 0,
    actions: state.stats?.actions || 0,
    gold: state.lifetimeGold || 0,
    boss: state.stats?.aurelionKills || 0,
    razed: (state.town?.timesRazed || 0) + 1,
    town: Object.keys(state.town?.staff || {}).length,
    pet: pet?.name || null,
    endedAt: Date.now(),
  };
  return c.lastCycle;
}

/**
 * The "welcome back" beat. Every line quotes a real number from the cycle
 * you just finished, which is the whole point: the game is telling you it
 * was watching, and that none of it stuck.
 */
export function returnReport() {
  const last = codex().lastCycle;
  if (!last) return null;
  const map = {
    kills: last.kills, gold: fmt(last.gold), razed: last.razed,
    deaths: last.deaths, pet: last.pet, actions: last.actions,
    town: last.town, boss: last.boss,
  };
  const lines = [];
  for (const def of RETURN_LINES) {
    const v = map[def.key];
    if (v === null || v === undefined || v === 0) {
      // 0 is meaningful for some keys and noise for others; the line
      // generators return null when they would be embarrassing.
      if (def.key !== 'deaths' && def.key !== 'town' && def.key !== 'boss') continue;
    }
    const text = def.text(v);
    if (text) lines.push(text);
  }
  return { cycle: last.n + 1, lines };
}

export function showReturnReport() {
  const rep = returnReport();
  if (!rep || !rep.lines.length) return;
  hooks.queueModal(`
    <div class="modal-tag">◈ THE WORLD REMEMBERS NOTHING ◈</div>
    <div class="modal-title">Cycle ${romanish(rep.cycle)}</div>
    <div class="modal-body" style="line-height:1.75">
      <p class="muted">You have been here before. Here is what it cost, and what is left of it.</p>
      <ul style="list-style:none;padding:0">
        ${rep.lines.map(l => `<li style="padding:6px 0;border-bottom:1px dashed rgba(43,58,94,0.5)">${l}</li>`).join('')}
      </ul>
      <p style="color:var(--sys-blue);margin-top:14px">[ SYSTEM ] Ledger cleared. Recommendation: begin again.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Begin again</button></div>
  `);
}

function romanish(n) {
  const R = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  return R[n] || String(n);
}

// ---------------- Wiring ----------------

let sweep = 0;
export function tickCodex(dt) {
  tickTidbits();
  sweep += dt;
  if (sweep < 6000) return;    // discovery is not urgent
  sweep = 0;
  checkDiscoveries();
}

export function initCodex() {
  codex();
  scheduleTidbit();

  // Per-monster kill counts: the Codex wants "50 slimes", and state.stats
  // only tracks a grand total.
  on('kill', ({ monsterId }) => {
    if (!monsterId) return;
    const c = codex();
    c.kills[monsterId] = (c.kills[monsterId] || 0) + 1;
  });

  // "Have you ever held one of these" — inventory count is not enough,
  // since selling a relic should not un-discover it.
  on('loot', ({ itemId }) => { if (itemId) codex().items[itemId] = true; });

  // Anything already in the bag at load counts as held.
  for (const id of Object.keys(state.inventory || {})) codex().items[id] = true;
  for (const id of Object.values(state.equipment || {})) if (id) codex().items[id] = true;

  on('hireling-hired', () => setFlag('first_hireling'));
  // Era II's new verbs each earn their own entry, once you have actually
  // done the thing rather than merely been told about it.
  on('deep-record', ({ depth }) => { if (depth >= 3) setFlag('descended'); });
  on('boss-surfaced', () => setFlag('vigil_seen'));
  on('boss-felled', () => setFlag('vigil_felled'));
  on('ascended', ({ razed }) => { if (razed?.buildings > 0) setFlag('town_razed'); });
  on('pet-hatched', () => checkDiscoveries());

  checkDiscoveries();
}
