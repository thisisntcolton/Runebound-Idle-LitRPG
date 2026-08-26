// ============================================================
// QUESTS — main chain, hireling side quests, zone bounties
//
// Goal kinds:
//   kill      { monster, count }         — kill a specific monster
//   killZone  { zone, count }            — kill anything in a zone
//   loot      { item, count }            — obtain an item (any source)
//   craft     { item, count }            — produce via a skill action
//   skill     { skill, level }           — reach a skill level
//   hire      { count }                  — hirelings hired
//   goldLifetime { amount }              — lifetime gold earned
//
// `story` = lore fragment id unlocked (and shown as a modal) on completion.
// Main quests form a chain via `requires`.
// ============================================================

export const MAIN_QUESTS = [
  {
    id: 'status_awake', name: 'Status: Awake', giver: 'The System',
    brief: 'Fell 10 Oak Logs. The System insists manual labor is grounding.',
    goal: { kind: 'loot', item: 'oak_log', count: 10 },
    reward: { gold: 50 },
    story: 'awakening',
    offer: '[ QUEST ] Status: Awake — the System suggests you hit a tree until identity returns.',
  },
  {
    id: 'first_paycheck', name: 'The First Paycheck', giver: 'The System',
    brief: 'Earn 250 lifetime gold. "Currency is a wonderful reason to exist," says the System.',
    goal: { kind: 'goldLifetime', amount: 250 },
    reward: { gold: 150 },
    requires: 'status_awake',
    offer: '[ QUEST ] The First Paycheck — sell something. Anything. The System loves conversions.',
  },
  {
    id: 'sharp_edges', name: 'Sharp Edges', giver: 'The System',
    brief: 'Forge a Bronze Blade (mine copper → smelt bronze → forge). You\'ll want it.',
    goal: { kind: 'craft', item: 'bronze_weapon', count: 1 },
    reward: { gold: 100, items: { bronze_helmet: 1 } },
    requires: 'first_paycheck',
    offer: '[ QUEST ] Sharp Edges — the System notes, cheerfully, that the meadow bites back.',
  },
  {
    id: 'prove_pulse', name: 'Prove Your Pulse', giver: 'The System',
    brief: 'Slay 15 creatures in the Sunlit Meadow.',
    goal: { kind: 'killZone', zone: 'meadow', count: 15 },
    reward: { gold: 300 },
    requires: 'sharp_edges',
    offer: '[ QUEST ] Prove Your Pulse — combat metrics required. For your file, it says.',
  },
  {
    id: 'hired_help', name: 'Hired Help', giver: 'The System',
    brief: 'Hire your first hireling. They were already waiting. They don\'t remember arriving.',
    goal: { kind: 'hire', count: 1 },
    reward: { gold: 500 },
    requires: 'prove_pulse',
    offer: '[ QUEST ] Hired Help — delegation unlocks. The staff came with the world.',
  },
  {
    id: 'into_gloom', name: 'Into the Gloom', giver: 'The System',
    brief: 'Put down 8 Duskfang Wolves in Gloomroot Forest.',
    goal: { kind: 'kill', monster: 'wolf', count: 8 },
    reward: { gold: 800, items: { trout: 10 } },
    requires: 'hired_help',
    story: 'forest_fire',
    offer: '[ QUEST ] Into the Gloom — the forest is scarred. The System recommends not asking by what.',
  },
  {
    id: 'iron_blood', name: 'Iron in the Blood', giver: 'The System',
    brief: 'Reach Smithing level 15. The forge remembers your hands, even if you don\'t.',
    goal: { kind: 'skill', skill: 'smithing', level: 15 },
    reward: { gold: 600 },
    requires: 'into_gloom',
    offer: '[ QUEST ] Iron in the Blood — skill acquisition is soul acquisition, says the System. Odd phrasing.',
  },
  {
    id: 'bones_deep', name: 'Bones of the Deep', giver: 'The System',
    brief: 'Destroy 10 Restless Skeletons in Hollowdeep.',
    goal: { kind: 'kill', monster: 'skeleton', count: 10 },
    reward: { gold: 1500 },
    requires: 'iron_blood',
    story: 'facing_spire',
    offer: '[ QUEST ] Bones of the Deep — cave clearance requested. Try not to look at where they\'re looking.',
  },
  {
    id: 'broodmother', name: 'The Broodmother', giver: 'The System',
    brief: 'Slay the Broodmother 3 times. She keeps coming back. So do you.',
    goal: { kind: 'kill', monster: 'spider', count: 3 },
    reward: { gold: 2000, shards: 1 },
    requires: 'bones_deep',
    story: 'she_refused',
    offer: '[ QUEST ] The Broodmother — SUBJECT 7 requires re-processing. Reward includes a… fragment.',
  },
  {
    id: 'ashes_wind', name: 'Ashes on the Wind', giver: 'The System',
    brief: 'Slay 15 creatures on the Cindershard Peaks.',
    goal: { kind: 'killZone', zone: 'peaks', count: 15 },
    reward: { gold: 4000 },
    requires: 'broodmother',
    offer: '[ QUEST ] Ashes on the Wind — the mountain is warm. The System says that\'s normal. It repeats: normal.',
  },
  {
    id: 'mountains_heart', name: 'The Mountain\'s Heart', giver: 'The System',
    brief: 'Break open 5 Basalt Golems and look — actually look — at what\'s inside.',
    goal: { kind: 'kill', monster: 'golem', count: 5 },
    reward: { gold: 6000, items: { mythril_bar: 5 } },
    requires: 'ashes_wind',
    story: 'engine_parts',
    offer: '[ QUEST ] The Mountain\'s Heart — geological survey. Do not retain any components you may recognize.',
  },
  {
    id: 'stormward', name: 'Stormward', giver: 'The System',
    brief: 'Bring down 3 Storm Wyverns. They circle the Spire like they\'re guarding it. Or mourning it.',
    goal: { kind: 'kill', monster: 'wyvern', count: 3 },
    reward: { gold: 9000 },
    requires: 'mountains_heart',
    offer: '[ QUEST ] Stormward — airspace violation detected (theirs, not yours).',
  },
  {
    id: 'spire_calls', name: 'The Spire Calls', giver: 'The System',
    brief: 'Slay 5 Spire Drakes on the Dragonspire itself.',
    goal: { kind: 'kill', monster: 'drake', count: 5 },
    reward: { gold: 15000 },
    requires: 'stormward',
    story: 'keyhole',
    offer: '[ QUEST ] The Spire Calls — final ascent authorized. The System sounds almost nervous. Systems don\'t get nervous.',
  },
  {
    id: 'last_flame', name: 'The Last Flame', giver: 'The System',
    brief: 'Face Aurelion at the top of the world.',
    goal: { kind: 'kill', monster: 'aurelion', count: 1 },
    reward: { gold: 25000, shards: 1 },
    requires: 'spire_calls',
    story: 'last_flame',
    offer: '[ QUEST ] The Last Flame — he is waiting. He has always been waiting. Go and see.',
  },

  // ------------------------------------------------------------
  // ERA II. Everything below is gated on `era: 2` and does not appear
  // until you are out of the box.
  //
  // Note the objectives. "Mine 10,000 Glitched Ore" was the obvious
  // version and it is the treadmill in a costume: the same verb you
  // already have, times a hundred. These ask you to do things you have
  // never done instead — dig a site open with a skill you levelled for
  // other reasons, settle a bill nobody has ever settled, walk into a
  // camp and take your dog back.
  // ------------------------------------------------------------
  {
    id: 'not_kansas', name: 'Not In Kansas Anymore', giver: 'The Administrator', era: 2,
    brief: 'Salvage anything at all out of the Wastes. Twenty pieces of it.',
    goal: { kind: 'loot', item: 'scrap_code', count: 20 },
    reward: { gold: 8000 },
    requires: 'last_flame',
    offer: `[ ADMIN ] Listen. You were not supposed to get out. The dragon was costed to be
      unwinnable without a purchase, and somebody in Design is going to have a very long
      afternoon about it. But you ARE out, so: there is glitched material in the grey, it is
      nobody's, and management would like it inventoried. Grab a pickaxe.`,
  },
  {
    id: 'back_taxes', name: 'Back-Taxes', giver: 'The Administrator', era: 2,
    brief: 'Settle the Ledger. Nobody has ever settled the Ledger.',
    goal: { kind: 'flag', flag: 'ledger_settled' },
    reward: { gold: 50000, shards: 2 },
    requires: 'not_kansas',
    offer: `[ ADMIN ] Also, and I want to stress that this is not personal, you owe back-taxes
      on your last four lives. Containment is a service. It was rendered. There is a form.`,
  },
  {
    id: 'dont_touch_dog', name: "Don't Touch The Dog", giver: 'Hearthwick', era: 2,
    brief: 'Recover what the Syndicate has taken.',
    goal: { kind: 'flag', flag: 'repo_recovered' },
    reward: { gold: 30000, items: { corrupt_sigil: 2 } },
    requires: 'not_kansas',
    offer: `[ HEARTHWICK ] The Repo Men have been. They had a form and a reference number and
      they said the word "unlicensed" about something that has a NAME.<br><br>
      Holt has been quiet all morning. Pell knows which way they went. You have a level ninety-nine
      pickaxe and a very clear afternoon.`,
  },
  {
    id: 'deep_grey', name: 'The Deep Grey', giver: 'Ferrin Vale', era: 2,
    brief: 'Open a Deprecated Build. Somebody else got this far and did not get further.',
    goal: { kind: 'loot', item: 'deprecated_asset', count: 5 },
    reward: { gold: 60000, items: { blank_tome: 1 } },
    requires: 'dont_touch_dog',
    offer: `[ FERRIN ] There is a whole town out there, face down. Not a ruin — a ruin was
      something once. This was <i>finished</i>, and then it was <i>discarded</i>, and I would
      very much like to know which of those two things happened first.`,
  },
];

export const SIDE_QUESTS = [
  {
    id: 's_baldric', name: 'What the Trees Say', giver: 'Baldric the Lumberjack',
    unlockHireling: 'h_wood',
    brief: 'Bring Baldric 50 Willow Logs. He wants to burn the talkative ones.',
    goal: { kind: 'loot', item: 'willow_log', count: 50 },
    reward: { gold: 600 },
    story: 'whispered_name',
    offer: '[ QUEST ] Baldric has a problem with the trees. Specifically, with what they\'ve started saying.',
  },
  {
    id: 's_grimda', name: 'Older Than the Mine', giver: 'Grimda Deepdelver',
    unlockHireling: 'h_mine',
    brief: 'Mine 10 Mythril Ore from the deep veins. Grimda found something down there she wants buried under paperwork.',
    goal: { kind: 'loot', item: 'mythril_ore', count: 10 },
    reward: { gold: 2500 },
    story: 'old_carving',
    offer: '[ QUEST ] Grimda found a carving below the deepest shaft. She\'d like backup. And a stiff drink.',
  },
  {
    id: 's_hemlock', name: 'The Day the Sea Stopped', giver: 'Old Man Hemlock',
    unlockHireling: 'h_fish',
    brief: 'Haul in 20 Raw Lobsters. Hemlock talks more when the pots are full.',
    goal: { kind: 'loot', item: 'raw_lobster', count: 20 },
    reward: { gold: 2000 },
    story: 'still_sea',
    offer: '[ QUEST ] Hemlock will trade a story for lobsters. He says it\'s about the day the sea held its breath.',
  },
  {
    id: 's_vera', name: 'A Blade with a Name', giver: 'Forge-Sister Vera',
    unlockHireling: 'h_smith',
    brief: 'Forge a Mythril Blade under Vera\'s eye. She has been dreaming about this exact blade.',
    goal: { kind: 'craft', item: 'mythril_weapon', count: 1 },
    reward: { gold: 3500 },
    story: 'same_blade',
    offer: '[ QUEST ] Vera wants to watch you forge mythril. She won\'t say why. Her hammer is nervous.',
  },
  {
    id: 's_bumblewort', name: 'The Gravy Incident', giver: 'Chef Bumblewort',
    unlockHireling: 'h_cook',
    brief: 'Cook 30 Salmon for the chef. The full story of his exile costs exactly thirty salmon.',
    goal: { kind: 'craft', item: 'salmon', count: 30 },
    reward: { gold: 1500 },
    story: 'no_palace',
    offer: '[ QUEST ] Bumblewort is finally ready to tell the gravy story. All of it. Bring salmon.',
  },
];

// Repeatable per-zone bounties: kill N of anything in the zone.
export const BOUNTIES = [
  { zone: 'meadow',      count: 25, gold: 150 },
  { zone: 'forest',      count: 25, gold: 500 },
  { zone: 'caves',       count: 25, gold: 1800 },
  { zone: 'peaks',       count: 25, gold: 7000 },
  { zone: 'dragonspire', count: 25, gold: 22000 },
];

export const ALL_QUESTS = [...MAIN_QUESTS, ...SIDE_QUESTS];
export function getQuest(id) { return ALL_QUESTS.find(q => q.id === id); }
