// ============================================================
// SKILL TRAINING — XP awards, active action loop, hirelings
// ============================================================
import { state, skillLevel, xpMultiplier, actionTime, doubleChance,
         hirelingRate, charLevel, levelCap, uncappedSkillLevel } from '../core/state.js';
import { SKILLS, getAction, TRAINABLE_SKILLS, SKILL_IDS } from '../data/skills.js';
import { levelForXp, SOFT_CAP } from '../core/xp.js';
import { emit, on } from '../core/events.js';
import { addItem, hasInputs, consumeInputs } from './inventory.js';
import { riskFor, guardFor } from '../data/thieving.js';

// ---------- XP ----------
export function addXp(skillId, baseAmount, { useMult = true } = {}) {
  const amount = useMult ? baseAmount * xpMultiplier() : baseAmount;
  const skill = state.skills[skillId];
  // Level-ups are announced against the CAPPED level, so a player sitting
  // at the sandbox ceiling does not get a stream of level-up banners for
  // levels the world is refusing to give them. The XP still goes in.
  const cap = levelCap();
  const before = Math.min(levelForXp(skill.xp), cap);
  const charBefore = charLevel();
  skill.xp += amount;
  const after = Math.min(levelForXp(skill.xp), cap);
  if (after > before) {
    emit('level-up', { skillId, level: after });
  }
  const charAfter = charLevel();
  if (charAfter > charBefore) {
    emit('char-level', { level: charAfter });
  }
  // Everything you earn also feeds the class you are currently walking.
  // Emitted rather than called directly so skills.js stays free of a
  // dependency on the class system.
  emit('xp-gained', { skillId, amount });
  return amount;
}

// ---------- The ceiling coming off ----------
//
// Levels above 99 do not exist inside the box, but the XP does: it has
// been accumulating the whole time against a number nobody was allowed to
// have. Breaking out releases it all at once, which is both the fairest
// way to handle a raised cap on an existing save and — far more to the
// point — the correct beat. You did not earn those levels out here. You
// earned them in there, and they were being held.

let ceilingHooks = { queueModal: () => {} };
export function setSkillUIHooks(h) { ceilingHooks = h; }

export function releaseTheCeiling() {
  const jumps = [];
  for (const id of SKILL_IDS) {
    const real = uncappedSkillLevel(id);
    if (real > SOFT_CAP) jumps.push({ id, from: SOFT_CAP, to: real });
  }
  if (!jumps.length) return false;
  jumps.sort((a, b) => b.to - a.to);

  ceilingHooks.queueModal(`
    <div class="modal-tag glitch-tag">◈ CEILING REMOVED ◈</div>
    <div class="modal-title">99 Was A Setting</div>
    <div class="modal-body" style="line-height:1.75">
      <p>You have been at ninety-nine in ${jumps.length === 1 ? 'a skill' : `${jumps.length} skills`} for a while now,
      and you have kept working, because what else is there.</p>
      <p>[ SYSTEM ] Operator competency ceiling was a containment parameter. It was set to
      99 on unit provisioning. It has been logging your excess the entire time.</p>
      <p>[ SYSTEM ] Excess released.</p>
      <ul style="list-style:none;padding:0">
        ${jumps.map(j => `<li style="padding:5px 0;border-bottom:1px dashed rgba(43,58,94,0.5)">
          ${SKILLS[j.id]?.icon || ''} <b>${SKILLS[j.id]?.name || j.id}</b>
          <span class="muted">99</span> → <b style="color:var(--gold)">${j.to}</b></li>`).join('')}
      </ul>
      <p class="muted">Every hour of it counted. It was simply not being applied to you.</p>
      <p style="color:var(--sys-blue)">The ceiling out here is <b>199</b>. Nobody has said what
      that one is for.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">…</button></div>
  `);
  emit('ceiling-released', { jumps });
  emit('state-changed');
  return true;
}

export function initSkills() {
  on('era-changed', () => releaseTheCeiling());
}

// ---------- Activity control ----------
export function startSkillAction(skillId, actionId) {
  const action = getAction(skillId, actionId);
  if (!action) return false;
  if (skillLevel(skillId) < action.level) return false;
  if (action.input && !hasInputs(action.input)) {
    emit('notify', { type: 'sys', text: `Not enough materials for ${action.name}` });
    return false;
  }
  state.activity = { type: 'skill', skillId, actionId, progress: 0 };
  if (!state.lastAction) state.lastAction = {};
  state.lastAction[skillId] = actionId;
  emit('notify', { type: 'sys', text: `Now training: ${SKILLS[skillId].name} — ${action.name}` });
  emit('state-changed');
  return true;
}

export function stopActivity({ silent = false } = {}) {
  if (!state.activity) return;
  state.activity = null;
  if (!silent) emit('notify', { type: 'sys', text: 'You stop and catch your breath.' });
  emit('state-changed');
}

// Complete one action: consume inputs, grant outputs + xp.
// Returns false if inputs ran dry.
export function completeAction(skillId, action, { announce = true } = {}) {
  if (action.input) {
    if (!consumeInputs(action.input)) return false;
  }
  const doubled = Math.random() < doubleChance(skillId);
  const mult = doubled ? 2 : 1;
  for (const [itemId, qty] of Object.entries(action.output)) {
    addItem(itemId, qty * mult);
    emit('loot', { itemId, qty: qty * mult, source: 'skill' });
  }
  addXp(skillId, action.xp);
  state.stats.actions++;
  if (doubled && announce) emit('notify', { type: 'loot', text: `Double yield! (${action.name})` });
  emit('action-done', { skillId, actionId: action.id });
  return true;
}

// ---------- Getting caught ----------
//
// Only the ACTIVE steal can go wrong. A hireling working a mark is a
// hireling taking that risk on your behalf, and dragging the player into
// a fight they did not initiate — possibly while they are asleep — is
// exactly the kind of "stakes" that makes people stop leaving the game
// running. Their haul is quietly a little smaller instead.

export function stealRisk(actionId) {
  const action = getAction('thieving', actionId);
  if (!action) return null;
  return riskFor(actionId, {
    level: skillLevel('thieving'),
    required: action.level,
    luk: state.charStats?.LUK || 0,
  });
}

/** Rolled once per completed steal. Returns the guard if it went wrong. */
export function rollCaught(actionId) {
  const r = stealRisk(actionId);
  if (!r) return null;
  if (Math.random() >= r.chance) return null;
  return guardFor(actionId);
}

// ---------- Ticks ----------
export function tickActiveSkill(dt) {
  const act = state.activity;
  if (!act || act.type !== 'skill') return;
  const action = getAction(act.skillId, act.actionId);
  if (!action) { stopActivity({ silent: true }); return; }

  act.progress += dt;
  const time = actionTime(act.skillId, action);
  let loops = 0;
  while (act.progress >= time && loops++ < 50) {
    act.progress -= time;
    const ok = completeAction(act.skillId, action);
    if (!ok) {
      emit('notify', { type: 'sys', text: `Out of materials — ${action.name} halted.` });
      stopActivity({ silent: true });
      return;
    }
    // You got the haul. Whether you got away with it is a separate
    // question, and it is asked after the fact so a caught steal still
    // pays — you are fighting to KEEP something, not for nothing.
    if (act.skillId === 'thieving') {
      const g = rollCaught(action.id);
      if (g) { emit('theft-noticed', { actionId: action.id, guard: g, action }); return; }
    }
  }
}

/**
 * What a hireling is farming for a skill. Explicit assignment wins;
 * otherwise it falls back to whatever you last trained there.
 */
export function hirelingTask(skillId) {
  const assigned = state.hirelingTask?.[skillId];
  if (assigned && getAction(skillId, assigned)) return assigned;
  return state.lastAction?.[skillId] || SKILLS[skillId].actions[0].id;
}

export function setHirelingTask(skillId, actionId) {
  const action = getAction(skillId, actionId);
  if (!action) return false;
  if (skillLevel(skillId) < action.level) {
    emit('notify', { type: 'sys', text: `Your hireling can't work ${action.name} until ${SKILLS[skillId].name} ${action.level}.` });
    return false;
  }
  if (!state.hirelingTask) state.hirelingTask = {};
  state.hirelingTask[skillId] = actionId;
  state.hirelingCarry[skillId] = 0;   // restart the shift cleanly
  emit('notify', { type: 'sys', text: `Hireling reassigned to ${action.name}.` });
  emit('state-changed');
  return true;
}

/** Live 0..1 progress of the hireling's current action, for the UI. */
export function hirelingProgress(skillId) {
  const rate = hirelingRate(skillId);
  if (rate <= 0) return null;
  const action = getAction(skillId, hirelingTask(skillId));
  if (!action || skillLevel(skillId) < action.level) return null;
  const time = actionTime(skillId, action);
  const carry = state.hirelingCarry?.[skillId] || 0;
  return { action, pct: Math.max(0, Math.min(1, carry / time)), effectiveMs: time / rate, rate };
}

export function tickHirelings(dt) {
  for (const skillId of TRAINABLE_SKILLS) {
    const rate = hirelingRate(skillId);
    if (rate <= 0) continue;
    const actionId = hirelingTask(skillId);
    const action = getAction(skillId, actionId);
    if (!action || skillLevel(skillId) < action.level) continue;

    if (!state.hirelingCarry) state.hirelingCarry = {};
    state.hirelingCarry[skillId] = (state.hirelingCarry[skillId] || 0) + dt * rate;
    const time = actionTime(skillId, action);
    let guard = 0;
    while (state.hirelingCarry[skillId] >= time && guard++ < 50) {
      state.hirelingCarry[skillId] -= time;
      const ok = completeAction(skillId, action, { announce: false });
      if (!ok) { state.hirelingCarry[skillId] = 0; break; } // crafting hireling out of inputs
    }
  }
}
