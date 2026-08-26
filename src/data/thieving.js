// ============================================================
// GETTING CAUGHT
//
// Thieving was the only skill in the game with no downside. You clicked
// it, gold appeared, and the fiction — that you were robbing people —
// had no mechanical weight at all. That is a fine idle skill and a
// terrible LitRPG one: the whole point of a thief is that it might go
// wrong.
//
// So every steal now has a chance of being noticed, and the odds are a
// function of two things the player actually controls:
//
//   THE MARK. Picking a pocket is nearly safe. Waylaying a caravan is
//   not. Stealing a Root Token from whatever administers this place is
//   the most dangerous thing in the game and should feel like it.
//
//   YOUR LEVEL. Every level above the action's requirement makes you
//   better at not being seen — but there is a floor. A master thief is
//   still a thief, and the ceiling on that is deliberately not 100%,
//   because a risk you can grind away stops being a risk.
//
// Being caught is NOT a punishment for playing badly. It is a fight, and
// the fight pays: beat the guard and you keep the haul and take their
// purse as well. Lose and you drop the spoils and walk away wounded. The
// expected value of thieving goes UP if you can win these, which is
// exactly the trade a thief should be making.
// ============================================================

export const CAUGHT = {
  /** Never less than this share of the base risk, however skilled you get. */
  MIN_RISK_FRACTION: 0.22,
  /** Levels above the requirement that take you all the way to that floor. */
  MASTERY_SPAN: 60,
  /** Each point of LUK shaves this much off the odds, capped below. */
  LUK_PER_POINT: 0.004,
  LUK_MAX_REDUCTION: 0.30,
  /** How much of the guard's purse you take on top of the haul. */
  WIN_PURSE: 1.0,
};

/**
 * The guards, one per thieving action, keyed by action id.
 *
 * `at` is the Thieving level the mark is gated behind, and every stat is
 * derived from it. The first pass invented an abstract "tier" and scaled
 * off that, which drifted badly from the real curve: the top guard came
 * out at level 204, five million health and thirty-four million gold —
 * three times the deepest thing in the Descent, for interrupting a skill.
 * Keying off the level that actually gates the action keeps a guard what
 * it is supposed to be: a real fight for somebody who could plausibly be
 * robbing this mark, and a formality once they have outgrown it.
 */
export const GUARDS = {
  pockets: { name: 'An Angry Fishwife',    icon: '🐟', at: 1,   risk: 0.055,
    line: 'She has your wrist and she is not letting go and everyone is looking.' },
  stall:   { name: 'Stallholder + Cousin', icon: '🍎', at: 12,  risk: 0.075,
    line: 'The cousin is significantly larger than the stallholder.' },
  chest:   { name: 'Hired Lockman',        icon: '🔒', at: 26,  risk: 0.095,
    line: 'He was asleep on the box. He is not asleep now.' },
  caravan: { name: 'Caravan Outriders',    icon: '🐎', at: 40,  risk: 0.12,
    line: 'Three of them, and they have done this before, and they fan out.' },
  vault:   { name: 'The Vault Warden',     icon: '🗿', at: 58,  risk: 0.15,
    line: 'It was part of the door. Now it is between you and the door.' },
  system:  { name: 'An Enforcement Daemon',icon: '⬛', at: 75,  risk: 0.18,
    line: '[ SYSTEM ] Unlicensed access. A correction has been dispatched.' },
  // --- past the ceiling. The marks stop being people. ---
  ledger:  { name: 'Syndicate Collections',icon: '📄', at: 107, risk: 0.20,
    line: 'They do not shout. One of them starts filling in a form while the others work.' },
  keycard: { name: 'Floor Supervisor',     icon: '🧿', at: 138, risk: 0.23,
    line: 'It asks, quite politely, what you think you are doing. It does not wait for an answer.' },
  root:    { name: 'ADMINISTRATOR PROCESS',icon: '👁️', at: 172, risk: 0.28,
    line: 'Something very large has stopped doing everything else it was doing.' },
};

/**
 * A guard, built to fight. Same shape as any monster.
 *
 * Health carries the difficulty; defence is deliberately LOW for the
 * level, because a guard is an interruption and an interruption that you
 * spend four minutes missing is just an annoyance. You should be landing
 * blows on these from the first swing and the question should be whether
 * you land enough of them before they land theirs.
 */
export function guardFor(actionId) {
  const g = GUARDS[actionId];
  if (!g) return null;
  const L = g.at;
  return {
    id: `guard_${actionId}`,
    name: g.name,
    icon: g.icon,
    line: g.line,
    level: Math.max(3, Math.round(L * 0.9)),
    hp: Math.round(45 * Math.pow(1.039, L)),
    defense: Math.round(10 * Math.pow(1.026, L)),
    attack: Math.round(8 * Math.pow(1.030, L)),
    maxHit: Math.round(4 * Math.pow(1.035, L)),
    attackSpeed: 2400,
    guard: true,
    // A purse worth taking. This is the upside of the whole system: the
    // expected value of a risky steal is HIGHER than a safe one, provided
    // you can actually win the argument.
    gold: [Math.round(20 * Math.pow(1.045, L)), Math.round(42 * Math.pow(1.045, L))],
    lootProfile: L >= 58 ? 'elite' : 'trash',
    loot: {
      common:   [{ item: 'cutpurse_coin', qty: [1, 3] }],
      uncommon: [{ item: 'pilfered_goods', qty: [1, 2] }],
      rare:     [{ item: 'strongbox_haul', qty: [1, 2] }],
      epic:     [{ item: 'caravan_spoils', qty: [1, 2] }],
      legendary:[{ item: 'vault_prize', qty: 1 }],
    },
  };
}

/**
 * Odds this steal goes wrong, right now.
 *
 * Returned as a full breakdown rather than a bare number so the skill
 * panel can show its working — a hidden risk that occasionally eats your
 * session reads as the game cheating, and the same risk printed on the
 * card reads as a decision you made.
 */
export function riskFor(actionId, { level = 1, required = 1, luk = 0 } = {}) {
  const g = GUARDS[actionId];
  if (!g) return null;
  const over = Math.max(0, level - required);
  const skillCut = 1 - (1 - CAUGHT.MIN_RISK_FRACTION) * Math.min(1, over / CAUGHT.MASTERY_SPAN);
  const lukCut = 1 - Math.min(CAUGHT.LUK_MAX_REDUCTION, luk * CAUGHT.LUK_PER_POINT);
  return {
    base: g.risk,
    chance: g.risk * skillCut * lukCut,
    floor: g.risk * CAUGHT.MIN_RISK_FRACTION * lukCut,
    over,
    guard: g,
  };
}
