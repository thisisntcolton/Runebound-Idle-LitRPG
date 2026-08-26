// ============================================================
// THE GILDED SNAKE — dealing, resolving, and keeping the books
//
// State lives in state.casino and survives Ascension, because a running
// tally of what this place has taken off you is the most honest thing the
// feature can offer. It is shown to the player without editorial.
// ============================================================
import { state, combatLevel } from '../core/state.js';
import { CASINO, freshShoe, handValue, isBlackjack, dealerShouldHit,
         HAZARD_INSTANT_WIN, HAZARD_INSTANT_LOSS } from '../data/casino.js';
import { combatIncome } from '../data/adventure.js';
import { addGold, spendGold } from './inventory.js';
import { townLevel } from './town.js';
import { emit } from '../core/events.js';

export function casino() {
  if (!state.casino) {
    state.casino = {
      shoe: [], cut: 0,
      hand: null,            // blackjack in progress
      hazard: null,          // dice game in progress
      wagered: 0, won: 0, lost: 0, hands: 0,
      bestWin: 0, worstLoss: 0, streak: 0, bestStreak: 0,
      lastBet: CASINO.MIN_BET,
    };
  }
  return state.casino;
}

export function casinoOpen() {
  return townLevel() >= CASINO.UNLOCK_TOWN_LEVEL;
}

/** The table limit for this player. */
export function maxBet() {
  const perMinute = combatIncome(combatLevel(), state.era || 1).gold;
  return Math.max(CASINO.MIN_BET * 4,
    Math.min(CASINO.MAX_BET_HARD_CAP,
      Math.round(perMinute * CASINO.MAX_BET_COMBAT_MINUTES)));
}

export function legalBet(n) {
  const v = Math.floor(Number(n) || 0);
  return Math.max(CASINO.MIN_BET, Math.min(maxBet(), v));
}

// ---------------- The shoe ----------------

function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/**
 * Draw one card, reshuffling at the cut card.
 *
 * The shoe is reshuffled well before it runs out, which is exactly what a
 * real casino does and exactly why counting cards is not a strategy here.
 */
function draw() {
  const c = casino();
  if (!c.shoe || c.shoe.length <= c.cut) {
    c.shoe = shuffle(freshShoe());
    // Cut roughly a deck and a half from the end.
    c.cut = Math.floor(52 * 1.5);
  }
  return c.shoe.pop();
}

// ---------------- Book-keeping ----------------

/**
 * Record one resolved wager.
 *
 * The stake has already left the purse, so `gross` is what comes BACK
 * (0 on a loss, the stake on a push, stake plus winnings on a win) and
 * `net` is what actually changed hands. Keeping both explicit is the
 * whole reason this is one function: the first version tried to infer the
 * net from the gross after the fact and got the blackjack case wrong.
 */
function settle(stake, gross, label) {
  const c = casino();
  const net = gross - stake;
  c.hands++;
  if (gross > 0) addGold(gross, { silent: true });
  if (net > 0) {
    c.won += net;
    c.bestWin = Math.max(c.bestWin || 0, net);
    c.streak = Math.max(0, c.streak) + 1;
    c.bestStreak = Math.max(c.bestStreak || 0, c.streak);
  } else if (net < 0) {
    c.lost += -net;
    c.worstLoss = Math.max(c.worstLoss || 0, -net);
    c.streak = Math.min(0, c.streak) - 1;
  }
  emit('casino-result', { delta: net, label });
  emit('state-changed');
  return net;
}

/** Net position. Negative means the house is ahead, which it will be. */
export function ledger() {
  const c = casino();
  return {
    wagered: c.wagered || 0,
    won: c.won || 0,
    lost: c.lost || 0,
    net: (c.won || 0) - (c.lost || 0),
    hands: c.hands || 0,
    bestWin: c.bestWin || 0,
    worstLoss: c.worstLoss || 0,
    streak: c.streak || 0,
    bestStreak: c.bestStreak || 0,
  };
}

/**
 * Is a game still actually in play?
 *
 * A finished hand stays on the table so the player can read the result,
 * which is right — but it must not block the other game. The first
 * version guarded on "a hand exists" and made the dice unreachable until
 * you went back and dismissed a blackjack hand you had already read.
 */
function busy() {
  const c = casino();
  return (!!c.hand && !c.hand.done) || (!!c.hazard && !c.hazard.done);
}

/** Sweep away anything already resolved, so the table is clear. */
function clearFinished() {
  const c = casino();
  if (c.hand?.done) c.hand = null;
  if (c.hazard?.done) c.hazard = null;
}

// ============================================================
// BLACKJACK
// ============================================================

export function deal(bet) {
  const c = casino();
  if (busy()) return false;
  clearFinished();
  const stake = legalBet(bet);
  if (state.gold < stake) {
    emit('notify', { type: 'sys', text: 'The dealer looks at your purse, then at you. Not tonight.' });
    return false;
  }
  spendGold(stake);
  c.wagered += stake;
  c.lastBet = stake;

  const player = [draw(), draw()];
  const dealer = [draw(), draw()];
  c.hand = {
    bet: stake, player, dealer, done: false,
    doubled: false, split: null, activeHand: 0, result: null,
  };

  // Naturals resolve immediately, both ways.
  const pBj = isBlackjack(player), dBj = isBlackjack(dealer);
  if (pBj || dBj) {
    if (pBj && dBj) finish('push', 'Both blackjack. The dealer nods. Nothing moves.');
    else if (pBj) finish('blackjack', 'Blackjack. The dealer pays three to two without expression.');
    else finish('lose', 'Dealer blackjack. Of course.');
  }
  emit('state-changed');
  return true;
}

export function hit() {
  const c = casino();
  const h = c.hand;
  if (!h || h.done) return false;
  h.player.push(draw());
  if (handValue(h.player).bust) finish('lose', 'Bust. The dealer takes it before you have finished looking.');
  emit('state-changed');
  return true;
}

export function stand() {
  const c = casino();
  const h = c.hand;
  if (!h || h.done) return false;
  playDealer();
  return true;
}

export function double() {
  const c = casino();
  const h = c.hand;
  if (!h || h.done || h.player.length !== 2) return false;
  if (state.gold < h.bet) {
    emit('notify', { type: 'sys', text: 'Not enough to double.' });
    return false;
  }
  spendGold(h.bet);
  c.wagered += h.bet;
  h.bet *= 2;
  h.doubled = true;
  h.player.push(draw());
  if (handValue(h.player).bust) { finish('lose', 'Doubled, and bust. That is the risk, stated plainly.'); return true; }
  playDealer();
  return true;
}

function playDealer() {
  const h = casino().hand;
  while (dealerShouldHit(h.dealer)) h.dealer.push(draw());
  const p = handValue(h.player), d = handValue(h.dealer);
  if (d.bust) finish('win', `Dealer busts on ${d.total}. The chips slide back across.`);
  else if (p.total > d.total) finish('win', `${p.total} against ${d.total}. Yours.`);
  else if (p.total < d.total) finish('lose', `${d.total} against your ${p.total}. The house takes it.`);
  else finish('push', `Both on ${p.total}. Nothing changes hands.`);
  emit('state-changed');
}

function finish(result, line) {
  const c = casino();
  const h = c.hand;
  h.done = true;
  h.result = result;
  h.line = line;
  const bet = h.bet;
  // What comes back to the purse. The stake is already gone.
  const gross =
      result === 'blackjack' ? Math.round(bet * (1 + CASINO.BLACKJACK_PAYS))
    : result === 'win'       ? bet * 2
    : result === 'push'      ? bet
    :                          0;
  settle(bet, gross, line);
}

export function clearHand() {
  const c = casino();
  c.hand = null;
  emit('state-changed');
}

// ============================================================
// HAZARD (the dice)
// ============================================================

function roll2() {
  const a = 1 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * 6);
  return { a, b, total: a + b };
}

export function hazardStart(bet) {
  const c = casino();
  if (busy()) return false;
  clearFinished();
  const stake = legalBet(bet);
  if (state.gold < stake) {
    emit('notify', { type: 'sys', text: 'The dice stay where they are.' });
    return false;
  }
  spendGold(stake);
  c.wagered += stake;
  c.lastBet = stake;
  c.hazard = { bet: stake, point: null, rolls: [], done: false, result: null };
  hazardRoll();
  return true;
}

export function hazardRoll() {
  const c = casino();
  const g = c.hazard;
  if (!g || g.done) return false;
  const r = roll2();
  g.rolls.push(r);
  g.last = r;

  if (g.point === null) {
    if (HAZARD_INSTANT_WIN.has(r.total)) hazardFinish('win', `${r.total}. Straight out of the gate.`);
    else if (HAZARD_INSTANT_LOSS.has(r.total)) hazardFinish('lose', `${r.total}. The dealer barely looks up.`);
    else { g.point = r.total; emit('state-changed'); }
  } else {
    if (r.total === g.point) hazardFinish('win', `${r.total} again. You made your point.`);
    else if (r.total === 7) hazardFinish('lose', 'Seven. Seven is always what gets you.');
    else emit('state-changed');
  }
  return true;
}

function hazardFinish(result, line) {
  const c = casino();
  const g = c.hazard;
  g.done = true;
  g.result = result;
  g.line = line;
  // Slightly under even money. That shading is where most of this game's
  // edge lives, and it is the part nobody notices.
  const gross = result === 'win'
    ? g.bet + Math.round(g.bet * CASINO.HAZARD_PAYOUT)
    : 0;
  settle(g.bet, gross, line);
}

export function clearHazard() {
  casino().hazard = null;
  emit('state-changed');
}

// ---------------- View ----------------

export function casinoView() {
  const c = casino();
  return {
    open: casinoOpen(),
    unlockAt: CASINO.UNLOCK_TOWN_LEVEL,
    minBet: CASINO.MIN_BET,
    maxBet: maxBet(),
    lastBet: Math.min(c.lastBet || CASINO.MIN_BET, maxBet()),
    hand: c.hand,
    hazard: c.hazard,
    ledger: ledger(),
  };
}
