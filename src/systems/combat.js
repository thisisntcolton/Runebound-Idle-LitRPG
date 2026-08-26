// ============================================================
// COMBAT — auto-battle, loot, food, death
// ============================================================
import { state, playerAccuracy, playerMaxHit, playerMinHit, playerDefenseRating,
         damageReduction, attackInterval, maxHp, combatLevel,
         combatXpMultiplier, dropRateMultiplier, BALANCE } from '../core/state.js';
import { getZone, getMonster } from '../data/monsters.js';
import { getAction } from '../data/skills.js';
import { getDungeon, waveMonster, totalWaves } from '../data/dungeons.js';
import { rollLoot } from '../data/loot.js';
import { getItem } from '../data/items.js';
import { emit, on } from '../core/events.js';
import { addGold, addItem, itemCount, removeItem } from './inventory.js';
import { rollEggDrop } from './pets.js';
import { creditClear } from './repo.js';
import { creditDescent, deep } from './deep.js';
import { engage as bossEngage, tickAura, creditDamage as bossDamage, disengage as bossDisengage,
         bossMonster, isUp as bossIsUp, prepMultiplier, boss as bossState } from './worldboss.js';
import { deepMonster } from '../data/deep.js';
import { rollCrit, critMultiplier, consumeGuaranteedHit, resetQuarry,
         applyBurn, tickBurn, clearBurn, mendOnKill,
         overLevelDamageMult, overLevelLootMult, overLevelGap,
         executesOnCrit, executeThreshold, ignoresZoneGate, hasTalentFlag } from './classes.js';
import { classBonus } from '../core/state.js';
import { petFighting } from './pets.js';
import { addXp, stopActivity } from './skills.js';
import { levelForXp, xpForLevel } from '../core/xp.js';
import { onUnstableKill, waveMonsterFor, failRun } from './unstable.js';
import { applyStrike, applyGuard, applySurvival, tickUtility, autoElixirWants,
         shredFactor, clearShred } from './abilities.js';
import { drinkPotion } from './potions.js';

const RESPAWN_MS = 1200;
const WAVE_MS = 800; // short breather between rift waves

// The thing currently being fought — zone monster, rift wave, or an
// unstable-rift spawn.
export function currentMonster() {
  const c = state.combat;
  if (c.worldBoss) return bossMonster();
  // A guard you brought on yourself. Stored whole on the combat state so
  // it survives a reload mid-fight without needing a lookup table.
  if (c.guard) return c.guard;
  if (c.deep) {
    // Generated per floor. `variant` rotates the flavour so a floor is not
    // eight identical things in a row.
    return deepMonster(c.deepDepth || 1, c.deepVariant || 0);
  }
  if (c.unstable) {
    const run = state.unstable?.run;
    return run ? waveMonsterFor(run.waves) : null;
  }
  if (c.dungeonId) {
    const d = getDungeon(c.dungeonId);
    return d ? waveMonster(d, c.wave || 0) : null;
  }
  return getMonster(c.zoneId, c.monsterId);
}

export function startCombat(zoneId, monsterId) {
  const zone = getZone(zoneId);
  const monster = getMonster(zoneId, monsterId);
  if (!zone || !monster) return false;
  if (combatLevel() < zone.level && !ignoresZoneGate()) {
    emit('notify', { type: 'sys', text: `${zone.name} requires Combat Lv. ${zone.level}` });
    return false;
  }
  stopActivity({ silent: true });
  state.activity = { type: 'combat' };
  const c = state.combat;
  c.dungeonId = null;
  c.deep = false;
  c.worldBoss = false;
  c.guard = null;
  c.wave = 0;
  c.zoneId = zoneId;
  c.monsterId = monsterId;
  c.monsterHp = monster.hp;
  c.monsterMaxHp = monster.hp;
  c.playerHp = Math.min(c.playerHp > 0 ? c.playerHp : maxHp(), maxHp());
  c.playerTimer = 0;
  c.monsterTimer = 0;
  c.respawn = 0;
  resetQuarry();
  clearBurn();
  ensureFood();
  emit('notify', { type: 'combat', text: `Engaged: ${monster.name} (${zone.name})` });
  emit('state-changed');
  return true;
}

// ---------- The Descent ----------
//
// Deliberately NOT a zone. A zone is a place you select from a list and
// then stop thinking about; the Descent is a ladder with exactly one next
// rung, and the floor you are on is state that lives in systems/deep.js
// rather than in a data file. Combat only needs to know that it is down
// there and which floor.

export function startDescent() {
  const d = deep();
  if ((state.era || 1) < 2) return false;
  stopActivity({ silent: true });
  state.activity = { type: 'combat' };
  const c = state.combat;
  c.dungeonId = null;
  c.unstable = false;
  c.worldBoss = false;
  c.guard = null;
  c.zoneId = null;
  c.monsterId = null;
  c.wave = 0;
  c.deep = true;
  c.deepDepth = d.depth || 1;
  c.deepVariant = 0;
  const m = deepMonster(c.deepDepth, 0);
  c.monsterHp = m.hp;
  c.monsterMaxHp = m.hp;
  c.playerHp = Math.min(c.playerHp > 0 ? c.playerHp : maxHp(), maxHp());
  c.playerTimer = 0;
  c.monsterTimer = 0;
  c.respawn = 0;
  resetQuarry();
  clearBurn();
  ensureFood();
  emit('notify', { type: 'combat', text: `⬇️ You go down to floor ${c.deepDepth}. ${m.icon} ${m.name} is already there.` });
  emit('state-changed');
  return true;
}

// ---------- The world boss ----------
//
// A separate entry point rather than a zone, for the same reason the
// Descent is: the health pool does not belong to the encounter, it belongs
// to the save. Combat borrows the bar for a round and hands it back.

export function startBossFight() {
  if (!bossIsUp()) return false;
  if (!bossEngage()) return false;         // locks in preparation for this round
  stopActivity({ silent: true });
  state.activity = { type: 'combat' };
  const c = state.combat;
  c.dungeonId = null;
  c.unstable = false;
  c.deep = false;
  c.guard = null;
  c.zoneId = null;
  c.monsterId = null;
  c.wave = 0;
  c.worldBoss = true;
  const m = bossMonster();
  c.monsterMaxHp = m.hp;
  c.monsterHp = bossState().hp;            // resume, do not restart
  c.playerHp = Math.min(c.playerHp > 0 ? c.playerHp : maxHp(), maxHp());
  c.playerTimer = 0;
  c.monsterTimer = 0;
  c.respawn = 0;
  resetQuarry();
  clearBurn();
  ensureFood();
  emit('notify', { type: 'combat',
    text: `${m.icon} You walk into its shadow. Preparation locked at ×${prepMultiplier().toFixed(2)}.` });
  emit('state-changed');
  return true;
}

// ---------- Caught in the act ----------
//
// Entered involuntarily, so it does two things nothing else does: it
// remembers what you were stealing so the skill can be resumed when the
// guard is down, and it does NOT carry the ordinary death penalty. A
// thief who gets caught loses the argument, not their bank.

export function startGuardFight(guard, resume = null) {
  if (!guard) return false;
  stopActivity({ silent: true });
  state.activity = { type: 'combat' };
  const c = state.combat;
  c.dungeonId = null;
  c.unstable = false;
  c.deep = false;
  c.worldBoss = false;
  c.zoneId = null;
  c.monsterId = null;
  c.wave = 0;
  c.guard = guard;
  c.guardResume = resume;              // { skillId, actionId }
  c.monsterHp = guard.hp;
  c.monsterMaxHp = guard.hp;
  c.playerHp = Math.min(c.playerHp > 0 ? c.playerHp : maxHp(), maxHp());
  c.playerTimer = 0;
  c.monsterTimer = 0;
  c.respawn = 0;
  resetQuarry();
  clearBurn();
  ensureFood();
  emit('state-changed');
  return true;
}

export function stopCombat({ silent = false } = {}) {
  if (state.activity?.type === 'combat') {
    const wasRift = !!state.combat.dungeonId;
    const wasBoss = !!state.combat.worldBoss;
    state.activity = null;
    state.combat.dungeonId = null;
    state.combat.unstable = false;
    state.combat.deep = false;
    if (state.combat.worldBoss) bossDisengage();
    state.combat.worldBoss = false;
    state.combat.guard = null;
    state.combat.wave = 0;
    if (!silent) emit('notify', { type: 'combat', text: wasRift
      ? 'You step back through the rift. The run is abandoned.'
      : wasBoss
        ? 'You back out of its shadow. Everything you took off it stays off it.'
        : 'You retreat from battle.' });
    emit('state-changed');
  }
}

// ---------- Rifts ----------
export function startDungeon(dungeonId) {
  const d = getDungeon(dungeonId);
  if (!d) return false;
  if (combatLevel() < d.level) {
    emit('notify', { type: 'sys', text: `${d.name} requires Combat Lv. ${d.level}` });
    return false;
  }
  stopActivity({ silent: true });
  state.activity = { type: 'combat' };
  const c = state.combat;
  c.dungeonId = dungeonId;
  c.deep = false;
  c.worldBoss = false;
  c.guard = null;
  c.wave = 0;
  c.zoneId = null;
  c.monsterId = null;
  c.monsterHp = waveMonster(d, 0).hp;
  c.monsterMaxHp = waveMonster(d, 0).hp;
  c.playerHp = Math.min(c.playerHp > 0 ? c.playerHp : maxHp(), maxHp());
  c.playerTimer = 0;
  c.monsterTimer = 0;
  c.respawn = 0;
  resetQuarry();
  clearBurn();
  ensureFood();
  emit('notify', { type: 'combat', text: `🌀 You step into ${d.name} — wave 1 of ${totalWaves(d)}` });
  emit('state-changed');
  return true;
}

function completeDungeon(d) {
  const c = state.combat;
  state.stats.dungeonRuns = (state.stats.dungeonRuns || 0) + 1;
  if (!state.stats.dungeonClears) state.stats.dungeonClears = {};
  state.stats.dungeonClears[d.id] = (state.stats.dungeonClears[d.id] || 0) + 1;

  const r = d.rewards;
  const gold = addGold(r.gold[0] + Math.random() * (r.gold[1] - r.gold[0]), { silent: true });
  const parts = [`🪙 ${gold}`];
  for (const [runeId, [lo, hi]] of Object.entries(r.runes || {})) {
    const qty = lo + Math.floor(Math.random() * (hi - lo + 1));
    if (qty > 0) {
      addItem(runeId, qty);
      parts.push(`${getItem(runeId)?.icon} ${getItem(runeId)?.name} ×${qty}`);
    }
  }
  const dropMult = dropRateMultiplier();
  for (const u of r.uniques || []) {
    if (Math.random() < Math.min(0.5, u.chance * dropMult)) {
      const item = getItem(u.item);
      addItem(u.item, 1);
      parts.push(`✦ ${item?.icon} ${item?.name}`);
      emit('rare-drop', { itemId: u.item, rarity: item?.rarity });
      emit('notify', { type: 'loot', text: `✦ RIFT TREASURE — ${item?.name}` });
    }
  }
  emit('notify', { type: 'gold', text: `🌀 ${d.name} cleared! ${parts.join(' · ')}` });
  emit('dungeon-complete', { dungeonId: d.id });

  // auto-repeat: back to wave 1
  c.wave = 0;
  c.respawn = RESPAWN_MS;
}

export function setCombatStyle(style) {
  if (['attack', 'strength', 'defense'].includes(style)) {
    state.combat.style = style;
    emit('state-changed');
  }
}

export function setFood(itemId) {
  state.combat.foodItem = itemId;
  emit('state-changed');
}

/** Best food you're carrying, by heal amount. */
export function bestFood() {
  let best = null;
  for (const [id, qty] of Object.entries(state.inventory)) {
    if (qty <= 0) continue;
    const item = getItem(id);
    if (item?.type === 'food' && item.heal) {
      if (!best || item.heal > best.heal) best = item;
    }
  }
  return best;
}

/**
 * Never let the player walk into a fight with an empty food slot when
 * they're carrying something edible.
 */
export function ensureFood({ announce = true } = {}) {
  const c = state.combat;
  const current = c.foodItem ? getItem(c.foodItem) : null;
  if (current && itemCount(c.foodItem) > 0) return current;
  const best = bestFood();
  if (!best) {
    if (announce && !c.warnedNoFood) {
      c.warnedNoFood = true;
      emit('notify', { type: 'combat', text: '⚠ No food in your bags — you are fighting without a safety net.' });
    }
    c.foodItem = null;
    return null;
  }
  c.warnedNoFood = false;
  if (c.foodItem !== best.id) {
    c.foodItem = best.id;
    if (announce) emit('notify', { type: 'sys', text: `🍖 Auto-eat set to ${best.name} (heals ${best.heal}).` });
  }
  return best;
}

function tryEat() {
  const c = state.combat;
  const cap = maxHp();
  if (c.playerHp > cap * 0.5) return;
  ensureFood();                       // top the slot back up if it ran dry
  const foodId = c.foodItem;
  if (!foodId) return;
  const item = getItem(foodId);
  if (!item?.heal) return;
  let guard = 0;
  while (c.playerHp <= cap * 0.5 && itemCount(foodId) > 0 && guard++ < 20) {
    removeItem(foodId, 1);
    c.playerHp = Math.min(cap, c.playerHp + item.heal);
    emit('combat-hit', { source: 'heal', damage: item.heal });
  }
  if (itemCount(foodId) === 0) {
    emit('notify', { type: 'combat', text: `You're out of ${item.name}!` });
    c.foodItem = null;
    ensureFood();                     // fall back to the next best thing
  }
}

function onDungeonKill(monster) {
  const c = state.combat;
  const d = getDungeon(c.dungeonId);
  state.stats.kills++;
  const mended = mendOnKill();
  if (mended > 0) emit('combat-hit', { source: 'heal', damage: mended });
  if (monster.boss) state.stats.bossKills++;
  const gold = addGold(monster.gold[0] + Math.random() * (monster.gold[1] - monster.gold[0]), { silent: true });
  if (monster.boss) rollEggDrop('boss');
  emit('kill', { monsterId: monster.name, zoneId: null, dungeonId: d.id, boss: !!monster.boss });

  c.wave = (c.wave || 0) + 1;
  if (c.wave >= totalWaves(d)) {
    completeDungeon(d);
  } else {
    emit('notify', { type: 'combat', text: `${monster.name} down (+${gold} gold) — wave ${c.wave + 1} of ${totalWaves(d)}` });
    c.respawn = WAVE_MS;
  }
}

function onKill(monster) {
  const c = state.combat;
  // The Vigil's death is owned by systems/worldboss.js. Bail out WITHOUT
  // stopping combat: the wrapping tick still has to read the bar, scale
  // the damage by preparation and write it through to the persistent
  // pool, and stopping here clears the flag it uses to know to do that —
  // which meant the last hit landed on nothing and the boss could not be
  // killed at all. Just return; the wrapper finishes the job.
  if (c.worldBoss) return;
  state.stats.kills++;
  const mended = mendOnKill();
  if (mended > 0) emit('combat-hit', { source: 'heal', damage: mended });
  if (monster.boss) state.stats.bossKills++;
  if (monster.id === 'aurelion') state.stats.aurelionKills = (state.stats.aurelionKills || 0) + 1;

  // Punching above your weight pays better, for classes that can.
  const lootMult = overLevelLootMult(monster);
  const gap = overLevelGap(monster);
  const gold = addGold((monster.gold[0] + Math.random() * (monster.gold[1] - monster.gold[0])) * lootMult, { silent: true });
  emit('notify', { type: 'gold', text: gap > 0 && lootMult > 1
    ? `${monster.name} slain · +${gold} gold (⚖️ ${gap} levels above you)`
    : `${monster.name} slain · +${gold} gold` });

  // Rarity-tier loot: roll a tier, then pull from this monster's pool.
  for (const drop of rollLoot(monster, dropRateMultiplier() * lootMult - 1)) {
    const item = getItem(drop.item);
    if (!item) continue;
    addItem(drop.item, drop.qty);
    emit('loot', { itemId: drop.item, qty: drop.qty, source: 'combat', rarity: item.rarity, tier: drop.tier });

    const banner = { rare: '✦ RARE', epic: '✦✦ EPIC', legendary: '✦✦✦ LEGENDARY' }[drop.tier];
    emit('notify', { type: 'loot', text: `${banner ? banner + ' DROP — ' : ''}${item.icon} ${item.name}${drop.qty > 1 ? ' ×' + drop.qty : ''}` });
    if (banner) emit('rare-drop', { itemId: drop.item, rarity: item.rarity, tier: drop.tier });
  }
  if (monster.boss) rollEggDrop('boss');
  // You won the argument. Take their purse and get back to work — being
  // dumped out to an idle screen after every caught steal would make the
  // whole system feel like a punishment for training the skill.
  if (c.guard) {
    const resume = c.guardResume;
    state.stats.theftsFought = (state.stats.theftsFought || 0) + 1;
    emit('notify', { type: 'gold', text: `🗝️ ${monster.name} down. You keep the haul and their purse.` });
    emit('theft-won', { guard: monster, resume });
    c.guard = null;
    c.guardResume = null;
    stopCombat({ silent: true });
    if (resume) emit('theft-resume', resume);
    return;
  }
  // Clearing a Syndicate camp is what gets your property back.
  if (c.zoneId === 'repo_camp') creditClear();
  // A Descent kill credits the floor, and rolls the next denizen's flavour.
  if (c.deep) {
    creditDescent(monster);
    c.deepVariant = ((c.deepVariant || 0) + 1) % 8;
    c.deepDepth = deep().depth;
  }
  emit('kill', { monsterId: monster.id, zoneId: c.zoneId, boss: !!monster.boss });
  c.respawn = RESPAWN_MS;
}

// How long the Wounded debuff lasts, and how hard it bites.
const WOUNDED_MS = 180000;
const WOUNDED = { damage: -0.25, speed: -0.15 };

function onDeath() {
  const c = state.combat;
  // Losing to a guard is its own, much gentler ending: you drop what you
  // just lifted and you are turned out wounded. No gold loss, no XP loss.
  // The risk is meant to make thieving interesting, not to make an idle
  // player wake up broke.
  if (c.guard) {
    const guard = c.guard;
    const action = c.guardResume ? getAction('thieving', c.guardResume.actionId) : null;
    for (const itemId of Object.keys(action?.output || {})) removeItem(itemId, 1);
    state.stats.deaths++;
    state.buffs.wounded = { expiresAt: Date.now() + WOUNDED_MS, effects: WOUNDED,
      name: 'Wounded', icon: '🩸' };
    c.playerHp = maxHp();
    c.guard = null;
    c.guardResume = null;
    emit('notify', { type: 'combat',
      text: `🗝️ ${guard.name} has you. You drop what you lifted and they let you go, eventually.` });
    emit('theft-lost', { guard });
    stopCombat({ silent: true });
    emit('state-changed');
    return;
  }
  const inRift = !!c.dungeonId;
  const zone = c.zoneId ? getZone(c.zoneId) : null;
  state.stats.deaths++;

  // 1. Gold — scales with how dangerous the ground was. Rifts hurt most.
  //    The Descent sits between the two, and does NOT cost you a floor:
  //    the ladder is progress you have banked, and taking it back for a
  //    death is the punishment that makes people stop climbing.
  const rate = inRift ? 0.12
    : c.deep ? 0.10
    : Math.min(0.10, 0.03 + (zone?.level || 1) * 0.0008);
  const goldLost = Math.floor(state.gold * rate);
  state.gold -= goldLost;

  // 2. XP — you lose ground in the style you were training, but never a level.
  const styleId = c.style || 'attack';
  const skill = state.skills[styleId];
  const lvl = levelForXp(skill.xp);
  const floorXp = xpForLevel(lvl);
  const intoLevel = skill.xp - floorXp;
  const xpLost = Math.floor(intoLevel * 0.15);
  skill.xp = Math.max(floorXp, skill.xp - xpLost);

  // 3. Dropped supplies — panic costs you a third of your current food.
  let foodLost = 0;
  if (c.foodItem && itemCount(c.foodItem) > 0) {
    foodLost = Math.max(1, Math.floor(itemCount(c.foodItem) / 3));
    removeItem(c.foodItem, foodLost);
  }

  // 4. Wounded — a real reason not to charge straight back in.
  state.buffs.wounded = {
    expiresAt: Date.now() + WOUNDED_MS,
    effects: WOUNDED,
    name: 'Wounded',
    icon: '🩸',
  };

  const foodItem = c.foodItem ? getItem(c.foodItem) : null;
  emit('notify', { type: 'combat', text: inRift
    ? `☠ The Rift rejects you — run lost. (-${goldLost} gold, -${xpLost} ${styleId} XP)`
    : c.deep
      ? `☠ Floor ${c.deepDepth} keeps you. Something walks you back up. (-${goldLost} gold, -${xpLost} ${styleId} XP)`
      : `☠ You fall in battle. (-${goldLost} gold, -${xpLost} ${styleId} XP)` });
  emit('death', {
    goldLost, xpLost, styleId, foodLost,
    foodName: foodItem?.name,
    inRift,
    where: inRift ? getDungeon(c.dungeonId)?.name : zone?.name,
  });

  c.playerHp = maxHp();
  if (c.unstable) failRun('You were cut down inside the tear.');
  stopCombat({ silent: true });
  emit('state-changed');
}

/**
 * The boss round, wrapped around the ordinary combat tick.
 *
 * Two things have to happen that no other fight needs: damage is scaled by
 * the preparation locked in at engagement and written through to the
 * persistent pool rather than to the bar, and the aura bleeds you on a
 * ramp for as long as you hold contact. Doing it as a wrapper keeps the
 * inner tick — which every other fight in the game shares — untouched.
 */
// The two ends of the theft loop, wired through the bus rather than by
// import so systems/skills.js and systems/combat.js stay mutually
// ignorant — they already import each other in one direction and a second
// would be a cycle.
export function initCombat() {
  on('theft-noticed', ({ guard, action }) => {
    startGuardFight(guard, { skillId: 'thieving', actionId: action.id });
  });
}

export function tickCombat(dt) {
  const c = state.combat;
  if (state.activity?.type !== 'combat' || !c.worldBoss) { runCombatTick(dt); return; }

  const before = c.monsterHp;
  runCombatTick(dt);
  if (!state.combat.worldBoss || state.activity?.type !== 'combat') return;

  const raw = before - c.monsterHp;
  if (raw > 0) {
    const felled = bossDamage(raw * prepMultiplier());
    c.monsterHp = bossState().hp;
    if (felled) { stopCombat({ silent: true }); return; }
  }

  // The aura. It does not miss and it does not care about your armour;
  // the only thing that softens it is having turned up ready.
  const aura = tickAura(dt);
  if (aura > 0) {
    c.playerHp -= aura;
    if (c.playerHp <= 0) {
      // Forced out, not killed. No gold lost, no XP lost — the cost is the
      // Wounded debuff and having to walk back. Real loss here would teach
      // people not to engage at all, which is the opposite of the point.
      c.playerHp = Math.max(1, Math.round(maxHp() * 0.25));
      state.buffs.wounded = { expiresAt: Date.now() + 180000,
        effects: { damage: -0.25, speed: -0.15 }, name: 'Wounded', icon: '🩸' };
      emit('notify', { type: 'combat',
        text: '🗼 Its presence gets too heavy and puts you on the slab. You crawl out. It is still standing.' });
      stopCombat({ silent: true });
      return;
    }
  }
}

function runCombatTick(dt) {
  if (state.activity?.type !== 'combat') return;
  const c = state.combat;
  const monster = currentMonster();
  if (!monster) { stopCombat({ silent: true }); return; }

  // waiting on respawn
  if (c.respawn > 0) {
    c.respawn -= dt;
    if (c.respawn <= 0) {
      c.monsterHp = monster.hp;
      c.monsterMaxHp = monster.hp;
      c.playerTimer = 0;
      c.monsterTimer = 0;
      resetQuarry();     // a fresh target earns a fresh guaranteed hit
      clearBurn();       // the last one's fire dies with it
      clearShred();      // and its broken guard does not transfer
    }
    return;
  }

  c.playerTimer += dt;
  c.monsterTimer += dt;

  // Mage's Ember burns between swings
  const burn = tickBurn(dt);
  if (burn > 0) {
    const dmg = Math.max(1, Math.round(burn));
    c.monsterHp -= dmg;
    emit('combat-hit', { source: 'burn', damage: dmg });
    if (c.monsterHp <= 0) {
      if (c.dungeonId) onDungeonKill(monster); else onKill(monster);
      return;
    }
  }

  // Utility slot: bombs on their own timer, auto-elixir top-ups
  tickUtility((dmg, ability) => {
    c.monsterHp -= dmg;
    emit('combat-hit', { source: 'player', damage: dmg, ability: ability.name });
    emit('notify', { type: 'combat', text: `${ability.icon} ${ability.name} — ${dmg} damage` });
    emit('ability-used', { slot: 'utility' });
  });
  const wantPotion = autoElixirWants();
  if (wantPotion) drinkPotion(wantPotion);
  if (c.monsterHp <= 0) {
    if (c.dungeonId) onDungeonKill(monster); else onKill(monster);
    return;
  }

  // Player attack
  const pInterval = attackInterval();
  if (c.playerTimer >= pInterval) {
    c.playerTimer -= pInterval;
    const acc = playerAccuracy();
    // Sunder breaks the target's guard for the rest of the fight, so the
    // defence the accuracy roll sees is whatever is left of it.
    const effDef = monster.defense * shredFactor();
    const hitChance = acc / (acc + effDef + BALANCE.ACCURACY_DEFENSE_CONSTANT);
    // Ranger's Quarry: the opening swing on a fresh target is a certainty.
    const guaranteed = consumeGuaranteedHit();
    if (guaranteed || Math.random() < hitChance) {
      // Roll between your floor and ceiling, not between 1 and your ceiling.
      const lo = playerMinHit();
      const hi = playerMaxHit();
      let base = lo + Math.floor(Math.random() * (hi - lo + 1));

      // Priest's Trial by Fire: the bonus exists only when the fight is
      // unfair, and scales with how unfair.
      base = Math.round(base * overLevelDamageMult(monster));

      // Rogue's Backstab: a flat chance to double the swing before any
      // ability multiplies it, so crit and Strike stack the way you'd hope.
      const crit = rollCrit();
      if (crit) base = Math.round(base * critMultiplier());

      // Strike ability may amplify or multi-hit this swing
      const strike = applyStrike(base);
      state.abilities.primed = false;
      let total = 0;
      for (let h = 0; h < strike.hits; h++) {
        const dmg = strike.damage;
        c.monsterHp -= dmg;
        total += dmg;
        if (dmg > state.stats.highestDamage) state.stats.highestDamage = dmg;
        emit('combat-hit', { source: 'player', damage: dmg, ability: strike.label });
        if (c.monsterHp <= 0) break;
      }
      if (strike.label) {
        emit('notify', { type: 'combat', text: `${strike.label}! ${total} damage` });
        emit('ability-used', { slot: 'strike' });
      }
      // The Beastmaster's companion fights. It adds a share of the swing
      // you just made, and only when there is actually something walking
      // with you that is in a fit state to help.
      const petShare = classBonus('pet_damage');
      if (petShare > 0 && total > 0 && petFighting()) {
        const bite = Math.max(1, Math.round(total * petShare));
        c.monsterHp -= bite;
        emit('combat-hit', { source: 'player', damage: bite, ability: 'your companion' });
        if (c.monsterHp <= 0) {
          if (c.dungeonId) onDungeonKill(monster); else onKill(monster);
          return;
        }
      }

      // Bloodletter takes a share of what it dealt back as health.
      if (strike.heal > 0) {
        const cap = maxHp();
        const before = c.playerHp;
        c.playerHp = Math.min(cap, c.playerHp + strike.heal);
        const got = Math.round(c.playerHp - before);
        if (got > 0) emit('combat-hit', { source: 'heal', damage: got });
      }
      if (crit) emit('combat-crit', { damage: total });
      // Rogue capstone: a crit on something already nearly dead finishes it.
      if (crit && executesOnCrit() && c.monsterHp > 0
          && c.monsterHp <= (c.monsterMaxHp || monster.hp) * executeThreshold()) {
        c.monsterHp = 0;
        emit('notify', { type: 'combat', text: `🗡️ ASSASSINATED — ${monster.name} never finished the thought.` });
        emit('combat-crit', { damage: 'EXECUTE' });
      }
      // Mage's Ember: the blow keeps burning after it lands.
      applyBurn(total);
      // XP: style skill + hitpoints
      addXp(state.combat.style, total * 4 * combatXpFactor(), { useMult: false });
      addXp('hitpoints', total * 1.33 * combatXpFactor(), { useMult: false });
      if (c.monsterHp <= 0) {
        if (c.unstable) onUnstableKill();
        else if (c.dungeonId) onDungeonKill(monster);
        else onKill(monster);
        return;
      }
    } else {
      emit('combat-hit', { source: 'player', damage: 0, missed: true });
    }
  }

  // Monster attack
  if (c.monsterTimer >= monster.attackSpeed) {
    c.monsterTimer -= monster.attackSpeed;
    const hitChance = monster.attack / (monster.attack + playerDefenseRating() + BALANCE.ACCURACY_DEFENSE_CONSTANT);
    if (Math.random() < hitChance) {
      const raw = 1 + Math.floor(Math.random() * monster.maxHit);
      let dmg = Math.max(1, Math.floor(raw * (1 - damageReduction())));
      dmg = applyGuard(dmg);   // parry / iron stance / thornmail / aegis
      // The Warden's whole identity: a share of everything that lands on
      // you goes straight back. Banked alongside Thornmail's share and
      // spent below, once the blow has actually landed.
      const wardenThorns = classBonus('thorns');
      if (wardenThorns > 0 && dmg > 0) {
        c.pendingThorns = (c.pendingThorns || 0) + dmg * wardenThorns;
      }
      // And the Warden capstone caps what any one blow can be.
      if (hasTalentFlag('nothing_past')) {
        dmg = Math.min(dmg, Math.max(1, Math.floor(maxHp() / 3)));
      }
      if (dmg > 0) {
        c.playerHp -= dmg;
        emit('combat-hit', { source: 'enemy', damage: dmg });
        addXp('defense', dmg * 1.2 * combatXpFactor(), { useMult: false });
      }
      // Thornmail returns a share of the blow. Banked by applyGuard and
      // spent here, once the hit it is answering has actually landed.
      if (c.pendingThorns > 0) {
        const back = Math.max(1, Math.round(c.pendingThorns));
        c.pendingThorns = 0;
        c.monsterHp -= back;
        emit('combat-hit', { source: 'player', damage: back, ability: 'Thornmail' });
        if (c.monsterHp <= 0) {
          if (c.dungeonId) onDungeonKill(monster); else onKill(monster);
          return;
        }
      }
      const saved = applySurvival();  // second wind / rune of return
      if (c.playerHp <= 0 && !saved) { onDeath(); return; }
      tryEat();
    } else {
      emit('combat-hit', { source: 'enemy', damage: 0, missed: true });
      addXp('defense', 2 * combatXpFactor(), { useMult: false });
    }
  }
}

// combat xp uses the full multiplier chain (shards, perks, INT, dummy upgrade)
function combatXpFactor() { return combatXpMultiplier(); }

export function healToFull() {
  state.combat.playerHp = maxHp();
}
