// ============================================================
// CLASS SYSTEM — pick at level 10, keep for the cycle
// ============================================================
import { state, charLevel, maxHp, combatLevel } from '../core/state.js';
import { CLASSES, CLASS_LIST, getClass, CLASS_UNLOCK_LEVEL, SIGNATURE } from '../data/classes.js';
import { TREES, treeFor, nodeById, CLASS_LEVEL_CURVE, MAX_CLASS_LEVEL,
         POINTS_PER_LEVEL, TIERS, tierInfo } from '../data/talents.js';
import { emit, on } from '../core/events.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setClassUIHooks(h) { hooks = h; }

export function currentClass() {
  return state.classId ? getClass(state.classId) : null;
}

// ---------------- Per-class progress ----------------
//
// Talent points and spent ranks live in state.classProgress, keyed by
// class id, and that whole object survives Ascension. It is the only
// progression in the game that is never reset by anything.

export function classProgress(id = state.classId) {
  if (!state.classProgress) state.classProgress = {};
  if (!id) return null;
  if (!state.classProgress[id]) {
    state.classProgress[id] = { xp: 0, spent: {}, pointsUsed: 0 };
  }
  return state.classProgress[id];
}

export function classLevel(id = state.classId) {
  const p = classProgress(id);
  if (!p) return 0;
  let lvl = 1;
  while (lvl < MAX_CLASS_LEVEL && p.xp >= CLASS_LEVEL_CURVE(lvl + 1)) lvl++;
  return lvl;
}

export function classLevelProgress(id = state.classId) {
  const p = classProgress(id);
  if (!p) return 0;
  const lvl = classLevel(id);
  if (lvl >= MAX_CLASS_LEVEL) return 1;
  const cur = CLASS_LEVEL_CURVE(lvl), next = CLASS_LEVEL_CURVE(lvl + 1);
  return Math.max(0, Math.min(1, (p.xp - cur) / (next - cur)));
}

export function talentPoints(id = state.classId) {
  const p = classProgress(id);
  if (!p) return { total: 0, used: 0, free: 0 };
  const total = classLevel(id) * POINTS_PER_LEVEL;
  const used = p.pointsUsed || 0;
  return { total, used, free: Math.max(0, total - used) };
}

export function rankOf(nodeId, id = state.classId) {
  return classProgress(id)?.spent?.[nodeId] || 0;
}

export function tierUnlocked(tier, id = state.classId) {
  const t = tierInfo(tier);
  return !!t && classLevel(id) >= t.atClassLevel;
}

export function canBuy(nodeId, id = state.classId) {
  const node = nodeById(id, nodeId);
  if (!node) return { ok: false, why: 'No such talent.' };
  if (!tierUnlocked(node.tier, id)) {
    return { ok: false, why: `Unlocks at class level ${tierInfo(node.tier).atClassLevel}.` };
  }
  const rank = rankOf(nodeId, id);
  if (rank >= node.max) return { ok: false, why: 'Already maxed.' };
  if (talentPoints(id).free < node.cost) return { ok: false, why: `Costs ${node.cost} point${node.cost === 1 ? '' : 's'}.` };
  return { ok: true };
}

export function buyTalent(nodeId, id = state.classId) {
  const check = canBuy(nodeId, id);
  if (!check.ok) return false;
  const node = nodeById(id, nodeId);
  const p = classProgress(id);
  p.spent[nodeId] = (p.spent[nodeId] || 0) + 1;
  p.pointsUsed = (p.pointsUsed || 0) + node.cost;
  emit('notify', { type: 'sys', text: `${node.icon} ${node.name} ${p.spent[nodeId]}/${node.max}` });
  emit('talent-bought', { classId: id, nodeId });
  emit('state-changed');
  return true;
}

/** Sum of every talent's contribution to one bonus key. */
export function talentBonus(key, id = state.classId) {
  if (!id) return 0;
  const p = classProgress(id);
  if (!p) return 0;
  let total = 0;
  for (const node of treeFor(id)) {
    const rank = p.spent[node.id] || 0;
    if (rank > 0 && node.bonus?.[key]) total += node.bonus[key] * rank;
  }
  return total;
}

/** Is a capstone flag active? */
export function hasTalentFlag(flag, id = state.classId) {
  if (!id) return false;
  const p = classProgress(id);
  if (!p) return false;
  for (const node of treeFor(id)) {
    if (node.flag === flag && (p.spent[node.id] || 0) > 0) return true;
  }
  return false;
}

// ---------------- Class XP ----------------
//
// Every scrap of XP you earn also feeds the active class. Wired through
// the same 'xp-gained' event the skill system already emits, so there is
// no second accounting path to drift out of sync.

export function gainClassXp(amount) {
  if (!state.classId || amount <= 0) return;
  const p = classProgress();
  const before = classLevel();
  p.xp += amount;
  const after = classLevel();
  if (after > before) {
    const cls = currentClass();
    emit('notify', { type: 'loot',
      text: `${cls.icon} ${cls.name} level ${after} — ${(after - before) * POINTS_PER_LEVEL} talent point${(after - before) * POINTS_PER_LEVEL === 1 ? '' : 's'}.` });
    hooks.popup('TALENT POINT', `${cls.icon} <b>${cls.name} Lv.${after}</b><br><span style="font-size:12px;color:var(--text-dim)">Spend it on the Path screen. It is yours forever.</span>`, { gold: true, ttl: 6 });
    emit('class-level', { id: state.classId, level: after });
  }
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
  return (cls.passive[key] || 0) + talentBonus(key);
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

// ---------------- Over-level combat (Priest) ----------------
//
// How far above your combat level the current monster is, capped. Zones
// carry a level; generated rift waves do not, so those fall back to the
// zone requirement they spawned from and otherwise count as level.

export function overLevelGap(monster) {
  if (!monster) return 0;
  const mine = combatLevel();
  const theirs = monster.level ?? mine;
  return Math.max(0, Math.min(SIGNATURE.OVERLEVEL_CAP, theirs - mine));
}

/** Damage multiplier from punching above your weight. 1 when it isn't. */
export function overLevelDamageMult(monster) {
  const per = classBonus('overlevel_damage');
  if (per <= 0) return 1;
  return Math.min(SIGNATURE.OVERLEVEL_MAX_DAMAGE, 1 + per * overLevelGap(monster));
}

/** Loot/gold multiplier for the same. */
export function overLevelLootMult(monster) {
  const per = classBonus('overlevel_loot');
  if (per <= 0) return 1;
  return Math.min(SIGNATURE.OVERLEVEL_MAX_LOOT, 1 + per * overLevelGap(monster));
}

// ---------------- Signatures ----------------

/** Rogue: does this swing crit? */
export function rollCrit() {
  const chance = classBonus('crit');
  return chance > 0 && Math.random() < chance;
}

export function critMultiplier() {
  return SIGNATURE.CRIT_MULTIPLIER * (1 + classBonus('crit_damage'));
}

/** Rogue capstone: crits execute anything already nearly dead. */
export function executesOnCrit() { return hasTalentFlag('assassinate'); }
export function executeThreshold() { return SIGNATURE.EXECUTE_THRESHOLD; }

/**
 * Ranger: the first swing at a given monster always lands.
 * Tracked against the combat state rather than a module variable so it
 * survives a save/reload mid-fight.
 */
export function consumeGuaranteedHit() {
  if (state.classId !== 'ranger') return false;
  // Capstone: Quarry stops being a one-shot and becomes permanent.
  if (hasTalentFlag('every_shot')) return true;
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
  const fraction = SIGNATURE.BURN_FRACTION * (1 + classBonus('burn'));
  const total = damage * fraction;
  if (total <= 0) return;
  const c = state.combat;
  const perTick = total / SIGNATURE.BURN_TICKS;

  // Capstone: Conflagration stacks instead of refreshing, and never expires
  // while the target lives.
  if (hasTalentFlag('conflagration') && c.burn) {
    c.burn.perTick += perTick;
    c.burn.ticksLeft = Infinity;
    return;
  }
  c.burn = {
    perTick,
    ticksLeft: hasTalentFlag('conflagration') ? Infinity : SIGNATURE.BURN_TICKS,
    timer: 0,
  };
}

/** Called from the combat tick; returns damage dealt this tick. */
export function tickBurn(dt) {
  const c = state.combat;
  if (!c.burn || c.burn.ticksLeft <= 0) return 0;
  c.burn.timer += dt;
  let dealt = 0;
  let guard = 0;
  while (c.burn.timer >= SIGNATURE.BURN_INTERVAL_MS && c.burn.ticksLeft > 0 && guard++ < 10) {
    c.burn.timer -= SIGNATURE.BURN_INTERVAL_MS;
    if (c.burn.ticksLeft !== Infinity) c.burn.ticksLeft--;
    dealt += c.burn.perTick;
  }
  if (c.burn.ticksLeft <= 0) c.burn = null;
  return dealt;
}

export function clearBurn() { state.combat.burn = null; }

/** Priest: heal on kill. */
export function mendOnKill() {
  if (state.classId !== 'priest') return 0;
  const heal = Math.ceil(maxHp() * (SIGNATURE.MEND_FRACTION + classBonus('mend')));
  const c = state.combat;
  const before = c.playerHp;
  c.playerHp = Math.min(maxHp(), c.playerHp + heal);
  return Math.round(c.playerHp - before);
}

// ---------------- Init ----------------

/** Priest capstone: zone combat-level requirements stop applying. */
export function ignoresZoneGate() { return hasTalentFlag('no_ceiling'); }

/** Artisan capstone: a second extra staff slot. */
export function extraStaffSlots() {
  return classBonus('staff_slots') + (hasTalentFlag('whole_valley') ? 1 : 0);
}

/** Artisan capstone: the town keeps working at half rate while you're away. */
export function offlineTownRate() { return hasTalentFlag('whole_valley') ? 0.5 : 0; }

export function initClasses() {
  // A fresh cycle clears the choice so it can be made again.
  on('ascended', () => {
    state.classId = null;
    state.classChosenAt = 0;
    offered = false;
  });
  on('char-level', () => offerClassChoice());
  on('xp-gained', ({ amount }) => gainClassXp(amount));
  offerClassChoice();
}
