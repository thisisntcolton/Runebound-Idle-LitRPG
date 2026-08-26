// ============================================================
// ADVENTURE — the loop, the chains, and what the road remembers
//
// Structurally this is a third activity type alongside skilling and
// fighting: you set out, it ticks, and it interrupts you. The three
// design decisions worth knowing:
//
//  THE JOURNEY PAYS BY ITSELF. Between encounters you find small things.
//  Without that, an idle activity whose entire value arrives in a modal
//  is dead air with a jump scare in it, and closing the tab is strictly
//  better than watching.
//
//  AN OPEN VIGNETTE HALTS THE ROAD. The clock does not keep running while
//  you are being asked a question. Nothing punishes you for being away
//  from the keyboard — the road waits, and if you leave it waiting too
//  long it makes the modest choice for you rather than the cruel one.
//
//  FLAGS ARE FOREVER. What you did is written into state.adventure.flags
//  and survives Ascension, because the whole promise of the system is
//  that the road knows you. That is also why chains can be gated on
//  flags: the payoff for helping somebody is meeting them again.
// ============================================================
import { state, charLevel, combatLevel, classBonus } from '../core/state.js';
import { ADVENTURE, CHAINS, rewardUnit, xpUnit, maxPayout } from '../data/adventure.js';
import { addGold, addItem } from './inventory.js';
import { addXp, stopActivity } from './skills.js';
import { getItem } from '../data/items.js';
import { activePet, gainXp as gainPetXp } from './pets.js';
import { emit, on } from '../core/events.js';
import { maxHp } from '../core/state.js';
import { fmt } from '../core/format.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setAdventureUIHooks(h) { hooks = h; }

export function adv() {
  if (!state.adventure) {
    state.adventure = {
      travelled: 0,       // ms on the road, lifetime
      encounters: 0,      // vignettes answered
      chains: 0,          // chains carried to an ending
      flags: {},          // what the road remembers — survives Ascension
      seen: {},           // chainId -> times finished
      active: null,       // { chainId, beatId, offeredAt }
      nextAt: 0,          // ms of travel until the next encounter
      progress: 0,
    };
  }
  return state.adventure;
}

export function isTravelling() { return state.activity?.type === 'adventure'; }

// ---------------- Speed and reward, per class ----------------

function speedMult() { return 1 + classBonus('adventure_speed'); }
function rewardMult() { return 1 + classBonus('adventure_reward'); }
function luckBonus() { return classBonus('adventure_luck'); }

function scheduleNext() {
  const a = adv();
  const span = ADVENTURE.MAX_MS - ADVENTURE.MIN_MS;
  a.nextAt = (ADVENTURE.MIN_MS + Math.random() * span) / speedMult();
  a.progress = 0;
}

// ---------------- Setting out ----------------

export function setOut() {
  const a = adv();
  stopActivity({ silent: true });
  state.activity = { type: 'adventure' };
  if (!a.nextAt) scheduleNext();
  emit('notify', { type: 'sys', text: '🧭 You set out. The road does the rest.' });
  emit('state-changed');
  return true;
}

export function comeHome({ silent = false } = {}) {
  if (!isTravelling()) return false;
  state.activity = null;
  if (!silent) emit('notify', { type: 'sys', text: '🧭 You turn back toward Hearthwick.' });
  emit('state-changed');
  return true;
}

// ---------------- Which chain ----------------

function eligible(chain) {
  const w = chain.when;
  if (!w) return true;
  if (w.era !== undefined && (state.era || 1) < w.era) return false;
  if (w.charLevel !== undefined && charLevel() < w.charLevel) return false;
  if (w.flag && !adv().flags[w.flag]) return false;
  if (w.notFlag && adv().flags[w.notFlag]) return false;
  return true;
}

function pickChain() {
  const a = adv();
  const pool = CHAINS.filter(eligible);
  if (!pool.length) return null;
  // Weight down anything already finished, so a player sees the breadth
  // of the writing before they see any of it twice.
  const weighted = pool.map(c => ({
    c, w: Math.max(1, (c.weight || 10) / (1 + (a.seen[c.id] || 0) * 1.5)),
  }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const x of weighted) { r -= x.w; if (r <= 0) return x.c; }
  return weighted[0].c;
}

export function getChain(id) { return CHAINS.find(c => c.id === id) || null; }

export function currentBeat() {
  const a = adv();
  if (!a.active) return null;
  const chain = getChain(a.active.chainId);
  if (!chain) return null;
  const beat = chain.beats[a.active.beatId];
  if (!beat) return null;
  return { chain, beat, id: a.active.beatId, expiresAt: a.active.offeredAt + ADVENTURE.DECIDE_MS };
}

function offer(chain, beatId) {
  const a = adv();
  a.active = { chainId: chain.id, beatId, offeredAt: Date.now() };
  emit('adventure-offer', { chainId: chain.id, beatId });
  emit('notify', { type: 'sys', text: `${chain.icon} ${chain.title} — the road asks you something.` });
  emit('state-changed');
}

// ---------------- Effects ----------------

/**
 * Apply one outcome's effects and describe them.
 *
 * Rewards are declared as multiples in the data and scaled here, so a
 * chain written at level 20 is still worth reading at level 150 and
 * nobody has to maintain two hundred hand-tuned gold values.
 */
function applyEffects(fx = {}) {
  const parts = [];
  const era = state.era || 1;
  const cl = combatLevel();
  const unit = rewardUnit(cl, state.ascensions || 0, era);
  const xu = xpUnit(cl, era);
  const mult = rewardMult();

  if (fx.gold) {
    // The cap is a backstop against the class of bug that produced an
    // 820,000-gold vignette, not a balance lever — nothing written today
    // comes close to it.
    const raw = Math.round(fx.gold * unit * (fx.gold > 0 ? mult : 1));
    const amount = raw > 0 ? Math.min(raw, maxPayout(cl, era)) : raw;
    if (amount > 0) { const kept = addGold(amount, { silent: true }); parts.push(`🪙 ${fmt(kept)}`); }
    else { const lost = Math.min(state.gold, -amount); state.gold -= lost; parts.push(`🪙 -${fmt(lost)}`); }
  }
  for (const [id, qty] of Object.entries(fx.items || {})) {
    const n = Math.max(1, Math.round(qty * (mult > 1 ? mult : 1)));
    addItem(id, n);
    parts.push(`${getItem(id)?.icon || '📦'} ${getItem(id)?.name || id} ×${n}`);
  }
  for (const [skillId, n] of Object.entries(fx.xp || {})) {
    if (!state.skills[skillId]) continue;
    addXp(skillId, n * xu * mult);
    parts.push(`✨ ${skillId} XP`);
  }
  if (fx.hp) {
    const cap = maxHp();
    const delta = Math.round(cap * fx.hp);
    const c = state.combat;
    c.playerHp = Math.max(1, Math.min(cap, (c.playerHp || cap) + delta));
    parts.push(delta < 0 ? `💔 ${Math.abs(delta)}` : `❤️ +${delta}`);
  }
  if (fx.shards) { state.shards = (state.shards || 0) + fx.shards; parts.push(`💠 ${fx.shards}`); }
  if (fx.pet_xp) {
    const pet = activePet();
    if (pet && pet.stage !== 'egg') { gainPetXp(pet, fx.pet_xp * mult); parts.push('🐾 bond'); }
  }
  if (fx.flag) adv().flags[fx.flag] = Date.now();
  return parts;
}

// ---------------- Answering ----------------

export function choose(optionId) {
  const cur = currentBeat();
  if (!cur) return false;
  const option = cur.beat.options.find(o => o.id === optionId);
  if (!option) return false;
  return resolve(cur, option, { chosen: true });
}

function resolve(cur, option, { chosen = true } = {}) {
  const a = adv();
  let text = option.outcome;
  let fx = option.effects || {};

  // A risky option rolls, and the Wanderer's luck is the thumb on it.
  if (option.risky) {
    const chance = Math.min(0.95, option.risky.chance + luckBonus());
    const good = Math.random() < chance;
    const branch = good ? option.risky.good : option.risky.bad;
    text = branch.text;
    fx = { ...(branch.effects || {}), ...(option.flag ? { flag: option.flag } : {}) };
  }

  const gained = applyEffects(fx);
  a.encounters = (a.encounters || 0) + 1;

  const next = option.next ? cur.chain.beats[option.next] : null;
  if (next) {
    a.active = { chainId: cur.chain.id, beatId: option.next, offeredAt: Date.now() };
  } else {
    a.active = null;
    a.chains = (a.chains || 0) + 1;
    a.seen[cur.chain.id] = (a.seen[cur.chain.id] || 0) + 1;
    scheduleNext();
  }

  emit('adventure-outcome', {
    chain: cur.chain, option, text, gained, chosen,
    ended: !next,
  });
  emit('notify', { type: 'loot',
    text: `${cur.chain.icon} ${option.label}${gained.length ? ' — ' + gained.join(' · ') : ''}` });
  emit('state-changed');
  return true;
}

/**
 * The road decides for you.
 *
 * Deliberately the FIRST option rather than a random one, and the chains
 * are written with the quieter, kinder choice first. Being away from the
 * keyboard should not be punished — this is an idle game, and the whole
 * point of the timeout is that leaving is safe.
 */
function timeout() {
  const cur = currentBeat();
  if (!cur) return;
  resolve(cur, cur.beat.options[0], { chosen: false });
}

// ---------------- Tick ----------------

export function tickAdventure(dt) {
  if (!isTravelling()) return;
  const a = adv();

  // An open question halts the road entirely. The clock on the question
  // itself is real time, so it still resolves if you wander off.
  if (a.active) {
    const cur = currentBeat();
    if (cur && Date.now() > cur.expiresAt) timeout();
    return;
  }

  a.travelled = (a.travelled || 0) + dt;
  a.progress = (a.progress || 0) + dt;
  if (!a.nextAt) scheduleNext();
  if (a.progress < a.nextAt) return;

  // Something found on the way, so the walking is never dead time.
  const unit = rewardUnit(combatLevel(), state.ascensions || 0, state.era || 1);
  addGold(ADVENTURE.TRAVEL_GOLD * unit * rewardMult(), { silent: true });

  const chain = pickChain();
  if (!chain) { scheduleNext(); return; }
  offer(chain, 'start');
}

// ---------------- View ----------------

export function adventureView() {
  const a = adv();
  const cur = currentBeat();
  return {
    travelling: isTravelling(),
    travelled: a.travelled || 0,
    encounters: a.encounters || 0,
    chains: a.chains || 0,
    flags: Object.keys(a.flags || {}).length,
    seen: a.seen || {},
    total: CHAINS.length,
    discovered: Object.keys(a.seen || {}).length,
    progress: a.nextAt ? Math.min(1, (a.progress || 0) / a.nextAt) : 0,
    nextIn: Math.max(0, (a.nextAt || 0) - (a.progress || 0)),
    speed: speedMult(),
    reward: rewardMult(),
    luck: luckBonus(),
    open: cur ? {
      chain: cur.chain, beat: cur.beat, beatId: cur.id,
      secondsLeft: Math.max(0, Math.round((cur.expiresAt - Date.now()) / 1000)),
    } : null,
  };
}

export function initAdventure() {
  adv();
  // Coming home, dying, or starting anything else ends the journey. The
  // road does not keep walking without you.
  on('death', () => comeHome({ silent: true }));
}
