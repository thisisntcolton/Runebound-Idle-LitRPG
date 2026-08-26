// ============================================================
// THE GILDED SNAKE — Hearthwick's casino
//
// The one building in town you do not own, cannot build, cannot staff and
// cannot upgrade. It was here before you bought your first parcel and it
// will be here after the world winds back. Somebody owns it. Not you.
//
// DESIGN RULES, which the maths below actually obeys:
//
//  1. THE HOUSE WINS. Not "usually" — in expectation, always, at every
//     stake, on both games. The edge is real and it is verified by
//     test/casino.sim.mjs playing a million hands rather than by anyone's
//     intuition about probability, which is famously terrible.
//
//  2. THE SWINGS ARE REAL TOO. A house edge of a couple of percent means
//     an evening can absolutely go your way. That is the whole appeal and
//     the whole trap, and it is why the edge is small rather than
//     punitive: a game that visibly robs you is not tempting, and a
//     tempting game that quietly costs you is the honest depiction.
//
//  3. IT IS A SINK, NOT A TREADMILL. There is no way to grind it. The
//     table limit scales with what you could earn elsewhere, so it stays
//     relevant, and it caps out so nobody loses a hundred hours of play
//     to one bad hand.
//
//  4. NO REAL MONEY, NO PURCHASE, NO CATCH-UP MECHANIC. It costs the
//     game's gold and nothing else, and it never offers to sell you more.
//
// Blackjack runs real rules — dealer stands on all 17, blackjack pays
// 3:2, one split, double on any two — because the edge those rules
// produce (about half a percent against a perfect player, more against
// a real one) is the joke: it looks like the fairest game in the world.
// ============================================================

export const CASINO = {
  /** Unlocks with the town, so it is not the first thing a new player sees. */
  UNLOCK_TOWN_LEVEL: 3,

  /** Minimum stake, flat. */
  MIN_BET: 500,

  // The table limit follows what you could earn in a stretch of ordinary
  // play, so the casino neither becomes irrelevant at high level nor lets
  // a bad night erase a week. Expressed in minutes of level-appropriate
  // fighting, the same currency the road and pet errands use.
  MAX_BET_COMBAT_MINUTES: 12,
  /** Never above this, whatever the level, so the ceiling is knowable. */
  MAX_BET_HARD_CAP: 5_000_000,

  BLACKJACK_PAYS: 1.5,      // 3:2
  DEALER_STANDS_ON: 17,     // and on soft 17 — the player-friendlier rule
  DECKS: 6,

  /**
   * The dice game: Hazard.
   *
   * Roll two dice. 7 or 11 wins immediately, 2/3/12 loses immediately,
   * anything else becomes your Point and you re-roll until either the
   * Point (win) or a 7 (lose). Those are craps pass-line rules, which
   * carry a 1.41% house edge — small, honest, and utterly relentless.
   *
   * The payout is shaded very slightly below even money, which is where
   * the rest of the edge comes from and is the part a player is least
   * likely to notice.
   */
  HAZARD_PAYOUT: 0.97,
};

/** Card ranks and their blackjack values. Ace is handled as 11-or-1. */
export const RANKS = [
  { r: 'A',  v: 11 }, { r: '2', v: 2 }, { r: '3', v: 3 }, { r: '4',  v: 4 },
  { r: '5',  v: 5 },  { r: '6', v: 6 }, { r: '7', v: 7 }, { r: '8',  v: 8 },
  { r: '9',  v: 9 },  { r: '10', v: 10 }, { r: 'J', v: 10 },
  { r: 'Q',  v: 10 }, { r: 'K', v: 10 },
];
export const SUITS = ['♠', '♥', '♦', '♣'];

/** A fresh shoe, in order. Shuffling is the caller's business. */
export function freshShoe(decks = CASINO.DECKS) {
  const shoe = [];
  for (let d = 0; d < decks; d++) {
    for (const s of SUITS) for (const { r, v } of RANKS) shoe.push({ r, s, v });
  }
  return shoe;
}

/**
 * Best blackjack total for a hand: the highest value at or under 21,
 * counting aces as 1 where 11 would bust.
 */
export function handValue(cards) {
  let total = cards.reduce((s, c) => s + c.v, 0);
  let aces = cards.filter(c => c.r === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  const soft = aces > 0 && total <= 21;
  return { total, soft, bust: total > 21 };
}

export function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards).total === 21;
}

/** The dealer's fixed policy. No judgement, no deviation — that is the point. */
export function dealerShouldHit(cards) {
  return handValue(cards).total < CASINO.DEALER_STANDS_ON;
}

// ---------------- Hazard ----------------

export const HAZARD_INSTANT_WIN = new Set([7, 11]);
export const HAZARD_INSTANT_LOSS = new Set([2, 3, 12]);

/** The house's own description of itself, which is at least honest. */
export const HOUSE_LINES = [
  'The dealer has been here longer than the town has.',
  'Nobody remembers who built this place. The dealer does not answer that one.',
  'A sign above the door reads THE HOUSE THANKS YOU FOR YOUR CUSTOM. It looks old.',
  'The chips are warm. You decide not to think about it.',
  'There is no clock in here, and no window. You had noticed.',
];
