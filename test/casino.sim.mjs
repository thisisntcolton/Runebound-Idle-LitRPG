// ============================================================
// DOES THE HOUSE ACTUALLY WIN?
//
// "House always wins" is a design requirement, not a vibe, and intuition
// about probability is famously unreliable — a payout shaded the wrong
// way by two percent turns a gold sink into an infinite money printer,
// and it would take a player about an hour to find it.
//
// So this plays the real dealing code, hundreds of thousands of hands,
// against three player policies:
//
//   BASIC    — a decent approximation of basic strategy. This is the best
//              a player will realistically do, so it is the number that
//              matters: if the house still wins here, it wins.
//   MIMIC    — the player copies the dealer (hit below 17). A common
//              instinct, and notably worse, because the player busts
//              first and loses immediately when both bust.
//   CAUTIOUS — stands on 15+. Loses differently.
//
// Every one of them must lose money over the long run.
// ============================================================

import { freshShoe, handValue, isBlackjack, dealerShouldHit, CASINO,
         HAZARD_INSTANT_WIN, HAZARD_INSTANT_LOSS } from '../src/data/casino.js';

const HANDS = 300_000;
const BET = 100;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeShoe() {
  let shoe = shuffle(freshShoe());
  const cut = Math.floor(52 * 1.5);
  return () => {
    if (shoe.length <= cut) shoe = shuffle(freshShoe());
    return shoe.pop();
  };
}

// ---------------- Player policies ----------------

const upValue = up => (up.r === 'A' ? 11 : up.v);

/** A reasonable basic-strategy approximation: hit/stand/double. */
function basic(cards, up) {
  const { total, soft } = handValue(cards);
  const u = upValue(up);
  if (cards.length === 2) {
    if (total === 11) return 'double';
    if (total === 10 && u <= 9) return 'double';
    if (total === 9 && u >= 3 && u <= 6) return 'double';
    if (soft && (total === 17 || total === 18) && u >= 3 && u <= 6) return 'double';
  }
  if (soft) return total >= 19 ? 'stand' : total === 18 && u <= 8 ? 'stand' : 'hit';
  if (total >= 17) return 'stand';
  if (total >= 13 && u <= 6) return 'stand';
  if (total === 12 && u >= 4 && u <= 6) return 'stand';
  return 'hit';
}

const mimic = cards => (handValue(cards).total < 17 ? 'hit' : 'stand');
const cautious = cards => (handValue(cards).total < 15 ? 'hit' : 'stand');

// ---------------- One hand of blackjack ----------------

function playHand(next, policy) {
  let bet = BET;
  const player = [next(), next()];
  const dealer = [next(), next()];

  const pBj = isBlackjack(player), dBj = isBlackjack(dealer);
  if (pBj && dBj) return 0;
  if (pBj) return bet * CASINO.BLACKJACK_PAYS;
  if (dBj) return -bet;

  for (;;) {
    const move = policy(player, dealer[0]);
    if (move === 'double') { bet *= 2; player.push(next()); break; }
    if (move === 'hit') {
      player.push(next());
      if (handValue(player).bust) return -bet;
      continue;
    }
    break;
  }
  if (handValue(player).bust) return -bet;

  while (dealerShouldHit(dealer)) dealer.push(next());
  const p = handValue(player), d = handValue(dealer);
  if (d.bust) return bet;
  if (p.total > d.total) return bet;
  if (p.total < d.total) return -bet;
  return 0;
}

// ---------------- Hazard ----------------

const die = () => 1 + Math.floor(Math.random() * 6);
const roll = () => die() + die();

function playHazard() {
  let r = roll();
  if (HAZARD_INSTANT_WIN.has(r)) return BET * CASINO.HAZARD_PAYOUT;
  if (HAZARD_INSTANT_LOSS.has(r)) return -BET;
  const point = r;
  for (;;) {
    r = roll();
    if (r === point) return BET * CASINO.HAZARD_PAYOUT;
    if (r === 7) return -BET;
  }
}

// ---------------- Run it ----------------

console.log(`\nTHE GILDED SNAKE — ${HANDS.toLocaleString()} hands per policy, ${BET} a hand\n`);
console.log('  game        policy       net           per hand    house edge   verdict');

let broken = 0;
function report(game, name, net, wagered) {
  const perHand = net / HANDS;
  const edge = -net / wagered;
  const ok = net < 0;
  if (!ok) broken++;
  console.log(
    `  ${game.padEnd(11)} ${name.padEnd(11)} ` +
    `${Math.round(net).toLocaleString().padStart(11)} ` +
    `${perHand.toFixed(3).padStart(11)} ` +
    `${(edge * 100).toFixed(2).padStart(11)}% ` +
    `   ${ok ? 'house wins' : '*** PLAYER WINS — BROKEN ***'}`);
}

for (const [name, policy] of [['basic', basic], ['mimic', mimic], ['cautious', cautious]]) {
  const next = makeShoe();
  let net = 0, wagered = 0;
  for (let i = 0; i < HANDS; i++) {
    const before = net;
    net += playHand(next, policy);
    // A doubled hand risks two units; approximate the turnover by the
    // absolute swing, floored at one unit, which is close enough for an
    // edge figure and never flatters the house.
    wagered += Math.max(BET, Math.abs(net - before));
  }
  report('blackjack', name, net, wagered);
}

{
  let net = 0;
  for (let i = 0; i < HANDS; i++) net += playHazard();
  report('hazard', 'pass line', net, HANDS * BET);
}

// ---------------- What a session looks like ----------------
//
// The edge being real does not mean every night is a loss, and a design
// that pretended otherwise would be both dishonest and boring. This is
// the distribution a player actually experiences.
console.log('\n  A 50-hand session at the blackjack table, 10,000 sessions:');
{
  const next = makeShoe();
  const results = [];
  for (let s = 0; s < 10_000; s++) {
    let net = 0;
    for (let i = 0; i < 50; i++) net += playHand(next, basic);
    results.push(net);
  }
  results.sort((a, b) => a - b);
  const pct = q => results[Math.floor(q * results.length)];
  const up = results.filter(r => r > 0).length / results.length;
  console.log(`    walked away ahead: ${(up * 100).toFixed(1)}% of sessions`);
  console.log(`    worst 5%: ${pct(0.05).toLocaleString()}   median: ${pct(0.5).toLocaleString()}   best 5%: ${pct(0.95).toLocaleString()}`);
  console.log(`    (stakes of ${BET}; so roughly ${(pct(0.95) / BET).toFixed(0)} units up on a good night, ${(pct(0.05) / BET).toFixed(0)} on a bad one)`);
}

console.log(`\n${broken === 0 ? 'The house always wins.' : broken + ' game(s) favour the player.'}\n`);
process.exit(broken ? 1 : 0);
