// ============================================================
// COMBAT — auto-battle, loot, food, death
// ============================================================
import { state, playerAccuracy, playerMaxHit, playerDefenseRating,
         damageReduction, attackInterval, maxHp, combatLevel,
         combatXpMultiplier, dropRateMultiplier } from '../core/state.js';
import { getZone, getMonster } from '../data/monsters.js';
import { getItem } from '../data/items.js';
import { emit } from '../core/events.js';
import { addGold, addItem, itemCount, removeItem } from './inventory.js';
import { addXp, stopActivity } from './skills.js';

const RESPAWN_MS = 1200;

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
  c.zoneId = zoneId;
  c.monsterId = monsterId;
  c.monsterHp = monster.hp;
  c.playerHp = Math.min(c.playerHp > 0 ? c.playerHp : maxHp(), maxHp());
  c.playerTimer = 0;
  c.monsterTimer = 0;
  c.respawn = 0;
  emit('notify', { type: 'combat', text: `Engaged: ${monster.name} (${zone.name})` });
  emit('state-changed');
  return true;
}

export function stopCombat({ silent = false } = {}) {
  if (state.activity?.type === 'combat') {
    state.activity = null;
    if (!silent) emit('notify', { type: 'combat', text: 'You retreat from battle.' });
    emit('state-changed');
  }
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

function tryEat() {
  const c = state.combat;
  const cap = maxHp();
  if (c.playerHp > cap * 0.5) return;
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
    c.foodItem = null;
    emit('notify', { type: 'combat', text: `You're out of ${item.name}!` });
  }
}

function onKill(monster) {
  const c = state.combat;
  state.stats.kills++;
  if (monster.boss) state.stats.bossKills++;

  const gold = addGold(monster.gold[0] + Math.random() * (monster.gold[1] - monster.gold[0]), { silent: true });
  emit('notify', { type: 'gold', text: `${monster.name} slain · +${gold} gold` });

  const dropMult = dropRateMultiplier();
  for (const drop of monster.loot) {
    const chance = Math.min(0.95, drop.chance * dropMult);
    if (Math.random() < chance) {
      const item = getItem(drop.item);
      addItem(drop.item, drop.qty);
      emit('loot', { itemId: drop.item, qty: drop.qty, source: 'combat', rarity: item?.rarity });
      const rare = item && ['rare', 'epic', 'legendary'].includes(item.rarity);
      emit('notify', { type: 'loot', text: `${rare ? '✦ RARE DROP — ' : ''}${item?.name} ×${drop.qty}` });
      if (rare) emit('rare-drop', { itemId: drop.item, rarity: item.rarity });
    }
  }
  emit('kill', { monsterId: monster.id, zoneId: c.zoneId, boss: !!monster.boss });
  c.respawn = RESPAWN_MS;
}

function onDeath() {
  const c = state.combat;
  state.stats.deaths++;
  const loss = Math.floor(state.gold * 0.05);
  state.gold -= loss;
  emit('notify', { type: 'combat', text: `☠ You fall in battle… you wake at camp. (-${loss} gold)` });
  emit('death', {});
  c.playerHp = maxHp();
  stopCombat({ silent: true });
}

export function tickCombat(dt) {
  if (state.activity?.type !== 'combat') return;
  const c = state.combat;
  const monster = getMonster(c.zoneId, c.monsterId);
  if (!monster) { stopCombat({ silent: true }); return; }

  // waiting on respawn
  if (c.respawn > 0) {
    c.respawn -= dt;
    if (c.respawn <= 0) {
      c.monsterHp = monster.hp;
      c.playerTimer = 0;
      c.monsterTimer = 0;
    }
    return;
  }

  c.playerTimer += dt;
  c.monsterTimer += dt;

  // Player attack
  const pInterval = attackInterval();
  if (c.playerTimer >= pInterval) {
    c.playerTimer -= pInterval;
    const acc = playerAccuracy();
    const hitChance = acc / (acc + monster.defense + 10);
    if (Math.random() < hitChance) {
      const dmg = 1 + Math.floor(Math.random() * playerMaxHit());
      c.monsterHp -= dmg;
      if (dmg > state.stats.highestDamage) state.stats.highestDamage = dmg;
      emit('combat-hit', { source: 'player', damage: dmg });
      // XP: style skill + hitpoints
      addXp(state.combat.style, dmg * 4 * combatXpFactor(), { useMult: false });
      addXp('hitpoints', dmg * 1.33 * combatXpFactor(), { useMult: false });
      if (c.monsterHp <= 0) { onKill(monster); return; }
    } else {
      emit('combat-hit', { source: 'player', damage: 0, missed: true });
    }
  }

  // Monster attack
  if (c.monsterTimer >= monster.attackSpeed) {
    c.monsterTimer -= monster.attackSpeed;
    const hitChance = monster.attack / (monster.attack + playerDefenseRating() + 10);
    if (Math.random() < hitChance) {
      const raw = 1 + Math.floor(Math.random() * monster.maxHit);
      const dmg = Math.max(1, Math.floor(raw * (1 - damageReduction())));
      c.playerHp -= dmg;
      emit('combat-hit', { source: 'enemy', damage: dmg });
      addXp('defense', dmg * 1.2 * combatXpFactor(), { useMult: false });
      if (c.playerHp <= 0) { onDeath(); return; }
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
