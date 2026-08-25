// ============================================================
// SYSTEM LOG + LITRPG POPUPS
// ============================================================
import { on } from '../core/events.js';
import { state } from '../core/state.js';
import { SKILLS } from '../data/skills.js';
import { getItem } from '../data/items.js';

const MAX_LOG = 60;

function logEl() { return document.getElementById('system-log-messages'); }

export function pushLog(type, text) {
  state.log.unshift({ t: Date.now(), type, text });
  if (state.log.length > MAX_LOG) state.log.length = MAX_LOG;
  renderLog();
}

export function renderLog() {
  const el = logEl();
  if (!el) return;
  el.innerHTML = state.log.map(m => {
    const time = new Date(m.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cls = { sys: 'log-sys', xp: 'log-xp', gold: 'log-gold', combat: 'log-combat', loot: 'log-loot' }[m.type] || '';
    return `<div class="log-msg"><span class="log-time">${time}</span><span class="${cls}">${m.text}</span></div>`;
  }).join('');
}

export function popup(tag, body, { gold = false, ttl = 3.2 } = {}) {
  const container = document.getElementById('popup-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'sys-popup' + (gold ? ' gold-popup' : '');
  div.style.setProperty('--ttl', ttl + 's');
  div.innerHTML = `<div class="sys-popup-tag">◈ ${tag} ◈</div><div class="sys-popup-body">${body}</div>`;
  container.appendChild(div);
  setTimeout(() => div.remove(), (ttl + 0.5) * 1000);
  while (container.children.length > 4) container.firstChild.remove();
}

export function initNotifications() {
  renderLog();

  on('notify', ({ type, text }) => pushLog(type, text));

  on('level-up', ({ skillId, level }) => {
    const skill = SKILLS[skillId];
    pushLog('xp', `[ LEVEL UP ] ${skill.name} → Lv. ${level}`);
    popup('SKILL ADVANCEMENT', `${skill.icon} ${skill.name} has reached <b>Lv. ${level}</b>`);
  });

  on('char-level', ({ level }) => {
    pushLog('sys', `[ SYSTEM ] Character Level ${level} — +1 stat point available`);
    popup('LEVEL UP', `🎖️ You are now <b>Character Lv. ${level}</b><br><span style="font-size:12px;color:var(--sys-blue)">+1 STAT POINT — open your Character Sheet</span>`, { ttl: 4.5 });
  });

  on('rare-drop', ({ itemId }) => {
    const item = getItem(itemId);
    popup('RARE ACQUISITION', `${item.icon} <span class="rarity-${item.rarity}">${item.name}</span>`, { gold: true, ttl: 4.5 });
  });

  on('ascended', ({ shards }) => {
    popup('ASCENSION', `💠 The System acknowledges you.<br>+<b>${shards}</b> Fate Shards`, { gold: true, ttl: 6 });
  });

  on('death', d => {
    const lines = [
      `🪙 −${(d.goldLost || 0).toLocaleString()} gold`,
      d.xpLost ? `📉 −${d.xpLost.toLocaleString()} ${d.styleId} XP` : null,
      d.foodLost ? `🍖 −${d.foodLost} ${d.foodName || 'rations'} scattered` : null,
      `🩸 Wounded — −25% damage, −15% speed for 3 minutes`,
    ].filter(Boolean).join('<br>');
    popup('YOU DIED', `☠ Cut down in ${d.where || 'the field'}<br>
      <span style="font-size:12px;color:var(--text-dim);line-height:1.7">${lines}</span>`, { ttl: 7 });
  });


  const toggle = document.getElementById('log-toggle');
  const logBox = document.getElementById('system-log');
  if (state.settings.logCollapsed) logBox.classList.add('collapsed');
  toggle.addEventListener('click', () => {
    logBox.classList.toggle('collapsed');
    state.settings.logCollapsed = logBox.classList.contains('collapsed');
  });
}
