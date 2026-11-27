import { buildLabel } from '../core/build.js';
import { levelForXp } from '../core/xp.js';
import { fmt } from '../core/format.js';

const buildEl = document.getElementById('hub-build');
if (buildEl) buildEl.textContent = buildLabel();

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function timeAgo(ts) {
  if (!ts) return 'Never';
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function summarizeRunebound() {
  const s = readJson('runebound-save-v1');
  if (!s || !s.skills) return null;
  let totalLevel = 0;
  for (const k of Object.keys(s.skills)) {
    totalLevel += levelForXp(s.skills[k]?.xp || 0);
  }
  return {
    hero: s.look?.name || 'Adventurer',
    totalLevel,
    gold: fmt(Math.floor(s.gold || 0)),
    shards: fmt(Math.floor(s.shards || 0)),
    lastSeen: timeAgo(s.lastSeen),
  };
}

function summarizeLifesim() {
  const s = readJson('lifesim-save-v1');
  if (!s || !s.character) return null;
  const c = s.character;
  return {
    name: `${c.firstName} ${c.lastName}`,
    ageStage: c.alive ? `Age ${c.age} (${c.stage})` : `Passed at ${c.age}`,
    generation: `Gen ${s.dynasty?.generation || 1}`,
    money: `$${Number(c.money || 0).toLocaleString()}`,
    lastSeen: timeAgo(s.lastSeen),
  };
}

function renderCards() {
  const rb = summarizeRunebound();
  const ls = summarizeLifesim();
  const orc = readJson('orc-village-v1');
  const grid = document.getElementById('hub-grid');

  grid.innerHTML = `
    <article class="game-card rb">
      <div class="card-top">
        <div class="card-title-group">
          <span class="card-icon">⚔️</span>
          <div>
            <div class="card-title">Runebound</div>
            <div class="card-sub">Idle LitRPG</div>
          </div>
        </div>
        <span class="card-badge live">v2.0</span>
      </div>
      <p class="card-desc">
        Skills, combat, gear, classes, a town to build, pets to raise, a codex that remembers, and a cycle waiting to be broken.
      </p>
      <div class="save-box">
        ${rb ? `
          <div><div class="save-stat-label">Character</div><div class="save-stat-val">${escapeHtml(rb.hero)}</div></div>
          <div><div class="save-stat-label">Total Level</div><div class="save-stat-val">${rb.totalLevel}</div></div>
          <div><div class="save-stat-label">Gold / Shards</div><div class="save-stat-val">🪙 ${rb.gold} · 💠 ${rb.shards}</div></div>
          <div><div class="save-stat-label">Last Played</div><div class="save-stat-val">${rb.lastSeen}</div></div>
        ` : `
          <div style="grid-column: 1 / -1; color: var(--text-dim);">No local save yet — start a fresh adventure.</div>
        `}
      </div>
      <a class="card-btn rb-btn" href="./runebound.html">${rb ? 'Continue Runebound →' : 'Play Runebound →'}</a>
    </article>

    <article class="game-card ls">
      <div class="card-top">
        <div class="card-title-group">
          <span class="card-icon">🌳</span>
          <div>
            <div class="card-title">Lineage</div>
            <div class="card-sub">Generational Life Sim</div>
          </div>
        </div>
        <span class="card-badge new">Phase 1 MVP</span>
      </div>
      <p class="card-desc">
        Guide a character year-by-year from birth to death, weigh tough life choices, and carry your family story forward across generations.
      </p>
      <div class="save-box">
        ${ls ? `
          <div><div class="save-stat-label">Current Life</div><div class="save-stat-val">${escapeHtml(ls.name)}</div></div>
          <div><div class="save-stat-label">Status</div><div class="save-stat-val">${escapeHtml(ls.ageStage)}</div></div>
          <div><div class="save-stat-label">Dynasty / Cash</div><div class="save-stat-val">${ls.generation} · ${ls.money}</div></div>
          <div><div class="save-stat-label">Last Played</div><div class="save-stat-val">${ls.lastSeen}</div></div>
        ` : `
          <div style="grid-column: 1 / -1; color: var(--text-dim);">No family tree started yet — begin Generation 1.</div>
        `}
      </div>
      <a class="card-btn ls-btn" href="./lifesim.html">${ls ? 'Continue Lineage →' : 'Start a Life →'}</a>
    </article>

    <article class="game-card">
      <div class="card-top"><div class="card-title-group"><span class="card-icon">🏰</span><div><div class="card-title">Adventurer’s Guild</div><div class="card-sub">Guild Management RPG</div></div></div><span class="card-badge new">v0.1</span></div>
      <p class="card-desc">Recruit heroes, guide their decisions through branching adventures, and resolve tactical battles.</p>
      <div class="save-box">${readJson('adventurersguild-save-v1') ? 'Local guild save available.' : 'Found your guild and begin your first contract.'}</div>
      <a class="card-btn rb-btn" href="./adventurersguild.html">Enter the Guild →</a>
    </article>
    <article class="game-card ls">
      <div class="card-top"><div class="card-title-group"><span class="card-icon">🪓</span><div><div class="card-title">Orc Village</div><div class="card-sub">Pixel-art Gathering RPG</div></div></div><span class="card-badge new">Game 4 · v1.0</span></div>
      <p class="card-desc">Guide Gruk, chop trees, stockpile wood and upgrade your axe in a peaceful Orc settlement.</p>
      <div class="save-box">${orc?.version === 1 && [1,2,3].includes(orc.axeLevel) ? `Axe level ${orc.axeLevel} · Camp wood ${escapeHtml(orc.storage)}` : 'Start a new settlement. Progress saves locally.'}</div>
      <a class="card-btn ls-btn" href="./orcvillage.html">${orc?.version === 1 ? 'Continue Orc Village' : 'Play Orc Village'} →</a>
    </article>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function checkAccount() {
  const el = document.getElementById('hub-account');
  try {
    const res = await fetch('/api/me', { credentials: 'same-origin' });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error('local');
    const data = await res.json();
    if (data.user) {
      el.innerHTML = `${data.user.avatar ? `<img src="${escapeHtml(data.user.avatar)}" alt="" />` : '🟢'} <span>Signed in as <b>${escapeHtml(data.user.name)}</b></span>`;
    } else {
      el.textContent = '⚪ Local Mode (Sign in inside Runebound Settings)';
    }
  } catch {
    el.textContent = '💾 Offline / Local Save Mode';
  }
}

renderCards();
checkAccount();
