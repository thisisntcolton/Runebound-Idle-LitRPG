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

**Skills (Melvor-style)** — Woodcutting, Mining, Fishing, Smithing, Cooking. Each has 5+ actions
gated by level, on a RuneScape-style XP curve to 99. One active pursuit at a time: pick your grind.

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
permanent) and spend them on Fate Perks: offline cap, damage, drop rate, global speed…

**Story & Quests (dark-mystery LitRPG)** — a 14-quest main chain narrated by a System that is
cheerful, helpful, and lying; 5 hireling side quests (each one a loose thread in the world);
repeatable zone bounties; and a re-readable Lore Archive of recovered fragments. Ascensions are
**Cycles**: each one plays a revelation about what the loop actually is, and after Cycle 4 the
top of the Dragonspire offers the choice the whole game builds toward — **Feed the Flame**
(shards, forever) or **Break the Cycle** (the true ending, and a permanent Cyclebreaker bonus).
Rare "whispers" surface in the system log until the mystery resolves. All story beats persist
across cycles — the world forgets; you don't.

**Idle proper** — autosaves every 10s, offline progress up to 8h (extendable to 32h via the
Timekeeper perk) for your active action *and* hirelings, with a "While You Were Away" report.
Export/import saves in Settings.

**Cloud saves & leaderboards** (optional) — sign in with GitHub or Google to sync progress across
devices and rank on five global boards (total level, shards, lifetime gold, boss kills,
Cyclebreakers). Conflicting saves prompt you to choose a timeline rather than silently clobbering
one. With no backend attached the game is fully playable and simply says cloud sync is unavailable.
See [DEPLOY.md](./DEPLOY.md).

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
│   └── lore.js        # fragments, cycle revelations, endings, whispers
├── systems/           # game logic
│   ├── skills.js      # XP, active action loop, hireling ticks
│   ├── combat.js      # auto-battle, drops, food, death
│   ├── inventory.js   # items, gold, selling, equipping
│   ├── character.js   # LitRPG stat points
│   ├── prestige.js    # ascension + purchases
│   ├── quests.js      # quest engine, cycles, the ending
│   └── offline.js     # away-time simulation
└── ui/
    ├── render.js      # router, sidebar, delegation, tick updates
    ├── panels.js      # HTML builders per view
    ├── journal.js     # quest journal + lore archive
    ├── leaderboard.js # global rankings panel
    └── notify.js      # system log + LitRPG popups

test/                  # API integration tests (real handlers vs real Postgres)
```

## Tests

```bash
npm run test:api       # 18 tests: validation, sessions, OAuth/CSRF, saves, leaderboard
```

See [DEPLOY.md](./DEPLOY.md#running-the-api-tests) for the env vars they need.

## Extending it

- **New tree/ore/fish**: one line in `data/skills.js` + the item in `data/items.js`.
- **New monster or zone**: `data/monsters.js`.
- **New upgrade/hireling/perk**: `data/upgrades.js` — costs and effects are data-driven.
- **New quest**: add an entry in `data/quests.js` (goal kinds: kill, killZone, loot, craft,
  skill, hire, goldLifetime) and, if it carries story, a fragment in `data/lore.js`.
- Balance levers live in `core/state.js` (multipliers) and `data/upgrades.js` (cost curves).

## Dev cheat

In the browser console while `npm run dev` is running there's no built-in cheat — but the state
is plain JS. If you must: open DevTools → Sources isn't needed, just edit your exported save
(Settings → Export, it's base64 JSON) and import it back. You monster.
