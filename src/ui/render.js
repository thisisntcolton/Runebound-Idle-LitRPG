// ============================================================
// RENDERER — sidebar, view router, event delegation, tick updates
// ============================================================
import { state, skillLevel, actionTime, charLevel, combatLevel, maxHp,
         attackInterval } from '../core/state.js';
import { SKILLS, TRAINABLE_SKILLS, getAction } from '../data/skills.js';
import { getMonster, ZONES } from '../data/monsters.js';
import { getItem } from '../data/items.js';
import { fmt } from '../core/format.js';
import { on } from '../core/events.js';
import { skillPanel, combatPanel, inventoryPanel, equipmentPanel,
         characterPanel, ascensionPanel, settingsPanel } from './panels.js';
import { journalPanel } from './journal.js';
import { riftsPanel } from './rifts.js';
import { abilitiesPanel } from './abilities.js';
import { townPanel, townUI } from './town.js';
import { buyPlot, build, upgradeBuilding, demolish, hire, fire, assignStaff,
         stockBuilding, withdrawStock, refreshApplicants } from '../systems/town.js';
import { achievementsPanel } from './achievements.js';
import { learnTome, equipAbility, manualTrigger, abilityStatus } from '../systems/abilities.js';
import { leaderboardPanel, loadLeaderboard, lbState } from './leaderboard.js';
import { startDungeon, currentMonster } from '../systems/combat.js';
import { enchantItem } from '../systems/enchant.js';
import { drinkPotion } from '../systems/potions.js';
import { setTitle } from '../systems/achievements.js';
import { activeBuffs } from '../core/state.js';
import { fmtDuration as fmtDur } from '../core/format.js';
import { setQuestUIHooks, chooseEnding, activeMainQuest } from '../systems/quests.js';
import { FRAGMENTS } from '../data/lore.js';
import { popup } from './notify.js';
import { cloud, setCloudUIHooks, signIn, signOut, syncNow, resolveConflict } from '../core/cloud.js';
import { townLevel } from '../systems/town.js';
import { startSkillAction, stopActivity } from '../systems/skills.js';
import { startCombat, stopCombat, setCombatStyle, setFood } from '../systems/combat.js';
import { sellItem, sellAllOfType, equipItem, unequipItem } from '../systems/inventory.js';
import { allocateStat } from '../systems/character.js';
import { buyUpgrade, buyHireling, buyPerk, ascend, canAscend } from '../systems/prestige.js';
import { exportSave, importSave, hardReset } from '../core/save.js';
import { pendingShards } from '../core/state.js';
import { fmtDuration } from '../core/format.js';

export const ui = {
  view: 'character',
  selectedZone: ZONES[0].id,
};

// ---------------- Sidebar ----------------
function navItem(view, icon, label, { level = null, working = false } = {}) {
  return `
    <button class="nav-item ${ui.view === view ? 'active' : ''}" data-act="nav" data-view="${view}">
      <span class="nav-icon">${icon}</span>
      <span class="nav-label">${label}</span>
      ${level !== null ? `<span class="nav-level">${level}</span>` : ''}
      ${working ? '<span class="working-dot"></span>' : ''}
    </button>`;
}

export function renderSidebar() {
  const act = state.activity;
  const el = document.getElementById('sidebar');
  el.innerHTML = `
    <div class="nav-section-label">Hero</div>
    ${navItem('character', '📜', 'Character', { level: 'Lv.' + charLevel() })}
    ${navItem('journal', '🗺️', 'Journal', { working: !!activeMainQuest() })}
    ${navItem('achievements', '🏅', 'Achievements')}
    ${navItem('inventory', '🎒', 'Inventory')}
    ${navItem('equipment', '🛡️', 'Equipment')}
    <div class="nav-section-label">Combat</div>
    ${navItem('combat', '⚔️', 'Fight', { level: 'Lv.' + combatLevel(), working: act?.type === 'combat' && !state.combat.dungeonId })}
    ${navItem('rifts', '🌀', 'Rifts', { working: act?.type === 'combat' && !!state.combat.dungeonId })}
    ${navItem('abilities', '✨', 'Abilities')}
    <div class="nav-section-label">Skills</div>
    ${TRAINABLE_SKILLS.map(id => navItem('skill:' + id, SKILLS[id].icon, SKILLS[id].name, {
      level: skillLevel(id) + '/99',
      working: (act?.type === 'skill' && act.skillId === id) || hasWorkingHireling(id),
    })).join('')}
    <div class="nav-section-label">Beyond</div>
    ${navItem('town', '🏘️', 'Hearthwick', { level: state.town?.unlocked ? 'Lv.' + townLevel() : null })}
    ${navItem('ascension', '💠', 'Ascension', { level: canAscend() ? '💠' + pendingShards() : null })}
    ${navItem('leaderboard', '🏆', 'Leaderboard')}
    ${navItem('settings', '⚙️', 'Settings', { level: cloud.status === 'signed-in' ? '☁️' : null })}
  `;
}

function hasWorkingHireling(skillId) {
  const map = { woodcutting: 'h_wood', mining: 'h_mine', fishing: 'h_fish', smithing: 'h_smith', cooking: 'h_cook', alchemy: 'h_alch' };
  return (state.hirelings[map[skillId]] || 0) > 0;
}

// ---------------- Main panel ----------------
export function renderView() {
  const el = document.getElementById('main-panel');
  const v = ui.view;
  if (v.startsWith('skill:')) el.innerHTML = skillPanel(v.slice(6));
  else if (v === 'journal') el.innerHTML = journalPanel();
  else if (v === 'rifts') el.innerHTML = riftsPanel();
  else if (v === 'abilities') el.innerHTML = abilitiesPanel();
  else if (v === 'town') el.innerHTML = townPanel();
  else if (v === 'achievements') el.innerHTML = achievementsPanel();
  else if (v === 'combat') el.innerHTML = combatPanel(ui);
  else if (v === 'inventory') el.innerHTML = inventoryPanel();
  else if (v === 'equipment') el.innerHTML = equipmentPanel();
  else if (v === 'ascension') el.innerHTML = ascensionPanel();
  else if (v === 'leaderboard') el.innerHTML = leaderboardPanel();
  else if (v === 'settings') el.innerHTML = settingsPanel();
  else el.innerHTML = characterPanel();
  renderSidebar();

  const foodSel = document.getElementById('food-select');
  if (foodSel) foodSel.addEventListener('change', e => setFood(e.target.value || null));
  const titleSel = document.getElementById('title-select');
  if (titleSel) titleSel.addEventListener('change', e => setTitle(e.target.value || null));
}

export function setView(view) {
  ui.view = view;
  renderView();
  // Leaderboard data is fetched lazily whenever the panel is opened
  if (view === 'leaderboard' && cloud.status !== 'unavailable') {
    loadLeaderboard(lbState.board, renderView);
    renderView();
  }
}

// ---------------- Topbar + per-tick dynamic updates ----------------
function updateTopbar() {
  document.getElementById('gold-display').textContent = fmt(state.gold);
  document.getElementById('shards-display').textContent = fmt(state.shards);
  document.getElementById('charlevel-display').textContent = 'Lv. ' + charLevel();

  const disp = document.getElementById('active-action-display');
  const act = state.activity;
  if (act?.type === 'skill') {
    const action = getAction(act.skillId, act.actionId);
    disp.textContent = `${SKILLS[act.skillId].icon} ${action?.name || ''}`;
    disp.className = 'active-action working';
  } else if (act?.type === 'combat') {
    const m = currentMonster();
    disp.textContent = state.combat.dungeonId
      ? `🌀 Rift: ${m?.name || ''}`
      : `⚔️ Fighting ${m?.name || ''}`;
    disp.className = 'active-action fighting';
  } else {
    disp.textContent = '💤 Idle';
    disp.className = 'active-action';
  }
}

let lastBuffKey = '';
function updateBuffBar() {
  const el = document.getElementById('buff-bar');
  if (!el) return;
  const buffs = activeBuffs();
  const key = buffs.map(b => b.id + Math.floor(b.remaining / 10)).join(',');
  if (key === lastBuffKey) return;
  lastBuffKey = key;
  el.innerHTML = buffs.map(b =>
    `<span class="buff-chip">${b.icon} ${fmtDur(b.remaining)}</span>`).join('');
}

let lastAbilKey = '';
function updateAbilityBar() {
  if (ui.view !== 'combat') return;
  const chips = document.querySelectorAll('.ability-chip');
  if (!chips.length) return;
  const st = abilityStatus().filter(s => s.unlocked && s.ability);
  const key = st.map(s => s.ready ? 'r' : Math.ceil(s.cooldown / 500)).join(',');
  if (key === lastAbilKey) return;
  lastAbilKey = key;
  st.forEach((s, i) => {
    const chip = chips[i];
    if (!chip) return;
    const fill = chip.querySelector('.ability-cd-fill');
    if (fill) fill.style.width = (s.ability.cooldown ? (1 - s.cooldown / s.ability.cooldown) * 100 : 100) + '%';
    chip.classList.toggle('ready', s.ready);
  });
}

function updateDynamic() {
  updateTopbar();
  updateBuffBar();
  updateAbilityBar();
  const act = state.activity;

  // active skill progress bar
  if (act?.type === 'skill') {
    const bar = document.getElementById('active-action-bar');
    if (bar) {
      const action = getAction(act.skillId, act.actionId);
      if (action) bar.style.width = Math.min(100, act.progress / actionTime(act.skillId, action) * 100) + '%';
    }
  }

  // combat bars
  if (act?.type === 'combat') {
    const c = state.combat;
    const monster = currentMonster();
    if (monster) {
      const cap = maxHp();
      setBar('player-hp-bar', Math.max(0, c.playerHp) / cap * 100);
      setText('player-hp-text', `${Math.ceil(Math.max(0, c.playerHp))} / ${cap}`);
      setBar('monster-hp-bar', Math.max(0, c.monsterHp) / monster.hp * 100);
      setText('monster-hp-text', `${Math.ceil(Math.max(0, c.monsterHp))} / ${monster.hp}`);
      setBar('player-atk-timer', Math.min(100, c.playerTimer / attackInterval() * 100));
      setBar('monster-atk-timer', Math.min(100, c.monsterTimer / monster.attackSpeed * 100));
    }
  }
}

function setBar(id, pct) { const el = document.getElementById(id); if (el) el.style.width = pct + '%'; }
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

// ---------------- Hit splats ----------------
function spawnSplat(targetId, text, color) {
  const box = document.getElementById(targetId);
  if (!box) return;
  const splat = document.createElement('div');
  splat.className = 'hit-splat';
  splat.textContent = text;
  splat.style.color = color;
  splat.style.left = 30 + Math.random() * 40 + '%';
  splat.style.top = 35 + Math.random() * 20 + '%';
  box.style.position = 'relative';
  box.appendChild(splat);
  setTimeout(() => splat.remove(), 850);
}

// ---------------- Modals (with a queue for story beats) ----------------
const modalQueue = [];

export function showModal(html) {
  document.getElementById('modal-window').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

export function queueModal(html) {
  const overlay = document.getElementById('modal-overlay');
  if (overlay.classList.contains('hidden')) showModal(html);
  else modalQueue.push(html);
}

export function closeModal() {
  if (modalQueue.length > 0) {
    showModal(modalQueue.shift());
  } else {
    document.getElementById('modal-overlay').classList.add('hidden');
  }
}

export function showOfflineModal(summary) {
  const list = summary.gains.map(g => `<li>${g.icon} ${g.text}</li>`).join('');
  queueModal(`
    <div class="modal-tag">◈ SYSTEM NOTICE ◈</div>
    <div class="modal-title">While You Were Away</div>
    <div class="modal-body">
      <p>Time passed: <b>${fmtDuration(summary.seconds)}</b>${summary.capped ? ` (progress capped at ${fmtDuration(summary.cappedSeconds)})` : ''}</p>
      <ul>${list}</ul>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Claim</button></div>
  `);
}

function showItemMenu(itemId) {
  const item = getItem(itemId);
  const qty = state.inventory[itemId] || 0;
  if (!item || qty <= 0) { closeModal(); return; }
  showModal(`
    <div class="modal-tag">◈ ITEM ◈</div>
    <div class="modal-title"><span class="rarity-${item.rarity}">${item.icon} ${item.name}</span></div>
    <div class="modal-body" style="text-align:center">
      <p>Owned: <b>${fmt(qty)}</b> · Sells for <span class="cost">🪙 ${fmt(item.sell)}</span> each</p>
      ${item.heal ? `<p>🍖 Heals <b>${item.heal}</b> HP when set as combat food.</p>` : ''}
      ${item.type === 'potion' ? `<p>🧪 ${Object.entries(item.effects || {}).map(([k, v]) => `+${Math.round(v * 100)}% ${k}`).join(' · ')} for 10 minutes</p>` : ''}
      ${item.stats ? `<p>${Object.entries(item.stats).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' · ')}</p>` : ''}
    </div>
    <div class="modal-actions">
      <button class="btn btn-sm" data-act="sell-one" data-item="${itemId}">Sell 1</button>
      <button class="btn btn-sm btn-gold" data-act="sell-all-item" data-item="${itemId}">Sell all (🪙 ${fmt(item.sell * qty)})</button>
      ${item.type === 'equipment' ? `<button class="btn btn-sm btn-primary" data-act="equip-item" data-item="${itemId}">Equip</button>` : ''}
      ${item.type === 'food' ? `<button class="btn btn-sm btn-primary" data-act="set-food" data-item="${itemId}">Set as combat food</button>` : ''}
      ${item.type === 'potion' ? `<button class="btn btn-sm btn-primary" data-act="drink-potion" data-item="${itemId}">🧪 Drink (10 min buff)</button>` : ''}
      ${item.type === 'tome' ? `<button class="btn btn-sm btn-primary" data-act="learn-tome" data-item="${itemId}">📖 Study tome</button>` : ''}
      <button class="btn btn-sm" data-act="close-modal">Close</button>
    </div>
  `);
}

function showAscendConfirm() {
  showModal(`
    <div class="modal-tag">◈ THE SYSTEM SPEAKS ◈</div>
    <div class="modal-title">Ascend?</div>
    <div class="modal-body">
      <p>You will gain <b style="color:var(--shard)">💠 ${pendingShards()} Fate Shards</b>.</p>
      <p>All skills, gold, items, gear, upgrades and hirelings will be <b style="color:var(--danger)">reset</b>.
      Shards, perks and your chronicle persist.</p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-danger" data-act="confirm-ascend">☄️ Do it</button>
      <button class="btn" data-act="close-modal">Not yet</button>
    </div>
  `);
}

// ---------------- Event delegation ----------------
function handleAction(target) {
  const act = target.dataset.act;
  switch (act) {
    case 'nav': setView(target.dataset.view); break;
    case 'start-action': startSkillAction(target.dataset.skill, target.dataset.action); break;
    case 'stop-activity': stopActivity(); break;
    case 'select-zone': ui.selectedZone = target.dataset.zone; renderView(); break;
    case 'fight': startCombat(target.dataset.zone, target.dataset.monster); break;
    case 'stop-combat': stopCombat(); break;
    case 'set-style': setCombatStyle(target.dataset.style); break;
    case 'buy-upgrade': buyUpgrade(target.dataset.id); break;
    case 'buy-hireling': buyHireling(target.dataset.id); break;
    case 'buy-perk': buyPerk(target.dataset.id); break;
    case 'item-menu': showItemMenu(target.dataset.item); break;
    case 'sell-one': sellItem(target.dataset.item, 1); showItemMenu(target.dataset.item); break;
    case 'sell-all-item': sellItem(target.dataset.item, 'all'); closeModal(); break;
    case 'sell-resources': sellAllOfType('resources'); break;
    case 'equip-item': equipItem(target.dataset.item); closeModal(); break;
    case 'set-food': setFood(target.dataset.item); closeModal(); break;
    case 'unequip': unequipItem(target.dataset.slot); break;
    case 'alloc-stat': allocateStat(target.dataset.stat); break;
    case 'ascend': showAscendConfirm(); break;
    case 'confirm-ascend': closeModal(); ascend(); setView('character'); break;
    case 'export-save': {
      const ta = document.getElementById('save-io');
      if (ta) { ta.value = exportSave(); ta.select(); }
      break;
    }
    case 'import-save': {
      const ta = document.getElementById('save-io');
      if (ta && ta.value.trim()) {
        if (importSave(ta.value)) { renderView(); }
        else ta.value = '⚠ Invalid save string';
      }
      break;
    }
    case 'hard-reset':
      showModal(`
        <div class="modal-tag">◈ WARNING ◈</div>
        <div class="modal-title">Erase everything?</div>
        <div class="modal-body"><p>This deletes your save completely — shards, perks, chronicle, all of it.</p></div>
        <div class="modal-actions">
          <button class="btn btn-danger" data-act="confirm-reset">💀 Erase</button>
          <button class="btn" data-act="close-modal">Keep playing</button>
        </div>`);
      break;
    case 'confirm-reset': closeModal(); hardReset(); setView('character'); break;
    case 'close-modal': closeModal(); break;
    case 'ending-feed': closeModal(); chooseEnding('feed'); break;
    case 'ending-break': closeModal(); chooseEnding('break'); break;
    case 'cloud-signin': signIn(target.dataset.provider); break;
    case 'cloud-signout': signOut().then(renderView); break;
    case 'cloud-sync': syncNow().then(renderView); break;
    case 'cloud-use-remote': closeModal(); resolveConflict('remote'); break;
    case 'cloud-use-local': closeModal(); resolveConflict('local'); break;
    case 'lb-board':
      loadLeaderboard(target.dataset.board, renderView);
      renderView();
      break;
    case 'enter-rift': startDungeon(target.dataset.dungeon); setView('combat'); break;
    case 'learn-tome': learnTome(target.dataset.item); break;
    case 'equip-ability': equipAbility(target.dataset.slot, target.dataset.ability || null); break;
    case 'fire-ability': manualTrigger(); break;
    // ---- Town ----
    case 'select-plot':
      townUI.selectedPlot = Number(target.dataset.plot);
      townUI.tab = 'build';
      renderView();
      break;
    case 'town-tab': townUI.tab = target.dataset.tab; renderView(); break;
    case 'buy-plot':
      if (buyPlot(Number(target.dataset.plot))) townUI.selectedPlot = Number(target.dataset.plot);
      break;
    case 'build': build(Number(target.dataset.plot), target.dataset.building); break;
    case 'upgrade-building': upgradeBuilding(Number(target.dataset.plot)); break;
    case 'demolish': demolish(Number(target.dataset.plot)); break;
    case 'hire': hire(target.dataset.applicant); break;
    case 'fire': fire(target.dataset.staff); break;
    case 'assign-staff': assignStaff(target.dataset.staff, Number(target.dataset.plot)); break;
    case 'unassign-staff': assignStaff(target.dataset.staff, null); break;
    case 'stock': {
      const qty = target.dataset.qty === 'all' ? 'all' : Number(target.dataset.qty);
      stockBuilding(Number(target.dataset.plot), target.dataset.item, qty);
      break;
    }
    case 'withdraw-stock': withdrawStock(Number(target.dataset.plot), target.dataset.item); break;
    case 'reroll-applicants': refreshApplicants(); break;
    case 'enchant': enchantItem(target.dataset.item); break;
    case 'drink-potion': drinkPotion(target.dataset.item); closeModal(); break;
    case 'read-lore': {
      const frag = FRAGMENTS[target.dataset.id];
      if (frag) showModal(`
        <div class="modal-tag">◈ LORE ARCHIVE ◈</div>
        <div class="modal-title">${frag.title}</div>
        <div class="modal-body" style="line-height:1.7">${frag.text}</div>
        <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Close</button></div>`);
      break;
    }
  }
}

// ---------------- Init ----------------
export function initRenderer() {
  setQuestUIHooks({ queueModal, popup });
  setCloudUIHooks({ queueModal, popup, renderView });

  document.addEventListener('click', e => {
    const target = e.target.closest('[data-act]');
    if (target) handleAction(target);
  });

  on('tick', updateDynamic);
  on('state-changed', renderView);
  on('level-up', renderView);
  on('char-level', renderView);

  // Light-touch refresh of material counts / inventory while crafting
  on('action-done', () => {
    const v = ui.view;
    if (v === 'inventory' || v.startsWith('skill:')) renderView();
  });
  on('kill', () => { if (ui.view === 'combat') renderView(); });
  on('town-changed', () => { if (ui.view === 'town') renderView(); });
  // Town revenue ticks constantly; refresh the view at a calm pace
  let townRefresh = 0;
  on('tick', ({ dt }) => {
    if (ui.view !== 'town') return;
    townRefresh += dt;
    if (townRefresh > 3000) { townRefresh = 0; renderView(); }
  });

  on('combat-hit', ({ source, damage, missed }) => {
    if (ui.view !== 'combat') return;
    if (source === 'player') spawnSplat('monster-box', missed ? 'MISS' : '-' + damage, missed ? '#8fa0c4' : '#ffd166');
    else if (source === 'enemy') spawnSplat('player-box', missed ? 'MISS' : '-' + damage, missed ? '#8fa0c4' : '#ff6369');
    else if (source === 'heal') spawnSplat('player-box', '+' + damage, '#4ade80');
  });

  renderView();
  updateTopbar();
}
