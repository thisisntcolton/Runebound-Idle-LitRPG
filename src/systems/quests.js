// ============================================================
// QUEST ENGINE — event-driven progress, auto-complete rewards,
// story fragments, cycle revelations, and the ending choice.
// ============================================================
import { state, skillLevel } from '../core/state.js';
import { SOFT_CAP } from '../core/xp.js';
import { MAIN_QUESTS, SIDE_QUESTS, DEEDS, BOUNTIES, ALL_QUESTS, getQuest } from '../data/quests.js';
import { FRAGMENTS, CYCLES, ENDING, WHISPERS, WASTE_TRAFFIC, WASTES_ARRIVAL } from '../data/lore.js';
import { getItem } from '../data/items.js';
import { getZone } from '../data/monsters.js';
import { on, emit } from '../core/events.js';
import { addGold, addItem } from './inventory.js';

// UI hooks injected by the renderer (avoids circular imports)
let hooks = { queueModal: () => {}, popup: () => {} };
export function setQuestUIHooks(h) { hooks = h; }

// ---------------- Active-quest queries ----------------
export function activeMainQuest() {
  const era = state.era || 1;
  for (const q of MAIN_QUESTS) {
    if (state.quests.completed[q.id]) continue;
    // Era II quests do not exist until you are out of the box.
    if ((q.era || 1) > era) return null;
    if (q.requires && !state.quests.completed[q.requires]) return null; // chain gap (shouldn't happen)
    return q;
  }
  return null;
}

/** Set by other systems to complete a `flag` goal. */
export function setQuestFlag(name) {
  if (!state.quests.flags) state.quests.flags = {};
  if (state.quests.flags[name]) return;
  state.quests.flags[name] = Date.now();
  checkAll();
  emit('state-changed');
}

export function activeSideQuests() {
  const open = SIDE_QUESTS.filter(q =>
    !state.quests.completed[q.id] && (state.hirelings[q.unlockHireling] || 0) > 0);
  return [...open, ...activeDeeds()];
}

/**
 * Deeds — standalone quests with their own gates rather than a hireling.
 *
 * Side quests were all keyed to hiring somebody, which meant every new
 * system shipped with nothing to do in the Journal. A deed gates on
 * whatever it is actually about.
 */
export function activeDeeds() {
  const era = state.era || 1;
  return DEEDS.filter(q => {
    if (state.quests.completed[q.id]) return false;
    const w = q.when || {};
    if (w.era && era < w.era) return false;
    if (w.ascensions !== undefined && (state.ascensions || 0) < w.ascensions) return false;
    if (w.requires && !state.quests.completed[w.requires]) return false;
    return true;
  });
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
    // A flag goal is completed by another system announcing it, rather than
    // by a counter — used for the Era II beats that are events, not grinds.
    case 'flag': return { cur: state.quests.flags?.[g.flag] ? 1 : 0, max: 1 };
    // A counter that already exists somewhere on state. Added because
    // every new system since v1.4 keeps its own tally — chains walked,
    // hands played, wardens felled — and writing a bespoke goal kind for
    // each one would mean the quest engine grows a branch per feature
    // forever. One dotted path reads all of them.
    case 'count': return { cur: Math.min(readPath(g.path), g.count), max: g.count };
    default: return { cur: 0, max: 1 };
  }
}

/** Read a dotted path off state, treating anything missing as zero. */
function readPath(path) {
  let node = state;
  for (const part of String(path || '').split('.')) {
    if (node == null) return 0;
    node = node[part];
  }
  return Number(node) || 0;
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
    emit('notify', { type: 'sys',
      text: `[ SYSTEM ] Reset ${state.ascensions + 1} logged. Nothing was reclaimed. This continues to be noted.` });
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

/**
 * Has this player earned the right to end the loop?
 *
 * Deliberately does NOT ask whether the popup has already fired. The
 * popup was the only route to the single most important transition in the
 * game, and it consumed its own gate before rendering — so closing the
 * modal without picking a button (or picking the comfortable one) locked
 * the choice away until the next cycle, and the next cycle meant grinding
 * a level-1 character back to 95 to fight Aurelion again. A player
 * reported exactly that: five Ascensions deep and never once offered it.
 *
 * aurelionKills is a lifetime stat that survives Ascension, so once you
 * have beaten him the door stays open.
 */
export function canBreakCycle() {
  return (state.era || 1) < 2
      && state.ending !== 'broken'
      && (state.ascensions || 0) >= 4
      && (state.stats?.aurelionKills || 0) >= 1;
}

/** The choice, on demand, from the Ascension panel. */
export function offerEndingNow() {
  if (!canBreakCycle()) return false;
  showEndingChoice();
  emit('state-changed');
  return true;
}

function maybeOfferEnding() {
  // Feeding the flame is the comfortable choice, not a locked door: the
  // offer comes back every cycle so nobody is shut out of four fifths of
  // the game by one button, and choosing comfort repeatedly becomes its
  // own quiet characterisation.
  if (state.ending === 'broken') return;
  if (state.ascensions < 4) return;
  // This guard now only stops the popup firing twice for two kills in the
  // same cycle. It no longer gates the choice itself — the Ascension panel
  // offers it whenever canBreakCycle() is true.
  if (state.endingOfferedCycle === state.ascensions) return;
  state.endingOfferedCycle = state.ascensions;
  showEndingChoice();
}

function showEndingChoice() {
  hooks.queueModal(`
    <div class="modal-tag">◈ THE CHOICE ◈</div>
    <div class="modal-title">${ENDING.offer.title}</div>
    <div class="modal-body" style="line-height:1.7">${ENDING.offer.text}</div>
    <div class="modal-note">
      The prose above is the whole truth, but here is the mechanical version, because
      this decision is easy to make by accident:
      <b>Feeding the flame</b> pays 5 Fate Shards and changes nothing else — your skills keep
      their ceiling at ${SOFT_CAP}, and everything past it stays shut. <b>Breaking the cycle</b>
      is how the game continues. The offer returns next cycle either way.
    </div>
    <div class="modal-actions">
      <button class="btn btn-gold" data-act="ending-feed">🔥 Feed the Flame (+5 💠)</button>
      <button class="btn btn-primary" data-act="ending-break">⛓️ Break the Cycle</button>
    </div>
  `);
}

export function chooseEnding(choice) {
  if (choice === 'feed') {
    state.shards += 5;
    state.stats.flamesFed = (state.stats.flamesFed || 0) + 1;
    state.ending = state.ending || 'fed';
    hooks.queueModal(`
      <div class="modal-tag">◈ ◈ ◈</div>
      <div class="modal-title">${ENDING.fed.title}</div>
      <div class="modal-body" style="line-height:1.7">${ENDING.fed.text}</div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Begin again</button></div>
    `);
    emit('notify', { type: 'sys', text: '[ SYSTEM ] The seal is renewed. +5 Fate Shards. He\'ll see you at the top.' });
  } else if (choice === 'break') {
    breakTheCycle();
  }
  emit('state-changed');
}

/**
 * The break, staged.
 *
 * Four modals queued in order, each with its own button label, because the
 * reversal only works if the player commits to the happy ending first.
 * They press "Begin - truly begin" on a screen that means it, and the next
 * screen is that same sentence stuttering.
 *
 * The era flag is set on the LAST beat, not the first: until the player has
 * read all four, the world should still look like the world they knew.
 */
function breakTheCycle() {
  state.ending = 'broken';

  hooks.queueModal(`
    <div class="modal-tag">◈ TRUE ENDING ◈</div>
    <div class="modal-title">${ENDING.broken.title}</div>
    <div class="modal-body" style="line-height:1.7">${ENDING.broken.text}</div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Begin — truly begin</button></div>
  `);
  hooks.queueModal(`
    <div class="modal-tag glitch-tag">◈ TRUE ENDING ◈</div>
    <div class="modal-title">${ENDING.brokenSecond.title}</div>
    <div class="modal-body" style="line-height:1.7">${ENDING.brokenSecond.text}</div>
    <div class="modal-actions"><button class="btn" data-act="close-modal">…begin?</button></div>
  `);
  hooks.queueModal(`
    <div class="modal-tag glitch-tag">◈ SYSTEM NOTICE ◈</div>
    <div class="modal-title glitch-title">${ENDING.brokenThird.title}</div>
    <div class="modal-body" style="line-height:1.7">${ENDING.brokenThird.text}</div>
    <div class="modal-actions"><button class="btn btn-danger" data-act="close-modal">Fall</button></div>
  `);
  hooks.queueModal(`
    <div class="modal-tag glitch-tag">◈ ERA II ◈</div>
    <div class="modal-title">${ENDING.brokenAftermath.title}</div>
    <div class="modal-body" style="line-height:1.7">${ENDING.brokenAftermath.text}</div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="enter-wastes">Pick up a stone</button></div>
  `);

  emit('notify', { type: 'sys', text: '[ SYSTEM ] Seal released. Purpose complete. Query: may I stay?' });
}

/**
 * Called when the player dismisses the final beat. Everything that changes
 * the world happens here rather than in chooseEnding, so the transition is
 * tied to having actually read it.
 */
export function enterTheWastes() {
  if (state.era >= 2) return false;
  state.era = 2;
  state.eraEnteredAt = Date.now();
  emit('notify', { type: 'combat', text: '[ SYSTEM ] Containment unit HEARTHWICK_SANDBOX_04: integrity loss. Location unindexed.' });
  emit('notify', { type: 'sys', text: 'Hearthwick came with you. Nothing resets any more.' });
  // The Ledger opens itself off this event rather than being called
  // directly: quests and ledger would otherwise import each other.
  emit('era-changed', { era: 2 });

  // The townsfolk get the next word, one at a time. They are the reason
  // the reveal has any weight: the player has spent sixty hours with
  // these seven and just watched their sky fail.
  for (const r of WASTES_ARRIVAL) {
    hooks.queueModal(`
      <div class="modal-tag glitch-tag">◈ HEARTHWICK ◈</div>
      <div class="modal-title">${r.icon} ${r.who}</div>
      <div class="modal-body" style="line-height:1.75">${r.line}</div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Next</button></div>
    `);
  }
  hooks.queueModal(`
    <div class="modal-tag glitch-tag">◈ ERA II ◈</div>
    <div class="modal-title">Nothing Resets</div>
    <div class="modal-body" style="line-height:1.75">
      <p>Marrow has laid four stones. Pell has already gone to look at the edge and come
      back with something she will not show anyone. Vera is testing the ground.</p>
      <p>Nobody has said the obvious thing out loud yet, which is that if the world is not
      going to wind back, then everything from here is <b>the first time it has happened</b>.</p>
      <p class="muted">Hearthwick now survives Ascension. So do its buildings, its staff and
      its stock. The loop does not get it back.</p>
      <p style="color:var(--sys-blue)">[ SYSTEM ] Recommendation: mining.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Get to work</button></div>
  `);
  emit('state-changed');
  return true;
}

// ---------------- Whispers ----------------
function startWhispers() {
  setInterval(() => {
    // Before the break these are whispers from outside the crop. After it,
    // there is no outside any more, so the same channel carries the
    // building's own maintenance traffic instead.
    const pool = state.era >= 2 ? WASTE_TRAFFIC : WHISPERS;
    if (Math.random() < (state.era >= 2 ? 0.5 : 0.4)) {
      const line = pool[Math.floor(Math.random() * pool.length)];
      emit('notify', { type: state.era >= 2 ? 'combat' : 'loot', text: line });
    }
  }, 6 * 60 * 1000);
}

// ---------------- Init ----------------
export function initQuests() {
  // Systems that finish a `flag` goal announce it; quests listens. Keeps
  // the dependency one-way.
  on('ledger-settled', () => setQuestFlag('ledger_settled'));
  on('repo-recovered', () => setQuestFlag('repo_recovered'));

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
