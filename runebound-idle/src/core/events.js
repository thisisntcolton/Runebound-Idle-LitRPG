// Tiny pub/sub event bus. Systems emit, UI listens.
const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event).delete(fn);
}

export function emit(event, payload) {
  const set = listeners.get(event);
  if (set) for (const fn of set) fn(payload);
}

// Event names used across the game:
//   'xp'          { skillId, amount, levelBefore, levelAfter }
//   'level-up'    { skillId, level }
//   'char-level'  { level }
//   'gold'        { amount, total }
//   'loot'        { itemId, qty, rarity }
//   'action-done' { skillId, actionId }
//   'combat-hit'  { source: 'player'|'enemy', damage, missed }
//   'kill'        { monsterId, zoneId }
//   'death'       {}
//   'ascended'    { shards }
//   'state-changed' {}  (generic: re-render current panel)
//   'notify'      { type, text }  (system log line)
