// ============================================================
// HEARTHWICK RESIDENTS & VISITORS
//
// Residents move in as the town grows. Notables arrive at level
// milestones, each bringing a small permanent perk and a line that
// suggests they have been here before — because they have.
// ============================================================

// ---------------- Ambient population ----------------
// Anonymous townsfolk who wander the paths. Purely atmosphere, but
// they're what makes a raid feel like it cost something.

export const WANDERER_LOOKS = [
  { body: '#5c7fb5', hat: null,      skin: '#e8c39b' },
  { body: '#8a5a3c', hat: '#6b4a2a', skin: '#d8ab7e' },
  { body: '#4b7a52', hat: null,      skin: '#f0d4b0' },
  { body: '#a4453c', hat: '#7a3129', skin: '#c9976b' },
  { body: '#6a4b7d', hat: null,      skin: '#e8c39b' },
  { body: '#3f6b8a', hat: '#2f5169', skin: '#d8ab7e' },
  { body: '#b98b3c', hat: null,      skin: '#f0d4b0' },
  { body: '#4a5a6b', hat: '#333d49', skin: '#c9976b' },
];

// ---------------- Ordinary people ----------------
//
// Hearthwick used to be populated by fourteen copies of eight coloured
// rectangles, walking the same six lines in lockstep. The town read as a
// screensaver, which undercut everything else about it: a settlement you
// have spent forty hours building should not look like a placeholder, and
// a raid that "takes" people should take somebody.
//
// So the residents are now generated from the same appearance system the
// player's own character uses, and they are STABLE — seeded off the town's
// name and the resident's index, so the woman in the green coat by the
// smithy is the same woman tomorrow. She has a name. If you hover her, the
// game will tell you what she does.
//
// None of this is mechanical. It is entirely the difference between a town
// and a diagram of one.

export const VILLAGER_NAMES = [
  'Bram', 'Nessa', 'Corin', 'Vetch', 'Ilse', 'Padrig', 'Yarrow', 'Meg',
  'Osric', 'Tamsin', 'Dob', 'Hesper', 'Aldous', 'Rilla', 'Gethin', 'Nan',
  'Sorrel', 'Waldo', 'Beatha', 'Cuth', 'Linnet', 'Ambrose', 'Peg', 'Rook',
  'Elva', 'Tobin', 'Marisc', 'Hew', 'Dilly', 'Fenwick', 'Ottoline', 'Sim',
  'Brannoc', 'Wynn', 'Kester', 'Alys', 'Garrow', 'Petronel', 'Odo', 'Silke',
];

export const VILLAGER_TRADES = [
  'cooper', 'thatcher', 'carter', 'baker', 'goatherd', 'fletcher',
  'washerwoman', 'ostler', 'tanner', 'chandler', 'midwife', 'ratcatcher',
  'stonemason', 'brewer', 'scribe', 'shepherd', 'weaver', 'wheelwright',
  'gravedigger', 'beekeeper',
];

/** What somebody is doing when you catch them standing still. */
export const VILLAGER_ERRANDS = [
  'on the way to the well',
  'carrying something heavy and regretting it',
  'looking for a goat',
  'avoiding somebody',
  'delivering a message they have forgotten',
  'counting the parcels again',
  'waiting for the forge to be free',
  'walking a long way round to think',
  'taking the short way, which is longer',
  'off to complain about the noise',
  'coming back to complain again',
  'not doing anything in particular',
];

/** Population grows with what you've built — more buildings, more life. */
export function populationFor(townLevel, buildingCount) {
  if (buildingCount === 0) return 0;
  return Math.min(40, 3 + buildingCount * 2 + townLevel * 2);
}

// ---------------- Notables ----------------
// Arrive at town-level milestones. Each gives a small always-on perk.

export const NOTABLES = [
  {
    id: 'marrow', name: 'Old Marrow', icon: '👴', role: 'Town Elder',
    atLevel: 1,
    perk: { key: 'sell_price', value: 0.04 },
    perkLabel: '+4% sell price',
    greeting: 'Marrow claims he laid the first stone here. There is no first stone; the ground was empty a week ago. He is very certain.',
    idle: [
      '"Nice weather. Same as last time."',
      '"You always start with the lumber. Every time."',
      '"Mind the crossroads after dark."',
    ],
  },
  {
    id: 'pell', name: 'Pell the Younger', icon: '🧒', role: 'Errand Runner',
    atLevel: 3,
    perk: { key: 'xp', value: 0.02 },
    perkLabel: '+2% all XP',
    greeting: 'A child with quick feet and a memory for names. She knew yours before you gave it.',
    idle: [
      '"You had a different sword last time. I liked the old one."',
      '"I can run to the Peaks and back before supper. Want to bet?"',
      '"Mister Marrow talks in his sleep. He says numbers."',
    ],
  },
  {
    id: 'holt', name: 'Sergeant Holt', icon: '💂', role: 'Watch Captain',
    atLevel: 6,
    perk: { key: 'damage', value: 0.03 },
    perkLabel: '+3% damage',
    greeting: 'Retired from a war nobody in Hearthwick can name. He drills the watch anyway, every morning, without being asked.',
    idle: [
      '"Something came through the seam last spring. Or it will. Hard to say."',
      '"Post two on the east road. Always two."',
      '"You fight like someone who has died before. No offence."',
    ],
  },
  {
    id: 'wren', name: 'Wren Ashdown', icon: '👩‍⚕️', role: 'Physicker',
    atLevel: 9,
    perk: { key: 'offline_hours', value: 1 },
    perkLabel: '+1 offline hour',
    greeting: 'She set up a surgery before anyone got hurt, which at the time seemed like pessimism.',
    idle: [
      '"Come back before you are bleeding, not after."',
      '"I have stitched that exact scar before. Same place. Same thread."',
      '"Sleep. The world keeps going. It always does."',
    ],
  },
  {
    id: 'ferrin', name: 'Ferrin Vale', icon: '🧙‍♂️', role: 'Hedge-Scholar',
    atLevel: 13,
    perk: { key: 'drop_rate', value: 0.05 },
    perkLabel: '+5% rare drop rate',
    greeting: 'He arrived asking to see the town records. Hearthwick has no records. He said "not yet" and started writing.',
    idle: [
      '"The System indexes this town as a rounding error. I find that promising."',
      '"Every settlement I have studied ends. This one keeps not ending."',
      '"You are the only variable that carries over. Do you know that?"',
    ],
  },
  {
    id: 'vera', name: 'Forge-Sister Vera', icon: '👩‍🏭', role: 'Smith',
    atLevel: 11,
    perk: { key: 'sell_price', value: 0.05 },
    perkLabel: '+5% sell price',
    greeting: 'She was named in the Smithy\'s paperwork before she arrived, which nobody has been brave enough to raise with her.',
    idle: [
      '"Bring me metal or bring me nothing."',
      '"The hammer knows. Ask it sometime."',
      '"I dreamt this blade before you brought it. That happens to me."',
    ],
  },
  {
    id: 'bram', name: 'Bram Otley', icon: '🧔', role: 'Innkeeper',
    atLevel: 15,
    perk: { key: 'offline_hours', value: 1 },
    perkLabel: '+1 offline hour',
    greeting: 'Behind the bar, mid-pour, as though he had been told exactly when you would walk in.',
    idle: [
      '"Room\'s upstairs. Don\'t ask about the noise."',
      '"I never ask where anyone\'s been. It\'s a policy."',
      '"Nobody\'s ever checked out. Not once."',
    ],
  },
  {
    id: 'quill', name: 'Sable Quill', icon: '🧝‍♀️', role: 'Cartographer',
    atLevel: 18,
    perk: { key: 'gold', value: 0.05 },
    perkLabel: '+5% gold',
    greeting: 'She maps the roads out of Hearthwick. They all curve back. She keeps mapping.',
    idle: [
      '"The horizon has a seam. I have drawn it eleven times."',
      '"Every road east ends in the same field. Cartographically, that is rude."',
      '"If you ever get out, send word. I will draw it."',
    ],
  },
];

export function notablesAt(townLevel) {
  return NOTABLES.filter(n => townLevel >= n.atLevel);
}

// ---------------- Visitors ----------------
// Periodic events with a choice. Cheap to resolve, adds texture.

export const VISITORS = [
  {
    id: 'courier',
    name: 'A Courier', icon: '📯',
    text: 'A courier arrives with a crate addressed to "the owner." There is no sender. Inside: materials you were about to need.',
    accept: { label: 'Take the crate', gift: 'materials' },
    decline: { label: 'Refuse it', text: 'The crate is gone by morning. So is the road it came in on.' },
  },
  {
    id: 'merchant',
    name: 'A Travelling Merchant', icon: '🐴',
    text: 'A cart pulls up loaded with things nobody in Hearthwick makes. He will trade — steeply — for gold.',
    accept: { label: 'Buy his stock', cost: 'gold', gift: 'potions' },
    decline: { label: 'Wave him on', text: 'He shrugs and rolls east. You will see him again.' },
  },
  {
    id: 'refugees',
    name: 'Travellers Seeking Shelter', icon: '👨‍👩‍👧',
    text: 'A family asks to stay. They have walked a long way from somewhere they cannot describe.',
    accept: { label: 'Take them in', gift: 'population' },
    decline: { label: 'Turn them away', text: 'They go. Hearthwick feels smaller for a while.' },
  },
  {
    id: 'assessor',
    name: 'A System Assessor', icon: '📋',
    text: '[ SYSTEM ] Unscheduled settlement detected. An assessor has been dispatched to evaluate your... hobby.',
    accept: { label: 'Cooperate', cost: 'tax', gift: 'blessing' },
    decline: { label: 'Say nothing', text: 'The assessor writes something down, underlines it twice, and leaves.' },
  },
  {
    id: 'bard',
    name: 'A Bard With One Song', icon: '🪕',
    text: 'She only knows one song. It is about a town that keeps being rebuilt by someone who never ages. She says she wrote it. She did not.',
    accept: { label: 'Let her play', gift: 'morale' },
    decline: { label: 'Not tonight', text: 'She plays it in the road anyway, to nobody.' },
  },
];

export const VISITOR_MIN_MS = 12 * 60 * 1000;
export const VISITOR_MAX_MS = 25 * 60 * 1000;
