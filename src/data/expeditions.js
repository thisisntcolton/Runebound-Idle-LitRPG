// ============================================================
// EXPEDITIONS
//
// The answer to "what do I decide before I close the tab".
//
// Everything else in Runebound is a thing you start and then watch. An
// expedition is a thing you PLAN: who goes, how far, what they carry, and
// how much you are willing to risk. Then you leave, and hours later it
// comes back with a story rather than a number.
//
// The party is drawn from your household — yourself, a pet, a hireling,
// and your former selves, who are living in Hearthwick because they never
// stopped existing. That is the join between the three systems: Legacy
// gives you people, the house gives them somewhere to be, and the gate is
// what they walk out of.
//
// DESIGN RULES:
//
//  1. IT CANNOT BE STRICTLY BETTER THAN PLAYING. An expedition pays
//     roughly what the same hours of active play would, minus a margin
//     for not being there. Otherwise the optimal strategy is to close the
//     game, which is a strange thing to build toward.
//
//  2. RISK IS REAL AND CHOSEN. Cautious returns less and always returns.
//     Reckless can come back with something remarkable, or come back
//     short-handed — a party member hurt and unavailable for a while.
//     Nobody dies. This is an idle game and permadeath on a tab you
//     forgot about is a betrayal.
//
//  3. THE LOG IS THE REWARD. The gold matters, but what a player
//     remembers is that Pell got lost and your third self found her.
// ============================================================

export const EXPEDITION = {
  /** Party size, before house and legacy bonuses. */
  BASE_SLOTS: 2,
  MAX_SLOTS: 5,
  /** Nothing runs forever, and nothing runs so long you forget it. */
  MIN_HOURS: 1,
  MAX_HOURS: 8,
  /** A hurt companion sits out this long. They are fine. They are sulking. */
  RECOVER_MS: 45 * 60 * 1000,
};

/**
 * Where a party can be sent.
 *
 * `pay` is in combat-minutes, the same currency the road, pet errands and
 * the casino's table limit all use — so an expedition is priced against
 * what you would have earned playing, and cannot drift away from it.
 */
export const DESTINATIONS = [
  {
    id: 'meadow_sweep', name: 'The Meadow and the Low Road', icon: '🌾',
    level: 1, hours: 1, pay: 55, danger: 0.05,
    blurb: 'A day out and back. Nothing has ever happened on the low road, which is why it is the one you send people on first.',
    loot: ['oak_log', 'herb_sagewort', 'raw_shrimp', 'copper_ore'],
  },
  {
    id: 'forest_survey', name: 'Under Gloomroot', icon: '🌲',
    level: 12, hours: 2, pay: 130, danger: 0.10,
    blurb: 'The canopy eats the light about a mile in. Everyone comes back saying the same thing: it was fine, and they would rather not go again.',
    loot: ['willow_log', 'herb_mooncap', 'iron_ore', 'wolf_fang_charm'],
  },
  {
    id: 'cave_delve', name: 'The Hollowdeep Delve', icon: '🕳️',
    level: 26, hours: 3, pay: 240, danger: 0.16,
    blurb: 'Down, and then along, and then down again. The maps disagree past the second chamber and always have.',
    loot: ['coal', 'iron_bar', 'greater_rune', 'bone_ring'],
  },
  {
    id: 'peak_ascent', name: 'The Cindershard Climb', icon: '🌋',
    level: 45, hours: 4, pay: 420, danger: 0.22,
    blurb: 'The mountain grumbles. Holt says that is settling. Holt has never climbed it.',
    loot: ['mythril_ore', 'herb_emberpetal', 'ember_amulet', 'steel_bar'],
  },
  {
    id: 'spire_watch', name: 'The Dragonspire Watch', icon: '🏔️',
    level: 70, hours: 6, pay: 760, danger: 0.28,
    blurb: 'Not to fight anything. To sit above the Spire for a night and write down what moves. Somebody should have been doing this all along.',
    loot: ['runite_ore', 'void_rune', 'blank_tome', 'herb_kingsleaf'],
  },
  {
    id: 'wastes_survey', name: 'Beyond the Ridge', icon: '🏚️',
    level: 80, hours: 6, pay: 1100, danger: 0.30, era: 2,
    blurb: 'Ferrin drew the route. He will not walk it himself, and he is honest about why.',
    loot: ['glitched_ore', 'deprecated_asset', 'corrupt_sigil'],
  },
  {
    id: 'deep_probe', name: 'A Probe Into The Descent', icon: '⬇️',
    level: 95, hours: 8, pay: 1800, danger: 0.38, era: 2,
    blurb: 'Not a clear. A measurement. You want to know what is down there without being the one standing in front of it.',
    loot: ['void_rune', 'deprecated_asset', 'blank_tome', 'sealed_tome'],
  },
];

export const getDestination = id => DESTINATIONS.find(d => d.id === id);

/** How careful the party is told to be. */
export const RISKS = [
  { id: 'cautious', name: 'Cautious', icon: '🛡️',
    pay: 0.70, danger: 0.35, find: 0.6,
    desc: 'Turn back at the first sign. Less to show for it, and everyone comes home.' },
  { id: 'steady', name: 'Steady', icon: '🚶',
    pay: 1.00, danger: 1.00, find: 1.0,
    desc: 'The plan as written. What most parties do, most of the time.' },
  { id: 'reckless', name: 'Reckless', icon: '🔥',
    pay: 1.55, danger: 2.10, find: 1.8,
    desc: 'Push past the turn-back point. The best hauls and the worst evenings both come from here.' },
];

export const getRisk = id => RISKS.find(r => r.id === id) || RISKS[1];

/** Provisions you send them with. Optional, consumed, and worth it. */
export const PROVISIONS = [
  { id: 'none', name: 'Travel light', icon: '—', item: null, danger: 1.0, pay: 1.0,
    desc: 'Nothing packed. They will manage or they will not.' },
  { id: 'rations', name: 'Rations', icon: '🍞', item: 'bread', qty: 4, danger: 0.85, pay: 1.05,
    desc: 'Bread and a bit of sense. Fewer things go wrong when people have eaten.' },
  { id: 'good_food', name: 'A proper kit', icon: '🍲', item: 'root_stew', qty: 3, danger: 0.7, pay: 1.15,
    desc: 'Hot food, spare rope, a lamp. Noticeably fewer disasters.' },
  { id: 'feast', name: 'The good stuff', icon: '🥧', item: 'hearth_pie', qty: 2, danger: 0.55, pay: 1.30,
    desc: 'They will talk about this trip for weeks, mostly about the pie.' },
];

export const getProvision = id => PROVISIONS.find(p => p.id === id) || PROVISIONS[0];

// ============================================================
// WHAT HAPPENS OUT THERE
//
// Beats are drawn at random and stitched into a log. Each carries a tone
// so the write-up reads as a journey rather than a list, and several name
// a party member — which is the entire reason anybody will read them.
// ============================================================

export const BEATS = {
  good: [
    '{who} found the old marker stones and saved half a day.',
    '{who} talked their way past something that did not have to let them past.',
    'The weather turned kind for once. {who} took it personally.',
    '{who} spotted the cache before anyone else was even looking.',
    'A clean camp, a full night, and {who} keeping watch without being asked.',
    '{who} took a shortcut nobody else would have risked. It worked.',
    'They met somebody on the road who knew {who} by name.',
  ],
  neutral: [
    'Long stretches of nothing. {who} filled them with an anecdote nobody could verify.',
    'They walked. It rained. {who} has opinions about the rain.',
    '{who} insisted on the northern route. It was neither better nor worse.',
    'A cold camp and an early start. Standard.',
    '{who} counted the miles out loud. Everyone stopped listening at four hundred.',
  ],
  bad: [
    '{who} went through ice up to the knee. Recoverable, and mentioned repeatedly.',
    'Something followed them for two hours. {who} says it was nothing.',
    'The pass was shut. {who} found the long way round, eventually.',
    '{who} lost the good lamp. Nobody has said anything about it yet.',
    'They ran short a day early. {who} gave up their share and pretended not to.',
  ],
  disaster: [
    '{who} came back hurt. Not badly. Badly enough.',
    'It went wrong on the third day and {who} is the reason anyone came home at all.',
    '{who} will not say what happened at the ridge and the others are letting it go.',
  ],
  triumph: [
    '{who} came back with something nobody has seen before, and will not stop grinning.',
    'Whatever {who} did out there, the others have started deferring to them.',
    '{who} went further than the plan and came back with the reason why.',
  ],
};
