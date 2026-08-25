// ============================================================
// SAVE VALIDATION + SERVER-COMPUTED LEADERBOARD STATS
//
// Leaderboard numbers are NEVER taken from client-claimed fields.
// They are recomputed here from the save's raw XP using the same
// curve the game uses (shared import — single source of truth).
//
// This is structural sanity-checking, not anti-cheat: a determined
// player can still edit their local save. It stops garbage data,
// impossible values, and casual leaderboard spoofing.
// ============================================================
import { levelForXp, MAX_LEVEL } from '../../src/core/xp.js';
import { TITLE_SET } from '../../src/data/achievements.js';

const KNOWN_SKILLS = [
  'woodcutting', 'mining', 'fishing', 'smithing', 'cooking', 'alchemy',
  'attack', 'strength', 'defense', 'hitpoints',
];

export const MAX_SAVE_BYTES = 512 * 1024;      // 512 KB
const MAX_XP = 1e12;                            // far beyond level 99 (~13M)
const MAX_CURRENCY = 1e15;
const MAX_COUNT = 1e9;

const clampNum = (v, max, fallback = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, max);
};

/**
 * @returns {{ ok: true, save: object, derived: object } | { ok: false, error: string }}
 */
export function validateSave(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'save must be an object' };
  }

  const bytes = Buffer.byteLength(JSON.stringify(raw), 'utf8');
  if (bytes > MAX_SAVE_BYTES) {
    return { ok: false, error: `save too large (${bytes} bytes, max ${MAX_SAVE_BYTES})` };
  }

  if (!raw.skills || typeof raw.skills !== 'object') {
    return { ok: false, error: 'save.skills missing' };
  }

  // --- normalize skills, clamp XP ---
  const skills = {};
  for (const id of KNOWN_SKILLS) {
    const xp = clampNum(raw.skills[id]?.xp, MAX_XP);
    skills[id] = { xp };
  }

  // --- normalize currencies/counters ---
  const save = {
    ...raw,
    skills,
    gold: clampNum(raw.gold, MAX_CURRENCY),
    lifetimeGold: clampNum(raw.lifetimeGold, MAX_CURRENCY),
    shards: clampNum(raw.shards, MAX_COUNT),
    ascensions: clampNum(raw.ascensions, MAX_COUNT),
  };

  if (raw.stats && typeof raw.stats === 'object') {
    save.stats = {
      ...raw.stats,
      kills: clampNum(raw.stats.kills, MAX_COUNT),
      deaths: clampNum(raw.stats.deaths, MAX_COUNT),
      actions: clampNum(raw.stats.actions, MAX_COUNT),
      bossKills: clampNum(raw.stats.bossKills, MAX_COUNT),
      itemsSold: clampNum(raw.stats.itemsSold, MAX_COUNT),
      highestDamage: clampNum(raw.stats.highestDamage, MAX_COUNT),
    };
  }

  // --- derive leaderboard stats server-side from raw XP ---
  let totalLevel = 0;
  for (const id of KNOWN_SKILLS) {
    totalLevel += Math.min(MAX_LEVEL, levelForXp(skills[id].xp));
  }
  const combatLevel = Math.max(1, Math.floor(
    (levelForXp(skills.attack.xp) + levelForXp(skills.strength.xp) +
     levelForXp(skills.defense.xp) + levelForXp(skills.hitpoints.xp)) / 3
  ));

  const questsDone = save.quests?.completed && typeof save.quests.completed === 'object'
    ? Object.values(save.quests.completed).filter(Boolean).length
    : 0;

  // Title: cosmetic, but only known titles are stored.
  const title = typeof raw.activeTitle === 'string' && TITLE_SET.has(raw.activeTitle)
    ? raw.activeTitle : null;

  const derived = {
    totalLevel,
    combatLevel,
    shards: Math.floor(save.shards),
    ascensions: Math.floor(save.ascensions),
    lifetimeGold: Math.floor(save.lifetimeGold),
    bossKills: Math.floor(save.stats?.bossKills || 0),
    questsDone: Math.min(questsDone, 100),
    cyclebreaker: save.ending === 'broken',
    title,
  };

  return { ok: true, save, derived };
}
