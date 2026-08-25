// ============================================================
// CLASS SYSTEM — pick at level 10, keep for the cycle
// ============================================================
import { state, charLevel, maxHp } from '../core/state.js';
import { CLASSES, CLASS_LIST, getClass, CLASS_UNLOCK_LEVEL, SIGNATURE } from '../data/classes.js';
import { emit, on } from '../core/events.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setClassUIHooks(h) { hooks = h; }

export function currentClass() {
  return state.classId ? getClass(state.classId) : null;
}

export function classUnlocked() {
  return charLevel() >= CLASS_UNLOCK_LEVEL;
}

/** Have they been offered the choice this cycle yet? */
export function classPending() {
  return classUnlocked() && !state.classId;
}

/**
 * The one hook the multiplier chain reads.
 * Returns 0 for anything the current class does not touch, which is how
 * the Artisan ends up with literally no combat presence.
 */
export function classBonus(key) {
  const cls = currentClass();
  if (!cls) return 0;
  return cls.passive[key] || 0;
}

export function chooseClass(id, { silent = false } = {}) {
  const cls = getClass(id);
  if (!cls) return false;
  if (!classUnlocked()) return false;
  // One class per cycle. Changing it mid-run would make every choice free.
  if (state.classId) return false;

  state.classId = id;
  state.classChosenAt = Date.now();
  emit('notify', { type: 'sys', text: `[ SYSTEM ] Path registered: ${cls.icon} ${cls.name}.` });
  if (!silent) {
    hooks.popup('A PATH TAKEN', `${cls.icon} <b>${cls.name}</b><br><span style="font-size:12px;color:var(--text-dim)">${cls.signature.name} — ${cls.signature.desc}</span>`, { gold: true, ttl: 7 });
  }
  emit('class-chosen', { id });
  emit('state-changed');
  return true;
}

/**
 * Offer the choice, once, the moment it becomes available.
 *
 * Deliberately a blocking modal rather than a quiet unlock: this is the
 * only irreversible decision in a cycle, and burying it behind a tab is
 * how players reach level 40 having never noticed classes exist.
 */
let offered = false;
export function offerClassChoice() {
  if (offered || !classPending()) return;
  offered = true;
  hooks.queueModal(classModalHtml());
}

export function classModalHtml() {
  const cards = CLASS_LIST.map(c => `
    <div class="class-card ${c.school}">
      <div class="class-card-head">
        <span class="class-icon">${c.icon}</span>
        <div>
          <div class="class-name">${c.name}</div>
          <div class="class-tagline">${c.tagline}</div>
        </div>
      </div>
      <div class="class-blurb">${c.blurb}</div>
      <div class="class-sig">${c.signature.icon} <b>${c.signature.name}</b> — ${c.signature.desc}</div>
      <ul class="class-effects">${c.effects.map(e => `<li>${e}</li>`).join('')}</ul>
      <div class="class-penalty">⚠ ${c.penalty}</div>
      <button class="btn btn-sm btn-primary btn-block" data-act="choose-class" data-class="${c.id}">Walk this path</button>
    </div>`).join('');

  return `
    <div class="modal-tag">◈ CLASSIFICATION AVAILABLE ◈</div>
    <div class="modal-title">Choose a Path</div>
    <div class="modal-body">
      <p>[ SYSTEM ] Aptitude threshold reached. You may now specialise.</p>
      <p class="muted">This holds for the rest of the cycle. Ascend, and you choose again —
      the world will not remember what you were.</p>
      <div class="class-grid">${cards}</div>
    </div>`;
}

// ---------------- Signatures ----------------

/** Rogue: does this swing crit? */
export function rollCrit() {
  const chance = classBonus('crit');
  return chance > 0 && Math.random() < chance;
}

export function critMultiplier() { return SIGNATURE.CRIT_MULTIPLIER; }

/**
 * Ranger: the first swing at a given monster always lands.
 * Tracked against the combat state rather than a module variable so it
 * survives a save/reload mid-fight.
 */
export function consumeGuaranteedHit() {
  if (state.classId !== 'ranger') return false;
  const c = state.combat;
  if (c.quarryUsed) return false;
  c.quarryUsed = true;
  return true;
}

export function resetQuarry() {
  state.combat.quarryUsed = false;
}

/** Mage: schedule burn damage from a landed hit. */
export function applyBurn(damage) {
  if (state.classId !== 'mage') return;
  const total = damage * SIGNATURE.BURN_FRACTION;
  if (total <= 0) return;
  const c = state.combat;
  c.burn = {
    perTick: total / SIGNATURE.BURN_TICKS,
    ticksLeft: SIGNATURE.BURN_TICKS,
    timer: 0,
  };
}

/** Called from the combat tick; returns damage dealt this tick. */
export function tickBurn(dt) {
  const c = state.combat;
  if (!c.burn || c.burn.ticksLeft <= 0) return 0;
  c.burn.timer += dt;
  let dealt = 0;
  while (c.burn.timer >= SIGNATURE.BURN_INTERVAL_MS && c.burn.ticksLeft > 0) {
    c.burn.timer -= SIGNATURE.BURN_INTERVAL_MS;
    c.burn.ticksLeft--;
    dealt += c.burn.perTick;
  }
  if (c.burn.ticksLeft <= 0) c.burn = null;
  return dealt;
}

export function clearBurn() { state.combat.burn = null; }

/** Priest: heal on kill. */
export function mendOnKill() {
  if (state.classId !== 'priest') return 0;
  const heal = Math.ceil(maxHp() * SIGNATURE.MEND_FRACTION);
  const c = state.combat;
  const before = c.playerHp;
  c.playerHp = Math.min(maxHp(), c.playerHp + heal);
  return Math.round(c.playerHp - before);
}

// ---------------- Init ----------------

export function initClasses() {
  // A fresh cycle clears the choice so it can be made again.
  on('ascended', () => {
    state.classId = null;
    state.classChosenAt = 0;
    offered = false;
  });
  on('char-level', () => offerClassChoice());
  offerClassChoice();
}
