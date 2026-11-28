# Mechanics and balance reference

Historical design targets; verify against current code before changing. All skill levels 1–99; tool cap 70. Ten skills: Woodcutting, Mining, Hunting, Combat, Leatherworking, Smithing, Construction, Cooking, Fishing, Farming. Archived XP threshold: round(10,000,000 × ((level−1)/98)^3.5). Rank thresholds 1 Novice, 10 Apprentice, 25 Journeyman, 50 Expert, 75 Master, 99 Grandmaster.

## Gathering and survival
- Axe hits: levels 1–2: 5; 3–4: 4; 5–30: 3; 31–70: 2. Stone pickaxe hits: 1:8, 2:7, 3–4:6, 5–10:5, 11–30:4, 31–70:3. Iron unlock pickaxe 11; 11–30:8, 31–70:5. Efficiency cap 3× at 41. Base yields wood 3, stone 3, iron 2.
- Respawn targets: trees 225s, stone 375s, iron 675s, berries 150s, potatoes 300s. Persist depletion timestamps. Tireless Swing: axe 10, 5000 wood/1000 stone; continuous gathering. Campfire rest 3 stamina/s for 30s, 20% reduced stamina use for 5 min.
- Death: lose 20% carried basic resources; preserve equipment/storage; Rabbit King exception. Food restores 5 stamina and 15 hunger, not HP. Drinking restores 20 thirst only, 2s cooldown. No eating/drinking/water collection/rest/sleep during combat (10s since hostile interaction; persists reload/travel).
- Bucket 20 water; waterskin tiers 5/10/20/40 additional capacity; max 60. Craft costs 5 leather, 10 leather (leatherworking 10), 20 iron (smithing 15), 40 iron (smithing 35). Preserve excess water when capacity changes.
- Sleep: hut levels 1–5 take 60/50/40/30/15 seconds; costs 5 stored food; full HP/stamina; once per game day. Modal cannot dismiss mid-sleep; refresh persistence needs verification.

## Village and equipment
Campfire 10 wood; hut 25 wood; Great Hall 100 wood/50 stone; Urga 50 wood; chest 50 wood unlocks inventory/storage. Six leather armor pieces; club, sword, battleaxe, shield. Workers: lumberjack 30 wood/hr, miner 20 stone/hr, iron worker 10 iron/hr, farmer 25 food/hr; hire 50 food subject to housing/Urga. Food consumption for hired workers, not entire population. Named worker rarity thresholds 0/15/35/60/100 (verify meaning in code). Hourly production; offline production not confirmed. Lumber yard/mill management: combined history, level 1–10, +10% per level; mill base capacity 3 +1 per level; upgrade cost level 2 250 wood/100 stone, increasing by same increment each level. Other production buildings not necessarily equivalent yet.

## Farming
Small plot 100 wood/25 stone, four slots. Well 150 wood/100 stone, 10 water/5 min, cap 50. Irrigation 250 wood/150 stone/25 iron; granary 300 wood/100 stone. Worker farm distinct (600 wood/100 stone). Plant/harvest individual or all slots; no seeds in original system. Placement checks all resource nodes (including depleted), buildings/reserved sites, farms, bounds and paths; no charge if no space. Preserve crops on relocation.

| Crop | Level | Food | Water | Minutes | XP |
|---|---:|---:|---:|---:|---:|
| Potato | 1 | 1 | 2 | 5 | 25 |
| Carrot | 5 | 2 | 3 | 8 | 35 |
| Turnip | 10 | 3 | 4 | 12 | 50 |
| Wheat | 15 | 5 | 5 | 20 | 75 |
| Cabbage | 20 | 8 | 6 | 30 | 100 |
| Pumpkin | 35 | 15 | 10 | 60 | 180 |

## Fishing
Pole 75 wood, level 1. Active cast costs 2 stamina, random bite 4–10s, 3s reaction window, tap/click bobber or appropriate action. Early click fails; timeout says “The fish got away!” with splash; movement/combat/travel/blur cancel. No XP or fish on failure. Manual recast. Net 250 wood/10 leather, level 10, passive 5 min, 8 generic food/60 XP. Active catch increments species inventory (`fishBag`) and permanent catch history (`fishCaught`), verified in v0.8.8a MainScene patch. Journal discovery persists after sale; inventory displays artwork, rarity and count. Do not silently turn catches into food. Consumption behavior needs source verification.

| Rarity | Species | Base chance | Level | Food | XP | Sale gold |
|---|---:|---:|---:|---:|---:|---:|
| Common | 20 | 65% | 1 | 1 | 15 | 5 |
| Uncommon | 25 | 25% | 10 | 2 | 25 | 15 |
| Rare | 25 | 8% | 25 | 3 | 50 | 50 |
| Exotic | 20 | 1.8% | 45 | 5 | 100 | 150 |
| Legendary | 8 | 0.19% | 70 | 10 | 500 | 1000 |
| Mythic | 2 | 0.01% | 90 | 20 | 2500 | 10000 |

Normalize eligible species weights; Old Man of River .001%, Abyssal River Kraken-Eel .009% base. Fish atlas 1024×640, 100 frames of 100×64. See FISH-CATALOG.md. No confirmed weights-as-item-properties, pole upgrades or fishing achievements.

## Skill bonuses (per level above 1)
Woodcutting/mining: .25% speed, .10% extra resource chance. Hunting: .25% extra pelt chance, .10% lower stamina cost. Combat: .25% damage, .10% lower stamina cost. Leatherworking/smithing: .15% material saving chance. Construction: .10% wood refund chance. Cooking: .25% hunger recovery, temporary 5 XP eating. Fishing: .25% speed, .01s extra reaction time. Farming: .25% faster growth, .15% extra food chance; new plant times only. Verify coverage; selected actions only in initial implementation.

## NPCs and economy
100 NPCs, categories 25 townsfolk/20 guards/20 mages/20 travelers/15 nobles. Rarity counts 40/30/20/7/2/1; base chances 65/25/8/1.8/.19/.01%. Mysterious Stranger sole mythic, never required. Relationship thresholds 0 Stranger, 10 Acquaintance, 25 Friendly, 50 Trusted, 75 Close Friend, 100 Lifelong Ally; first encounter +10, later +5, 30 min cooldown. Wilderness one visitor per region, 30 min rotation; Riverhaven six permanent and three rotating on entry. NPC journal separate from workers. No permanent nameplates.

Riverhaven v0.8.8 source: persistent gold and per-venue ledger, 12,000g funds and 100 shared stock per UTC day, resource sale wood 1/stone 2/iron 5/food 3, buy double. Sell 1 or up to 10, buy 1. Forge iron/stone; bakery/tavern food; market basic resources; fishmonger species sales. Verify capacity enforcement, save validation and transaction atomicity; not independently tested. Notice board placeholder; equipment shops, discounts, schedules, contracts and diplomacy future. No gold HUD confirmed. Prices and budgets provisional.
