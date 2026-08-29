// ============================================================
// EXPEDITIONS — planning, running, and coming home
//
// Deliberately a PLAN rather than an activity: nothing here ticks, and
// the party is not simulated moment to moment. You commit a roster, a
// destination, a risk posture and provisions; the outcome is rolled at
// the moment of departure and revealed when the clock runs out.
//
// Rolling up front rather than on return is a real decision. It means the
// result cannot be re-rolled by closing the tab, and it means the log is
// a fixed story rather than something the game invents to suit how long
// you happened to be away.
// ============================================================
import { state, combatLevel } from '../core/state.js';
import { EXPEDITION, DESTINATIONS, getDestination, RISKS, getRisk,
         PROVISIONS, getProvision, BEATS } from '../data/expeditions.js';
import { combatIncome } from '../data/adventure.js';
import { legacy, available as availableSelves, hurt as hurtSelf, workRate } from './legacy.js';
import { homeBonus } from './home.js';
import { addGold, addItem, itemCount, removeItem } from './inventory.js';
import { getItem } from '../data/items.js';
import { activePet } from './pets.js';
import { emit, on } from '../core/events.js';

let hooks = { queueModal: () => {} };
export function setExpeditionUIHooks(h) { hooks = h; }

export function expedition() {
  if (!state.expedition) {
    state.expedition = { active: null, history: [], completed: 0, bestHaul: 0 };
  }
  return state.expedition;
}

/** Party slots, before and after the house. */
export function partySlots() {
  return Math.min(EXPEDITION.MAX_SLOTS,
    EXPEDITION.BASE_SLOTS + Math.floor(legacy().length / 2) + (homeBonus('party_slots') || 0));
}

/** Everyone who could be sent. */
export function roster() {
  const out = [];
  const pet = activePet();
  if (pet && pet.stage !== 'egg') {
    out.push({ id: `pet:${pet.id}`, kind: 'pet', name: pet.name, icon: '🐾', strength: 0.35 });
  }
  for (const w of availableSelves()) {
    out.push({ id: `self:${w.id}`, kind: 'self', name: w.name,
               icon: w.classIcon || '🎭', strength: 0.5 + workRate(w) });
  }
  return out;
}

export function destinationsOpen() {
  const era = state.era || 1;
  const cl = combatLevel();
  return DESTINATIONS.filter(d => (d.era || 1) <= era)
    .map(d => ({ ...d, open: cl >= d.level }));
}

// ---------------- Sending ----------------

export function canSend() {
  return !expedition().active;
}

export function send({ destinationId, party = [], riskId = 'steady', provisionId = 'none' }) {
  const e = expedition();
  if (e.active) return false;
  const dest = getDestination(destinationId);
  if (!dest) return false;
  if ((dest.era || 1) > (state.era || 1)) return false;
  if (combatLevel() < dest.level) {
    emit('notify', { type: 'sys', text: `Nobody in Hearthwick is ready for ${dest.name} yet.` });
    return false;
  }
  const members = roster().filter(m => party.includes(m.id)).slice(0, partySlots());
  if (!members.length) {
    emit('notify', { type: 'sys', text: 'Send somebody, at least.' });
    return false;
  }

  const risk = getRisk(riskId);
  const prov = getProvision(provisionId);
  if (prov.item) {
    if (itemCount(prov.item) < prov.qty) {
      emit('notify', { type: 'sys', text: `Not enough ${getItem(prov.item)?.name} to pack.` });
      return false;
    }
    removeItem(prov.item, prov.qty);
  }

  // Roll the whole trip now. See the header.
  const outcome = roll(dest, members, risk, prov);

  e.active = {
    destinationId, riskId, provisionId,
    party: members.map(m => ({ id: m.id, kind: m.kind, name: m.name, icon: m.icon })),
    startedAt: Date.now(),
    readyAt: Date.now() + dest.hours * 60 * 60 * 1000,
    outcome,
  };
  // Mark the sent selves as away so they cannot also be working a skill.
  for (const m of members) {
    if (m.kind !== 'self') continue;
    const w = legacy().find(x => `self:${x.id}` === m.id);
    if (w) { w.job = 'expedition'; w.jobSkill = null; }
  }
  emit('notify', { type: 'sys',
    text: `⛩️ ${members.map(m => m.name).join(', ')} left through the gate for ${dest.name}.` });
  emit('expedition-sent', { destinationId });
  emit('state-changed');
  return true;
}

/**
 * Decide what happened. Party strength shifts the odds; risk and
 * provisions shift them harder in opposite directions.
 */
function roll(dest, members, risk, prov) {
  const strength = members.reduce((s, m) => s + m.strength, 0);
  const danger = Math.max(0.02, Math.min(0.85,
    dest.danger * risk.danger * prov.danger / (1 + strength * 0.45)));

  const beats = [];
  const names = members.map(m => m.name);
  const who = () => names[Math.floor(Math.random() * names.length)];
  const nBeats = 3 + Math.floor(Math.random() * 3);
  let mishaps = 0, triumphs = 0;

  for (let i = 0; i < nBeats; i++) {
    const r = Math.random();
    let pool;
    if (r < danger * 0.35) { pool = 'disaster'; mishaps += 2; }
    else if (r < danger) { pool = 'bad'; mishaps += 1; }
    else if (r > 1 - 0.06 * risk.find) { pool = 'triumph'; triumphs += 1; }
    else if (r > 0.62) pool = 'good';
    else pool = 'neutral';
    const lines = BEATS[pool];
    beats.push({ tone: pool, text: lines[Math.floor(Math.random() * lines.length)].replace('{who}', who()) });
  }

  // Pay, in the same combat-minute currency the road and errands use.
  const perMinute = combatIncome(combatLevel(), state.era || 1).gold;
  const swing = 1 + triumphs * 0.35 - mishaps * 0.12;
  const gold = Math.max(0, Math.round(
    perMinute * dest.pay * risk.pay * prov.pay * Math.max(0.25, swing) / 60));

  // What they bring back.
  const finds = {};
  const rolls = 2 + triumphs + Math.floor(risk.find * 2);
  for (let i = 0; i < rolls; i++) {
    if (Math.random() > 0.55 * risk.find) continue;
    const id = dest.loot[Math.floor(Math.random() * dest.loot.length)];
    finds[id] = (finds[id] || 0) + 1 + Math.floor(Math.random() * 3);
  }

  // Somebody hurt, at most one, and only when it really went wrong.
  let hurtId = null;
  if (mishaps >= 3) {
    const selves = members.filter(m => m.kind === 'self');
    if (selves.length) hurtId = selves[Math.floor(Math.random() * selves.length)].id;
  }

  return { beats, gold, finds, hurtId, mishaps, triumphs, danger };
}

// ---------------- Coming home ----------------

export function activeExpedition() {
  const a = expedition().active;
  if (!a) return null;
  return { ...a, ready: Date.now() >= a.readyAt, left: Math.max(0, a.readyAt - Date.now()) };
}

export function collect() {
  const e = expedition();
  const a = e.active;
  if (!a || Date.now() < a.readyAt) return false;
  const dest = getDestination(a.destinationId);
  const o = a.outcome;

  if (o.gold > 0) addGold(o.gold, { silent: true });
  const parts = [`🪙 ${o.gold.toLocaleString()}`];
  for (const [id, qty] of Object.entries(o.finds || {})) {
    addItem(id, qty);
    parts.push(`${getItem(id)?.icon || '📦'} ${getItem(id)?.name || id} ×${qty}`);
  }

  // Release the party, and bench anyone who came back hurt.
  for (const m of a.party) {
    if (m.kind !== 'self') continue;
    const w = legacy().find(x => `self:${x.id}` === m.id);
    if (!w) continue;
    w.job = 'idle';
    if (o.hurtId === m.id) hurtSelf(w.id, EXPEDITION.RECOVER_MS);
  }

  e.completed = (e.completed || 0) + 1;
  e.bestHaul = Math.max(e.bestHaul || 0, o.gold);
  e.history = [{ at: Date.now(), destination: dest?.name, gold: o.gold,
                 beats: o.beats, party: a.party.map(m => m.name) },
               ...(e.history || [])].slice(0, 10);
  e.active = null;

  hooks.queueModal(`
    <div class="modal-tag">◈ THEY ARE BACK ◈</div>
    <div class="modal-title">${dest?.icon || '⛩️'} ${dest?.name || 'The road'}</div>
    <div class="modal-body" style="line-height:1.75">
      <p class="muted">${a.party.map(m => `${m.icon} ${m.name}`).join(' · ')}</p>
      ${o.beats.map(b => `<p class="beat-${b.tone}">${b.text}</p>`).join('')}
      <p style="color:var(--gold);margin-top:12px">${parts.join(' · ')}</p>
      ${o.hurtId ? `<p style="color:var(--danger)">Somebody is sitting the next one out.</p>` : ''}
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Good</button></div>
  `);
  emit('expedition-home', { gold: o.gold });
  emit('state-changed');
  return true;
}

/** Called on load and on tick: bring them home if the clock has run. */
let _wired = false;
/** Subscribe once, so a party comes home while you are still playing. */
export function initExpeditions() {
  if (_wired) return;
  _wired = true;
  on('tick', () => tickExpedition());
}

export function tickExpedition() {
  const a = expedition().active;
  if (a && Date.now() >= a.readyAt) collect();
}

export function expeditionView() {
  return {
    active: activeExpedition(),
    slots: partySlots(),
    roster: roster(),
    destinations: destinationsOpen(),
    risks: RISKS,
    provisions: PROVISIONS.map(p => ({
      ...p, have: p.item ? itemCount(p.item) : Infinity,
      ok: !p.item || itemCount(p.item) >= p.qty,
    })),
    history: expedition().history || [],
    completed: expedition().completed || 0,
  };
}
