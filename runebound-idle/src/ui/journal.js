// ============================================================
// JOURNAL PANEL — quests, bounties, lore archive
// ============================================================
import { state } from '../core/state.js';
import { MAIN_QUESTS, SIDE_QUESTS, BOUNTIES } from '../data/quests.js';
import { FRAGMENTS } from '../data/lore.js';
import { ZONES, getZone } from '../data/monsters.js';
import { getItem } from '../data/items.js';
import { activeMainQuest, activeSideQuests, questProgress, bountyState } from '../systems/quests.js';
import { fmt } from '../core/format.js';
import { combatLevel } from '../core/state.js';

function rewardLine(r) {
  if (!r) return '';
  const parts = [];
  if (r.gold) parts.push(`<span class="yield-gold">🪙 ${fmt(r.gold)}</span>`);
  if (r.shards) parts.push(`<span style="color:var(--shard)">💠 ${r.shards}</span>`);
  if (r.items) for (const [id, qty] of Object.entries(r.items)) {
    const item = getItem(id);
    parts.push(`${item?.icon || ''} ${item?.name} ×${qty}`);
  }
  return parts.join(' · ');
}

function questCard(q, { spotlight = false } = {}) {
  const { cur, max } = questProgress(q);
  const pct = Math.min(100, cur / max * 100);
  return `
    <div class="card" style="${spotlight ? 'border-color: var(--sys-blue); box-shadow: 0 0 18px rgba(77,163,255,0.12);' : ''} margin-bottom:12px">
      <div class="card-title">📜 ${q.name} ${spotlight ? '<span class="pill" style="color:var(--sys-blue);border-color:var(--sys-blue)">MAIN</span>' : ''}</div>
      <div class="card-sub">${q.giver} — ${q.brief}</div>
      <div class="action-bar-outer"><div class="action-bar-inner" style="width:${pct}%"></div></div>
      <div class="card-yield">
        <span>${cur} / ${max}</span>
        <span>${rewardLine(q.reward)}</span>
      </div>
    </div>`;
}

export function journalPanel() {
  const main = activeMainQuest();
  const sides = activeSideQuests();
  const completedCount = Object.keys(state.quests.completed).length;
  const totalQuests = MAIN_QUESTS.length + SIDE_QUESTS.length;
  const cl = combatLevel();

  // Cycle banner
  const cycleNum = state.ascensions + 1;
  let cycleBanner;
  if (state.ending === 'broken') {
    cycleBanner = `<div class="stat-points-banner" style="border-color:var(--gold);color:var(--gold)">⛓️ CYCLEBREAKER — the loop is open. The grind is yours by choice now. All yields +10%.</div>`;
  } else if (state.ascensions > 0) {
    cycleBanner = `<div class="stat-points-banner">◈ CYCLE ${cycleNum} — the world has wound back ${state.ascensions} time${state.ascensions > 1 ? 's' : ''}. You remember. It doesn't know that yet.</div>`;
  } else {
    cycleBanner = `<div class="muted" style="margin-bottom:12px">The System calls this "your adventure." The word it uses internally is different.</div>`;
  }

  // Main quest block
  const mainBlock = main
    ? questCard(main, { spotlight: true })
    : `<div class="card" style="margin-bottom:12px"><div class="card-title">✅ The chain is complete… for this Cycle.</div>
       <div class="card-sub">${state.ascensions >= 4 ? 'The Spire remembers your choice.' : 'The Spire waits. Ascension is how the story continues.'}</div></div>`;

  // Side quests
  const sideBlock = sides.length
    ? sides.map(q => questCard(q)).join('')
    : `<div class="muted">Hire more hirelings — each of them is carrying a loose thread of this world.</div>`;

  // Bounties (only unlocked zones)
  const bountyRows = BOUNTIES.filter(b => {
    const zone = getZone(b.zone);
    return zone && cl >= zone.level;
  }).map(b => {
    const zone = getZone(b.zone);
    const bs = bountyState(b.zone);
    const pct = bs.kills / b.count * 100;
    return `
      <div class="shop-row">
        <div style="font-size:20px">${zone.icon}</div>
        <div class="shop-row-info">
          <div class="shop-row-title">Cull: ${zone.name} ${bs.claimed > 0 ? `<span class="pill">×${bs.claimed}</span>` : ''}</div>
          <div class="action-bar-outer" style="margin:6px 0 2px"><div class="action-bar-inner" style="width:${pct}%"></div></div>
          <div class="shop-row-desc">${bs.kills} / ${b.count} kills — repeatable</div>
        </div>
        <div class="cost">🪙 ${fmt(b.gold)}</div>
      </div>`;
  }).join('');

  // Lore archive
  const unlockedFrags = Object.keys(FRAGMENTS).filter(id => state.loreSeen[id]);
  const loreBlock = unlockedFrags.length
    ? unlockedFrags.map(id => `
        <div class="shop-row" style="cursor:pointer" data-act="read-lore" data-id="${id}">
          <div style="font-size:18px">◈</div>
          <div class="shop-row-info"><div class="shop-row-title" style="color:var(--sys-blue)">${FRAGMENTS[id].title}</div></div>
          <span class="muted">read</span>
        </div>`).join('')
    : `<div class="muted">No fragments recovered yet. The world is holding its secrets. Keep grinding — secrets erode.</div>`;

  return `
    <div class="panel-header">
      <div class="panel-title">🗺️ Journal</div>
      <div class="panel-subtitle">${completedCount} / ${totalQuests} quests · ${unlockedFrags.length} / ${Object.keys(FRAGMENTS).length} fragments</div>
    </div>
    ${cycleBanner}
    <div class="section-title">◈ Main Quest</div>
    ${mainBlock}
    <div class="section-title">🧵 Side Quests</div>
    ${sideBlock}
    <div class="section-title">🎯 Bounties</div>
    ${bountyRows || '<div class="muted">Unlock more zones to post bounties.</div>'}
    <div class="section-title">📖 Lore Archive</div>
    ${loreBlock}
  `;
}
