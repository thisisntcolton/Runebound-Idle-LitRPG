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
  { key: 'masteries', icon: '🏅', label: 'Every Mastery you have earned',
    detail: 'Cap a class\'s tree and you keep one distilled bonus from it, forever — and you earn it AGAIN every time you cap that class again. This is the only progression in the game that compounds, and it is what the long run is made of.' },
  { key: 'home', icon: '🏠', label: 'Your house and everything in it',
    detail: 'The one building the loop has never been able to touch. Every room, every piece of furniture, every set bonus. Nothing in the fiction explains why.' },
  { key: 'legacy', icon: '🏚️', label: 'The people you used to be',
    detail: 'You do not vanish when you Ascend — you take a room in Hearthwick. Your predecessors keep their faces, their names and their titles, and they work for the person who comes next.' },
  { key: 'lives', icon: '🫂', label: 'What the neighbours make of you',
    detail: 'Every bond you have built, every request you have run, every gift. The world winds back; Marrow does not. This is the promise the game has been making since the first cycle note.' },
  { key: 'pets', icon: '🐾', label: 'The whole Menagerie',
    detail: 'Pets, eggs, bond levels, breeding history. They were never the System\'s to take.' },
  { key: 'look', icon: '🪞', label: 'Your face',
    detail: 'You walk back in as yourself.' },
  { key: 'achievements', icon: '🏅', label: 'Achievements and titles' },
  { key: 'codex', icon: '📖', label: 'The Codex',
    detail: 'Everything you have worked out about this place, and the deeper passes you have earned.' },
  { key: 'adventure', icon: '🧭', label: 'What the road remembers about you',
    detail: 'The flags, only. People still know your face and the chains that turn on having helped someone still fire — but the miles, the chains walked and the stories read all start again.' },
  { key: 'worldBoss', icon: '🗼', label: 'Damage done to the Vigil',
    detail: 'Its health pool is measured in sessions. A reset that took it back would make it unfightable.' },
  { key: 'era', icon: '🌍', label: 'The Era you are in',
    detail: 'You cannot fall back into the box.' },
  { key: 'ledger', icon: '📒', label: 'The Ledger' },
  { key: 'repo', icon: '📄', label: 'Anything the Syndicate is holding' },
  { key: 'salvage', icon: '🕳️', label: 'Your dig record' },
  { key: 'casino', icon: '🎲', label: 'Everything the Gilded Snake has taken',
    detail: 'The house keeps its books across cycles. It would, wouldn\'t it.' },
  { key: 'quests', icon: '📜', label: 'Quests and Deeds you have completed',
    detail: 'A Deed done stays done. They were re-completing every cycle and paying out again each time, which handed a returning player over a million gold and eighteen Fate Shards for work they had already been paid for.' },
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
  { icon: '🌳', label: 'Every talent point and rank',
    detail: 'The trees reset too. What you keep is the MASTERY for any class you capped — and capping it again next cycle earns another one, which stacks. Re-walking a path is not repeated work; it is how the permanent bonuses grow.' },
  { icon: '🎭', label: 'Your class',
    detail: 'You pick a path again at character level 10, and it can be a different one.' },
  { icon: '⬇️', label: 'Your progress in the Descent',
    detail: 'Depth, clears and the standing bonus all start again. Ascension still raises its ceiling.' },
  { icon: '🧭', label: 'The miles you have walked',
    detail: 'Chains reopen and the road is new again. Only what you did for people is remembered.' },
  { icon: '🪙', label: 'Gold, items and gear' },
  { icon: '⚒️', label: 'Upgrades and hirelings' },
  { icon: '✨', label: 'Learned abilities and equipped tomes' },
  { icon: '💪', label: 'Allocated stat points',
    detail: 'You get them all back to spend again as your character level climbs.' },
  { icon: '🏘️', label: 'Hearthwick — but only inside the box',
    detail: 'In Era I the town is razed every cycle. Once you are out, it stays, and only its stock runs down.',
    conditional: true },
];
