// ============================================================
// THE WORLD BOSS — surfacing, preparation, contact, and the long kill
// ============================================================
import { state, maxHp, activeBuffs } from '../core/state.js';
import { BOSS, PREP, MAX_PREP, COLOSSUS, TROPHY, healthFor, auraDps } from '../data/worldboss.js';
import { activeTownBuffs } from './town.js';
import { activePet, hunger } from './pets.js';
import { currentClass } from './classes.js';
import { addGold, addItem, itemCount } from './inventory.js';
import { rollEggDrop } from './pets.js';
import { rollTome } from './abilities.js';
import { getItem } from '../data/items.js';
import { emit } from '../core/events.js';
import { fmt } from '../core/format.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setBossUIHooks(h) { hooks = h; }

export function boss() {
  if (!state.worldBoss) {
    state.worldBoss = {
      nextAt: 0,        // ticked ms remaining until it surfaces
      playMs: 0,        // ticked play accumulated toward that
      up: false,
      hp: 0,
      maxHp: 0,
      surfacedAt: 0,
      expiresAt: 0,
      felled: 0,        // lifetime kills — permanent, feeds the trophy
      dealt: 0,         // damage banked against the CURRENT one
      contactMs: 0,     // unbroken seconds inside the aura
      lastContactAt: 0,
      prep: 0,          // preparation locked in at the last engage
    };
  }
  return state.worldBoss;
}

export function unlocked() { return (state.era || 1) >= 2; }

// ---------------- Preparation ----------------
//
// Evaluated live so the panel can show a checklist that ticks over as you
// go and fetch things, and LOCKED at the moment of engagement so that
// drinking a potion mid-fight does not retroactively improve the round.

export function prepCheck() {
  const b = boss();
  const pet = activePet();
  const food = state.combat?.foodItem;
  const have = {
    potion: activeBuffs().some(x => x.id !== 'wounded'),
    town: activeTownBuffs().length >= 2,
    class: !!currentClass(),
    depth: (state.deep?.best || 0) >= 10,
    pet: !!pet && hunger(pet) > 35,
    food: !!food && itemCount(food) >= 150,
    whole: (state.combat?.playerHp || 0) >= maxHp() - 1 && !state.buffs?.wounded,
  };
  const lines = PREP.map(p => ({ ...p, met: !!have[p.id] }));
  const score = lines.reduce((s, p) => s + (p.met ? p.bonus : 0), 0);
  return {
    lines,
    score,
    fraction: MAX_PREP ? score / MAX_PREP : 0,
    multiplier: 1 + score,
    locked: b.prep || 0,
  };
}

/** The damage multiplier in force for the round you are currently in. */
export function prepMultiplier() {
  return 1 + (boss().prep || 0);
}

// ---------------- Surfacing ----------------

function schedule(first = false) {
  const b = boss();
  b.playMs = 0;
  b.nextAt = first ? BOSS.FIRST_MS : BOSS.MIN_MS + Math.random() * (BOSS.MAX_MS - BOSS.MIN_MS);
}

function surface() {
  const b = boss();
  const hp = healthFor(state.ascensions || 0, state.deep?.best || 0);
  b.up = true;
  // A Vigil that submerged with damage on it keeps most of that damage.
  // Starting from full every time would make the persistence pointless.
  b.maxHp = hp;
  b.hp = b.hp > 0 ? Math.min(hp, b.hp) : hp;
  b.surfacedAt = Date.now();
  b.expiresAt = Date.now() + BOSS.WINDOW_MS;
  b.dealt = 0;
  b.contactMs = 0;

  emit('notify', { type: 'combat', text: `${COLOSSUS.icon} ${COLOSSUS.name.toUpperCase()} IS STANDING UP. East of the town, and still rising.` });
  hooks.queueModal(`
    <div class="modal-tag glitch-tag">◈ SOMETHING IS SURFACING ◈</div>
    <div class="modal-title">${COLOSSUS.icon} ${COLOSSUS.name}</div>
    <div class="modal-body" style="line-height:1.75">
      <p>${COLOSSUS.blurb}</p>
      ${COLOSSUS.lore.map(l => `<p class="muted">${l}</p>`).join('')}
      <p style="color:var(--gold)"><b>You are not going to kill this today.</b> Everything you
      take off it is kept — come back to it, and come back <i>ready</i>. The Wastes screen
      has a list of what "ready" means and what each line is worth.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-danger" data-act="close-modal">Go and look at it</button></div>
  `);
  emit('boss-surfaced', { hp });
  emit('state-changed');
}

function submerge() {
  const b = boss();
  // A share of what you did THIS TIME it was up — not of everything ever
  // done to it. The latter regenerates faster the more wounded it is, so
  // the fight never converges and nobody ever finishes one.
  const back = Math.round((b.dealt || 0) * BOSS.REGEN_ON_SUBMERGE);
  b.hp = Math.min(b.maxHp, b.hp + back);
  b.up = false;
  b.contactMs = 0;
  schedule();
  emit('notify', { type: 'sys',
    text: `${COLOSSUS.icon} ${COLOSSUS.name} has gone back down. It took ${fmt(back)} of its health with it. The rest is still off.` });
  emit('boss-submerged', {});
  emit('state-changed');
}

export function isUp() {
  const b = boss();
  return unlocked() && b.up && Date.now() < b.expiresAt;
}

export function timeLeft() {
  const b = boss();
  return Math.max(0, b.expiresAt - Date.now());
}

// ---------------- Contact ----------------

/**
 * Called when the player engages. Locks in preparation for this round and
 * clears the contact ramp if they have been away long enough to recover.
 */
export function engage() {
  if (!isUp()) return false;
  const b = boss();
  b.prep = prepCheck().score;
  if (Date.now() - (b.lastContactAt || 0) > BOSS.RECOVERY_MS) b.contactMs = 0;
  b.lastContactAt = Date.now();
  return true;
}

/**
 * Aura damage for this tick, and the running contact time.
 * Called from the combat tick while the boss fight is live.
 */
export function tickAura(dt) {
  const b = boss();
  b.contactMs = (b.contactMs || 0) + dt;
  b.lastContactAt = Date.now();
  const seconds = b.contactMs / 1000;
  const prepFraction = MAX_PREP ? (b.prep || 0) / MAX_PREP : 0;
  return (auraDps(seconds, prepFraction) * dt) / 1000;
}

export function contactSeconds() { return (boss().contactMs || 0) / 1000; }

/** Record damage against the persistent pool. */
export function creditDamage(amount) {
  const b = boss();
  if (!b.up || amount <= 0) return false;
  b.hp = Math.max(0, b.hp - amount);
  b.dealt = (b.dealt || 0) + amount;
  if (b.hp <= 0) { fell(); return true; }
  return false;
}

export function disengage() {
  const b = boss();
  b.lastContactAt = Date.now();
  emit('state-changed');
}

// ---------------- The kill ----------------

function fell() {
  const b = boss();
  b.up = false;
  b.felled = (b.felled || 0) + 1;
  b.hp = 0;
  b.contactMs = 0;
  schedule();

  const s = COLOSSUS.spoils;
  const gold = addGold(s.gold[0] + Math.random() * (s.gold[1] - s.gold[0]), { silent: true });
  const got = [`🪙 ${fmt(gold)}`];
  for (const drop of s.items) {
    const qty = drop.qty[0] + Math.floor(Math.random() * (drop.qty[1] - drop.qty[0] + 1));
    addItem(drop.item, qty);
    const item = getItem(drop.item);
    got.push(`${item?.icon || '📦'} ${item?.name} ×${qty}`);
    emit('loot', { itemId: drop.item, qty, source: 'boss', rarity: item?.rarity });
  }
  state.shards = (state.shards || 0) + s.shards;
  got.push(`💠 ${s.shards}`);
  // It was carrying something. It has been carrying it for nine hundred years.
  rollEggDrop('vigil');
  rollTome('vigil');

  hooks.queueModal(`
    <div class="modal-tag">◈ IT HAS STOPPED ◈</div>
    <div class="modal-title">${COLOSSUS.icon} ${COLOSSUS.name} — off</div>
    <div class="modal-body" style="line-height:1.75">
      <p>It does not fall. It kneels, slowly, the way something kneels when kneeling is
      a procedure it has, and then it stops doing anything at all.</p>
      <p>Ferrin gets to the ankle plate before anyone else and writes the date in the
      blank space under the service interval, in pencil, very small.</p>
      <p class="muted">Nine hundred years. Somebody will be along.</p>
      <p style="color:var(--gold)">${got.join(' · ')}</p>
      <p style="color:var(--sys-blue)"><b>Trophy ${b.felled}</b> — permanently:
        +${Math.round(TROPHY.damage * 100)}% damage, +${Math.round(TROPHY.maxhp * 100)}% health,
        +${Math.round(TROPHY.gold * 100)}% gold. It does not reset. Nothing you take off one of
        these ever does.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Sit down</button></div>
  `);
  emit('notify', { type: 'gold', text: `${COLOSSUS.icon} ${COLOSSUS.name} is off. ${got.join(' · ')}` });
  emit('boss-felled', { felled: b.felled });
  emit('state-changed');
}

/** The permanent standing bonus from every Vigil ever felled. */
export function bossBonus(key) {
  const per = TROPHY[key];
  if (!per) return 0;
  return per * (boss().felled || 0);
}

// ---------------- Tick ----------------

export function tickBoss(dt) {
  if (!unlocked()) return;
  const b = boss();

  if (b.up) {
    if (Date.now() >= b.expiresAt) submerge();
    return;
  }
  if (!b.nextAt) { schedule(true); return; }
  b.playMs = (b.playMs || 0) + dt;
  if (b.playMs >= b.nextAt) surface();
}

// ---------------- View ----------------

export function bossMonster() {
  const b = boss();
  return {
    id: COLOSSUS.id,
    name: COLOSSUS.name,
    icon: COLOSSUS.icon,
    level: 99,
    // Combat reads `hp` as the FULL bar and c.monsterHp as remaining; the
    // remaining value is seeded from the persistent pool at engage.
    hp: b.maxHp || healthFor(state.ascensions || 0, state.deep?.best || 0),
    defense: 340,
    attack: 150,
    maxHit: 0,          // it does not swing. The aura is the fight.
    attackSpeed: 100000,
    gold: [0, 0],
    boss: true,
    worldBoss: true,
    loot: null,
  };
}

export function bossView() {
  const b = boss();
  const prep = prepCheck();
  return {
    unlocked: unlocked(),
    up: isUp(),
    def: COLOSSUS,
    hp: b.hp,
    maxHp: b.maxHp || healthFor(state.ascensions || 0, state.deep?.best || 0),
    pct: b.maxHp ? b.hp / b.maxHp : 1,
    dealt: b.dealt || 0,
    felled: b.felled || 0,
    timeLeft: timeLeft(),
    prep,
    contact: contactSeconds(),
    recovered: Date.now() - (b.lastContactAt || 0) > BOSS.RECOVERY_MS,
    trophy: {
      damage: bossBonus('damage'), maxhp: bossBonus('maxhp'), gold: bossBonus('gold'),
    },
    // How long until the next one, in ticked play. Only shown once you
    // have seen one, so the first is a surprise.
    nextIn: Math.max(0, (b.nextAt || 0) - (b.playMs || 0)),
    everSeen: (b.felled || 0) > 0 || !!b.surfacedAt,
  };
}

export function initBoss() { boss(); }
