# Blackroot knowledge transfer — 2026-11-27

This is a design and engineering handoff from the Gruk ChatGPT project. It is not a code patch. Sources: conversation decisions, archived source `runebound-idle(3).zip`, historical patch archives through v0.8.8a, original NPC roster. The current GitHub checkout was not accessed. Later patch source was inspected for fish storage, Riverhaven trading and NPC visuals; the full historical implementation has not been independently audited or tested in this handoff.

Read order: DESIGN, LORE, MECHANICS, UI-UX, ROADMAP, CHANGELOG, ENGINEERING. NPC-ROSTER preserves original character text; FISH-CATALOG preserves the archived fish data in readable form. These are reference data, not replacement runtime definitions.

Before coding, reconcile docs with actual source and git history. Treat numerical values as historical design targets unless verified. Preserve current behavior when uncertain and ask before changing balance. No deployment or save migration is performed by this package.
