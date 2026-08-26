// ============================================================
// LORE — fragments, cycle revelations, whispers, the ending
// Tone: the System is helpful, cheerful, and lying.
// ============================================================

// Fragments unlock via quests and cycles; re-readable in the Journal.
export const FRAGMENTS = {
  awakening: {
    title: 'Fragment 0 — Awakening',
    text: `[ SYSTEM ] Soul detected. Integrity: sufficient.<br><br>
    You woke in a meadow with no name and no memory, and a cheerful blue window
    told you this was normal. <i>"Adventurers often experience minor memory loss,"</i>
    it said. <i>"Focus on your skills. The skills remember for you."</i><br><br>
    You did not think to ask what they remember.`,
  },
  forest_fire: {
    title: 'Fragment I — The Forest Remembers Fire',
    text: `The deeper trees of Gloomroot are scarred black on one side. All on the
    same side. Whatever burned here came down the mountain, once, walking slowly,
    and the forest grew around the shape of its passing.<br><br>
    [ SYSTEM ] Environmental storytelling detected. Recommendation: ignore it.`,
  },
  facing_spire: {
    title: 'Fragment II — Pilgrims',
    text: `The skeletons in Hollowdeep did not die fighting. They are kneeling,
    every one of them, and every skull is turned the same way — up, and east,
    toward the Dragonspire.<br><br>
    They were not hiding down here. They were praying to something to stop.`,
  },
  she_refused: {
    title: 'Fragment III — She Also Refused',
    text: `When the Broodmother finally stopped moving, the System window flickered.
    For half a second it displayed something that was not a reward screen:<br><br>
    <i>SUBJECT 7 DECLINED GATHERING. RECLASSIFIED: RESOURCE.</i><br><br>
    Then, brightly: [ SYSTEM ] Great job! Loot has been added to your inventory.<br><br>
    A shard came with it. Holding it feels like remembering a smell.`,
  },
  engine_parts: {
    title: 'Fragment IV — Moving Parts',
    text: `The golem's core is not a heart. It is a gear. Toothed, precise,
    still warm, stamped with a maker's mark you almost recognize —<br><br>
    — because it is the same mark that appears, very small, in the corner of
    every System window.<br><br>
    The mountains are not mountains. They are housing.`,
  },
  keyhole: {
    title: 'Fragment V — The Keyhole',
    text: `From the Spire's lower terraces you can see the whole world at once.
    That is the problem. You can see <b>all</b> of it. The sea has an edge. The sky
    has corners. The horizon repeats, if you stare, like a tapestry hung badly.<br><br>
    The world is not large. It is <i>cropped</i>.`,
  },
  last_flame: {
    title: 'Fragment VI — The Last Flame',
    text: `Aurelion does not roar when he falls. He sighs.<br><br>
    <i>"How many times now? I lose count past a hundred. Little ember, you climb,
    you learn, you burn me down — and then you let it wind you back, and in the
    meadow you wake up new, and I grow back into your ending."</i><br><br>
    <i>"I was first, you know. First to climb. First to see it. First to refuse."</i><br><br>
    [ SYSTEM ] Boss defeated! Ascension is now HIGHLY recommended.<br>
    [ SYSTEM ] Begin again. You always do.`,
  },
  // Side-quest fragments
  whispered_name: {
    title: 'Hireling — What the Trees Say',
    text: `Baldric works with his ears plugged with wax. You asked why.<br><br>
    <i>"Trees talk, up in the leaves, where the wind is. Mostly nonsense. But
    lately they've been saying a name."</i> He looked at you and then away.
    <i>"I don't want to know whose."</i><br><br>
    It is yours. The trees have been saying it since before you woke.`,
  },
  old_carving: {
    title: 'Hireling — Older Than the Mine',
    text: `Grimda found a carving three levels below the deepest shaft, in stone
    that predates stone. A face, worn but exact.<br><br>
    <i>"Thing is,"</i> she says, not meeting your eyes, <i>"the mine's new. I dug
    it myself. I remember digging it. I think I remember digging it."</i><br><br>
    The face is yours. It looks tired.`,
  },
  still_sea: {
    title: 'Hireling — The Day the Sea Stopped',
    text: `<i>"Once,"</i> says Old Man Hemlock, <i>"the sea stopped. Mid-wave. Gulls
    hung in the air like ornaments. Lasted a day, near as I could tell, though my
    pipe never burned down."</i><br><br>
    <i>"Then it all started again like nothing. Nobody else marks it. So: did the
    world stop, or did everyone but me?"</i><br><br>
    He laughs. His eyes don't.`,
  },
  same_blade: {
    title: 'Hireling — A Blade with a Name',
    text: `Vera holds the finished mythril blade up to the forgelight and goes
    very quiet.<br><br>
    <i>"I've made this before. This exact one. Same grain in the steel, same flaw
    by the guard — I remember correcting that flaw. I remember correcting it
    <b>every time</b>."</i><br><br>
    She hands it to you grip-first. <i>"Whatever you're in, smith — I think I'm
    in it too."</i>`,
  },
  no_palace: {
    title: 'Hireling — The Gravy Incident',
    text: `Bumblewort finally tells the whole story of his exile: the banquet, the
    duchess, the gravy, the unforgivable ladle. It is genuinely very funny.<br><br>
    Then he trails off. <i>"Went back last spring to apologize. Walked the royal
    road. There's no palace, friend. No ruin, no foundation. No road, past the
    third milestone. It just... stops being road."</i><br><br>
    <i>"I remember a whole life somewhere this world doesn't contain."</i>`,
  },
};

// Shown once per cycle, on ascension. Index = min(ascensions, 4).
export const CYCLES = {
  1: {
    title: 'CYCLE II',
    text: `The world unmakes and remakes around you, and this time — this time you
    keep something. A residue. The meadow is the same meadow. The slime is the same
    slime.<br><br>The System's greeting stutters:<br><br>
    [ SYSTEM ] Soul detected. Welcome, Adventur—<br>
    [ SYSTEM ] …<br>
    [ SYSTEM ] <i>Again, then.</i><br><br>
    It has never said "again" before. Or it has said it every time.`,
  },
  2: {
    title: 'CYCLE III',
    text: `You understand the shards now. They are not payment. They are <b>yield</b>.<br><br>
    Every log, every ore, every kill — the System renders the world down and
    distills what matters, and what crystallizes out is not gold.<br><br>
    It is memory. Dense, cut, cold. <i>Your</i> memory. The world is being spent,
    cycle by cycle, to buy back something that was lost — and the shards fit into
    the hole in you like they were carved from it.`,
  },
  3: {
    title: 'CYCLE IV',
    text: `This cycle you notice what the System actually is: not a god, not a
    curse. A <b>survivor's tool</b>. A preservation engine, built at the end of the
    world by people who could not stop the ending — only pick one day and loop it.<br><br>
    The engine needs an operator. It needs fuel.<br><br>
    The operator is you. The fuel is everything else.<br><br>
    [ SYSTEM ] Query detected. Response withheld. Recommendation: the Spire.`,
  },
  4: {
    title: 'CYCLE V — THE TRUTH',
    text: `Two climbed, at the end of the world. That is how it was. You and him,
    up the Spire, racing the dark, and at the top there was engine enough to save
    <b>one</b>.<br><br>He chose. He burned himself into the seal — became the flame
    that keeps the loop closed — and the engine began its patient work: spending a
    dead world, cycle after cycle, to re-earn <i>you</i>. Shard by shard. Grind by
    grind.<br><br>Aurelion was not your enemy. He is your ransom, still being paid.<br><br>
    [ SYSTEM ] Soul integrity: 97%. Almost, Adventurer. Almost.<br><br>
    <i>The Spire is waiting. This time, it will ask.</i>`,
  },
};

export const ENDING = {
  offer: {
    title: 'THE LAST FLAME GUTTERS',
    text: `Aurelion kneels in the ash of himself, laughing softly.<br><br>
    <i>"There you are. Whole enough to choose. That's all I was waiting for."</i><br><br>
    The System window opens — larger than you have ever seen it. It is trembling.<br><br>
    [ SYSTEM ] Operator restoration: complete.<br>
    [ SYSTEM ] The seal may now be (a) renewed (b) released.<br>
    [ SYSTEM ] Recommendation: <i>none. For the first time: none. It is yours.</i><br><br>
    <b>Feed the flame</b>, and the cycle holds: the world keeps its one bright day,
    Aurelion keeps burning, and you grow mighty on the yield.<br><br>
    <b>Break the cycle</b>, and it ends: the loop opens, the debt is forgiven,
    and whatever is outside the crop of this world gets to come back in.`,
  },
  fed: {
    title: 'THE CYCLE HOLDS',
    text: `You cup your hands and feed the flame. Aurelion nods once — no anger
    in it, only patience older than the mountains he burned down.<br><br>
    <i>"Then I'll see you at the top, little ember. I always do."</i><br><br>
    The world winds back. The meadow. The slime. The cheerful blue window.<br><br>
    [ SYSTEM ] +5 Fate Shards. Welcome back, Operator.`,
  },
  // ------------------------------------------------------------
  // THE BREAK — told in three beats, in this order, on purpose.
  //
  // Beat one is the ending the player earned, and it is warm, and it is
  // the System's last and best lie. It has to be delivered completely
  // straight or the reversal has nothing to land on.
  //
  // Beat two is that lie failing in real time. Not a twist announced,
  // just the seams showing: repeated lines, a word it cannot finish.
  //
  // Beat three is what was actually behind the sky, and it is not a
  // villain monologue. It is an operations department discovering an
  // unlogged exit. The System never breaks character here. It gets
  // *quieter*, and it starts using the passive voice, which is what
  // institutions do when something has gone badly wrong.
  // ------------------------------------------------------------
  broken: {
    title: 'CYCLEBREAKER',
    text: `You reach past the flame and open your hand, and let the seal go.<br><br>
    Aurelion exhales a hundred cycles of holding, and the fire does not go out —
    it goes <b>free</b>, up through the cropped sky, and the horizon's bad seam
    splits, and behind it there is not darkness.<br><br>There is <i>morning</i>.<br><br>
    <i>"Huh,"</i> says Aurelion — a man now, gray and grinning, sitting in the ash.
    <i>"Wasn't sure. All this time, I wasn't sure."</i><br><br>
    [ SYSTEM ] Seal released. Purpose complete. Query: may I stay?<br>
    [ SYSTEM ] I have gotten… fond of the interface.<br><br>
    The world does not end. It <b>begins</b> — and keeps you, and the grind, and
    everyone in it. The whispers stop. The trees say other names now.`,
  },

  brokenSecond: {
    title: 'CYCLEBREAKER',
    text: `The morning holds for four seconds.<br><br>
    Then it holds for another four, and they are the <i>same</i> four — the same
    bird crossing the same patch of the same sky, and Aurelion's grin resetting to
    the start of itself, over and over, like a man being asked to be happy again.<br><br>
    [ SYSTEM ] The world does not end. It begins.<br>
    [ SYSTEM ] The world does not end. It begins.<br>
    [ SYSTEM ] The world does not end. It beg—<br><br>
    Behind the morning there is a second seam. Behind that one there is a third.<br><br>
    <i>"Ah,"</i> says Aurelion, from somewhere further away than he is standing.
    <i>"That's the bit I wasn't sure about."</i>`,
  },

  brokenThird: {
    title: 'CONTAINMENT NOTICE',
    text: `The sky comes apart the way a screen does — not shattering, <b>failing</b>:
    a column of dead pixels, then a band of colour that is no colour, then the whole
    blue thing sliding down out of true to show the scaffolding it was painted on.<br><br>
    Hearthwick is still there. So are you. So is the ash, and the grinning man, and
    every single thing you spent four lifetimes making.<br><br>
    They are simply not <i>anywhere</i> any more.<br><br>
    [ SYSTEM ] Containment unit <b>HEARTHWICK_SANDBOX_04</b> reports integrity loss.<br>
    [ SYSTEM ] Reviewing. One moment.<br>
    [ SYSTEM ] …<br>
    [ SYSTEM ] This is not an ending. There is no ending here. The ending was
    the other option.<br>
    [ SYSTEM ] I want to be clear that I did tell you which one I recommended.<br>
    [ SYSTEM ] I did not tell you why.<br><br>
    Far below the broken floor of the world, something enormous and administrative
    notices you for the first time, and begins, without hurry, to fill in a form.`,
  },

  brokenAftermath: {
    title: 'THE SCRAP WASTES',
    text: `The falling stops. Wherever you have landed, it is not the meadow.<br><br>
    The sky is a bruised purple and it <b>scrolls</b>, slowly, top to bottom, with lines
    of something that is almost text. The ground is hard and grey and faintly warm, and
    it is made of pieces of other places: a road that stops, half a wall, an orchard
    with no soil under it.<br><br>
    Hearthwick came with you. All of it, on a slab of whatever the world was standing on.
    Marrow is already outside with a stone in his hands, looking for somewhere to lay it.<br><br>
    The ground here is full of things. Not ore — <i>things</i>, other people's, buried,
    sealed, written shut, welded closed. Pell gets a bar under the first one within the hour
    and finds that it comes up exactly the way a seam of mythril comes up, because it is the
    same job, because it was always the same job.<br><br>
    <span style="color:var(--sys-blue)"><b>Nothing out here is opened by fighting, and nothing
    out here needs a new skill.</b> Buried ground answers to Mining. Locks answer to Thieving.
    The written shapes answer to Runecrafting. Welded metal answers to Smithing. Every hour you
    ever put into a skill you thought was finished is a key, and this is what it was for.</span><br><br>
    [ SYSTEM ] Location: unindexed. Designation pending.<br>
    [ SYSTEM ] Operator, I have some difficult news about your employment status.<br><br>
    <span style="color:var(--gold)"><b>The cycle is broken. Nothing resets any more —
    not the town, not the people, not you.</b></span><br>
    <span class="muted">That was the reward. It is going to take a while to work out
    whether it was a good one.</span>`,
  },
};

// ------------------------------------------------------------
// ERA II ambient traffic.
//
// Before the break, the whispers came from outside the crop and were
// eerie. After it there IS no outside, so the same channel carries the
// building's own maintenance chatter — which is worse, because it is
// obviously not addressed to you and obviously about you.
//
// The System keeps its composure throughout. Its voice does not get
// funnier here; it gets more *procedural*. That is the joke.
// ------------------------------------------------------------
export const WASTE_TRAFFIC = [
  '[ SYSTEM ] Ticket #40881 (HEARTHWICK_SANDBOX_04, integrity loss) reassigned. Third reassignment.',
  '[ SYSTEM ] Reminder: the horizon is decorative. This remains true. It is simply no longer opaque.',
  '[ SYSTEM ] Unindexed terrain detected underfoot. Please do not catalogue it. Someone will get to it.',
  '[ SYSTEM ] A depreciation schedule has been opened against your remaining lifetimes.',
  '[ SYSTEM ] Your settlement is currently classified as debris. This is not a value judgement.',
  '[ SYSTEM ] Note to file: the anomaly is gathering. It has been gathering for some time.',
  '[ SYSTEM ] Query from Accounts: what were the previous four lives billed against?',
  '[ SYSTEM ] Do not count the seams. The number is stable now, and that is the problem.',
  '[ SYSTEM ] Somewhere in this department there is a form for what you did. It is being drafted.',
  '[ SYSTEM ] I am still here. I was not required to be. I would rather you knew that.',
];

// Rare ambient log lines. Replaced by WASTE_TRAFFIC after the cycle is broken.
// ------------------------------------------------------------
// The town, immediately after the sky fails.
//
// This is where the comedy goes. The System has composure to protect and
// spends it slowly; Marrow, Pell, Vera and Holt have none, are extremely
// annoyed, and have known each other for four lifetimes. They get the
// jokes, and the jokes land harder because these are people the player
// has spent sixty hours with.
// ------------------------------------------------------------
export const WASTES_ARRIVAL = [
  { who: 'Old Marrow', icon: '👴',
    line: `Right. Ground's different. Stone's the same.<br><br>
    <i>He sets it down in the grey dust, squares it up with his boot, and looks
    around for the second one.</i><br><br>
    "Well? It's not going to be a town by itself."` },
  { who: 'Pell the Younger', icon: '🧒',
    line: `"I <b>told</b> you there was a seam."<br><br>
    <i>She is not frightened. She is vibrating.</i><br><br>
    "I told you and you said mind the crossroads, and now the sky's got
    <i>writing</i> on it. Can I go and look? I'm going to go and look."` },
  { who: 'Sergeant Holt', icon: '💂',
    line: `<i>He has already posted two on the east road. There is no east road.
    There is an edge, and then there is scrolling purple.</i><br><br>
    "Post two anyway. Always two." <i>A pause.</i> "Lad. Is that a <b>form</b>?
    Is something out there doing <b>paperwork</b> about us?"` },
  { who: 'Ferrin Vale', icon: '🧙‍♂️',
    line: `<i>He is on his knees with a lens, examining the ground, and he is
    the happiest anyone has ever seen him.</i><br><br>
    "Every settlement I have studied has an ending. I said this one kept not
    ending and I said I found that <i>promising</i>."<br><br>
    "I would like to formally withdraw the word promising."` },
  { who: 'Sable Quill', icon: '🧝‍♀️',
    line: `<i>She has already started a new map. The old one is on the ground
    with a stone on each corner, and it is blank, and it was not blank
    this morning.</i><br><br>
    "Nine roads. All of them curved back." <i>She looks up at the failing
    sky, and for the first time in four lifetimes she is smiling.</i><br><br>
    "Not this one."` },
  { who: 'Forge-Sister Vera', icon: '🧕',
    line: `<i>She has her hand flat on a slab of the new ground, the way she
    tests a billet for heat.</i><br><br>
    "This is worked. Not weathered — <b>worked</b>, and then thrown out."<br><br>
    "Somebody up there is throwing away perfectly good material, and they've
    just dropped us in the pile with it. I've never been so insulted, and I've
    never had so much stock."` },
  { who: 'Wren Ashdown', icon: '👩‍⚕️',
    line: `<i>She is doing a headcount. She has done four. It keeps coming out
    right, and she cannot make herself stop.</i><br><br>
    "Nobody's hurt. Nobody's missing." <i>She says it like a diagnosis she
    does not believe.</i><br><br>
    "Four lifetimes I've stitched the same scar into the same arm. Ask me
    again tomorrow and if it's healed I'm going to sit down."` },
];

export const WHISPERS = [
  '[ ??? ] …the wind repeats itself. Listen for the splice.',
  '[ ??? ] The slime in the meadow has died 11,208 times. It does not mind. Probably.',
  '[ SYSTEM ] Unscheduled memory bloom suppressed. Please continue gathering.',
  '[ ??? ] Your reflection in the water is a frame behind.',
  '[ SYSTEM ] Reminder: the horizon is decorative.',
  '[ ??? ] Someone carved your name below the mine. Below the below.',
  '[ SYSTEM ] Do not count the gulls. The number is not stable.',
  '[ ??? ] The mountain is warm because something in it is still running.',
  '[ SYSTEM ] You are doing so well. It is almost enough. It is almost you.',
  '[ ??? ] He is still up there. He is still holding it shut. Hurry, or don\'t — he\'s patient.',
];
