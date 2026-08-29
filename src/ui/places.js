// ============================================================
// THE PLACES — what you see when you walk into one
//
// Four panels for four buildings that are not businesses. Each one is
// written to feel like somewhere rather than a screen: the Long Table
// tells you who is actually sitting at it right now, the Square tells you
// what the town needs, the Gate is a muster point, and the house is
// yours.
// ============================================================
import { state } from '../core/state.js';
import { PLACES, getPlace, hourNow } from '../data/places.js';
import { ROOMS, SETS, FURNITURE, BUYABLE, CRAFTABLE, FOUND, getFurniture } from '../data/home.js';
import { homeView, spare, furniturePrice, ownsAny } from '../systems/home.js';
import { peopleAt, personView, requestProgress, giftableFor, townView, livingHere } from '../systems/lives.js';
import { legacyView } from '../systems/legacy.js';
import { expeditionView } from '../systems/expeditions.js';
import { TRAINABLE_SKILLS, SKILLS } from '../data/skills.js';
import { getItem } from '../data/items.js';
import { fmt, fmtInt, fmtDuration } from '../core/format.js';
import { visiting } from '../systems/visiting.js';

export const placesUI = {
  room: 'hearth', shopTab: 'buy', person: null,
  dest: null, risk: 'steady', prov: 'none', party: [],
};

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function header(id, sub) {
  const p = getPlace(id);
  const hour = hourNow();
  return `
    <div class="panel-header">
      <div class="panel-title">${p.icon} ${p.name}</div>
      <div class="panel-subtitle">${hour.icon} ${hour.label}${sub ? ' · ' + sub : ''}</div>
    </div>
    <div class="place-back"><button class="btn btn-sm" data-act="nav" data-view="town">← Back to Hearthwick</button></div>
    <div class="panel-desc">${p.blurb}</div>`;
}

// ============================================================
// YOUR HOUSE
// ============================================================

export function homePanel() {
  const v = homeView();
  const room = v.rooms.find(r => r.id === placesUI.room) || v.rooms[0];
  placesUI.room = room?.id || 'hearth';

  const roomTabs = v.rooms.map(r => `
    <button class="btn btn-sm ${r.id === room.id ? 'btn-primary' : ''}"
            data-act="home-room" data-room="${r.id}">${r.icon} ${r.name}</button>`).join('');

  const slots = Array.from({ length: room.slots }, (_, i) => {
    const f = room.placed[i];
    if (!f) return `<div class="home-slot empty"><span class="muted">empty</span></div>`;
    return `
      <div class="home-slot filled rarity-${f.rarity}" title="${esc(f.blurb)}">
        <div class="home-slot-icon">${f.icon}</div>
        <div class="home-slot-name">${f.name}</div>
        <div class="home-slot-set">${SETS[f.set]?.icon} ${SETS[f.set]?.name}</div>
        <button class="btn btn-sm" data-act="home-unplace" data-room="${room.id}" data-index="${i}">Put away</button>
      </div>`;
  }).join('');

  // What you own and could put in THIS room.
  const storable = FURNITURE.filter(f => f.room === room.id && spare(f.id) > 0);

  return `
    ${header('home', `${v.level} of ${v.maxLevel} rooms`)}

    ${v.sets.length ? `
      <div class="set-banner">
        ${v.sets.map(s => `<span class="set-chip">${s.icon} <b>${s.name}</b> — ${s.desc}</span>`).join('')}
      </div>` : ''}

    <div class="tab-row">${roomTabs}</div>
    <div class="muted" style="margin-bottom:10px">${room.blurb}
      ${room.complete
        ? `<br><span style="color:var(--xp)">✦ Complete set — ${room.complete.icon} <b>${room.complete.name}</b>: ${room.complete.desc}</span>`
        : `<br><span style="font-size:11.5px">Fill all ${room.slots} places from a single set to earn its bonus.</span>`}
    </div>
    <div class="home-grid">${slots}</div>

    <div class="section-title">📦 In storage</div>
    ${storable.length ? `
      <div class="pet-food-strip">
        ${storable.map(f => `
          <button class="food-chip rarity-${f.rarity}" data-act="home-place" data-furniture="${f.id}"
                  data-room="${room.id}" title="${esc(f.blurb)}">
            <span style="font-size:19px">${f.icon}</span>
            <span>${f.name}</span>
            <b>×${spare(f.id)}</b>
            <span class="food-bond">${SETS[f.set]?.icon}</span>
          </button>`).join('')}
      </div>`
      : `<div class="muted">Nothing for this room in storage. The Square sells furniture, the crafting
         skills make it, and the rest of it is out in the world being guarded by something.</div>`}

    ${v.next ? `
      <div class="section-title">🔨 Extend the house</div>
      <div class="shop-row">
        <div style="font-size:22px">${v.next.icon}</div>
        <div class="shop-row-info">
          <div class="shop-row-title">${v.next.name}</div>
          <div class="shop-row-desc">${v.next.blurb} · ${v.next.slots} places</div>
          <div class="shop-row-desc">${costLine(v.cost)}</div>
        </div>
        <button class="btn btn-sm ${v.canExtend ? 'btn-gold' : ''}" data-act="home-extend"
                ${v.canExtend ? '' : 'disabled'}>Build it</button>
      </div>`
      : `<div class="muted" style="margin-top:14px">The house is as big as it goes. It is bigger than it
         looks from outside, and you have stopped mentioning that.</div>`}
  `;
}

function costLine(cost) {
  if (!cost) return '';
  const parts = [`<span class="cost ${state.gold >= cost.gold ? '' : 'unaffordable'}">🪙 ${fmt(cost.gold)}</span>`];
  for (const [id, q] of Object.entries(cost.items || {})) {
    const item = getItem(id);
    const have = state.inventory[id] || 0;
    parts.push(`<span style="color:${have >= q ? 'var(--text-dim)' : 'var(--danger)'}">${item?.icon} ${q} ${item?.name} (${fmt(have)})</span>`);
  }
  return parts.join(' · ');
}

// ============================================================
// THE SQUARE — the board, and the furniture stall
// ============================================================

export function squarePanel() {
  const here = peopleAt('square');
  const everyone = townView();
  const asking = everyone.filter(p => p.request);

  const shop = placesUI.shopTab === 'craft' ? CRAFTABLE
             : placesUI.shopTab === 'found' ? FOUND
             : BUYABLE;

  return `
    ${header('square', `${asking.length} asking for something`)}

    <div class="section-title">📋 The Board</div>
    ${asking.length ? asking.map(p => {
      const prog = requestProgress(p.id);
      return `
        <div class="shop-row ${prog?.ready ? 'ready-row' : ''}">
          <div style="font-size:22px">${p.def?.icon || '🙂'}</div>
          <div class="shop-row-info">
            <div class="shop-row-title">${p.def?.name} <span class="muted">· ${p.trade}</span></div>
            <div class="shop-row-desc">"${esc(p.request.ask)}"</div>
            <div class="shop-row-desc" style="color:${prog?.ready ? 'var(--xp)' : 'var(--text-dim)'}">
              ${prog ? `${fmtInt(prog.cur)} / ${fmtInt(prog.max)}` : ''}
              · 🪙 ${fmt(p.request.reward?.gold || 0)}
              · ${fmtDuration(Math.max(0, p.request.expiresAt - Date.now()) / 1000)} left
            </div>
          </div>
          ${prog?.ready
            ? `<button class="btn btn-sm btn-gold" data-act="request-deliver" data-who="${p.id}">Hand it over</button>`
            : `<button class="btn btn-sm" data-act="visit-person" data-who="${p.id}">Find them</button>`}
        </div>`;
    }).join('')
    : `<div class="muted">Nothing pinned up. Talk to people — they ask when they see you.</div>`}

    <div class="section-title">🪑 Furnishings</div>
    <div class="tab-row">
      <button class="btn btn-sm ${placesUI.shopTab === 'buy' ? 'btn-primary' : ''}" data-act="square-tab" data-tab="buy">For sale</button>
      <button class="btn btn-sm ${placesUI.shopTab === 'craft' ? 'btn-primary' : ''}" data-act="square-tab" data-tab="craft">Made to order</button>
      <button class="btn btn-sm ${placesUI.shopTab === 'found' ? 'btn-primary' : ''}" data-act="square-tab" data-tab="found">Not for sale</button>
    </div>
    <div class="card-grid">
      ${shop.map(f => {
        const price = furniturePrice(f.id);
        const afford = state.gold >= price;
        const have = state.home?.owned?.[f.id] || 0;
        return `
          <div class="card ${placesUI.shopTab === 'found' && !have ? 'locked' : ''}">
            <div class="card-title"><span class="card-icon">${f.icon}</span> ${f.name}
              <span class="pill rarity-${f.rarity}">${f.rarity}</span></div>
            <div class="card-sub" style="font-style:italic;opacity:0.8">${f.blurb}</div>
            <div class="card-sub">${SETS[f.set]?.icon} ${SETS[f.set]?.name} · ${ROOMS.find(r => r.id === f.room)?.name}</div>
            <div class="card-sub" style="color:var(--xp)">${Object.entries(f.bonus || {})
              .map(([k, v]) => `+${(v * 100).toFixed(1)}% ${k.replace(/_/g, ' ')}`).join(' · ')}</div>
            ${have ? `<div class="card-sub muted">You own ${have}.</div>` : ''}
            ${placesUI.shopTab === 'buy'
              ? `<div class="card-yield"><span class="cost ${afford ? '' : 'unaffordable'}">🪙 ${fmt(price)}</span></div>
                 <button class="btn btn-sm ${afford ? 'btn-gold' : ''} btn-block" data-act="home-buy"
                         data-furniture="${f.id}" ${afford ? '' : 'disabled'}>Buy</button>`
              : placesUI.shopTab === 'craft'
                ? `<div class="card-sub lock-req">Made at ${SKILLS[f.craft.skill]?.name} ${f.craft.level}</div>`
                : `<div class="card-sub lock-req">${f.source}</div>`}
          </div>`;
      }).join('')}
    </div>
  `;
}

// ============================================================
// THE LONG TABLE — where people actually are
// ============================================================

export function tablePanel() {
  const here = peopleAt('table');
  const elsewhere = townView().filter(p => p.where !== 'table');

  return `
    ${header('table', `${here.length} here now`)}

    ${here.length ? here.map(personCard).join('')
      : `<div class="muted">Nobody at the table this hour. They keep their own times — come back later,
         or go and find them where they are.</div>`}

    <div class="section-title">🚶 Elsewhere in town</div>
    <div class="where-list">
      ${elsewhere.map(p => `
        <div class="where-row">
          <span style="font-size:18px">${p.def?.icon || '🙂'}</span>
          <span class="where-name">${p.def?.name}</span>
          <span class="muted">${p.trade}</span>
          <span class="where-at">${p.where === 'home' ? 'at home, not to be disturbed'
            : `at ${getPlace(p.where)?.name || p.where}`}</span>
          <span class="pill">${p.tier.icon} ${p.tier.label}</span>
        </div>`).join('')}
    </div>
  `;
}

function personCard(p) {
  const prog = requestProgress(p.id);
  const gifts = giftableFor(p.id);
  const open = placesUI.person === p.id;
  return `
    <div class="person-card ${open ? 'open' : ''}">
      <div class="person-head" data-act="visit-person" data-who="${p.id}">
        <span class="person-icon">${p.def?.icon || '🙂'}</span>
        <div style="flex:1;min-width:0">
          <div class="person-name">${p.def?.name}
            <span class="pill">${p.tier.icon} ${p.tier.label}</span></div>
          <div class="muted">${p.trade}</div>
        </div>
        <div class="bond-bar-outer" title="${Math.round(p.bond)} / 100">
          <div class="bond-bar-inner" style="width:${p.bond}%"></div>
        </div>
      </div>
      <div class="person-line">${esc(p.line)}</div>
      ${p.request ? `
        <div class="person-request ${prog?.ready ? 'ready' : ''}">
          <b>Asking:</b> ${esc(p.request.ask)}
          <div class="muted">${prog ? `${fmtInt(prog.cur)} / ${fmtInt(prog.max)}` : ''} · 🪙 ${fmt(p.request.reward?.gold || 0)}</div>
          ${prog?.ready ? `<button class="btn btn-sm btn-gold" data-act="request-deliver" data-who="${p.id}">Hand it over</button>` : ''}
        </div>` : ''}
      ${open ? `
        <div class="section-title" style="margin-top:12px">🎁 Give them something</div>
        <div class="pet-food-strip">
          ${gifts.map(g => `
            <button class="food-chip ${g.liked ? 'liked' : ''}" data-act="give-gift"
                    data-who="${p.id}" data-item="${g.id}"
                    title="${g.liked ? 'They would love this' : 'They would be polite about it'}">
              <span style="font-size:19px">${g.item.icon}</span>
              <span>${g.item.name}</span>
              <b>×${fmt(g.qty)}</b>
            </button>`).join('') || '<span class="muted">Nothing in your bag worth giving.</span>'}
        </div>` : ''}
    </div>`;
}

// ============================================================
// THE GATE — expeditions, and your household
// ============================================================

export function gatePanel() {
  const v = expeditionView();
  const selves = legacyView();

  if (v.active) {
    const a = v.active;
    return `
      ${header('gate', 'a party is out')}
      <div class="expedition-out">
        <div class="expedition-out-title">⛩️ Out past the gate</div>
        <div class="muted">${a.party.map(m => `${m.icon} ${esc(m.name)}`).join(' · ')}</div>
        <div style="margin-top:10px;font-family:var(--font-mono);font-size:15px">
          ${a.ready ? '<span style="color:var(--xp)">They are back at the gate.</span>'
                    : `Home in ${fmtDuration(a.left / 1000)}`}
        </div>
        ${a.ready ? `<button class="btn btn-gold" data-act="expedition-collect">See what they found</button>` : ''}
      </div>
      ${householdBlock(selves)}`;
  }

  const dest = v.destinations.find(d => d.id === placesUI.dest);
  const chosen = placesUI.party.filter(id => v.roster.some(r => r.id === id));

  return `
    ${header('gate', `${v.completed} expeditions run`)}

    <div class="section-title">🗺️ Where to</div>
    <div class="card-grid">
      ${v.destinations.map(d => `
        <div class="card ${d.open ? 'clickable' : 'locked'} ${d.id === placesUI.dest ? 'active-card' : ''}"
             ${d.open ? `data-act="exp-dest" data-dest="${d.id}"` : ''}>
          <div class="card-title"><span class="card-icon">${d.icon}</span> ${d.name}</div>
          <div class="card-sub" style="font-style:italic;opacity:0.8">${d.blurb}</div>
          <div class="card-sub">${d.hours}h away · ${d.open ? `pays about ${d.pay} minutes of fighting`
            : `<span class="lock-req">Needs combat level ${d.level}</span>`}</div>
        </div>`).join('')}
    </div>

    ${dest ? `
      <div class="section-title">👥 Who goes <span class="pill">${chosen.length} / ${v.slots}</span></div>
      ${v.roster.length ? `
        <div class="pet-food-strip">
          ${v.roster.map(m => `
            <button class="food-chip ${chosen.includes(m.id) ? 'liked' : ''}"
                    data-act="exp-party" data-member="${m.id}">
              <span style="font-size:19px">${m.icon}</span>
              <span>${esc(m.name)}</span>
            </button>`).join('')}
        </div>`
        : `<div class="muted">Nobody to send yet. Your pets can go once one is walking with you, and your
           former selves live here from your next Ascension onward.</div>`}

      <div class="section-title">⚖️ How careful</div>
      <div class="card-grid">
        ${v.risks.map(r => `
          <div class="card clickable ${r.id === placesUI.risk ? 'active-card' : ''}"
               data-act="exp-risk" data-risk="${r.id}">
            <div class="card-title"><span class="card-icon">${r.icon}</span> ${r.name}</div>
            <div class="card-sub">${r.desc}</div>
          </div>`).join('')}
      </div>

      <div class="section-title">🎒 Provisions</div>
      <div class="card-grid">
        ${v.provisions.map(p => `
          <div class="card clickable ${p.id === placesUI.prov ? 'active-card' : ''} ${p.ok ? '' : 'locked'}"
               ${p.ok ? `data-act="exp-prov" data-prov="${p.id}"` : ''}>
            <div class="card-title"><span class="card-icon">${p.icon}</span> ${p.name}</div>
            <div class="card-sub">${p.desc}</div>
            ${p.item ? `<div class="card-sub ${p.ok ? '' : 'lock-req'}">${getItem(p.item)?.icon} ${p.qty} needed · you have ${fmt(p.have)}</div>` : ''}
          </div>`).join('')}
      </div>

      <div style="margin-top:16px">
        <button class="btn btn-gold ${chosen.length ? '' : ''}" data-act="exp-send"
                ${chosen.length ? '' : 'disabled'}>⛩️ Send them out</button>
      </div>`
      : `<div class="muted" style="margin-top:12px">Pick somewhere to send a party.</div>`}

    ${householdBlock(selves)}

    ${v.history.length ? `
      <div class="section-title">📖 Recently</div>
      ${v.history.slice(0, 4).map(h => `
        <div class="shop-row">
          <div class="shop-row-info">
            <div class="shop-row-title">${h.destination}</div>
            <div class="shop-row-desc">${esc((h.party || []).join(', '))} — 🪙 ${fmt(h.gold)}</div>
          </div>
        </div>`).join('')}` : ''}
  `;
}

/**
 * The household.
 *
 * Shown at the gate because this is where they muster, and because a
 * player who has just Ascended should see the person they used to be
 * standing in a list of people who work for them now.
 */
function householdBlock(selves) {
  if (!selves.length) {
    return `
      <div class="section-title">🏚️ The household</div>
      <div class="muted">Nobody yet. When you Ascend, the person you have been does not vanish —
      they take a room in Hearthwick, and they are still here when you walk back in at level one.</div>`;
  }
  const skills = TRAINABLE_SKILLS;
  return `
    <div class="section-title">🏚️ The household <span class="pill">${selves.length}</span></div>
    <div class="muted" style="margin-bottom:10px">
      The people you used to be. They keep their faces, and they get better at this the longer
      they have been here.
    </div>
    ${selves.map(w => `
      <div class="shop-row ${w.hurt ? 'hurt-row' : ''}">
        <div style="font-size:22px">${w.classIcon}</div>
        <div class="shop-row-info">
          <div class="shop-row-title">${esc(w.name)}
            <span class="pill">cycle ${w.cycle}</span>
            ${w.title ? `<span class="pill rarity-legendary">${esc(w.title)}</span>` : ''}</div>
          <div class="shop-row-desc">${w.className || 'No path'} · reached character level ${w.charLevel}</div>
          <div class="shop-row-desc" style="font-style:italic">${w.line}</div>
        </div>
        <div style="min-width:190px;text-align:right">
          <div class="muted" style="font-size:11px">contributes ${(w.rate * 100).toFixed(0)}% of a hireling</div>
          <select class="legacy-job" data-act="legacy-assign" data-who="${w.id}" ${w.hurt ? 'disabled' : ''}>
            <option value="idle" ${w.job === 'idle' ? 'selected' : ''}>— resting —</option>
            ${skills.map(s => `<option value="${s}" ${w.jobSkill === s ? 'selected' : ''}>
              ${SKILLS[s].icon} ${SKILLS[s].name}</option>`).join('')}
          </select>
        </div>
      </div>`).join('')}`;
}

// ============================================================
// VISITING SOMEBODY ELSE'S TOWN
//
// Everything rendered here was written by another player. It is escaped
// at every single interpolation without exception — the server validates
// too, but a render boundary that trusts its input is a render boundary
// that is one refactor away from being wrong.
// ============================================================

export function visitPanel() {
  const v = visiting;

  if (v.loading) {
    return `<div class="panel-header"><div class="panel-title">🚪 On the road</div></div>
            <div class="panel-desc">Walking over…</div>`;
  }
  if (!v.town) {
    return `
      <div class="panel-header"><div class="panel-title">🚪 Visiting</div></div>
      <div class="place-back"><button class="btn btn-sm" data-act="nav" data-view="leaderboard">← Back to the boards</button></div>
      <div class="panel-desc">${v.error ? esc(v.error) : 'Pick somebody from the leaderboard to go and see.'}</div>`;
  }

  const t = v.town.snapshot || {};
  const owner = esc(v.town.name || 'Somebody');
  const built = (t.plots || []).filter(p => p.building);

  return `
    <div class="panel-header">
      <div class="panel-title">🚪 ${esc(t.townName || 'Hearthwick')}</div>
      <div class="panel-subtitle">${owner}'s town · cycle ${Number(t.ascensions || 0) + 1}${
        Number(t.era) >= 2 ? ' · unindexed' : ''}</div>
    </div>
    <div class="place-back"><button class="btn btn-sm" data-act="nav" data-view="leaderboard">← Back to the boards</button></div>

    <div class="house-books">
      <div><div class="muted">TOWN LEVEL</div><div class="shop-row-title">${Number(t.townLevel || 0)}</div></div>
      <div><div class="muted">BUILDINGS</div><div class="shop-row-title">${built.length}</div></div>
      <div><div class="muted">HOUSE</div><div class="shop-row-title">${Number(t.home?.level || 1)} rooms</div></div>
      <div><div class="muted">THE HOUSEHOLD</div><div class="shop-row-title">${(t.legacy || []).length}</div></div>
    </div>

    <div class="section-title">🏠 Their house</div>
    ${(t.home?.sets || []).length ? `
      <div class="set-banner">
        ${(t.home.sets || []).map(id => SETS[id]).filter(Boolean)
          .map(s => `<span class="set-chip">${s.icon} <b>${esc(s.name)}</b></span>`).join('')}
      </div>` : '<div class="muted" style="margin-bottom:10px">Nothing finished yet.</div>'}
    ${Object.entries(t.home?.placed || {}).map(([roomId, list]) => {
      const room = ROOMS.find(r => r.id === roomId);
      if (!room || !list.length) return '';
      return `
        <div class="section-title" style="font-size:12px">${room.icon} ${esc(room.name)}</div>
        <div class="home-grid">
          ${list.map(id => getFurniture(id)).filter(Boolean).map(f => `
            <div class="home-slot filled rarity-${f.rarity}">
              <div class="home-slot-icon">${f.icon}</div>
              <div class="home-slot-name">${esc(f.name)}</div>
            </div>`).join('')}
        </div>`;
    }).join('')}

    ${(t.legacy || []).length ? `
      <div class="section-title">🏚️ Who else lives here</div>
      ${(t.legacy || []).map(w => `
        <div class="shop-row">
          <div style="font-size:22px">${esc(w.classIcon || '🎭')}</div>
          <div class="shop-row-info">
            <div class="shop-row-title">${esc(w.name)}
              <span class="pill">cycle ${Number(w.cycle || 0)}</span>
              ${w.title ? `<span class="pill rarity-legendary">${esc(w.title)}</span>` : ''}</div>
            <div class="shop-row-desc">${esc(w.className || 'No path')} · reached character level ${Number(w.charLevel || 0)}</div>
          </div>
        </div>`).join('')}` : ''}

    <div class="section-title">🎁 Leave something</div>
    <div class="muted" style="margin-bottom:8px">One thing per town per day. They will find it next time they are home.</div>
    <div class="bet-row">
      <input id="gift-note" class="bet-input" style="width:280px" type="text" maxlength="140"
             placeholder="A note, if you like" />
      <button class="btn btn-gold" data-act="leave-gift" data-who="${esc(v.town.userId)}">Leave it on the doorstep</button>
    </div>
  `;
}
