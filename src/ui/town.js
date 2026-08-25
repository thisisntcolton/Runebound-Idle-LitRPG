// ============================================================
// TOWN VIEW — the map plus its management panels
// ============================================================
import { state } from '../core/state.js';
import { BUILDING_LIST, getBuilding, BUILDING_UNLOCK_LEVEL, MAX_BUILDING_LEVEL,
         PLOT_POSITIONS, PLOT_W, PLOT_H, plotCost, upgradeCostFor,
         INPUT_CATEGORIES, STAFF_TRAITS, REROLL_COST } from '../data/town.js';
import { getItem } from '../data/items.js';
import { townLevel, plotsAvailable, buildingUnlocked, plotReport, plotStaff,
         unassignedStaff, eligibleStock, canAfford, activeTownBuffs } from '../systems/town.js';
import { grassBackdrop, paths, tree, lamp, signpost, emptyPlot, lockedPlot,
         forSalePlot, buildingArt, staffFigures } from './townart.js';
import { fmt, fmtInt } from '../core/format.js';

export const townUI = { selectedPlot: null, tab: 'build' };

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function costLine(cost) {
  const parts = [`<span class="cost ${state.gold >= cost.gold ? '' : 'unaffordable'}">🪙 ${fmt(cost.gold)}</span>`];
  for (const [id, qty] of Object.entries(cost.items || {})) {
    const item = getItem(id);
    const have = state.inventory[id] || 0;
    parts.push(`<span style="color:${have >= qty ? 'var(--text-dim)' : 'var(--danger)'}">${item?.icon} ${qty} ${item?.name} (${fmt(have)})</span>`);
  }
  return parts.join(' · ');
}

// ---------------- The map ----------------

function plotSvg(index) {
  const plot = state.town.plots[index];
  const pos = PLOT_POSITIONS[index];
  const available = index < plotsAvailable();

  let inner;
  if (!plot.owned) {
    inner = available ? forSalePlot(PLOT_W, PLOT_H) : lockedPlot(PLOT_W, PLOT_H);
  } else if (!plot.building) {
    inner = emptyPlot(PLOT_W, PLOT_H);
  } else {
    const report = plotReport(index);
    const staff = plotStaff(index).length;
    inner = `
      ${buildingArt(plot.building, PLOT_W, PLOT_H)}
      ${staffFigures(staff, PLOT_W, PLOT_H)}
      ${report?.starved ? `
        <g transform="translate(${PLOT_W - 26},18)">
          <circle r="13" fill="#2a1a1a" stroke="var(--danger)" stroke-width="2"/>
          <text y="5" text-anchor="middle" font-size="14">⚠</text>
        </g>` : ''}
      ${!report?.staffed ? `
        <g transform="translate(${PLOT_W - 26},18)">
          <circle r="13" fill="#2a2a1a" stroke="var(--gold)" stroke-width="2"/>
          <text y="5" text-anchor="middle" font-size="13">💤</text>
        </g>` : ''}
      <g transform="translate(8,${PLOT_H - 6})">
        <rect x="0" y="-15" width="44" height="18" rx="9"
              fill="#12182a" opacity="0.9" stroke="var(--border-bright)"/>
        <text x="22" y="-2" text-anchor="middle" font-size="11" font-family="monospace" fill="#d9e2f5">Lv.${plot.level}</text>
      </g>`;
  }

  const selected = townUI.selectedPlot === index;
  return `
    <g class="town-plot ${selected ? 'sel' : ''}" transform="translate(${pos.x},${pos.y})"
       data-act="select-plot" data-plot="${index}" style="cursor:pointer">
      <rect x="-6" y="-6" width="${PLOT_W + 12}" height="${PLOT_H + 12}" rx="14"
            fill="${selected ? 'rgba(77,163,255,0.14)' : 'transparent'}"
            stroke="${selected ? 'var(--sys-blue)' : 'transparent'}" stroke-width="2"/>
      ${inner}
    </g>`;
}

function townMap() {
  return `
    <svg viewBox="0 0 960 620" class="town-svg" preserveAspectRatio="xMidYMid meet">
      ${grassBackdrop()}
      ${paths()}
      ${tree(30, 230, 1.05)} ${tree(930, 210, 0.9)} ${tree(918, 400, 1.1)}
      ${tree(28, 600, 0.95)} ${tree(930, 596, 0.85)} ${tree(276, 604, 0.8)}
      ${lamp(322, 236)} ${lamp(622, 236)} ${lamp(322, 420)} ${lamp(622, 420)}
      ${signpost(480, 34, esc(state.town.name || 'Hearthwick'))}
      ${state.town.plots.map((_, i) => plotSvg(i)).join('')}
    </svg>`;
}

// ---------------- Plot detail ----------------

function buildMenu(index) {
  const cards = BUILDING_LIST.map(def => {
    const unlocked = buildingUnlocked(def.id);
    const afford = canAfford(def.cost);
    const inputs = Object.keys(def.inputs || {}).map(c => INPUT_CATEGORIES[c]?.label).join(' + ') || 'nothing';
    return `
      <div class="card ${unlocked ? '' : 'locked'}">
        <div class="card-title"><span class="card-icon">${def.icon}</span> ${def.name}</div>
        <div class="card-sub">${def.desc}</div>
        <div class="card-sub" style="font-style:italic;opacity:0.7">${def.blurb}</div>
        <div class="card-sub">Consumes: <b>${inputs}</b> · ${def.staffSlots} staff slot${def.staffSlots > 1 ? 's' : ''} · ${(def.cycleMs / 1000).toFixed(0)}s/shift</div>
        <div class="card-sub">${def.buff ? `🏘️ ${def.buff.label}` : ''}</div>
        <div class="card-yield"><span>${costLine(def.cost)}</span></div>
        ${unlocked
          ? `<button class="btn btn-sm ${afford ? 'btn-primary' : ''} btn-block" data-act="build" data-plot="${index}" data-building="${def.id}" ${afford ? '' : 'disabled'}>Build</button>`
          : `<div class="lock-req">Requires town level ${BUILDING_UNLOCK_LEVEL[def.id]}</div>`}
      </div>`;
  }).join('');
  return `<div class="section-title">🏗️ Build on parcel ${index + 1}</div><div class="card-grid">${cards}</div>`;
}

function stockPanel(index, report) {
  const def = report.def;
  const needs = Object.entries(report.needs);
  if (!needs.length) {
    return `<div class="muted">${def.name} needs no materials — it generates on its own.</div>`;
  }
  const rows = needs.map(([cat, need]) => {
    const have = report.stocked[cat];
    const ok = have >= need;
    return `<div class="shop-row">
      <div class="shop-row-info">
        <div class="shop-row-title">${INPUT_CATEGORIES[cat]?.label}</div>
        <div class="shop-row-desc" style="color:${ok ? 'var(--text-dim)' : 'var(--danger)'}">
          ${fmt(have)} in stock · uses ${need} per shift · ${ok ? `${report.cyclesLeft} shifts left` : 'OUT OF STOCK'}</div>
      </div>
    </div>`;
  }).join('');

  const eligible = eligibleStock(def.id);
  const supply = eligible.length ? eligible.map(item => `
    <div class="shop-row">
      <div style="font-size:20px">${item.icon}</div>
      <div class="shop-row-info">
        <div class="shop-row-title ${'rarity-' + item.rarity}">${item.name}</div>
        <div class="shop-row-desc">${fmt(state.inventory[item.id] || 0)} in your bags</div>
      </div>
      <button class="btn btn-sm" data-act="stock" data-plot="${index}" data-item="${item.id}" data-qty="10">+10</button>
      <button class="btn btn-sm btn-primary" data-act="stock" data-plot="${index}" data-item="${item.id}" data-qty="all">All</button>
    </div>`).join('')
    : '<div class="muted">Nothing in your bags fits this business. Go gather some.</div>';

  const held = Object.entries(report.plot.stock || {}).map(([id, qty]) => {
    const item = getItem(id);
    return `<div class="shop-row">
      <div style="font-size:18px">${item?.icon}</div>
      <div class="shop-row-info"><div class="shop-row-title">${item?.name} ×${fmt(qty)}</div></div>
      <button class="btn btn-sm" data-act="withdraw-stock" data-plot="${index}" data-item="${id}">Take back</button>
    </div>`;
  }).join('');

  return `
    ${rows}
    <div class="section-title">📦 Supply from your bags</div>
    ${supply}
    ${held ? `<div class="section-title">🏬 Currently stocked</div>${held}` : ''}`;
}

function staffPanel(index, report) {
  const onSite = plotStaff(index);
  const free = unassignedStaff();
  const rows = onSite.map(s => {
    const t = STAFF_TRAITS[s.trait];
    return `<div class="shop-row">
      <div style="font-size:22px">${s.icon}</div>
      <div class="shop-row-info">
        <div class="shop-row-title">${esc(s.name)} <span class="pill">${t?.icon} ${t?.name}</span></div>
        <div class="shop-row-desc">${t?.desc} · skill ${s.skill}/5 · <span class="cost">🪙 ${s.wage}</span> per shift</div>
      </div>
      <button class="btn btn-sm" data-act="unassign-staff" data-staff="${s.id}">Remove</button>
    </div>`;
  }).join('');

  const available = free.length ? free.map(s => {
    const t = STAFF_TRAITS[s.trait];
    return `<div class="shop-row">
      <div style="font-size:22px">${s.icon}</div>
      <div class="shop-row-info">
        <div class="shop-row-title">${esc(s.name)} <span class="pill">${t?.icon} ${t?.name}</span></div>
        <div class="shop-row-desc">${t?.desc} · skill ${s.skill}/5 · 🪙 ${s.wage}/shift</div>
      </div>
      <button class="btn btn-sm btn-primary" data-act="assign-staff" data-staff="${s.id}" data-plot="${index}">Assign</button>
    </div>`;
  }).join('') : '<div class="muted">Nobody on the bench. Hire from the Town Hall tab.</div>';

  return `
    <div class="muted" style="margin-bottom:10px">${onSite.length} / ${report.def.staffSlots} positions filled.
    An unstaffed building produces nothing at all.</div>
    ${rows || ''}
    <div class="section-title">🪑 Available staff</div>
    ${available}`;
}

function plotDetail(index) {
  const plot = state.town.plots[index];
  if (!plot) return '';

  if (!plot.owned) {
    const available = index < plotsAvailable();
    const cost = plotCost(index);
    return `
      <div class="section-title">🏞️ Parcel ${index + 1}</div>
      ${available
        ? `<div class="card">
             <div class="card-title">For sale</div>
             <div class="card-sub">A patch of good ground. Something could stand here.</div>
             <div class="card-yield"><span>${costLine(cost)}</span></div>
             <button class="btn btn-primary btn-block" data-act="buy-plot" data-plot="${index}" ${canAfford(cost) ? '' : 'disabled'}>Purchase parcel</button>
           </div>`
        : `<div class="card locked"><div class="card-title">Not for sale yet</div>
             <div class="card-sub">Hearthwick must grow first — reach town level ${(index) * 2} to open this parcel.</div></div>`}`;
  }

  if (!plot.building) return buildMenu(index);

  const report = plotReport(index);
  const def = report.def;
  const upCost = plot.level < MAX_BUILDING_LEVEL ? upgradeCostFor(def, plot.level) : null;
  const tabs = [['build', '📊 Overview'], ['stock', '📦 Stock'], ['staff', '👥 Staff']];

  return `
    <div class="section-title">${def.icon} ${def.name} <span class="pill">Lv.${plot.level}</span></div>
    <div class="shop-row" style="border-color:var(--border-bright);gap:20px;flex-wrap:wrap">
      <div><div class="muted">REVENUE / SHIFT</div><div class="shop-row-title yield-gold">🪙 ${fmt(Math.round(report.revenuePerCycle))}</div></div>
      <div><div class="muted">WAGES / SHIFT</div><div class="shop-row-title" style="color:var(--danger)">🪙 ${fmt(report.wagePerCycle)}</div></div>
      <div><div class="muted">PROFIT / SHIFT</div><div class="shop-row-title" style="color:${report.profitPerCycle >= 0 ? 'var(--xp)' : 'var(--danger)'}">🪙 ${fmt(Math.round(report.profitPerCycle))}</div></div>
      <div><div class="muted">PER MINUTE</div><div class="shop-row-title">🪙 ${fmt(Math.round(report.profitPerMin))}</div></div>
      <div><div class="muted">SHIFT LENGTH</div><div class="shop-row-title">${(report.cycleMs / 1000).toFixed(0)}s</div></div>
      <div><div class="muted">STAFF</div><div class="shop-row-title">${report.mods.count}/${def.staffSlots}</div></div>
    </div>
    ${!report.staffed ? '<div class="stat-points-banner" style="border-color:var(--gold);color:var(--gold)">💤 No staff assigned — this building is idle.</div>' : ''}
    ${report.starved ? '<div class="stat-points-banner" style="border-color:var(--danger);color:var(--danger)">⚠ Out of materials — stock it or it stops earning.</div>' : ''}
    ${report.profitPerCycle < 0 && report.staffed ? '<div class="stat-points-banner" style="border-color:var(--danger);color:var(--danger)">📉 Wages exceed revenue. Upgrade the building or hire cheaper staff.</div>' : ''}

    <div style="display:flex;gap:8px;margin:14px 0">
      ${tabs.map(([id, label]) => `<button class="btn btn-sm ${townUI.tab === id ? 'btn-primary' : ''}" data-act="town-tab" data-tab="${id}">${label}</button>`).join('')}
    </div>

    ${townUI.tab === 'stock' ? stockPanel(index, report)
      : townUI.tab === 'staff' ? staffPanel(index, report)
      : `
        <div class="panel-desc">${def.blurb}</div>
        ${def.buff ? `<div class="card"><div class="card-title">🏘️ Town bonus</div>
          <div class="card-sub">${def.buff.label} — currently <b>+${Math.round(def.buff.value * plot.level * 100)}%</b> while staffed.</div></div>` : ''}
        ${upCost ? `
          <div class="shop-row">
            <div class="shop-row-info">
              <div class="shop-row-title">Upgrade to level ${plot.level + 1}</div>
              <div class="shop-row-desc">Revenue ×${(1 + plot.level * 0.6).toFixed(1)} · consumes more materials · ${costLine(upCost)}</div>
            </div>
            <button class="btn btn-sm ${canAfford(upCost) ? 'btn-gold' : ''}" data-act="upgrade-building" data-plot="${index}" ${canAfford(upCost) ? '' : 'disabled'}>Upgrade</button>
          </div>` : '<div class="muted">Fully upgraded.</div>'}
        <button class="btn btn-sm btn-danger" style="margin-top:12px" data-act="demolish" data-plot="${index}">Demolish</button>`}
  `;
}

// ---------------- Town hall (hiring) ----------------

function townHall() {
  const apps = state.town.applicants || [];
  const rows = apps.map(a => {
    const t = STAFF_TRAITS[a.trait];
    const fee = a.wage * 5;
    return `<div class="card">
      <div class="card-title"><span class="card-icon">${a.icon}</span> ${esc(a.name)}</div>
      <div class="card-sub"><span class="pill">${t?.icon} ${t?.name}</span> ${t?.desc}</div>
      <div class="card-sub">Skill ${a.skill}/5 · wage <span class="cost">🪙 ${a.wage}</span> per shift</div>
      <div class="card-yield"><span>Signing fee <span class="cost">🪙 ${fmt(fee)}</span></span></div>
      <button class="btn btn-sm btn-primary btn-block" data-act="hire" data-applicant="${a.id}" ${state.gold >= fee ? '' : 'disabled'}>Hire</button>
    </div>`;
  }).join('');

  const payroll = Object.values(state.town.staff);
  const payrollRows = payroll.length ? payroll.map(s => {
    const t = STAFF_TRAITS[s.trait];
    const where = s.assigned !== null && s.assigned !== undefined
      ? getBuilding(state.town.plots[s.assigned]?.building)?.name || 'unassigned'
      : 'on the bench';
    return `<div class="shop-row">
      <div style="font-size:22px">${s.icon}</div>
      <div class="shop-row-info">
        <div class="shop-row-title">${esc(s.name)} <span class="pill">${t?.icon} ${t?.name}</span></div>
        <div class="shop-row-desc">${where} · 🪙 ${s.wage}/shift · skill ${s.skill}/5</div>
      </div>
      <button class="btn btn-sm btn-danger" data-act="fire" data-staff="${s.id}">Dismiss</button>
    </div>`;
  }).join('') : '<div class="muted">Nobody on the payroll yet.</div>';

  return `
    <div class="section-title">🏛️ Town Hall — applicants</div>
    <div class="panel-desc">Hiring costs a signing fee up front; after that each completed shift pays their wage from your gold.
    A business with no staff produces nothing.</div>
    <div class="card-grid">${rows || '<div class="muted">No applicants right now.</div>'}</div>
    <button class="btn btn-sm" style="margin-top:12px" data-act="reroll-applicants" ${state.gold >= REROLL_COST ? '' : 'disabled'}>
      🔄 Post new notices (🪙 ${fmt(REROLL_COST)})
    </button>
    <div class="section-title">💼 Payroll</div>
    ${payrollRows}`;
}

// ---------------- Main panel ----------------

export function townPanel() {
  const t = state.town;
  const lvl = townLevel();
  const owned = t.plots.filter(p => p.owned).length;
  const built = t.plots.filter(p => p.building).length;
  const staffed = Object.keys(t.staff).length;
  const buffs = activeTownBuffs();

  if (!t.unlocked) {
    const cost = plotCost(0);
    return `
      <div class="panel-header">
        <div class="panel-title">🏘️ Hearthwick</div>
        <div class="panel-subtitle">unclaimed</div>
      </div>
      <div class="panel-desc">There's a crossroads a half-day east of the meadow with good ground and nobody on it.
      Buy a parcel and you could put something there — a stall, a kitchen, a forge. Somewhere the logs you've been
      hauling might finally mean something.<br><br>
      <i style="color:var(--sys-blue)">[ SYSTEM ] Land ownership is not a recognised adventurer activity. Proceed anyway?</i></div>
      <div class="town-map-wrap">${townMap()}</div>
      <div class="card" style="max-width:520px;margin-top:16px">
        <div class="card-title">🏞️ Buy your first parcel</div>
        <div class="card-sub">Everything starts here.</div>
        <div class="card-yield"><span>${costLine(cost)}</span></div>
        <button class="btn btn-primary btn-block" data-act="buy-plot" data-plot="0" ${canAfford(cost) ? '' : 'disabled'}>Purchase</button>
      </div>`;
  }

  return `
    <div class="panel-header">
      <div class="panel-title">🏘️ ${esc(t.name)}</div>
      <div class="panel-subtitle">Town level ${lvl} · ${built} businesses · ${staffed} on payroll</div>
    </div>
    <div class="shop-row" style="border-color:var(--border-bright);gap:22px;flex-wrap:wrap">
      <div><div class="muted">PARCELS</div><div class="shop-row-title">${owned}/${plotsAvailable()}</div></div>
      <div><div class="muted">LIFETIME REVENUE</div><div class="shop-row-title yield-gold">🪙 ${fmt(t.lifetimeRevenue || 0)}</div></div>
      <div><div class="muted">SHIFTS WORKED</div><div class="shop-row-title">${fmtInt(t.cycles || 0)}</div></div>
      ${buffs.map(b => `<div><div class="muted">${b.label.replace(/ per level$/, '')}</div>
        <div class="shop-row-title" style="color:var(--xp)">+${Math.round(b.total * 100) / (b.key === 'offline_hours' ? 100 : 1)}${b.key === 'offline_hours' ? 'h' : '%'}</div></div>`).join('')}
    </div>
    <div class="town-map-wrap">${townMap()}</div>
    <div class="muted" style="margin:10px 0">Click a parcel on the map to manage it.</div>
    ${townUI.selectedPlot !== null ? plotDetail(townUI.selectedPlot) : ''}
    ${townHall()}
  `;
}
