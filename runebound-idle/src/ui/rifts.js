// ============================================================
// RIFTS PANEL — dungeon selection + run status
// ============================================================
import { state, combatLevel } from '../core/state.js';
import { DUNGEONS, totalWaves, getDungeon } from '../data/dungeons.js';
import { getItem } from '../data/items.js';
import { fmt } from '../core/format.js';
import { pendingRift, activeRun, UNSTABLE } from '../systems/unstable.js';

function unstableBlock() {
  const offer = pendingRift();
  const run = activeRun();

  if (run) {
    const secs = Math.max(0, Math.ceil(run.remaining / 1000));
    const pct = (run.waves / UNSTABLE.SEAL_WAVES) * 100;
    const timePct = (run.remaining / UNSTABLE.DURATION_MS) * 100;
    return `
      <div class="card unstable-card" style="border-color:var(--danger);margin-bottom:18px">
        <div class="card-title"><span class="card-icon">🌋</span> INCURSION IN PROGRESS
          <span class="pill" style="color:var(--danger);border-color:var(--danger)">${secs}s left</span></div>
        <div class="card-sub">Seal the tear by clearing ${UNSTABLE.SEAL_WAVES} waves. If the clock beats you, whatever is left comes through.</div>
        <div class="muted" style="margin-top:8px">Waves sealed: <b>${run.waves} / ${UNSTABLE.SEAL_WAVES}</b></div>
        <div class="action-bar-outer"><div class="action-bar-inner" style="width:${pct}%;background:linear-gradient(90deg,#2e9e55,var(--xp))"></div></div>
        <div class="muted" style="margin-top:8px">Time remaining</div>
        <div class="action-bar-outer"><div class="action-bar-inner" id="unstable-timer" style="width:${timePct}%;background:linear-gradient(90deg,#a13037,var(--danger))"></div></div>
        <button class="btn btn-danger btn-sm btn-block" data-act="flee-unstable">🏳️ Abandon (the rift floods)</button>
      </div>`;
  }

  if (offer) {
    const left = Math.max(0, Math.ceil((offer.expiresAt - Date.now()) / 1000));
    const mins = Math.floor(left / 60), secs = left % 60;
    return `
      <div class="card unstable-card" style="border-color:var(--gold);margin-bottom:18px">
        <div class="card-title"><span class="card-icon">⚠️</span> UNSTABLE RIFT
          <span class="pill" style="color:var(--gold);border-color:var(--gold)">closes in ${mins}:${String(secs).padStart(2, '0')}</span></div>
        <div class="card-sub">There is ${offer.name}, and things are coming out of it.
        Three minutes inside, waves that never stop getting worse, and ${UNSTABLE.SEAL_WAVES} of them to seal it.</div>
        <div class="card-sub" style="color:var(--xp)">✅ Seal it: heavy gold, runes, and a real chance at an ability tome.</div>
        <div class="card-sub" style="color:var(--danger)">💥 Fail it: the rift floods and the overflow goes straight for Hearthwick.</div>
        <button class="btn btn-danger btn-block" data-act="enter-unstable">🌋 Answer the rift</button>
      </div>`;
  }

  const u = state.unstable;
  if (combatLevel() < UNSTABLE.MIN_COMBAT_LEVEL) {
    return `<div class="muted" style="margin-bottom:16px">⚠ Unstable rifts start appearing at Combat Lv. ${UNSTABLE.MIN_COMBAT_LEVEL}.</div>`;
  }
  const wait = u.nextAt ? Math.max(0, u.nextAt - Date.now()) : 0;
  return `<div class="muted" style="margin-bottom:16px">
    ⚠ No tears open right now. The System insists this is normal.
    ${wait > 0 ? `<span class="muted">(the seams are quiet for another ~${Math.ceil(wait / 60000)} min)</span>` : ''}
  </div>`;
}

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
    ${unstableBlock()}
    ${cards}
  `;
}
