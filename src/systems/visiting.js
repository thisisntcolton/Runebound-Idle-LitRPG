// ============================================================
// VISITING — other people's Hearthwicks
//
// Asynchronous on purpose. There is no live server, no presence and no
// chat: you publish a snapshot of your town, and other players can walk
// through it and leave something on the doorstep. The game feels
// populated without anybody having to be online at the same time, and
// without a moderation surface that a one-person project cannot staff.
//
// SECURITY POSTURE. Everything that comes back from /api/town was written
// by another player. It is validated server-side and it is escaped again
// here at the render boundary, because "the server cleaned it" is exactly
// the assumption that goes stale the day somebody adds a second writer.
// Nothing from a snapshot is ever interpolated into HTML unescaped, and
// nothing from a snapshot is ever used to look up a bonus or grant an
// item — a visitor sees a town, and that is all a town can do to them.
// ============================================================
import { state } from '../core/state.js';
import { homeSnapshot } from './home.js';
import { legacy } from './legacy.js';
import { livingHere, bondOf } from './lives.js';
import { townLevel } from './town.js';
import { addItem } from './inventory.js';
import { cloud } from '../core/cloud.js';
import { emit } from '../core/events.js';

export const visiting = {
  loading: false, error: null,
  town: null,          // the snapshot being viewed
  gifts: [],           // waiting for you
  lastPublished: 0,
};

/** What we tell the world about this town. */
export function snapshot() {
  return {
    townName: state.town?.name || 'Hearthwick',
    townLevel: townLevel(),
    era: state.era || 1,
    ascensions: state.ascensions || 0,
    plots: (state.town?.plots || []).map(p => ({ building: p.building, level: p.level })),
    home: homeSnapshot(),
    residents: livingHere().map(id => ({ id, bond: Math.round(bondOf(id)) })),
    legacy: legacy().map(w => ({
      name: w.name, cycle: w.cycle, className: w.className,
      classIcon: w.classIcon, title: w.title, charLevel: w.charLevel,
    })),
  };
}

async function api(path, opts) {
  const res = await fetch(path, { credentials: 'include', ...opts });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

/** Publish, at most every few minutes — this is not a heartbeat. */
export async function publish({ force = false } = {}) {
  if (cloud.status !== 'signed-in') return false;
  if (!force && Date.now() - visiting.lastPublished < 5 * 60 * 1000) return false;
  try {
    await api('/api/town', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot: snapshot() }),
    });
    visiting.lastPublished = Date.now();
    return true;
  } catch { return false; }
}

export async function visit(userId) {
  visiting.loading = true;
  visiting.error = null;
  visiting.town = null;
  emit('state-changed');
  try {
    const { town } = await api(`/api/town?user=${encodeURIComponent(userId)}`);
    visiting.town = town;
    if (!town) visiting.error = 'They have not opened their gates yet.';
  } catch {
    visiting.error = 'Could not reach that town.';
  }
  visiting.loading = false;
  emit('state-changed');
  return visiting.town;
}

export async function leaveGift(userId, note = '') {
  if (cloud.status !== 'signed-in') {
    emit('notify', { type: 'sys', text: 'Sign in to leave anything.' });
    return false;
  }
  try {
    await api(`/api/town?gift=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    emit('notify', { type: 'sys', text: 'Left on the doorstep.' });
    return true;
  } catch (e) {
    emit('notify', { type: 'sys', text: 'They have already had something from you today.' });
    return false;
  }
}

export async function loadGifts() {
  if (cloud.status !== 'signed-in') { visiting.gifts = []; return []; }
  try {
    const { gifts } = await api('/api/town');
    visiting.gifts = gifts || [];
  } catch { visiting.gifts = []; }
  emit('state-changed');
  return visiting.gifts;
}

/**
 * Take in whatever has been left.
 *
 * The server marks the gifts claimed and returns what they were; the
 * reward is granted here. Deliberately small and fixed — a gift is a
 * gesture, and anything worth farming would turn visiting into a chore
 * and then into an exploit.
 */
export async function claimGifts() {
  if (cloud.status !== 'signed-in') return false;
  try {
    const { claimed } = await api('/api/town', { method: 'DELETE' });
    if (!claimed?.length) return false;
    for (const _ of claimed) addItem('rune_shard', 2);
    visiting.gifts = [];
    emit('notify', { type: 'gold',
      text: `🎁 ${claimed.length} thing${claimed.length === 1 ? '' : 's'} left on your doorstep, taken in.` });
    emit('state-changed');
    return claimed;
  } catch { return false; }
}
