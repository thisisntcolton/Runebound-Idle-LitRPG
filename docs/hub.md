# Idle Realms Hub

The homepage registry lives in `src/hub/games.js`; add game metadata and a read-only save adapter when adding a game. `src/hub/saves.js` reads existing saves without migrating or writing them. `src/hub/main.js` renders the registry and uses the existing `/api/me` account endpoint. News entries are local data in `main.js` and should be based on verified releases.

The abstract cover and hero treatments are placeholders. Commission four distinct 16:9 game covers (at least 1600×900), a Blackroot 21:9 hero (at least 2100×900, with the left half suitable for text), and square game icons. Supply optimized WebP or AVIF with fallbacks and avoid embedding text in artwork. Preserve the existing palette and add useful alternative text if artwork conveys information.

Run `node --test test/hub.test.mjs`, `npm run build`, and `npm run typecheck:orc` when changing the hub.
