# Runebound development instructions

## Scope
Runebound is a multi-game browser repository. Blackroot (Game 4, Gruk) is the current focus. Entry `orcvillage.html`, source `src/orcvillage/`, assets `public/assets/orcvillage/`, Phaser 3 / TypeScript / Vite, Node >=20, GitHub and Vercel. Do not change other games without permission.

## Read before working
Read `docs/blackroot/README.md`, then relevant design, mechanics, lore, UI, roadmap and history documents. Source code is authoritative for actual behavior; these documents preserve design intent and historical decisions. If they conflict, report the discrepancy rather than silently changing behavior. Latest reported patch is v0.8.8a; verify current checkout. Do not assume all patches were deployed.

## Non-negotiable rules
- Preserve save key `orc-village-v1`, existing progression, IDs, discovery records, timers and migration compatibility. Never reset saves as a fix. Add defaults for new fields and test old saves.
- Keep desktop UI and controls unchanged when doing mobile-only work. Support touch, keyboard/mouse, resize, orientation and fold/unfold without reload.
- Preserve established pixel art, character proportions and tone. No permanent NPC nameplates; reveal identity in dialogue. Keep accessible touch targets.
- Prefer targeted changes, existing systems and reusable data-driven definitions. Avoid unrelated refactors, new dependencies or changes to balance without approval.
- Inspect git status before editing; do not overwrite user changes, commit, push or deploy without explicit approval. Never expose secrets or commit node_modules.
- Test actual behavior, not just compilation. Clearly distinguish passed, failed, skipped and unrun tests. Never claim browser/device tests unless performed.

## Workflow
1. Inspect relevant code and tests; explain conflicts or assumptions.
2. Implement smallest coherent change, including migration and regression coverage.
3. Run `npm run typecheck:orc`, `npm run build`, relevant existing `test/orc-*.cjs` tests (inspect invocation first), and browser playtests where possible.
4. Report files changed, behavior, test results, limitations, manual test steps, suggested commit title and description.

## Next assignment
v0.8.9 Mobile First is planned, not implemented. See `docs/blackroot/UI-UX.md` and `ROADMAP.md`. Do not begin automatically just because these instructions exist.
