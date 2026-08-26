// ============================================================
// THE DESCENT — state, the ladder, and the one number that never resets
// ============================================================
import { state } from '../core/state.js';
import { DEEP, depthCap, isWardenDepth, deepMonster, stratumFor } from '../data/deep.js';
import { emit } from '../core/events.js';
import { rollEggDrop } from './pets.js';
import { rollTome } from './abilities.js';
import { fmtInt } from '../core/format.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setDeepUIHooks(h) { hooks = h; }

export function deep() {
  if (!state.deep) {
    state.deep = {
      best: 0,        // deepest floor ever OPENED — permanent, never reset
      depth: 1,       // the floor you are currently working
      clears: 0,      // progress on the current floor
      kills: 0,       // lifetime, for the Codex
      wardens: 0,
    };
  }
  return state.deep;
}

export function unlocked() { return (state.era || 1) >= 2; }

/** How deep this save is currently permitted to go. */
export function cap() { return depthCap(state.ascensions || 0); }

/** The deepest floor you may select right now. */
export function maxSelectable() {
  const d = deep();
  return Math.max(1, Math.min(cap(), (d.best || 0) + 1));
}

export function clearsNeeded(depth = deep().depth) {
  return isWardenDepth(depth) ? 1 : DEEP.CLEARS_PER_DEPTH;
}

export function atCap() { return maxSelectable() >= cap() && (deep().best || 0) >= cap(); }

// ---------------- Selecting a floor ----------------

export function setDepth(depth) {
  const d = deep();
  const want = Math.max(1, Math.min(maxSelectable(), Math.floor(depth)));
  if (want === d.depth) return false;
  d.depth = want;
  // Progress is per-floor and does not travel with you.
  d.clears = 0;
  emit('notify', { type: 'combat', text: `⬇️ Descent set to floor ${want} — ${stratumFor(want).name}.` });
  emit('state-changed');
  return true;
}

export function descendOne() { return setDepth(deep().depth + 1); }

// ---------------- Credit ----------------

/**
 * Called from combat on every Descent kill. Opens the next floor when the
 * current one is cleared, and banks a new permanent best.
 */
export function creditDescent(monster) {
  const d = deep();
  d.kills = (d.kills || 0) + 1;
  if (monster?.boss) { d.wardens = (d.wardens || 0) + 1; rollEggDrop('descent'); rollTome('descent'); }

  const need = clearsNeeded(d.depth);
  d.clears = (d.clears || 0) + 1;
  if (d.clears < need) {
    emit('deep-progress', { depth: d.depth, clears: d.clears, need });
    emit('state-changed');
    return false;
  }

  // Floor held. Note that `best` only ever moves up, and only here.
  d.clears = need;
  const opened = d.depth;
  const wasBest = d.best || 0;
  if (opened > wasBest) {
    d.best = opened;
    emit('deep-record', { depth: opened });
    announceFloor(opened);
  } else {
    emit('notify', { type: 'combat', text: `Floor ${opened} held again. It stays held.` });
  }
  emit('deep-cleared', { depth: opened });
  emit('state-changed');
  return true;
}

function announceFloor(depth) {
  const s = stratumFor(depth);
  const b = DEEP.BONUS_PER_DEPTH;
  const capped = depth >= cap();

  if (isWardenDepth(depth) || depth === 1 || capped) {
    hooks.queueModal(`
      <div class="modal-tag glitch-tag">◈ FLOOR ${depth} ◈</div>
      <div class="modal-title">⬇️ ${s.name}</div>
      <div class="modal-body" style="line-height:1.75">
        <p class="muted">${s.desc}</p>
        ${isWardenDepth(depth)
          ? '<p>Whatever was holding this floor is not holding it any more. The way down is a hole where the way down always was, and it was always going to be there, and it is worse than that.</p>'
          : '<p>You put your back against the wall of a place that used to be somewhere and you get your breath. Something below you notices that you have stopped.</p>'}
        <p style="color:var(--gold)">Deepest reach: <b>${depth}</b> —
          +${(depth * b.damage * 100).toFixed(0)}% damage, +${(depth * b.gold * 100).toFixed(0)}% gold,
          +${(depth * b.drop_rate * 100).toFixed(1)}% rare drops, permanently.</p>
        ${capped
          ? `<p style="color:var(--sys-blue)">[ SYSTEM ] Descent authorisation exhausted at floor ${cap()}.
             Further clearance is issued per completed cycle. You know what that means and you have
             been avoiding it.</p>`
          : ''}
      </div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Keep going down</button></div>
    `);
  } else {
    hooks.popup('FLOOR HELD',
      `⬇️ <b>Floor ${depth}</b> — ${s.name}<br><span style="font-size:12px;color:var(--text-dim)">Deepest reach ${depth}. The way down is open.</span>`,
      { gold: true, ttl: 6 });
  }
  emit('notify', { type: 'loot', text: `⬇️ Floor ${depth} held — ${s.name}. Deepest reach: ${fmtInt(depth)}.` });
}

// ---------------- The permanent bonus ----------------
//
// Read through the same lazy hook as the town, pets, class and Ledger.
// Survives Ascension because state.deep is on the prestige keep-list, and
// `best` is the only field any of this reads.

export function deepBonus(key) {
  if (!unlocked()) return 0;
  const per = DEEP.BONUS_PER_DEPTH[key];
  if (!per) return 0;
  return per * (deep().best || 0);
}

// ---------------- View ----------------

export function deepView() {
  const d = deep();
  const depth = d.depth || 1;
  const need = clearsNeeded(depth);
  const b = DEEP.BONUS_PER_DEPTH;
  return {
    unlocked: unlocked(),
    depth,
    best: d.best || 0,
    cap: cap(),
    maxSelectable: maxSelectable(),
    clears: Math.min(d.clears || 0, need),
    need,
    warden: isWardenDepth(depth),
    stratum: stratumFor(depth),
    monster: deepMonster(depth, 0),
    kills: d.kills || 0,
    wardens: d.wardens || 0,
    atCap: (d.best || 0) >= cap(),
    bonus: {
      damage: (d.best || 0) * b.damage,
      gold: (d.best || 0) * b.gold,
      drop_rate: (d.best || 0) * b.drop_rate,
    },
  };
}

export function initDeep() { deep(); }
