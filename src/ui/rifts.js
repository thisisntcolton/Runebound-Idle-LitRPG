// ============================================================
// RIFTS PANEL — dungeon selection + run status
// ============================================================
import { state, combatLevel } from '../core/state.js';
import { DUNGEONS, totalWaves, getDungeon } from '../data/dungeons.js';
import { getItem } from '../data/items.js';
import { fmt } from '../core/format.js';

export function riftsPanel() {
  const cl = combatLevel();
  const c = state.combat;
  const inRift = state.activity?.type === 'combat' && c.dungeonId;

  const cards = DUNGEONS.map(d => {
    const unlocked = cl >= d.level;
    const running = inRift && c.dungeonId === d.id;
    const clears = state.stats.dungeonClears?.[d.id] || 0;
    const runeList = Object.keys(d.rewards.runes || {})
      .map(id => `${getItem(id)?.icon} ${getItem(id)?.name}`).join(' · ');
    const uniqueList = (d.rewards.uniques || [])
      .map(u => `<span class="rarity-${getItem(u.item)?.rarity}">${getItem(u.item)?.icon} ${getItem(u.item)?.name}</span>`)
      .join(' · ');

    return `
      <div class="card ${unlocked ? '' : 'locked'} ${running ? 'active-card' : ''}" style="margin-bottom:14px">
        <div class="card-title"><span class="card-icon">${d.icon}</span> ${d.name}
          ${clears > 0 ? `<span class="pill">cleared ×${fmt(clears)}</span>` : ''}
          ${running ? `<span class="pill" style="color:var(--xp);border-color:var(--xp)">WAVE ${(c.wave || 0) + 1}/${totalWaves(d)}</span>` : ''}
        </div>
        <div class="card-sub">${unlocked ? '' : `<span class="lock-req">Requires Combat Lv. ${d.level} — </span>`}${d.desc}</div>
        <div class="card-sub">
          ${totalWaves(d)} waves ending in <b>${d.boss.icon} ${d.boss.name}</b> ·
          Chest: 🪙 ${fmt(d.rewards.gold[0])}–${fmt(d.rewards.gold[1])} · ${runeList}
        </div>
        ${uniqueList ? `<div class="card-sub">Rift treasure: ${uniqueList}</div>` : ''}
        ${unlocked ? (running
          ? '<button class="btn btn-danger btn-sm btn-block" data-act="stop-combat">🏳️ Abandon run</button>'
          : `<button class="btn btn-primary btn-sm btn-block" data-act="enter-rift" data-dungeon="${d.id}">🌀 Enter the Rift</button>`)
          : ''}
      </div>`;
  }).join('');

  return `
    <div class="panel-header">
      <div class="panel-title">🌀 Rifts</div>
      <div class="panel-subtitle">Combat Lv. ${cl} · ${fmt(state.stats.dungeonRuns || 0)} total clears</div>
    </div>
    <div class="panel-desc">Seams in the world where the loop wears thin. Fight through every wave and the thing at the bottom —
    the chest at the end holds <b>runes</b>, the only fuel for enchanting gear. Death ends the run and keeps the chest.
    Runs auto-repeat until you leave. Bring food.</div>
    ${cards}
  `;
}
