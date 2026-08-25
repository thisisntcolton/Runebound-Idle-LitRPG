// ============================================================
// CLOUD SYNC — OAuth session, cloud saves, leaderboard client
//
// Degrades gracefully: with no backend (plain `vite dev`, or a
// static host with no functions) the game is fully playable and
// the account UI just says cloud sync is unavailable.
// ============================================================
import { state, replaceState } from './state.js';
import { save as saveLocal, exportSave, migrate } from './save.js';
import { emit } from './events.js';
import { xpForLevel } from './xp.js';

// A fresh character is not at zero XP — Hitpoints starts at level 10.
// Progress is measured above that baseline so a new device is correctly
// recognised as blank instead of triggering a bogus save conflict.
const STARTING_XP = xpForLevel(10);

export const cloud = {
  status: 'unknown',   // 'unknown' | 'unavailable' | 'signed-out' | 'signed-in'
  user: null,
  providers: [],
  lastSync: null,
  lastError: null,
  syncing: false,
};

let hooks = { queueModal: () => {}, popup: () => {}, renderView: () => {} };
export function setCloudUIHooks(h) { hooks = h; }

const SYNC_INTERVAL_MS = 60_000;

// ---------------- low-level fetch ----------------
async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    // A static host serves index.html for unknown paths — that means no backend.
    throw Object.assign(new Error('no_backend'), { noBackend: true });
  }
  const data = await res.json();
  return { res, data };
}

// ---------------- session ----------------
export async function refreshMe() {
  try {
    const { data } = await api('/api/me');
    cloud.providers = data.providers || [];
    if (data.user) {
      cloud.user = data.user;
      cloud.status = 'signed-in';
    } else {
      cloud.user = null;
      // The backend answered, so it exists. Whether any OAuth provider is
      // configured is a separate question — leaderboards are readable either way.
      cloud.status = 'signed-out';
    }
    cloud.lastError = data.error || null;
  } catch (err) {
    cloud.status = 'unavailable';
    cloud.user = null;
    cloud.lastError = err.noBackend ? null : err.message;
  }
  return cloud.status;
}

export function signIn(provider) {
  window.location.href = `/api/auth/login?provider=${encodeURIComponent(provider)}`;
}

export async function signOut() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  cloud.user = null;
  cloud.status = 'signed-out';
  emit('notify', { type: 'sys', text: '[ SYSTEM ] Signed out. Local progress is untouched.' });
  emit('state-changed');
}

// ---------------- save sync ----------------
export async function pullCloudSave() {
  const { res, data } = await api('/api/save');
  if (res.status === 401) { cloud.status = 'signed-out'; return null; }
  return data.save ? data : null;
}

export async function pushCloudSave({ force = false, silent = true } = {}) {
  if (cloud.status !== 'signed-in' || cloud.syncing) return false;
  cloud.syncing = true;
  try {
    state.lastSeen = Date.now();
    const { res, data } = await api('/api/save', {
      method: 'POST',
      body: JSON.stringify({ save: state, force }),
    });
    if (res.status === 429) return false;           // throttled — next tick will retry
    if (res.status === 401) { cloud.status = 'signed-out'; return false; }
    if (!res.ok) throw new Error(data.error || `push failed (${res.status})`);
    cloud.lastSync = Date.now();
    cloud.lastError = null;
    if (!silent) emit('notify', { type: 'sys', text: '[ SYSTEM ] Progress synced to the cloud.' });
    return true;
  } catch (err) {
    if (!err.noBackend) cloud.lastError = err.message;
    return false;
  } finally {
    cloud.syncing = false;
  }
}

function saveSummary(s) {
  const skills = s?.skills || {};
  const xp = Object.values(skills).reduce((sum, sk) => sum + (sk?.xp || 0), 0);
  const questsDone = s?.quests?.completed
    ? Object.values(s.quests.completed).filter(Boolean).length : 0;
  return {
    gold: Math.floor(s?.gold || 0),
    lifetimeGold: Math.floor(s?.lifetimeGold || 0),
    shards: Math.floor(s?.shards || 0),
    ascensions: Math.floor(s?.ascensions || 0),
    totalXp: Math.floor(xp),
    // XP earned beyond the free starting Hitpoints level
    progressXp: Math.max(0, Math.floor(xp - STARTING_XP)),
    questsDone,
    when: s?.lastSeen || 0,
  };
}

// True for a character that has effectively done nothing yet.
function isBlank(sum) {
  return sum.progressXp < 500
      && sum.lifetimeGold < 100
      && sum.ascensions === 0
      && sum.questsDone === 0;
}

function adoptCloudSave(cloudSave) {
  // Always migrate: a cloud save may predate fields this build expects
  // (or have been trimmed server-side), and a missing field would
  // otherwise crash the game loop.
  replaceState(migrate(cloudSave));
  saveLocal();
  emit('notify', { type: 'sys', text: '[ SYSTEM ] Cloud save restored.' });
  emit('state-changed');
  hooks.renderView();
}

// Decide between local and cloud on sign-in / boot.
async function reconcile() {
  let remote;
  try {
    remote = await pullCloudSave();
  } catch (err) {
    if (!err.noBackend) cloud.lastError = err.message;
    return;
  }

  // Nothing in the cloud yet — upload what we have.
  if (!remote) { await pushCloudSave({ force: true }); return; }

  const local = saveSummary(state);
  const cloudSum = saveSummary(remote.save);

  // Fresh device with a blank character: just take the cloud one.
  if (isBlank(local)) { adoptCloudSave(remote.save); return; }

  // Blank cloud save (signed in, never really played there): push local.
  if (isBlank(cloudSum)) { await pushCloudSave({ force: true }); return; }

  // Cloud is at or behind local on every axis — push local, no need to ask.
  if (cloudSum.progressXp <= local.progressXp
      && cloudSum.ascensions <= local.ascensions
      && cloudSum.lifetimeGold <= local.lifetimeGold) {
    await pushCloudSave({ force: true });
    return;
  }

  // Genuine divergence — let the player choose.
  const fmtN = n => n.toLocaleString('en-US');
  const when = t => t ? new Date(t).toLocaleString() : 'unknown';
  hooks.queueModal(`
    <div class="modal-tag">◈ SAVE CONFLICT ◈</div>
    <div class="modal-title">Two Timelines</div>
    <div class="modal-body">
      <p>The System found a cloud save that differs from the one on this device. Choose which one is real.</p>
      <ul>
        <li><b>☁️ Cloud</b> — ${fmtN(cloudSum.totalXp)} total XP · 🪙 ${fmtN(cloudSum.gold)} · 💠 ${cloudSum.shards} · ${cloudSum.ascensions} ascensions · 📜 ${cloudSum.questsDone} quests<br>
            <span class="muted">saved ${when(cloudSum.when)}</span></li>
        <li><b>💾 This device</b> — ${fmtN(local.totalXp)} total XP · 🪙 ${fmtN(local.gold)} · 💠 ${local.shards} · ${local.ascensions} ascensions · 📜 ${local.questsDone} quests<br>
            <span class="muted">saved ${when(local.when)}</span></li>
      </ul>
      <p class="muted">Whichever you pick overwrites the other. Export a backup in Settings first if you're unsure.</p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" data-act="cloud-use-remote">☁️ Use cloud save</button>
      <button class="btn" data-act="cloud-use-local">💾 Keep this device</button>
    </div>
  `);
  pendingRemote = remote.save;
}

let pendingRemote = null;

export function resolveConflict(choice) {
  if (choice === 'remote' && pendingRemote) adoptCloudSave(pendingRemote);
  else pushCloudSave({ force: true, silent: false });
  pendingRemote = null;
}

export async function syncNow() {
  if (cloud.status !== 'signed-in') return;
  const ok = await pushCloudSave({ force: true, silent: false });
  if (!ok && cloud.lastError) {
    emit('notify', { type: 'sys', text: `[ SYSTEM ] Sync failed: ${cloud.lastError}` });
  }
  emit('state-changed');
}

// ---------------- leaderboard ----------------
export async function fetchLeaderboard(board = 'total_level') {
  const { res, data } = await api(`/api/leaderboard?board=${encodeURIComponent(board)}`);
  if (!res.ok) throw new Error(data.error || 'leaderboard_failed');
  return data;
}

// ---------------- boot ----------------
export async function initCloud() {
  // Surface OAuth results from the redirect, then clean the URL.
  const params = new URLSearchParams(window.location.search);
  const authError = params.get('auth_error');
  const signedIn = params.get('signed_in');
  if (authError || signedIn) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  await refreshMe();

  if (authError) {
    emit('notify', { type: 'sys', text: `[ SYSTEM ] Sign-in failed (${authError}).` });
  }
  if (signedIn && cloud.user) {
    hooks.popup('LINKED', `☁️ Signed in as <b>${cloud.user.name}</b>`, { ttl: 4 });
    emit('notify', { type: 'sys', text: `[ SYSTEM ] Signed in as ${cloud.user.name}. Progress will sync.` });
  }

  if (cloud.status === 'signed-in') {
    await reconcile();
    setInterval(() => pushCloudSave(), SYNC_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && cloud.status === 'signed-in') {
        state.lastSeen = Date.now();
        // keepalive lets the request finish as the tab goes away
        fetch('/api/save', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ save: state, force: true }),
          keepalive: true,
        }).catch(() => {});
      }
    });
  }

  emit('state-changed');
}

export { exportSave };
