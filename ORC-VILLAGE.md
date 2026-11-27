# Orc Village

Install Node.js 20+ and run `npm install`, then `npm run dev -- --host 0.0.0.0`. Open the printed URL. `npm run build` produces `dist/` for static hosting. For Capacitor, use `dist` as webDir and add native platforms separately.

## Phase 1
`src/main.ts`, `style.css`, `assets/Art.ts`, `entities/Player.ts`, `ui/Joystick.ts`, `scenes/MainScene.ts`: Vite entry, responsive fixed canvas, procedural pixel sprites, movement and multitouch joystick.
## Phase 2
`entities/Tree.ts`: health, chop cooldown (scene), fall tween, wood reward, 30-second respawn.
## Phase 3
`entities/Camp.ts`: stockpile and deposit; scene manages contextual button.
## Phase 4
`systems/UpgradeSystem.ts`: validated purchase and level-based damage; scene owns modal.
## Phase 5
`systems/SaveSystem.ts`: versioned local storage with validation; scene autosaves every two seconds and on transactions/pagehide.

Desktop: WASD/arrows, Space action, E upgrades. Mobile: joystick and contextual action. Original procedural art, no external asset licenses. Portrait-first fixed aspect ratio with letterboxing on wide displays. Tree timers reset on reload. Native packaging and device testing are not included.

## Idle Realms Hub integration
Game 4 is served at `/orcvillage.html` (or `/orcvillage` on Vercel). Run `npm install` from the repository root to update the existing lockfile with Phaser and TypeScript, then `npm run typecheck:orc`, `npm run build`, and `npm run dev`. The lockfile could not be refreshed in the offline integration environment. Orc Village uses local saves only; the other games and APIs are unchanged. Commit the refreshed lockfile before deploying.
