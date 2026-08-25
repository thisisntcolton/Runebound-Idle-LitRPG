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
import { petsPanel, petsUI } from './pets.js';
import { codexPanel, codexUI } from './codex.js';
import { classPanel } from './classes.js';
import { appearancePanel } from './appearance.js';
import { heroBust } from './heroart.js';
import { normalizeLook, randomLook, defaultLook } from '../data/appearance.js';
import { chooseClass, currentClass, classPending, classUnlocked,
         setClassUIHooks } from '../systems/classes.js';
import { setCodexUIHooks, markRead, codex as codexState, progress as codexProgress } from '../systems/codex.js';
import { startIncubation, hatch, feed, play, renamePet, setActive, release,
         breed, buyEgg } from '../systems/pets.js';
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
import { enterRift, failRun, pendingRift, activeRun, UNSTABLE } from '../systems/unstable.js';
import { resolveVisitor } from '../systems/npcs.js';
import { resolveEncounter, pendingEncounter, setEncounterUIHooks } from '../systems/encounters.js';
import { startSkillAction, stopActivity, setHirelingTask, hirelingProgress } from '../systems/skills.js';
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

// Rolling record of what has dropped recently, newest first.
export const recentDrops = [];

export function renderDropFeed() {
  const el = document.getElementById('drop-feed');
  if (!el) return;
  if (!recentDrops.length) {
    el.innerHTML = '<span class="muted">Drops will appear here as they land.</span>';
    return;
  }
  el.innerHTML = recentDrops.map(d => `
    <span class="drop-chip border-${d.tier}" style="border-color:var(--r-${d.item.rarity})">
      <span>${d.item.icon}</span>
      <span class="rarity-${d.item.rarity}">${d.item.name}</span>
      ${d.qty > 1 ? `<b>×${d.qty}</b>` : ''}
    </span>`).join('');
}

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
    ${navItem('codex', '📖', 'Codex', { level: codexBadge(), working: (codexState().unread || 0) > 0 })}
    ${navItem('look', '🪞', 'Appearance')}
    ${navItem('class', currentClass()?.icon || '🎭', 'Path', {
      level: currentClass()?.name || (classUnlocked() ? 'Choose' : `Lv.${10}`),
      working: classPending() })}
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
    ${navItem('town', '🏘️', 'Hearthwick', {
      level: state.town?.unlocked ? 'Lv.' + townLevel() : null,
      working: !!pendingEncounter() })}
    ${navItem('pets', '🐾', 'Menagerie', { level: petsBadge(), working: eggsReady() })}
    ${navItem('ascension', '💠', 'Ascension', { level: canAscend() ? '💠' + pendingShards() : null })}
    ${navItem('leaderboard', '🏆', 'Leaderboard')}
    ${navItem('settings', '⚙️', 'Settings', { level: cloud.status === 'signed-in' ? '☁️' : null })}
  `;
}

function codexBadge() {
  const p = codexProgress();
  return `${p.found}/${p.total}`;
}

function petsBadge() {
  const n = Object.keys(state.pets?.owned || {}).length;
  return n ? String(n) : null;
}

function eggsReady() {
  return (state.pets?.incubator || []).some(e => Date.now() >= e.readyAt);
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
  else if (v === 'pets') el.innerHTML = petsPanel();
  else if (v === 'codex') el.innerHTML = codexPanel();
  else if (v === 'class') el.innerHTML = classPanel();
  else if (v === 'look') el.innerHTML = appearancePanel();
  else if (v === 'achievements') el.innerHTML = achievementsPanel();
  else if (v === 'combat') el.innerHTML = combatPanel(ui);
  else if (v === 'inventory') el.innerHTML = inventoryPanel();
  else if (v === 'equipment') el.innerHTML = equipmentPanel();
  else if (v === 'ascension') el.innerHTML = ascensionPanel();
  else if (v === 'leaderboard') el.innerHTML = leaderboardPanel();
  else if (v === 'settings') el.innerHTML = settingsPanel();
  else el.innerHTML = characterPanel();
  renderSidebar();

  renderDropFeed();
  const foodSel = document.getElementById('food-select');
  if (foodSel) foodSel.addEventListener('change', e => setFood(e.target.value || null));
  const titleSel = document.getElementById('title-select');
  if (titleSel) titleSel.addEventListener('change', e => setTitle(e.target.value || null));
  for (const sel of document.querySelectorAll('.hireling-task')) {
    sel.addEventListener('change', e => setHirelingTask(e.target.dataset.skill, e.target.value));
  }
}

/**
 * Background events (a hireling finishing an action, town revenue) trigger
 * re-renders constantly. If the player is mid-interaction with a control —
 * a dropdown, a text field — blowing away the DOM under them is hostile.
 * Defer the refresh until they're done.
 */
function isInteracting() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag !== 'SELECT' && tag !== 'INPUT' && tag !== 'TEXTAREA') return false;
  return document.getElementById('main-panel')?.contains(el) ?? false;
}

let deferredRender = false;
export function safeRenderView() {
  if (isInteracting()) { deferredRender = true; return; }
  renderView();
}

// Flush any render we skipped once focus leaves the control
document.addEventListener('focusout', () => {
  if (deferredRender) {
    deferredRender = false;
    setTimeout(() => { if (!isInteracting()) renderView(); }, 60);
  }
});

export function setView(view) {
  ui.view = view;
  if (view === 'codex') markRead();
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

  // unstable rift countdown
  const utimer = document.getElementById('unstable-timer');
  if (utimer) {
    const run = activeRun();
    if (run) utimer.style.width = Math.max(0, (run.remaining / UNSTABLE.DURATION_MS) * 100) + '%';
  }

  // hireling progress bars tick even while you do something else
  for (const bar of document.querySelectorAll('.hireling-bar')) {
    const p = hirelingProgress(bar.dataset.skill);
    if (p) bar.style.width = (p.pct * 100) + '%';
  }

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
      <p>All skills, gold, items, gear, upgrades and hirelings will be <b style="color:var(--danger)">reset</b>.</p>
      <p><b style="color:var(--danger)">Hearthwick falls with them</b> — every building, worker and crate of stock.
      The people you have met will still know you.</p>
      <p>Shards, perks, your pets and your chronicle persist.</p>
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
    case 'encounter-choose': resolveEncounter(target.dataset.option); renderView(); break;
    case 'visitor-accept': resolveVisitor('accept'); renderView(); break;
    case 'visitor-decline': resolveVisitor('decline'); renderView(); break;
    // ---- The Menagerie ----
    case 'pets-tab':
      petsUI.tab = target.dataset.tab;
      petsUI.selected = null;
      renderView();
      break;
    case 'select-pet': petsUI.selected = target.dataset.pet; renderView(); break;
    // ---- Codex ----
    // ---- Appearance ----
    case 'look-set': {
      const look = normalizeLook(state.look);
      look[target.dataset.key] = Number(target.dataset.index);
      state.look = look;
      renderView();
      break;
    }
    case 'look-random': {
      const name = state.look?.name || null;
      state.look = { ...randomLook(), name };
      renderView();
      break;
    }
    case 'look-reset': {
      const name = state.look?.name || null;
      state.look = { ...defaultLook(), name };
      renderView();
      break;
    }
    case 'look-name': {
      const input = document.getElementById('hero-name-input');
      if (input) {
        const look = normalizeLook(state.look);
        look.name = input.value.trim().slice(0, 20) || null;
        state.look = look;
      }
      renderView();
      break;
    }
    case 'choose-class':
      if (chooseClass(target.dataset.class)) { closeModal(); setView('class'); }
      break;
    case 'codex-cat': codexUI.cat = target.dataset.cat; codexUI.open = null; renderView(); break;
    case 'codex-open':
      codexUI.open = codexUI.open === target.dataset.entry ? null : target.dataset.entry;
      renderView();
      break;
    case 'incubate': startIncubation(target.dataset.item); break;
    case 'hatch-egg': hatch(target.dataset.egg); break;
    case 'pet-feed': feed(target.dataset.pet, target.dataset.item); break;
    case 'pet-play': play(target.dataset.pet); break;
    case 'pet-active': setActive(target.dataset.pet); break;
    case 'pet-rename': {
      const input = document.getElementById('pet-rename-input');
      if (input) renamePet(target.dataset.pet, input.value);
      renderView();
      break;
    }
    case 'pet-release': {
      const pet = state.pets.owned[target.dataset.pet];
      if (!pet) break;
      showModal(`
        <div class="modal-tag">◈ ARE YOU SURE ◈</div>
        <div class="modal-title">Release ${pet.name}?</div>
        <div class="modal-body" style="text-align:center">
          <p>It will wander off into the meadow and not come back. Its levels, its trait and its bond go with it.</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-danger" data-act="pet-release-confirm" data-pet="${pet.id}">Let it go</button>
          <button class="btn btn-primary" data-act="close-modal">Keep it</button>
        </div>`);
      break;
    }
    case 'pet-release-confirm':
      closeModal();
      release(target.dataset.pet);
      petsUI.selected = null;
      renderView();
      break;
    case 'breed-select': {
      const slot = target.dataset.slot;
      if (slot === 'a') petsUI.breedA = petsUI.breedA === target.dataset.pet ? null : target.dataset.pet;
      else petsUI.breedB = petsUI.breedB === target.dataset.pet ? null : target.dataset.pet;
      renderView();
      break;
    }
    case 'breed-go':
      if (breed(petsUI.breedA, petsUI.breedB)) { petsUI.breedA = null; petsUI.breedB = null; }
      renderView();
      break;
    case 'buy-egg': buyEgg(target.dataset.species); break;
    // ---- Unstable rifts ----
    case 'enter-unstable': if (enterRift()) setView('combat'); break;
    case 'flee-unstable': failRun('You fled the tear.'); renderView(); break;
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
  setCodexUIHooks({ queueModal, popup });
  setEncounterUIHooks({ queueModal, popup });

  document.addEventListener('click', e => {
    const target = e.target.closest('[data-act]');
    if (target) handleAction(target);
  });

  on('tick', updateDynamic);
  on('state-changed', safeRenderView);
  on('level-up', renderView);
  on('char-level', renderView);

  // Light-touch refresh of material counts / inventory while crafting
  // Throttled: hirelings can complete an action every couple of seconds,
  // and a full repaint that often is both wasteful and jumpy.
  let actionRefresh = 0;
  on('action-done', () => {
    const v = ui.view;
    if (v !== 'inventory' && !v.startsWith('skill:')) return;
    const now = performance.now();
    if (now - actionRefresh < 1500) return;
    actionRefresh = now;
    safeRenderView();
  });
  on('kill', () => { if (ui.view === 'combat') renderView(); });
  on('town-changed', () => { if (ui.view === 'town') safeRenderView(); });
  on('pets-changed', () => { if (ui.view === 'pets') safeRenderView(); });
  on('codex-discovered', () => { if (ui.view === 'codex') safeRenderView(); else renderSidebar(); });
  on('class-chosen', renderView);
  on('encounter-offered', () => { if (ui.view === 'town') renderView(); else renderSidebar(); });
  on('encounter-resolved', () => { if (ui.view === 'town') renderView(); });
  on('combat-crit', ({ damage }) => {
    if (ui.view === 'combat') spawnSplat('monster-box', `CRIT ${damage}`, '#ff8a8e');
  });
  on('unstable-offer', o => {
    popup('UNSTABLE RIFT', `⚠️ ${o.name}<br><span style="font-size:12px;color:var(--text-dim)">Answer it from the Rifts tab — you have 10 minutes.</span>`, { ttl: 8 });
    renderView();
  });
  on('unstable-sealed', d => popup('RIFT SEALED', `✅ ${d.waves} waves held<br><span style="font-size:12px">${d.reward}</span>`, { gold: true, ttl: 7 }));
  on('unstable-failed', d => {
    const raid = d.raid ? `<br><span style="font-size:12px;color:var(--danger)">Hearthwick raided: ${d.raid.damaged.join(', ')} halted ${d.raid.haltMinutes}m</span>` : '';
    popup('THE RIFT FLOODED', `💥 ${d.reason}${raid}`, { ttl: 8 });
    renderView();
  });
  // Town revenue ticks constantly; refresh the view at a calm pace
  let townRefresh = 0, riftRefresh = 0, petRefresh = 0;
  on('tick', ({ dt }) => {
    if (ui.view === 'town') {
      townRefresh += dt;
      if (townRefresh > 3000) { townRefresh = 0; safeRenderView(); }
    } else if (ui.view === 'pets') {
      // egg timers and care bars both drift in real time
      petRefresh += dt;
      if (petRefresh > 2000) { petRefresh = 0; safeRenderView(); }
    } else if (ui.view === 'rifts' && (pendingRift() || activeRun())) {
      riftRefresh += dt;
      if (riftRefresh > 1000) { riftRefresh = 0; safeRenderView(); }
    }
  });

  // ---- Loot feedback ----
  // A floating chip over the monster, plus a running strip of recent drops
  // so you can see at a glance what the grind is actually producing.
  on('loot', ({ itemId, qty, source, tier }) => {
    const item = getItem(itemId);
    if (!item) return;
    recentDrops.unshift({ item, qty, tier: tier || item.rarity, t: Date.now() });
    if (recentDrops.length > 12) recentDrops.length = 12;

    if (source === 'combat' && ui.view === 'combat') {
      const box = document.getElementById('monster-box');
      if (box) {
        const el = document.createElement('div');
        el.className = 'loot-splat';
        el.style.color = `var(--r-${item.rarity})`;
        el.style.top = (40 + Math.random() * 30) + '%';
        el.textContent = `${item.icon} ${item.name}${qty > 1 ? ' ×' + qty : ''}`;
        box.style.position = 'relative';
        box.appendChild(el);
        setTimeout(() => el.remove(), 2300);
      }
    }
    renderDropFeed();
  });

  on('combat-hit', ({ source, damage, missed }) => {
    if (ui.view !== 'combat') return;
    if (source === 'player') spawnSplat('monster-box', missed ? 'MISS' : '-' + damage, missed ? '#8fa0c4' : '#ffd166');
    else if (source === 'enemy') spawnSplat('player-box', missed ? 'MISS' : '-' + damage, missed ? '#8fa0c4' : '#ff6369');
    else if (source === 'burn') spawnSplat('monster-box', '🔥' + damage, '#ff9d4d');
    else if (source === 'heal') spawnSplat('player-box', '+' + damage, '#4ade80');
  });

  renderView();
  updateTopbar();
}
