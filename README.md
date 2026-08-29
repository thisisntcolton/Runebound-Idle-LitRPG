# ⚔️ RUNEBOUND — an idle LitRPG

AdVenture Capitalist pacing · Melvor Idle bones · LitRPG soul.
Train skills, slay monsters, hoard gear, hire questionable NPCs, and Ascend to feed the loop.

## Run it

```bash
npm install
npm run dev      # opens http://localhost:5173
```

That's the whole game — it runs entirely in the browser with local saves, no backend required.

For cloud saves and leaderboards, see **[DEPLOY.md](./DEPLOY.md)** (Vercel + Neon Postgres +
GitHub/Google sign-in, ~20 minutes). Full-stack locally: `npm run dev:full` (needs the Vercel CLI).

Production build: `npm run build` (output in `dist/`, servable from any static host; `npm run preview` to test it).

## What's in the game

### Hearthwick is where the game opens now (v2.0)

The town is no longer a tab. It is the front door: a hand-drawn map, tinted by the hour of day,
with six places you walk into.

**Your house** — four rooms, six places in each, and thirty pieces of furniture across five sets.
Buy them at the Square, commission them from your crafting skills, or find the rest out in the
world being guarded by something. Every piece carries a small bonus into the same multiplier chain
everything else uses, and filling a whole room from a **single set** earns the set bonus on top —
all-or-nothing, so furnishing is a puzzle rather than a shopping list.

**The residents have lives.** Eight of them keep their own schedules across the six bands of the
day: you learn where somebody is at dusk the way you learn anything about a place you live in.
Talking to them moves a **bond** that rises slowly and decays if you stop turning up, opens four
tiers of dialogue, and unlocks the things they will ask you for. They remember you across every
cycle. That is the entire argument the game has been making since the first cycle note: the world
winds back, and these people do not.

**Your former selves stay behind.** Every Ascension retires the character you have been into
Hearthwick as a resident — their name, their class, their look, the level they reached. They live
in the town, they can be put to work a skill for a share of a hireling's rate, they get older and
better at it, and they can be sent out past the gate. A save nine cycles deep has a household.

**Expeditions** — send a party (former selves, and who else you can spare) through the gate to
seven destinations, priced in the same combat-minute currency as the Road and the errands, dialled
by how much risk you accept and what you pack. The whole trip is rolled the moment you send it, so
what comes back is decided by the choice you made and not by when you happened to check.

**Visiting** — publish your Hearthwick and walk through somebody else's from the leaderboard: their
house, their buildings, their household, who lives there. Leave a gift on the doorstep, once per
person per day. Asynchronous on purpose — no live server, no presence, no chat, and nothing a
visitor can do to a town but look at it.

### The rest

**Skills (Melvor-style)** — nine trainable skills, each with its own hireling: Woodcutting, Mining,
Fishing, Smithing, Cooking, Alchemy, plus **Farming** (crops that feed the kitchens, the cauldrons
and the town), **Thieving** (pure gold, and the one place LUK is the whole discipline) and
**Runecrafting** (grind shards into essence and bind essence into runes, so enchanting and ability
tomes stop being drop-only). Each has 5+ actions gated by level, on the RuneScape XP curve — and
then keeps going: see **the second hundred**, below. One active pursuit at a time: pick your grind.

**Thieving can go wrong.** Every steal prints its odds of being noticed, and being noticed drops
you straight into a fight with whoever noticed. Picking a pocket is nearly safe; lifting a Root
Token from whatever administers this place is the most dangerous thing in the game. Win and you
keep the haul and take their purse, and go straight back to work; lose and you drop what you
lifted and walk away wounded — no gold lost, no XP lost. The expected value of a risky steal is
*higher* than a safe one, if you can win the argument.

**Adventure** — the third thing to be doing, and the only one that is not a treadmill. Set out and
the road carries you; every half-minute or so something happens and you answer it. **24 chains, 100
distinct endings, 110 distinct paths**, all of them three beats deep and none of them with a right
answer — the kind thing and the hard thing both cost and both pay. Nine of the chains only find you
because of something you already did, and what you did is remembered across every cycle you will
ever live. The road waits while you decide, and if you are away it takes the quiet option rather
than the cruel one.

**Combat** — 5 zones, 15 monsters, one boss (Aurelion, the Last Flame). Auto-battle with Attack /
Strength / Defense training styles, Hitpoints trained passively, auto-eat food slot, hit splats,
death penalty. Gear drops with rarity tiers (common → legendary).

**Gear** — 7 equipment slots. Forge full Bronze → Runic sets via Mining + Smithing, or take
uniques from monsters (Wyrmslayer Blade, Dragonhide Cloak…).

**AdCap layer** — escalating-cost upgrades (tool speed, double-yield, damage, XP) and **Hirelings**:
managers with names and questionable backstories who run a skill passively (25%–50% of your rate)
while you do something else.

**LitRPG layer** — Character Level rises with total skill levels; each level grants a **stat point**
to allocate: STR / AGI / VIT / INT / LUK. System-window popups, a status-screen character sheet,
and a scrolling SYSTEM LOG narrate the grind.

**Ascension (prestige)** — at total skill level 120+, reset for **Fate Shards** (+2% XP & gold each,
permanent) and spend them on Fate Perks: offline cap, damage, drop rate, global speed… In Era I,
ascending also razes Hearthwick, clears your class so you can pick a new one, and plays a **return report**
that quotes real numbers back at you from the cycle you just spent. Your pets, your look, your
Codex and your chronicle come with you; nothing else does.

**Two Eras.** Everything below happens inside a place called Hearthwick, which you will
eventually discover is a containment unit. Breaking the cycle is not the end of the game — it is
the end of the tutorial, and the beginning of **Era II: the Scrap Wastes**, where the sky scrolls
with error traffic, the gods turn out to be middle management, and nothing resets any more.

**Era II brings three systems, none of which is another progress bar:**

**Salvage** — the Wastes are the dumping ground for deleted code and failed Ascensions, so you
dig them rather than mine them. Salvage has no level of its own: every site is *locked*, and the
keys are skills you already spent a hundred hours on. Buried needs Mining, sealed needs Thieving,
encoded needs Runecrafting, fused needs Smithing. Hauls are a roll, not a wage, and unstable digs
collapse, corrupt, or wake something that files paperwork for a living.

**The Ledger** — containment was a service, it was rendered across four lifetimes, and the bill
is itemised. A share of every coin you earn is collected at source until it is settled. Nobody has
ever settled one. There is not a procedure for it.

**The Syndicate Repo Men** — everything you own out here is, administratively speaking,
unlicensed. They serve notice, and if you refuse or sleep through it they take something real: a
building level, an enchantment, a pet. They never destroy anything. It goes in a crate with a
reference number on it, to a camp, and camps can be cleared.

**Story & Quests (dark-mystery LitRPG)** — a 14-quest main chain narrated by a System that is
cheerful, helpful, and lying; 5 hireling side quests (each one a loose thread in the world);
repeatable zone bounties; and a re-readable Lore Archive of recovered fragments. Ascensions are
**Cycles**: each one plays a revelation about what the loop actually is, and after Cycle 4 the
top of the Dragonspire offers the choice the whole game builds toward — **Feed the Flame**
(shards, forever, and the offer comes back every cycle) or **Break the Cycle**, which is told in
four beats: the warm ending you earned, that ending stuttering, the sky failing like a screen,
and the containment notice underneath it. After the break Hearthwick stops being razed, the
System's blue goes wrong, and the seven townsfolk you have known for four lifetimes get the first
word about it.
Rare "whispers" surface in the system log until the mystery resolves. All story beats persist
across cycles — the world forgets; you don't.

**Talent trees** — every class has a five-tier tree, and playing as that class levels it: all the
XP you earn feeds a per-class pool, one talent point per class level. Points and everything you
spend them on are stored **per class and survive Ascension forever** — the only progression in the
game nothing ever takes back. A maxed class has 50 points and the full tree costs 78, so you are
choosing a build rather than filling in a form. Each tree ends in a capstone that changes how the
class plays: the Rogue executes anything a crit leaves under 20% health, the Ranger stops missing
entirely, the Mage's burn stacks and never expires, the Priest ignores zone level requirements
outright, and the Artisan's town keeps working while they are away.

**Classes** — at character level 10 you choose one of **eight** paths, and it holds for the rest of
the cycle: **Rogue** (attack speed and 20% crits), **Ranger** (accuracy, loot and a guaranteed
opening swing), **Mage** (damage that scales off INT, hits that burn, and paper-thin defences),
**Priest** (the over-level specialist: huge health, heavy mitigation, heals on every kill, and up to
+150% damage and +100% loot scaled by how far the monster outranks you), **Warden** (the first class
that *wants* to be hit — 25% of every blow goes straight back, and nothing gets to walk away from a
long fight), **Beastmaster** (your companion's bonus is doubled and it fights beside you for a share
of your damage — the whole fifteen-species roster becomes the build), **Wanderer** (encounters find
you sooner, pay better and go your way more often; the road is the kit) or **Artisan** — which gets
*no combat bonus at all* and in exchange runs the strongest economy in the game: +30% gathering,
+50% town revenue, cheaper construction and an extra staff slot on every building. Ascend and you
choose again, so a class is a commitment for one run rather than for the save.

**What Ascension takes, and what it cannot**, is one list rendered in both places the question gets
asked — and a test cross-checks it against what `prestige.js` actually keeps, so the game cannot be
wrong about it. The short version: **the class and every talent in it reset with everything else.**
What survives a class is its **Mastery**: one distilled permanent bonus, earned by capping that
class, and it stacks again every time you cap it again. Keeping whole trees forever meant a
cycle-seven player walked back in already finished and the late cycles took minutes; a Mastery per
cap compounds instead of front-loading. What the loop has never been able to touch is your house,
the people you used to be, your pets, and what the neighbours make of you.

**Appearance** — a Mii-style character builder: face shape, skin, ten hairstyles, eyes, brows,
mouth, facial hair, scars and war paint and rune brands, build and colours, all hand-drawn SVG.
Your hero appears on the character sheet and in every fight, and survives Ascension.

**The Codex** — 47 discoverable entries across six categories, every one unlocked by something
you actually did: fifty slimes killed, mining 45, a town grown, a cycle survived. Seventeen of
them **deepen when you Ascend** — re-read an entry in a later cycle and it has more to say,
because you know more than you did. Ambient world-facts drip into the system log while you play,
tied to whatever you are currently doing.

**Village encounters** — Hearthwick has weather. A fire on the row, something coming down the
east road, a light strongbox, nine seconds of the valley shrugging, and once in a while a circus.
Each is a timed choice with three real answers: pay for it, handle it yourself, or let it happen.
Miss one and the town decides for itself, badly but survivably.

**Hearthwick (the town layer)** — buy parcels, build Lumber Yards, Market Stalls, Cafes,
Apothecaries, Smithies and Inns, hire staff with traits and wages, and stock them with the
materials your skills produce. Buildings run shifts on a timer, turning raw output into gold and
town buffs. Buildings pay a flat wage for the labour plus a markup on the *value* of the goods they move, so
routing mythril through a Market Stall earns vastly more than routing logs. Hearthwick is **razed
every Ascension while the loop still owns it** — only the people you have met carry over — because
a town that survived intact let a returning player rebuy their whole hireling roster in ten minutes
and skip the early cycle. Break the loop and it stops being razed; it carries the next cycle for
about half an hour and then starves, because restocking needs the gathering skills you just reset
(`npm run sim:prestige` shows the arithmetic).

The town is **inhabited**, not decorated: every resident is a stable person with a name, a trade,
a face generated from the same appearance system your own character uses, and an errand route with
places they stop and stand for a while. Notable residents show up with their own business, and
travelling visitors bring offers worth accepting or refusing.

**The Menagerie (pets)** — hatch, raise, feed, play with and breed **fifteen species** across four
rarities, from the Hearth Sparrow and the Coin Beetle up through the Ledger Owl and the Lanternmoth
to the Seam Serpent and the Orphaned Familiar. Between them they touch nine different multipliers,
so a pet is a build decision rather than a bigger number. Eggs drop far more freely than they used
to and roll their rarity on a fixed ladder — 75% common, 20% rare, 4.5% epic, and a half-percent
sliver of legendary — with Luck bending the ladder upward rather than simply dropping more eggs. Eggs incubate on a real clock. Pets
grow through Egg → Hatchling → Juvenile → Adult → Elder by earning **bond XP** — passively while
you're away, and much faster from kills and skill actions when one walks at your side. Hunger and
happiness decay in real time; the **one active pet** grants a passive bonus that scales with its
level and its current mood, so a neglected companion helps you with nothing. Nothing ever dies —
it just sulks until you make it up to them. Two Adults can be bred: the child inherits a trait
from one parent and has a shot at climbing a rarity tier. Pets persist through Ascension.

**Unstable Rifts** — a timed emergency event. A tear opens, monsters flood out, and you have ten
minutes to answer it. Hold ten escalating waves to seal it for heavy rewards (and a real shot at
an ability tome or a rare egg); fail, and the raid damages Hearthwick and halts its buildings.

**Abilities, Dungeons, Enchanting & Alchemy** — **nineteen** ability tomes across three loadout
slots (a strike, a guard, a utility), delve multi-wave dungeons, enchant gear up to +5, and brew
timed potion buffs. The newer abilities deliberately scale off the *target* rather than off you —
The Unmaking removes 12% of anything's maximum health however large it is, Unyielding caps any
single blow at a quarter of yours — which is what finally makes the loadout a real decision against
a Descent floor or the Vigil.

**Achievements & titles** — unlockable deeds, each granting a title you can wear on the leaderboard.

**Idle proper** — autosaves every 10s, offline progress up to 8h (extendable to 32h via the
Timekeeper perk) for your active action *and* hirelings, with a "While You Were Away" report.
Export/import saves in Settings.

**Cloud saves & leaderboards** (optional) — sign in with GitHub or Google to sync progress across
devices and rank on five global boards (total level, shards, lifetime gold, boss kills,
Cyclebreakers). Conflicting saves prompt you to choose a timeline rather than silently clobbering
one. With no backend attached the game is fully playable and simply says cloud sync is unavailable.
See [DEPLOY.md](./DEPLOY.md).

### The second hundred

The level cap is **199**, and levels 1–99 are byte-for-byte the numbers they always were — every
existing save keeps its levels, and the server's anti-cheat derives from the same file. The second
band has a different shape on purpose: the RuneScape curve doubles every seven levels, so extending
it to 199 would have put the last level at about a trillion times the cost of 99. Levels 100–199
grow *linearly* instead, which makes the whole band roughly ten times the climb to 99 — a long haul
rather than a wall. `npm run sim:levels` prints it in hours.

**But 99 is a containment parameter.** Inside the sandbox the ceiling is 99 and it always was; the
XP past it accumulates anyway, against a number you are not permitted to have, and the skill panel
says so rather than pretending it is lost. Break the loop and all of it is released at once. You did
not earn those levels out here. You earned them in there, and they were being held.

Past the ceiling every skill gets three new things to work — Heartwood and Worldroot, Adamant and
Starfall, Glass Eel and Kraken, Frostgrain and Dawnmelon, a Root Token stolen from something that
notices — plus two more forgeable gear tiers and an Ascendant tier on every class tree.

### Beyond the box — Era II

Breaking the loop does not end the game; it changes what the game is. Everything below is inert
until you are out.

**The Descent** — the Wastes are discarded places stacked on discarded places, so there is a
*down*. Hold a floor by putting down eight of what lives on it (every fifth floor is held by a
single Warden instead) and the next one opens. It is a ladder with exactly one next rung, it needs
no skill and no permission, and **how deep you have ever been is permanent** — a standing bonus to
damage, gold and drop rate that Ascension cannot touch. How deep you may *go* is capped by your
cycle count, which is what gives Ascension a reason once it stops burning your town.

**The Vigil (world boss, beta)** — something enormous stands up out of the strata every few hours
of play and stays up for a day and a half. Its health pool is measured in sessions and **persists
in your save**: you will not kill one today, and nothing you land is ever wasted. It is also the
only fight in the game where *preparation is a stat* — a brewed potion, town buffs running, a pet
at your side, a class walked, food in the bag, ground behind you, whole when you start. Each is a
printed line with a number on it; cold you engage at ×1.00, ready at ×2.20. And you cannot stand
in it: an aura compounds for as long as you hold contact, so an engagement is a round rather than
an idle bar. Solo, offline, no backend.

**The Ledger** — the System bills you for four lifetimes of containment, at 20% of gross income,
collected at source. The bill does not land the moment you get out: the reveal gets ninety minutes
of play to breathe first, with the System audibly doing arithmetic near you the whole time.
Clearing it is a genuine Era II goal and nobody has ever done it.

**The Syndicate** — repo men with paperwork. They take something real — a building level, an
enchantment, a pet — and everything they take goes into a crate in a camp that you can go and
clear. Nothing is ever destroyed. If you own nothing they are authorised to crate, they will take
a stack of materials, or a levy on your coin, or failing that drive a numbered stake into the
ground and take a cut of everything you earn until you pull it out. An antagonist that no-ops is
worse than no antagonist.

**Salvage** — dig sites with no level of their own. Every one is locked by a skill you *already*
have: buried needs Mining, sealed needs Thieving, encoded needs Runecrafting, fused needs
Smithing. The Wastes screen carries a keyring that names, per skill, exactly which level opens
what next.

**Masteries and the Ascendant tier** — capping a class's tier-5 capstone earns that class's
**Mastery**, one distilled permanent bonus that applies whatever you are playing afterwards,
including nothing. And out in the Wastes every tree grows a sixth tier that does not exist inside
the sandbox and cannot be bought there.

## Project layout

```
api/                   # Vercel serverless functions (optional backend)
├── _lib/
│   ├── db.js          # Neon client + schema bootstrap
│   ├── session.js     # HMAC-signed stateless session cookies
│   ├── providers.js   # GitHub / Google OAuth 2.0
│   └── validate.js    # save sanity checks + server-derived stats
├── auth/              # login, callback, logout
├── me.js              # current session
├── save.js            # cloud save GET / POST / DELETE
└── leaderboard.js     # global rankings

src/
├── main.js            # boot: load save → offline progress → UI → game loop
├── styles.css         # dark-fantasy / system-window theme
├── core/
│   ├── state.js       # game state + all derived stats/multipliers
│   ├── loop.js        # 10 Hz tick loop
│   ├── save.js        # localStorage autosave, export/import, migration
│   ├── xp.js          # RS-style XP curve (lvl 1–99) — shared with the API
│   ├── cloud.js       # cloud session, save sync, conflict resolution
│   ├── events.js      # tiny pub/sub bus
│   └── format.js      # 1.23K / 45.6M number formatting
├── data/              # pure content — add things here
│   ├── skills.js      # skills & actions (trees, veins, recipes…)
│   ├── items.js       # resources, food, gear (+ generated sets)
│   ├── monsters.js    # zones, monsters, loot tables
│   ├── upgrades.js    # upgrades, hirelings, ascension perks
│   ├── quests.js      # main chain, side quests, bounties
│   ├── town.js        # Hearthwick buildings, plots, staff traits
│   ├── npcs.js        # residents, wanderers, visiting notables
│   ├── pets.js        # species, growth stages, care rates, traits, breeding
│   ├── classes.js     # the five paths, their bonuses and signatures
│   ├── talents.js     # six-tier tree per class, curve, capstones, Masteries
│   ├── adventure.js   # 24 chains, 100 endings, and what the road remembers
│   ├── thieving.js    # who turns up when a steal goes wrong, and the odds
│   ├── persistence.js # the one list of what Ascension takes and what it cannot
│   ├── salvage.js     # Era II dig sites, skill locks, haul tables
│   ├── deep.js        # the Descent: strata, denizens, Wardens, floor scaling
│   ├── worldboss.js   # the Vigil: preparation lines, the aura, the pool
│   ├── codex.js       # discoverable lore, cycle-deepening passes, tidbits
│   ├── encounters.js  # village events and their branching outcomes
│   ├── appearance.js  # hero option lists and palettes
│   ├── abilities.js   # ability tomes and their effects
│   └── lore.js        # fragments, cycle revelations, endings, whispers
├── systems/           # game logic
│   ├── skills.js      # XP, active action loop, hireling ticks
│   ├── combat.js      # auto-battle, drops, food, death
│   ├── inventory.js   # items, gold, selling, equipping
│   ├── character.js   # LitRPG stat points
│   ├── prestige.js    # ascension + purchases
│   ├── quests.js      # quest engine, cycles, the ending
│   ├── town.js        # shift cycles, wages, stock, town buffs
│   ├── npcs.js        # population growth, visitor offers
│   ├── pets.js        # incubation, care decay, bonding, breeding, egg drops
│   ├── classes.js     # class choice, bonus hook, crit/quarry/burn/mend
│   ├── codex.js       # discovery engine, ambient tidbits, cycle memory
│   ├── salvage.js     # excavation loop, site rotation, instability
│   ├── deep.js        # the floor ladder, the cycle cap, the permanent depth
│   ├── worldboss.js   # surfacing, preparation, contact, the long kill
│   ├── adventure.js   # the road loop, chain state, flags that outlive cycles
│   ├── repo.js        # Syndicate notices, seizure, fallbacks, camps, recovery
│   ├── ledger.js      # back-taxes, the grace period, the garnish, settling up
│   ├── encounters.js  # scheduling, resolution, consequence effects
│   ├── abilities.js   # cooldowns, triggers, tome learning
│   ├── unstable.js    # timed rift events and their consequences
│   ├── enchant.js     # gear enchanting
│   ├── potions.js     # timed buffs
│   ├── achievements.js
│   └── offline.js     # away-time simulation
└── ui/
    ├── render.js      # router, sidebar, delegation, tick updates
    ├── panels.js      # HTML builders per view
    ├── journal.js     # quest journal + lore archive
    ├── town.js        # Hearthwick map + management panels
    ├── townart.js     # hand-drawn SVG buildings, scenery, and a stable cast
    │                  #   of villagers walking errand routes with stops
    ├── pets.js        # Menagerie: incubator, roster, care, breeding, shop
    ├── petart.js      # hand-drawn SVG creatures, mood-responsive
    ├── classes.js     # the Path panel
    ├── codex.js       # the Codex panel
    ├── adventure.js   # the road, and the vignette that takes the screen
    ├── wastes.js      # Era II: the Vigil, the Ledger, the Syndicate, the
    │                  #   Descent, the keyring and the dig board
    ├── appearance.js  # the Mii-style editor
    ├── heroart.js     # hand-drawn SVG hero, assembled from option indices
    ├── abilities.js   # ability bar + tome panel
    ├── rifts.js       # dungeons + unstable rift panel
    ├── achievements.js
    ├── leaderboard.js # global rankings panel
    └── notify.js      # system log + LitRPG popups

test/                  # API integration tests + a Playwright browser suite
```

## Tests

```bash
npm run test:content   # every Codex entry, encounter option and tidbit pool is reachable
npm run test:skills    # every action's items resolve; no crafting step destroys value
npm run test:api       # 19 tests: validation, sessions, OAuth/CSRF, saves, leaderboard
npm run test:browser   # 46 tests: every view, appearance, codex, classes, encounters, new skills
npm run test:pets      # 35 tests: hatch -> feed -> level -> breed, offline, multipliers
npm run test:classes   # 17 tests: the choice, the lock-in, Artisan's zero combat power, talents
npm run test:ascension # 22 tests: the town is razed; pets, talents and your look survive
npm run test:era1      # 24 tests: the four-beat reveal, the Wastes, the town surviving after
npm run test:era2      # 29 tests: salvage, the keyring, the Ledger's grace and garnish, seizure
npm run test:deep      # 28 tests: the Descent ladder, Masteries, the Ascendant tier, fallbacks
npm run test:boss      # 23 tests: preparation as a stat, a pool that outlives the session
npm run test:road      # 26 tests: the ceiling coming off, thieving caught, and the road
npm run test:townlife  #  9 tests: the villagers are people, and their walk survives a re-render
npm run balance        # sims: town profit by material tier, class power at 0/20/50 talent points
npm run sim:deep       # sim: is the Descent climbable, and does it stay worth climbing?
npm run sim:boss       # sim: is the Vigil a several-session fight, and does preparation matter?
npm run sim:prestige   # sim: does a surviving town delete the early cycle? (it does not)
npm run sim:levels     # sim: 1-99 is frozen, and what the second hundred costs in hours
npm run preview:pets   # contact sheet of all 15 species, every stage, every mood
npm run preview:heroes # contact sheet of every appearance option, as a PNG
```

`test:api` needs a Postgres URL and OAuth env vars — see
[DEPLOY.md](./DEPLOY.md#running-the-api-tests).

`test:pets` drives a real browser, so it needs Playwright (kept out of the default install
because its postinstall downloads ~300MB of browsers) plus a build and a preview server:

```bash
npm i -D playwright && npx playwright install chromium
npm run build && npm run preview &   # serves dist/ on :4173
npm run test:pets
```

## Extending it

- **New tree/ore/fish**: one line in `data/skills.js` + the item in `data/items.js`.
- **New monster or zone**: `data/monsters.js`.
- **New upgrade/hireling/perk**: `data/upgrades.js` — costs and effects are data-driven.
- **New class**: one entry in `data/classes.js`. Bonuses are numbers read through a single
  hook, so a new class needs no code unless it wants a signature mechanic.
- **New Codex entry**: `data/codex.js` — declare a `when` condition and, optionally, `deeper`
  passes keyed to cycle numbers. `npm run test:content` proves it is reachable.
- **New encounter**: `data/encounters.js` — options and effects are data; the resolver reports
  back exactly what it applied.
- **New hairstyle or feature**: append to the list in `data/appearance.js` and draw it in
  `ui/heroart.js`. Existing saves are unaffected — a look is just a bag of indices.
- **New pet species**: one entry in `data/pets.js` (rarity, bonus key, favourite foods, hatch
  time, palette) plus either a drawing function in `ui/petart.js` or — far easier — a `build`
  naming one of the five body plans. The egg item, the drop table entry and the whole
  care/breeding loop follow automatically; the rarity ladder picks it up with no code at all.
- **New adventure chain**: one entry in `data/adventure.js`. Beats, options, outcomes and effects
  are all data, rewards are declared as multiples and scaled to the player, and
  `npm run test:content` proves every `next` resolves and every beat is reachable.
- **New ability**: `data/abilities.js`. If it only changes numbers, give it a `passive` bag and it
  needs no code at all — the multiplier chain reads it through one hook.
- **New building**: `data/town.js` — inputs, outputs, staff slots and the town buff are all data.
- **New Descent floor flavour**: `data/deep.js` — denizens, Wardens and strata are lists; the
  scaling exponents are four numbers with a comment explaining why each is what it is.
- **New preparation line for the Vigil**: one entry in `PREP` in `data/worldboss.js` plus one
  boolean in `prepCheck()`. The checklist UI and the multiplier follow automatically.
- **New villager**: nothing to do — names, trades, errands and faces are generated from
  `data/npcs.js` and `data/appearance.js`. Add a name or a trade and the town uses it.
- **New quest**: add an entry in `data/quests.js` (goal kinds: kill, killZone, loot, craft,
  skill, hire, goldLifetime) and, if it carries story, a fragment in `data/lore.js`.
- Balance levers live in `core/state.js` (multipliers) and `data/upgrades.js` (cost curves).

## Dev cheat

In the browser console while `npm run dev` is running there's no built-in cheat — but the state
is plain JS. If you must: open DevTools → Sources isn't needed, just edit your exported save
(Settings → Export, it's base64 JSON) and import it back. You monster.
