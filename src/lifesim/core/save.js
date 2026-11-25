import { initLife } from '../systems/life.js';
// ============================================================
// LINEAGE — Isolated Local Save / Export / Import
// Uses 'lifesim-save-v1' so it never collides with Runebound
// ============================================================
import { state, replaceState, defaultState, SAVE_VERSION } from './state.js';

export const LS_SAVE_KEY = 'lifesim-save-v1';

export function saveGame() {
  try {
    state.lastSeen = Date.now();
    localStorage.setItem(LS_SAVE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[Lineage] save failed:', err);
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(LS_SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    replaceState(migrateSave(parsed));
    return true;
  } catch (err) {
    console.warn('[Lineage] load failed, starting fresh:', err);
    return false;
  }
}

export function migrateSave(data) {
  const base = defaultState();
  const merged = {
    ...base,
    ...data,
    customRoutines: Array.isArray(data?.customRoutines) ? data.customRoutines : [],
    dynasty: { ...base.dynasty, ...(data?.dynasty || {}) },
    version: SAVE_VERSION,
  };
  if (merged.character) {
    const c = merged.character;
    c.strain = Number.isFinite(c.strain) ? c.strain : 0;
    c.nextEnergyBonus = Number.isFinite(c.nextEnergyBonus) ? c.nextEnergyBonus : 0;
    c.energyMax = Number.isFinite(c.energyMax) ? c.energyMax : (c.age <= 4 ? 3 : c.age <= 12 ? 6 : 10);
    c.energy = Number.isFinite(c.energy) ? c.energy : c.energyMax;
    c.yearActions = Array.isArray(c.yearActions) ? c.yearActions : [];
    c.lastRoutine = Array.isArray(c.lastRoutine) ? c.lastRoutine : [];
    c.progress = {
      career: 0,
      promotions: 0,
      school: 0,
      social: 0,
      hustle: 0,
      ...(c.progress || {}),
    };
  }
  if(merged.character) initLife(merged.character);
  return merged;
}

export function exportSaveString() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importSaveString(str) {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    if (!parsed || typeof parsed !== 'object' || !parsed.mode) return false;
    replaceState(migrateSave(parsed));
    saveGame();
    return true;
  } catch {
    return false;
  }
}

export function resetAllData() {
  localStorage.removeItem(LS_SAVE_KEY);
  replaceState(defaultState());
}
