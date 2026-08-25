// ============================================================
// COMBAT — auto-battle, loot, food, death
// ============================================================
import { state, playerAccuracy, playerMaxHit, playerMinHit, playerDefenseRating,
         damageReduction, attackInterval, maxHp, combatLevel,
         combatXpMultiplier, dropRateMultiplier, BALANCE } from '../core/state.js';
import { getZone, getMonster } from '../data/monsters.js';
import { getDungeon, waveMonster, totalWaves } from '../data/dungeons.js';
import { rollLoot } from '../data/loot.js';
import { getItem } from '../data/items.js';
import { emit } from '../core/events.js';
import { addGold, addItem, itemCount, removeItem } from './inventory.js';
import { rollEggDrop } from './pets.js';
import { rollCrit, critMultiplier, consumeGuaranteedHit, resetQuarry,
         applyBurn, tickBurn, clearBurn, mendOnKill } from './classes.js';
import { addXp, stopActivity } from './skills.js';
import { levelForXp, xpForLevel } from '../core/xp.js';
import { onUnstableKill, waveMonsterFor, failRun } from './unstable.js';
import { applyStrike, applyGuard, applySurvival, tickUtility, autoElixirWants } from './abilities.js';
import { drinkPotion } from './potions.js';

const RESPAWN_MS = 1200;
const WAVE_MS = 800; // short breather between rift waves

// The thing currently being fought — zone monster, rift wave, or an
// unstable-rift spawn.
export function currentMonster() {
  const c = state.combat;
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
  if (combatLevel() < zone.level) {
    emit('notify', { type: 'sys', text: `${zone.name} requires Combat Lv. ${zone.level}` });
    return false;
  }
  stopActivity({ silent: true });
  state.activity = { type: 'combat' };
  const c = state.combat;
  c.dungeonId = null;
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

export function stopCombat({ silent = false } = {}) {
  if (state.activity?.type === 'combat') {
    const wasRift = !!state.combat.dungeonId;
    state.activity = null;
    state.combat.dungeonId = null;
    state.combat.unstable = false;
    state.combat.wave = 0;
    if (!silent) emit('notify', { type: 'combat', text: wasRift
      ? 'You step back through the rift. The run is abandoned.'
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
  state.stats.kills++;
  const mended = mendOnKill();
  if (mended > 0) emit('combat-hit', { source: 'heal', damage: mended });
  if (monster.boss) state.stats.bossKills++;
  if (monster.id === 'aurelion') state.stats.aurelionKills = (state.stats.aurelionKills || 0) + 1;

  const gold = addGold(monster.gold[0] + Math.random() * (monster.gold[1] - monster.gold[0]), { silent: true });
  emit('notify', { type: 'gold', text: `${monster.name} slain · +${gold} gold` });

  // Rarity-tier loot: roll a tier, then pull from this monster's pool.
  for (const drop of rollLoot(monster, dropRateMultiplier() - 1)) {
    const item = getItem(drop.item);
    if (!item) continue;
    addItem(drop.item, drop.qty);
    emit('loot', { itemId: drop.item, qty: drop.qty, source: 'combat', rarity: item.rarity, tier: drop.tier });

    const banner = { rare: '✦ RARE', epic: '✦✦ EPIC', legendary: '✦✦✦ LEGENDARY' }[drop.tier];
    emit('notify', { type: 'loot', text: `${banner ? banner + ' DROP — ' : ''}${item.icon} ${item.name}${drop.qty > 1 ? ' ×' + drop.qty : ''}` });
    if (banner) emit('rare-drop', { itemId: drop.item, rarity: item.rarity, tier: drop.tier });
  }
  if (monster.boss) rollEggDrop('boss');
  emit('kill', { monsterId: monster.id, zoneId: c.zoneId, boss: !!monster.boss });
  c.respawn = RESPAWN_MS;
}

// How long the Wounded debuff lasts, and how hard it bites.
const WOUNDED_MS = 180000;
const WOUNDED = { damage: -0.25, speed: -0.15 };

function onDeath() {
  const c = state.combat;
  const inRift = !!c.dungeonId;
  const zone = c.zoneId ? getZone(c.zoneId) : null;
  state.stats.deaths++;

  // 1. Gold — scales with how dangerous the ground was. Rifts hurt most.
  const rate = inRift ? 0.12 : Math.min(0.10, 0.03 + (zone?.level || 1) * 0.0008);
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

export function tickCombat(dt) {
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
    const hitChance = acc / (acc + monster.defense + BALANCE.ACCURACY_DEFENSE_CONSTANT);
    // Ranger's Quarry: the opening swing on a fresh target is a certainty.
    const guaranteed = consumeGuaranteedHit();
    if (guaranteed || Math.random() < hitChance) {
      // Roll between your floor and ceiling, not between 1 and your ceiling.
      const lo = playerMinHit();
      const hi = playerMaxHit();
      let base = lo + Math.floor(Math.random() * (hi - lo + 1));

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
      if (crit) emit('combat-crit', { damage: total });
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
      dmg = applyGuard(dmg);   // parry / iron stance
      if (dmg > 0) {
        c.playerHp -= dmg;
        emit('combat-hit', { source: 'enemy', damage: dmg });
        addXp('defense', dmg * 1.2 * combatXpFactor(), { useMult: false });
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
