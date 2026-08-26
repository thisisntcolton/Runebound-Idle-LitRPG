// ============================================================
// ABILITIES — learning tomes, equipping slots, cooldown ticking
// and the hooks combat calls into.
// ============================================================
import { state, enchantLevel, playerMaxHit, maxHp } from '../core/state.js';
import { ABILITIES, SLOTS, SLOT_UNLOCK_ENCHANT, getAbility,
         tomeIdFor, abilityIdFromTome } from '../data/abilities.js';
import { getItem } from '../data/items.js';
import { itemCount, removeItem } from './inventory.js';
import { emit } from '../core/events.js';

// ---------------- Slots ----------------

// Highest enchant level across equipped weapon (slots unlock from it).
export function weaponEnchant() {
  const w = state.equipment?.weapon;
  return w ? enchantLevel(w) : 0;
}

export function slotUnlocked(slotId) {
  return weaponEnchant() >= (SLOT_UNLOCK_ENCHANT[slotId] ?? 0);
}

export function unlockedSlots() {
  return SLOTS.filter(s => slotUnlocked(s.id));
}

// ---------------- Learning ----------------

export function knowsAbility(id) {
  return !!state.abilities?.known?.[id];
}

export function learnTome(tomeItemId) {
  const item = getItem(tomeItemId);
  if (!item || item.type !== 'tome') return false;
  if (itemCount(tomeItemId) < 1) return false;
  const abilityId = item.teaches || abilityIdFromTome(tomeItemId);
  const ability = getAbility(abilityId);
  if (!ability) return false;

  if (knowsAbility(abilityId)) {
    emit('notify', { type: 'sys', text: `You already know ${ability.name}. The tome crumbles, mildly embarrassed.` });
    removeItem(tomeItemId, 1);
    emit('state-changed');
    return false;
  }

  removeItem(tomeItemId, 1);
  state.abilities.known[abilityId] = Date.now();
  emit('notify', { type: 'loot', text: `📕 Learned ${ability.icon} ${ability.name} — ${ability.desc}` });
  emit('ability-learned', { abilityId });

  // Auto-equip into its slot if that slot is unlocked and empty
  if (slotUnlocked(ability.slot) && !state.abilities.equipped[ability.slot]) {
    state.abilities.equipped[ability.slot] = abilityId;
    emit('notify', { type: 'sys', text: `[ SYSTEM ] ${ability.name} equipped to your ${ability.slot} slot.` });
  }
  emit('state-changed');
  return true;
}

export function equipAbility(slotId, abilityId) {
  if (abilityId && !knowsAbility(abilityId)) return false;
  if (!slotUnlocked(slotId)) return false;
  const ability = abilityId ? getAbility(abilityId) : null;
  if (ability && ability.slot !== slotId) return false;
  state.abilities.equipped[slotId] = abilityId || null;
  emit('state-changed');
  return true;
}

export function equippedAbility(slotId) {
  if (!slotUnlocked(slotId)) return null;
  const id = state.abilities?.equipped?.[slotId];
  return id ? getAbility(id) : null;
}

// ---------------- Cooldowns ----------------

export function cooldownRemaining(abilityId) {
  return Math.max(0, state.abilities?.cooldowns?.[abilityId] || 0);
}

export function isReady(abilityId) {
  return cooldownRemaining(abilityId) <= 0;
}

function startCooldown(ability) {
  state.abilities.cooldowns[ability.id] = ability.cooldown;
}

export function tickAbilities(dt) {
  const cds = state.abilities?.cooldowns;
  if (!cds) return;
  for (const id of Object.keys(cds)) {
    if (cds[id] > 0) {
      cds[id] = Math.max(0, cds[id] - dt);
      if (cds[id] === 0) emit('ability-ready', { abilityId: id });
    }
  }
  // temporary damage-reduction burst (Iron Stance)
  if (state.combat.drBurstUntil && Date.now() > state.combat.drBurstUntil) {
    state.combat.drBurstUntil = 0;
    state.combat.drBurstValue = 0;
  }
}

// ---------------- Combat hooks ----------------

/**
 * Called right before the player's damage is applied.
 * Returns { damage, hits, label } — hits > 1 means multi-strike.
 */
export function applyStrike(baseDamage) {
  const ability = equippedAbility('strike');
  if (!ability || !isReady(ability.id)) return { damage: baseDamage, hits: 1, label: null };
  const e = ability.effect;

  if (e.type === 'damageMult') {
    startCooldown(ability);
    return { damage: Math.floor(baseDamage * e.value), hits: 1, label: ability.name };
  }
  if (e.type === 'multiHit') {
    startCooldown(ability);
    return { damage: Math.floor(baseDamage * e.value), hits: e.hits, label: ability.name };
  }
  if (e.type === 'execute') {
    const monsterMaxHp = state.combat.monsterMaxHp || 1;
    const frac = state.combat.monsterHp / monsterMaxHp;
    if (frac <= e.threshold) {
      startCooldown(ability);
      return { damage: Math.floor(baseDamage * e.value), hits: 1, label: ability.name };
    }
  }
  if (e.type === 'sunder') {
    startCooldown(ability);
    // Persisted on the combat state rather than on the monster, because
    // monsters are regenerated from data every tick and anything written
    // onto one is gone by the next frame.
    state.combat.shred = Math.max(state.combat.shred || 0, e.shred);
    return { damage: Math.floor(baseDamage * e.value), hits: 1, label: ability.name };
  }
  if (e.type === 'drain') {
    startCooldown(ability);
    const dmg = Math.floor(baseDamage * e.value);
    return { damage: dmg, hits: 1, label: ability.name, heal: Math.floor(dmg * e.drain) };
  }
  if (e.type === 'percentMax') {
    startCooldown(ability);
    // The one ability that scales with the ENEMY. Worth nothing against a
    // slime and worth everything against something with a health bar
    // measured in sessions.
    const bonus = Math.floor((state.combat.monsterMaxHp || 0) * e.value);
    return { damage: baseDamage + bonus, hits: 1, label: ability.name, flat: bonus };
  }
  return { damage: baseDamage, hits: 1, label: null };
}

/** How much of the target's defence is currently broken. 0..1 */
export function shredFactor() {
  return 1 - Math.min(0.8, state.combat.shred || 0);
}

/** Cleared whenever a fresh target steps up. */
export function clearShred() { state.combat.shred = 0; }

/** Manual fire — only meaningful for Strike; returns true if it primed. */
export function manualTrigger() {
  const ability = equippedAbility('strike');
  if (!ability || !isReady(ability.id)) return false;
  state.abilities.primed = true;
  emit('notify', { type: 'combat', text: `${ability.icon} ${ability.name} primed — next swing.` });
  emit('state-changed');
  return true;
}

/**
 * Called when an enemy hit is about to land.
 * Returns the (possibly reduced or negated) damage.
 */
export function applyGuard(incoming) {
  const ability = equippedAbility('guard');
  if (!ability) return incoming;
  const e = ability.effect;

  if (e.type === 'parry') {
    if (Math.random() < e.value) {
      emit('combat-hit', { source: 'parry', damage: 0 });
      emit('notify', { type: 'combat', text: `🤺 Parried!` });
      return 0;
    }
    return incoming;
  }

  if (e.type === 'thorns') {
    // Banked rather than applied here: applyGuard runs inside the enemy's
    // attack resolution and reaching into the monster's health from there
    // would fire before the hit it is reacting to has landed.
    state.combat.pendingThorns = (state.combat.pendingThorns || 0) + incoming * e.value;
    return incoming;
  }

  if (e.type === 'capHit') {
    const cap = Math.max(1, Math.floor(maxHp() * e.value));
    if (incoming > cap) {
      emit('notify', { type: 'combat', text: `🗿 ${ability.name} — it hit you as hard as it is allowed to.` });
      return cap;
    }
    return incoming;
  }

  if (e.type === 'aegis') {
    if (isReady(ability.id)) {
      startCooldown(ability);
      state.combat.drBurstUntil = Date.now() + e.duration;
      state.combat.drBurstValue = e.value;
      emit('combat-hit', { source: 'parry', damage: 0 });
      emit('notify', { type: 'combat', text: `⛨ ${ability.name} — nothing lands.` });
      return 0;
    }
    if (state.combat.drBurstUntil > Date.now()) {
      return Math.max(1, Math.floor(incoming * (1 - (state.combat.drBurstValue || 0))));
    }
    return incoming;
  }

  if (e.type === 'drBurst') {
    if (isReady(ability.id) && !state.combat.drBurstUntil) {
      startCooldown(ability);
      state.combat.drBurstUntil = Date.now() + e.duration;
      state.combat.drBurstValue = e.value;
      emit('notify', { type: 'combat', text: `🧱 ${ability.name} — bracing.` });
    }
    if (state.combat.drBurstUntil > Date.now()) {
      return Math.max(1, Math.floor(incoming * (1 - (state.combat.drBurstValue || 0))));
    }
  }
  return incoming;
}

/**
 * Called after the player takes damage. May heal or cheat death.
 * Returns true if the player was saved from a lethal blow.
 */
export function applySurvival() {
  const cap = maxHp();
  const guard = equippedAbility('guard');
  const util = equippedAbility('utility');

  // Second Wind — heal when low
  if (guard?.effect.type === 'heal' && isReady(guard.id)) {
    if (state.combat.playerHp > 0 && state.combat.playerHp <= cap * guard.effect.threshold) {
      startCooldown(guard);
      const healed = Math.floor(cap * guard.effect.value);
      state.combat.playerHp = Math.min(cap, state.combat.playerHp + healed);
      emit('combat-hit', { source: 'heal', damage: healed });
      emit('notify', { type: 'combat', text: `💨 ${guard.name} — recovered ${healed} HP.` });
    }
  }

  // Rune of Return — survive a lethal hit
  if (state.combat.playerHp <= 0 && util?.effect.type === 'cheatDeath' && isReady(util.id)) {
    startCooldown(util);
    state.combat.playerHp = Math.max(1, Math.floor(cap * util.effect.value));
    emit('notify', { type: 'combat', text: `🔁 ${util.name} — the System files a clerical error in your favour.` });
    emit('combat-hit', { source: 'heal', damage: state.combat.playerHp });
    return true;
  }
  return false;
}

/** Utility abilities that act on their own timer during combat. */
export function tickUtility(onBombDamage) {
  const ability = equippedAbility('utility');
  if (!ability || !isReady(ability.id)) return;
  const e = ability.effect;

  if (e.type === 'bomb') {
    startCooldown(ability);
    const dmg = Math.max(1, Math.floor(playerMaxHit() * e.value));
    onBombDamage(dmg, ability);
  }
  if (e.type === 'regen') {
    const cap = maxHp();
    if (state.combat.playerHp < cap) {
      startCooldown(ability);
      const healed = Math.floor(cap * e.value);
      state.combat.playerHp = Math.min(cap, state.combat.playerHp + healed);
      emit('combat-hit', { source: 'heal', damage: healed });
      emit('notify', { type: 'combat', text: `🩹 ${ability.name} — ${healed} back.` });
    }
  }
  // autoElixir is handled by the potion system hook below
}

/**
 * Passive contributions from whatever is equipped.
 *
 * Same shape as the town, pet, class and Descent hooks. An ability with a
 * `passive` bag needs no code at all beyond this — which is the whole
 * reason the Ledger of Debts and the Spirit Lantern are three lines of
 * data each rather than two more branches in the combat tick.
 */
export function abilityBonus(key) {
  let total = 0;
  for (const slot of SLOTS) {
    const ab = equippedAbility(slot.id);
    if (ab?.passive?.[key]) total += ab.passive[key];
  }
  return total;
}

/** Returns the potion itemId Auto-Elixir wants re-drunk, or null. */
export function autoElixirWants() {
  const ability = equippedAbility('utility');
  if (!ability || ability.effect.type !== 'autoElixir') return null;
  if (!isReady(ability.id)) return null;
  const want = state.combat.autoPotion;
  if (!want) return null;
  const buff = state.buffs?.[want];
  if (buff && buff.expiresAt > Date.now()) return null; // still active
  if (itemCount(want) < 1) return null;
  startCooldown(ability);
  return want;
}

export function setAutoPotion(itemId) {
  state.combat.autoPotion = itemId || null;
  emit('state-changed');
}

// ---------------- Info for UI ----------------
export function abilityStatus() {
  return SLOTS.map(s => {
    const unlocked = slotUnlocked(s.id);
    const ability = unlocked ? equippedAbility(s.id) : null;
    return {
      slot: s,
      unlocked,
      requires: SLOT_UNLOCK_ENCHANT[s.id],
      ability,
      cooldown: ability ? cooldownRemaining(ability.id) : 0,
      ready: ability ? isReady(ability.id) : false,
    };
  });
}
