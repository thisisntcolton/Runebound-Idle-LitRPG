// ============================================================
// YOUR HOUSE
//
// The one thing in Runebound that is yours rather than assigned. The
// System gave you skills, a class, a recommendation and a purpose. It did
// not give you this. You found the key in your pocket on the first
// morning and nobody has ever mentioned it.
//
// DESIGN RULES:
//
//  1. EVERY PIECE DOES SOMETHING. Decoration that is purely decorative
//     is a shop that sells nothing, and players work that out in about
//     four minutes. Each piece carries a small bonus; the sets carry the
//     interesting ones.
//
//  2. THE BONUSES ARE SMALL AND THE SETS ARE NOT. A single good chair is
//     worth a rounding error. A room furnished coherently is worth
//     planning around. That is what makes it a puzzle rather than a
//     shopping list.
//
//  3. IT SURVIVES EVERYTHING. The house does not burn with the town and
//     it does not reset with the cycle. It is the only structure in the
//     game the loop has never been able to touch, and nothing in the
//     fiction explains why.
//
//  4. YOU CAN SEE SOMEBODY ELSE'S. Every piece has to read at a glance
//     from a visitor's point of view, which is why they are drawn rather
//     than listed.
// ============================================================

/** Rooms, in the order they unlock. */
export const ROOMS = [
  { id: 'hearth', name: 'The Hearth Room', icon: '🔥', slots: 6, atHouseLevel: 1,
    blurb: 'One room, one fire, one chair. It was enough on the first night.' },
  { id: 'study', name: 'The Study', icon: '📚', slots: 6, atHouseLevel: 2,
    blurb: 'You did not build this. It was behind a door you had assumed was a cupboard.' },
  { id: 'workshop', name: 'The Workshop', icon: '🔧', slots: 6, atHouseLevel: 3,
    blurb: 'Sawdust that predates you. Somebody worked here.' },
  // Six, not eight. A room with more places than its set has pieces is a
  // set that can never be completed — the same class of bug as an ability
  // whose tome nothing drops, and the audit now fails on it.
  { id: 'gallery', name: 'The Long Gallery', icon: '🖼️', slots: 6, atHouseLevel: 4,
    blurb: 'Too grand for the house. The house does not seem to mind.' },
];

export const MAX_HOUSE_LEVEL = ROOMS.length;

/** What each extension costs. */
export function houseUpgradeCost(level) {
  return {
    gold: Math.floor(30000 * Math.pow(3.4, level - 1)),
    items: {
      [['oak_log', 'willow_log', 'maple_log', 'yew_log'][level - 1] || 'yew_log']: 40 * level,
      [['bronze_bar', 'iron_bar', 'steel_bar', 'mythril_bar'][level - 1] || 'mythril_bar']: 15 * level,
    },
  };
}

// ============================================================
// FURNITURE
//
// `bonus` feeds the same multiplier chain everything else uses, so a
// chair and a Fate Perk are read by identical code.
//
// `set` groups pieces. Furnishing a room entirely from one set pays the
// set bonus on top, which is where the real numbers live.
//
// `source` is how you get it, and it is checked by the reachability
// audit — a piece nothing sells and nothing drops is a piece that does
// not exist, which this project has shipped twice before.
// ============================================================

export const SETS = {
  hearthwick: {
    id: 'hearthwick', name: 'Hearthwick Common', icon: '🪵',
    bonus: { offline_rate: 0.10, town_revenue: 0.05 },
    desc: '+10% offline efficiency and +5% town revenue',
    flavour: 'Made locally, badly, with enormous affection.' },
  scholar: {
    id: 'scholar', name: 'The Scholar\'s Room', icon: '📖',
    bonus: { xp: 0.08 },
    desc: '+8% all XP',
    flavour: 'Somebody was working something out in here, and did not finish.' },
  trophy: {
    id: 'trophy', name: 'The Trophy Hall', icon: '🏆',
    bonus: { damage: 0.10, crit: 0.02 },
    desc: '+10% damage and +2% critical chance',
    flavour: 'Everything on these walls was trying to kill you at the time.' },
  wastes: {
    id: 'wastes', name: 'Salvage and Seam', icon: '🕳️',
    bonus: { drop_rate: 0.12, deep_bonus: 0.05 },
    desc: '+12% rare drops, and the Descent pays 5% more',
    flavour: 'None of this came from inside the box. It does not sit right in a room.' },
  guest: {
    id: 'guest', name: 'Somewhere To Sit', icon: '🫖',
    bonus: { resident_mood: 0.20, gift_value: 0.25 },
    desc: 'Residents warm to you 20% faster, and gifts land 25% better',
    flavour: 'A house people come back to is a different kind of house.' },
};

const F = [];
const def = o => { F.push({ rarity: 'common', slots: 1, ...o }); };

// ---------------- Hearthwick Common ----------------
def({ id: 'plain_chair', name: 'Plain Chair', icon: '🪑', set: 'hearthwick', room: 'hearth',
      bonus: { offline_rate: 0.01 }, gold: 900,
      blurb: 'Baldric made it. It is not level and he knows it is not level.' });
def({ id: 'straw_bed', name: 'Straw Bed', icon: '🛏️', set: 'hearthwick', room: 'hearth',
      bonus: { offline_rate: 0.02 }, gold: 2200,
      blurb: 'Better than the floor by a margin you stopped noticing after a week.' });
def({ id: 'stone_hearth', name: 'Stone Hearth', icon: '🔥', set: 'hearthwick', room: 'hearth',
      bonus: { offline_rate: 0.02, resident_mood: 0.03 }, gold: 5000,
      blurb: 'The fire has never once gone all the way out. You have checked.' });
def({ id: 'rag_rug', name: 'Rag Rug', icon: '🧶', set: 'hearthwick', room: 'hearth',
      bonus: { resident_mood: 0.04 }, gold: 1600,
      blurb: 'Woven from clothes belonging to nobody you can name.' });
def({ id: 'cook_pot', name: 'Iron Cook Pot', icon: '🍲', set: 'hearthwick', room: 'hearth',
      bonus: { town_revenue: 0.02 }, gold: 3400, craft: { skill: 'smithing', level: 20 },
      blurb: 'The bottom is worn thin in one exact spot.' });
def({ id: 'shutters', name: 'Carved Shutters', icon: '🪟', set: 'hearthwick', room: 'hearth',
      bonus: { offline_rate: 0.02 }, gold: 7200, craft: { skill: 'woodcutting', level: 35 },
      blurb: 'The pattern is not a pattern. Wren noticed first and said nothing.' });

// ---------------- The Scholar's Room ----------------
def({ id: 'writing_desk', name: 'Writing Desk', icon: '🪶', set: 'scholar', room: 'study',
      bonus: { xp: 0.01 }, gold: 12000, rarity: 'uncommon',
      blurb: 'Ink in the grain, in a hand that is almost yours.' });
def({ id: 'tall_shelf', name: 'Tall Bookshelf', icon: '📚', set: 'scholar', room: 'study',
      bonus: { xp: 0.015 }, gold: 18000, rarity: 'uncommon',
      blurb: 'Eleven of these books are the same book. You have not mentioned it.' });
def({ id: 'star_chart', name: 'Star Chart', icon: '🗺️', set: 'scholar', room: 'study',
      bonus: { xp: 0.01, drop_rate: 0.02 }, gold: 26000, rarity: 'rare',
      blurb: 'The constellations are right. There are no stars over Hearthwick.' });
def({ id: 'orrery', name: 'Brass Orrery', icon: '🔭', set: 'scholar', room: 'study',
      bonus: { xp: 0.02 }, gold: 60000, rarity: 'rare', craft: { skill: 'smithing', level: 70 },
      blurb: 'It models a system with one world in it, going round nothing.' });
def({ id: 'reading_lamp', name: 'Reading Lamp', icon: '🕯️', set: 'scholar', room: 'study',
      bonus: { xp: 0.01 }, gold: 9000,
      blurb: 'Burns without being filled. Mirella says not to worry about it.' });
def({ id: 'quiet_chair', name: 'The Quiet Chair', icon: '💺', set: 'scholar', room: 'study',
      bonus: { xp: 0.015, offline_rate: 0.02 }, gold: 34000, rarity: 'rare',
      blurb: 'Nobody has ever fallen asleep in it, which is statistically strange.' });

// ---------------- The Trophy Hall ----------------
def({ id: 'wolf_head', name: 'Duskfang Mount', icon: '🐺', set: 'trophy', room: 'gallery',
      bonus: { damage: 0.01 }, rarity: 'uncommon',
      source: 'Taken from a Duskfang Wolf', drop: { monster: 'wolf', chance: 0.03 },
      blurb: 'Still faintly warm on cold mornings. Holt refuses to sit under it.' });
def({ id: 'spider_case', name: 'Broodmother In Glass', icon: '🕷️', set: 'trophy', room: 'gallery',
      bonus: { damage: 0.015, crit: 0.005 }, rarity: 'rare',
      source: 'Taken from the Broodmother', drop: { monster: 'spider', chance: 0.03 },
      blurb: 'The glass is thicker than it needs to be. That was deliberate.' });
def({ id: 'orc_banner', name: 'Cinder Banner', icon: '🚩', set: 'trophy', room: 'gallery',
      bonus: { damage: 0.02 }, rarity: 'rare',
      source: 'Taken from a Cinder Orc', drop: { monster: 'orc', chance: 0.03 },
      blurb: 'Somebody\'s standard. You did not ask whose before you took it.' });
def({ id: 'wyvern_skull', name: 'Storm Wyvern Skull', icon: '🐉', set: 'trophy', room: 'gallery',
      bonus: { damage: 0.02, crit: 0.005 }, rarity: 'epic',
      source: 'Taken from a Storm Wyvern', drop: { monster: 'wyvern', chance: 0.025 },
      blurb: 'Lighter than it looks. Most of it is air, which explains a lot.' });
def({ id: 'dragonknight_arms', name: 'A Fallen Knight\'s Arms', icon: '🛡️', set: 'trophy', room: 'gallery',
      bonus: { damage: 0.025 }, rarity: 'epic',
      source: 'Taken from a Fallen Dragonknight', drop: { monster: 'knight', chance: 0.025 },
      blurb: 'The crest has been filed off. Not recently, and not by you.' });
def({ id: 'last_flame', name: 'A Coal From The Last Flame', icon: '🕯️', set: 'trophy', room: 'gallery',
      bonus: { damage: 0.03, crit: 0.01 }, rarity: 'legendary',
      source: 'Taken from Aurelion', drop: { monster: 'aurelion', chance: 0.5 },
      blurb: 'It has not gone out. He said it would not. He was pleased about it.' });

// ---------------- Salvage and Seam ----------------
def({ id: 'seam_shard', name: 'A Shard Of The Seam', icon: '🔺', set: 'wastes', room: 'workshop',
      bonus: { drop_rate: 0.02 }, rarity: 'rare', era: 2,
      source: 'Dug out of the Wastes', salvage: true,
      blurb: 'An edge of something that was supposed to be continuous.' });
def({ id: 'deprecated_frame', name: 'Deprecated Frame', icon: '🖼️', set: 'wastes', room: 'workshop',
      bonus: { drop_rate: 0.02, deep_bonus: 0.01 }, rarity: 'rare', era: 2,
      source: 'Dug out of the Wastes', salvage: true,
      blurb: 'A picture frame around a rectangle of slightly wrong wall.' });
def({ id: 'warden_plate', name: 'Warden Plating', icon: '🗿', set: 'wastes', room: 'workshop',
      bonus: { deep_bonus: 0.02 }, rarity: 'epic', era: 2,
      source: 'Prised off a Warden in the Descent', deep: { chance: 0.06 },
      blurb: 'Heavy, and warm on the side that was facing down.' });
def({ id: 'unindexed_lamp', name: 'Unindexed Lamp', icon: '🏮', set: 'wastes', room: 'workshop',
      bonus: { drop_rate: 0.03 }, rarity: 'epic', era: 2,
      source: 'Dug out of the Wastes', salvage: true,
      blurb: 'It lights the room. It does not light anything in the room.' });
def({ id: 'vigil_gear', name: 'A Tooth Of The Vigil', icon: '⚙️', set: 'wastes', room: 'workshop',
      bonus: { drop_rate: 0.04, deep_bonus: 0.03 }, rarity: 'legendary', era: 2,
      source: 'Taken from the Vigil', boss: { chance: 1.0 },
      blurb: 'One gear tooth. There were nine hundred years of them.' });
def({ id: 'ledger_page', name: 'A Page Of The Ledger', icon: '📄', set: 'wastes', room: 'workshop',
      bonus: { gold: 0.04 }, rarity: 'epic', era: 2,
      source: 'Kept back when you settled the Ledger', ledger: true,
      blurb: 'Your name, and a number, and a date that has not happened.' });

// ---------------- Somewhere To Sit ----------------
def({ id: 'long_bench', name: 'Long Bench', icon: '🪑', set: 'guest', room: 'hearth',
      bonus: { resident_mood: 0.05 }, gold: 8000,
      blurb: 'Seats five, or two of Marrow.' });
def({ id: 'good_teapot', name: 'The Good Teapot', icon: '🫖', set: 'guest', room: 'hearth',
      bonus: { resident_mood: 0.05, gift_value: 0.05 }, gold: 14000, rarity: 'uncommon',
      blurb: 'Brought out for people you like. Everyone knows what it means.' });
def({ id: 'guest_bed', name: 'Guest Bed', icon: '🛌', set: 'guest', room: 'hearth',
      bonus: { resident_mood: 0.06 }, gold: 22000, rarity: 'uncommon',
      blurb: 'Made up, always, for nobody in particular.' });
def({ id: 'name_board', name: 'The Name Board', icon: '🪧', set: 'guest', room: 'hearth',
      bonus: { resident_mood: 0.08, gift_value: 0.10 }, gold: 45000, rarity: 'rare',
      blurb: 'Every name you have been. Pell keeps adding them without asking.' });
def({ id: 'window_box', name: 'Window Box', icon: '🪴', set: 'guest', room: 'hearth',
      bonus: { resident_mood: 0.04 }, gold: 6000, craft: { skill: 'farming', level: 30 },
      blurb: 'Whatever is in it flowers out of season, every season.' });
def({ id: 'welcome_mat', name: 'Welcome Mat', icon: '🚪', set: 'guest', room: 'hearth',
      bonus: { gift_value: 0.08 }, gold: 11000,
      blurb: 'It says WELCOME. Underneath, in smaller letters, it says STILL.' });

export const FURNITURE = F;
export const FURNITURE_BY_ID = Object.fromEntries(F.map(f => [f.id, f]));
export const getFurniture = id => FURNITURE_BY_ID[id];

/** Everything that can go in a given room. */
export const furnitureForRoom = roomId => F.filter(f => f.room === roomId);

/** Pieces you can simply buy, for the Square's furniture stall. */
export const BUYABLE = F.filter(f => f.gold && !f.craft);
/** Pieces you make yourself. */
export const CRAFTABLE = F.filter(f => f.craft);
/** Pieces the world has to give you. */
export const FOUND = F.filter(f => !f.gold && !f.craft);

export function setBonusFor(setId) { return SETS[setId] || null; }
