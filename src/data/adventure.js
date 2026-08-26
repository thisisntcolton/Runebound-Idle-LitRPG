// ============================================================
// ADVENTURE — the third thing to be doing
//
// Runebound had two verbs: hit it, or make it. Both are treadmills, and
// both are the kind of treadmill you stop reading after the first hour.
// Adventure is the third, and it is deliberately not a treadmill at all:
// you set out, the road carries you, and every so often something happens
// that you have to answer.
//
// THE RULES OF THE FICTION, which every chain below obeys:
//
//  1. BOTH OPTIONS ARE REAL. Never a right answer and a trap. If one
//     branch is safe and dull the player learns to pick it in a week and
//     the whole system collapses into a button. The kind thing and the
//     hard thing should both cost and both pay.
//
//  2. IT GOES THREE DEEP, AND THE THIRD BEAT KNOWS WHAT YOU DID. An
//     encounter that resolves in one screen is a slot machine with prose
//     on it. The chain is what makes a choice a choice.
//
//  3. THE WORLD REMEMBERS. Finishing a chain sets a flag, and other
//     chains read those flags. Help the old woman and someone, somewhere,
//     eventually mentions it. This is the entire reason the system is
//     worth building rather than buying a random-event table.
//
//  4. NOBODY EXPLAINS THE TWIST. Same rule as the Codex and lore.js. The
//     road is strange because the world is a box; nothing on it says so.
//
// Rewards are declared as MULTIPLES, not amounts — `gold: 3` means three
// units of whatever a payout is worth at this player's level. See
// systems/adventure.js for the scaling. Hand-written gold values would
// be generous at level 20 and insulting at level 150.
// ============================================================

export const ADVENTURE = {
  // One encounter every couple of minutes. It used to be every 47 seconds,
  // which turned a narrative feature into a treadmill with prose on it —
  // you could not walk anywhere without being interrupted, and the maths
  // below had to divide a whole hour of income across seventy-seven
  // payouts, making every individual one feel like nothing. Slower is both
  // better reading and better economics.
  MIN_MS: 95 * 1000,
  MAX_MS: 165 * 1000,
  /** How long a vignette waits for an answer before the road decides. */
  DECIDE_MS: 90 * 1000,
  /** Passive finds while walking, per encounter's worth of travel. */
  TRAVEL_GOLD: 0.55,
  TRAVEL_XP: 0.5,
};

// ============================================================
// WHAT A REWARD IS WORTH
//
// This used to be `60 * 1.055^charLevel`, written as though charLevel
// topped out near 100. It does not: charLevel is total skill level over
// four, so thirteen skills at 99 is character level 317, and 1.055^317 is
// twenty-three million. A player reported a single vignette paying
// 820,000 gold and they were only a third of the way up that curve — at
// the top it was fifty-six billion.
//
// The lesson is not "pick a smaller exponent". It is that a reward curve
// invented in isolation will always drift away from the game it is
// supposed to sit beside. So the road no longer has a curve of its own:
// a unit is a fixed slice of what fighting pays at your level, read off
// the actual monster table. It cannot outrun combat because it is
// defined in terms of combat.
//
// The two constants below are calibrated by test/road.sim.mjs, which
// walks every option of every chain, computes the real hourly load, and
// fails if the road drifts off parity in either direction.
// ============================================================

import { ZONES } from './monsters.js';

/** A gold unit, as a fraction of one minute of level-appropriate fighting. */
export const UNIT_AS_COMBAT_MINUTES = 0.47;
/** An XP unit, likewise. Higher because chains grant XP far more sparingly. */
export const XP_UNIT_AS_COMBAT_MINUTES = 2.82;

/**
 * No single answer may pay more than this many minutes of fighting.
 *
 * A backstop, not a balance lever. Everything above is already anchored,
 * but the failure that started this was silent and enormous, and a cap
 * turns the next one into something a player merely notices rather than
 * something that ruins the save.
 */
export const MAX_PAYOUT_COMBAT_MINUTES = 30;

// The game's own kill cadence: 2.6s swings, four to six of them, plus the
// 1.2s respawn. Twelve seconds door to door for on-level content.
const KILL_SECS = 12;
const XP_PER_DAMAGE = 4 + 1.33;      // style XP plus hitpoints XP, per point dealt

const FARMABLE = ZONES
  .flatMap(z => (z.monsters || []).map(m => ({ ...m, era: z.era || 1 })))
  .filter(m => !m.boss)
  .sort((a, b) => a.level - b.level);

/**
 * Gold and XP per minute from fighting the hardest thing you can hold at
 * this combat level. Above the top of the table — which Era II reaches,
 * since the ceiling moves to 199 and the monsters do not — it extends at
 * a gentle 2% a level rather than stopping dead.
 */
export function combatIncome(combatLevel = 1, era = 1) {
  const open = FARMABLE.filter(m => m.level <= combatLevel && m.era <= era);
  const m = open[open.length - 1] || FARMABLE[0];
  const over = Math.max(0, combatLevel - m.level);
  const drift = Math.pow(1.02, Math.min(over, 100));
  const perKill = (m.gold[0] + m.gold[1]) / 2;
  const kpm = 60 / KILL_SECS;
  return {
    gold: perKill * kpm * drift,
    xp: m.hp * XP_PER_DAMAGE * kpm * drift,
  };
}

/**
 * A "unit" of gold reward. `gold: 3` is a few minutes of fighting;
 * `gold: 16` is a notable quarter of an hour.
 */
export function rewardUnit(combatLevel = 1, ascensions = 0, era = 1) {
  return Math.round(combatIncome(combatLevel, era).gold
    * UNIT_AS_COMBAT_MINUTES * (1 + ascensions * 0.06));
}

export function xpUnit(combatLevel = 1, era = 1) {
  return Math.round(combatIncome(combatLevel, era).xp * XP_UNIT_AS_COMBAT_MINUTES);
}

/** The backstop, in gold, for this player. */
export function maxPayout(combatLevel = 1, era = 1) {
  return Math.round(combatIncome(combatLevel, era).gold * MAX_PAYOUT_COMBAT_MINUTES);
}

// ============================================================
// THE CHAINS
//
// `beats.start` is always the opening. Options carry `next`, naming the
// beat they lead to; `next: null` ends the chain there.
//
// An option may be `risky`, in which case it has `good` and `bad`
// outcomes and a `chance`. That is the hook the Wanderer's luck pulls on
// — and the reason a brave option can stay genuinely brave rather than
// being the correct answer with extra words.
// ============================================================

export const CHAINS = [
  // ------------------------------------------------------------
  {
    id: 'verge', title: 'The Old Woman on the Verge', icon: '👵', weight: 12,
    beats: {
      start: {
        text: `An old woman is sitting on a milestone with a basket beside her and one
               shoe off. She has been there a while — the grass around the stone is
               flattened in a wide, patient circle.<br><br>
               "I'm not stuck," she says, before you have asked. "I'm deciding."`,
        options: [
          { id: 'sit', label: 'Sit down and wait with her', icon: '🪨',
            desc: 'You are not in a hurry. You are never in a hurry; that is the whole point of the road.',
            outcome: `You sit. She does not explain. After a while she puts the shoe back on,
                      and after a while longer she says: "Right." You have lost forty minutes and
                      learned three things about a bridge you have not reached yet.`,
            effects: { xp: { thieving: 2 } }, next: 'walked' },
          { id: 'carry', label: 'Offer to carry the basket', icon: '🧺',
            desc: 'It is not heavy. That is what makes it strange.',
            outcome: `She lets you. The basket weighs nothing at all and something in it
                      shifts when you turn corners.`,
            effects: { xp: { woodcutting: 1 } }, next: 'carried' },
        ],
      },
      walked: {
        text: `You walk together for an hour. She names every field you pass and none of
               the names are on Quill's map. At a fork she stops.<br><br>
               "That way's shorter," she says, pointing left. "That way's mine," pointing right.`,
        options: [
          { id: 'short', label: 'Take the short way', icon: '➡️',
            desc: 'You have things to be doing.',
            outcome: `It is shorter. It is so much shorter that you arrive before you set off,
                      which you decide not to examine. There is a purse in the ditch.`,
            effects: { gold: 4 }, next: 'short_end' },
          { id: 'hers', label: 'Take hers', icon: '⬅️',
            desc: 'She has been walking it longer than you have been alive.',
            outcome: `Her way goes past a hedge with a gate in it and the gate has been
                      recently oiled. She does not remark on this. You do not ask.`,
            effects: { xp: { thieving: 3 } }, next: 'hers_end' },
        ],
      },
      carried: {
        text: `Two miles on, a man steps out of the hedge and looks at the basket rather
               than at either of you.<br><br>
               "That's not hers," he says.`,
        options: [
          { id: 'hand', label: 'Hand it over', icon: '🤲',
            desc: 'It was never yours and you do not want the argument.',
            outcome: `He takes it, opens it, looks inside for a long moment, and gives it
                      straight back. "Sorry," he says. "Wrong basket." He is crying.`,
            effects: { gold: 2 }, next: 'hand_end' },
          { id: 'keep', label: 'Keep hold of it', icon: '✊',
            desc: 'She asked you to carry it. That is the whole of your job.',
            risky: {
              chance: 0.6,
              good: { text: `He looks at you, then at her, then steps back into the hedge.
                             She says nothing for a mile and then gives you something from the basket.`,
                      effects: { gold: 5, items: { rune_shard: 2 } } },
              bad: { text: `He does not fight you so much as lean on you, heavily, for
                            some time. You keep the basket. You will be feeling that shoulder tomorrow.`,
                     effects: { hp: -0.18, gold: 2 } },
            }, next: 'keep_end' },
        ],
      },
      short_end: {
        text: `At the village end of the short way there is a woman who looks very much
               like the one you left at the fork, sitting on a milestone with one shoe off.<br><br>
               "You took the short way," she says. It is not a question.`,
        options: [
          { id: 'admit', label: 'Say yes', icon: '💬',
            desc: 'There is not much else to say.',
            outcome: `"Everyone does," she says, and sounds neither disappointed nor
                      surprised, which is worse. She gives you a coin with no face on it.`,
            effects: { gold: 3, flag: 'verge_short' }, next: null },
          { id: 'ask', label: 'Ask how she got here first', icon: '❓',
            desc: 'You would quite like to know.',
            outcome: `"I didn't," she says. "I'm still back there deciding. This is the
                      other end of it." She waves vaguely at the road. You stop asking.`,
            effects: { xp: { runecrafting: 4 }, flag: 'verge_short' }, next: null },
        ],
      },
      hers_end: {
        text: `Her way ends at a cottage that is a very good cottage and slightly too
               new. She puts the kettle on and does not ask you to stay.`,
        options: [
          { id: 'stay', label: 'Stay for the tea', icon: '🍵',
            desc: 'You have nowhere to be that is more important than this.',
            outcome: `The tea is extraordinary. She tells you which of the nine roads
                      actually goes somewhere. You are fairly sure you will remember.`,
            effects: { gold: 3, xp: { alchemy: 5 }, flag: 'verge_friend' }, next: null },
          { id: 'go', label: 'Take your leave', icon: '🚪',
            desc: 'She did not ask you to stay, after all.',
            outcome: `At the gate she presses something into your hand without turning
                      round. It is warm and it is still warm an hour later.`,
            effects: { items: { rune_shard: 3 }, gold: 2, flag: 'verge_friend' }, next: null },
        ],
      },
      hand_end: {
        text: `The man walks with you both as far as the crossroads and does not speak.
               At the stone he stops.<br><br>
               "You'll do," he says, to you specifically.`,
        options: [
          { id: 'what', label: '"For what?"', icon: '❓',
            desc: 'It seems worth establishing.',
            outcome: `He does not answer. He gives you a bundle of rags that turns out to
                      contain a very good knife, and leaves. She says he was always like that.`,
            effects: { gold: 4, items: { rune_shard: 1 }, flag: 'verge_kind' }, next: null },
          { id: 'nod', label: 'Nod and keep walking', icon: '👍',
            desc: 'You have been told worse things by stranger people.',
            outcome: `He is gone by the next bend. The old woman says nothing about it
                      until you part, and then only: "He hasn't said that to anyone in years."`,
            effects: { gold: 3, xp: { defense: 3 }, flag: 'verge_kind' }, next: null },
        ],
      },
      keep_end: {
        text: `She takes the basket back at the village edge and looks inside it for the
               first time all day.<br><br>
               "Ah," she says. "Well. That's a shame."`,
        options: [
          { id: 'look', label: 'Look inside', icon: '👀',
            desc: 'You have carried it eleven miles. You have earned a look.',
            outcome: `It is empty, and it is deeper than the basket. She closes the lid
                      gently, the way you would close a door on someone sleeping.`,
            effects: { xp: { runecrafting: 6 }, flag: 'verge_basket' }, next: null },
          { id: 'dont', label: "Don't look", icon: '🙈',
            desc: 'Some things you carry, and some things you carry and do not open.',
            outcome: `"Good," she says, with real feeling. She pays you properly, in coin,
                      and the coins are all from different years and none of them are this one.`,
            effects: { gold: 7, flag: 'verge_basket' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'bridge', title: 'The Toll', icon: '🌉', weight: 11,
    beats: {
      start: {
        text: `The bridge is fine. The bridge is in excellent repair. The problem is the
               table set up at the near end of it, and the ledger on the table, and the
               young man behind the ledger who has clearly been practising his opening line.<br><br>
               "Toll," he says. "For the upkeep."`,
        options: [
          { id: 'pay', label: 'Pay it', icon: '🪙',
            desc: 'It is not very much and you would like to cross the bridge.',
            outcome: `He writes your name in the ledger with enormous care and gives you
                      a receipt. It is the only receipt on the table. You are the first.`,
            effects: { gold: -2 }, next: 'paid' },
          { id: 'ford', label: 'Ford the river instead', icon: '💧',
            desc: 'It is not a wide river and you are not made of paper.',
            outcome: `The water is fast and colder than the season allows and you get
                      across. On the far bank you look back. He has not moved.`,
            effects: { hp: -0.10 }, next: 'forded' },
        ],
      },
      paid: {
        text: `Halfway across, you understand what has been bothering you: there is no
               village on the other side. There is no road on the other side. The bridge
               ends in a field.<br><br>
               Behind you, the young man is watching to see what you do.`,
        options: [
          { id: 'cross', label: 'Cross anyway', icon: '➡️',
            desc: 'You paid.',
            outcome: `You step off into the field and the field is somebody's back garden,
                      four days' walk from where you were. Your boots are dry.`,
            effects: { gold: 6, flag: 'bridge_crossed' }, next: 'field' },
          { id: 'back', label: 'Go back and ask him', icon: '↩️',
            desc: 'There is a question here and he is standing next to it.',
            outcome: `"I know," he says, before you speak. "I've been asking for two years."
                      He shows you the ledger. Every page is blank except yours.`,
            effects: { xp: { runecrafting: 5 } }, next: 'ledger' },
        ],
      },
      forded: {
        text: `On the far bank there is a second table, a second ledger, and a woman who
               looks exactly as practised as the young man did.<br><br>
               "Toll," she says. "For the ford."`,
        options: [
          { id: 'argue', label: 'Point out there is no ford', icon: '🗣️',
            desc: 'You swam. There was nothing to maintain.',
            outcome: `She looks at the river for a long moment. "No," she agrees. "There
                      isn't." She crosses something out and looks smaller.`,
            effects: { gold: 1 }, next: 'ledger' },
          { id: 'paytoo', label: 'Pay her too', icon: '🪙',
            desc: 'She is out here in the cold with a table.',
            outcome: `She is so surprised she gives you change, and then more than change,
                      and then something out of her own pocket that she does not explain.`,
            effects: { gold: 4, items: { rune_shard: 2 }, flag: 'bridge_kind' }, next: 'field' },
        ],
      },
      field: {
        text: `The field has one tree in it and the tree has a door in it. Not a hollow —
               a door, with hinges, at the wrong height.`,
        options: [
          { id: 'knock', label: 'Knock', icon: '✊',
            desc: 'It is a door. That is what they are for.',
            risky: {
              chance: 0.55,
              good: { text: `Somebody answers. You cannot afterwards describe them, but they
                             are pleased to see you and they send you off with your arms full.`,
                      effects: { gold: 9, items: { rune_shard: 3, herb_mooncap: 4 } } },
              bad: { text: `The door opens onto the inside of the tree, which is the inside
                            of a tree. Something in there is very annoyed about being knocked on.`,
                     effects: { hp: -0.22, gold: 3 } },
            }, next: null, flag: 'bridge_door' },
          { id: 'note', label: 'Leave a note and go', icon: '📝',
            desc: 'You have manners.',
            outcome: `You write your name on a leaf and wedge it in the frame. Weeks later
                      a parcel arrives in Hearthwick addressed to you in your own handwriting.`,
            effects: { gold: 5, items: { rune_shard: 2 }, flag: 'bridge_door' }, next: null },
        ],
      },
      ledger: {
        text: `The ledger is the interesting thing. It is ruled for a hundred columns and
               only three are labelled, and one of the labels is your name, and it was
               written before you arrived.`,
        options: [
          { id: 'sign', label: 'Sign the other two columns', icon: '✍️',
            desc: 'Somebody is going to.',
            outcome: `You put your name in both. Nothing happens, which is the most
                      alarming outcome available and you know it.`,
            effects: { gold: 4, xp: { runecrafting: 8 }, flag: 'bridge_signed' }, next: null },
          { id: 'tear', label: 'Tear out the page', icon: '📄',
            desc: 'You are not in a ledger. You have made a decision about that.',
            outcome: `The page comes away cleanly. The next page down has the same three
                      labels on it. You do not turn any more pages. You keep the one you took.`,
            effects: { gold: 6, items: { rune_shard: 2 }, flag: 'bridge_torn' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'cart', title: 'The Overturned Cart', icon: '🛒', weight: 12,
    beats: {
      start: {
        text: `A cart is on its side across the road with one wheel still turning, which
               means it happened in the last few minutes, which means whoever did it is
               probably still nearby.<br><br>
               There is nobody nearby. There are no tracks. The wheel is still turning.`,
        options: [
          { id: 'right', label: 'Set it upright', icon: '💪',
            desc: 'Somebody is going to need this cart.',
            outcome: `It is heavier than it looks and it comes up with a groan that goes on
                      slightly too long. Underneath, the road is scored in four deep lines.`,
            effects: { xp: { strength: 4 } }, next: 'righted' },
          { id: 'search', label: 'Go through it', icon: '🔍',
            desc: 'Nobody is here. Something is wrong. You are not above being practical.',
            outcome: `Half of it is turnips. The other half is packed in straw with the care
                      of somebody who expected to be paid a great deal.`,
            effects: { gold: 4, items: { root_veg: 6 } }, next: 'searched' },
        ],
      },
      righted: {
        text: `The carter comes back up the road at a run, sees the cart standing, and
               stops dead.<br><br>
               "Where is it," he says. Not to you. To the cart.`,
        options: [
          { id: 'ask', label: 'Ask what he lost', icon: '❓',
            desc: 'It seems relevant.',
            outcome: `"Nothing," he says, in the voice of a man who has lost something.
                      He pays you for the lift and does not meet your eye.`,
            effects: { gold: 5 }, next: 'carter' },
          { id: 'look', label: 'Look at the marks in the road', icon: '👣',
            desc: 'Four deep lines. Something stood here.',
            outcome: `You get down and look properly. They are not claw marks. They are
                      the legs of a very large table. The carter watches you work it out.`,
            effects: { xp: { mining: 5 } }, next: 'marks' },
        ],
      },
      searched: {
        text: `The straw is packed around something in a crate the size of a bread oven,
               and the crate has a reference number stencilled on the lid, and the
               reference number has your name in it.`,
        options: [
          { id: 'open', label: 'Open the crate', icon: '📦',
            desc: 'It has your name on it.',
            risky: {
              chance: 0.5,
              good: { text: `It is full of your things. Things you lost cycles ago. A cup you
                             broke. All of it in perfect condition and none of it recently made.`,
                      effects: { gold: 8, items: { rune_shard: 3 }, flag: 'cart_crate' } },
              bad: { text: `It is full of straw, and under the straw there is another crate,
                            and you get three crates in before you stop and put the lid back on.`,
                     effects: { xp: { runecrafting: 6 }, hp: -0.08, flag: 'cart_crate' } },
            }, next: null },
          { id: 'leave', label: 'Put the straw back', icon: '🌾',
            desc: 'That is not for you. Whatever it is, and however your name got on it.',
            outcome: `You repack it exactly as you found it. Three days later a carter you
                      do not know stops you in the street to shake your hand.`,
            effects: { gold: 6, flag: 'cart_honest' }, next: null },
        ],
      },
      carter: {
        text: `He gives you a lift as far as the crossroads and talks the whole way about
               his route, which he has driven for eleven years, and which he describes in
               an order that does not work.`,
        options: [
          { id: 'correct', label: 'Point out the route is impossible', icon: '🗺️',
            desc: 'You have walked most of it. It does not join up.',
            outcome: `He stops the cart. He thinks. Then he laughs, once, without any
                      humour in it at all, and drives on and does not speak again.`,
            effects: { gold: 3, xp: { thieving: 4 }, flag: 'cart_route' }, next: null },
          { id: 'listen', label: 'Just listen', icon: '👂',
            desc: 'He is having a nice time and you are getting a lift.',
            outcome: `By the crossroads he has told you where three things are buried and
                      does not appear to know he has done it.`,
            effects: { gold: 5, items: { rune_shard: 2 }, flag: 'cart_route' }, next: null },
        ],
      },
      marks: {
        text: `"They set the table up in the road," the carter says, still not looking at
               you. "Middle of the road. And they get out the form."<br><br>
               He has stopped pretending it was nothing.`,
        options: [
          { id: 'help', label: 'Offer to walk with him', icon: '🤝',
            desc: 'It is the same road you are on.',
            outcome: `He does not say thank you. He gives you the good half of his lunch
                      and spends the whole afternoon looking at the treeline instead of you.`,
            effects: { gold: 4, xp: { defense: 4 }, flag: 'cart_syndicate' }, next: null },
          { id: 'warn', label: 'Tell him to change his route', icon: '⚠️',
            desc: 'They will be back. They are always back.',
            outcome: `"Can't," he says. "Only one road." And then, after a while: "You've
                      noticed that too, then." It is the first time all day he looks at you.`,
            effects: { gold: 3, xp: { runecrafting: 7 }, flag: 'cart_syndicate' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'dog', title: 'A Dog With A Job', icon: '🐕', weight: 11,
    beats: {
      start: {
        text: `A dog is sitting in the middle of the road with a satchel buckled across its
               back and an expression of enormous professional seriousness.<br><br>
               It will not let you past on the left. It will let you past on the right.`,
        options: [
          { id: 'right', label: 'Go past on the right', icon: '➡️',
            desc: 'It has clearly thought about this.',
            outcome: `You go right. The dog watches you all the way and then resumes
                      watching the left side of the road, which is empty.`,
            effects: { xp: { thieving: 2 } }, next: 'obeyed' },
          { id: 'satchel', label: 'Look in the satchel', icon: '🎒',
            desc: 'Somebody sent it somewhere. It would be good to know where.',
            outcome: `It permits this with immense dignity. Inside: a folded paper, a
                      biscuit, and a second, smaller dog collar with no dog attached.`,
            effects: { items: { bread: 2 } }, next: 'satchel' },
        ],
      },
      obeyed: {
        text: `Half a mile on you look back. The dog is still there. Something on the left
               side of the road, about where it was guarding, has been dug up and filled in
               again, badly, and recently.`,
        options: [
          { id: 'back', label: 'Go back and dig', icon: '⛏️',
            desc: 'It went to a lot of trouble to stop you looking at that.',
            risky: {
              chance: 0.5,
              good: { text: `Two feet down there is a strongbox, and the dog sits beside you the
                             whole time you are digging, and helps at the end, and looks relieved.`,
                      effects: { gold: 8, items: { strongbox_haul: 2 } } },
              bad: { text: `Two feet down there is a second dog collar. Three feet down there is
                            a third. You stop digging. The dog does not stop watching.`,
                     effects: { xp: { mining: 6 }, hp: -0.06 } },
            }, next: null },
          { id: 'on', label: 'Keep walking', icon: '🚶',
            desc: 'It asked you nicely. It is the only thing today that has.',
            outcome: `You keep going. At the next village the dog is somehow already there,
                      sitting outside the inn, off duty, and enormously pleased to see you.`,
            effects: { gold: 5, flag: 'dog_trusted' }, next: null },
        ],
      },
      satchel: {
        text: `The folded paper is a delivery docket. The destination is a farm you know
               is not there any more. The date on it is next Tuesday.`,
        options: [
          { id: 'take', label: 'Take it where it says', icon: '🗺️',
            desc: 'It is a job. Somebody gave a dog a job.',
            outcome: `You walk it out to where the farm was. There is a farm there. It is
                      Tuesday. Nobody at the farm finds any of this remarkable.`,
            effects: { gold: 9, xp: { runecrafting: 6 }, flag: 'dog_delivered' }, next: null },
          { id: 'biscuit', label: 'Give it the biscuit', icon: '🍪',
            desc: 'It has been out here a long time.',
            outcome: `It eats the biscuit with great care, and then walks with you for the
                      rest of the day, and at dusk goes back to the same spot in the road.`,
            effects: { gold: 4, pet_xp: 40, flag: 'dog_fed' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'inn', title: 'The Inn That Is Too Full', icon: '🏚️', weight: 10,
    beats: {
      start: {
        text: `The inn has nine rooms and the innkeeper says all nine are taken. There are
               no horses in the yard. There is no noise from upstairs. There is one bowl
               drying by the sink.<br><br>
               "Full," she says again, and looks past you at the door.`,
        options: [
          { id: 'accept', label: 'Take the stable instead', icon: '🐴',
            desc: 'It is dry, and you have slept in worse.',
            outcome: `The stable is clean and there is a blanket already laid out, folded,
                      the way you fold one. You sleep extremely well.`,
            effects: { hp: 0.3, xp: { defense: 3 } }, next: 'stable' },
          { id: 'push', label: 'Ask who is in the nine rooms', icon: '🗝️',
            desc: 'There is nobody in the nine rooms.',
            outcome: `She does not answer. She writes something in a book and turns the book
                      around so you can read it. It is a list of nine names. One is yours.`,
            effects: { xp: { runecrafting: 5 } }, next: 'names' },
        ],
      },
      stable: {
        text: `In the night something comes into the yard, walks the length of it, and
               leaves. In the morning there are nine sets of boots outside nine doors, and
               all nine pairs are the same size, and all nine are yours.`,
        options: [
          { id: 'takepair', label: 'Take a pair', icon: '🥾',
            desc: 'Yours are worn through and there are nine.',
            outcome: `They fit, obviously. They are broken in exactly where yours are.
                      You walk the rest of the week without a blister for the first time in a year.`,
            effects: { gold: 4, items: { rune_shard: 2 }, flag: 'inn_boots' }, next: null },
          { id: 'nonepair', label: 'Leave them all', icon: '🚪',
            desc: 'You have a pair of boots. You know where they came from.',
            outcome: `The innkeeper is watching from the window and something in her face
                      lets go. She refuses payment and puts food in your bag when you are not looking.`,
            effects: { gold: 6, items: { root_stew: 3 }, flag: 'inn_declined' }, next: null },
        ],
      },
      names: {
        text: `"They check in," she says. "They never check out. I keep the rooms because
               what else would I do with them."<br><br>
               She slides the key to room nine across the counter.`,
        options: [
          { id: 'open', label: 'Open room nine', icon: '🔑',
            desc: 'Your name is on the list.',
            risky: {
              chance: 0.55,
              good: { text: `It is a room. A perfectly ordinary room with your bag in it, packed
                             the way you pack, and a note in your handwriting that says GO HOME.`,
                      effects: { gold: 10, items: { rune_shard: 3 }, xp: { runecrafting: 8 } } },
              bad: { text: `It is a room and somebody is in the bed and you close the door
                            before you see anything else and you do not sleep that night at all.`,
                     effects: { hp: -0.2, xp: { runecrafting: 10 } } },
            }, next: null, flag: 'inn_nine' },
          { id: 'give', label: 'Give the key back', icon: '🤲',
            desc: 'Whatever is in room nine has been left alone this long for a reason.',
            outcome: `She takes it with obvious relief and hangs it back on the hook, which
                      already has a key on it. She pours you something strong and joins you.`,
            effects: { gold: 5, xp: { alchemy: 6 }, flag: 'inn_kind' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'child', title: 'The Child With The Map', icon: '🧒', weight: 10,
    beats: {
      start: {
        text: `A child of about nine is standing at the crossroads with a map, holding it
               the right way up, which is unusual, and reading it correctly, which is worse.<br><br>
               "You're late," they say.`,
        options: [
          { id: 'play', label: 'Play along', icon: '🙂',
            desc: 'Ask what you are late for.',
            outcome: `"The bit where you turn up," they say, folding the map. "That's all
                      it says. You turn up." They set off north and expect you to follow.`,
            effects: { xp: { thieving: 3 } }, next: 'north' },
          { id: 'map', label: 'Ask to see the map', icon: '🗺️',
            desc: 'You want to know where a child got a map like that.',
            outcome: `It is Quill's survey. It is Quill's survey with three roads on it that
                      Quill has never drawn, in Quill's hand, on paper that is forty years old.`,
            effects: { xp: { runecrafting: 6 } }, next: 'survey' },
        ],
      },
      north: {
        text: `North is a hill with nothing on it. The child sits down on the top and waits,
               and after a while a wind comes up that is warm and smells of a kitchen.`,
        options: [
          { id: 'wait', label: 'Wait with them', icon: '⏳',
            desc: 'You said you would turn up. You have turned up.',
            outcome: `Nothing else happens. At dusk they say "there" with enormous
                      satisfaction, and go home, and you find a coin in each pocket you did not have.`,
            effects: { gold: 7, flag: 'child_waited' }, next: null },
          { id: 'ask', label: 'Ask what you are waiting for', icon: '❓',
            desc: 'The hill is empty. The wind smells of somebody\'s dinner.',
            outcome: `"For it to be the same as last time," they say. And then, worried:
                      "It's the same as last time, isn't it?" You tell them it is. They relax.`,
            effects: { gold: 4, xp: { runecrafting: 9 }, flag: 'child_lied' }, next: null },
        ],
      },
      survey: {
        text: `"She gave it me," the child says, when you ask. "The old lady. Said I'd know
               when." They look at you very seriously. "I know when."`,
        options: [
          { id: 'keep', label: 'Let them keep it', icon: '🤝',
            desc: 'It was given to them, not to you.',
            outcome: `They fold it away, satisfied. Weeks later a copy of the same map turns
                      up under your door with the three extra roads inked in and no note.`,
            effects: { gold: 6, items: { rune_shard: 2 }, flag: 'child_map' }, next: null },
          { id: 'copy', label: 'Copy the three roads', icon: '✍️',
            desc: 'You will never find them again otherwise.',
            outcome: `You draw them out on the back of a receipt. Two of them turn out to be
                      real. You have not yet been brave enough to walk the third.`,
            effects: { gold: 4, xp: { runecrafting: 12 }, flag: 'child_copy' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'rain', title: 'The Rain That Is On Time', icon: '🌧️', weight: 9,
    beats: {
      start: {
        text: `It begins raining at exactly the moment you cross the parish stone, and it
               is very fine rain, and it is falling in straight lines with no wind in it at all.<br><br>
               A hundred yards ahead, the road is dry.`,
        options: [
          { id: 'through', label: 'Walk on through it', icon: '🚶',
            desc: 'It is only rain, and rain has never asked you anything.',
            outcome: `You cross into the dry and your clothes are dry too, immediately, as
                      though the rain has been recalled rather than stopped.`,
            effects: { xp: { runecrafting: 4 } }, next: 'dry' },
          { id: 'stand', label: 'Stand in it and count', icon: '🔢',
            desc: 'Forty minutes of drizzle, twelve of sun. Everybody knows the schedule.',
            outcome: `Forty minutes exactly. You have never actually tested it before.
                      Ferrin has, once, and has not been the same about weather since.`,
            effects: { xp: { alchemy: 5 } }, next: 'counted' },
        ],
      },
      dry: {
        text: `On the dry road there is a man sitting under an open umbrella in bright
               sunshine, entirely soaked, with his boots off.<br><br>
               "It'll come back round," he says.`,
        options: [
          { id: 'sit', label: 'Sit under the umbrella', icon: '☂️',
            desc: 'He has clearly done this before.',
            outcome: `Twelve minutes later it rains on the two of you and nowhere else.
                      He is delighted. He gives you the umbrella and will not be argued with.`,
            effects: { gold: 5, items: { rune_shard: 1 }, flag: 'rain_umbrella' }, next: null },
          { id: 'warn', label: 'Tell him it is behind him', icon: '👉',
            desc: 'The wet edge is moving up the road as you speak.',
            outcome: `"I know," he says, without turning. "I'm not running from it. I've
                      tried that." He is still sitting there when you look back from the ridge.`,
            effects: { gold: 3, xp: { defense: 5 }, flag: 'rain_sat' }, next: null },
        ],
      },
      counted: {
        text: `At forty minutes the rain stops mid-drop. Not tapers — stops, with the drops
               still in the air for a fraction of a second before they finish falling.<br><br>
               You are fairly sure you saw that.`,
        options: [
          { id: 'again', label: 'Wait and watch it start again', icon: '👁️',
            desc: 'Twelve minutes. You can spare twelve minutes.',
            risky: {
              chance: 0.6,
              good: { text: `It starts exactly on time and you see it: the drops arrive already
                             falling, from a height of about eight feet, out of nothing.`,
                      effects: { xp: { runecrafting: 14 }, gold: 4, items: { rune_shard: 2 } } },
              bad: { text: `It does not start. It is fourteen minutes late and you spend all
                            fourteen of them becoming certain that something is looking for the fault.`,
                     effects: { hp: -0.05, xp: { runecrafting: 8 } } },
            }, next: null, flag: 'rain_watched' },
          { id: 'go', label: 'Stop looking at it', icon: '🙈',
            desc: 'There are things you can decide not to have noticed.',
            outcome: `You walk on. It rains for exactly forty minutes at exactly the right
                      time for the rest of your life and you never check again.`,
            effects: { gold: 5, xp: { farming: 8 }, flag: 'rain_ignored' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'debt', title: 'A Man Who Owes You', icon: '🪙', weight: 10,
    beats: {
      start: {
        text: `A man on the road stops dead when he sees you, goes pale, and starts
               apologising before you have said anything at all.<br><br>
               "I'll get it," he says. "I'll get it, I swear."`,
        options: [
          { id: 'clarify', label: 'Tell him you have never met', icon: '💬',
            desc: 'Because you have never met.',
            outcome: `He stares at you. Then he laughs, and the laugh goes on too long, and
                      then he sits down in the road. "Not yet," he says. "God. Not yet."`,
            effects: { xp: { runecrafting: 6 } }, next: 'notyet' },
          { id: 'collect', label: 'Let him think you are here for it', icon: '😐',
            desc: 'He is clearly going to pay somebody.',
            outcome: `He counts it out with shaking hands and it is a great deal of money
                      and he thanks you for being reasonable about it.`,
            effects: { gold: 11 }, next: 'took' },
        ],
      },
      notyet: {
        text: `He will not say what the debt is or when it starts. He does say, eventually,
               that he has been paying it for six years and that you have never once come to
               collect, and that this is the fourth time he has seen you for the first time.`,
        options: [
          { id: 'forgive', label: 'Tell him it is settled', icon: '🕊️',
            desc: 'Whatever it is. Whoever it was.',
            outcome: `He does not believe you, and then he does, and it takes some time.
                      He gives you his cart, which you refuse, and his lunch, which you do not.`,
            effects: { gold: 5, items: { root_stew: 2 }, flag: 'debt_forgiven' }, next: null },
          { id: 'learn', label: 'Ask what you did the other three times', icon: '❓',
            desc: 'There is information here and it is about you.',
            outcome: `"Took it," he says. "Every time. Same face. Same coat." He looks at
                      your coat. You look at your coat.`,
            effects: { xp: { runecrafting: 15 }, gold: 3, flag: 'debt_asked' }, next: null },
        ],
      },
      took: {
        text: `Three days later the same man catches you up on the road, out of breath,
               with more money.<br><br>
               "You dropped this," he says, and it is not yours, and he knows it is not yours.`,
        options: [
          { id: 'refuse', label: 'Give it back', icon: '↩️',
            desc: 'You have already taken money you were not owed once this week.',
            outcome: `He will not take it. In the end you leave it on his cart while he is
                      not looking, and he leaves it on your doorstep a week later, and so on.`,
            effects: { gold: -3, flag: 'debt_returned' }, next: null },
          { id: 'take', label: 'Take it', icon: '🪙',
            desc: 'He is insisting. He is very insistent.',
            outcome: `He looks lighter walking away than he did running up. You are not sure
                      what you have just been part of. You are fairly sure it helped.`,
            effects: { gold: 9, flag: 'debt_took' }, next: null },
        ],
      },
    },
  },


  // ------------------------------------------------------------
  // The payoff chains. These only find you because of something you
  // already did, which is the entire argument for building a chain system
  // instead of a random event table.
  // ------------------------------------------------------------
  {
    id: 'returned', title: 'Somebody Remembers You', icon: '🫂', weight: 14,
    when: { flag: 'verge_friend' },
    beats: {
      start: {
        text: `A woman flags you down on the road with both arms, the way you flag down
               somebody you know.<br><br>
               "You had tea with my grandmother," she says. "She talks about it. She talks
               about very little else and she is ninety-one."`,
        options: [
          { id: 'visit', label: 'Go and see her', icon: '🏠',
            desc: 'You did have tea with her. It was a good afternoon.',
            outcome: `The cottage is where it was and slightly newer again. She knows you
                      immediately and is not remotely surprised that you have not aged.`,
            effects: { xp: { alchemy: 8 } }, next: 'tea' },
          { id: 'sorry', label: 'Say you cannot stop', icon: '⏳',
            desc: 'There is a great deal to do and you are always doing it.',
            outcome: `The woman nods, and does not press, and you get four miles down the
                      road before you turn round, because you are not actually in a hurry and never were.`,
            effects: { xp: { defense: 4 } }, next: 'tea' },
        ],
      },
      tea: {
        text: `She has kept things for you. A drawer of them. Small objects, wrapped, each
               with a date on the paper, and the dates run back further than you have been
               coming this way.`,
        options: [
          { id: 'open', label: 'Open the oldest one', icon: '🎁',
            desc: 'You want to know how far back this goes.',
            outcome: `It is a coin with no face on it, wrapped in paper dated four cycles
                      ago, in her hand, and she was not alive four cycles ago and neither were you.`,
            effects: { gold: 8, xp: { runecrafting: 12 } }, next: 'drawer' },
          { id: 'newest', label: 'Open the newest one', icon: '📦',
            desc: 'Start where you are.',
            outcome: `It is a key. She does not know what it opens. She says she woke up
                      one morning having wrapped it, and that this happens, and that she has stopped minding.`,
            effects: { items: { rune_shard: 3 }, gold: 5 }, next: 'drawer' },
        ],
      },
      drawer: {
        text: `"You'll come back," she says at the gate, and it is not hopeful, it is
               logistical. "You always do. I'll keep the drawer."`,
        options: [
          { id: 'promise', label: 'Promise to come back', icon: '🤝',
            desc: 'You mean it when you say it.',
            outcome: `She pats your arm. Every time you pass that way afterwards the drawer
                      has one more thing in it, and the paper is always dated the day you arrive.`,
            effects: { gold: 12, items: { rune_shard: 4 }, flag: 'returned_promise' }, next: null },
          { id: 'honest', label: 'Tell her you might not', icon: '💬',
            desc: 'You have no idea what happens to any of this when you Ascend.',
            outcome: `"I know," she says. "That's why I keep the drawer." She goes back
                      inside before you can answer, which you notice is a kindness.`,
            effects: { gold: 9, xp: { runecrafting: 16 }, flag: 'returned_honest' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'collector', title: 'The Collector at the Gate', icon: '📄', weight: 12,
    when: { flag: 'bridge_signed' },
    beats: {
      start: {
        text: `There is a man at the town gate with a folding table and a ledger ruled for
               a hundred columns, and two of the columns are filled in, and both of them are
               in your handwriting.<br><br>
               "There you are," he says.`,
        options: [
          { id: 'own', label: 'Admit it was you', icon: '✍️',
            desc: 'It was you. You signed both.',
            outcome: `He is so relieved he has to sit down. "Nobody's ever owned up. Do you
                      know what happens to the ones that go unclaimed?" You do not. He tells you.`,
            effects: { xp: { runecrafting: 10 } }, next: 'owned' },
          { id: 'deny', label: 'Deny everything', icon: '🙅',
            desc: 'There is a version of this where you were never at that bridge.',
            outcome: `He accepts it instantly and crosses both lines out, and looks
                      immediately much worse, and you understand that you have just moved a
                      problem from your column to his.`,
            effects: { gold: 6 }, next: 'denied' },
        ],
      },
      owned: {
        text: `What happens to the unclaimed ones, apparently, is that they are assigned.
               He shows you the assignment list. It is short and it is all the same name and
               the name is not one you know.`,
        options: [
          { id: 'name', label: 'Ask who that is', icon: '❓',
            desc: 'Somebody has been carrying a hundred columns of other people\'s ledger.',
            outcome: `"Whoever's nearest," he says. "It just picks. It's been picking the
                      same person for a long time and I don't think they know."`,
            effects: { gold: 7, xp: { runecrafting: 14 }, flag: 'collector_name' }, next: null },
          { id: 'take', label: 'Ask to be assigned the rest', icon: '📓',
            desc: 'A hundred columns. Somebody is carrying them anyway.',
            risky: {
              chance: 0.45,
              good: { text: `He signs them over with enormous ceremony. Nothing bad happens.
                             Things start going slightly, consistently, inexplicably well for you.`,
                      effects: { gold: 16, items: { rune_shard: 4 }, xp: { runecrafting: 18 } } },
              bad: { text: `He signs them over. That night you dream of a table in the middle
                            of a road and in the morning your hands ache as though you have been writing.`,
                     effects: { hp: -0.15, gold: 8, xp: { runecrafting: 20 } } },
            }, next: null, flag: 'collector_took' },
        ],
      },
      denied: {
        text: `He is still at the gate a week later. He has not eaten. The ledger has three
               more filled columns and none of them are in his hand.`,
        options: [
          { id: 'confess', label: 'Come back and confess', icon: '🕊️',
            desc: 'You did this to him.',
            outcome: `He puts the pen down. He goes home. He has a home, it turns out, and
                      people in it, and they had assumed the worst. You are thanked at length.`,
            effects: { gold: 10, xp: { defense: 8 }, flag: 'collector_confessed' }, next: null },
          { id: 'help', label: 'Sit down and help him fill it', icon: '🖋️',
            desc: 'A hundred columns is faster with two.',
            outcome: `It takes eleven hours. At the end the ledger is full and it closes
                      itself and neither of you says anything about that at all.`,
            effects: { gold: 13, items: { rune_shard: 3 }, flag: 'collector_helped' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'edge', title: 'The Edge of the Field', icon: '🌫️', weight: 8,
    when: { charLevel: 25 },
    beats: {
      start: {
        text: `East, past everything, the same field repeats. You have known this for a
               while. What is new is that today there is a fence post in it, one post,
               freshly driven, and the ground around it is disturbed.<br><br>
               Somebody has been out here measuring.`,
        options: [
          { id: 'follow', label: 'Look for the next post', icon: '📏',
            desc: 'Nobody drives one post.',
            outcome: `There is a next post, and a next, running dead straight into the
                      repeat, and each one is slightly less well made than the one before it.`,
            effects: { xp: { mining: 6 } }, next: 'posts' },
          { id: 'pull', label: 'Pull it up', icon: '💪',
            desc: 'Whoever put it there did not ask anybody.',
            outcome: `It comes up easily. The hole under it does not go into soil. You put
                      the post back and stand on it for a while.`,
            effects: { xp: { runecrafting: 10 }, hp: -0.05 }, next: 'hole' },
        ],
      },
      posts: {
        text: `The eleventh post is not a post, it is a walking stick driven into the
               ground, and after that there are no more, and there is a coat.`,
        options: [
          { id: 'coat', label: 'Take the coat', icon: '🧥',
            desc: 'It is a good coat and it is not doing anybody any good out here.',
            outcome: `It fits. Of course it fits. There is a folded survey in the inside
                      pocket with three roads on it that Quill has never drawn.`,
            effects: { gold: 9, items: { rune_shard: 3 }, flag: 'edge_coat' }, next: null },
          { id: 'leave', label: 'Leave it and mark the spot', icon: '🪦',
            desc: 'Somebody stopped here.',
            outcome: `You build a small cairn. Every time you come back east the cairn is
                      bigger, and you have never once seen anybody else out here.`,
            effects: { gold: 6, xp: { mining: 12 }, flag: 'edge_cairn' }, next: null },
        ],
      },
      hole: {
        text: `You keep standing on the post. After a while you accept that you are
               standing on it to keep it in the ground, and that you have decided the hole
               should stay shut, and that this is a strange thing to have decided.`,
        options: [
          { id: 'fill', label: 'Fill it in properly', icon: '⛏️',
            desc: 'Do the job rather than stand on it.',
            outcome: `You spend the afternoon on it. The soil you use is soil. The soil you
                      take it from is fine. You are very careful not to check the hole again.`,
            effects: { gold: 7, xp: { mining: 14 }, flag: 'edge_filled' }, next: null },
          { id: 'look', label: 'Look into it', icon: '👁️',
            desc: 'You have come a long way east not to look.',
            risky: {
              chance: 0.4,
              good: { text: `It is dark and it is not deep and at the bottom there is a
                             maintenance plate with a service interval on it. You take the plate.`,
                      effects: { gold: 14, items: { rune_shard: 4 }, xp: { runecrafting: 22 } } },
              bad: { text: `You look for slightly too long. Nothing looks back. That is not
                            the problem. The problem is how much of it there is to not look back.`,
                     effects: { hp: -0.28, xp: { runecrafting: 25 } } },
            }, next: null, flag: 'edge_looked' },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'stranger', title: 'The Stranger With Your Face', icon: '🪞', weight: 7,
    when: { charLevel: 40 },
    beats: {
      start: {
        text: `Somebody is coming the other way with your walk.<br><br>
               Not your face — the light is wrong and they are a long way off — but your
               walk, exactly, including the thing your left foot does.`,
        options: [
          { id: 'meet', label: 'Keep walking toward them', icon: '🚶',
            desc: 'It is a road. That is what roads are for.',
            outcome: `You pass within a yard. They are nothing like you at all and they nod
                      at you the way you nod at people, with the same half-second delay.`,
            effects: { xp: { runecrafting: 8 } }, next: 'passed' },
          { id: 'off', label: 'Step off the road', icon: '🌾',
            desc: 'You would rather not, on balance.',
            outcome: `You stand in the wheat and let them go by. They do not look. Twenty
                      yards on they stop, and stand, and after a while carry on.`,
            effects: { xp: { thieving: 6 } }, next: 'watched' },
        ],
      },
      passed: {
        text: `A mile later you realise you are walking differently, deliberately, to
               prove something to nobody, and that you have been doing it for a mile.`,
        options: [
          { id: 'stop', label: 'Go back and catch them up', icon: '↩️',
            desc: 'You have a question and it will not keep.',
            outcome: `They are sitting on a stile waiting for you. "Took you long enough,"
                      they say, in your voice, and hand you a folded paper, and go.`,
            effects: { gold: 12, items: { rune_shard: 4 }, flag: 'stranger_met' }, next: null },
          { id: 'walk', label: 'Walk normally and forget it', icon: '🚶',
            desc: 'It was a walk. People walk.',
            outcome: `You manage it for about a week. You are still doing it deliberately.
                      You have not been able to stop doing it deliberately since.`,
            effects: { gold: 5, xp: { runecrafting: 18 }, flag: 'stranger_ignored' }, next: null },
        ],
      },
      watched: {
        text: `From the wheat you can see where they stopped. There is something on the
               road there. They put it down carefully and did not look back at it.`,
        options: [
          { id: 'fetch', label: 'Go and see what it is', icon: '📦',
            desc: 'They left it where you would find it.',
            risky: {
              chance: 0.65,
              good: { text: `It is a bag. Your bag, packed the way you pack, with everything in
                             it you had been meaning to replace, already replaced.`,
                      effects: { gold: 15, items: { rune_shard: 5, greater_rune: 2 } } },
              bad: { text: `It is a bag with nothing in it but a note, and the note is in your
                            hand, and it says only: NOT YET. You keep it. You have kept it since.`,
                     effects: { xp: { runecrafting: 24 }, hp: -0.1 } },
            }, next: null, flag: 'stranger_bag' },
          { id: 'wide', label: 'Go round it', icon: '🌾',
            desc: 'You are already standing in a field to avoid this.',
            outcome: `You give it a wide berth. When you look back from the ridge there is
                      nothing on the road at all, and the wheat where you stood is not flattened.`,
            effects: { gold: 8, xp: { thieving: 14 }, flag: 'stranger_avoided' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'scrapline', title: 'The Line In The Grey', icon: '🕳️', weight: 11,
    when: { era: 2 },
    beats: {
      start: {
        text: `There is a queue in the Wastes. Forty people, standing in a line across the
               slab, facing a spot where there is nothing at all.<br><br>
               The person at the front has been at the front for two days.`,
        options: [
          { id: 'join', label: 'Join the back of it', icon: '🧍',
            desc: 'Forty people cannot all be wrong.',
            outcome: `Nobody speaks. The queue does not move. Somewhere in the third hour
                      you understand that nobody knows what it is for and that this is not the point.`,
            effects: { xp: { defense: 6 } }, next: 'queued' },
          { id: 'front', label: 'Walk to the front and ask', icon: '🚶',
            desc: 'Two days.',
            outcome: `"Waiting," he says. When you ask what for he says "for them to open"
                      and points at the empty air, and forty people behind him nod.`,
            effects: { xp: { runecrafting: 10 } }, next: 'front' },
        ],
      },
      queued: {
        text: `On the second day the queue moves. Everyone shuffles forward exactly one
               pace. Nothing has opened. Nothing has changed. The mood is transformed.`,
        options: [
          { id: 'stay', label: 'Stay in the queue', icon: '⏳',
            desc: 'It moved. It might move again.',
            outcome: `You are in that queue for a week. On the last day the person in front
                      turns round and gives you their place and walks off and does not explain.`,
            effects: { gold: 11, items: { orphaned_shard: 4 }, flag: 'queue_stayed' }, next: null },
          { id: 'quit', label: 'Step out', icon: '🚪',
            desc: 'You have a town to run and a floor to hold.',
            outcome: `Everyone behind you moves up one and the relief on their faces is the
                      worst thing you have seen this cycle. You take nothing from it but that.`,
            effects: { gold: 6, xp: { runecrafting: 16 }, flag: 'queue_left' }, next: null },
        ],
      },
      front: {
        text: `You look where he is pointing. There is a hairline in the air about eight
               feet up, and it is exactly the seam Quill has drawn eleven times, and it is
               two feet from the ground here rather than at the horizon.`,
        options: [
          { id: 'touch', label: 'Reach up and touch it', icon: '🤚',
            desc: 'Nobody in the queue has tried this. Nobody in the queue is going to.',
            risky: {
              chance: 0.5,
              good: { text: `It is warm and it gives, slightly, like a seam of stitching under
                             cloth. Something on the other side puts something into your hand.`,
                      effects: { gold: 18, items: { corrupt_sigil: 2, orphaned_shard: 8 } } },
              bad: { text: `It is warm and it does not give, and forty people watch you fail,
                            and then the queue closes politely around the space where you were standing.`,
                     effects: { hp: -0.24, xp: { runecrafting: 20 } } },
            }, next: null, flag: 'queue_touched' },
          { id: 'tell', label: 'Tell them it is only a seam', icon: '📣',
            desc: 'They deserve to know what they are queueing at.',
            outcome: `Half of them go home. Half of them stay, and one of them says, quite
                      reasonably, that a seam is a place where two things meet, and that this is
                      more than they had yesterday.`,
            effects: { gold: 9, items: { scrap_code: 12 }, flag: 'queue_told' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'shift', title: 'The Shift That Never Ended', icon: '🔨', weight: 10,
    when: { era: 2 },
    beats: {
      start: {
        text: `A work gang is repairing a road in the Wastes. There is no road. They are
               laying stone across bare slab, carefully, in a straight line, going nowhere,
               and the foreman has a clipboard.<br><br>
               "You're not on the sheet," she says, not unkindly.`,
        options: [
          { id: 'work', label: 'Pick up a stone anyway', icon: '🪨',
            desc: 'It is honest work and it is going somewhere eventually.',
            outcome: `They make room. Nobody asks your name. By evening you have laid two
                      hundred yards of road across nothing and you feel better than you have in a week.`,
            effects: { xp: { mining: 8, strength: 6 } }, next: 'worked' },
          { id: 'sheet', label: 'Ask to see the sheet', icon: '📋',
            desc: 'You would like to know who is on it.',
            outcome: `Forty names. All present. All accounted for. The sheet is dated and
                      the date is nine hundred years ago and the foreman has clearly read it.`,
            effects: { xp: { runecrafting: 12 } }, next: 'sheet' },
        ],
      },
      worked: {
        text: `At the end of the day they knock off, and eat, and one of them asks where
               you are from, and when you say Hearthwick she says "oh, I'm from there" and
               describes a town that has not existed for four cycles.`,
        options: [
          { id: 'gentle', label: 'Agree that it is a lovely town', icon: '🤝',
            desc: 'She is very happy talking about it.',
            outcome: `She talks for an hour. Everything she describes is right and none of
                      it is now. In the morning the gang is a hundred yards further along.`,
            effects: { gold: 10, xp: { defense: 8 }, flag: 'shift_gentle' }, next: null },
          { id: 'true', label: 'Tell her what happened to it', icon: '💬',
            desc: 'She should know. Somebody should tell her.',
            outcome: `She listens all the way through. Then she says "right" and goes back
                      to work, and works through the night, and the road is a mile longer by dawn.`,
            effects: { gold: 8, items: { glitched_ore: 6 }, flag: 'shift_told' }, next: null },
        ],
      },
      sheet: {
        text: `"I know," the foreman says. "I've known for a while. If I stop, forty people
               find out at the same time."<br><br>
               She hands you the clipboard.`,
        options: [
          { id: 'sign', label: 'Sign yourself onto the sheet', icon: '✍️',
            desc: 'Then there are forty-one, and one of them knows.',
            outcome: `She lets out a breath she has been holding for what is evidently a
                      very long time. You work that road for three days and it is the best three
                      days you have had out here.`,
            effects: { gold: 14, items: { glitched_bar: 2 }, xp: { mining: 16 }, flag: 'shift_signed' }, next: null },
          { id: 'clock', label: 'Sign them all OFF it', icon: '🖊️',
            desc: 'The shift ended nine hundred years ago. Somebody has to say so.',
            risky: {
              chance: 0.5,
              good: { text: `You rule a line under the last name and write DONE. They put the
                             stones down. They sit. Somebody laughs. Nobody disappears, and by
                             morning they have started building something of their own.`,
                      effects: { gold: 20, items: { deprecated_asset: 2, glitched_bar: 3 } } },
              bad: { text: `You rule the line. Nothing happens. They keep working. The foreman
                            looks at the sheet, and at you, and says "well" in a voice you will hear again.`,
                     effects: { hp: -0.12, gold: 7, xp: { runecrafting: 20 } } },
            }, next: null, flag: 'shift_ended' },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'well', title: 'The Well With An Opinion', icon: '🪣', weight: 10,
    beats: {
      start: {
        text: `The village well answers. Not an echo — an answer, in a different order to
               what you said, and slightly before you finish saying it.<br><br>
               The villagers draw water from it daily and have collectively decided not to
               discuss this.`,
        options: [
          { id: 'talk', label: 'Say something specific to it', icon: '💬',
            desc: 'Test whether it is listening or just early.',
            outcome: `You say your own name. It says it back with the emphasis in the place
                      your mother put it, and she has not been alive in this cycle.`,
            effects: { xp: { runecrafting: 8 } }, next: 'answered' },
          { id: 'draw', label: 'Draw a bucket like everybody else', icon: '🪣',
            desc: 'They have all decided. You can decide too.',
            outcome: `The water is good. It is the best water you have had. You understand
                      immediately why nobody discusses it.`,
            effects: { hp: 0.25, xp: { farming: 5 } }, next: 'water' },
        ],
      },
      answered: {
        text: `It will not do it twice. You say your name again and get an echo, ordinary
               and late. A woman filling a jug says, without looking up: "It only does it once."`,
        options: [
          { id: 'ask', label: 'Ask what she asked it', icon: '❓',
            desc: 'She has clearly had her turn.',
            outcome: `"Whether he'd come back," she says. "It said yes." Long pause. "It
                      didn't say when." She takes her jug and goes.`,
            effects: { gold: 6, xp: { alchemy: 6 }, flag: 'well_asked' }, next: null },
          { id: 'wish', label: 'Drop a coin in and say nothing', icon: '🪙',
            desc: 'The traditional arrangement.',
            outcome: `The coin does not land. Three days later you find it in your pocket,
                      warm, with the face worn smooth from a great deal of handling.`,
            effects: { gold: 7, items: { rune_shard: 2 }, flag: 'well_coin' }, next: null },
        ],
      },
      water: {
        text: `That night you sleep in the village and dream of the bottom of the well,
               which is dry, and has a door in it at the wrong height.`,
        options: [
          { id: 'tell', label: 'Tell them in the morning', icon: '📣',
            desc: 'They should know what is under their well.',
            outcome: `"Yes," says the headman, sadly. "Everyone dreams that. That's why we
                      don't discuss it." He gives you breakfast and does not charge you for the bed.`,
            effects: { gold: 8, items: { bread: 4 }, flag: 'well_dream' }, next: null },
          { id: 'quiet', label: 'Say nothing and move on', icon: '🚶',
            desc: 'They have arranged their lives around not knowing.',
            outcome: `You leave at dawn. Every well you pass for the next month is dry and
                      every one of them has a door in it and you have stopped looking down them.`,
            effects: { gold: 6, xp: { runecrafting: 14 }, flag: 'well_quiet' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'funeral', title: 'A Funeral For Somebody', icon: '⚱️', weight: 9,
    beats: {
      start: {
        text: `A funeral procession has stopped in the road because nobody in it can
               remember whose funeral it is.<br><br>
               They are all quite certain it is somebody's. The coffin is heavy.`,
        options: [
          { id: 'carry', label: 'Take a corner of the coffin', icon: '⚰️',
            desc: 'They have been standing here a while and it is heavy.',
            outcome: `You carry it the last mile. Nobody thanks you and everybody nods at
                      you, which in this part of the world is considerably more.`,
            effects: { xp: { strength: 6 } }, next: 'carried' },
          { id: 'ask', label: 'Ask what they do remember', icon: '❓',
            desc: 'Somebody must have started this.',
            outcome: `They remember the date. They remember the hymn. They remember that
                      the person was well liked. Every one of them says "well liked" unprompted.`,
            effects: { xp: { runecrafting: 9 } }, next: 'remembered' },
        ],
      },
      carried: {
        text: `At the graveside they realise nobody has anything to say, and they all,
               slowly, turn and look at you.`,
        options: [
          { id: 'speak', label: 'Say something', icon: '🕯️',
            desc: 'You did not know them. Nobody knew them. Somebody has to.',
            outcome: `You say they were well liked. Everybody agrees. It is the truest
                      thing said all day and you are given a very good dinner for it.`,
            effects: { gold: 9, items: { root_stew: 3 }, flag: 'funeral_spoke' }, next: null },
          { id: 'silence', label: 'Hold the silence instead', icon: '🤫',
            desc: 'Words would be worse.',
            outcome: `Nobody speaks for four minutes. It is the best funeral any of them
                      have been to and several of them tell you so afterwards, quietly.`,
            effects: { gold: 7, xp: { defense: 8 }, flag: 'funeral_silent' }, next: null },
        ],
      },
      remembered: {
        text: `You look in the parish book. There is a name, and the name has been written
               and struck out and written again in the same hand across eleven pages,
               eleven times, on eleven different dates.`,
        options: [
          { id: 'write', label: 'Write it in once more, properly', icon: '✍️',
            desc: 'Somebody has been trying to make this stick for a long time.',
            outcome: `You write it clearly and do not strike it out. The procession, which
                      has not seen you do this, all at once remembers the name and says it together.`,
            effects: { gold: 12, items: { rune_shard: 3 }, flag: 'funeral_named' }, next: null },
          { id: 'close', label: 'Close the book', icon: '📕',
            desc: 'Eleven times is enough for anybody.',
            outcome: `You shut it and put it back on the shelf. The funeral goes ahead
                      nameless and nobody minds, and the ground takes it, and it stays taken.`,
            effects: { gold: 8, xp: { runecrafting: 16 }, flag: 'funeral_closed' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'orchard', title: 'The Orchard With No Soil', icon: '🍎', weight: 9,
    beats: {
      start: {
        text: `An orchard, in fruit, growing out of bare flat stone. No soil. No roots that
               you can see. The fruit is excellent.<br><br>
               An old man is picking it into a basket at a completely unhurried pace.`,
        options: [
          { id: 'help', label: 'Help him pick', icon: '🧺',
            desc: 'It is a big orchard and he is one man.',
            outcome: `You pick for three hours. He tells you which trees are the good ones
                      and he is right about every single one and he has never eaten any of them.`,
            effects: { items: { sunfruit: 4 }, xp: { farming: 8 } }, next: 'picked' },
          { id: 'dig', label: 'Look at where the roots should be', icon: '⛏️',
            desc: 'There is no soil. There are trees. One of these is wrong.',
            outcome: `The trunks meet the stone and stop. Not embedded — abutted, the way a
                      chair leg meets a floor. He watches you find this out.`,
            effects: { xp: { mining: 10 } }, next: 'roots' },
        ],
      },
      picked: {
        text: `He gives you the better basket and keeps the worse one, and when you point
               this out he says the trees prefer it that way, and does not elaborate.`,
        options: [
          { id: 'accept', label: 'Take the good basket', icon: '🍎',
            desc: 'He was very clear about it.',
            outcome: `You eat one on the road and it is the best thing you have ever eaten
                      and you spend a week failing to describe it to anybody.`,
            effects: { gold: 10, items: { sunfruit: 6 }, hp: 0.4, flag: 'orchard_took' }, next: null },
          { id: 'swap', label: 'Swap them back when he is not looking', icon: '🔄',
            desc: 'He is an old man doing a hard job on stone.',
            outcome: `He notices at the gate and says nothing, and the next time you pass
                      that way the orchard has grown by six trees and one of them is planted at
                      the gate where you stood.`,
            effects: { gold: 8, items: { sunfruit: 3 }, flag: 'orchard_gave' }, next: null },
        ],
      },
      roots: {
        text: `"They came like that," he says. "All of it came like that. I just pick it."
               He nods at the stone. "Where do you think it came FROM?"`,
        options: [
          { id: 'guess', label: 'Say you think it was thrown away', icon: '🕳️',
            desc: 'You have been to the Wastes. You know what discarded ground looks like.',
            outcome: `He is quiet for a long time. Then: "That's what I thought." And then,
                      much later, at the gate: "Somebody's still picking it, though."`,
            effects: { gold: 11, xp: { runecrafting: 18 }, flag: 'orchard_knew' }, next: null },
          { id: 'dodge', label: 'Say you have no idea', icon: '🤷',
            desc: 'He is happy. The fruit is good. Some questions are a kindness not to answer.',
            outcome: `"No," he agrees, comfortably. "Nor me." He fills your bag past what
                      it will hold and you get four miles before you have to stop and eat some.`,
            effects: { gold: 9, items: { sunfruit: 5 }, flag: 'orchard_kind' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'lamplighter', title: 'The Lamplighter', icon: '🏮', weight: 9,
    beats: {
      start: {
        text: `A lamplighter is working her way down a road with no lamps on it, stopping
               every forty yards, reaching up, and doing something careful to the air.<br><br>
               Behind her the road is noticeably easier to see.`,
        options: [
          { id: 'walk', label: 'Walk behind her', icon: '🚶',
            desc: 'Whatever she is doing, it is working.',
            outcome: `You follow her for two miles of lit road. When she stops, so does the
                      light, exactly where she stopped, and it stays there.`,
            effects: { xp: { runecrafting: 7 } }, next: 'followed' },
          { id: 'ahead', label: 'Get ahead of her and watch', icon: '👁️',
            desc: 'You would like to see what she does to the air.',
            outcome: `She reaches up, takes hold of nothing, and turns it. There is no lamp.
                      There is a lamp-shaped absence and she is maintaining it.`,
            effects: { xp: { runecrafting: 12 } }, next: 'watched' },
        ],
      },
      followed: {
        text: `At the end of her round she sits down on the last unlit stretch and takes
               her boots off, and the light behind her goes all the way back to the village.`,
        options: [
          { id: 'ask', label: 'Ask who pays her', icon: '💰',
            desc: 'There are no lamps. Somebody is funding this.',
            outcome: `"Nobody, since my father," she says. "I just kept doing it." She looks
                      down the lit road with enormous satisfaction. "Look at it, though."`,
            effects: { gold: 8, flag: 'lamp_unpaid' }, next: null },
          { id: 'pay', label: 'Pay her yourself', icon: '🪙',
            desc: 'Somebody should.',
            outcome: `She tries to give it back twice and then does not. The next time you
                      come that way the road is lit two miles further than it was.`,
            effects: { gold: -3, xp: { defense: 10 }, flag: 'lamp_paid' }, next: null },
        ],
      },
      watched: {
        text: `She catches you looking and does not mind. "You can see them," she says.
               "Most can't." She holds one out — nothing, held out — and waits.`,
        options: [
          { id: 'take', label: 'Take it', icon: '🤲',
            desc: 'She is holding out nothing and she is waiting.',
            risky: {
              chance: 0.6,
              good: { text: `It has weight and it is warm and you cannot see it and you carry
                             it for a mile before she takes it back, delighted with you.`,
                      effects: { gold: 13, items: { rune_shard: 4, greater_rune: 1 } } },
              bad: { text: `Your hand closes on air. She is kind about it. She is kind about
                            it for slightly too long and you leave with your ears burning.`,
                     effects: { gold: 4, xp: { runecrafting: 14 } } },
            }, next: null, flag: 'lamp_held' },
          { id: 'learn', label: 'Ask her to teach you', icon: '📖',
            desc: 'She is the only person doing this and she is one person.',
            outcome: `It takes four days and you are terrible at it and by the end you can
                      light one, badly, that goes out overnight. She says that is how everyone starts.`,
            effects: { gold: 6, xp: { runecrafting: 22 }, flag: 'lamp_learned' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'sleeper', title: 'The One Who Will Not Wake', icon: '🛏️', weight: 8,
    when: { charLevel: 15 },
    beats: {
      start: {
        text: `In a farmhouse at the edge of the parish, a man has been asleep for eleven
               months. He is not ill. He eats, when fed. He does not wake.<br><br>
               His sister has run the farm alone for eleven months and looks it.`,
        options: [
          { id: 'farm', label: 'Work the farm for a day', icon: '🌾',
            desc: 'She has not slept properly since the spring.',
            outcome: `You do a day's work and she sleeps through the whole of it, and wakes
                      at dusk furious and grateful in roughly equal measure.`,
            effects: { xp: { farming: 10 } }, next: 'farmed' },
          { id: 'sit', label: 'Sit with him', icon: '🕯️',
            desc: 'Eleven months is a long time to be alone in a room.',
            outcome: `You sit for an hour. Around the fortieth minute he says something,
                      clearly, without waking. It is a place name. It is not a place.`,
            effects: { xp: { runecrafting: 10 } }, next: 'sat' },
        ],
      },
      farmed: {
        text: `Over dinner she says the thing she has not said to anybody: that she does
               not want him to wake up, because she has worked out what he will ask her.`,
        options: [
          { id: 'listen', label: 'Let her say it', icon: '👂',
            desc: 'She has been carrying it alone since spring.',
            outcome: `She says it. It takes a while. It is not what you expected and it is
                      not your business and you never repeat it to anybody, including here.`,
            effects: { gold: 10, xp: { defense: 10 }, flag: 'sleeper_listened' }, next: null },
          { id: 'stay', label: 'Offer to stay the week', icon: '🏠',
            desc: 'The farm needs two people. It has needed two people for eleven months.',
            outcome: `You stay the week. He does not wake. She laughs twice, which she tells
                      you is twice more than the previous eleven months, and you believe her.`,
            effects: { gold: 8, items: { wheat: 20, root_veg: 12 }, flag: 'sleeper_stayed' }, next: null },
        ],
      },
      sat: {
        text: `You go and look for the place name. There is no such place. There is,
               however, a milestone on the road with the first four letters of it worn off,
               and a woman sitting on the milestone with one shoe off.`,
        options: [
          { id: 'her', label: 'Ask her about the name', icon: '👵',
            desc: 'She is always where the road needs somebody to be.',
            outcome: `"That's where he is," she says, without looking up. "He's fine. He's
                      just there instead of here." She does not say how she knows and you do not ask.`,
            effects: { gold: 11, xp: { runecrafting: 20 }, flag: 'sleeper_found' }, next: null },
          { id: 'say', label: 'Go back and say the name to him', icon: '💬',
            desc: 'He said it to you. It seems only fair.',
            risky: {
              chance: 0.5,
              good: { text: `He opens his eyes. He is entirely himself. He has no idea it has
                             been eleven months and his sister has to sit down on the floor.`,
                      effects: { gold: 18, items: { rune_shard: 5 }, xp: { alchemy: 20 } } },
              bad: { text: `He says it back. That is all. He says it back and keeps sleeping,
                            and now you both know it, and you are not sure that was an improvement.`,
                     effects: { hp: -0.1, xp: { runecrafting: 24 } } },
            }, next: null, flag: 'sleeper_spoke' },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'auction', title: 'An Auction With One Lot', icon: '🔨', weight: 9,
    beats: {
      start: {
        text: `A country auction, well attended, with exactly one lot: a sealed crate,
               unopened, provenance unknown.<br><br>
               The bidding has been going for two hours and is currently at four coins.`,
        options: [
          { id: 'bid', label: 'Bid five', icon: '🪙',
            desc: 'It is four coins. It is a whole crate.',
            outcome: `Silence. The auctioneer waits. Nobody counters. You have bought a
                      crate for five coins and forty people are looking at their shoes.`,
            effects: { gold: -1 }, next: 'won' },
          { id: 'watch', label: 'Watch who is not bidding', icon: '👀',
            desc: 'Two hours. Four coins. Forty people. Something is going on.',
            outcome: `Everyone bids once and then stops. Nobody wants it. Everybody came.
                      One man at the back has bid nothing and has been here since dawn.`,
            effects: { xp: { thieving: 8 } }, next: 'watcher' },
        ],
      },
      won: {
        text: `They help you carry it to the road and then, all of them, go home very
               quickly. The crate has a reference number on the lid.`,
        options: [
          { id: 'open', label: 'Open it', icon: '📦',
            desc: 'You paid five coins for the right.',
            risky: {
              chance: 0.55,
              good: { text: `It is somebody's tools. A full set, good ones, cared for, with
                             initials burned into the handles that are not anybody's you know.`,
                      effects: { gold: 14, items: { rune_shard: 4, steel_bar: 6 } } },
              bad: { text: `It is full of auction catalogues. Every one lists a single lot.
                            Every one is a sealed crate. The oldest is from before the parish existed.`,
                     effects: { gold: 3, xp: { runecrafting: 18 } } },
            }, next: null, flag: 'auction_opened' },
          { id: 'sell', label: 'Auction it again yourself', icon: '🔨',
            desc: 'It is clearly what everybody else has been doing.',
            outcome: `It goes for six coins in under a minute to a woman who looks
                      enormously relieved, and who says "thank you" with real feeling.`,
            effects: { gold: 7, flag: 'auction_passed' }, next: null },
        ],
      },
      watcher: {
        text: `The man at the back catches you afterwards. "You noticed," he says. "Good.
               I've been buying it back for six years and I'm getting old."`,
        options: [
          { id: 'take', label: 'Ask him to teach you the round', icon: '🗺️',
            desc: 'Somebody is going to have to keep doing this.',
            outcome: `He walks you the whole circuit — nine villages, nine auctions, one
                      lot each. He does not explain what is in it and you stop needing him to.`,
            effects: { gold: 12, xp: { thieving: 20 }, flag: 'auction_heir' }, next: null },
          { id: 'buy', label: 'Buy it for him this once', icon: '🪙',
            desc: 'He is getting old and it is five coins.',
            outcome: `He lets you, and carries it home himself anyway, and you understand
                      that the carrying was never the difficult part of it.`,
            effects: { gold: -2, xp: { defense: 12 }, flag: 'auction_helped' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'ferry', title: 'The Ferryman Who Will Not Take Payment', icon: '⛵', weight: 9,
    beats: {
      start: {
        text: `The ferry is free. The ferryman is insistent about this to the point of
               being slightly aggressive about it.<br><br>
               There is a hat on the deck with a great deal of money in it that he
               has clearly never touched.`,
        options: [
          { id: 'ride', label: 'Ride across and add nothing', icon: '⛵',
            desc: 'He was extremely clear.',
            outcome: `He is delighted with you. Halfway over he tells you, unprompted, the
                      three things he has decided about the river, and one of them is right.`,
            effects: { xp: { fishing: 8 } }, next: 'crossed' },
          { id: 'hat', label: 'Ask about the hat', icon: '🎩',
            desc: 'It is a lot of money to have never touched.',
            outcome: `"They keep doing it," he says. "I keep not spending it." He looks at
                      it the way you would look at a dog that has brought you something dead.`,
            effects: { xp: { runecrafting: 8 } }, next: 'hat' },
        ],
      },
      crossed: {
        text: `On the far bank he does not tie up. He waits, engine idling, looking at the
               water, and eventually says: "You'll want to be going back."`,
        options: [
          { id: 'go', label: 'Go on anyway', icon: '➡️',
            desc: 'You crossed for a reason.',
            outcome: `The far bank is fine. It is completely fine. It is so completely fine
                      that you turn round after an hour and he is still there, waiting, not smug.`,
            effects: { gold: 8, xp: { runecrafting: 14 }, flag: 'ferry_went' }, next: null },
          { id: 'stay', label: 'Get back on the boat', icon: '↩️',
            desc: 'He has been doing this a long time.',
            outcome: `He takes you back and refuses payment again and gives you a fish,
                      which is enormous, and which he says he has been saving for somebody sensible.`,
            effects: { gold: 6, items: { raw_leviathan: 3 }, flag: 'ferry_listened' }, next: null },
        ],
      },
      hat: {
        text: `"Spend it on what?" he says, when you suggest it. "I've got the boat. I've
               got the river. What's it going to buy me — a different river?"<br><br>
               He is not being rhetorical. He would like an answer.`,
        options: [
          { id: 'answer', label: 'Give him one', icon: '💡',
            desc: 'There must be something.',
            outcome: `You suggest a second boat, for when this one goes. He stares at you.
                      Then he takes the hat below and you hear him counting for a long time.`,
            effects: { gold: 10, xp: { woodcutting: 12 }, flag: 'ferry_answered' }, next: null },
          { id: 'agree', label: 'Agree there is nothing', icon: '🤷',
            desc: 'He has the boat and the river.',
            outcome: `He is so pleased that he empties the hat into your bag, over your
                      objections, and tells you to spend it on something stupid, which you do.`,
            effects: { gold: 16, flag: 'ferry_hat' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'library', title: 'The Library With One Reader', icon: '📚', weight: 8,
    when: { charLevel: 20 },
    beats: {
      start: {
        text: `A library, four storeys, immaculately kept, in a hamlet of eleven people.
               There is one reader in it and she has been there since before any of the
               eleven were born, and none of them find this odd.<br><br>
               "You'll want the third floor," she says, without looking up.`,
        options: [
          { id: 'third', label: 'Go to the third floor', icon: '🪜',
            desc: 'She was very specific.',
            outcome: `The third floor is empty shelves, all of them, four thousand feet of
                      empty shelf, dusted this morning.`,
            effects: { xp: { runecrafting: 10 } }, next: 'empty' },
          { id: 'her', label: 'Sit down opposite her instead', icon: '🪑',
            desc: 'She has been reading the same book for a very long time.',
            outcome: `She is on page four. The book is nine hundred pages. She turns back to
                      page three while you watch, and starts again, and does not seem distressed.`,
            effects: { xp: { alchemy: 8 } }, next: 'reader' },
        ],
      },
      empty: {
        text: `On the far wall of the third floor there is a card catalogue, full, in
               perfect order, indexing four thousand feet of books that are not there.`,
        options: [
          { id: 'request', label: 'Request one', icon: '🎫',
            desc: 'There is a slip and a pencil and a slot in the wall.',
            risky: {
              chance: 0.6,
              good: { text: `Twenty minutes later a book comes up the dumbwaiter. It is the one
                             you asked for. Nobody has come up the stairs and there is nobody below.`,
                      effects: { gold: 14, items: { blank_tome: 1 }, xp: { runecrafting: 20 } } },
              bad: { text: `Twenty minutes later a slip comes back up. It says WITHDRAWN. Under
                            that, in different handwriting, it says BY WHOM.`,
                     effects: { xp: { runecrafting: 24 }, hp: -0.08 } },
            }, next: null, flag: 'library_requested' },
          { id: 'file', label: 'Add a card of your own', icon: '✍️',
            desc: 'Four thousand feet of shelf and somebody has to start.',
            outcome: `You index a book you have not written. Years later you find it on the
                      third floor, shelved, with your name on the spine and nothing inside.`,
            effects: { gold: 11, items: { rune_shard: 3 }, flag: 'library_filed' }, next: null },
        ],
      },
      reader: {
        text: `"It's a good page," she says, when you finally ask. "It's the best page.
               I did read on, once." Long pause. "I'd rather have the page."`,
        options: [
          { id: 'read', label: 'Read page four', icon: '📖',
            desc: 'She has offered, in her way.',
            outcome: `It is a description of a meadow with one tree in it that has never
                      dropped a leaf. You put the book down very carefully and do not read on either.`,
            effects: { gold: 9, xp: { runecrafting: 26 }, flag: 'library_page' }, next: null },
          { id: 'past', label: 'Ask what is on page five', icon: '❓',
            desc: 'You would like to know what she stopped for.',
            outcome: `She tells you. It takes one sentence. You go back to Hearthwick the
                      long way, and you take four days over it, and you are all right afterwards.`,
            effects: { gold: 7, xp: { runecrafting: 30 }, hp: -0.05, flag: 'library_five' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'race', title: 'A Race Nobody Is Winning', icon: '🏃', weight: 9,
    beats: {
      start: {
        text: `Two men are racing along the road. They have been racing for eleven miles.
               They are running at precisely the same speed and have been the whole way and
               neither will concede.<br><br>
               A small crowd is walking alongside, betting.`,
        options: [
          { id: 'bet', label: 'Put money on one of them', icon: '🪙',
            desc: 'It is a race. That is what you do at a race.',
            outcome: `You back the shorter one. The crowd approves. Nothing changes. They
                      are still exactly level at mile fourteen and the odds have not moved.`,
            effects: { gold: -2 }, next: 'betted' },
          { id: 'run', label: 'Run with them', icon: '🏃',
            desc: 'You want to know whether it is them or the road.',
            outcome: `You run for a mile at their shoulder. You are not tired. Neither are
                      they. You slow down deliberately and stay exactly level with them.`,
            effects: { xp: { strength: 10 } }, next: 'ran' },
        ],
      },
      betted: {
        text: `At mile twenty the crowd starts to thin. At mile thirty there are four of
               you. The bookmaker has stopped taking bets and is walking with his head down.`,
        options: [
          { id: 'stop', label: 'Get in front of them and stop', icon: '🛑',
            desc: 'Somebody has to end this.',
            outcome: `They run round you, one each side, without breaking stride, and rejoin
                      exactly level. You are still holding the stake. The bookmaker will not take it.`,
            effects: { gold: 5, xp: { runecrafting: 16 }, flag: 'race_stopped' }, next: null },
          { id: 'walk', label: 'Walk with the bookmaker', icon: '🧾',
            desc: 'He is taking this harder than either of them.',
            outcome: `"Forty years," he says. "Every time. Different men." He shows you the
                      book. Same two names, forty years of entries, always level.`,
            effects: { gold: 9, xp: { thieving: 16 }, flag: 'race_book' }, next: null },
        ],
      },
      ran: {
        text: `You run with them until dusk. Somewhere in the afternoon one of them looks
               across at you and says, entirely conversationally, "you can stop, you know."`,
        options: [
          { id: 'stop', label: 'Stop', icon: '🚶',
            desc: 'He said it kindly.',
            outcome: `You stop. They do not. You watch them go over the rise perfectly level
                      and you have the strong sense you have been let off something.`,
            effects: { gold: 8, hp: 0.2, flag: 'race_let' }, next: null },
          { id: 'keep', label: 'Keep running', icon: '💨',
            desc: 'So can they.',
            outcome: `The three of you run through the night. At dawn you are somewhere with
                      no name and all three of you stop at once, without discussing it, and shake hands.`,
            effects: { gold: 13, items: { rune_shard: 4 }, xp: { strength: 24 }, flag: 'race_ran' }, next: null },
        ],
      },
    },
  },

  // ------------------------------------------------------------
  {
    id: 'thanks', title: 'Somebody Owes The Dog', icon: '🦴', weight: 12,
    when: { flag: 'dog_fed' },
    beats: {
      start: {
        text: `A woman stops you in the street holding a dog collar, and the dog collar is
               the smaller one from the satchel.<br><br>
               "You fed him," she says. "The road dog. That was you."`,
        options: [
          { id: 'yes', label: 'Say yes', icon: '🐕',
            desc: 'It was a biscuit. It was his own biscuit.',
            outcome: `She sits down on the kerb, which is not what you expected, and it
                      takes her a minute. "Six years," she says. "Six years I've been leaving food out."`,
            effects: { xp: { defense: 6 } }, next: 'six' },
          { id: 'collar', label: 'Ask about the small collar', icon: '🦴',
            desc: 'It was in the satchel. There was no second dog.',
            outcome: `"That's his," she says. "From when he was small. He carries it because
                      I gave it him." She holds it out. "He'd want you to have it now."`,
            effects: { items: { rune_shard: 2 } }, next: 'collar' },
        ],
      },
      six: {
        text: `Six years of food left at the crossroads, every night, and never once
               touched, and she has kept doing it, and she has never once seen the dog.`,
        options: [
          { id: 'take', label: 'Offer to take her to him', icon: '🗺️',
            desc: 'He is a two hour walk and he is always there.',
            outcome: `He is there. He knows her instantly and she does not cope with it well
                      and neither does he. You leave them to it and take the long way home.`,
            effects: { gold: 14, pet_xp: 120, flag: 'thanks_reunited' }, next: null },
          { id: 'tell', label: 'Tell her he is well', icon: '💬',
            desc: 'He is. He is extremely well and enormously employed.',
            outcome: `She wants every detail and you give her every detail twice. She
                      keeps leaving the food out. She says she likes doing it now.`,
            effects: { gold: 10, items: { bread: 6 }, flag: 'thanks_told' }, next: null },
        ],
      },
      collar: {
        text: `The collar has a name on it, worn nearly off, and it is not a dog's name.
               It is one of the nine names from the inn ledger.`,
        options: [
          { id: 'show', label: 'Show her what it says', icon: '🔍',
            desc: 'She has carried it six years and never read it.',
            outcome: `She reads it. She says "oh" very quietly and puts it in her pocket and
                      thanks you and goes inside, and the light stays off for a long time.`,
            effects: { gold: 9, xp: { runecrafting: 22 }, flag: 'thanks_name' }, next: null },
          { id: 'keep', label: 'Take it and say nothing', icon: '🤐',
            desc: 'She has had six good years of leaving food out.',
            outcome: `You carry it. It is in your bag now and it will be in your bag after
                      the next Ascension too, and you have checked, twice.`,
            effects: { gold: 12, items: { rune_shard: 4 }, flag: 'thanks_kept' }, next: null },
        ],
      },
    },
  },
];
