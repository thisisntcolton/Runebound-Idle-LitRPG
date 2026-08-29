// ============================================================
// HEARTHWICK, AS A PLACE
//
// Runebound has always had a town. It has never had a PLACE. The map was
// one panel among twenty, the buildings were spreadsheet rows with art on
// them, and the seven people who live here existed as a bonus list.
//
// This is the front door now. You start here, you come back here, and
// the things you do happen somewhere rather than in a menu:
//
//   YOUR HOUSE      is yours, and you furnish it.
//   THE SQUARE      is where the town posts what it needs.
//   THE GATE        is what you leave through, and where parties muster.
//   THE GILDED SNAKE was here before you and will be here after.
//   THE LONG TABLE  is where people actually are, at the hours they are
//                   there, and where you talk to them.
//
// A place is not a building you buy. The nine parcels are still the
// economy; these five are the town itself, and they cannot be bought,
// sold, upgraded or demolished. That distinction matters — a player who
// can demolish the Square has been handed a game about optimisation
// wearing a town's clothes.
// ============================================================

/** The civic map. Coordinates are in the town SVG's own space. */
export const PLACES = [
  {
    id: 'home', name: 'Your House', icon: '🏠',
    x: 930, y: 84, w: 210, h: 150,
    view: 'home',
    blurb: 'Small, yours, and the only building in Hearthwick the System never assigned you.',
    // Always present. You arrive with a key and no explanation.
    always: true,
  },
  {
    id: 'square', name: 'The Square', icon: '📋',
    x: 930, y: 268, w: 210, h: 150,
    view: 'square',
    blurb: 'A noticeboard, a well, and whatever the town currently needs doing.',
    always: true,
  },
  {
    id: 'table', name: 'The Long Table', icon: '🪑',
    x: 930, y: 452, w: 210, h: 150,
    view: 'table',
    blurb: 'Nobody built it. It has always been under the elm, and people end up at it.',
    always: true,
  },
  {
    id: 'gate', name: 'The Gate', icon: '⛩️',
    x: 370, y: 646, w: 220, h: 130,
    view: 'gate',
    blurb: 'The road out. Parties muster here, and everything that has ever happened to you started by walking through it.',
    always: true,
  },
  {
    id: 'snake', name: 'The Gilded Snake', icon: '🎲',
    x: 70, y: 646, w: 220, h: 130,
    view: 'casino',
    blurb: 'A door with no sign on it. Somebody owns this. Not you.',
    // The one civic building with a gate on it — see systems/places.js.
    unlockTownLevel: 3,
  },
  {
    id: 'road', name: 'The Old Road', icon: '🧭',
    x: 670, y: 646, w: 220, h: 130,
    view: 'road',
    blurb: 'It goes somewhere. It has always gone somewhere. Nobody agrees where.',
    always: true,
  },
];

export const getPlace = id => PLACES.find(p => p.id === id);

/**
 * Where the map sends you when you click a parcel versus a place.
 *
 * Parcels open the business panel they always did. Places open their own
 * view. Keeping the two lists separate is what stops the town becoming a
 * grid of interchangeable clickable rectangles.
 */
export const TOWN_VIEWBOX = { w: 1180, h: 800 };

// ---------------- The hours ----------------
//
// The town runs on a six-part day derived from the real clock, so a
// player who checks in at breakfast and again at midnight sees two
// different towns. Deliberately NOT tied to the game's own tick: the
// point is that Hearthwick keeps its own hours whether you are here or
// not, which is the whole difference between a place and a panel.

export const HOURS = [
  { id: 'dawn',      from: 5,  to: 8,  label: 'Dawn',      icon: '🌅', tint: '#f2c48a' },
  { id: 'morning',   from: 8,  to: 12, label: 'Morning',   icon: '☀️', tint: '#ffe6a8' },
  { id: 'afternoon', from: 12, to: 17, label: 'Afternoon', icon: '🌤️', tint: '#ffdca0' },
  { id: 'evening',   from: 17, to: 21, label: 'Evening',   icon: '🌇', tint: '#e39a72' },
  { id: 'night',     from: 21, to: 24, label: 'Night',     icon: '🌙', tint: '#5c6b9c' },
  { id: 'smallhours',from: 0,  to: 5,  label: 'Small Hours', icon: '🌑', tint: '#39456e' },
];

export function hourNow(date = new Date()) {
  const h = date.getHours();
  return HOURS.find(w => h >= w.from && h < w.to) || HOURS[1];
}
