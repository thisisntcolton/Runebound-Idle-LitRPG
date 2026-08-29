// ============================================================
// LEADERBOARD PANEL — global rankings from the API
// ============================================================
import { cloud, fetchLeaderboard } from '../core/cloud.js';
import { fmt, fmtInt } from '../core/format.js';

export const lbState = {
  board: 'total_level',
  data: null,
  loading: false,
  error: null,
};

const BOARD_TABS = [
  { key: 'total_level',   label: 'Total Level',   icon: '📊' },
  { key: 'shards',        label: 'Fate Shards',   icon: '💠' },
  { key: 'lifetime_gold', label: 'Lifetime Gold', icon: '🪙' },
  { key: 'boss_kills',    label: 'Boss Kills',    icon: '👑' },
  { key: 'cyclebreakers', label: 'Cyclebreakers', icon: '⛓️' },
];

export async function loadLeaderboard(board, onDone) {
  lbState.board = board || lbState.board;
  lbState.loading = true;
  lbState.error = null;
  try {
    lbState.data = await fetchLeaderboard(lbState.board);
  } catch (err) {
    lbState.error = err.noBackend ? 'no_backend' : err.message;
    lbState.data = null;
  } finally {
    lbState.loading = false;
    onDone?.();
  }
}

function medal(rank) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
}

function primaryStat(entry, board) {
  switch (board) {
    case 'shards':        return `💠 ${fmtInt(entry.shards)}`;
    case 'lifetime_gold': return `🪙 ${fmt(entry.lifetimeGold)}`;
    case 'boss_kills':    return `👑 ${fmtInt(entry.bossKills)}`;
    case 'cyclebreakers': return `⛓️ ${fmtInt(entry.ascensions)} cycles`;
    default:              return `📊 ${fmtInt(entry.totalLevel)}`;
  }
}

function row(entry, board) {
  const avatar = entry.avatar
    ? `<img src="${entry.avatar}" alt="" width="28" height="28" style="border-radius:50%;border:1px solid var(--border)">`
    : '<div style="font-size:20px">🧙</div>';
  return `
    <div class="shop-row" style="${entry.you ? 'border-color:var(--sys-blue);background:rgba(77,163,255,0.07)' : ''}">
      <div style="width:38px;font-family:var(--font-mono);font-weight:800;color:var(--text-dim)">${medal(entry.rank)}</div>
      ${avatar}
      <div class="shop-row-info">
        <div class="shop-row-title">
          ${escapeHtml(entry.name)}
          ${entry.title ? `<span class="rarity-legendary" style="font-size:12px">"${escapeHtml(entry.title)}"</span>` : ''}
          ${entry.you ? '<span class="pill" style="color:var(--sys-blue);border-color:var(--sys-blue)">YOU</span>' : ''}
          ${entry.cyclebreaker && board !== 'cyclebreakers' ? '<span class="pill" style="color:var(--gold);border-color:var(--gold)">⛓️ CYCLEBREAKER</span>' : ''}
        </div>
        <div class="shop-row-desc">
          ⚔️ Cb.${entry.combatLevel} · 📊 ${fmtInt(entry.totalLevel)} · 💠 ${fmtInt(entry.shards)} · 📜 ${entry.questsDone} quests
        </div>
      </div>
      <div class="shop-row-level" style="font-size:14px">${primaryStat(entry, board)}</div>
      ${entry.you || !entry.userId ? '' :
        `<button class="btn btn-sm" data-act="visit-town" data-who="${escapeHtml(entry.userId)}"
                 title="Go and see their Hearthwick">🚪 Visit</button>`}
    </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function leaderboardPanel() {
  const tabs = BOARD_TABS.map(t => `
    <button class="btn btn-sm ${lbState.board === t.key ? 'btn-primary' : ''}" data-act="lb-board" data-board="${t.key}">
      ${t.icon} ${t.label}
    </button>`).join(' ');

  let body;
  if (cloud.status === 'unavailable') {
    body = `<div class="card"><div class="card-title">☁️ Leaderboards are offline</div>
      <div class="card-sub">No backend is reachable. Run <code>vercel dev</code> locally, or deploy to Vercel with a database connected, to see global rankings.</div></div>`;
  } else if (lbState.loading) {
    body = '<div class="muted">Consulting the System records…</div>';
  } else if (lbState.error === 'no_backend') {
    body = `<div class="card"><div class="card-title">☁️ Leaderboards are offline</div>
      <div class="card-sub">This build has no API attached.</div></div>`;
  } else if (lbState.error) {
    body = `<div class="card"><div class="card-title">⚠ Couldn't load rankings</div>
      <div class="card-sub">${escapeHtml(lbState.error)}</div>
      <button class="btn btn-sm btn-block" data-act="lb-board" data-board="${lbState.board}">Retry</button></div>`;
  } else if (!lbState.data?.entries?.length) {
    body = `<div class="card"><div class="card-title">Nobody has been recorded yet</div>
      <div class="card-sub">Sign in and sync, and you'll be the first name in the System's ledger.</div></div>`;
  } else {
    const rows = lbState.data.entries.map(e => row(e, lbState.board)).join('');
    const selfOutside = lbState.data.self && !lbState.data.entries.some(e => e.you);
    body = rows + (selfOutside
      ? `<div class="section-title">Your standing</div>${row(lbState.data.self, lbState.board)}`
      : '');
  }

  const signInNudge = cloud.status !== 'signed-out' ? ''
    : cloud.providers.length
      ? `<div class="stat-points-banner">◈ Sign in from Settings to appear on the leaderboards and sync across devices.</div>`
      : `<div class="stat-points-banner">◈ Rankings are readable, but this deployment has no sign-in provider configured — so no one can post a score yet.</div>`;

  return `
    <div class="panel-header">
      <div class="panel-title">🏆 Leaderboards</div>
      <div class="panel-subtitle">${lbState.data?.label || ''}</div>
    </div>
    <div class="panel-desc">The System keeps records. It always kept records — that was rather the point.</div>
    ${signInNudge}
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px">${tabs}</div>
    ${body}
  `;
}
