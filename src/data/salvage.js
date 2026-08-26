// ============================================================
// SALVAGE — Era II's new verb
//
// The Wastes are the dumping ground for deleted code and failed
// Ascensions, so you do not mine them. You dig through them, and what
// comes out is somebody else's abandoned work.
//
// Three things make this a different loop from the nine skills:
//
//  1. NO NEW GRIND. Salvage has no level of its own. Sites are LOCKED,
//     and the keys are the skills you already spent a hundred hours on —
//     buried needs Mining, sealed needs Thieving, encoded needs
//     Runecrafting, fused needs Smithing. Levelling an old skill opens a
//     new door instead of filling another bar.
//
//  2. THE HAUL IS A ROLL, not a fixed output. You know the table and the
//     tier; you do not know what you are getting until the dig finishes.
//
//  3. RISK IS REAL. Every site has an instability rating. An unstable dig
//     can collapse, or it can wake something that has been waiting in the
//     debris for a very long time and files paperwork for a living.
//
// Sites expire and refresh, so the Wastes are somewhere you check on
// rather than a menu you exhaust.
// ============================================================

export const LOCKS = {
  none:      { id: 'none',      label: 'Open',      icon: '🕳️', skill: null,           desc: 'Lying in the open. Anyone could take it. Nobody has.' },
  buried:    { id: 'buried',    label: 'Buried',    icon: '⛏️', skill: 'mining',       desc: 'Under a great deal of discarded ground.' },
  sealed:    { id: 'sealed',    label: 'Sealed',    icon: '🗝️', skill: 'thieving',     desc: 'Locked by someone who expected to come back.' },
  encoded:   { id: 'encoded',   label: 'Encoded',   icon: '🔮', skill: 'runecrafting', desc: 'Written shut in the nine shapes.' },
  fused:     { id: 'fused',     label: 'Fused',     icon: '🔨', skill: 'smithing',     desc: 'Welded closed by whatever heat killed this place.' },
};

export const LOCK_LIST = Object.values(LOCKS);

/**
 * Site tiers.
 *   requires   { lockId: skillLevel } — ALL must be satisfied
 *   ms         excavation time
 *   instability 0..1 chance the dig goes wrong
 *   haul       weighted roll table; `qty` is [min,max]
 *   weight     how often this tier appears in the rotation
 */
export const SITES = [
  {
    id: 'drift', name: 'Shallow Drift', icon: '🪨', tier: 1, weight: 26,
    blurb: 'A scatter of loose material that used to be part of something.',
    requires: { none: 0 },
    ms: 25000, instability: 0.04,
    haul: [
      { item: 'scrap_code',     qty: [3, 8],  w: 50 },
      { item: 'glitched_ore',   qty: [1, 3],  w: 26 },
      { item: 'orphaned_shard', qty: [1, 1],  w: 14 },
      { item: 'rune_essence',   qty: [2, 5],  w: 10 },
    ],
  },
  {
    id: 'seam', name: 'Collapsed Seam', icon: '⛏️', tier: 2, weight: 20,
    blurb: 'A vein of ore that was deleted mid-extraction. It is still warm.',
    requires: { buried: 30 },
    ms: 45000, instability: 0.10,
    haul: [
      { item: 'glitched_ore',   qty: [6, 14], w: 44 },
      { item: 'scrap_code',     qty: [5, 12], w: 24 },
      { item: 'glitched_bar',   qty: [1, 3],  w: 18 },
      { item: 'orphaned_shard', qty: [1, 3],  w: 14 },
    ],
  },
  {
    id: 'cache', name: 'Sealed Cache', icon: '🗝️', tier: 2, weight: 18,
    blurb: 'Someone locked this and did not come back. Their name is on the lid.',
    requires: { sealed: 25 },
    ms: 40000, instability: 0.12,
    haul: [
      { item: 'strongbox_haul', qty: [2, 5],  w: 36 },
      { item: 'caravan_spoils', qty: [1, 3],  w: 26 },
      { item: 'orphaned_shard', qty: [2, 4],  w: 22 },
      { item: 'deprecated_asset', qty: [1, 1], w: 16 },
    ],
  },
  {
    id: 'vault', name: 'Encoded Vault', icon: '🔮', tier: 3, weight: 14,
    blurb: 'Written shut. The nine shapes, in an order Ollun says is rude.',
    requires: { encoded: 30 },
    ms: 60000, instability: 0.16,
    haul: [
      { item: 'rune_essence',   qty: [14, 30], w: 34 },
      { item: 'greater_rune',   qty: [2, 5],   w: 26 },
      { item: 'corrupt_sigil',  qty: [1, 2],   w: 22 },
      { item: 'deprecated_asset', qty: [1, 2], w: 18 },
    ],
  },
  {
    id: 'wreck', name: 'Fused Wreck', icon: '🔨', tier: 3, weight: 13,
    blurb: 'Two buildings that were never in the same place, welded together.',
    requires: { fused: 40 },
    ms: 70000, instability: 0.18,
    haul: [
      { item: 'glitched_bar',   qty: [5, 12],  w: 38 },
      { item: 'glitched_ore',   qty: [10, 24], w: 24 },
      { item: 'deprecated_asset', qty: [1, 3], w: 22 },
      { item: 'corrupt_sigil',  qty: [1, 2],   w: 16 },
    ],
  },
  {
    id: 'build', name: 'Deprecated Build', icon: '🏚️', tier: 4, weight: 7,
    blurb: `Somebody's whole town, face down in the grey. Quill has stopped mapping these.`,
    requires: { buried: 55, encoded: 45 },
    ms: 95000, instability: 0.26,
    haul: [
      { item: 'deprecated_asset', qty: [3, 7], w: 34 },
      { item: 'glitched_bar',     qty: [10, 20], w: 24 },
      { item: 'corrupt_sigil',    qty: [2, 5], w: 24 },
      { item: 'orphaned_shard',   qty: [8, 16], w: 18 },
    ],
  },
  {
    id: 'ascension', name: 'A Failed Ascension', icon: '💠', tier: 5, weight: 3,
    blurb: `Someone got this far and did not get further. What is left is mostly
            the good part. Wren has asked that we stop calling them "sites".`,
    requires: { buried: 70, sealed: 60, encoded: 60 },
    ms: 150000, instability: 0.34,
    haul: [
      { item: 'orphaned_shard',   qty: [25, 50], w: 32 },
      { item: 'corrupt_sigil',    qty: [4, 9],   w: 26 },
      { item: 'deprecated_asset', qty: [6, 12],  w: 24 },
      { item: 'blank_tome',       qty: [1, 2],   w: 18 },
    ],
  },
];

export function getSite(id) { return SITES.find(s => s.id === id); }

// How many sites are on offer at once, and how long each survives before
// the Wastes shift and it is gone.
export const SITE_SLOTS = 4;
export const SITE_LIFETIME_MS = 30 * 60 * 1000;
export const SITE_REFRESH_MS = 4 * 60 * 1000;   // one new site every few minutes

// An unstable dig does not simply fail. Something happens.
export const MISHAPS = [
  { id: 'collapse', w: 40, text: 'The ground gives. You get out with most of it and none of your dignity.',
    lose: 0.5 },
  { id: 'corrupt',  w: 32, text: 'Half the haul comes up as something that is not quite an item and evaporates while you look at it.',
    lose: 0.6 },
  { id: 'repo',     w: 28, text: 'The dig wakes something. It has a clipboard.',
    lose: 0.25, repo: true },
];

// ---------------- Glitched material ----------------
// What the Wastes are worth, and why it is not simply better ore.
export const GLITCH_NOTE = `Glitched material is worth more than the clean equivalent and
  behaves worse. The town will take it. The forge will take it. Nobody will tell you
  where it came from, because nobody knows, because it came from here.`;
