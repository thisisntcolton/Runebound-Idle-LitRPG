// ============================================================
// SAVE / LOAD — localStorage autosave + export/import strings
// ============================================================
import { state, replaceState, defaultState, SAVE_VERSION } from './state.js';
import { emit } from './events.js';

const KEY = 'runebound-save-v1';

export function save() {
  try {
    state.lastSeen = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Save failed', e);
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    replaceState(migrate(data));
    return true;
  } catch (e) {
    console.warn('Load failed, starting fresh', e);
    return false;
  }
}

// Merge a loaded save over the default state so new fields added in
// later versions always exist. Used for local loads, imports, AND
// cloud saves — anything entering the game from outside.
export function migrate(data) {
  const base = defaultState();
  const merged = deepMerge(base, data);
  merged.version = SAVE_VERSION;
  return merged;
}

function deepMerge(base, over) {
  if (Array.isArray(base) || Array.isArray(over)) return over ?? base;
  if (typeof base === 'object' && base !== null && typeof over === 'object' && over !== null) {
    const out = { ...base };
    for (const k of Object.keys(over)) {
      out[k] = k in base ? deepMerge(base[k], over[k]) : over[k];
    }
    return out;
  }
  return over ?? base;
}

export function exportSave() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importSave(text) {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(text.trim()))));
    if (!data || typeof data !== 'object' || !data.skills) throw new Error('bad save');
    replaceState(migrate(data));
    save();
    emit('state-changed');
    return true;
  } catch (e) {
    return false;
  }
}

export function hardReset() {
  localStorage.removeItem(KEY);
  replaceState(defaultState());
  emit('state-changed');
}

export function startAutosave() {
  setInterval(save, 10000);
  window.addEventListener('beforeunload', save);
}
