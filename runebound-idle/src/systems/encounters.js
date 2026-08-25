// ============================================================
// VILLAGE ENCOUNTERS — scheduling, resolution, consequences
//
// One encounter at a time, on a long random timer, only while there is a
// town to have things happen to. Every outcome routes through applyEffects
// so the resolution text and the actual state change can never disagree.
// ============================================================
import { state, maxHp } from '../core/state.js';
import { ENCOUNTERS, getEncounter, ENCOUNTER_MIN_MS, ENCOUNTER_MAX_MS,
         ENCOUNTER_WINDOW_MS } from '../data/encounters.js';
import { getItem } from '../data/items.js';
import { addGold, spendGold, addItem } from './inventory.js';
import { addXp } from './skills.js';
import { emit } from '../core/events.js';
import { fmt } from '../core/format.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setEncounterUIHooks(h) { hooks = h; }

function enc() {
  if (!state.encounters) state.encounters = { nextAt: 0, offer: null, history: {}, resolved: 0 };
  return state.encounters;
}

export function pendingEncounter() {
  const e = enc();
  if (!e.offer) return null;
  if (Date.now() > e.offer.expiresAt) return null;
  return e.offer;
}

function builtPlots() {
  return (state.town?.plots || []).filter(p => p.building);
}

function townLevel() {
  return builtPlots().reduce((s, p) => s + p.level, 0);
}

// ---------------- Scheduling ----------------

function schedule() {
  enc().nextAt = Date.now() + ENCOUNTER_MIN_MS + Math.random() * (ENCOUNTER_MAX_MS - ENCOUNTER_MIN_MS);
}

function eligible() {
  const n = builtPlots().length;
  return ENCOUNTERS.filter(e => n >= (e.minBuildings || 0));
}

function rollEncounter() {
  const pool = eligible();
  if (!pool.length) return null;
  const total = pool.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const e of pool) {
    r -= (e.weight || 1);
    if (r <= 0) return e;
  }
  return pool[pool.length - 1];
}

function offer() {
  const def = rollEncounter();
  if (!def) return;
  const e = enc();
  e.offer = {
    id: def.id,
    startedAt: Date.now(),
    expiresAt: Date.now() + ENCOUNTER_WINDOW_MS,
  };
  emit('notify', { type: 'combat', text: `${def.icon} ${def.name} — Hearthwick needs an answer.` });
  hooks.popup(def.tone === 'good' ? 'SOMETHING IS HAPPENING' : 'TROUBLE IN HEARTHWICK',
    `${def.icon} <b>${def.name}</b><br><span style="font-size:12px;color:var(--text-dim)">Answer it from the town, before it answers itself.</span>`,
    { gold: def.tone === 'good', ttl: 9 });
  emit('encounter-offered', { id: def.id });
  emit('state-changed');
}

// ---------------- Costs ----------------

/**
 * Costs scale with town level so an encounter stays a real decision at
 * every stage instead of becoming free the moment you are rich.
 */
export function costOf(option) {
  if (!option.cost) return 0;
  const perLevel = option.cost.goldPerLevel || 0;
  return Math.floor((option.cost.gold || 0) + perLevel * Math.max(1, townLevel()));
}

export function canPay(option) {
  return state.gold >= costOf(option);
}

// ---------------- Effects ----------------

function randomBuiltPlot() {
  const plots = builtPlots();
  if (!plots.length) return null;
  return plots[Math.floor(Math.random() * plots.length)];
}

/**
 * Apply a declared effect bag and return human-readable lines describing
 * what actually happened — so the modal reports reality, not intent.
 */
function applyEffects(effects, def) {
  const lines = [];
  if (!effects) return lines;

  if (effects.hp) {
    const lost = Math.floor(maxHp() * effects.hp);
    // Never outright kill from an encounter: being away should not end a run.
    state.combat.playerHp = Math.max(1, (state.combat.playerHp || maxHp()) - lost);
    lines.push(`💔 You took <b>${lost}</b> damage.`);
  }

  if (effects.goldFraction) {
    const lost = Math.floor(state.gold * effects.goldFraction);
    if (lost > 0) {
      state.gold = Math.max(0, state.gold - lost);
      lines.push(`🪙 Lost <b>${fmt(lost)}</b> gold.`);
    }
  }

  if (effects.gold) {
    if (effects.gold > 0) {
      const got = addGold(effects.gold, { silent: true });
      lines.push(`🪙 Gained <b>${fmt(got)}</b> gold.`);
    } else {
      const lost = Math.min(state.gold, -effects.gold);
      state.gold -= lost;
      lines.push(`🪙 Lost <b>${fmt(lost)}</b> gold.`);
    }
  }

  if (effects.haltMs) {
    const plot = randomBuiltPlot();
    if (plot) {
      plot.haltedUntil = Math.max(plot.haltedUntil || 0, Date.now() + effects.haltMs);
      lines.push(`⛔ A building is shut for <b>${Math.round(effects.haltMs / 60000)} minutes</b>.`);
    }
  }

  if (effects.damage) {
    const plot = randomBuiltPlot();
    if (plot) {
      const before = plot.level;
      plot.level = Math.max(1, plot.level - effects.damage);
      if (plot.level < before) lines.push(`🏚️ A building dropped to <b>level ${plot.level}</b>.`);
      else lines.push(`🏚️ A building was damaged, but it was already at its lowest.`);
    }
  }

  if (effects.stock) {
    const plot = randomBuiltPlot();
    if (plot && Object.keys(plot.stock || {}).length) {
      let taken = 0;
      for (const [id, qty] of Object.entries(plot.stock)) {
        const lose = Math.floor(qty * effects.stock);
        if (lose > 0) { plot.stock[id] = qty - lose; taken += lose; }
        if (plot.stock[id] <= 0) delete plot.stock[id];
      }
      if (taken > 0) lines.push(`📦 <b>${taken}</b> units of stock taken.`);
    }
  }

  if (effects.population) {
    const t = state.town;
    t.extraPopulation = Math.max(0, (t.extraPopulation || 0) + effects.population);
    lines.push(effects.population > 0
      ? `👥 <b>${effects.population}</b> more people call Hearthwick home.`
      : `👥 <b>${-effects.population}</b> left town.`);
  }

  if (effects.buff) {
    const b = effects.buff;
    state.buffs[b.id] = {
      expiresAt: Date.now() + b.minutes * 60000,
      effects: b.effects, name: b.name, icon: b.icon,
    };
    const desc = Object.entries(b.effects).map(([k, v]) => `+${Math.round(v * 100)}% ${k}`).join(', ');
    lines.push(`${b.icon} <b>${b.name}</b> — ${desc} for ${b.minutes} minutes.`);
  }

  if (effects.items) {
    for (const [id, qty] of Object.entries(effects.items)) {
      addItem(id, qty);
      lines.push(`${getItem(id)?.icon || '📦'} Received <b>${getItem(id)?.name || id} ×${qty}</b>.`);
    }
  }

  if (effects.xp) {
    for (const [skillId, amount] of Object.entries(effects.xp)) {
      addXp(skillId, amount);
      lines.push(`✨ <b>${fmt(amount)}</b> ${skillId} XP.`);
    }
  }

  return lines;
}

/** The robbery chase, which is the one genuinely random option. */
function resolveChase() {
  const won = Math.random() < 0.6;
  if (won) {
    const recovered = Math.floor(2000 + townLevel() * 800);
    const got = addGold(recovered, { silent: true });
    return {
      text: `Pell points; you run. You catch them at the ford, and they are so startled to
             be caught that they simply hand it back and sit down in the water.`,
      lines: [`🪙 Recovered <b>${fmt(got)}</b> gold.`],
    };
  }
  const lines = applyEffects({ goldFraction: 0.10, hp: 0.15 });
  return {
    text: `You run the wrong road. By the time you double back they have had an hour, and
           they have used it. You also fell in a ditch, which nobody needs to know about.`,
    lines,
  };
}

// ---------------- Resolution ----------------

export function resolveEncounter(optionId, { timedOut = false } = {}) {
  const pending = enc().offer;
  if (!pending) return false;
  const def = getEncounter(pending.id);
  if (!def) { enc().offer = null; return false; }

  const option = def.options.find(o => o.id === optionId);
  if (!option) return false;

  const cost = costOf(option);
  if (cost > 0) {
    if (!spendGold(cost)) {
      emit('notify', { type: 'sys', text: `You cannot cover that (${fmt(cost)} gold).` });
      return false;
    }
  }

  let text = option.outcome;
  let lines = [];
  if (option.effects?.chase) {
    const r = resolveChase();
    text = r.text; lines = r.lines;
  } else {
    lines = applyEffects(option.effects, def);
  }
  if (cost > 0) lines.unshift(`🪙 Paid <b>${fmt(cost)}</b> gold.`);

  enc().offer = null;
  enc().resolved = (enc().resolved || 0) + 1;
  enc().history[def.id] = (enc().history[def.id] || 0) + 1;
  schedule();

  hooks.queueModal(`
    <div class="modal-tag">◈ ${timedOut ? 'YOU WERE NOT THERE' : 'HEARTHWICK'} ◈</div>
    <div class="modal-title">${def.icon} ${def.name}</div>
    <div class="modal-body" style="line-height:1.75">
      ${timedOut ? `<p class="muted">You did not answer in time. The town decided for itself.</p>` : ''}
      <p>${text}</p>
      ${lines.length ? `<ul style="list-style:none;padding:0;margin-top:12px">
        ${lines.map(l => `<li style="padding:5px 0;border-bottom:1px dashed rgba(43,58,94,0.5)">${l}</li>`).join('')}
      </ul>` : ''}
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Carry on</button></div>
  `);

  emit('encounter-resolved', { id: def.id, option: optionId, timedOut });
  emit('town-changed', {});
  emit('state-changed');
  return true;
}

// ---------------- Tick ----------------

export function tickEncounters() {
  const e = enc();
  if (!state.town?.unlocked) return;
  if (!builtPlots().length) return;

  const now = Date.now();

  // An unanswered encounter resolves itself, badly but survivably.
  if (e.offer && now > e.offer.expiresAt) {
    const def = getEncounter(e.offer.id);
    if (def) resolveEncounter(def.timeout, { timedOut: true });
    else { e.offer = null; schedule(); }
    return;
  }
  if (e.offer) return;

  if (!e.nextAt) { schedule(); return; }
  if (now >= e.nextAt) offer();
}

export function initEncounters() {
  const e = enc();
  if (!e.nextAt) schedule();
}

/** Everything the town panel needs to render the current encounter. */
export function encounterView() {
  const pending = pendingEncounter();
  if (!pending) return null;
  const def = getEncounter(pending.id);
  if (!def) return null;
  return {
    def,
    remaining: Math.max(0, pending.expiresAt - Date.now()),
    options: def.options.map(o => ({
      ...o, price: costOf(o), affordable: canPay(o),
    })),
  };
}
