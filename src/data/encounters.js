// ============================================================
// VILLAGE ENCOUNTERS — things that happen to Hearthwick
//
// An idle town that only ever ticks upward is scenery. These make it a
// place with weather: a fire, a raid, a theft, a bad night underground —
// and, once in a while, a circus.
//
// Design rules learned from the visitor system:
//
//  1. EVERY OPTION IS PLAYABLE. No encounter has a single sane answer.
//     Paying is fast and expensive; acting yourself is cheap and risky;
//     doing nothing is free and costs you later. All three are defensible.
//
//  2. IGNORING ONE IS A CHOICE, NOT A PUNISHMENT FOR BEING AWAY. Every
//     encounter has an explicit timeout outcome that is bad-but-survivable,
//     because this is an idle game and you will miss some.
//
//  3. CONSEQUENCES ARE LEGIBLE. Effects are declared as data and rendered
//     back to you in the resolution, so you always know what it cost.
//
// Effect keys the system understands:
//   gold        negative to charge, positive to pay out
//   hp          fraction of max HP lost (0..1)
//   haltMs      shut a random building down for this long
//   damage      knock N levels off a random building
//   stock       fraction of one building's stock stolen/burnt
//   population  change to the town's extra population
//   buff        { id, name, icon, effects, minutes }
//   items       { itemId: qty }
//   xp          { skillId: amount }
// ============================================================

export const ENCOUNTER_MIN_MS = 14 * 60 * 1000;
export const ENCOUNTER_MAX_MS = 26 * 60 * 1000;
export const ENCOUNTER_WINDOW_MS = 8 * 60 * 1000;   // how long you have to answer

export const ENCOUNTERS = [
  // ------------------------------------------------------------
  {
    id: 'fire', name: 'Fire on the Row', icon: '🔥', tone: 'bad',
    minBuildings: 1, weight: 10,
    intro: `A roof has caught, and the wind is doing the rest. Half of Hearthwick is
            already out with buckets and the other half is watching, which is traditional.`,
    options: [
      {
        id: 'bucket', label: 'Get in the line yourself',
        desc: 'Free. You will be singed, and the fire will still take something.',
        effects: { hp: 0.25, haltMs: 4 * 60 * 1000 },
        outcome: `You take the front of the line where the heat is, and pass buckets until
                  your arms stop working. The row holds. One building is a smoking shell for a
                  while, and your eyebrows are a rumour.`,
      },
      {
        id: 'pay', label: 'Pay the watch to handle it',
        desc: 'Costs gold. Nothing burns.',
        cost: { goldPerLevel: 900 },
        effects: {},
        outcome: `Coin moves, and so does everyone else. Holt has the row soaked before the
                  fire works out what happened. He does not thank you for the money. He never does.`,
      },
      {
        id: 'ignore', label: 'Let it burn out',
        desc: 'Free. It will cost you a building level and a long shutdown.',
        effects: { damage: 1, haltMs: 12 * 60 * 1000 },
        outcome: `It burns itself out by morning, the way fires do. What is left is a level
                  lower than it was and full of wet ash. Marrow says nothing, which is worse.`,
      },
    ],
    timeout: 'ignore',
  },

  // ------------------------------------------------------------
  {
    id: 'raid', name: 'Something Came Down the Road', icon: '👹', tone: 'bad',
    minBuildings: 2, weight: 9,
    intro: `Three of them, out of the treeline, moving with the awful patience of things that
            have done this before. The watch is six people and a bell.`,
    options: [
      {
        id: 'fight', label: 'Meet them at the gate',
        desc: 'Free, but you take real damage. Nothing else is lost.',
        effects: { hp: 0.4, xp: { attack: 400, strength: 400 } },
        effectsNote: 'You will be badly hurt.',
        outcome: `You go out to meet them because that is what you do now, apparently. It is
                  short and it is ugly and you win. Wren stitches you up without comment and with
                  visible opinions.`,
      },
      {
        id: 'guards', label: 'Pay the watch hazard wages',
        desc: 'Expensive. Holt earns it.',
        cost: { goldPerLevel: 1600 },
        effects: {},
        outcome: `Holt takes the coin, posts four on the east road instead of two, and meets
                  them in a line of shields. <i>"Always two,"</i> he says afterwards, <i>"unless
                  someone pays for four."</i>`,
      },
      {
        id: 'bar', label: 'Bar the doors and wait',
        desc: 'Free. They will take what they can carry.',
        effects: { stock: 0.5, haltMs: 8 * 60 * 1000, population: -1 },
        outcome: `Everyone gets inside. Everyone survives. In the morning the storehouses are
                  half empty and one family has decided Hearthwick is not for them after all.`,
      },
    ],
    timeout: 'bar',
  },

  // ------------------------------------------------------------
  {
    id: 'robbery', name: 'The Strongbox Is Light', icon: '🥷', tone: 'bad',
    minBuildings: 1, weight: 8,
    intro: `Someone has been at the takings. Not all of it — a professional amount, the kind
            you might not notice for a week. Pell noticed in an afternoon.`,
    options: [
      {
        id: 'chase', label: 'Go after them',
        desc: 'Pell knows which road. Good odds you get it back, small chance you lose more.',
        effects: { chase: true },
        outcome: null,   // resolved dynamically
      },
      {
        id: 'bounty', label: 'Post a bounty and move on',
        desc: 'A flat cost. The thief stops, and stays stopped.',
        cost: { goldPerLevel: 700 },
        effects: {},
        outcome: `You put a number on the board. The thefts stop that night. Nobody ever
                  collects the bounty, which Ferrin finds "structurally fascinating".`,
      },
      {
        id: 'shrug', label: 'Write it off',
        desc: 'Free. They will be back.',
        effects: { goldFraction: 0.08 },
        outcome: `You let it go. Word gets around that Hearthwick lets it go. The strongbox
                  is lighter again by the end of the week.`,
      },
    ],
    timeout: 'shrug',
  },

  // ------------------------------------------------------------
  {
    id: 'quake', name: 'The Ground Moves', icon: '🌍', tone: 'bad',
    minBuildings: 3, weight: 6,
    intro: `Nine seconds of the valley shrugging. No warning, no aftershock, and every clock
            in Hearthwick now reads the same time, which none of them did before.`,
    options: [
      {
        id: 'repair', label: 'Emergency repairs, tonight',
        desc: 'Costly, but nothing stays broken.',
        cost: { goldPerLevel: 1400 },
        effects: { haltMs: 2 * 60 * 1000 },
        outcome: `Every carpenter in town works by lamplight. By dawn the cracks are packed
                  and the beams are sistered and the only casualty is your purse.`,
      },
      {
        id: 'prop', label: 'Prop up what you can, cheaply',
        desc: 'Half the cost. Some damage sticks.',
        cost: { goldPerLevel: 500 },
        effects: { haltMs: 9 * 60 * 1000 },
        outcome: `You brace the worst of it with green timber and optimism. It holds. A
                  couple of the shops are shut for the day while the dust settles.`,
      },
      {
        id: 'assess', label: 'Wait and see what fell',
        desc: 'Free. Something will have fallen.',
        effects: { damage: 1, haltMs: 15 * 60 * 1000 },
        outcome: `What fell, fell. One building comes down to a lower storey and stays there
                  a while. Ferrin measures the crack in the well and writes down a number and
                  goes quiet.`,
      },
    ],
    timeout: 'assess',
  },

  // ------------------------------------------------------------
  {
    id: 'circus', name: 'The Circus Comes to Town', icon: '🎪', tone: 'good',
    minBuildings: 2, weight: 7,
    intro: `Carts on the east road at dusk, painted the colour of a headache, and a woman on
            the lead wagon who introduces herself as "the whole company". They have come a long
            way, they say, from somewhere they cannot quite name.`,
    options: [
      {
        id: 'sponsor', label: 'Sponsor the run',
        desc: 'Pay for the pitch. People stay. People move in.',
        cost: { goldPerLevel: 1100 },
        effects: {
          population: 3,
          buff: { id: 'circus_cheer', name: 'Carnival', icon: '🎪',
                  effects: { xp: 0.15, gold: 0.15 }, minutes: 30 },
        },
        outcome: `Three nights of fire-juggling and a bear that is almost certainly a man.
                  Hearthwick does not sleep and does not want to. Two families ask about lodgings
                  before the carts have even left.`,
      },
      {
        id: 'attend', label: 'Just go and watch',
        desc: 'Free. You will feel better for it.',
        effects: {
          buff: { id: 'circus_cheer', name: 'Carnival', icon: '🎪',
                  effects: { xp: 0.10 }, minutes: 20 },
        },
        outcome: `You sit on a hay bale with a paper cone of something hot and watch a woman
                  throw knives at her own reflection. For an hour you do not think about the Spire
                  at all. It is the best hour you have had in some time.`,
      },
      {
        id: 'refuse', label: 'Turn them away at the road',
        desc: 'Free. Nothing happens, and everyone notices that nothing happened.',
        effects: { population: -1 },
        outcome: `They turn the carts around without argument, which is somehow worse than an
                  argument. Hearthwick is quiet that week. One of the Gilded Bean's cooks hands in
                  her apron and goes east with them.`,
      },
    ],
    timeout: 'refuse',
  },

  // ------------------------------------------------------------
  {
    id: 'stranger', name: 'A Stranger Who Knows the Way', icon: '🧳', tone: 'good',
    minBuildings: 4, weight: 5,
    intro: `A traveller arrives at dusk, walks straight to the well without asking where it
            is, drinks, and then looks up as though surprised to find anyone watching.<br><br>
            <i>"Sorry,"</i> they say. <i>"I thought I'd been here before."</i>`,
    options: [
      {
        id: 'lodge', label: 'Put them up for the night',
        desc: 'A small cost. They leave something behind.',
        cost: { goldPerLevel: 400 },
        effects: { items: { rune_shard: 3 }, buff: { id: 'well_met', name: 'Well Met', icon: '🧳',
                   effects: { dropRate: 0.20 }, minutes: 25 } },
        outcome: `They eat, they sleep, they are gone before light. On the pillow: three rune
                  shards and a note that says <i>"for the road back"</i>, in handwriting you know
                  better than you would like.`,
      },
      {
        id: 'question', label: 'Ask them where they have been',
        desc: 'Free. You may not enjoy the answer.',
        effects: { lore: true },
        outcome: `They think about it for a long time. <i>"East,"</i> they say at last.
                  <i>"And then east. And then here."</i> They look genuinely troubled.
                  <i>"I've been walking a straight line for eleven years."</i>`,
      },
      {
        id: 'move', label: 'Send them on their way',
        desc: 'Free. Nothing gained, nothing lost.',
        effects: {},
        outcome: `You point at the east road. They take it, without complaint, and are
                  out of sight in a hundred paces and do not appear on the rise beyond.`,
      },
    ],
    timeout: 'move',
  },
];

export function getEncounter(id) { return ENCOUNTERS.find(e => e.id === id); }
