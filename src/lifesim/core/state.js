// ============================================================
// LINEAGE — Core State, Energy Pool & Dynasty Tree
// ============================================================

export const SAVE_VERSION = 4;

export function stageForAge(age) {
  if (age <= 4) return 'Baby';
  if (age <= 12) return 'Child';
  if (age <= 17) return 'Teen';
  if (age <= 64) return 'Adult';
  return 'Elder';
}

export function clampStat(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function defaultState() {
  return {
    version: SAVE_VERSION,
    lastSeen: Date.now(),
    mode: 'create', // 'create' | 'live' | 'dead'
    draft: null,
    character: null,
    pendingEvents: [],
    seenOnce: {},
    recentEvents: [],
    log: [],
    customRoutines: [], // [{ id, name, stage, seq: ['work_overtime', ...] }]
    dynasty: {
      generation: 1,
      familyName: '',
      ancestors: [],
      legacyFlags: {},
    },
  };
}

export let state = defaultState();

export function replaceState(next) {
  state = next;
}
