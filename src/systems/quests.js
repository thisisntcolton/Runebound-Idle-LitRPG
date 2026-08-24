// ============================================================
// QUEST ENGINE — event-driven progress, auto-complete rewards,
// story fragments, cycle revelations, and the ending choice.
// ============================================================
import { state, skillLevel } from '../core/state.js';
import { MAIN_QUESTS, SIDE_QUESTS, BOUNTIES, ALL_QUESTS, getQuest } from '../data/quests.js';
import { FRAGMENTS, CYCLES, ENDING, WHISPERS } from '../data/lore.js';
import { getItem } from '../data/items.js';
import { getZone } from '../data/monsters.js';
import { on, emit } from '../core/events.js';
import { addGold, addItem } from './inventory.js';

// UI hooks injected by the renderer (avoids circular imports)
let hooks = { queueModal: () => {}, popup: () => {} };
export function setQuestUIHooks(h) { hooks = h; }

// ---------------- Active-quest queries ----------------
export function activeMainQuest() {
  for (const q of MAIN_QUESTS) {
    if (state.quests.completed[q.id]) continue;
    if (q.requires && !state.quests.completed[q.requires]) return null; // chain gap (shouldn't happen)
    return q;
  }
  return null;
}

export function activeSideQuests() {
  return SIDE_QUESTS.filter(q =>
    !state.quests.completed[q.id] && (state.hirelings[q.unlockHireling] || 0) > 0);
}

export function questProgress(q) {
  const g = q.goal;
  const p = state.quests.progress[q.id] || 0;
  switch (g.kind) {
    case 'kill':
    case 'killZone':
    case 'loot':
    case 'craft': return { cur: Math.min(p, g.count), max: g.count };
    case 'skill': return { cur: skillLevel(g.skill), max: g.level };
    case 'hire': return { cur: Object.values(state.hirelings).filter(v => v > 0).length, max: g.count };
    case 'goldLifetime': return { cur: Math.min(state.lifetimeGold, g.amount), max: g.amount };
    default: return { cur: 0, max: 1 };
  }
}

function isComplete(q) {
  const { cur, max } = questProgress(q);
  return cur >= max;
}

// ---------------- Progress accumulation ----------------
function bumpCounters(fn) {
  // fn(goal) -> increment or 0, applied to every active, counter-based quest
  const actives = [activeMainQuest(), ...activeSideQuests()].filter(Boolean);
  for (const q of actives) {
    const inc = fn(q.goal);
    if (inc > 0) {
      state.quests.progress[q.id] = (state.quests.progress[q.id] || 0) + inc;
    }
  }
}

// ---------------- Completion ----------------
function completeQuest(q) {
  state.quests.completed[q.id] = true;
  const r = q.reward || {};
  const parts = [];
  if (r.gold) { const g = addGold(r.gold, { silent: true }); parts.push(`🪙 ${g}`); }
  if (r.shards) { state.shards += r.shards; parts.push(`💠 ${r.shards}`); }
  if (r.items) {
    for (const [id, qty] of Object.entries(r.items)) {
      addItem(id, qty);
      parts.push(`${getItem(id)?.icon || ''} ${getItem(id)?.name} ×${qty}`);
    }
  }
  emit('notify', { type: 'sys', text: `[ QUEST COMPLETE ] ${q.name} — ${parts.join(' · ') || 'the System is pleased'}` });
  hooks.popup('QUEST COMPLETE', `📜 <b>${q.name}</b><br><span style="font-size:12px">${parts.join(' · ')}</span>`, { gold: true, ttl: 4.5 });

  if (q.story) unlockFragment(q.story);
  emit('quest-complete', { questId: q.id });

  // Offer the next main quest
  const next = activeMainQuest();
  if (next && !state.quests.seenOffers[next.id]) {
    state.quests.seenOffers[next.id] = true;
    emit('notify', { type: 'sys', text: next.offer });
  }
  emit('state-changed');
}

function unlockFragment(fragId) {
  const frag = FRAGMENTS[fragId];
  if (!frag) return;
  const firstTime = !state.loreSeen[fragId];
  state.loreSeen[fragId] = true;
  if (firstTime) {
    hooks.queueModal(`
      <div class="modal-tag">◈ LORE FRAGMENT RECOVERED ◈</div>
      <div class="modal-title">${frag.title}</div>
      <div class="modal-body" style="line-height:1.7">${frag.text}</div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Remember</button></div>
    `);
  }
}

function checkAll() {
  const actives = [activeMainQuest(), ...activeSideQuests()].filter(Boolean);
  for (const q of actives) {
    if (isComplete(q)) completeQuest(q);
  }
}

// ---------------- Bounties ----------------
export function bountyState(zoneId) {
  const def = BOUNTIES.find(b => b.zone === zoneId);
  if (!def) return null;
  const b = state.bounties[zoneId] || { kills: 0, claimed: 0 };
  return { def, kills: b.kills, claimed: b.claimed };
}

function bumpBounty(zoneId) {
  const def = BOUNTIES.find(b => b.zone === zoneId);
  if (!def) return;
  if (!state.bounties[zoneId]) state.bounties[zoneId] = { kills: 0, claimed: 0 };
  const b = state.bounties[zoneId];
  b.kills++;
  if (b.kills >= def.count) {
    b.kills = 0;
    b.claimed++;
    const g = addGold(def.gold, { silent: true });
    const zone = getZone(zoneId);
    emit('notify', { type: 'gold', text: `[ BOUNTY ] ${zone.name} culled ×${b.claimed} — +${g} gold` });
    hooks.popup('BOUNTY PAID', `${zone.icon} ${zone.name}<br><span style="font-size:12px">🪙 +${g}</span>`, { gold: true });
  }
}

// ---------------- Cycles & the ending ----------------
function onAscended() {
  const n = Math.min(state.ascensions, 4);
  const cycle = CYCLES[n];
  if (state.ending === 'broken') {
    emit('notify', { type: 'sys', text: `[ SYSTEM ] Cycle ${state.ascensions + 1} begins — voluntarily, this time. Welcome back.` });
    return;
  }
  if (cycle && !state.cycleSeen[n]) {
    state.cycleSeen[n] = true;
    hooks.queueModal(`
      <div class="modal-tag">◈ THE WORLD WINDS BACK ◈</div>
      <div class="modal-title">${cycle.title}</div>
      <div class="modal-body" style="line-height:1.7">${cycle.text}</div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Wake up</button></div>
    `);
  }
}

function maybeOfferEnding() {
  if (state.ending === 'broken') return;
  if (state.ascensions < 4) return;
  if (state.endingOfferedCycle === state.ascensions) return; // once per cycle
  state.endingOfferedCycle = state.ascensions;
  hooks.queueModal(`
    <div class="modal-tag">◈ THE CHOICE ◈</div>
    <div class="modal-title">${ENDING.offer.title}</div>
    <div class="modal-body" style="line-height:1.7">${ENDING.offer.text}</div>
    <div class="modal-actions">
      <button class="btn btn-gold" data-act="ending-feed">🔥 Feed the Flame (+5 💠)</button>
      <button class="btn btn-primary" data-act="ending-break">⛓️ Break the Cycle</button>
    </div>
  `);
}

export function chooseEnding(choice) {
  if (choice === 'feed') {
    state.shards += 5;
    state.ending = state.ending || 'fed';
    hooks.queueModal(`
      <div class="modal-tag">◈ ◈ ◈</div>
      <div class="modal-title">${ENDING.fed.title}</div>
      <div class="modal-body" style="line-height:1.7">${ENDING.fed.text}</div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Begin again</button></div>
    `);
    emit('notify', { type: 'sys', text: '[ SYSTEM ] The seal is renewed. +5 Fate Shards. He\'ll see you at the top.' });
  } else if (choice === 'break') {
    state.ending = 'broken';
    hooks.queueModal(`
      <div class="modal-tag">◈ TRUE ENDING ◈</div>
      <div class="modal-title">${ENDING.broken.title}</div>
      <div class="modal-body" style="line-height:1.7">${ENDING.broken.text}</div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Begin — truly begin</button></div>
    `);
    emit('notify', { type: 'sys', text: '[ SYSTEM ] Seal released. Cyclebreaker bonus active: all yields +10%. Thank you, Operator.' });
  }
  emit('state-changed');
}

// ---------------- Whispers ----------------
function startWhispers() {
  setInterval(() => {
    if (state.ending === 'broken') return;
    if (Math.random() < 0.4) {
      const line = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
      emit('notify', { type: 'loot', text: line });
    }
  }, 6 * 60 * 1000);
}

// ---------------- Init ----------------
export function initQuests() {
  on('loot', ({ itemId, qty, source }) => {
    bumpCounters(g => {
      if (g.kind === 'loot' && g.item === itemId) return qty;
      if (g.kind === 'craft' && g.item === itemId && source === 'skill') return qty;
      return 0;
    });
    checkAll();
  });

  on('kill', ({ monsterId, zoneId, boss }) => {
    bumpCounters(g => {
      if (g.kind === 'kill' && g.monster === monsterId) return 1;
      if (g.kind === 'killZone' && g.zone === zoneId) return 1;
      return 0;
    });
    bumpBounty(zoneId);
    checkAll();
    if (boss && monsterId === 'aurelion') maybeOfferEnding();
  });

  on('level-up', checkAll);
  on('char-level', checkAll);
  on('gold', checkAll);
  on('hireling-hired', checkAll);
  on('ascended', onAscended);

  // Announce the very first quest on a fresh save
  const first = activeMainQuest();
  if (first && !state.quests.seenOffers[first.id]) {
    state.quests.seenOffers[first.id] = true;
    emit('notify', { type: 'sys', text: first.offer });
  }

  startWhispers();
}
