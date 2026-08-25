// ============================================================
// UNSTABLE RIFTS — timed emergency events
//
// A tear opens somewhere near Hearthwick and things start coming
// through. You get a window to answer it. Inside, waves escalate
// forever on a hard timer; you seal it by clearing enough of them.
//
// Win  → runes, gold, tomes, a big XP dump.
// Lose → the rift floods, and whatever came through goes looking
//        for the nearest town. Yours.
// ============================================================
import { state, maxHp, combatLevel, dropRateMultiplier } from '../core/state.js';
import { getItem } from '../data/items.js';
import { addGold, addItem, itemCount, removeItem } from './inventory.js';
import { rollEggDrop } from './pets.js';
import { emit } from '../core/events.js';
import { stopActivity } from './skills.js';
import { getBuilding } from '../data/town.js';

export const UNSTABLE = {
  MIN_COMBAT_LEVEL: 10,
  SPAWN_MIN_MS: 20 * 60 * 1000,   // earliest a new tear can appear
  SPAWN_MAX_MS: 45 * 60 * 1000,
  WINDOW_MS: 10 * 60 * 1000,      // how long you have to answer it
  DURATION_MS: 180000,            // 3 minutes inside
  SEAL_WAVES: 10,                 // clear this many to seal it
  RAID_HALT_MS: 10 * 60 * 1000,   // how long a raid shuts your businesses
};

const NAMES = [
  'a hairline tear above the meadow',
  'a wound in the air over the treeline',
  'a seam splitting near the old mine road',
  'a gash of static behind the crossroads',
  'a hole where the horizon should be',
];

const MONSTERS = [
  { name: 'Spilled Thing', icon: '⬜' },
  { name: 'Edge Crawler', icon: '🕸️' },
  { name: 'Half-Written Hound', icon: '🐕' },
  { name: 'Unindexed Horror', icon: '👁️' },
  { name: 'Bleed-Through', icon: '🌫️' },
  { name: 'Torn Sentinel', icon: '🗿' },
];

// ---------------- Spawning ----------------

function scheduleNext(now = Date.now()) {
  const span = UNSTABLE.SPAWN_MAX_MS - UNSTABLE.SPAWN_MIN_MS;
  state.unstable.nextAt = now + UNSTABLE.SPAWN_MIN_MS + Math.random() * span;
}

export function unstableState() { return state.unstable; }

export function pendingRift() {
  const u = state.unstable;
  if (!u.offer) return null;
  if (Date.now() > u.offer.expiresAt) return null;
  return u.offer;
}

export function activeRun() {
  return state.unstable.run || null;
}

/**
 * Difficulty is pinned to your combat level so the event stays relevant
 * forever. Tuned so an on-level, tier-appropriately geared character
 * clears 10 waves in roughly 125-175s against a 180s clock — tight bare,
 * comfortable once abilities are carrying you. Under-geared players
 * simply run out of time, which is the whole point of the event.
 */
function waveMonsterFor(wave) {
  const cl = Math.max(3, combatLevel());
  const flavor = MONSTERS[wave % MONSTERS.length];
  const hpScale = Math.pow(1.10, wave);
  return {
    name: flavor.name,
    icon: flavor.icon,
    hp: Math.floor((10 + cl * 2.2) * hpScale),
    attack: Math.floor((5 + cl * 2.0) * Math.pow(1.08, wave)),
    maxHit: Math.max(2, Math.floor((2 + cl * 0.45) * Math.pow(1.08, wave))),
    // defence climbs far slower than HP so late waves are a damage race,
    // not an accuracy wall
    defense: Math.floor((2 + cl * 0.8) * Math.pow(1.012, wave)),
    attackSpeed: 2500,
  };
}
export { waveMonsterFor };

export function tickUnstable(dt) {
  const u = state.unstable;
  const now = Date.now();

  // schedule the first tear once you're strong enough to answer one
  if (!u.nextAt) {
    if (combatLevel() >= UNSTABLE.MIN_COMBAT_LEVEL) scheduleNext(now);
    return;
  }

  // expire an unanswered offer
  if (u.offer && now > u.offer.expiresAt) {
    emit('notify', { type: 'sys', text: '[ SYSTEM ] The tear closed on its own. This time.' });
    u.offer = null;
    scheduleNext(now);
    emit('state-changed');
  }

  // open a new one
  if (!u.offer && !u.run && now >= u.nextAt && combatLevel() >= UNSTABLE.MIN_COMBAT_LEVEL) {
    u.offer = {
      id: 'ur' + now.toString(36),
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      openedAt: now,
      expiresAt: now + UNSTABLE.WINDOW_MS,
      level: combatLevel(),
    };
    emit('notify', { type: 'combat', text: `⚠ UNSTABLE RIFT — ${u.offer.name}. Something is coming through.` });
    emit('unstable-offer', u.offer);
    emit('state-changed');
  }

  // run the clock on an active incursion
  if (u.run) {
    u.run.remaining -= dt;
    if (u.run.remaining <= 0) failRun('The timer ran out.');
  }
}

// ---------------- The run ----------------

export function enterRift() {
  const offer = pendingRift();
  if (!offer || state.unstable.run) return false;
  stopActivity({ silent: true });
  state.activity = { type: 'combat' };

  const c = state.combat;
  c.dungeonId = null;
  c.zoneId = null;
  c.monsterId = null;
  c.unstable = true;
  c.wave = 0;
  const m = waveMonsterFor(0);
  c.monsterHp = m.hp;
  c.monsterMaxHp = m.hp;
  c.playerHp = maxHp();       // you go in fresh — the danger is the clock
  c.playerTimer = 0;
  c.monsterTimer = 0;
  c.respawn = 0;

  state.unstable.run = {
    id: offer.id,
    startedAt: Date.now(),
    remaining: UNSTABLE.DURATION_MS,
    waves: 0,
    kills: 0,
  };
  state.unstable.offer = null;

  emit('notify', { type: 'combat', text: `🌋 You step into the tear. Seal it by clearing ${UNSTABLE.SEAL_WAVES} waves before the clock runs out.` });
  emit('unstable-start', {});
  emit('state-changed');
  return true;
}

/** Called by combat when an unstable-rift monster dies. */
export function onUnstableKill() {
  const run = state.unstable.run;
  if (!run) return;
  run.waves++;
  run.kills++;
  state.stats.kills++;

  const c = state.combat;
  if (run.waves >= UNSTABLE.SEAL_WAVES) {
    sealRun();
    return;
  }
  const m = waveMonsterFor(run.waves);
  c.monsterHp = m.hp;
  c.monsterMaxHp = m.hp;
  c.respawn = 600;
  emit('notify', { type: 'combat', text: `Wave ${run.waves} down — ${UNSTABLE.SEAL_WAVES - run.waves} to seal.` });
}

function rewardFor(waves) {
  const cl = Math.max(3, combatLevel());
  const gold = Math.floor((120 + cl * 45) * waves * 1.4);
  const items = {};
  const runes = Math.max(1, Math.floor(waves / 3));
  items[cl >= 55 ? 'void_rune' : cl >= 30 ? 'greater_rune' : 'rune_shard'] = runes;
  return { gold, items };
}

function sealRun() {
  const run = state.unstable.run;
  const reward = rewardFor(run.waves);
  const gold = addGold(reward.gold, { silent: true });
  const parts = [`🪙 ${gold.toLocaleString()}`];
  for (const [id, qty] of Object.entries(reward.items)) {
    addItem(id, qty);
    parts.push(`${getItem(id)?.icon} ${getItem(id)?.name} ×${qty}`);
  }
  // sealing has a real shot at a tome
  if (Math.random() < Math.min(0.6, 0.30 * dropRateMultiplier())) {
    const tomes = Object.keys(state.abilities?.known || {});
    const pool = ['tome_heavy_blow', 'tome_cleave', 'tome_parry', 'tome_iron_stance',
                  'tome_auto_elixir', 'tome_execute', 'tome_second_wind', 'tome_firebomb']
      .filter(t => !tomes.includes(t.replace('tome_', '')));
    if (pool.length) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      addItem(pick, 1);
      parts.push(`📕 ${getItem(pick)?.name}`);
      emit('rare-drop', { itemId: pick, rarity: getItem(pick)?.rarity });
    }
  }

  const egg = rollEggDrop('rift-seal');
  if (egg) parts.push(`${getItem(egg)?.icon} ${getItem(egg)?.name}`);

  state.stats.riftsSealed = (state.stats.riftsSealed || 0) + 1;
  emit('notify', { type: 'gold', text: `✅ RIFT SEALED after ${run.waves} waves — ${parts.join(' · ')}` });
  emit('unstable-sealed', { waves: run.waves, reward: parts.join(' · ') });

  endRun();
}

export function failRun(reason = 'You were driven back.') {
  const run = state.unstable.run;
  if (!run) return;
  const waves = run.waves;

  // Partial credit — you still cleared something
  let consolation = '';
  if (waves > 0) {
    const gold = addGold(rewardFor(waves).gold * 0.25, { silent: true });
    consolation = ` You salvaged 🪙 ${gold.toLocaleString()} from ${waves} wave${waves > 1 ? 's' : ''}.`;
  }

  state.stats.riftsFailed = (state.stats.riftsFailed || 0) + 1;
  const raid = raidTown(waves);

  emit('notify', { type: 'combat', text: `💥 THE RIFT FLOODED — ${reason}${consolation}` });
  emit('unstable-failed', { waves, reason, raid });
  endRun();
}

function endRun() {
  state.unstable.run = null;
  state.combat.unstable = false;
  state.combat.wave = 0;
  state.activity = null;
  scheduleNext();
  emit('state-changed');
}

// ---------------- The raid ----------------
// Whatever got through goes looking for the nearest town.

function raidTown(wavesCleared) {
  const t = state.town;
  if (!t?.unlocked) return null;
  const built = t.plots.map((p, i) => ({ p, i })).filter(x => x.p.building);
  if (!built.length) return null;

  // The more you cleared, the less gets through.
  const severity = Math.max(0.2, 1 - wavesCleared / UNSTABLE.SEAL_WAVES);
  const hitCount = Math.max(1, Math.round(built.length * severity * 0.6));
  const targets = built.sort(() => Math.random() - 0.5).slice(0, hitCount);

  const damaged = [];
  let stockLost = 0;
  for (const { p, i } of targets) {
    p.haltedUntil = Date.now() + UNSTABLE.RAID_HALT_MS * severity;
    p.progress = 0;
    // they ransack the stockroom
    for (const [id, qty] of Object.entries(p.stock || {})) {
      const take = Math.ceil(qty * 0.5 * severity);
      p.stock[id] = qty - take;
      stockLost += take;
      if (p.stock[id] <= 0) delete p.stock[id];
    }
    damaged.push(getBuilding(p.building)?.name || `parcel ${i + 1}`);
  }
  const goldLost = Math.floor(state.gold * 0.05 * severity);
  state.gold -= goldLost;

  emit('notify', { type: 'combat', text: `🏘️ HEARTHWICK RAIDED — ${damaged.join(', ')} shut down, ${stockLost} stock stolen, 🪙 ${goldLost.toLocaleString()} lost.` });
  emit('town-changed', {});
  return { damaged, stockLost, goldLost, haltMinutes: Math.round(UNSTABLE.RAID_HALT_MS * severity / 60000) };
}

/** True while a building is shut down after a raid. */
export function plotHalted(plot) {
  return !!(plot.haltedUntil && Date.now() < plot.haltedUntil);
}

export function haltedMinutesLeft(plot) {
  if (!plotHalted(plot)) return 0;
  return Math.ceil((plot.haltedUntil - Date.now()) / 60000);
}

// ---------------- Debug / manual ----------------
export function forceOffer() {
  state.unstable.nextAt = Date.now() - 1;
  state.unstable.offer = null;
}
