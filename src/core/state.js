// ============================================================
// GAME STATE — single mutable object + derived-stat helpers
// ============================================================
import { SKILL_IDS, TRAINABLE_SKILLS, COMBAT_SKILLS, SKILLS } from '../data/skills.js';
import { UPGRADES, HIRELINGS, PERKS, SHARD_XP_BONUS, SHARD_GOLD_BONUS,
         HIRELING_BASE_RATE, HIRELING_RATE_PER_RANK } from '../data/upgrades.js';
import { getItem } from '../data/items.js';
import { levelForXp, xpForLevel, MAX_LEVEL, SOFT_CAP } from './xp.js';

export const SAVE_VERSION = 1;

// ============================================================
// BALANCE — every combat lever in one place. Tweak and reload.
// ============================================================
export const BALANCE = {
  // --- Accuracy: chance a swing lands ---
  // hitChance = accuracy / (accuracy + monsterDefense + DEFENSE_CONSTANT)
  ACCURACY_BASE: 22,               // was 14 — cuts brutal early-game whiffing
  ACCURACY_PER_ATTACK_LEVEL: 2,
  ACCURACY_DEFENSE_CONSTANT: 10,

  // --- Max hit: your damage ceiling ---
  // maxHit = floor((BASE + strLvl*PER_LEVEL + gearStr*PER_GEAR) * multipliers)
  MAXHIT_BASE: 4,
  MAXHIT_PER_STRENGTH_LEVEL: 0.8,
  MAXHIT_PER_GEAR_STR: 0.65,       // was 0.5 — makes equipment upgrades matter

  // --- Min hit: your damage FLOOR (trained fighters don't flail) ---
  // Damage rolls uniformly between minHit and maxHit instead of 1 and maxHit.
  // Tuned so the total power gain is a flat ~40-55% at every tier rather
  // than compounding into a late-game blowout.
  MINHIT_FRACTION_BASE: 0.30,
  MINHIT_FRACTION_PER_ATTACK_LEVEL: 0.001,    // ~0.40 at Attack 99
  MINHIT_FRACTION_CAP: 0.42,

  // --- Speed & mitigation ---
  ATTACK_INTERVAL_MS: 2400,
  DR_SOFTCAP_CONSTANT: 220,        // defense rating needed for ~50% flat DR
  DR_FLAT_CAP: 0.60,
  DR_MULT_CAP: 0.45,
  DR_TOTAL_CAP: 0.85,
};

export function defaultState() {
  const skills = {};
  for (const id of SKILL_IDS) skills[id] = { xp: 0 };
  skills.hitpoints.xp = xpForLevel(10); // start with Lv.10 HP, RS-style

  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    lastSeen: Date.now(),

    gold: 0,
    lifetimeGold: 0,
    shards: 0,
    ascensions: 0,

    skills,

    // one active pursuit at a time: null | {type:'skill', skillId, actionId, progress(ms)} | {type:'combat'}
    activity: null,

    combat: {
      zoneId: null,
      monsterId: null,
      monsterHp: 0,
      playerHp: 100,
      playerTimer: 0,   // ms accumulated toward next attack
      monsterTimer: 0,
      style: 'attack',  // which skill gets the style XP
      foodItem: null,   // itemId used for auto-eat
      autoPotion: null, // itemId Auto-Elixir keeps topped up
      unstable: false,  // fighting inside an unstable rift
      monsterMaxHp: 0,  // for % based abilities like Execute
      drBurstUntil: 0,
      drBurstValue: 0,
    },

    inventory: {},      // itemId -> qty
    equipment: { weapon: null, helmet: null, chest: null, legs: null, boots: null, ring: null, amulet: null },

    upgrades: {},       // upgradeId -> level
    hirelings: {},      // hirelingId -> level
    hirelingCarry: {},  // skillId -> fractional action progress
    hirelingTask: {},   // skillId -> actionId the hireling is told to farm
    perks: {},          // perkId -> level

    charStats: { STR: 0, AGI: 0, VIT: 0, INT: 0, LUK: 0 },
    statPointsSpent: 0,

    // Class — chosen at character level 10, cleared by Ascension.
    classId: null,
    classChosenAt: 0,
    // Per-class talent progress. Keyed by class id, NEVER reset by
    // anything: this is the game's only permanent progression.
    classProgress: {},

    // Appearance — the hero you actually look like. Survives Ascension.
    look: null,

    stats: {            // lifetime trackers
      kills: 0, deaths: 0, actions: 0, itemsSold: 0, bossKills: 0,
      highestDamage: 0, offlineEarnings: 0,
      aurelionKills: 0, flamesFed: 0,
      dungeonRuns: 0, dungeonClears: {},   // dungeonId -> clears
      potionsDrunk: 0, enchants: 0,
    },

    abilities: {
      known: {},        // abilityId -> learned timestamp
      equipped: { strike: null, guard: null, utility: null },
      cooldowns: {},    // abilityId -> ms remaining
      primed: false,    // manual trigger armed
    },

    buffs: {},          // buffId(itemId) -> { expiresAt, effects, name, icon }
    enchants: {},       // itemId -> enchant level (0-5)
    achievements: {},   // achievementId -> unlock timestamp
    activeTitle: null,  // title string shown on the leaderboard

    // Hearthwick — the town layer. Razed on Ascension (see prestige.js);
    // only the people you met carry over.
    town: {
      unlocked: false,
      name: 'Hearthwick',
      plots: [],          // filled by initTown()
      staff: {},          // staffId -> staff record
      applicants: [],
      applicantsAt: 0,
      lifetimeRevenue: 0,
      cycles: 0,
      unpaid: 0,
      // residents & visitors
      metNotables: {},
      extraPopulation: 0,
      visitor: null,
      nextVisitorAt: 0,
      timesRazed: 0,
      lifetimeRevenueAllCycles: 0,
    },

    // The Menagerie — pets are the one thing that survives Ascension intact.
    pets: {
      owned: {},        // petId -> pet record
      incubator: [],    // eggs currently warming
      active: null,     // petId walking with you
      hatched: 0,
      bred: 0,
      // Species you have ever held an egg of. Kept forever, including
      // through Ascension, so the Menagerie's compendium is a record of
      // what you have found rather than what you happen to own today.
      seen: {},
    },

    // The Codex — discovered world lore, and what the last cycle cost.
    // Persists through Ascension: the world forgets, you don't.
    codex: {
      seen: {},        // entryId -> unlock timestamp
      kills: {},       // monsterId -> lifetime count
      items: {},       // itemId -> ever held
      flags: {},       // one-off story markers
      lastCycle: null, // snapshot used by the return report
      unread: 0,
    },

    // Adventure — the road, and what it remembers about you.
    adventure: { travelled: 0, encounters: 0, chains: 0, flags: {}, seen: {},
                 active: null, nextAt: 0, progress: 0 },

    // Village encounters — fires, raids, thefts, quakes, and the circus
    encounters: { nextAt: 0, offer: null, history: {}, resolved: 0 },

    // Unstable rifts — timed emergency events
    unstable: { nextAt: 0, offer: null, run: null },

    // Story & quests
    quests: { progress: {}, completed: {}, seenOffers: {}, flags: {} },
    bounties: {},        // zoneId -> { kills, claimed }
    loreSeen: {},        // fragmentId -> true (persists across cycles)
    cycleSeen: {},       // cycle revelation shown flags (persists)
    ending: null,        // null | 'fed' | 'broken' (persists)
    endingOfferedCycle: -1,

    // Era II systems. All inert until era >= 2.
    salvage: { sites: [], active: null, nextSiteAt: 0, digs: 0, hauls: {} },
    repo: { nextAt: 0, notice: null, camps: [], seized: 0, recovered: 0, repelled: 0 },
    ledger: { assessed: 0, balance: 0, paid: 0, settled: false, openedAt: 0, graceMs: 0 },
    deep: { best: 0, depth: 1, clears: 0, kills: 0, wardens: 0 },
    worldBoss: { nextAt: 0, playMs: 0, up: false, hp: 0, maxHp: 0, surfacedAt: 0,
                 expiresAt: 0, felled: 0, dealt: 0, contactMs: 0, lastContactAt: 0, prep: 0 },

    // Which Era the world is in. 1 = the sandbox (the tutorial, though
    // nobody has told you that). 2 = the Scrap Wastes, after the break.
    // Persists through Ascension: you cannot fall back into the box.
    era: 1,
    eraEnteredAt: 0,
    eraSeen: {},         // one-off Era intro flags

    log: [],            // recent system log lines [{t, type, text}]
    settings: { logCollapsed: false },
  };
}

export let state = defaultState();

export function replaceState(next) { state = next; }

// ---------------- Derived values ----------------

/**
 * The ceiling on every skill, right now.
 *
 * Inside the sandbox it is 99, and it always was. Out in the Wastes it is
 * 199 — and the XP you banked while capped is still there, so breaking
 * out does not start the second hundred, it HANDS you however much of it
 * you had already earned without being allowed to have.
 *
 * Deliberately implemented here and not in core/xp.js: that file is
 * shared verbatim with the server's anti-cheat check and must stay a pure
 * function of XP. The cap is a rule about the world, not about the curve.
 */
export function levelCap() {
  return (state.era || 1) >= 2 ? MAX_LEVEL : SOFT_CAP;
}

export function skillLevel(skillId) {
  return Math.min(levelForXp(state.skills[skillId].xp), levelCap());
}

/** True XP level, ignoring the era ceiling — for "banked" messaging. */
export function uncappedSkillLevel(skillId) {
  return levelForXp(state.skills[skillId].xp);
}

export function totalSkillLevel() {
  return SKILL_IDS.reduce((sum, id) => sum + skillLevel(id), 0);
}

// LitRPG character level: 1 + one level per 4 total skill levels above base
export function charLevel() {
  const base = SKILL_IDS.length + 9; // starting total (all Lv1 + HP at 10)
  return 1 + Math.max(0, Math.floor((totalSkillLevel() - base) / 4));
}

export function statPointsAvailable() {
  return Math.max(0, (charLevel() - 1) - state.statPointsSpent);
}

export function combatLevel() {
  const a = skillLevel('attack'), s = skillLevel('strength'),
        d = skillLevel('defense'), h = skillLevel('hitpoints');
  return Math.max(1, Math.floor((a + s + d + h) / 3));
}

function upgradeLevel(id) { return state.upgrades[id] || 0; }
function perkLevel(id) { return state.perks[id] || 0; }

function sumEffect(defs, levels, key) {
  let total = 0;
  for (const def of defs) {
    const lvl = levels(def.id);
    if (lvl > 0 && def.effect?.[key]) total += def.effect[key] * lvl;
  }
  return total;
}

// Multipliers ------------------------------------------------

function endingMult() {
  return state.ending === 'broken' ? 1.10 : 1;
}

// Sum of a given effect key across all non-expired potion buffs.
export function buffEffect(key) {
  let total = 0;
  const now = Date.now();
  for (const buff of Object.values(state.buffs || {})) {
    if (buff.expiresAt > now && buff.effects?.[key]) total += buff.effects[key];
  }
  return total;
}

export function activeBuffs() {
  const now = Date.now();
  return Object.entries(state.buffs || {})
    .filter(([, b]) => b.expiresAt > now)
    .map(([id, b]) => ({ id, ...b, remaining: Math.ceil((b.expiresAt - now) / 1000) }));
}

export function enchantLevel(itemId) {
  return (state.enchants || {})[itemId] || 0;
}

export function enchantMult(itemId) {
  return 1 + enchantLevel(itemId) * 0.10;
}

// Town buffs are read lazily to avoid an import cycle with systems/town.js
let _townBuff = () => 0;
export function registerTownBuff(fn) { _townBuff = fn; }
export function townBonus(key) { try { return _townBuff(key) || 0; } catch { return 0; } }

// Same trick for the active pet's bonus (systems/pets.js imports state.js).
let _petBonus = () => 0;
export function registerPetBonus(fn) { _petBonus = fn; }
export function petBonus(key) {
  try {
    const raw = _petBonus(key) || 0;
    // The Spirit Lantern is the one thing that scales a pet rather than
    // adding beside it, so it is applied here rather than in every one of
    // the six multipliers that read a pet bonus.
    // Two things scale a pet rather than adding beside it: the Spirit
    // Lantern and the Beastmaster. Applied here so neither has to be
    // repeated in every multiplier that reads a pet bonus.
    return raw * (1 + abilityBonus('pet_amp') + classBonus('pet_amp'));
  } catch { return 0; }
}

// And once more for your class (systems/classes.js imports state.js).
let _classBonus = () => 0;
export function registerClassBonus(fn) { _classBonus = fn; }
export function classBonus(key) { try { return _classBonus(key) || 0; } catch { return 0; } }

// And the Ledger, once it has been settled.
let _ledgerBonus = () => 0;
export function registerLedgerBonus(fn) { _ledgerBonus = fn; }
export function ledgerBonus(key) { try { return _ledgerBonus(key) || 0; } catch { return 0; } }

// And the Syndicate, while it holds a lien on you. Negative by nature.
let _repoPenalty = () => 0;
export function registerRepoPenalty(fn) { _repoPenalty = fn; }
export function repoPenalty(key) { try { return _repoPenalty(key) || 0; } catch { return 0; } }

// And how far down the Descent you have ever reached. Permanent.
let _deepBonus = () => 0;
export function registerDeepBonus(fn) { _deepBonus = fn; }
export function deepBonus(key) { try { return _deepBonus(key) || 0; } catch { return 0; } }

// And every Vigil you have ever switched off. Also permanent.
let _bossBonus = () => 0;
export function registerBossBonus(fn) { _bossBonus = fn; }
export function bossBonus(key) { try { return _bossBonus(key) || 0; } catch { return 0; } }

// And whatever is in your ability slots. Lets an ability be pure data.
let _abilityBonus = () => 0;
export function registerAbilityBonus(fn) { _abilityBonus = fn; }
export function abilityBonus(key) { try { return _abilityBonus(key) || 0; } catch { return 0; } }

export function xpMultiplier() {
  return (1 + state.shards * SHARD_XP_BONUS)
       * (1 + sumEffect(PERKS, perkLevel, 'xp'))
       * (1 + state.charStats.INT * 0.01)
       * (1 + buffEffect('xp'))
       * (1 + townBonus('xp'))
       * (1 + petBonus('xp'))
       * (1 + classBonus('xp'))
       * endingMult();
}

export function goldMultiplier() {
  return (1 + state.shards * SHARD_GOLD_BONUS)
       * (1 + sumEffect(PERKS, perkLevel, 'gold'))
       * (1 + state.charStats.LUK * 0.005)
       * (1 + buffEffect('gold'))
       * (1 + petBonus('gold'))
       * (1 + classBonus('gold'))
       * (1 + ledgerBonus('gold'))
       * (1 + deepBonus('gold'))
       * (1 + bossBonus('gold'))
       * (1 + abilityBonus('gold'))
       * (1 + repoPenalty('gold'))
       * endingMult();
}

export function combatXpMultiplier() {
  return xpMultiplier() * (1 + (upgradeLevel('dummy') * 0.10));
}

export function dropRateMultiplier() {
  return (1 + sumEffect(PERKS, perkLevel, 'dropRate'))
       * (1 + state.charStats.LUK * 0.005)
       * (1 + buffEffect('dropRate'))
       * (1 + townBonus('drop_rate'))
       * (1 + petBonus('drop_rate'))
       * (1 + classBonus('drop_rate'))
       * (1 + deepBonus('drop_rate'))
       * (1 + abilityBonus('drop_rate'));
}

// Town Market Stalls raise what vendors pay you.
export function sellPriceMultiplier() {
  return 1 + townBonus('sell_price') + classBonus('sell_price') + petBonus('sell_price');
}

// Action time for a skill action after all speed bonuses
export function actionTime(skillId, action) {
  let speedBonus = 0;
  for (const u of UPGRADES) {
    if (u.skill === skillId && u.effect?.speed) speedBonus += u.effect.speed * upgradeLevel(u.id);
  }
  speedBonus += sumEffect(PERKS, perkLevel, 'speed');
  speedBonus += state.charStats.AGI * 0.005;
  speedBonus += buffEffect('speed');
  speedBonus += classBonus('gather_speed');
  speedBonus += petBonus('gather_speed');
  if (skillId === 'woodcutting') speedBonus += townBonus('woodcutting_speed');
  return action.baseTime / (1 + speedBonus);
}

export function doubleChance(skillId) {
  let chance = 0;
  for (const u of UPGRADES) {
    if (u.skill === skillId && u.effect?.double) chance += u.effect.double * upgradeLevel(u.id);
  }
  // Thieving is the one skill where luck is the whole discipline, so LUK
  // pays out here directly instead of only nudging drop tables.
  if (skillId === 'thieving') chance += state.charStats.LUK * 0.004;
  return Math.min(0.95, chance + classBonus('double_chance') + petBonus('double_chance'));
}

export function hirelingRate(skillId) {
  const h = HIRELINGS.find(x => x.skill === skillId);
  if (!h) return 0;
  const lvl = state.hirelings[h.id] || 0;
  if (lvl === 0) return 0;
  return (HIRELING_BASE_RATE + (lvl - 1) * HIRELING_RATE_PER_RANK)
       * (1 + classBonus('hireling_rate'));
}

// Combat-derived stats --------------------------------------

export function gearStats() {
  const total = { atk: 0, str: 0, def: 0, hp: 0 };
  for (const itemId of Object.values(state.equipment)) {
    if (!itemId) continue;
    const item = getItem(itemId);
    if (item?.stats) {
      const mult = enchantMult(itemId);
      for (const k of Object.keys(total)) total[k] += Math.floor((item.stats[k] || 0) * mult);
    }
  }
  return total;
}

export function maxHp() {
  const gear = gearStats();
  return Math.floor((10 * skillLevel('hitpoints') + gear.hp)
                    * (1 + state.charStats.VIT * 0.01)
                    * (1 + classBonus('maxhp'))
                    * (1 + petBonus('maxhp'))
                    * (1 + bossBonus('maxhp')));
}

export function playerAccuracy() {
  return (BALANCE.ACCURACY_BASE
       + skillLevel('attack') * BALANCE.ACCURACY_PER_ATTACK_LEVEL
       + gearStats().atk)
       * (1 + classBonus('accuracy'));
}

export function playerMaxHit() {
  const base = BALANCE.MAXHIT_BASE
             + skillLevel('strength') * BALANCE.MAXHIT_PER_STRENGTH_LEVEL
             + gearStats().str * BALANCE.MAXHIT_PER_GEAR_STR;
  const mult = (1 + upgradeLevel('whetstone') * 0.06)
             * (1 + sumEffect(PERKS, perkLevel, 'damage'))
             * (1 + state.charStats.STR * 0.01)
             * (1 + buffEffect('damage'))
             * (1 + townBonus('damage'))
             * (1 + petBonus('damage'))
             * (1 + classBonus('damage'))
             * (1 + state.charStats.INT * classBonus('int_damage'))
             * (1 + deepBonus('damage'))
             * (1 + bossBonus('damage'))
             * (state.ending === 'broken' ? 1.10 : 1);
  return Math.max(1, Math.floor(base * mult));
}

// Damage floor — rises with Attack, so training Attack now does two jobs:
// land more swings, and make the swings you land less feeble.
export function playerMinHit() {
  const frac = Math.min(
    BALANCE.MINHIT_FRACTION_CAP,
    BALANCE.MINHIT_FRACTION_BASE + skillLevel('attack') * BALANCE.MINHIT_FRACTION_PER_ATTACK_LEVEL
  );
  return Math.max(1, Math.floor(playerMaxHit() * frac));
}

// Chance a swing lands against a given defense value.
export function hitChanceVs(monsterDefense) {
  const acc = playerAccuracy();
  return acc / (acc + monsterDefense + BALANCE.ACCURACY_DEFENSE_CONSTANT);
}

// Expected damage per second against a given defense — used by the UI so
// players can actually see whether an upgrade helped.
export function expectedDps(monsterDefense) {
  const avgHit = (playerMinHit() + playerMaxHit()) / 2;
  return hitChanceVs(monsterDefense) * avgHit / (attackInterval() / 1000);
}

// Rough seconds to kill something with `hp` and `defense`.
export function timeToKill(hp, monsterDefense) {
  const dps = expectedDps(monsterDefense);
  return dps > 0 ? hp / dps : Infinity;
}

export function playerDefenseRating() {
  return skillLevel('defense') * 2 + gearStats().def;
}

export function damageReduction() {
  const dr = playerDefenseRating();
  const flat = Math.min(BALANCE.DR_FLAT_CAP, dr / (dr + BALANCE.DR_SOFTCAP_CONSTANT));
  const mult = Math.min(BALANCE.DR_MULT_CAP, upgradeLevel('polish') * 0.06
             + sumEffect(PERKS, perkLevel, 'reduction')
             + buffEffect('reduction'));
  // A class can push this DOWN (the Mage wears robes), so clamp at zero
  // rather than assuming every modifier is a bonus.
  const total = (flat + mult * (1 - flat)) * (1 + classBonus('dr') + petBonus('dr'));
  return Math.max(0, Math.min(BALANCE.DR_TOTAL_CAP, total));
}

export function attackInterval() {
  return BALANCE.ATTACK_INTERVAL_MS
       / (1 + state.charStats.AGI * 0.005 + buffEffect('speed') + classBonus('attack_speed'));
}

export function offlineCapHours() {
  return 8 + perkLevel('timekeeper') * 6 + townBonus('offline_hours');
}

// Shards you would earn by ascending right now
export function pendingShards() {
  const levels = totalSkillLevel();
  const fromLevels = Math.floor(Math.max(0, levels - 60) / 12);
  const fromGold = Math.floor(Math.cbrt(state.lifetimeGold / 50000));
  return Math.max(0, fromLevels + fromGold);
}

export const ASCEND_MIN_TOTAL_LEVEL = 120;
