// ============================================================
// WHAT SURVIVES ASCENSION
//
// This list exists because the honest answer had become genuinely hard to
// give. Fourteen separate systems now write to the save and each of them
// made its own decision about the reset, individually, months apart. A
// player asking "do I lose my talents" was being answered by prose in
// three different panels, and the three did not agree.
//
// So: one list, rendered everywhere the question is asked, and a test
// (test/content.test.mjs) that cross-checks every entry against the
// actual keep-list in systems/prestige.js. If somebody adds a system and
// forgets to say what happens to it on Ascension, the test fails rather
// than the player finding out the hard way.
//
// `key` is the field on state, and it is the thing the test checks.
// ============================================================

export const KEPT = [
  { key: 'shards', icon: '💠', label: 'Fate Shards and Perks',
    detail: 'Both the shards this run earned you and everything you have ever spent them on.' },
  { key: 'classProgress', icon: '🌳', label: 'Every talent, in every tree',
    detail: 'All of it — the points you earned and every rank you bought, per class, forever. What you LOSE is the class itself: you choose a path again next cycle.' },
  { key: 'pets', icon: '🐾', label: 'The whole Menagerie',
    detail: 'Pets, eggs, bond levels, breeding history. They were never the System\'s to take.' },
  { key: 'look', icon: '🪞', label: 'Your face',
    detail: 'You walk back in as yourself.' },
  { key: 'achievements', icon: '🏅', label: 'Achievements and titles' },
  { key: 'codex', icon: '📖', label: 'The Codex',
    detail: 'Everything you have worked out about this place, and the deeper passes you have earned.' },
  { key: 'adventure', icon: '🧭', label: 'What the road remembers',
    detail: 'Every chain you have walked and every flag you set. People on the road still know you.' },
  { key: 'deep', icon: '⬇️', label: 'Your deepest reach in the Descent',
    detail: 'The standing bonus it pays is permanent — and Ascension is what raises its ceiling.' },
  { key: 'worldBoss', icon: '🗼', label: 'Damage done to the Vigil',
    detail: 'Its health pool is measured in sessions. A reset that took it back would make it unfightable.' },
  { key: 'era', icon: '🌍', label: 'The Era you are in',
    detail: 'You cannot fall back into the box.' },
  { key: 'ledger', icon: '📒', label: 'The Ledger' },
  { key: 'repo', icon: '📄', label: 'Anything the Syndicate is holding' },
  { key: 'salvage', icon: '🕳️', label: 'Your dig record' },
  { key: 'stats', icon: '📊', label: 'Lifetime statistics' },
  { key: 'loreSeen', icon: '📜', label: 'The story so far',
    detail: 'Fragments, cycle revelations and the ending you chose.' },
];

/**
 * Everything the reset takes. Not a state-key list — these are the things
 * a player actually thinks of as theirs, and several of them live inside
 * a single object that IS kept, which is exactly why prose alone kept
 * getting this wrong.
 */
export const LOST = [
  { icon: '📈', label: 'Every skill level',
    detail: 'Back to 1. The XP goes with them. This is the reset; everything else is what survives it.' },
  { icon: '🎭', label: 'Your class',
    detail: 'Not its talents — the class. You pick a path again at character level 10, and it can be a different one.' },
  { icon: '🪙', label: 'Gold, items and gear' },
  { icon: '⚒️', label: 'Upgrades and hirelings' },
  { icon: '✨', label: 'Learned abilities and equipped tomes' },
  { icon: '💪', label: 'Allocated stat points',
    detail: 'You get them all back to spend again as your character level climbs.' },
  { icon: '🏘️', label: 'Hearthwick — but only inside the box',
    detail: 'In Era I the town is razed every cycle. Once you are out, it stays, and only its stock runs down.',
    conditional: true },
];
