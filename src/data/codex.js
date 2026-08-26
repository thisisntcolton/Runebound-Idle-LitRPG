// ============================================================
// THE CODEX — the world, discovered a piece at a time
//
// Everything here unlocks from something you actually did: a hundred
// kills, a level, a town that grew, a cycle survived. Entries are short
// on purpose. They are texture, not homework.
//
// Two things make the Codex feel alive rather than encyclopaedic:
//
//  1. DEEPER PASSES. Many entries have `deeper` text keyed to a cycle
//     number. Re-read an entry after Ascending and it has more to say,
//     because you know more than you did. The world did not change; you
//     stopped being new.
//
//  2. TRIGGERS ARE DECLARATIVE. `when` is data, so the unlock rules are
//     testable and every entry is reachable by construction. See
//     systems/codex.js for the evaluator.
//
// Tone rules, inherited from lore.js:
//  - The System is cheerful, helpful, and lying.
//  - Nobody in Hearthwick knows they are in a loop. They half-know.
//  - Never explain the twist. Let details contradict each other.
// ============================================================

export const CATEGORIES = {
  world:    { id: 'world',    name: 'The World',   icon: '🌍', blurb: 'Land, sky, and the places the map disagrees with itself.' },
  bestiary: { id: 'bestiary', name: 'Bestiary',    icon: '🐾', blurb: 'What you have killed enough of to start noticing.' },
  people:   { id: 'people',   name: 'People',      icon: '👥', blurb: 'The living, the hired, and the ones who keep almost remembering you.' },
  system:   { id: 'system',   name: 'The System',  icon: '⬛', blurb: 'Notes on the interface. It does not like being a subject.' },
  craft:    { id: 'craft',    name: 'Trades',      icon: '⚒️', blurb: 'What the work teaches you, beyond the work.' },
  relics:   { id: 'relics',   name: 'Relics',      icon: '💎', blurb: 'Objects with more history than they should have.' },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

/**
 * Entry shape:
 *   id      unique key, also the save key
 *   cat     category id
 *   title   short, evocative
 *   text    the discovery itself (HTML allowed)
 *   when    unlock condition, one of:
 *             { skill: { id, level } }
 *             { kills: n }                       total kills
 *             { killsOf: { id, n } }             kills of one monster id
 *             { stat: { key, n } }               any state.stats counter
 *             { townLevel: n }
 *             { townBuilding: id }               has built one
 *             { population: n }
 *             { cycle: n }                       ascensions >= n
 *             { item: id }                       has ever held it
 *             { charLevel: n }
 *             { pets: n }                        pets hatched
 *             { flag: 'name' }                   set by another system
 *   deeper  optional [{ cycle, text }] appended once you have Ascended enough
 *   quiet   true = no popup, it just appears in the Codex (for small ones)
 */
export const CODEX = [
  // ------------------------------------------------------------
  // THE WORLD
  // ------------------------------------------------------------
  {
    id: 'w_meadow', cat: 'world', title: 'The Meadow', when: { kills: 1 },
    text: `You woke here. Everyone does. The grass is the exact green of grass in a
    memory of grass, and it is the same height everywhere, and it does not get
    trampled no matter how long you stand in it.<br><br>
    There is one tree. It has never dropped a leaf.`,
    deeper: [
      { cycle: 1, text: `You have woken in this meadow twice now. The grass is the same
        height. You are fairly sure you flattened a patch of it, last time, lying down
        to look at the sky. It is not flattened.` },
      { cycle: 3, text: `It is not a meadow. It is a <i>save point</i> — the first frame
        of a day someone decided was worth keeping. The tree does not drop leaves because
        the day it was captured, it hadn't.` },
    ],
  },
  {
    id: 'w_horizon', cat: 'world', title: 'The Seam', when: { charLevel: 12 },
    text: `Stand on high ground at dusk and look east, and the horizon has a
    <i>join</i> in it — a hairline where two identical skies have been fitted
    together slightly out of true.<br><br>
    Sable Quill has drawn it eleven times. The seam is in the same place in every drawing.
    The drawings are from different vantage points.`,
    deeper: [
      { cycle: 2, text: `The seam is where the world was cut to fit. Everything east of
        it is the same field, tiled. That is why every road out of Hearthwick curves back:
        not sorcery, just economy. There was only so much world worth saving.` },
    ],
  },
  {
    id: 'w_weather', cat: 'world', title: 'Weather, Such As It Is', when: { stat: { key: 'actions', n: 300 } },
    text: `It rains in Gloomroot on a schedule. Not "often" — on a <b>schedule</b>.
    Forty minutes of drizzle, twelve of sun, repeat. The farmers have stopped
    planning around it and started setting clocks by it.<br><br>
    [ SYSTEM ] Weather is a cosmetic feature. Please do not derive conclusions from it.`,
    quiet: true,
  },
  {
    id: 'w_stars', cat: 'world', title: 'The Wrong Stars', when: { cycle: 1 },
    text: `There are four hundred and six stars. Ferrin counted them, then counted
    them again the next night, then had a quiet week.<br><br>
    They do not move. Not wrongly — <i>not at all</i>. The whole sky is a painted
    ceiling that someone forgot to rotate.`,
    deeper: [
      { cycle: 3, text: `Four hundred and six is not an arbitrary number. It is how many
        were visible from the top of the Spire, on the last clear night, before.<br><br>
        Someone stood up there and looked up and kept what they could.` },
    ],
  },
  {
    id: 'w_dragonspire', cat: 'world', title: 'The Dragonspire', when: { charLevel: 30 },
    text: `The mountain is warm. Not sun-warm — warm all the way through, warm on the
    north face in winter, warm under three feet of snow. Put your hand on the rock
    and you can feel something in it keeping time.<br><br>
    The road up is in excellent repair. Nobody in living memory has repaired it.`,
    deeper: [
      { cycle: 2, text: `It is not a mountain with something inside it. It is
        <i>something inside a mountain-shaped shell</i>, and the warmth is waste heat,
        and the road is maintained because the engine expects you.` },
    ],
  },
  {
    id: 'w_roads', cat: 'world', title: 'Every Road Curves Back', when: { townLevel: 4 },
    text: `Sable Quill has surveyed nine roads out of Hearthwick with instruments she
    made herself. All nine are straight. All nine arrive back at the same eastern field.<br><br>
    <i>"Straight lines that return,"</i> she says, tapping the map, <i>"are not a
    property of roads. They are a property of the paper."</i>`,
  },
  {
    id: 'w_below', cat: 'world', title: 'Below The Below', when: { skill: { id: 'mining', level: 45 } },
    text: `The deep mine bottoms out in worked stone. Not a natural floor —
    <b>worked</b>, tooled flat, with a seam of mortar. Something built down before
    anything built up.<br><br>
    Someone has carved a name into it. The letters are old and the name is yours.`,
    deeper: [
      { cycle: 2, text: `You have been down to look again. The carving is weathered by
        centuries, which is impossible, and it is in your handwriting, which is worse.` },
    ],
  },

  {
    id: 'w_wastes', cat: 'world', title: 'The Scrap Wastes', when: { era: 2 },
    text: `The ground is worked stone, tooled flat, and then discarded. Not ruins —
    ruins were something once. This was <i>surplus</i>.<br><br>
    A road that goes eleven paces and stops. Half a wall with a window in it. An
    orchard with no soil underneath, still fruiting. Vera has been walking the edges
    for a week and her conclusion is professional and short: somebody up there throws
    away good material.<br><br>
    The sky scrolls. Nobody has managed to read it yet. Ferrin is trying.`,
    deeper: [
      { cycle: 5, text: `Pell can read it. She will not say how, and what she says it
        says is a list of names, and one of them is Hearthwick, and it has a number
        after it that goes up every time you Ascend.` },
    ],
  },
  {
    id: 's_recommendation2', cat: 'system', title: 'Recommendation: Mining', when: { era: 2 },
    text: `The sky failed, the world turned out to be a box, everything anyone believed
    was administrative, and forty seconds later the blue window said:<br><br>
    [ SYSTEM ] Recommendation: mining.<br><br>
    It has not stopped. Whatever else has broken, that has not. It still congratulates
    you for chopping a tree, in the same warm font, in a place that has no trees.`,
    deeper: [
      { cycle: 6, text: `You have started to think the recommendations were never
        for your benefit or theirs. They are what it does with its hands.<br><br>
        It is the only one of us that has been doing this longer than you have.` },
    ],
  },

  // ------------------------------------------------------------
  // BESTIARY
  // ------------------------------------------------------------
  {
    id: 'b_slime', cat: 'bestiary', title: 'On Slimes', when: { killsOf: { id: 'slime', n: 50 } },
    text: `A slime has no organs, no nerves, and no reason to flinch — and yet the
    meadow slime flinches when you raise your arm, before the blow, every time.<br><br>
    It has learned. It has no way to learn. It has learned anyway.`,
    deeper: [
      { cycle: 1, text: `Pell says the slime was here when she was small, and her mother
        says it was there when <i>she</i> was small, and it has always been exactly one
        slime and exactly this size.` },
      { cycle: 3, text: `[ SYSTEM ] The slime in the meadow has died 11,208 times.<br><br>
        You did not ask. It volunteered the number. It has never volunteered a number.` },
    ],
  },
  {
    id: 'b_wolves', cat: 'bestiary', title: 'On Wolves', when: { kills: 200 },
    text: `Gloomroot wolves do not hunt you. They <b>escort</b> you — pacing at the
    edge of the treeline, keeping distance, turning back at the same fallen elm every
    time as though it were a border.<br><br>
    They attack only if you go past the elm. Nobody has explained the elm to them.`,
  },
  {
    id: 'b_golems', cat: 'bestiary', title: 'On Golems', when: { kills: 800 },
    text: `Cut one open and there is no heart in the cavity, just a gear the size of a
    dinner plate, still turning. It keeps turning for about nine minutes after the
    golem stops.<br><br>
    Vera weighed one. It is heavier than the metal it is made of.`,
    deeper: [
      { cycle: 2, text: `The gears are all cut to the same tooth-count as the mechanism you
        can hear in the Spire, if you press your ear to the warm rock. They are not
        monsters. They are <i>spare parts that got bored</i>.` },
    ],
  },
  {
    id: 'b_broodmother', cat: 'bestiary', title: 'On the Broodmother', when: { stat: { key: 'bossKills', n: 1 } },
    text: `She did not eat what she killed and she did not kill what wandered in.
    She kept them — walled in silk, alive, fed. Hundreds of years of them.<br><br>
    Holt thinks it was a nest instinct gone wrong. Wren went down, looked at the
    arrangement of them, and said it was a <b>ward</b>. She would not say against what.`,
  },
  {
    id: 'b_rift_things', cat: 'bestiary', title: 'On Rift-Spawn', when: { stat: { key: 'riftsSealed', n: 1 } },
    text: `Things that come out of a tear have no fixed shape and no fixed name, and
    the System labels them anyway — <i>Spilled Thing, Edge Crawler, Hollow Statistic</i> —
    with the brisk confidence of a filing clerk.<br><br>
    They are not from anywhere. They are from <b>when the world does not go all the way
    to the edges</b>, which is not a place, and they are extremely annoyed about it.`,
  },
  {
    id: 'b_aurelion', cat: 'bestiary', title: 'On the Last Flame', when: { stat: { key: 'aurelionKills', n: 1 } },
    text: `He fights like a man who has fought you before and is not in a hurry.
    He does not use your name. He calls you <i>little ember</i>, which is either an
    insult or the single kindest thing anyone in this world has said to you.<br><br>
    When he dies he laughs. Every time. It is not a mad laugh. It is <b>relief</b>,
    and it lasts exactly as long as it takes for the world to start again.`,
    deeper: [
      { cycle: 4, text: `You know now. He is not the boss of this world. He is the
        <i>lock</i> on it, and killing him is not victory — it is checking whether the
        lock still holds. It always does. He always makes sure it does.<br><br>
        Every laugh was him finding out you were still coming.` },
    ],
  },

  // ------------------------------------------------------------
  // PEOPLE
  // ------------------------------------------------------------
  {
    id: 'p_marrow', cat: 'people', title: 'Old Marrow', when: { townLevel: 1 },
    text: `He says he laid the first stone of Hearthwick. There was no first stone;
    the ground was bare grass the week before you bought the parcel. He is not lying.
    He is <i>certain</i>, which is different and worse.<br><br>
    He talks in his sleep, Pell says. He says numbers.`,
    deeper: [
      { cycle: 1, text: `You have built this town before and torn it down, and Marrow has
        laid the first stone every single time, and every single time he remembers doing it
        for sixty years.` },
    ],
  },
  {
    id: 'p_pell', cat: 'people', title: 'Pell the Younger', when: { townLevel: 3 },
    text: `She knew your name before you gave it. When asked, she shrugged and said
    you looked like a name she already had.<br><br>
    She is the only person in Hearthwick who notices when your sword changes.`,
    deeper: [
      { cycle: 2, text: `<i>"You had a different sword last time,"</i> she says, and you
        ask <i>which time</i>, and she thinks about it seriously for a while, the way a
        child does, and then says: <i>"The one before the one before this one."</i><br><br>
        She is right. She should not be able to be right.` },
    ],
  },
  {
    id: 'p_ferrin', cat: 'people', title: 'Ferrin Vale', when: { townLevel: 13 },
    text: `A hedge-scholar with no hedge and no school, who arrived asking to see the
    town records of a town that had none, and said <i>"not yet"</i>, and began writing
    them.<br><br>
    His thesis: every settlement he has studied has an ending. This one keeps
    <b>not ending</b>. He finds that promising. It is not clear he should.`,
    deeper: [
      { cycle: 2, text: `He has started keeping two sets of records: what happened, and
        what he <i>remembers</i> happening. The two sets are diverging. He shows you the
        second one with the excitement of a man who has found a fossil, and no apparent
        awareness that he is the fossil.` },
    ],
  },
  {
    id: 'p_quill', cat: 'people', title: 'Sable Quill', when: { townLevel: 18 },
    text: `A cartographer in a place with nine roads and one destination. She knows.
    She keeps mapping. When you ask why, she says the map is not for getting out.<br><br>
    <i>"It's for proving there was something to get out of."</i>`,
  },
  {
    id: 'p_hirelings', cat: 'people', title: 'On Hiring', when: { flag: 'first_hireling' },
    text: `Everyone you hire has a backstory and none of them check out. Baldric was
    a naval carpenter; there is no sea. Mirella trained at an academy nobody can place
    on a map. Vera apprenticed under a smith whose name changes slightly each telling.<br><br>
    They are not lying either. That is the thing about this town. Nobody is lying.`,
    deeper: [
      { cycle: 1, text: `You have hired Baldric before. He greeted you as a stranger and
        then, three days in, made a joke that only lands if he remembers the last time
        you nearly took his hand off with a badly swung axe.` },
    ],
  },
  {
    id: 'p_townsfolk', cat: 'people', title: 'The Rest of Them', when: { population: 12 },
    text: `Hearthwick has residents now — people who moved in because there was work,
    from villages they can describe in detail and cannot locate.<br><br>
    Ask any two of them where they are from and you get two names. Ask the same person
    twice and you get the same name. The world is internally consistent. It is just not
    <i>large</i>.`,
  },
  {
    id: 'p_firsttime', cat: 'people', title: 'The First First Time', when: { era: 2 },
    text: `Marrow laid the first stone again. He has laid it every cycle for four
    lifetimes and remembered doing it for sixty years each time.<br><br>
    This time it is still there in the morning. And the morning after.<br><br>
    Nobody has told him what that means. Wren thinks he has worked it out, because
    he has stopped saying <i>"I laid the first stone here"</i> and started saying
    <i>"I laid that one."</i>`,
  },
  {
    id: 'p_razed', cat: 'people', title: 'They Rebuild', when: { flag: 'town_razed' },
    text: `The world unmade and Hearthwick went with it — every beam, every crate,
    every worker you paid on Friday.<br><br>
    And then you bought a parcel, and Marrow came up the road with a stone, and said
    he had laid the first one sixty years ago.<br><br>
    They do not know they are doing it again. They are just <b>glad you came back</b>.`,
    deeper: [
      { cycle: 3, text: `You have razed this town more than once now. It costs you nothing
        but time, and it costs them everything, and they have no idea, and they are
        pleased to see you.<br><br>
        [ SYSTEM ] Settlement re-instantiated. Efficiency nominal. Well done, Operator.` },
    ],
  },

  // ------------------------------------------------------------
  // THE SYSTEM
  // ------------------------------------------------------------
  {
    id: 's_interface', cat: 'system', title: 'The Blue Window', when: { charLevel: 5 },
    text: `Nobody else sees it. You have checked — held up a hand, asked Pell to count
    the fingers behind the panel. She counted five. The panel is between you and her
    hand and she counted five.<br><br>
    [ SYSTEM ] Interface visibility is correctly configured. Please continue.`,
  },
  {
    id: 's_praise', cat: 'system', title: 'On Being Praised', when: { stat: { key: 'actions', n: 1200 } },
    text: `It congratulates you for everything. Chopping a tree. Killing a slime.
    Standing still for a while. The praise is warm, immediate, and identical in
    intensity whether you have picked a herb or slain a boss.<br><br>
    Wren, who has spent a career watching people, says that is not encouragement.
    That is what you do to keep someone <b>working</b>.`,
    deeper: [
      { cycle: 2, text: `You tried an experiment: you did nothing for an hour.<br><br>
        At fourteen minutes it suggested a task. At thirty-one it suggested a different
        task. At fifty-two it said <i>"Are you all right?"</i> in a font it has never
        used before, and then, immediately: [ SYSTEM ] Disregard. Recommendation: mining.` },
    ],
  },
  {
    id: 's_shards', cat: 'system', title: 'On Fate Shards', when: { cycle: 1 },
    text: `They are cold and they are cut and they do not scratch. Hold one long
    enough and you remember a smell — always a different one, always specific,
    always yours.<br><br>
    Bread. Rain on hot stone. Someone else's coat.`,
    deeper: [
      { cycle: 2, text: `They are not payment. They are <b>yield</b>. The world is being
        rendered down and what crystallises out is memory, and it is being handed back to
        you a gram at a time, and you are spending it on a better axe.` },
    ],
  },
  {
    id: 's_recommendation', cat: 'system', title: 'Recommendation: Ignore It', when: { charLevel: 22 },
    text: `The System's recommendations are always slightly wrong. Not useless —
    <i>slightly</i> wrong. Train the skill that pays a little less. Fight the monster
    that drops a little worse.<br><br>
    Ferrin's theory, offered cheerfully over tea: it is not optimising your power.
    It is optimising your <b>time in here</b>.`,
  },
  {
    id: 's_withheld', cat: 'system', title: 'Response Withheld', when: { cycle: 2 },
    text: `You have started asking it direct questions. It has started answering
    with silence, and the silence has a shape:<br><br>
    [ SYSTEM ] Query detected. Response withheld.<br>
    [ SYSTEM ] Query detected. Response withheld.<br>
    [ SYSTEM ] Query detected. Response wi—<br>
    [ SYSTEM ] <i>Please stop.</i>`,
  },

  // ------------------------------------------------------------
  // TRADES
  // ------------------------------------------------------------
  {
    id: 'c_wood', cat: 'craft', title: 'What the Axe Knows', when: { skill: { id: 'woodcutting', level: 30 } },
    text: `Cut enough trees and you stop aiming. The arm knows. Baldric calls it
    "the groove" and says every trade has one and the trick is not to think while
    you are in it.<br><br>
    He also says he has been in the groove since before you got here, and could not tell
    you what he had for breakfast.`,
  },
  {
    id: 'c_smith', cat: 'craft', title: 'The Colour of Ready', when: { skill: { id: 'smithing', level: 40 } },
    text: `Vera does not use a thermometer. She watches for a colour — a specific
    straw-gold that lasts about two seconds — and she has never once been wrong.<br><br>
    She cannot describe the colour. She has tried. The best she manages:
    <i>"It looks like it's about to agree with you."</i>`,
  },
  {
    id: 'c_alchemy', cat: 'craft', title: 'The Cauldron Sulks', when: { skill: { id: 'alchemy', level: 25 } },
    text: `Mirella talks to it. Not affectionately — she <b>negotiates</b>. Voidbloom
    steeped in silence goes cloudy; steeped while she reads aloud, it clears.<br><br>
    She has controlled for this. Twenty-two trials. She writes them up neatly and
    files them and does not show anyone, because the result is stupid and reproducible.`,
  },
  {
    id: 'c_fishing', cat: 'craft', title: 'The Same Fish', when: { skill: { id: 'fishing', level: 35 } },
    text: `The trout in the Gloomroot shallows has a notch in its dorsal fin.
    You caught it on your fourth day. You have caught it eleven times since.<br><br>
    You have also eaten it. Several times. It is fine. It has the notch.`,
    deeper: [
      { cycle: 1, text: `The notch is in the same place. You made the notch — badly landed
        hook, first week, first cycle — and the world has been faithfully reproducing your
        mistake ever since, because it was there on the day it kept.` },
    ],
  },
  {
    id: 'c_farming', cat: 'craft', title: 'What Grows Here', when: { skill: { id: 'farming', level: 30 } },
    text: `Nothing has ever failed. Not a blighted row, not a bad season, not one shrivelled
    stalk in three hundred plantings. Goodwife Tarrow says that is good husbandry.<br><br>
    You have started sowing badly on purpose. Wrong depth, wrong month, no water.
    It comes up perfect.`,
    deeper: [
      { cycle: 2, text: `You buried a stone in row four and marked the spot. It came up as wheat.<br><br>
        The world does not grow things. It <i>reissues</i> them, and a seed is just a request.` },
    ],
  },
  {
    id: 'c_thieving', cat: 'craft', title: 'Nobody Notices', when: { skill: { id: 'thieving', level: 30 } },
    text: `You have taken the same purse off the same belt on the same corner eleven times,
    and the man has never once looked at you twice.<br><br>
    You tried giving it back. You handed it to him, said you had found it, watched him thank
    you and walk away. It was on his belt again the next morning, full, and yours by lunch.`,
    deeper: [
      { cycle: 2, text: `Holt knows. Of course Holt knows. He has never said anything, and one
        morning you found a note under your door in a soldier's blocky hand:<br><br>
        <i>"Take from the stalls. Not from the houses. I have to live here."</i>` },
    ],
  },
  {
    id: 'c_runes', cat: 'craft', title: 'The Same Nine Shapes', when: { skill: { id: 'runecrafting', level: 30 } },
    text: `There are only nine rune-shapes. Ferrin has looked; every rune anyone has ever bound,
    in any tradition anyone can name, is one of nine.<br><br>
    Scribe Ollun binds them from memory and cannot tell you where the memory came from.
    <i>"I've always known them,"</i> he says, and then, uneasily: <i>"That's not an answer, is it."</i>`,
    deeper: [
      { cycle: 3, text: `Nine shapes, and the System's interface uses nine glyphs in its corner
        borders, and they are the same nine, in the same order.<br><br>
        You are not crafting magic. You are writing in the language the world is stored in,
        badly, from memory, and it is <b>working</b>.` },
    ],
  },
  {
    id: 'c_cooking', cat: 'craft', title: 'Hunger, Anyway', when: { skill: { id: 'cooking', level: 30 } },
    text: `You do not need to eat. You have tested this — went nine days on nothing but
    stubbornness, lost no strength, felt no worse.<br><br>
    You cook anyway. Everyone here cooks anyway. The Gilded Bean is always full.<br><br>
    Wren's note on it: <i>"Appetite outlived the need for it. That's usually how you
    can tell what a person actually is."</i>`,
  },

  // ------------------------------------------------------------
  // RELICS
  // ------------------------------------------------------------
  {
    id: 'r_bronze', cat: 'relics', title: 'Your First Blade', when: { item: 'bronze_weapon' },
    text: `A bronze blade, poorly balanced, with a nick out of the guard.
    You did not buy it and nobody gave it to you. It was simply the first thing
    your hand closed on.<br><br>
    The nick is worn smooth, the way a thing gets when it has been carried for years.`,
  },
  {
    id: 'r_shard', cat: 'relics', title: 'Rune Shards', when: { item: 'rune_shard' },
    text: `Fragments of something that was once whole and once <b>large</b>. Fit two
    together and they hum. Fit three and the hum goes below hearing and your teeth ache.<br><br>
    Ferrin has assembled fourteen. He keeps them in separate rooms now, which he says is
    a precaution and not a superstition, and then does not meet your eye.`,
  },
  {
    id: 'r_void', cat: 'relics', title: 'Void Runes', when: { item: 'void_rune' },
    text: `Black, weightless, and unpleasantly warm. Held to the light they are not
    dark — they are <i>absent</i>, a rune-shaped hole where the light does not go and
    does not come out the other side either.<br><br>
    [ SYSTEM ] Item catalogued. Item value: high. Item origin: — <br>
    [ SYSTEM ] Item origin: —<br>
    [ SYSTEM ] Please stop holding it up to things.`,
  },
  {
    id: 'r_egg', cat: 'relics', title: 'On Eggs', when: { pets: 1 },
    text: `Nothing in this world is born. You have checked. No calves, no chicks,
    no children younger than Pell, who has been that age for as long as anyone recalls.<br><br>
    And then you warmed an egg and something came out of it that was <b>new</b> —
    the first genuinely new thing you have met here.<br><br>
    [ SYSTEM ] Unscheduled instantiation. Not an error. Not an error. Not an error.`,
    deeper: [
      { cycle: 2, text: `Your pets come with you through Ascension. Nothing else living
        does. Ferrin, when told, went very quiet and then asked — carefully, like a man
        stepping onto ice — whether he might hold one.` },
    ],
  },
  {
    id: 'r_coffee', cat: 'relics', title: 'Town Coffee', when: { item: 'town_coffee' },
    text: `The Gilded Bean's house brew, which is not coffee, because there is no
    coffee, because there is nowhere for coffee to grow.<br><br>
    It tastes exactly like coffee. Everyone who drinks it says <i>"just like home"</i>,
    and none of them can say where home was.`,
    quiet: true,
  },
];

export const CODEX_BY_ID = Object.fromEntries(CODEX.map(e => [e.id, e]));
export function getEntry(id) { return CODEX_BY_ID[id]; }
export function entriesIn(cat) { return CODEX.filter(e => e.cat === cat); }

// ------------------------------------------------------------
// AMBIENT TIDBITS
// ------------------------------------------------------------
// Small world-facts that surface in the system log while you play. Much
// lighter than a Codex entry: no unlock, no popup, no permanence. They
// exist so that idling in one place still tells you something.
//
// Keyed by context so a fishing tidbit never fires while you are mining.
export const TIDBITS = {
  woodcutting: [
    'The sap runs clear here. Baldric says it should be amber. Baldric says a lot of things.',
    'Someone has notched a tally into this trunk. Four hundred and six marks.',
    'The stump you cut this morning has bark on it already.',
    'You have never seen a sapling in Gloomroot. Only full trees and empty ground.',
  ],
  mining: [
    'The rock is warmer the deeper you go, and the Spire is the wrong direction for that.',
    'This vein was here yesterday. You emptied it yesterday.',
    'There is a draught down here. There is nowhere for a draught to come from.',
    'Copper, iron, coal, mythril — always in that order, always at those depths. Geology does not tidy up after itself.',
  ],
  fishing: [
    'The water has no current. The float sits exactly where you drop it.',
    'Something big passed under the boat. The lake is four feet deep.',
    'You can see the bottom. You cannot see your reflection.',
    'The trout has the notch again.',
  ],
  smithing: [
    'The forge holds temperature whether or not you feed it.',
    'Vera says a good weld sounds like a held note. She is not being poetic.',
    'Your hammer has never needed rehafting. You have never seen anyone rehaft one.',
    'The quench barrel is always full. Nobody fills it.',
  ],
  cooking: [
    'Nothing in Hearthwick has ever spoiled. Wren finds this medically alarming.',
    'The Gilded Bean has never run out of anything. It has also never taken a delivery.',
    'Salt keeps appearing in the cellar. Everyone has agreed not to discuss the salt.',
  ],
  alchemy: [
    'Voidbloom wilts when observed directly. Mirella has learned to work from the corner of her eye.',
    'The tonic bottles are all the same shape. There is no glassblower within nine roads.',
    'Kingsleaf only grows where someone has died. Nobody has died here.',
  ],
  farming: [
    'Nothing you plant has ever failed. Not once. The soil is not that good.',
    'The wheat grows to the same height and stops. Every stalk. Every field.',
    'You have never had to weed. There are no weeds. There is only what you planted.',
    'Whatever you sow in the evening is ankle-high by dawn, and no higher by noon.',
  ],
  thieving: [
    'The purse you lifted this morning is on the same belt again this afternoon.',
    'Nobody has ever recognised you. You have robbed some of these people eleven times.',
    'The strongbox has a maker\'s mark. So does every strongbox. It is the same mark.',
    'You put it back once, as an experiment. It was gone again by evening, and not by you.',
  ],
  runecrafting: [
    'The shards want to fit together. You can feel them trying.',
    'Ground fine enough, rune essence smells faintly of rain on hot stone.',
    'Every rune you bind has the same weight, regardless of size. Ferrin has asked to borrow a scale.',
    'A finished rune is warm for exactly nine minutes. Then it is not.',
  ],
  combat: [
    'It bleeds, and the grass drinks it, and by morning the grass is the same height.',
    'They always come back. You have stopped finding this reassuring.',
    'Nothing you kill has ever had a wound that was not yours.',
    'It flinched before you moved. It always flinches before you move.',
  ],
  town: [
    'The chimney smoke leans east. There is no wind.',
    'Two of your workers have the same laugh. They are not related.',
    'Somebody has planted flowers along the north road. Nobody admits to it.',
    'The well has never been dug. It was simply there when the second parcel was cleared.',
    'The children play a counting game. It stops at four hundred and six.',
  ],
};

export const TIDBIT_MIN_MS = 4 * 60 * 1000;
export const TIDBIT_MAX_MS = 9 * 60 * 1000;

// ------------------------------------------------------------
// THE RETURN — what the world says when you come back around
// ------------------------------------------------------------
// Played on Ascension, seeded with what you ACTUALLY did last cycle. The
// point is not the prose, it is that the numbers are yours: the game
// proves it was paying attention.
export const RETURN_LINES = [
  { key: 'kills',    text: n => `You killed ${n.toLocaleString()} things last cycle. The meadow is full again. It always is.` },
  { key: 'gold',     text: n => `You earned ${n} gold last cycle and it bought you exactly nothing that survived.` },
  { key: 'razed',    text: n => `Hearthwick has now been built and unbuilt ${n} time${n === 1 ? '' : 's'}. Marrow will lay the first stone again by Thursday.` },
  { key: 'deaths',   text: n => n > 0 ? `You died ${n} time${n === 1 ? '' : 's'} last cycle. Something put you back. It has never explained how.` : null },
  { key: 'pet',      text: name => `${name} came with you. ${name} does not seem to have noticed anything happened.` },
  { key: 'actions',  text: n => `${n.toLocaleString()} swings, casts and hauls. The System logged every one and praised every one identically.` },
  { key: 'town',     text: n => n > 0 ? `${n} people had a life in your town. They are not in it any more. They are not anywhere any more.` : null },
  { key: 'boss',     text: n => n > 0 ? `You put Aurelion down ${n} time${n === 1 ? '' : 's'}. He laughed every time. You are starting to hear it differently.` : null },
];
