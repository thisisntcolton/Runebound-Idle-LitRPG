// ============================================================
// OFFLINE PROGRESS — simulate gains while the game was closed
// Active skill action + hirelings progress; combat pauses
// ("your hero makes camp").
// ============================================================
import { state, actionTime, hirelingRate, skillLevel, offlineCapHours } from '../core/state.js';
import { SKILLS, getAction, TRAINABLE_SKILLS } from '../data/skills.js';
import { getItem } from '../data/items.js';
import { hasInputs } from './inventory.js';
import { completeAction, hirelingTask } from './skills.js';
import { processTownOffline } from './town.js';
import { settleAll } from './pets.js';
import { getSpecies } from '../data/pets.js';

// Returns a summary { seconds, cappedSeconds, gains: [{icon,text}] } or null.
export function processOffline() {
  const now = Date.now();
  const elapsed = Math.floor((now - (state.lastSeen || now)) / 1000);
  state.lastSeen = now;
  if (elapsed < 60) return null;

  const capSeconds = offlineCapHours() * 3600;
  const seconds = Math.min(elapsed, capSeconds);
  const gains = [];
  const itemTotals = {};
  const xpTotals = {};

  const track = (skillId, action, times) => {
    if (times <= 0) return;
    xpTotals[skillId] = (xpTotals[skillId] || 0) + action.xp * times;
    for (const [itemId, qty] of Object.entries(action.output)) {
      itemTotals[itemId] = (itemTotals[itemId] || 0) + qty * times;
    }
  };

  // Active skill action
  const act = state.activity;
  if (act?.type === 'skill') {
    const action = getAction(act.skillId, act.actionId);
    if (action) {
      const time = actionTime(act.skillId, action) / 1000;
      let completions = Math.floor(seconds / time);
      let done = 0;
      while (completions-- > 0) {
        if (action.input && !hasInputs(action.input)) break;
        if (!completeAction(act.skillId, action, { announce: false })) break;
        done++;
      }
      track(act.skillId, action, done);
    }
  } else if (act?.type === 'combat') {
    gains.push({ icon: '⛺', text: 'Your hero made camp — combat pauses while you\'re away.' });
    state.activity = null;
  }

  // Hirelings
  for (const skillId of TRAINABLE_SKILLS) {
    const rate = hirelingRate(skillId);
    if (rate <= 0) continue;
    const actionId = hirelingTask(skillId);
    const action = getAction(skillId, actionId);
    if (!action || skillLevel(skillId) < action.level) continue;
    const time = actionTime(skillId, action) / 1000;
    let completions = Math.floor((seconds * rate) / time);
    let done = 0;
    while (completions-- > 0) {
      if (action.input && !hasInputs(action.input)) break;
      if (!completeAction(skillId, action, { announce: false })) break;
      done++;
    }
    track(skillId, action, done);
  }

  // Hearthwick keeps trading while you're away
  const townGains = processTownOffline(seconds);
  if (townGains) {
    gains.push({ icon: '🏘️', text: `Hearthwick worked ${townGains.cycles} shift${townGains.cycles > 1 ? 's' : ''} — net 🪙 ${Math.floor(townGains.gold).toLocaleString()}` });
    for (const [itemId, qty] of Object.entries(townGains.items)) {
      const item = getItem(itemId);
      gains.push({ icon: item?.icon || '📦', text: `${item?.name || itemId} ×${qty} (town)` });
    }
  }

  // Pets: care decays against the wall clock, so this is just a report.
  // Eggs, notably, are NOT capped by offline hours — they warm on real time.
  settleAll();
  const ready = (state.pets?.incubator || []).filter(e => now >= e.readyAt);
  if (ready.length) {
    gains.push({ icon: '🥚', text: `${ready.length} egg${ready.length > 1 ? 's are' : ' is'} ready to hatch — ${
      ready.map(e => getSpecies(e.species)?.eggName).join(', ')}` });
  }
  const neglected = Object.values(state.pets?.owned || {})
    .filter(p => Math.min(p.hunger ?? 100, p.happy ?? 100) < 30);
  if (neglected.length) {
    gains.push({ icon: '😖', text: `${neglected.map(p => p.name).join(', ')} ${
      neglected.length > 1 ? 'are' : 'is'} sulking and needs feeding.` });
  }

  for (const [skillId, xp] of Object.entries(xpTotals)) {
    gains.push({ icon: SKILLS[skillId].icon, text: `${SKILLS[skillId].name}: +${Math.floor(xp)} base XP` });
  }
  for (const [itemId, qty] of Object.entries(itemTotals)) {
    const item = getItem(itemId);
    gains.push({ icon: item?.icon || '📦', text: `${item?.name || itemId} ×${qty}` });
  }

  if (gains.length === 0) return null;
  return { seconds: elapsed, cappedSeconds: seconds, capped: elapsed > capSeconds, gains };
}
