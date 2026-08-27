// ============================================================
// PET SYSTEM — incubation, care, bonding and breeding
//
// Care decays against the wall clock, so it works identically whether
// the tab is open or you've been gone three days. Nothing ever dies;
// a neglected pet just stops helping until you make it up to them.
// ============================================================
import { state, dropRateMultiplier, buyPrice } from '../core/state.js';
import { SPECIES, getSpecies, stageFor, STAGES, CARE, PET_TRAITS, TRAIT_LIST,
         getTrait, BREEDING, MAX_PET_LEVEL, RARITY_RANK, RARITIES,
         randomPetName, eggItemId, BREEDABLE_STAGE, EGG_SHOP, SPECIES_LIST } from '../data/pets.js';
import { getItem } from '../data/items.js';
import { addItem, removeItem, itemCount, spendGold, addGold } from './inventory.js';
import { emit, on } from '../core/events.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setPetUIHooks(h) { hooks = h; }

const HOUR = 3600000;

// ---------------- Level curve ----------------
// Deliberately gentle — this is a companion, not a second grind.
export function xpForPetLevel(level) {
  return Math.floor(25 * Math.pow(level, 1.5));
}

export function petLevel(pet) {
  let lvl = 1;
  while (lvl < MAX_PET_LEVEL && pet.xp >= xpForPetLevel(lvl + 1)) lvl++;
  return lvl;
}

export function petLevelProgress(pet) {
  const lvl = petLevel(pet);
  if (lvl >= MAX_PET_LEVEL) return 1;
  const cur = xpForPetLevel(lvl), next = xpForPetLevel(lvl + 1);
  return Math.max(0, Math.min(1, (pet.xp - cur) / (next - cur)));
}

// ---------------- Care state ----------------
// Hunger/happiness are stored as a value plus the timestamp it was
// accurate at, then decayed on read. That makes offline handling free.

function decayed(value, since, perHour, slow = 0) {
  const hours = Math.max(0, (Date.now() - (since || Date.now())) / HOUR);
  return Math.max(0, Math.min(100, value - hours * perHour * (1 - slow)));
}

export function hunger(pet) {
  const t = getTrait(pet.trait);
  return decayed(pet.hunger ?? 100, pet.careAt, CARE.HUNGER_DECAY_PER_HOUR, t?.hungerSlow || 0);
}

export function happiness(pet) {
  const t = getTrait(pet.trait);
  return decayed(pet.happy ?? 100, pet.careAt, CARE.HAPPY_DECAY_PER_HOUR, t?.happySlow || 0);
}

/**
 * Idle bond XP for a window of `hours`, given the care values the pet
 * STARTED that window with.
 *
 * Judging by the end state alone would be unfair and confusing: leave a
 * full pet for ten hours and it is hungry when you get back, so a naive
 * check pays nothing at all — even though it was perfectly content for
 * the first eight of those hours. Both stats fall linearly, so instead
 * solve for the moment each threshold is crossed and pay for the time
 * actually spent above it.
 */
function idleXpHours(h0, p0, hours, rateH, rateP) {
  // Hours until a stat drops to `floor` (Infinity if it never does).
  const until = (v0, floor, rate) => rate <= 0 ? Infinity : (v0 - floor) / rate;
  const clamp = t => Math.max(0, Math.min(hours, t));

  const contentH  = clamp(Math.min(until(h0, CARE.HUNGRY_AT, rateH),
                                   until(p0, CARE.SAD_AT, rateP)));
  const thrivingH = clamp(Math.min(until(h0, CARE.WELL_KEPT_AT, rateH),
                                   until(p0, CARE.WELL_KEPT_AT, rateP)));
  // Thriving hours pay double; the rest of the content hours pay single.
  return { content: Math.max(0, contentH - thrivingH), thriving: thrivingH };
}

/** Flush decayed values into the record and award any idle bond XP. */
function settle(pet) {
  const now = Date.now();
  const elapsed = Math.max(0, now - (pet.careAt || now));
  const h = hunger(pet), p = happiness(pet);

  if (elapsed > 0 && pet.stage !== 'egg') {
    const t = getTrait(pet.trait);
    const rateH = CARE.HUNGER_DECAY_PER_HOUR * (1 - (t?.hungerSlow || 0));
    const rateP = CARE.HAPPY_DECAY_PER_HOUR * (1 - (t?.happySlow || 0));
    const { content, thriving } = idleXpHours(
      pet.hunger ?? 100, pet.happy ?? 100, elapsed / HOUR, rateH, rateP);
    const xp = CARE.IDLE_XP_PER_HOUR * (content + thriving * 2) * (1 + (t?.xpMult || 0));
    if (xp > 0) gainXp(pet, xp, { silent: true });
  }
  pet.hunger = h;
  pet.happy = p;
  pet.careAt = now;
}

export function settleAll() {
  for (const pet of Object.values(state.pets?.owned || {})) settle(pet);
}

export function mood(pet) {
  const h = hunger(pet), p = happiness(pet);
  if (h < CARE.HUNGRY_AT && p < CARE.SAD_AT) return { id: 'miserable', label: 'Miserable', icon: '😖' };
  if (h < CARE.HUNGRY_AT) return { id: 'hungry', label: 'Hungry', icon: '🍖' };
  if (p < CARE.SAD_AT) return { id: 'lonely', label: 'Lonely', icon: '😢' };
  if (h >= CARE.WELL_KEPT_AT && p >= CARE.WELL_KEPT_AT) return { id: 'thriving', label: 'Thriving', icon: '✨' };
  return { id: 'content', label: 'Content', icon: '🙂' };
}

/** 0..1 — how much of its bonus the pet is currently delivering. */
export function moodFactor(pet) {
  const m = mood(pet).id;
  if (m === 'miserable') return 0;
  if (m === 'hungry' || m === 'lonely') return 0.35;
  if (m === 'thriving') return 1.15;
  return 1;
}

// ---------------- Bonding ----------------
export function gainXp(pet, amount, { silent = false } = {}) {
  if (pet.stage === 'egg') return;
  const t = getTrait(pet.trait);
  const gained = amount * (1 + (t?.xpMult || 0));
  const before = petLevel(pet);
  pet.xp = (pet.xp || 0) + gained;
  const after = petLevel(pet);
  if (after > before && !silent) {
    const st = stageFor(after), stBefore = stageFor(before);
    emit('notify', { type: 'loot', text: `🐾 ${pet.name} reached level ${after}!` });
    if (st.id !== stBefore.id) {
      pet.stage = st.id;
      emit('notify', { type: 'sys', text: `${getSpecies(pet.species)?.icon} ${pet.name} grew into a ${st.name}!` });
      hooks.popup('YOUR PET GREW', `${getSpecies(pet.species)?.icon} <b>${pet.name}</b> is now a ${st.name}`, { gold: true, ttl: 5 });
    }
    emit('pet-level', { petId: pet.id, level: after });
  }
  if (after > before) pet.stage = stageFor(after).id;
}

// ---------------- Bonding through adventure ----------------
// The pet at your side bonds by DOING things with you. This is the
// dominant XP source for an engaged player; idle XP is the floor.
//
// The credit is rate-limited against the wall clock rather than against
// event count. Offline catch-up replays thousands of hireling actions in
// a single frame, and without this an eight-hour nap would max a pet
// instantly. Elapsed real time is ~0 during that replay, so ~0 is paid —
// which is correct, because settle() already awarded the idle XP for
// exactly that window.
let activityCreditAt = Date.now();

function bondFromActivity(amount) {
  const pet = activePet();
  if (!pet || pet.stage === 'egg') return;
  // A miserable companion isn't paying attention to anything you do.
  if (mood(pet).id === 'miserable') { activityCreditAt = Date.now(); return; }

  const now = Date.now();
  // Unspent budget is capped at a minute's worth, so time away can't bank
  // into a burst the moment you come back.
  const MAX_BANK_MS = 60000;
  if (now - activityCreditAt > MAX_BANK_MS) activityCreditAt = now - MAX_BANK_MS;
  const budget = ((now - activityCreditAt) / 1000) * CARE.ACTIVITY_XP_PER_SECOND_CAP;
  const paid = Math.min(amount, Math.max(0, budget));
  if (paid <= 0) return;
  activityCreditAt = now - ((budget - paid) / CARE.ACTIVITY_XP_PER_SECOND_CAP) * 1000;
  gainXp(pet, paid);
}

// ---------------- Eggs ----------------

export function startIncubation(itemId) {
  const item = getItem(itemId);
  if (!item || item.type !== 'egg') return false;
  if (itemCount(itemId) < 1) return false;
  if (!state.pets.incubator) state.pets.incubator = [];
  if (state.pets.incubator.length >= incubatorSlots()) {
    emit('notify', { type: 'sys', text: 'The incubator is full.' });
    return false;
  }
  const sp = getSpecies(item.species);
  removeItem(itemId, 1);
  state.pets.incubator.push({
    id: 'e' + Date.now().toString(36) + Math.floor(Math.random() * 1e5).toString(36),
    species: sp.id,
    startedAt: Date.now(),
    readyAt: Date.now() + sp.hatchMs,
    // eggs from breeding carry parent info
    inherit: null,
  });
  emit('notify', { type: 'sys', text: `${sp.eggIcon} ${sp.eggName} placed in the incubator.` });
  emit('pets-changed', {});
  emit('state-changed');
  return true;
}

export function incubatorSlots() {
  return 2 + Math.floor((state.pets?.hatched || 0) / 5);
}

export function eggReady(egg) { return Date.now() >= egg.readyAt; }

export function hatch(eggId) {
  const idx = state.pets.incubator.findIndex(e => e.id === eggId);
  if (idx === -1) return false;
  const egg = state.pets.incubator[idx];
  if (!eggReady(egg)) return false;
  state.pets.incubator.splice(idx, 1);

  const sp = getSpecies(egg.species);
  const trait = egg.inherit?.trait
    || TRAIT_LIST[Math.floor(Math.random() * TRAIT_LIST.length)].id;

  const pet = {
    id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e5).toString(36),
    species: sp.id,
    name: egg.inherit?.name || randomPetName(),
    trait,
    xp: 0,
    stage: 'hatchling',
    hunger: 100,
    happy: 100,
    careAt: Date.now(),
    bornAt: Date.now(),
    lastPlayAt: 0,
    lastBredAt: 0,
    parents: egg.inherit?.parents || null,
  };
  state.pets.owned[pet.id] = pet;
  state.pets.hatched = (state.pets.hatched || 0) + 1;
  if (!state.pets.active) state.pets.active = pet.id;

  emit('notify', { type: 'loot', text: `${sp.icon} ${pet.name} hatched! (${sp.name}, ${getTrait(trait)?.name})` });
  hooks.queueModal(`
    <div class="modal-tag">◈ IT HATCHED ◈</div>
    <div class="modal-title">${sp.icon} ${pet.name}</div>
    <div class="modal-body" style="line-height:1.7">
      <p class="muted">${sp.name} · <span class="rarity-${sp.rarity}">${sp.rarity}</span> · ${getTrait(trait)?.icon} ${getTrait(trait)?.name}</p>
      <p>${sp.blurb}</p>
      <p style="color:var(--xp)">${getTrait(trait)?.desc}</p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Say hello</button></div>
  `);
  emit('pet-hatched', { petId: pet.id });
  emit('pets-changed', {});
  emit('state-changed');
  return true;
}

// ---------------- Care actions ----------------

export function feed(petId, foodItemId) {
  const pet = state.pets.owned[petId];
  const item = getItem(foodItemId);
  if (!pet || !item) return false;
  if (itemCount(foodItemId) < 1) return false;
  if (item.type !== 'food' && item.type !== 'resource' && item.type !== 'potion') return false;

  settle(pet);
  const sp = getSpecies(pet.species);
  const t = getTrait(pet.trait);
  const favourite = sp.likes.includes(foodItemId);
  // Nourishment scales off the item's value, so good food is worth it.
  const base = Math.min(45, 12 + Math.sqrt(item.sell || 1) * 2.2);
  const amount = base * (favourite ? 1.6 : 1) * (1 + (t?.feedMult || 0));

  removeItem(foodItemId, 1);
  pet.hunger = Math.min(100, pet.hunger + amount);
  if (favourite) pet.happy = Math.min(100, pet.happy + 10);
  gainXp(pet, feedXpFor(item, favourite));
  pet.careAt = Date.now();

  const xp = Math.round(feedXpFor(item, favourite));
  emit('notify', { type: 'sys', text: favourite
    ? `${sp.icon} ${pet.name} adores ${item.name}! (+${Math.round(amount)} fullness, +${xp} bond)`
    : `${sp.icon} ${pet.name} eats the ${item.name}. (+${Math.round(amount)} fullness, +${xp} bond)` });
  emit('pets-changed', {});
  emit('state-changed');
  return true;
}

/**
 * Bond XP for one feeding.
 *
 * Scales off the square root of the item's value so the curve stays
 * generous at the bottom and does not explode at the top, with a flat
 * premium for cooked food. `item.heal` is the marker: only things that
 * came off a cooking fire have one.
 */
export function feedXpFor(item, favourite = false) {
  const cooked = item.heal ? CARE.FEED_XP_COOKED_MULT : 1;
  const base = (CARE.FEED_XP_BASE + Math.sqrt(item.sell || 1) * CARE.FEED_XP_PER_ROOT_VALUE) * cooked;
  return Math.min(CARE.FEED_XP_CAP, base) * (favourite ? 2 : 1);
}

export function playCooldownLeft(pet) {
  return Math.max(0, (pet.lastPlayAt || 0) + CARE.PLAY_COOLDOWN_MS - Date.now());
}

export function play(petId) {
  const pet = state.pets.owned[petId];
  if (!pet) return false;
  if (playCooldownLeft(pet) > 0) return false;
  settle(pet);
  pet.happy = Math.min(100, pet.happy + CARE.PLAY_HAPPY);
  pet.lastPlayAt = Date.now();
  pet.careAt = Date.now();
  gainXp(pet, CARE.PLAY_XP);
  const sp = getSpecies(pet.species);
  const line = sp.idleLines[Math.floor(Math.random() * sp.idleLines.length)];
  emit('notify', { type: 'sys', text: `${sp.icon} ${pet.name} ${line}` });
  emit('pets-changed', {});
  emit('state-changed');
  return true;
}

export function renamePet(petId, name) {
  const pet = state.pets.owned[petId];
  if (!pet) return false;
  const clean = String(name).trim().slice(0, 18);
  if (!clean) return false;
  pet.name = clean;
  emit('state-changed');
  return true;
}

export function setActive(petId) {
  if (petId && !state.pets.owned[petId]) return false;
  state.pets.active = petId || null;
  const pet = petId ? state.pets.owned[petId] : null;
  emit('notify', { type: 'sys', text: pet
    ? `${getSpecies(pet.species)?.icon} ${pet.name} is now at your side.`
    : 'Your pets stay home.' });
  emit('pets-changed', {});
  emit('state-changed');
  return true;
}

export function release(petId) {
  const pet = state.pets.owned[petId];
  if (!pet) return false;
  delete state.pets.owned[petId];
  if (state.pets.active === petId) {
    state.pets.active = Object.keys(state.pets.owned)[0] || null;
  }
  emit('notify', { type: 'sys', text: `${pet.name} has been released into the meadow. It looks back once.` });
  emit('pets-changed', {});
  emit('state-changed');
  return true;
}

// ---------------- Active-pet bonus ----------------

/**
 * Is there a companion in a fit state to help in a fight?
 *
 * The Beastmaster's entire kit is conditional on this, and it is checked
 * rather than assumed for the same reason its penalty line says so out
 * loud: a class whose numbers quietly become zero is a class that reads
 * as broken.
 */
export function petFighting() {
  const pet = activePet();
  return !!pet && pet.stage !== 'egg' && mood(pet).id !== 'miserable';
}

export function activePet() {
  const id = state.pets?.active;
  return id ? state.pets.owned[id] || null : null;
}

/** The bonus this pet currently provides for a given key. */
export function petBonusFor(pet, key) {
  if (!pet || pet.stage === 'egg') return 0;
  const sp = getSpecies(pet.species);
  if (!sp) return 0;
  const t = getTrait(pet.trait);
  const factor = moodFactor(pet) * (1 + (t?.bonusMult || 0));
  const lvl = petLevel(pet);
  let total = 0;
  if (sp.bonus.key === key) total += sp.bonus.perLevel * lvl * factor;
  if (sp.bonus.second?.key === key) total += sp.bonus.second.perLevel * lvl * factor;
  return total;
}

/** Feeds into the global multiplier chain. */
export function petBonus(key) {
  return petBonusFor(activePet(), key);
}

/** Human-readable summary of what the active pet is doing for you. */
export function activePetSummary() {
  const pet = activePet();
  if (!pet) return null;
  const sp = getSpecies(pet.species);
  const parts = [];
  const push = b => {
    const v = petBonusFor(pet, b.key);
    if (v > 0) parts.push(`+${(v * 100).toFixed(1)}% ${b.label}`);
  };
  push(sp.bonus);
  if (sp.bonus.second) push(sp.bonus.second);
  return { pet, species: sp, mood: mood(pet), level: petLevel(pet), effects: parts };
}

// ---------------- Breeding ----------------

export function canBreed(pet) {
  if (!pet || pet.stage !== BREEDABLE_STAGE && pet.stage !== 'elder') return false;
  return Date.now() >= (pet.lastBredAt || 0) + BREEDING.COOLDOWN_MS;
}

export function breedCooldownLeft(pet) {
  return Math.max(0, (pet.lastBredAt || 0) + BREEDING.COOLDOWN_MS - Date.now());
}

export function breed(idA, idB) {
  const a = state.pets.owned[idA], b = state.pets.owned[idB];
  if (!a || !b || a.id === b.id) return false;
  if (!canBreed(a) || !canBreed(b)) {
    emit('notify', { type: 'sys', text: 'Both parents must be fully grown and rested.' });
    return false;
  }
  if (!state.pets.incubator) state.pets.incubator = [];
  if (state.pets.incubator.length >= incubatorSlots()) {
    emit('notify', { type: 'sys', text: 'No room in the incubator.' });
    return false;
  }
  if (!spendGold(BREEDING.COST_GOLD)) {
    emit('notify', { type: 'sys', text: `Breeding costs ${BREEDING.COST_GOLD.toLocaleString()} gold.` });
    return false;
  }

  const spA = getSpecies(a.species), spB = getSpecies(b.species);
  // Child takes the higher-rarity parent's species as its base
  let childSpecies = RARITY_RANK[spA.rarity] >= RARITY_RANK[spB.rarity] ? spA : spB;

  // Chance to climb a rarity tier
  const luck = BREEDING.BASE_UPGRADE_CHANCE
    + (a.species === b.species ? BREEDING.SAME_SPECIES_BONUS : 0)
    + (getTrait(a.trait)?.breedLuck || 0)
    + (getTrait(b.trait)?.breedLuck || 0);
  let upgraded = false;
  if (Math.random() < luck) {
    const nextRank = RARITY_RANK[childSpecies.rarity] + 1;
    const nextRarity = RARITIES[nextRank];
    const candidates = Object.values(SPECIES).filter(s => s.rarity === nextRarity);
    if (candidates.length) {
      childSpecies = candidates[Math.floor(Math.random() * candidates.length)];
      upgraded = true;
    }
  }

  // Trait comes from one parent, with a small mutation chance
  let trait = Math.random() < 0.5 ? a.trait : b.trait;
  if (Math.random() < 0.15) trait = TRAIT_LIST[Math.floor(Math.random() * TRAIT_LIST.length)].id;

  a.lastBredAt = Date.now();
  b.lastBredAt = Date.now();
  state.pets.incubator.push({
    id: 'e' + Date.now().toString(36) + Math.floor(Math.random() * 1e5).toString(36),
    species: childSpecies.id,
    startedAt: Date.now(),
    readyAt: Date.now() + childSpecies.hatchMs,
    inherit: { trait, parents: [a.name, b.name] },
  });
  state.pets.bred = (state.pets.bred || 0) + 1;

  emit('notify', { type: 'loot', text: upgraded
    ? `✦ ${a.name} × ${b.name} — the egg is ${childSpecies.eggName}! A rarity above both parents.`
    : `${a.name} × ${b.name} produced ${childSpecies.eggName}.` });
  emit('pet-bred', { species: childSpecies.id, upgraded });
  emit('pets-changed', {});
  emit('state-changed');
  return true;
}

// ---------------- Egg shop ----------------
/**
 * Record that a species has been seen. Called wherever an egg enters the
 * player's hands, so the compendium reflects discovery rather than current
 * ownership — selling or losing a pet should not un-discover it.
 */
export function markSeen(speciesId) {
  if (!speciesId) return;
  state.pets.seen ||= {};
  if (!state.pets.seen[speciesId]) state.pets.seen[speciesId] = Date.now();
}

export function hasSeen(speciesId) {
  return !!state.pets.seen?.[speciesId]
      || Object.values(state.pets.owned || {}).some(p => p.species === speciesId)
      || (state.pets.incubator || []).some(e => e.species === speciesId);
}

/** What an egg costs this player, Charisma included. Quote and charge. */
export function eggPrice(speciesId) {
  const entry = EGG_SHOP.find(e => e.species === speciesId);
  return entry ? buyPrice(entry.gold) : 0;
}

export function buyEgg(speciesId) {
  const entry = EGG_SHOP.find(e => e.species === speciesId);
  if (!entry) return false;
  if (!spendGold(eggPrice(speciesId))) return false;
  addItem(eggItemId(speciesId), 1);
  markSeen(speciesId);
  const sp = getSpecies(speciesId);
  emit('notify', { type: 'gold', text: `${sp.eggIcon} Bought ${sp.eggName}.` });
  emit('pets-changed', {});
  emit('state-changed');
  return true;
}

// ---------------- Egg drops ----------------
//
// Rewritten for fifteen species. The old table named two of them by hand,
// which stopped scaling the moment the roster grew and meant every new
// species was unobtainable until someone remembered to add a line.
//
// Two rolls now, in this order:
//
//  1. DOES AN EGG DROP AT ALL? Per source, and deliberately much more
//     generous than before — the old rate meant most players never saw
//     the Menagerie's back half at all, which is a strange thing to build
//     and then hide.
//
//  2. WHAT RARITY? A fixed ladder: mostly common, sometimes rare, rarely
//     epic, and a legendary as the sliver that is left. The species is
//     then picked uniformly from that tier, so adding a new one to the
//     data file is genuinely all that is required to put it in the world.

const EGG_CHANCE = {
  boss:        0.075,
  'rift-seal': 0.20,
  descent:     0.045,   // per Warden felled
  vigil:       1.00,    // a Vigil always leaves one. It kept something.
};

/**
 * The rarity ladder. 75 / 20 / 4.5 / 0.5 — the legendary sliver is what
 * remains of the epic five percent, which is what makes one an event
 * rather than a Tuesday.
 */
export const EGG_RARITY_WEIGHTS = [
  { rarity: 'common',    weight: 75 },
  { rarity: 'rare',      weight: 20 },
  { rarity: 'epic',      weight: 4.5 },
  { rarity: 'legendary', weight: 0.5 },
];

function rollRarity(luck = 1) {
  // Luck bends the ladder rather than multiplying the drop chance twice:
  // it moves weight from common toward the top, so a lucky player sees
  // better eggs rather than simply more of them.
  const bend = Math.max(0, Math.min(2, luck - 1));
  const weights = EGG_RARITY_WEIGHTS.map(w => ({
    rarity: w.rarity,
    weight: w.rarity === 'common' ? w.weight : w.weight * (1 + bend),
  }));
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) { r -= w.weight; if (r <= 0) return w.rarity; }
  return 'common';
}

function speciesOfRarity(rarity) {
  const pool = SPECIES_LIST.filter(s => s.rarity === rarity);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Roll for an egg. Returns the itemId awarded, or null. */
export function rollEggDrop(source) {
  const chance = EGG_CHANCE[source];
  if (!chance) return null;
  const luck = Math.min(3, dropRateMultiplier());
  if (Math.random() >= Math.min(1, chance * luck)) return null;

  let sp = speciesOfRarity(rollRarity(luck));
  if (!sp) sp = speciesOfRarity('common');
  if (!sp) return null;

  const itemId = eggItemId(sp.id);
  addItem(itemId, 1);
  markSeen(sp.id);
  const fanfare = sp.rarity === 'legendary' ? '✦✦✦' : sp.rarity === 'epic' ? '✦✦' : '✦';
  emit('notify', { type: 'loot', text: `${fanfare} ${sp.eggName} — something in there is moving.` });
  emit('rare-drop', { itemId, rarity: sp.rarity });
  emit('loot', { itemId, qty: 1, source: 'combat', rarity: sp.rarity, tier: sp.rarity });
  return itemId;
}

// ---------------- Tick ----------------

/**
 * Announce eggs that have finished incubating.
 *
 * Hatching is a button press, so without this the only way to learn an egg
 * was ready was to happen to open the Menagerie. The flag lives on the egg
 * record so the news survives a reload and never repeats.
 */
function announceReadyEggs() {
  for (const egg of state.pets.incubator || []) {
    if (egg.announced || !eggReady(egg)) continue;
    egg.announced = true;
    const sp = getSpecies(egg.species);
    if (!sp) continue;
    emit('notify', { type: 'loot', text: `${sp.eggIcon} The ${sp.eggName} is rocking. It's ready to hatch!` });
    hooks.popup('SOMETHING IS HATCHING',
      `${sp.eggIcon} <b>${sp.eggName}</b><br><span style="font-size:12px;color:var(--text-dim)">Open the Menagerie to meet it.</span>`,
      { gold: true, ttl: 8 });
    emit('egg-ready', { eggId: egg.id, species: egg.species });
    emit('state-changed');
  }
}

let sinceSettle = 0;
export function tickPets(dt) {
  if (!state.pets) return;
  announceReadyEggs();
  sinceSettle += dt;
  if (sinceSettle < 10000) return;    // care changes slowly; no need to churn
  sinceSettle = 0;
  settleAll();
}

let activityWired = false;
function wireActivity() {
  if (activityWired) return;
  activityWired = true;
  on('kill', () => bondFromActivity(CARE.ACTIVITY_XP_PER_KILL));
  on('action-done', () => bondFromActivity(CARE.ACTIVITY_XP_PER_ACTION));
}

export function initPets() {
  if (!state.pets) state.pets = { owned: {}, incubator: [], active: null, hatched: 0, bred: 0 };
  if (!state.pets.owned) state.pets.owned = {};
  if (!state.pets.incubator) state.pets.incubator = [];
  settleAll();
  activityCreditAt = Date.now();
  wireActivity();
}

// ============================================================
// ERRANDS
//
// The drain is applied as a settled cost rather than by teaching the
// decay function about time windows. settle() already brings a pet up to
// now at the normal rate; an errand then charges the DIFFERENCE — the
// extra (DRAIN_MULT - 1) worth of decay over the span it was working,
// plus a flat arrival cost. Same result, and the decay maths stays the
// one simple thing it has always been.
// ============================================================
import { ERRANDS, ERRAND_LIST, getErrand } from '../data/pets.js';
import { combatIncome } from '../data/adventure.js';
import { combatLevel } from '../core/state.js';
import { addXp } from './skills.js';

/** Can this pet be sent out, and if not, why not? */
export function canErrand(pet) {
  if (!pet || pet.stage === 'egg') return { ok: false, why: 'Not hatched yet.' };
  if (pet.errand) return { ok: false, why: 'Already out on an errand.' };
  if (petLevel(pet) < ERRANDS.MIN_LEVEL) {
    return { ok: false, why: `Needs to be fully grown — level ${ERRANDS.MIN_LEVEL}. This one is ${petLevel(pet)}.` };
  }
  if (mood(pet).id !== ERRANDS.REQUIRED_MOOD) {
    return { ok: false, why: 'Only a thriving pet will work. Feed it and play with it first.' };
  }
  const left = errandCooldownLeft(pet);
  if (left > 0) return { ok: false, why: `Resting — ready in ${Math.ceil(left / 60000)} min.` };
  return { ok: true, why: '' };
}

export function errandCooldownLeft(pet) {
  return Math.max(0, (pet.errandAt || 0) + ERRANDS.COOLDOWN_MS - Date.now());
}

export function errandReady(pet) {
  return !!pet.errand && Date.now() >= pet.errand.readyAt;
}

export function errandTimeLeft(pet) {
  return pet.errand ? Math.max(0, pet.errand.readyAt - Date.now()) : 0;
}

export function sendOnErrand(petId, errandId) {
  const pet = state.pets?.owned?.[petId];
  const def = getErrand(errandId);
  if (!pet || !def) return false;
  settle(pet);
  const check = canErrand(pet);
  if (!check.ok) {
    emit('notify', { type: 'sys', text: check.why });
    return false;
  }
  const now = Date.now();
  pet.errand = { id: errandId, startedAt: now, readyAt: now + ERRANDS.DURATION_MS };
  // A working pet is not at your side.
  if (state.pets.active === petId) state.pets.active = null;
  emit('notify', { type: 'sys', text: `${getSpecies(pet.species)?.icon} ${pet.name} sets off to ${def.name.toLowerCase()}.` });
  emit('pets-changed', {});
  emit('state-changed');
  return true;
}

/**
 * Bring the pet home. Pays out, then charges what the work cost it.
 */
export function collectErrand(petId) {
  const pet = state.pets?.owned?.[petId];
  if (!pet?.errand) return false;
  if (!errandReady(pet)) return false;
  const def = getErrand(pet.errand.id);
  const workedMs = Date.now() - pet.errand.startedAt;
  pet.errand = null;
  pet.errandAt = Date.now();
  state.stats.errands = (state.stats.errands || 0) + 1;

  settle(pet);   // normal decay up to now, so the extra below is additive

  // What the work took out of it, over and above simply existing.
  const t = getTrait(pet.trait);
  const hours = Math.min(workedMs, ERRANDS.DURATION_MS) / (60 * 60 * 1000);
  const extraH = hours * CARE.HUNGER_DECAY_PER_HOUR * (ERRANDS.DRAIN_MULT - 1) * (1 - (t?.hungerSlow || 0));
  const extraP = hours * CARE.HAPPY_DECAY_PER_HOUR * (ERRANDS.DRAIN_MULT - 1) * (1 - (t?.happySlow || 0));
  pet.hunger = Math.max(0, (pet.hunger ?? 100) - extraH - ERRANDS.ARRIVAL_HUNGER_COST);
  pet.happy = Math.max(0, (pet.happy ?? 100) - extraP - ERRANDS.ARRIVAL_HAPPY_COST);

  // Paid in the same combat-minute currency the road uses, so an errand
  // can never quietly become the best gold in the game.
  const perMinute = combatIncome(combatLevel(), state.era || 1).gold;
  const parts = [];
  const gold = Math.round(perMinute * (def.payout || 1));
  if (gold > 0) { addGold(gold, { silent: true }); parts.push(`🪙 ${gold.toLocaleString()}`); }

  for (const [id, range] of Object.entries(def.items || {})) {
    const n = Array.isArray(range)
      ? range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1))
      : range;
    addItem(id, n);
    parts.push(`${getItem(id)?.icon || '📦'} ${getItem(id)?.name || id} ×${n}`);
  }
  for (const [skillId, n] of Object.entries(def.xp || {})) {
    if (state.skills[skillId]) { addXp(skillId, n * Math.max(1, petLevel(pet))); parts.push(`✨ ${skillId}`); }
  }

  emit('notify', { type: 'gold',
    text: `${def.icon} ${pet.name} ${def.done} — ${parts.join(' · ')}` });
  emit('pets-changed', {});
  emit('state-changed');
  return true;
}

/** Everything the panel needs. */
export function errandView(pet) {
  if (!pet) return null;
  return {
    list: ERRAND_LIST,
    can: canErrand(pet),
    out: !!pet.errand,
    ready: errandReady(pet),
    timeLeft: errandTimeLeft(pet),
    cooldownLeft: errandCooldownLeft(pet),
    current: pet.errand ? getErrand(pet.errand.id) : null,
    durationMs: ERRANDS.DURATION_MS,
  };
}
