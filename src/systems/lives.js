// ============================================================
// THE RESIDENTS' LIVES
//
// Where they are, how they feel about you, and what they want.
//
// The bond is the load-bearing number and it moves slowly on purpose. A
// relationship you can max in an evening is a progress bar with a face
// drawn on it; one that takes a week of turning up is the thing that
// makes a town feel like somewhere you live.
//
// Everything here survives Ascension. That is not a convenience — it is
// the entire argument the game has been making since the first cycle
// note. The world winds back. These people do not.
// ============================================================
import { state } from '../core/state.js';
import { LIVES, BOND, TIERS, tierFor, REQUEST_MS, REQUEST_COOLDOWN_MS, getLife } from '../data/lives.js';
import { NOTABLES } from '../data/npcs.js';
import { hourNow } from '../data/places.js';
import { residents } from './npcs.js';
import { homeBonus } from './home.js';
import { addGold, itemCount, removeItem } from './inventory.js';
import { getItem } from '../data/items.js';
import { emit } from '../core/events.js';

const DAY = 24 * 60 * 60 * 1000;

export function lives() {
  if (!state.lives) state.lives = {};
  return state.lives;
}

export function record(id) {
  const l = lives();
  if (!l[id]) {
    l[id] = { bond: 0, met: Date.now(), lastSeen: 0, spokeAt: 0,
              request: null, requestDoneAt: 0, done: 0, ignored: 0, gifts: 0 };
  }
  return l[id];
}

/**
 * Bond, after idle decay.
 *
 * Stored as a value plus the timestamp it was true at, the same way pet
 * care works — so time passing while the game is closed costs the same as
 * time passing while it is open, and neither needs a tick.
 */
export function bondOf(id) {
  const r = record(id);
  const days = Math.max(0, (Date.now() - (r.lastSeen || r.met)) / DAY);
  const decayed = (r.bond || 0) - days * BOND.DECAY_PER_DAY;
  return Math.max(0, Math.min(BOND.MAX, decayed));
}

export function tierOf(id) { return tierFor(bondOf(id)); }

function moveBond(id, delta) {
  const r = record(id);
  // Settle the decay before applying the change, or a change made after a
  // long absence would be measured against a bond that no longer exists.
  const now = bondOf(id);
  const warmth = delta > 0 ? 1 + homeBonus('resident_mood') : 1;
  r.bond = Math.max(0, Math.min(BOND.MAX, now + delta * warmth));
  r.lastSeen = Date.now();
  return r.bond;
}

// ---------------- Where everyone is ----------------

/** The resident ids actually living here right now. */
export function livingHere() {
  const era = state.era || 1;
  return residents()
    .map(n => n.id)
    .filter(id => LIVES[id] && (!LIVES[id].era || LIVES[id].era <= era));
}

/** Where one person is, this hour. `home` means not findable. */
export function whereIs(id, at = hourNow()) {
  const life = getLife(id);
  if (!life) return null;
  return life.at[at.id] || 'home';
}

/** Everyone at a given place right now, with their state attached. */
export function peopleAt(placeId) {
  const hour = hourNow();
  return livingHere()
    .filter(id => whereIs(id, hour) === placeId)
    .map(id => personView(id));
}

export function personView(id) {
  const def = NOTABLES.find(n => n.id === id);
  const life = getLife(id);
  const r = record(id);
  const bond = bondOf(id);
  const tier = tierFor(bond);
  const lines = life?.dialogue?.[tier.id] || life?.dialogue?.stranger || [];
  return {
    id, def, life, bond, tier,
    trade: life?.trade || def?.role,
    line: lines[Math.floor((Date.now() / 60000 + id.length) % lines.length)] || '',
    where: whereIs(id),
    request: activeRequest(id),
    spokeRecently: Date.now() - (r.spokeAt || 0) < 60 * 60 * 1000,
    done: r.done || 0,
    gifts: r.gifts || 0,
  };
}

// ---------------- Talking ----------------

export function talkTo(id) {
  const r = record(id);
  const recently = Date.now() - (r.spokeAt || 0) < 60 * 60 * 1000;
  if (!recently) {
    moveBond(id, BOND.VISIT);
    r.spokeAt = Date.now();
  }
  // Turning up is also what prompts them to ask for things.
  maybeAsk(id);
  emit('state-changed');
  return personView(id);
}

// ---------------- Requests ----------------

export function activeRequest(id) {
  const r = record(id);
  if (!r.request) return null;
  if (Date.now() > r.request.expiresAt) return null;
  return r.request;
}

function maybeAsk(id) {
  const r = record(id);
  if (r.request && Date.now() <= r.request.expiresAt) return;
  if (r.request && Date.now() > r.request.expiresAt) {
    // Let it lapse, and let it cost something. Quietly.
    moveBond(id, BOND.IGNORED);
    r.ignored = (r.ignored || 0) + 1;
    r.request = null;
  }
  if (Date.now() - (r.requestDoneAt || 0) < REQUEST_COOLDOWN_MS) return;
  const life = getLife(id);
  if (!life?.requests?.length) return;
  const pool = life.requests;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  r.request = { ...pick, askedAt: Date.now(), expiresAt: Date.now() + REQUEST_MS, start: snapshotFor(pick) };
  emit('notify', { type: 'sys', text: `${NOTABLES.find(n => n.id === id)?.icon || '🙂'} ${NOTABLES.find(n => n.id === id)?.name} has asked you for something.` });
}

/** The counters a progress-based request measures against. */
function snapshotFor(req) {
  const n = req.need || {};
  if (n.kill !== undefined) return state.stats?.kills || 0;
  if (n.adventure !== undefined) return state.adventure?.chains || 0;
  if (n.enchants !== undefined) return state.stats?.enchants || 0;
  if (n.townCycles !== undefined) return state.town?.cycles || 0;
  if (n.depth !== undefined) return 0;
  if (n.wardens !== undefined) return state.deep?.wardens || 0;
  if (n.furniture !== undefined) return 0;
  return 0;
}

/** How far along a request is: { cur, max, ready }. */
export function requestProgress(id) {
  const req = activeRequest(id);
  if (!req) return null;
  const n = req.need || {};
  const from = req.start || 0;
  let cur = 0, max = 1;
  if (n.item) { cur = itemCount(n.item); max = n.count; }
  else if (n.kill !== undefined) { cur = (state.stats?.kills || 0) - from; max = n.kill; }
  else if (n.adventure !== undefined) { cur = (state.adventure?.chains || 0) - from; max = n.adventure; }
  else if (n.enchants !== undefined) { cur = (state.stats?.enchants || 0) - from; max = n.enchants; }
  else if (n.townCycles !== undefined) { cur = (state.town?.cycles || 0) - from; max = n.townCycles; }
  else if (n.wardens !== undefined) { cur = (state.deep?.wardens || 0) - from; max = n.wardens; }
  else if (n.depth !== undefined) { cur = state.deep?.best || 0; max = n.depth; }
  else if (n.furniture !== undefined) {
    cur = Object.values(state.home?.placed || {}).flat().length; max = n.furniture;
  }
  cur = Math.max(0, cur);
  return { cur: Math.min(cur, max), max, ready: cur >= max, req };
}

export function deliver(id) {
  const p = requestProgress(id);
  if (!p?.ready) return false;
  const r = record(id);
  const req = p.req;
  // An item request is actually handed over. A deed request is simply met.
  if (req.need?.item) removeItem(req.need.item, req.need.count);

  const gold = Math.round((req.reward?.gold || 0) * (1 + homeBonus('gift_value')));
  if (gold) addGold(gold, { silent: true });
  moveBond(id, BOND.REQUEST);
  r.request = null;
  r.requestDoneAt = Date.now();
  r.done = (r.done || 0) + 1;

  const who = NOTABLES.find(n => n.id === id);
  emit('notify', { type: 'gold',
    text: `${who?.icon || '🙂'} ${who?.name}: that\'s what I needed. — 🪙 ${gold.toLocaleString()}` });
  emit('request-done', { id });
  emit('state-changed');
  return true;
}

// ---------------- Gifts ----------------

export function canGift(id, itemId) {
  const item = getItem(itemId);
  if (!item) return false;
  return itemCount(itemId) > 0;
}

export function gift(id, itemId) {
  if (!canGift(id, itemId)) return false;
  const life = getLife(id);
  const item = getItem(itemId);
  removeItem(itemId, 1);
  const liked = (life?.likes || []).includes(itemId);
  moveBond(id, liked ? BOND.GIFT_LIKED : BOND.GIFT_FINE);
  const r = record(id);
  r.gifts = (r.gifts || 0) + 1;
  const who = NOTABLES.find(n => n.id === id);
  emit('notify', { type: 'sys', text: liked
    ? `${who?.icon} ${who?.name} lights up at the ${item.name}.`
    : `${who?.icon} ${who?.name} accepts the ${item.name} politely.` });
  emit('state-changed');
  return true;
}

/** What this person would actually like, out of what you are carrying. */
export function giftableFor(id) {
  const life = getLife(id);
  const likes = new Set(life?.likes || []);
  return Object.keys(state.inventory || {})
    .filter(k => (state.inventory[k] || 0) > 0 && getItem(k))
    .map(k => ({ id: k, item: getItem(k), qty: state.inventory[k], liked: likes.has(k) }))
    .sort((a, b) => (b.liked ? 1 : 0) - (a.liked ? 1 : 0) || (b.item.sell || 0) - (a.item.sell || 0))
    .slice(0, 12);
}

/** Everyone, for the Square's roster. */
export function townView() {
  return livingHere().map(personView);
}
