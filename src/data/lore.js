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
    everyone in it. The whispers stop. The trees say other names now.<br><br>
    <b>CYCLEBREAKER: all yields +10%, forever. The System works for you now.</b>`,
  },
};

// Rare ambient log lines. Stop after the cycle is broken.
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
