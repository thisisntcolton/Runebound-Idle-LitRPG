// ============================================================
// SAVE / LOAD — localStorage autosave + export/import strings
// ============================================================
import { state, replaceState, defaultState, SAVE_VERSION } from './state.js';
import { emit } from './events.js';

const KEY = 'runebound-save-v1';
let lastWritten = null;
let blocked = false;
let backupAt = 0;
let lastSaved = null;
let storageError = false;
export function saveStatus() { return { blocked, lastSaved, storageError }; }
export function backupSave(label = 'manual') {
  try { localStorage.setItem(`${KEY}-backup-${label}`, JSON.stringify(state)); } catch (e) { console.warn('Backup failed', e); }
}
function parseSave(raw) {
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data) || !data.skills || typeof data.skills !== 'object' || Array.isArray(data.skills)) throw new Error('Invalid save');
  for (const [id, skill] of Object.entries(data.skills)) {
    if (!skill || typeof skill !== 'object' || Array.isArray(skill) || typeof skill.xp !== 'number' || !Number.isFinite(skill.xp) || skill.xp < 0) throw new Error(`Invalid skill: ${id}`);
  }
  return data;
}

export function save() {
  try {
    if (blocked) return false;
    const previous = localStorage.getItem(KEY);
    if (previous !== lastWritten) { blocked = true; emit("notify", {type:"sys", text:"Another tab changed your save. Export this session and reload before continuing."}); return false; }
    if (typeof document === "undefined" || document.visibilityState !== "hidden") state.lastSeen = Date.now();
    if (previous && Date.now() - backupAt >= 300000) {
      localStorage.setItem(`${KEY}-backup-previous`, previous); backupAt = Date.now();
    }
    const next = JSON.stringify(state);
    localStorage.setItem(KEY, next);
    lastWritten = next;
    lastSaved = Date.now();
    storageError = false;
    return true;
  } catch (e) {
    console.warn('Save failed', e);
    if (!storageError) emit('notify', {type:'sys', text:'Saving failed. Export your progress and check browser storage.'});
    storageError = true;
    return false;
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    lastWritten = raw;
    const data = parseSave(raw);
    replaceState(migrate(data));
    lastSaved = Number.isFinite(data.lastSeen) ? data.lastSeen : null;
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

/** Replace a save only after validation, a backup of the existing raw value, and a successful write. */
export function restoreSave(data, label = 'before-import') {
  try {
    const validated = parseSave(JSON.stringify(data));
    const nextState = migrate(validated);
    const previous = localStorage.getItem(KEY);
    if (previous !== null) localStorage.setItem(`${KEY}-backup-${label}`, previous);
    const next = JSON.stringify(nextState);
    localStorage.setItem(KEY, next);
    lastWritten = next;
    lastSaved = Date.now();
    blocked = false;
    storageError = false;
    replaceState(nextState);
  } catch (e) {
    console.warn('Restore failed; current save preserved', e);
    return false;
  }
  emit('state-changed');
  return true;
}

export function importSave(text) {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(text.trim()))));
    return restoreSave(data, 'before-import');
  } catch { return false; }
}

export function hardReset() {
  backupSave("before-reset");
  localStorage.removeItem(KEY);
  lastWritten = null;
  blocked = false;
  lastSaved = null;
  storageError = false;
  replaceState(defaultState());
  emit('state-changed');
}

export function startAutosave() {
  setInterval(() => { if (document.visibilityState !== "hidden") save(); }, 10000);
  window.addEventListener('beforeunload', save);
}
