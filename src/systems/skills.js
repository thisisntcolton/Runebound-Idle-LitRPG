// ============================================================
// SKILL TRAINING — XP awards, active action loop, hirelings
// ============================================================
import { state, skillLevel, xpMultiplier, actionTime, doubleChance,
         hirelingRate, charLevel } from '../core/state.js';
import { SKILLS, getAction, TRAINABLE_SKILLS } from '../data/skills.js';
import { levelForXp } from '../core/xp.js';
import { emit } from '../core/events.js';
import { addItem, hasInputs, consumeInputs } from './inventory.js';

// ---------- XP ----------
export function addXp(skillId, baseAmount, { useMult = true } = {}) {
  const amount = useMult ? baseAmount * xpMultiplier() : baseAmount;
  const skill = state.skills[skillId];
  const before = levelForXp(skill.xp);
  const charBefore = charLevel();
  skill.xp += amount;
  const after = levelForXp(skill.xp);
  if (after > before) {
    emit('level-up', { skillId, level: after });
  }
  const charAfter = charLevel();
  if (charAfter > charBefore) {
    emit('char-level', { level: charAfter });
  }
  return amount;
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

// ---------- Ticks ----------
export function tickActiveSkill(dt) {
  const act = state.activity;
  if (!act || act.type !== 'skill') return;
  const action = getAction(act.skillId, act.actionId);
  if (!action) { stopActivity({ silent: true }); return; }

  act.progress += dt;
  const time = actionTime(act.skillId, action);
  let guard = 0;
  while (act.progress >= time && guard++ < 50) {
    act.progress -= time;
    const ok = completeAction(act.skillId, action);
    if (!ok) {
      emit('notify', { type: 'sys', text: `Out of materials — ${action.name} halted.` });
      stopActivity({ silent: true });
      return;
    }
  }
}

export function tickHirelings(dt) {
  for (const skillId of TRAINABLE_SKILLS) {
    const rate = hirelingRate(skillId);
    if (rate <= 0) continue;
    const actionId = state.lastAction?.[skillId] || SKILLS[skillId].actions[0].id;
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
