# Blackroot 0.6.0 foundations — stability pass
Apply to the uploaded runebound-idle (2).zip baseline (0.5.4). Includes 0.5.5 asset registration. No other games changed.

Run npm run typecheck:orc, node test/orc-foundations.test.cjs, npm run build. Production build in the review environment is blocked by missing Linux Rollup native dependency; browser testing is not completed.

Manual regression: chop the tree right of hut, move during swing, leave range before impact, press Space after clicking quest summary, Escape with and without a menu, attack goblin, verify axe progress, death countdown, refresh depleted nodes and travel back. Existing levels and save key preserved. Cancelled out-of-range strikes still consume stamina. Quest axe grants removed for future completions; combat wood reduced to 3 for normal enemies and 15 additional for bosses, stone boss reward 10. Existing rewards not clawed back. No new crafting features.

Remaining: full action state machine, complete MainScene decomposition, partial node health persistence, save backup/export and full nested validation, browser regression suite. This is a targeted foundations pass, not a complete architectural rewrite.
