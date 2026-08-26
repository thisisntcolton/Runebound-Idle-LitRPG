// ============================================================
// ABILITIES PANEL — loadout slots, known tomes, unlock status
// ============================================================
import { state } from '../core/state.js';
import { SLOTS, ABILITY_LIST, SLOT_UNLOCK_ENCHANT, tomeIdFor } from '../data/abilities.js';
import { getItem } from '../data/items.js';
import { abilityStatus, knowsAbility, weaponEnchant, slotUnlocked,
         tomeSource, tomesOutstanding } from '../systems/abilities.js';

function abilityCard(ab, { known, equipped, slotOpen }) {
  const tome = getItem(tomeIdFor(ab.id));
  return `
    <div class="card ${known ? '' : 'locked'} ${equipped ? 'active-card' : ''}">
      <div class="card-title">
        <span class="card-icon">${ab.icon}</span> ${ab.name}
        <span class="pill rarity-${ab.rarity}" style="border-color:currentColor">${ab.rarity}</span>
        ${equipped ? '<span class="pill" style="color:var(--xp);border-color:var(--xp)">EQUIPPED</span>' : ''}
      </div>
      <div class="card-sub">${ab.desc}</div>
      <div class="card-sub" style="font-style:italic;opacity:0.75">${ab.flavor}</div>
      <div class="card-yield">
        <span>${ab.cooldown ? `⏱ ${(ab.cooldown / 1000).toFixed(0)}s cooldown` : '♾ passive'}</span>
        <span>${known
          ? (slotOpen ? '' : '<span class="lock-req">slot locked</span>')
          : `<span class="lock-req">Not learned — find ${tome?.icon || '📕'} ${tome?.name || 'its tome'}</span>`}</span>
      </div>
      ${known ? '' : `<div class="card-sub" style="color:var(--sys-blue)">📍 ${tomeSource(ab.id)}</div>`}
      ${known && slotOpen && !equipped
        ? `<button class="btn btn-sm btn-primary btn-block" data-act="equip-ability" data-slot="${ab.slot}" data-ability="${ab.id}">Equip</button>`
        : ''}
      ${equipped
        ? `<button class="btn btn-sm btn-block" data-act="equip-ability" data-slot="${ab.slot}" data-ability="">Unequip</button>`
        : ''}
    </div>`;
}

export function abilitiesPanel() {
  const status = abilityStatus();
  const ench = weaponEnchant();

  const slotCards = status.map(s => {
    const ab = s.ability;
    if (!s.unlocked) {
      return `
        <div class="card locked">
          <div class="card-title"><span class="card-icon">${s.slot.icon}</span> ${s.slot.name}</div>
          <div class="card-sub">${s.slot.desc}</div>
          <div class="lock-req">🔒 Requires a weapon enchanted to +${s.requires} — yours is +${ench}</div>
        </div>`;
    }
    return `
      <div class="card ${ab ? 'active-card' : ''}">
        <div class="card-title"><span class="card-icon">${s.slot.icon}</span> ${s.slot.name}</div>
        <div class="card-sub">${s.slot.desc}</div>
        ${ab
          ? `<div class="card-title" style="margin-top:8px">${ab.icon} ${ab.name}</div>
             <div class="card-sub">${ab.desc}</div>`
          : '<div class="muted" style="margin-top:8px">Empty — equip an ability below.</div>'}
      </div>`;
  }).join('');

  // Unlearned tomes sitting in the bag
  const bagTomes = Object.keys(state.inventory)
    .map(id => getItem(id))
    .filter(it => it?.type === 'tome');
  const tomeRows = bagTomes.length ? bagTomes.map(t => `
    <div class="shop-row">
      <div style="font-size:20px">${t.icon}</div>
      <div class="shop-row-info">
        <div class="shop-row-title rarity-${t.rarity}">${t.name}</div>
        <div class="shop-row-desc">${knowsAbility(t.teaches) ? 'Already known — reading it again does nothing.' : 'Unread. Study it to learn the ability permanently.'}</div>
      </div>
      <button class="btn btn-sm ${knowsAbility(t.teaches) ? '' : 'btn-primary'}" data-act="learn-tome" data-item="${t.id}">
        📖 Study
      </button>
    </div>`).join('') : `<div class="muted">No tomes in your bag. ${tomesOutstanding()} abilities are still out there —
       each card below says where to look. Sealing an Unstable Rift is the single best odds in the game.</div>`;

  const bySlot = SLOTS.map(s => {
    const list = ABILITY_LIST.filter(a => a.slot === s.id).map(ab => abilityCard(ab, {
      known: knowsAbility(ab.id),
      equipped: state.abilities?.equipped?.[s.id] === ab.id,
      slotOpen: slotUnlocked(s.id),
    })).join('');
    return `<div class="section-title">${s.icon} ${s.name} abilities</div><div class="card-grid">${list}</div>`;
  }).join('');

  const knownCount = ABILITY_LIST.filter(a => knowsAbility(a.id)).length;

  return `
    <div class="panel-header">
      <div class="panel-title">✨ Abilities</div>
      <div class="panel-subtitle">${knownCount} / ${ABILITY_LIST.length} learned · weapon +${ench}</div>
    </div>
    <div class="panel-desc">You pick the loadout; your hero executes it. Abilities fire automatically on cooldown —
    the Strike slot also has a manual trigger in the Fight view if you want a hand in it.
    Slots unlock by enchanting your weapon: Guard at <b>+${SLOT_UNLOCK_ENCHANT.guard}</b>, Utility at <b>+${SLOT_UNLOCK_ENCHANT.utility}</b>.</div>
    <div class="card-grid">${slotCards}</div>
    <div class="section-title">📕 Tomes in your bag</div>
    ${tomeRows}
    ${bySlot}
  `;
}
