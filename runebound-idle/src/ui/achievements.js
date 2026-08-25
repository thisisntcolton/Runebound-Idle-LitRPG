// ============================================================
// ACHIEVEMENTS PANEL — grid of deeds, done and undone
// ============================================================
import { state } from '../core/state.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { achievementProgress } from '../systems/achievements.js';

export function achievementsPanel() {
  const { done, total } = achievementProgress();

  const cards = ACHIEVEMENTS.map(a => {
    const unlocked = !!state.achievements[a.id];
    const when = unlocked ? new Date(state.achievements[a.id]).toLocaleDateString() : null;
    return `
      <div class="card ${unlocked ? '' : 'locked'}">
        <div class="card-title"><span class="card-icon">${a.icon}</span> ${a.name}</div>
        <div class="card-sub">${a.desc}</div>
        <div class="card-yield">
          <span>${unlocked ? `✅ ${when}` : '🔒 Locked'}</span>
          ${a.title ? `<span class="${unlocked ? 'rarity-legendary' : 'muted'}">Title: "${a.title}"</span>` : ''}
        </div>
      </div>`;
  }).join('');

  return `
    <div class="panel-header">
      <div class="panel-title">🏅 Achievements</div>
      <div class="panel-subtitle">${done} / ${total} · titles equip on the Character Sheet</div>
    </div>
    <div class="panel-desc">The System keeps a ledger of everything you've done. It always did — these are just the entries it's willing to show you.</div>
    <div class="card-grid">${cards}</div>
  `;
}
