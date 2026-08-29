// ============================================================
// THE PEOPLE WHO LIVE HERE
//
// Hearthwick's seven notables existed as a bonus list. Each one moved in
// at a town level, granted a permanent percentage, said three lines on
// rotation, and was otherwise furniture. That is a strange way to treat
// the only characters in a game whose entire emotional argument is "the
// world resets and these people do not".
//
// So they get lives:
//
//   WHERE THEY ARE depends on the hour. Marrow is at the Long Table by
//   evening and nowhere near it at dawn. If you want to talk to Vera you
//   learn her hours, the way you would with an actual neighbour.
//
//   HOW THEY FEEL about you is a number that moves. Doing what they ask,
//   giving them things they like, and simply turning up all raise it.
//   Ignoring a request for long enough lowers it.
//
//   WHAT THEY WANT is a request with a deadline, drawn from what they
//   care about, and it is the reason to open the game tomorrow.
//
//   WHAT THEY REMEMBER survives Ascension, because that is the promise.
//   Marrow has met eleven of you and it has started to show.
//
// The dialogue is written per-relationship-tier, so the same person is a
// different person at stranger and at confidant. That is the payoff: the
// town gets warmer the longer you stay, which is the opposite of what the
// loop does to everything else.
// ============================================================

/** How well somebody knows you. Thresholds are on `bond`, 0-100. */
export const TIERS = [
  { id: 'stranger',  at: 0,  label: 'Stranger',  icon: '·' },
  { id: 'known',     at: 20, label: 'Known',     icon: '◦' },
  { id: 'friend',    at: 45, label: 'Friend',    icon: '◈' },
  { id: 'confidant', at: 75, label: 'Confidant', icon: '✦' },
];

export function tierFor(bond = 0) {
  let t = TIERS[0];
  for (const x of TIERS) if (bond >= x.at) t = x;
  return t;
}

export const BOND = {
  MAX: 100,
  /** Bond decays if you never speak to them. Slowly — this is not a chore. */
  DECAY_PER_DAY: 1.5,
  /** Talking, once per hour-band, is worth this. */
  VISIT: 2,
  /** Completing a request. */
  REQUEST: 12,
  /** Letting one expire. */
  IGNORED: -6,
  /** A gift they like. */
  GIFT_LIKED: 8,
  GIFT_FINE: 3,
};

// ============================================================
// SCHEDULES
//
// Keyed by the hour bands in data/places.js. A person at 'home' is not
// findable — that is deliberate, and it is what makes the schedule mean
// something rather than being decoration on an always-open shop.
// ============================================================

export const LIVES = {
  marrow: {
    trade: 'Town Elder',
    at: { dawn: 'square', morning: 'square', afternoon: 'table',
          evening: 'table', night: 'home', smallhours: 'home' },
    likes: ['root_stew', 'bread', 'town_coffee', 'hearth_pie'],
    dialogue: {
      stranger: ['"You\'re the new one. There\'s always a new one."',
                 '"Don\'t build on the west parcel first. Everyone does. Everyone regrets it."'],
      known:    ['"Back again. You always come back, that\'s the thing about you."',
                 '"I laid the first stone. There wasn\'t one. I laid it anyway."'],
      friend:   ['"I keep a list of the ones who ask my name. It\'s a short list."',
                 '"You had a different face two winters ago. I\'m not saying anything by that."'],
      confidant:['"I\'ve buried people who were here before the town was. Explain that to me."',
                 '"When it winds back — and it does — I get about a week where I nearly remember. This is that week."'],
    },
    requests: [
      { id: 'm_logs', ask: 'Twenty oak logs for the Square\'s benches.',
        need: { item: 'oak_log', count: 20 }, reward: { gold: 3000 } },
      { id: 'm_stew', ask: 'Three bowls of root stew. For the ones who don\'t cook.',
        need: { item: 'root_stew', count: 3 }, reward: { gold: 8000 } },
      { id: 'm_quiet', ask: 'Clear out fifteen things in the meadow. It\'s been noisy.',
        need: { kill: 25 }, reward: { gold: 12000 } },
    ],
  },
  pell: {
    trade: 'Errand Runner',
    at: { dawn: 'gate', morning: 'road', afternoon: 'square',
          evening: 'square', night: 'table', smallhours: 'home' },
    likes: ['bread', 'shrimp', 'gourd_pie', 'hearth_pie'],
    dialogue: {
      stranger: ['"You\'re slow. No offence. Everyone\'s slow."',
                 '"I can get to the Peaks and back before supper. Want to bet?"'],
      known:    ['"I knew your name before you said it. I always do. It\'s not a trick."',
                 '"Mister Marrow talks in his sleep. He says numbers."'],
      friend:   ['"I keep count of how many times you\'ve started over. You\'re on more than you think."',
                 '"If you go out the gate and don\'t come back, I\'ll wait. I always wait."'],
      confidant:['"I don\'t get older. I\'ve noticed. Don\'t tell Wren, she\'ll fuss."',
                 '"When it resets I lose everything except your name. Every time. Just the name."'],
    },
    requests: [
      { id: 'p_run', ask: 'Walk the road with me. Just once, properly.',
        need: { adventure: 3 }, reward: { gold: 6000 } },
      { id: 'p_fish', ask: 'Ten shrimp. Don\'t ask what for.',
        need: { item: 'shrimp', count: 10 }, reward: { gold: 4000 } },
      { id: 'p_gift', ask: 'Something shiny. Anything. I\'m not fussy.',
        need: { item: 'rune_shard', count: 5 }, reward: { gold: 9000 } },
    ],
  },
  holt: {
    trade: 'Watch Captain',
    at: { dawn: 'gate', morning: 'gate', afternoon: 'gate',
          evening: 'table', night: 'gate', smallhours: 'gate' },
    likes: ['coalfire_roast', 'ember_stew', 'leviathan_steak', 'lobster'],
    dialogue: {
      stranger: ['"Post two on the east road. Always two."',
                 '"You fight like someone who\'s died before. No offence."'],
      known:    ['"Gate\'s open. It\'s always open. That\'s not the same as safe."',
                 '"I drill them every morning. Nobody asked me to. Somebody should have."'],
      friend:   ['"I was in a war. I can\'t name it. I can name every man in it."',
                 '"You come back different each time and you never notice. I notice."'],
      confidant:['"There is nothing on the other side of that gate that I have not already lost to."',
                 '"If it comes apart, I\'m standing here. Understand? Here."'],
    },
    requests: [
      { id: 'h_drill', ask: 'Kill forty of anything. The watch needs to see it done.',
        need: { kill: 40 }, reward: { gold: 15000 } },
      { id: 'h_steel', ask: 'Six steel bars. The watch\'s gear is a disgrace.',
        need: { item: 'steel_bar', count: 6 }, reward: { gold: 11000 } },
      { id: 'h_roast', ask: 'Feed my watch properly for once. Two roasts.',
        need: { item: 'coalfire_roast', count: 2 }, reward: { gold: 40000 } },
    ],
  },
  wren: {
    trade: 'Physicker',
    at: { dawn: 'home', morning: 'table', afternoon: 'square',
          evening: 'table', night: 'table', smallhours: 'home' },
    likes: ['herb_kingsleaf', 'herb_mooncap', 'refined_tonic', 'anglers_broth'],
    dialogue: {
      stranger: ['"Sit. You\'re bleeding and pretending not to be."',
                 '"I write everyone down. Name, ailment, date. It helps."'],
      known:    ['"Your name\'s in my book more than once. Different hands. All mine."',
                 '"Eat something that isn\'t raw. I\'m begging."'],
      friend:   ['"I have four ledgers. Same names, four times. I keep them in order."',
                 '"You heal faster than anyone should. I stopped writing that down."'],
      confidant:['"I wrote your name down once and it took. That\'s the only word for it — it took."',
                 '"Somebody is keeping records of us. I\'d just like to be introduced."'],
    },
    requests: [
      { id: 'w_herbs', ask: 'Fifteen mooncap. The season\'s been thin.',
        need: { item: 'herb_mooncap', count: 15 }, reward: { gold: 7000 } },
      { id: 'w_tonic', ask: 'Three refined tonics. For people who won\'t come to me.',
        need: { item: 'refined_tonic', count: 3 }, reward: { gold: 26000 } },
      { id: 'w_rest', ask: 'Sleep somewhere with a roof. Furnish that house of yours.',
        need: { furniture: 4 }, reward: { gold: 18000 } },
    ],
  },
  vera: {
    trade: 'Forge-Sister',
    at: { dawn: 'square', morning: 'square', afternoon: 'square',
          evening: 'table', night: 'home', smallhours: 'home' },
    likes: ['coal', 'mythril_bar', 'runite_bar', 'ember_stew'],
    dialogue: {
      stranger: ['"Bring me metal or bring me nothing."',
                 '"My apprentices are learning. Slowly. Loudly."'],
      known:    ['"You forge like you\'re apologising to it. Don\'t."',
                 '"The hammer knows. Ask it sometime."'],
      friend:   ['"I dreamt this blade before you brought it. That happens to me."',
                 '"Every cycle I re-learn the same craft and every cycle my hands are already good at it."'],
      confidant:['"The metal remembers what I make. I don\'t. That is not a fair arrangement."',
                 '"If you get out — properly out — take a hammer. Nowhere is worth arriving at empty-handed."'],
    },
    requests: [
      { id: 'v_coal', ask: 'Thirty coal. The forge eats it faster than I can dig.',
        need: { item: 'coal', count: 30 }, reward: { gold: 9000 } },
      { id: 'v_mythril', ask: 'Eight mythril bars. I want to try something.',
        need: { item: 'mythril_bar', count: 8 }, reward: { gold: 34000 } },
      { id: 'v_ench', ask: 'Put a rune on something. Properly. Five times.',
        need: { enchants: 5 }, reward: { gold: 22000 } },
    ],
  },
  bram: {
    trade: 'Innkeeper',
    at: { dawn: 'table', morning: 'table', afternoon: 'table',
          evening: 'table', night: 'table', smallhours: 'table' },
    likes: ['salmon', 'lobster', 'gilded_platter', 'town_coffee'],
    dialogue: {
      stranger: ['"Room\'s upstairs. Don\'t ask about the noise."',
                 '"I never ask where anyone\'s been. It\'s a policy."'],
      known:    ['"Your usual. Don\'t look surprised, you\'ve had a usual for years."',
                 '"People tell me things at this table. I forget most of them on purpose."'],
      friend:   ['"I\'ve poured you the same drink under four different faces."',
                 '"Nobody\'s ever checked out. Not once. Have a think about that."'],
      confidant:['"I keep a tab for you. It goes back further than the town does."',
                 '"When it all winds back I\'m already behind the bar. Mid-pour. Every time."'],
    },
    requests: [
      { id: 'b_stock', ask: 'Twelve salmon. The kitchen\'s bare.',
        need: { item: 'salmon', count: 12 }, reward: { gold: 8000 } },
      { id: 'b_feast', ask: 'A gilded platter. I want to see what the fuss is.',
        need: { item: 'gilded_platter', count: 1 }, reward: { gold: 55000 } },
      { id: 'b_trade', ask: 'Make my table busy. Run twenty business cycles.',
        need: { townCycles: 20 }, reward: { gold: 14000 } },
    ],
  },
  quill: {
    trade: 'Cartographer',
    at: { dawn: 'road', morning: 'road', afternoon: 'square',
          evening: 'table', night: 'table', smallhours: 'home' },
    likes: ['star_chart', 'herb_voidbloom', 'greater_rune', 'town_coffee'],
    dialogue: {
      stranger: ['"I map things. Somebody has to and nobody else volunteered."',
                 '"Your route was inefficient. I watched you take it twice."'],
      known:    ['"The coastline is the same length every time I measure it. That should reassure me."',
                 '"I have drawn this town eleven times. The drawings do not agree."'],
      friend:   ['"There is an edge. I have not been to it. I know exactly how far it is."',
                 '"You walk like somebody checking whether the ground is still there."'],
      confidant:['"My maps have a border. Not a coastline — a border. Do you understand the difference?"',
                 '"I keep the old ones. Every version of Hearthwick, in a drawer, in order."'],
    },
    requests: [
      { id: 'q_walk', ask: 'Walk somewhere new. Five chains on the road, and tell me about it.',
        need: { adventure: 5 }, reward: { gold: 16000 } },
      { id: 'q_runes', ask: 'Twelve greater runes. For a survey that keeps failing.',
        need: { item: 'greater_rune', count: 12 }, reward: { gold: 13000 } },
      { id: 'q_far', ask: 'Get to character level 60. I want a reading from somebody who has.',
        need: { kill: 60 }, reward: { gold: 19000 } },
    ],
  },
  ferrin: {
    trade: 'Surveyor',
    era: 2,
    at: { dawn: 'gate', morning: 'gate', afternoon: 'road',
          evening: 'table', night: 'square', smallhours: 'square' },
    likes: ['glitched_ore', 'deprecated_asset', 'corrupt_sigil'],
    dialogue: {
      stranger: ['"The surveys stop at the ridge. They don\'t stop because the land does."',
                 '"I measure things. It\'s calming until it isn\'t."'],
      known:    ['"Down is further than down should be. I\'ve been checking."',
                 '"The Wastes aren\'t ruins. Ruins were something first."'],
      friend:   ['"I have depth readings that disagree with each other on the same day."',
                 '"Something down there is minding it. Minding, not guarding. Different job."'],
      confidant:['"I don\'t think we\'re outside anything. I think we\'re in a bigger room."',
                 '"The Vigil isn\'t a monster. It\'s a piece of equipment that was never switched off."'],
    },
    requests: [
      { id: 'f_depth', ask: 'Go down. Properly down — depth eight, at least.',
        need: { depth: 8 }, reward: { gold: 60000 } },
      { id: 'f_ore', ask: 'Forty glitched ore. I need a sample that isn\'t mine.',
        need: { item: 'glitched_ore', count: 40 }, reward: { gold: 45000 } },
      { id: 'f_warden', ask: 'Bring down three Wardens. I want to know if they\'re made or born.',
        need: { wardens: 3 }, reward: { gold: 90000 } },
    ],
  },
};

/** How long a request stands before it lapses. */
export const REQUEST_MS = 20 * 60 * 60 * 1000;   // twenty hours: one a day, comfortably
/** How long after finishing one before they ask again. */
export const REQUEST_COOLDOWN_MS = 4 * 60 * 60 * 1000;

export const getLife = id => LIVES[id];
