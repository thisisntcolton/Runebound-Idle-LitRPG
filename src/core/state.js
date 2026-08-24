// ============================================================
// GAME STATE — single mutable object + derived-stat helpers
// ============================================================
import { SKILL_IDS, TRAINABLE_SKILLS, COMBAT_SKILLS, SKILLS } from '../data/skills.js';
import { UPGRADES, HIRELINGS, PERKS, SHARD_XP_BONUS, SHARD_GOLD_BONUS,
         HIRELING_BASE_RATE, HIRELING_RATE_PER_RANK } from '../data/upgrades.js';
import { getItem } from '../data/items.js';
import { levelForXp, xpForLevel } from './xp.js';

export const SAVE_VERSION = 1;

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
    },

    inventory: {},      // itemId -> qty
    equipment: { weapon: null, helmet: null, chest: null, legs: null, boots: null, ring: null, amulet: null },

    upgrades: {},       // upgradeId -> level
    hirelings: {},      // hirelingId -> level
    hirelingCarry: {},  // skillId -> fractional action progress
    perks: {},          // perkId -> level

    charStats: { STR: 0, AGI: 0, VIT: 0, INT: 0, LUK: 0 },
    statPointsSpent: 0,

    stats: {            // lifetime trackers
      kills: 0, deaths: 0, actions: 0, itemsSold: 0, bossKills: 0,
      highestDamage: 0, offlineEarnings: 0,
    },

    // Story & quests
    quests: { progress: {}, completed: {}, seenOffers: {} },
    bounties: {},        // zoneId -> { kills, claimed }
    loreSeen: {},        // fragmentId -> true (persists across cycles)
    cycleSeen: {},       // cycle revelation shown flags (persists)
    ending: null,        // null | 'fed' | 'broken' (persists)
    endingOfferedCycle: -1,

    log: [],            // recent system log lines [{t, type, text}]
    settings: { logCollapsed: false },
  };
}

export let state = defaultState();

export function replaceState(next) { state = next; }

// ---------------- Derived values ----------------

export function skillLevel(skillId) {
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

export function xpMultiplier() {
  return (1 + state.shards * SHARD_XP_BONUS)
       * (1 + sumEffect(PERKS, perkLevel, 'xp'))
       * (1 + state.charStats.INT * 0.01)
       * endingMult();
}

export function goldMultiplier() {
  return (1 + state.shards * SHARD_GOLD_BONUS)
       * (1 + sumEffect(PERKS, perkLevel, 'gold'))
       * (1 + state.charStats.LUK * 0.005)
       * endingMult();
}

export function combatXpMultiplier() {
  return xpMultiplier() * (1 + (upgradeLevel('dummy') * 0.10));
}

export function dropRateMultiplier() {
  return (1 + sumEffect(PERKS, perkLevel, 'dropRate'))
       * (1 + state.charStats.LUK * 0.005);
}

// Action time for a skill action after all speed bonuses
export function actionTime(skillId, action) {
  let speedBonus = 0;
  for (const u of UPGRADES) {
    if (u.skill === skillId && u.effect?.speed) speedBonus += u.effect.speed * upgradeLevel(u.id);
  }
  speedBonus += sumEffect(PERKS, perkLevel, 'speed');
  speedBonus += state.charStats.AGI * 0.005;
  return action.baseTime / (1 + speedBonus);
}

export function doubleChance(skillId) {
  let chance = 0;
  for (const u of UPGRADES) {
    if (u.skill === skillId && u.effect?.double) chance += u.effect.double * upgradeLevel(u.id);
  }
  return chance;
}

export function hirelingRate(skillId) {
  const h = HIRELINGS.find(x => x.skill === skillId);
  if (!h) return 0;
  const lvl = state.hirelings[h.id] || 0;
  if (lvl === 0) return 0;
  return HIRELING_BASE_RATE + (lvl - 1) * HIRELING_RATE_PER_RANK;
}

// Combat-derived stats --------------------------------------

export function gearStats() {
  const total = { atk: 0, str: 0, def: 0, hp: 0 };
  for (const itemId of Object.values(state.equipment)) {
    if (!itemId) continue;
    const item = getItem(itemId);
    if (item?.stats) {
      for (const k of Object.keys(total)) total[k] += item.stats[k] || 0;
    }
  }
  return total;
}

export function maxHp() {
  const gear = gearStats();
  return Math.floor((10 * skillLevel('hitpoints') + gear.hp) * (1 + state.charStats.VIT * 0.01));
}

export function playerAccuracy() {
  return 14 + skillLevel('attack') * 2 + gearStats().atk;
}

export function playerMaxHit() {
  const base = 4 + skillLevel('strength') * 0.8 + gearStats().str * 0.5;
  const mult = (1 + upgradeLevel('whetstone') * 0.06)
             * (1 + sumEffect(PERKS, perkLevel, 'damage'))
             * (1 + state.charStats.STR * 0.01)
             * (state.ending === 'broken' ? 1.10 : 1);
  return Math.max(1, Math.floor(base * mult));
}

export function playerDefenseRating() {
  return skillLevel('defense') * 2 + gearStats().def;
}

export function damageReduction() {
  const flat = Math.min(0.6, playerDefenseRating() / (playerDefenseRating() + 220));
  const mult = Math.min(0.35, upgradeLevel('polish') * 0.06 + sumEffect(PERKS, perkLevel, 'reduction'));
  return Math.min(0.85, flat + mult * (1 - flat));
}

export function attackInterval() {
  return 2400 / (1 + state.charStats.AGI * 0.005);
}

export function offlineCapHours() {
  return 8 + perkLevel('timekeeper') * 6;
}

// Shards you would earn by ascending right now
export function pendingShards() {
  const levels = totalSkillLevel();
  const fromLevels = Math.floor(Math.max(0, levels - 60) / 12);
  const fromGold = Math.floor(Math.cbrt(state.lifetimeGold / 50000));
  return Math.max(0, fromLevels + fromGold);
}

export const ASCEND_MIN_TOTAL_LEVEL = 120;
