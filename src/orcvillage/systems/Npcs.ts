export type NpcRarity="Common"|"Uncommon"|"Rare"|"Exotic"|"Legendary"|"Mythic";
export interface Npc {id:number;name:string;age:string;bio:string;quote:string;category:number;frame:string;rarity:NpcRarity}
export const npcs:Npc[]=[
  {
    "id": 1,
    "name": "Barnaby Crumbs",
    "age": "54",
    "bio": "Baker who refuses to bake anything smaller than a wagon wheel.",
    "quote": "\"If you break a tooth on my sourdough, that's a free workout for your jaw, green-skin.\"",
    "category": 0,
    "frame": "npc-001",
    "rarity": "Common"
  },
  {
    "id": 2,
    "name": "Mabel Thistlewick",
    "age": "68",
    "bio": "Sells cabbages she claims are \"blessed by mild inconvenience.\"",
    "quote": "\"Buy three cabbages and I'll throw in a fourth that looks slightly like your uncle.\"",
    "category": 0,
    "frame": "npc-002",
    "rarity": "Rare"
  },
  {
    "id": 3,
    "name": "Garrick Iron-Thumb",
    "age": "41",
    "bio": "Blacksmith who lost his real thumb and replaced it with a brass bell.",
    "quote": "\"Hold still while I measure your shoulders—I've never forged breastplate for a walking wardrobe.\"",
    "category": 0,
    "frame": "npc-003",
    "rarity": "Common"
  },
  {
    "id": 4,
    "name": "Pippa Copperkettle",
    "age": "23",
    "bio": "Apprentice alchemist whose eyebrows grow back in different colors.",
    "quote": "\"Don't drink the purple one unless you enjoy tasting Wednesdays.\"",
    "category": 0,
    "frame": "npc-004",
    "rarity": "Uncommon"
  },
  {
    "id": 5,
    "name": "Old Man Fenwick",
    "age": "82",
    "bio": "Sits on a barrel counting passing clouds and charging a toll for shade.",
    "quote": "\"You're blocking forty percent of my afternoon sky, Orc. That'll be two coppers.\"",
    "category": 0,
    "frame": "npc-005",
    "rarity": "Rare"
  },
  {
    "id": 6,
    "name": "Tilly Loomwright",
    "age": "35",
    "bio": "Tailor who secretly sews pockets full of dried peas into noblemen's coats.",
    "quote": "\"I can reinforce those leather straps, though I won't touch whatever you've got living in your boots.\"",
    "category": 0,
    "frame": "npc-006",
    "rarity": "Common"
  },
  {
    "id": 7,
    "name": "Humphrey Gilded-Tooth",
    "age": "49",
    "bio": "Banker who insists on biting every coin, even copper ones.",
    "quote": "\"Your gold smells like swamp mud and goblin regret. Deposit accepted.\"",
    "category": 0,
    "frame": "npc-007",
    "rarity": "Uncommon"
  },
  {
    "id": 8,
    "name": "Greta Turnip-Chucker",
    "age": "31",
    "bio": "Tavern bouncer who once threw a drunken dwarf onto a roof.",
    "quote": "\"Keep your tusks out of the ale casks and your axe off the tables, and we'll get along fine.\"",
    "category": 0,
    "frame": "npc-008",
    "rarity": "Exotic"
  },
  {
    "id": 9,
    "name": "Cedric Ink-Stain",
    "age": "29",
    "bio": "Cartographer whose maps always include a fake island named after himself.",
    "quote": "\"I'll mark the orc camps on your map, though I spelled 'pillage' wrong twice.\"",
    "category": 0,
    "frame": "npc-009",
    "rarity": "Common"
  },
  {
    "id": 10,
    "name": "Bramwell Hogg",
    "age": "46",
    "bio": "Pig farmer convinced his prize sow can predict the weather.",
    "quote": "\"Bessy snorted twice to the left—means rain by dusk, or she's got a turnip stuck again.\"",
    "category": 0,
    "frame": "npc-010",
    "rarity": "Uncommon"
  },
  {
    "id": 11,
    "name": "Wanda Wick-Dipper",
    "age": "61",
    "bio": "Candlemaker who molds wax into the shapes of local criminals.",
    "quote": "\"Want a candle shaped like the tax collector? Burns slow and smells faintly of lard.\"",
    "category": 0,
    "frame": "npc-011",
    "rarity": "Common"
  },
  {
    "id": 12,
    "name": "Oswin Pebble-Kicker",
    "age": "19",
    "bio": "Town crier who lost his voice and now communicates via aggressive mime.",
    "quote": "\"Ahem—[violently points at the notice board and mimics a goblin exploding].\"",
    "category": 0,
    "frame": "npc-012",
    "rarity": "Common"
  },
  {
    "id": 13,
    "name": "Mirella Fizz-Pot",
    "age": "38",
    "bio": "Tea merchant who brews leaves using swamp gas vents.",
    "quote": "\"Sit down, big fella. You look like someone who needs chamomile and a twenty-minute nap.\"",
    "category": 0,
    "frame": "npc-013",
    "rarity": "Rare"
  },
  {
    "id": 14,
    "name": "Doran Plank-Splitter",
    "age": "52",
    "bio": "Carpenter allergic to sawdust, yet refuses to retire.",
    "quote": "\"Achoo! Fine timber on that club of yours. Oak? Ash? Achoo!\"",
    "category": 0,
    "frame": "npc-014",
    "rarity": "Common"
  },
  {
    "id": 15,
    "name": "Beatrice Spoon-Bender",
    "age": "44",
    "bio": "Cutlery merchant who insists bent spoons are \"ergonomic.\"",
    "quote": "\"No refunds just because you crushed the pewter mug with your pinky finger.\"",
    "category": 0,
    "frame": "npc-015",
    "rarity": "Uncommon"
  },
  {
    "id": 16,
    "name": "Neddy Mud-Hopper",
    "age": "14",
    "bio": "Orphan who charges adventurers five coins to carry a single torch.",
    "quote": "\"I ain't scared of Orcs! My cousin's dog bit a goblin once!\"",
    "category": 0,
    "frame": "npc-016",
    "rarity": "Rare"
  },
  {
    "id": 17,
    "name": "Silas Feather-Plucker",
    "age": "57",
    "bio": "Fletcher who talks to geese before stealing their tail feathers.",
    "quote": "\"Your bowstring is frayed, friend. One good tug and it'll slap your snout clean off.\"",
    "category": 0,
    "frame": "npc-017",
    "rarity": "Common"
  },
  {
    "id": 18,
    "name": "Agatha Salt-Pinch",
    "age": "73",
    "bio": "Fishmonger who claims she once arm-wrestled a sea troll.",
    "quote": "\"Fresh river carp! Only died three hours ago, mostly of natural causes!\"",
    "category": 0,
    "frame": "npc-018",
    "rarity": "Uncommon"
  },
  {
    "id": 19,
    "name": "Jasper Cork-Popper",
    "age": "33",
    "bio": "Vintner whose wine is legally classified as paint thinner in two duchies.",
    "quote": "\"One sip of my vintage will strip the rust right off your pauldrons.\"",
    "category": 0,
    "frame": "npc-019",
    "rarity": "Exotic"
  },
  {
    "id": 20,
    "name": "Nora Bell-Ringer",
    "age": "27",
    "bio": "Clocktower keeper who sets the town clock by her own stomach.",
    "quote": "\"It's half-past stew o'clock, regardless of what the sun says.\"",
    "category": 0,
    "frame": "npc-020",
    "rarity": "Common"
  },
  {
    "id": 21,
    "name": "Toby Barrel-Stave",
    "age": "40",
    "bio": "Cooper who tests barrel strength by rolling downhill inside them.",
    "quote": "\"Need a watertight cask for river travel? Or a really large helmet?\"",
    "category": 0,
    "frame": "npc-021",
    "rarity": "Uncommon"
  },
  {
    "id": 22,
    "name": "Clarissa Puddle-Jumper",
    "age": "25",
    "bio": "Cobbler specializing in boots for unusually wide or clawed feet.",
    "quote": "\"Finally, a customer with proper arches! Let me get the heavy-duty boar hide.\"",
    "category": 0,
    "frame": "npc-022",
    "rarity": "Common"
  },
  {
    "id": 23,
    "name": "Rupert Cheese-Wheel",
    "age": "48",
    "bio": "Dairyman guarding a cellar of cheese so pungent it deals poison damage.",
    "quote": "\"Stand upwind, Orc. The cheddar's been aging since the last king died.\"",
    "category": 0,
    "frame": "npc-023",
    "rarity": "Uncommon"
  },
  {
    "id": 24,
    "name": "Evelyn Quill-Snapper",
    "age": "36",
    "bio": "Scribe who writes passive-aggressive letters for illiterate mercenaries.",
    "quote": "\"So, 'Dear Chieftain, I am returning your stolen sheep, mostly unchewed'—did I get that right?\"",
    "category": 0,
    "frame": "npc-024",
    "rarity": "Rare"
  },
  {
    "id": 25,
    "name": "Walter Chimney-Sweep",
    "age": "50",
    "bio": "Covered head-to-toe in soot; often mistaken for a shadow elemental.",
    "quote": "\"Don't swing that sword—I'm just a bloke with a brush and bad lung capacity!\"",
    "category": 0,
    "frame": "npc-025",
    "rarity": "Common"
  },
  {
    "id": 26,
    "name": "Captain Vane",
    "age": "47",
    "bio": "City watch commander who enforces extremely obscure bylaws.",
    "quote": "\"Section four, paragraph nine: no unsheathed polearms within twelve paces of a bakery.\"",
    "category": 1,
    "frame": "npc-026",
    "rarity": "Uncommon"
  },
  {
    "id": 27,
    "name": "Private Turnip",
    "age": "18",
    "bio": "Guard wearing a helmet two sizes too big that covers his eyes.",
    "quote": "\"Halt! Who goes there? Seriously, tell me, I can't see past my nose guard.\"",
    "category": 1,
    "frame": "npc-027",
    "rarity": "Rare"
  },
  {
    "id": 28,
    "name": "Sergeant Grimjaw",
    "age": "55",
    "bio": "Retired veteran with a wooden leg carved from a haunted willow.",
    "quote": "\"Good stance, Orc. Keep your left shoulder tucked or a halberd will ruin your afternoon.\"",
    "category": 1,
    "frame": "npc-028",
    "rarity": "Common"
  },
  {
    "id": 29,
    "name": "Lysandra Blade-Dancer",
    "age": "28",
    "bio": "Duelist who refuses to fight anyone wearing mismatched socks.",
    "quote": "\"I'd challenge you to a spar, but those leather wraps are a crime against symmetry.\"",
    "category": 1,
    "frame": "npc-029",
    "rarity": "Uncommon"
  },
  {
    "id": 30,
    "name": "Brog the Half-Tusk",
    "age": "34",
    "bio": "Half-orc caravan guard who files his tusks to look more \"approachable.\"",
    "quote": "\"Keep walking, cousin. The guild pays me by the hour, not by the skull.\"",
    "category": 1,
    "frame": "npc-030",
    "rarity": "Legendary"
  },
  {
    "id": 31,
    "name": "Sir Reginald Puddlefoot",
    "age": "39",
    "bio": "Knight who fell into a bog during his squire trials and never lived it down.",
    "quote": "\"A noble greeting to you, beast-kin! Have you seen a shiny gauntleted glove in that ditch?\"",
    "category": 1,
    "frame": "npc-031",
    "rarity": "Common"
  },
  {
    "id": 32,
    "name": "Morganna Crossbow",
    "age": "32",
    "bio": "Bounty hunter who tracks targets by the smell of their rations.",
    "quote": "\"You're not on my parchment today, green-blood. Though someone matching your shoe size owes tavern rent.\"",
    "category": 1,
    "frame": "npc-032",
    "rarity": "Rare"
  },
  {
    "id": 33,
    "name": "Corporal Dull-Pike",
    "age": "43",
    "bio": "Bridge guard who naps standing up using his halberd as a crutch.",
    "quote": "\"Zzz—huh? Toll's paid! Go on, don't wake the lieutenant!\"",
    "category": 1,
    "frame": "npc-033",
    "rarity": "Common"
  },
  {
    "id": 34,
    "name": "Kaelen Shield-Biter",
    "age": "26",
    "bio": "Berserker trying to practice anger management through knitting.",
    "quote": "\"One... two... purl two... don't make me drop a stitch, Orc, I'm trying to be peaceful!\"",
    "category": 1,
    "frame": "npc-034",
    "rarity": "Uncommon"
  },
  {
    "id": 35,
    "name": "Hilda Iron-Belly",
    "age": "45",
    "bio": "Mercenary cook who uses a cast-iron skillet as both pan and buckler.",
    "quote": "\"Eat your rations before heading into the marsh, or you'll fold like a cheap tent.\"",
    "category": 1,
    "frame": "npc-035",
    "rarity": "Rare"
  },
  {
    "id": 36,
    "name": "Vesper Shadow-Cloak",
    "age": "30",
    "bio": "Terrible rogue who wears squeaky leather boots.",
    "quote": "\"Squeak-squeak. You didn't see me. Squeak. I am one with the night.\"",
    "category": 1,
    "frame": "npc-036",
    "rarity": "Common"
  },
  {
    "id": 37,
    "name": "Gideon Torch-Bearer",
    "age": "22",
    "bio": "Dungeon escort who drops his torch at the slightest sound of bats.",
    "quote": "\"You go first. You look like the sort of chap spiders bounce right off of.\"",
    "category": 1,
    "frame": "npc-037",
    "rarity": "Uncommon"
  },
  {
    "id": 38,
    "name": "Commander Thorne",
    "age": "59",
    "bio": "Border fort general who collects broken enemy weapons as wind chimes.",
    "quote": "\"Your clan raids the northern ridge, yet here you are buying turnip seeds. Strange times.\"",
    "category": 1,
    "frame": "npc-038",
    "rarity": "Exotic"
  },
  {
    "id": 39,
    "name": "Pip Short-Bow",
    "age": "21",
    "bio": "Halfling archer who perches on the shoulders of taller mercenaries.",
    "quote": "\"Oi! Fancy giving me a boost up that wall? I'll split the loot sixty-forty!\"",
    "category": 1,
    "frame": "npc-039",
    "rarity": "Common"
  },
  {
    "id": 40,
    "name": "Thaddeus Rust-Plate",
    "age": "63",
    "bio": "Knight whose armor is rusted completely shut; friends feed him broth through the visor.",
    "quote": "\"Clank-creak! Fine weather for questing, isn't it, lad?\"",
    "category": 1,
    "frame": "npc-040",
    "rarity": "Uncommon"
  },
  {
    "id": 41,
    "name": "Zara Whip-Crack",
    "age": "31",
    "bio": "Beast-tamer hired to keep river crocodiles out of the town moat.",
    "quote": "\"Careful near the bank—Old Snappy hasn't had his afternoon goat yet.\"",
    "category": 1,
    "frame": "npc-041",
    "rarity": "Common"
  },
  {
    "id": 42,
    "name": "Orin Pike-Warden",
    "age": "37",
    "bio": "Gatekeeper obsessed with checking adventurers' quest logs.",
    "quote": "\"Sorry, mate, this bridge is locked until you've helped at least three frantic villagers.\"",
    "category": 1,
    "frame": "npc-042",
    "rarity": "Common"
  },
  {
    "id": 43,
    "name": "Freya Frost-Axe",
    "age": "29",
    "bio": "Northern shieldmaiden sweating profusely in temperate climates.",
    "quote": "\"By the glaciers, how do you breathe in this soup? My armor's boiling me alive!\"",
    "category": 1,
    "frame": "npc-043",
    "rarity": "Rare"
  },
  {
    "id": 44,
    "name": "Malakor the Mild",
    "age": "42",
    "bio": "Ogre mercenary who speaks with an impeccable aristocratic accent.",
    "quote": "\"Splendid day for a skull-cracking, wouldn't you say, my good Orc?\"",
    "category": 1,
    "frame": "npc-044",
    "rarity": "Common"
  },
  {
    "id": 45,
    "name": "Bennie Banner-Boy",
    "age": "17",
    "bio": "Carries a war standard so heavy he leans at a forty-five-degree angle.",
    "quote": "\"For king and... oof... country! Mind helping me lift this pole out of the mud?\"",
    "category": 1,
    "frame": "npc-045",
    "rarity": "Uncommon"
  },
  {
    "id": 46,
    "name": "Archmage Fizzlebop",
    "age": "112",
    "bio": "Wizard who forgot how to cast fireballs and only summons damp sponges.",
    "quote": "\"Behold the arcane arts! Wait—no, that's another mildew-scented bath sponge.\"",
    "category": 2,
    "frame": "npc-046",
    "rarity": "Rare"
  },
  {
    "id": 47,
    "name": "Willow Moss-Hair",
    "age": "34",
    "bio": "Druid who hasn't spoken to a humanoid in six years and communicates via bird whistles.",
    "quote": "\"Tweet-chirp! [Hands you a glowing acorn and stares intensely at your boots].\"",
    "category": 2,
    "frame": "npc-047",
    "rarity": "Common"
  },
  {
    "id": 48,
    "name": "Mordecai Bone-Rattler",
    "age": "67",
    "bio": "Necromancer who only raises skeleton chickens for his farm.",
    "quote": "\"They don't lay eggs, sure, but you never have to feed 'em and foxes hate the crunch.\"",
    "category": 2,
    "frame": "npc-048",
    "rarity": "Uncommon"
  },
  {
    "id": 49,
    "name": "Sybil Crystal-Gazer",
    "age": "51",
    "bio": "Fortune teller whose crystal ball is just a polished turnip.",
    "quote": "\"I see great peril in your future... specifically, stepping on a rake within the next ten minutes.\"",
    "category": 2,
    "frame": "npc-049",
    "rarity": "Exotic"
  },
  {
    "id": 50,
    "name": "Brother Barnaby",
    "age": "48",
    "bio": "Monk who took a vow of silence, except when complaining about his knees.",
    "quote": "\"...\" [Steps on a pebble] \"Oh, sweet heavens, my left meniscus!\"",
    "category": 2,
    "frame": "npc-050",
    "rarity": "Common"
  },
  {
    "id": 51,
    "name": "Zoltan the Adequate",
    "age": "33",
    "bio": "Street illusionist whose tricks occasionally summon real, very confused badgers.",
    "quote": "\"Pick a card, any card—watch out for the claws, he's still groggy from the ether.\"",
    "category": 2,
    "frame": "npc-051",
    "rarity": "Uncommon"
  },
  {
    "id": 52,
    "name": "Miriam Star-Watcher",
    "age": "76",
    "bio": "Astronomer who thinks meteors are just sky-dwarves dropping their anvils.",
    "quote": "\"Look at that streak! Somebody up there just ruined a perfectly good broadsword.\"",
    "category": 2,
    "frame": "npc-052",
    "rarity": "Common"
  },
  {
    "id": 53,
    "name": "Fester the Bog-Witch",
    "age": "94",
    "bio": "Lives in a hut on stilts; brews potions that cure hangovers and cause temporary green ears.",
    "quote": "\"You're already green, dearie, so my swamp-tonic won't even show!\"",
    "category": 2,
    "frame": "npc-053",
    "rarity": "Uncommon"
  },
  {
    "id": 54,
    "name": "ignatius Spark-Fingers",
    "age": "27",
    "bio": "Pyromancer terrified of open flames; wears thick oven mitts everywhere.",
    "quote": "\"Stand back! My palms are sweating and that usually sets the grass alight!\"",
    "category": 2,
    "frame": "npc-054",
    "rarity": "Rare"
  },
  {
    "id": 55,
    "name": "Opal Rune-Carver",
    "age": "40",
    "bio": "Enchanter who accidentally bound a grumpy spirit into a soup ladle.",
    "quote": "\"Don't use that spoon unless you want your stew lecturing you about posture.\"",
    "category": 2,
    "frame": "npc-055",
    "rarity": "Common"
  },
  {
    "id": 56,
    "name": "Professor Quibble",
    "age": "62",
    "bio": "Academic studying whether goblins and rocks share a common ancestor.",
    "quote": "\"Fascinating! May I measure the density of your cranium for my symposium?\"",
    "category": 2,
    "frame": "npc-056",
    "rarity": "Uncommon"
  },
  {
    "id": 57,
    "name": "luna Moon-Puddle",
    "age": "24",
    "bio": "Elf mystic who insists Orcs have \"magnificent, earthy auras.\"",
    "quote": "\"Your spirit resonates like a mossy boulder rolling down a hill. Truly inspiring.\"",
    "category": 2,
    "frame": "npc-057",
    "rarity": "Rare"
  },
  {
    "id": 58,
    "name": "Cornelius Toad-Stool",
    "age": "58",
    "bio": "Mycologist who names every mushroom after a former acquaintance.",
    "quote": "\"Ah, a patch of Spotted Gerald. Delicious in stew, fatal if chewed raw.\"",
    "category": 2,
    "frame": "npc-058",
    "rarity": "Common"
  },
  {
    "id": 59,
    "name": "Vespera Soul-Weigher",
    "age": "45",
    "bio": "Priestess of a minor god of lost keys and stubbed toes.",
    "quote": "\"Drop a copper in the bowl and may your pinky toe never find a table leg in the dark.\"",
    "category": 2,
    "frame": "npc-059",
    "rarity": "Uncommon"
  },
  {
    "id": 60,
    "name": "Balthazar Dust-Cloak",
    "age": "88",
    "bio": "Time-mage who is perpetually ten seconds behind the current conversation.",
    "quote": "\"...Yes, hello! Wait—what did you just ask me? Give me a moment to catch up.\"",
    "category": 2,
    "frame": "npc-060",
    "rarity": "Legendary"
  },
  {
    "id": 61,
    "name": "Fern Dew-Drop",
    "age": "19",
    "bio": "Dryad-in-training allergic to pollen.",
    "quote": "\"Welcome to the sacred grove—sniff—please don't bring any birch branches near me.\"",
    "category": 2,
    "frame": "npc-061",
    "rarity": "Common"
  },
  {
    "id": 62,
    "name": "Grimwald Hex-Spinner",
    "age": "64",
    "bio": "Curses people who litter with mild, localized rainclouds.",
    "quote": "\"Drop that apple core on my path, Orc, and you'll walk in a drizzle till Tuesday.\"",
    "category": 2,
    "frame": "npc-062",
    "rarity": "Rare"
  },
  {
    "id": 63,
    "name": "Alaric Scroll-Hoarder",
    "age": "71",
    "bio": "Librarian who uses heavy leather tomes as projectile weapons.",
    "quote": "\"Shh! Quiet in the stacks, or I'll introduce your skull to Volume Four of Municipal Tax Law!\"",
    "category": 2,
    "frame": "npc-063",
    "rarity": "Common"
  },
  {
    "id": 64,
    "name": "Nyx Shadow-Mender",
    "age": "36",
    "bio": "Tailor who stitches tears in reality using silver thread.",
    "quote": "\"Mind the purple rift by the well—I'm waiting on my thimble before I patch it.\"",
    "category": 2,
    "frame": "npc-064",
    "rarity": "Uncommon"
  },
  {
    "id": 65,
    "name": "Hector Potion-Taster",
    "age": "28",
    "bio": "Freelance guinea pig for local alchemists; his skin faintly glows in the dark.",
    "quote": "\"Three coppers and I'll tell you if that mystery vial tastes like cherry or internal bleeding.\"",
    "category": 2,
    "frame": "npc-065",
    "rarity": "Rare"
  },
  {
    "id": 66,
    "name": "Captain Barnacle-Bill",
    "age": "60",
    "bio": "River barge captain who claims his flat-bottom boat is a \"war galleon.\"",
    "quote": "\"All aboard the Dreadnought! Mind your head on the low bridge, matey.\"",
    "category": 3,
    "frame": "npc-066",
    "rarity": "Common"
  },
  {
    "id": 67,
    "name": "Salty Pete",
    "age": "49",
    "bio": "Ferryman who refuses to row unless the passenger sings a sea shanty.",
    "quote": "\"No song, no crossing. And none of that grim orcish chanting—give me something jaunty!\"",
    "category": 3,
    "frame": "npc-067",
    "rarity": "Uncommon"
  },
  {
    "id": 68,
    "name": "Grognar the Mild-Mannered",
    "age": "35",
    "bio": "Exiled Orc who left his warband to pursue competitive floral arrangement.",
    "quote": "\"Careful with that axe! You're crushing my prize petunias!\"",
    "category": 3,
    "frame": "npc-068",
    "rarity": "Exotic"
  },
  {
    "id": 69,
    "name": "Trixie Coin-Flip",
    "age": "22",
    "bio": "Gambler who plays dice using teeth she claims came from a dragon.",
    "quote": "\"Double or nothing, big guy? Winner gets the shiny rock, loser buys the ale.\"",
    "category": 3,
    "frame": "npc-069",
    "rarity": "Common"
  },
  {
    "id": 70,
    "name": "Old Man River-Reed",
    "age": "79",
    "bio": "Angler who has been trying to catch the same giant catfish for forty years.",
    "quote": "\"Keep your shadow off the water! Old Whiskers is right beneath that lily pad, I swear it!\"",
    "category": 3,
    "frame": "npc-070",
    "rarity": "Uncommon"
  },
  {
    "id": 71,
    "name": "Barnaby Driftwood",
    "age": "41",
    "bio": "Beachcomber who builds entire suits of armor out of river shells and driftwood.",
    "quote": "\"Blocks arrows decent enough, though it smells like low tide in the sun.\"",
    "category": 3,
    "frame": "npc-071",
    "rarity": "Common"
  },
  {
    "id": 72,
    "name": "Marigold Wagon-Wheel",
    "age": "37",
    "bio": "Traveling peddler whose cart is pulled by two remarkably stubborn goats.",
    "quote": "\"Need rope, tinderboxes, or a slightly haunted locket? Everything's half-off!\"",
    "category": 3,
    "frame": "npc-072",
    "rarity": "Common"
  },
  {
    "id": 73,
    "name": "Skeever-Tooth Sam",
    "age": "30",
    "bio": "Rat-catcher who charges by the tail and breeds rats in secret.",
    "quote": "\"Tough times in the sewers, friend. Want to buy a prime sewer-pelt for your belt?\"",
    "category": 3,
    "frame": "npc-073",
    "rarity": "Rare"
  },
  {
    "id": 74,
    "name": "Jolene Banjo-Strummer",
    "age": "26",
    "bio": "Swamp bard whose songs are exclusively about tragic swamp-gas accidents.",
    "quote": "\"Gather 'round and hear the ballad of Poor Uncle Jed and the Lantern!\"",
    "category": 3,
    "frame": "npc-074",
    "rarity": "Common"
  },
  {
    "id": 75,
    "name": "Digger Dan",
    "age": "53",
    "bio": "Grave-digger who pre-digs holes for adventurers who look \"reckless.\"",
    "quote": "\"Six-foot-six, broad shoulders... hold still while I pace out a trench for you, just in case.\"",
    "category": 3,
    "frame": "npc-075",
    "rarity": "Uncommon"
  },
  {
    "id": 76,
    "name": "Flibbertigibbet",
    "age": "104",
    "bio": "Goblin merchant wearing three trench coats stacked on top of each other.",
    "quote": "\"Totally normal tall human here! Looking to trade shiny metal for juicy beetles?\"",
    "category": 3,
    "frame": "npc-076",
    "rarity": "Rare"
  },
  {
    "id": 77,
    "name": "Roderick Road-Worn",
    "age": "44",
    "bio": "Pilgrim walking backwards across the continent to fulfill a silly bet.",
    "quote": "\"Watch out behind me! Am I near the river yet? My neck's killing me.\"",
    "category": 3,
    "frame": "npc-077",
    "rarity": "Common"
  },
  {
    "id": 78,
    "name": "Bessy Bridge-Troll",
    "age": "140",
    "bio": "Toll-troll who accepts riddles, shiny buttons, or freshly baked pies instead of gold.",
    "quote": "\"Answer me this: what has four legs in the morning and—oh, never mind, just give me that tart.\"",
    "category": 3,
    "frame": "npc-078",
    "rarity": "Uncommon"
  },
  {
    "id": 79,
    "name": "Cletus Mud-Lark",
    "age": "29",
    "bio": "Scavenger who sifts through river silt for dropped adventurer gear.",
    "quote": "\"Found a bent fork, half a boot, and a ring that hums when you insult it.\"",
    "category": 3,
    "frame": "npc-079",
    "rarity": "Exotic"
  },
  {
    "id": 80,
    "name": "Vance Vault-Cracker",
    "age": "34",
    "bio": "Retired burglar who now locks himself inside chests to test their security.",
    "quote": "\"Oi! Out here! Tap three times if the locksmith's back—I'm running out of air!\"",
    "category": 3,
    "frame": "npc-080",
    "rarity": "Common"
  },
  {
    "id": 81,
    "name": "Mina Moth-Catcher",
    "age": "21",
    "bio": "Collects rare nocturnal moths in glass jars to use as lanterns.",
    "quote": "\"Don't wave that torch near my jars! You'll ruin my night-light!\"",
    "category": 3,
    "frame": "npc-081",
    "rarity": "Uncommon"
  },
  {
    "id": 82,
    "name": "Gordy Goblin-Tosser",
    "age": "47",
    "bio": "Runs a carnival booth where players throw beanbags at a wooden cutout of a dragon.",
    "quote": "\"Step right up! Three throws for a copper—no using your actual warhammer, Orc!\"",
    "category": 3,
    "frame": "npc-082",
    "rarity": "Common"
  },
  {
    "id": 83,
    "name": "Sorrowful Sam",
    "age": "56",
    "bio": "Professional mourner hired to cry loudly at rich nobles' funerals.",
    "quote": "\"Woe is—oh, sorry, practicing for Thursday. Need anyone wept over?\"",
    "category": 3,
    "frame": "npc-083",
    "rarity": "Uncommon"
  },
  {
    "id": 84,
    "name": "Pippin Puddle-Skiff",
    "age": "16",
    "bio": "River courier who delivers waterproof scrolls using a hollowed-out log.",
    "quote": "\"Special delivery for a 'tall, grumpy green bloke'! Sign on the wet leaf.\"",
    "category": 3,
    "frame": "npc-084",
    "rarity": "Rare"
  },
  {
    "id": 85,
    "name": "Krag Bone-Chewer",
    "age": "38",
    "bio": "Orcish chef traveling the human lands to learn the secret of \"soufflé.\"",
    "quote": "\"If the eggs collapse one more time, I'm cleaving the oven in half!\"",
    "category": 3,
    "frame": "npc-085",
    "rarity": "Common"
  },
  {
    "id": 86,
    "name": "Lord Reginald Snoot",
    "age": "52",
    "bio": "Aristocrat who inspects peasants through a golden monocle with no glass in it.",
    "quote": "\"Good heavens, a wild Orc! Tell me, do your kind use forks, or simply spear the roast?\"",
    "category": 4,
    "frame": "npc-086",
    "rarity": "Uncommon"
  },
  {
    "id": 87,
    "name": "Lady Genevieve Faint-Heart",
    "age": "29",
    "bio": "Noblewoman who carries a velvet fainting couch everywhere via two exhausted servants.",
    "quote": "\"A monster! Quick, Boys, deploy the chaise lounge before I swoon!\"",
    "category": 4,
    "frame": "npc-087",
    "rarity": "Rare"
  },
  {
    "id": 88,
    "name": "Tax-Collector Peabody",
    "age": "45",
    "bio": "Attempts to tax adventurers for breathing royal air and walking on royal dirt.",
    "quote": "\"That's three coppers for road wear, two for loitering, and a tusk-surcharge.\"",
    "category": 4,
    "frame": "npc-088",
    "rarity": "Common"
  },
  {
    "id": 89,
    "name": "Mayor Butterball",
    "age": "61",
    "bio": "Elected entirely because he promised free turnip soup on Wednesdays.",
    "quote": "\"Welcome to our fair hamlet! Don't mind the goblin raids, soup's at noon!\"",
    "category": 4,
    "frame": "npc-089",
    "rarity": "Uncommon"
  },
  {
    "id": 90,
    "name": "Judge Hard-Gavel",
    "age": "68",
    "bio": "Magistrate who settles petty disputes via rock-paper-scissors.",
    "quote": "\"The court finds you guilty of intimidating a chicken. Best two out of three?\"",
    "category": 4,
    "frame": "npc-090",
    "rarity": "Exotic"
  },
  {
    "id": 91,
    "name": "Sir Cedric the Shiny",
    "age": "25",
    "bio": "Paladin who spends four hours a day polishing his armor and zero hours fighting.",
    "quote": "\"Stand back! Your muddy boots are dulling my reflective sheen!\"",
    "category": 4,
    "frame": "npc-091",
    "rarity": "Common"
  },
  {
    "id": 92,
    "name": "Duchess Von Pumpernickel",
    "age": "74",
    "bio": "Carries a tiny, hairless dog that growls furiously at anything larger than a breadbox.",
    "quote": "\"Down, Fluffy! Leave the nice green giant's kneecaps alone!\"",
    "category": 4,
    "frame": "npc-092",
    "rarity": "Uncommon"
  },
  {
    "id": 93,
    "name": "Clerk Barnaby",
    "age": "39",
    "bio": "Guild registrar who demands three forms of identification before handing out rat-killing quests.",
    "quote": "\"No birth certificate? No guild stamp. Come back with a signed note from your chieftain.\"",
    "category": 4,
    "frame": "npc-093",
    "rarity": "Common"
  },
  {
    "id": 94,
    "name": "Baronet Fop-Doodle",
    "age": "22",
    "bio": "Trendsetter trying to make \"orcish tusks\" fashionable among city dandies.",
    "quote": "\"Marvelous jawline! Tell me, are those ivory implants, or all natural?\"",
    "category": 4,
    "frame": "npc-094",
    "rarity": "Uncommon"
  },
  {
    "id": 95,
    "name": "Arch-Inquisitor Mumble",
    "age": "66",
    "bio": "Speaks so quietly everyone just nods and agrees to avoid asking him to repeat himself.",
    "quote": "\"Mumble-mumble-heresy-mumble... sign here.\"",
    "category": 4,
    "frame": "npc-095",
    "rarity": "Rare"
  },
  {
    "id": 96,
    "name": "Countess Velvet-Glove",
    "age": "43",
    "bio": "Spymaster who hides secret messages inside baked goods.",
    "quote": "\"Eat the croissant, Orc, and meet my contact by the docks. Do not eat the paper inside.\"",
    "category": 4,
    "frame": "npc-096",
    "rarity": "Common"
  },
  {
    "id": 97,
    "name": "Herald Trumpet-Blast",
    "age": "31",
    "bio": "Announces nobles with painfully long, completely fabricated titles.",
    "quote": "\"Make way for Baron Snodgrass, Conqueror of the Puddle, Slayer of the Mild Breeze!\"",
    "category": 4,
    "frame": "npc-097",
    "rarity": "Uncommon"
  },
  {
    "id": 98,
    "name": "Sir Galahad the Lost",
    "age": "35",
    "bio": "Questing knight who has been looking for the same castle for twelve years.",
    "quote": "\"Excuse me, good Orc—is this the road to Camelot, or did I take a wrong turn at the swamp?\"",
    "category": 4,
    "frame": "npc-098",
    "rarity": "Rare"
  },
  {
    "id": 99,
    "name": "The Masked Turnip",
    "age": "28",
    "bio": "Local vigilante who wears a burlap sack over his head and fights petty pickpockets.",
    "quote": "\"Fear not, citizen! Justice wears hessian—and smells faintly of root vegetables!\"",
    "category": 4,
    "frame": "npc-099",
    "rarity": "Common"
  },
  {
    "id": 100,
    "name": "The Mysterious Stranger",
    "age": "???",
    "bio": "Stands dramatically in tavern corners nursing a single mug of milk.",
    "quote": "\"I have a quest of great importance... as soon as I remember where I left my notes.\"",
    "category": 4,
    "frame": "npc-100",
    "rarity": "Mythic"
  }
];
export const npcCategories=['Townsfolk','Soldiers','Mages','Travelers','Nobles'];
export const NPC_INTERVAL=30*60*1000;
export interface NpcState {visitors:Record<string,{id:number;until:number}>;met:Record<string,{region:number;at:number;relationship:number;lastTalk:number}>}
export const freshNpcs=():NpcState=>({visitors:{},met:{}});
const weights:Record<NpcRarity,number>={Common:65,Uncommon:25,Rare:8,Exotic:1.8,Legendary:.19,Mythic:.01};
export function rollNpc(region:number,random=Math.random):Npc {const allowed=region===4?[0,1,2,3,4]:region===5?[0,3]:region===1||region===7?[2,3]:[1,3];const pool=npcs.filter(n=>allowed.includes(n.category));const weighted=pool.map(n=>weights[n.rarity]/npcs.filter(x=>x.rarity===n.rarity).length);let roll=random()*weighted.reduce((a,b)=>a+b,0);return pool.find((_,i)=>(roll-=weighted[i])<0)??pool[pool.length-1];}
export function currentNpc(state:NpcState,region:number,now:number,random=Math.random){let v=state.visitors[region];if(!v||v.until<=now){const n=rollNpc(region,random);v=state.visitors[region]={id:n.id,until:now+NPC_INTERVAL};}return npcs.find(n=>n.id===v.id);}
export function meetNpc(state:NpcState,id:number,region:number,now:number){const old=state.met[id];if(!old){state.met[id]={region,at:now,relationship:10,lastTalk:now};return true;}if(now-old.lastTalk>=NPC_INTERVAL){old.relationship=Math.min(100,old.relationship+5);old.lastTalk=now;}return false;}
