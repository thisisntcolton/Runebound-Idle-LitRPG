// ============================================================
// SAVE / LOAD — localStorage autosave + export/import strings
// ============================================================
import { state, replaceState, defaultState, SAVE_VERSION } from './state.js';
import { emit } from './events.js';

const KEY = 'runebound-save-v1';
let lastWritten = null;
let blocked = false;
let backupAt = 0;
export function saveStatus() { return { blocked, lastSaved: blocked ? null : state.lastSeen }; }
export function backupSave(label = 'manual') {
  try { localStorage.setItem(`${KEY}-backup-${label}`, JSON.stringify(state)); } catch (e) { console.warn('Backup failed', e); }
}
function parseSave(raw) {
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data) || !data.skills || typeof data.skills !== 'object' || Array.isArray(data.skills)) throw new Error('Invalid save');
  return data;
}

export function save() {
  try {
    if (blocked) return;
    const previous = localStorage.getItem(KEY);
    if (previous !== lastWritten) { blocked = true; emit("notify", {type:"sys", text:"Another tab changed your save. Export this session and reload before continuing."}); return; }
    if (typeof document === "undefined" || document.visibilityState !== "hidden") state.lastSeen = Date.now();
    if (previous && Date.now() - backupAt >= 300000) {
      localStorage.setItem(`${KEY}-backup-previous`, previous); backupAt = Date.now();
    }
    const next = JSON.stringify(state);
    localStorage.setItem(KEY, next);
    lastWritten = next;
  } catch (e) {
    console.warn('Save failed', e);
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    lastWritten = raw;
    const data = parseSave(raw);
    replaceState(migrate(data));
    return true;
  } catch (e) {
    console.warn('Load failed; original preserved', e);
    blocked = true;
    try { const raw = localStorage.getItem(`${KEY}-backup-previous`); if (raw) { replaceState(migrate(parseSave(raw))); return true; } } catch {}
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
      if (["__proto__", "constructor", "prototype"].includes(k)) continue;
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
    parseSave(JSON.stringify(data));
    backupSave("before-import");
    blocked = false;
    lastWritten = localStorage.getItem(KEY);
    replaceState(migrate(data));
    save();
    emit('state-changed');
    return true;
  } catch (e) {
    return false;
  }
}

export function hardReset() {
  backupSave("before-reset");
  localStorage.removeItem(KEY);
  lastWritten = null;
  blocked = false;
  replaceState(defaultState());
  emit('state-changed');
}

export function startAutosave() {
  setInterval(() => { if (document.visibilityState !== "hidden") save(); }, 10000);
  window.addEventListener('beforeunload', save);
}
