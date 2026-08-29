// ============================================================
// LEGACY — the ones you used to be
//
// Ascension has always been the game's weakest moment. You press a
// button, forty hours of skills go to zero, and the compensation is a
// currency and a paragraph. Everything about it says LOSS, and the only
// counter-argument the game could make was arithmetic.
//
// So the character does not vanish any more. They move to Hearthwick.
//
// Your predecessor keeps the face you built, the name you chose, the
// class they walked and the title they earned, and they are standing in
// the town when you walk back in at level one. By the seventh cycle six
// of you live here. Marrow has met all of them. Pell remembers every
// name.
//
// Mechanically they are your household: assignable to work a skill while
// you do something else, or to join an expedition. Narratively they are
// the argument the reset could never make on its own — the world winds
// back and you accumulate.
//
// They are stored on state.legacy and kept by name in prestige.js. They
// are not achievements; they are people, and the difference shows in
// every panel that renders them.
// ============================================================
import { state, charLevel, totalSkillLevel, combatLevel } from '../core/state.js';
import { CLASSES } from '../data/classes.js';
import { emit } from '../core/events.js';

export const LEGACY = {
  /** A predecessor can be put to work, and only one job at a time. */
  JOBS: ['idle', 'skill', 'expedition'],
  /** What a working predecessor contributes, as a share of your own rate. */
  WORK_RATE_BASE: 0.14,
  /** Each cycle they have been here makes them a little more use. */
  WORK_RATE_PER_AGE: 0.012,
  WORK_RATE_CAP: 0.45,
};

export function legacy() {
  if (!Array.isArray(state.legacy)) state.legacy = [];
  return state.legacy;
}

/**
 * Retire the current character into the town.
 *
 * Called from prestige.js at the moment of Ascension, BEFORE the state is
 * replaced — everything it records has to be read off the life that is
 * ending, because a second later none of it exists.
 */
export function retireCurrentSelf() {
  const cls = CLASSES[state.classId];
  const who = {
    id: `self${(state.ascensions || 0) + 1}`,
    cycle: (state.ascensions || 0) + 1,
    name: state.look?.name || `The ${cls?.name || 'Nameless'}`,
    look: state.look ? JSON.parse(JSON.stringify(state.look)) : null,
    classId: state.classId || null,
    className: cls?.name || null,
    classIcon: cls?.icon || '🎭',
    title: state.activeTitle || null,
    // What they were, at the end. This is what the town remembers about
    // them, and what the panel shows when you ask who they were.
    charLevel: charLevel(),
    combatLevel: combatLevel(),
    totalLevel: totalSkillLevel(),
    retiredAt: Date.now(),
    job: 'idle',
    jobSkill: null,
    hurtUntil: 0,
  };
  legacy().push(who);
  emit('legacy-retired', { who });
  return who;
}

/** How long they have been living here, in cycles. */
export function ageOf(who) {
  return Math.max(0, (state.ascensions || 0) - who.cycle + 1);
}

/** Their share of your rate when set to work. */
export function workRate(who) {
  if (isHurt(who)) return 0;
  return Math.min(LEGACY.WORK_RATE_CAP,
    LEGACY.WORK_RATE_BASE + ageOf(who) * LEGACY.WORK_RATE_PER_AGE);
}

export function isHurt(who) {
  return (who.hurtUntil || 0) > Date.now();
}

export function available() {
  return legacy().filter(w => !isHurt(w) && w.job !== 'expedition');
}

/** Everyone currently assigned to a skill, keyed by skill. */
export function workersOn(skillId) {
  return legacy().filter(w => w.job === 'skill' && w.jobSkill === skillId && !isHurt(w));
}

/**
 * Total predecessor contribution to a skill, as a multiplier on the
 * hireling rate. Read by systems/skills.js.
 */
export function legacyRate(skillId) {
  return workersOn(skillId).reduce((sum, w) => sum + workRate(w), 0);
}

export function assign(id, job, skillId = null) {
  const who = legacy().find(w => w.id === id);
  if (!who) return false;
  if (isHurt(who)) {
    emit('notify', { type: 'sys', text: `${who.name} is in no state to be sent anywhere.` });
    return false;
  }
  who.job = job;
  who.jobSkill = job === 'skill' ? skillId : null;
  emit('notify', { type: 'sys', text: job === 'idle'
    ? `${who.name} has nothing to do, and is enjoying it.`
    : `${who.name} is working ${skillId || job}.` });
  emit('state-changed');
  return true;
}

export function hurt(id, ms) {
  const who = legacy().find(w => w.id === id);
  if (!who) return;
  who.hurtUntil = Date.now() + ms;
  who.job = 'idle';
  who.jobSkill = null;
}

/**
 * A line about them, for the town.
 *
 * Written per-age so a predecessor from eight cycles ago reads
 * differently to last week's, without needing eight of everything.
 */
export function lineFor(who) {
  const age = ageOf(who);
  if (isHurt(who)) return 'Sitting this one out. Says it is nothing.';
  if (who.job === 'expedition') return 'Out past the gate.';
  if (who.job === 'skill') return `Working the ${who.jobSkill}, and glad of it.`;
  if (age <= 1) return 'Newly retired, and not yet used to it.';
  if (age <= 3) return 'Settled in. Knows the shortcuts now.';
  if (age <= 6) return 'Has been here long enough to have opinions about the road.';
  return 'Older than the town claims to be. Nobody brings it up.';
}

export function legacyView() {
  return legacy().map(w => ({
    ...w,
    age: ageOf(w),
    rate: workRate(w),
    hurt: isHurt(w),
    line: lineFor(w),
  }));
}
