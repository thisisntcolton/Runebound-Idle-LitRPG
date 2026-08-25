// ============================================================
// LITRPG CHARACTER SHEET — allocatable stat points
// ============================================================
import { state, statPointsAvailable } from '../core/state.js';
import { emit } from '../core/events.js';

export const STAT_INFO = {
  STR: { name: 'STR', full: 'Strength', desc: '+1% max hit per point' },
  AGI: { name: 'AGI', full: 'Agility', desc: '+0.5% action & attack speed per point' },
  VIT: { name: 'VIT', full: 'Vitality', desc: '+1% max HP per point' },
  INT: { name: 'INT', full: 'Intellect', desc: '+1% all XP per point' },
  LUK: { name: 'LUK', full: 'Luck', desc: '+0.5% gold & rare drops per point' },
};

export function allocateStat(stat) {
  if (!(stat in state.charStats)) return false;
  if (statPointsAvailable() <= 0) return false;
  state.charStats[stat]++;
  state.statPointsSpent++;
  emit('notify', { type: 'sys', text: `[ SYSTEM ] ${STAT_INFO[stat].full} increased to ${state.charStats[stat]}` });
  emit('state-changed');
  return true;
}
