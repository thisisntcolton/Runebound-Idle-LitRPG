// ============================================================
// PANEL BUILDERS — return HTML strings for each view
// ============================================================
import { state, skillLevel, actionTime, doubleChance, hirelingRate,
         charLevel, totalSkillLevel, combatLevel, statPointsAvailable,
         gearStats, maxHp, playerAccuracy, playerMaxHit, playerDefenseRating,
         damageReduction, xpMultiplier, goldMultiplier, pendingShards,
         ASCEND_MIN_TOTAL_LEVEL, offlineCapHours } from '../core/state.js';
import { SKILLS, TRAINABLE_SKILLS, COMBAT_SKILLS, getAction } from '../data/skills.js';
import { ZONES, getZone, getMonster } from '../data/monsters.js';
import { getDungeon, totalWaves } from '../data/dungeons.js';
import { currentMonster } from '../systems/combat.js';
import { enchantCost, canEnchant, MAX_ENCHANT } from '../systems/enchant.js';
import { unlockedTitles } from '../systems/achievements.js';
import { ITEMS, getItem, EQUIP_SLOTS } from '../data/items.js';
import { UPGRADES, HIRELINGS, PERKS, upgradeCost, perkCost } from '../data/upgrades.js';
import { STAT_INFO } from '../systems/character.js';
import { cloud } from '../core/cloud.js';
import { levelForXp, xpForLevel, levelProgress, MAX_LEVEL } from '../core/xp.js';
import { fmt, fmtInt, fmtDuration } from '../core/format.js';

const rarityCls = item => `rarity-${item.rarity}`;
const borderCls = item => `border-${item.rarity}`;

function xpBarBlock(skillId) {
  const xp = state.skills[skillId].xp;
  const lvl = levelForXp(xp);
  const pct = levelProgress(xp) * 100;
  const label = lvl >= MAX_LEVEL
    ? `MAX LEVEL — ${fmtInt(xp)} XP`
    : `${fmtInt(xp - xpForLevel(lvl))} / ${fmtInt(xpForLevel(lvl + 1) - xpForLevel(lvl))} XP to Lv. ${lvl + 1}`;
  return `
    <div class="xp-bar-outer"><div class="xp-bar-inner" id="panel-xp-bar" style="width:${pct}%"></div></div>
    <div class="xp-bar-label" id="panel-xp-label">${label}</div>`;
}

// ---------------- Skill panel ----------------
export function skillPanel(skillId) {
  const skill = SKILLS[skillId];
  const lvl = skillLevel(skillId);
  const act = state.activity;

  const cards = skill.actions.map(a => {
    const unlocked = lvl >= a.level;
    const isActive = act?.type === 'skill' && act.skillId === skillId && act.actionId === a.id;
    const time = actionTime(skillId, a);
    const outputs = Object.entries(a.output).map(([id, q]) => {
      const item = getItem(id);
      return `${item.icon} ${q > 1 ? q + '× ' : ''}${item.name}`;
    }).join(', ');
    const inputs = a.input ? Object.entries(a.input).map(([id, q]) => {
      const item = getItem(id);
      const have = state.inventory[id] || 0;
      const ok = have >= q;
      return `<span style="color:${ok ? 'var(--text-dim)' : 'var(--danger)'}">${item.icon} ${q} ${item.name} (${fmt(have)})</span>`;
    }).join(' · ') : '';

    return `
      <div class="card clickable ${unlocked ? '' : 'locked'} ${isActive ? 'active-card' : ''}"
           ${unlocked ? `data-act="${isActive ? 'stop-activity' : 'start-action'}" data-skill="${skillId}" data-action="${a.id}"` : ''}>
        <div class="card-title"><span class="card-icon">${a.icon}</span> ${a.name}</div>
        <div class="card-sub">${unlocked ? `${(time / 1000).toFixed(1)}s per action` : `<span class="lock-req">Requires Lv. ${a.level}</span>`}</div>
        ${inputs ? `<div class="card-sub">${inputs}</div>` : ''}
        <div class="action-bar-outer"><div class="action-bar-inner" ${isActive ? 'id="active-action-bar"' : ''} style="width:${isActive ? (act.progress / time * 100) : 0}%"></div></div>
        <div class="card-yield">
          <span>${outputs}</span>
          <span class="yield-xp">+${a.xp} XP</span>
        </div>
        ${isActive ? '<div class="working-dot"></div>' : ''}
      </div>`;
  }).join('');

  const hireling = HIRELINGS.find(h => h.skill === skillId);
  const upgrades = UPGRADES.filter(u => u.skill === skillId);
  const dbl = doubleChance(skillId);

  return `
    <div class="panel-header">
      <div class="panel-title">${skill.icon} ${skill.name}</div>
      <div class="panel-subtitle">${skill.kind === 'gathering' ? 'Gathering' : 'Artisan'} skill</div>
    </div>
    <div class="panel-desc">${skill.desc}</div>
    <div class="skill-header">
      <div class="skill-header-top">
        <div class="skill-level-big">Lv. ${lvl} / ${MAX_LEVEL}</div>
        <div class="muted">${dbl > 0 ? `${Math.round(dbl * 100)}% double yield · ` : ''}XP ×${xpMultiplier().toFixed(2)}</div>
      </div>
      ${xpBarBlock(skillId)}
    </div>
    <div class="card-grid">${cards}</div>
    <div class="section-title">⚒ Improvements</div>
    ${upgrades.map(shopRowUpgrade).join('')}
    ${hireling ? shopRowHireling(hireling) : ''}
  `;
}

function shopRowUpgrade(u) {
  const lvl = state.upgrades[u.id] || 0;
  const maxed = lvl >= u.maxLevel;
  const cost = upgradeCost(u, lvl);
  return `
    <div class="shop-row">
      <div style="font-size:22px">${u.icon}</div>
      <div class="shop-row-info">
        <div class="shop-row-title">${u.name}</div>
        <div class="shop-row-desc">${u.desc}</div>
      </div>
      <div class="shop-row-level">${lvl}/${u.maxLevel}</div>
      ${maxed
        ? '<span class="pill">MAX</span>'
        : `<button class="btn btn-sm ${state.gold >= cost ? 'btn-gold' : ''}" data-act="buy-upgrade" data-id="${u.id}" ${state.gold < cost ? 'disabled' : ''}>
             <span class="cost ${state.gold < cost ? 'unaffordable' : ''}">🪙 ${fmt(cost)}</span></button>`}
    </div>`;
}

function shopRowHireling(h) {
  const lvl = state.hirelings[h.id] || 0;
  const maxed = lvl >= h.maxLevel;
  const cost = upgradeCost(h, lvl);
  const rate = hirelingRate(h.skill);
  return `
    <div class="shop-row" style="border-color: rgba(245,197,66,0.35)">
      <div style="font-size:22px">${h.icon}</div>
      <div class="shop-row-info">
        <div class="shop-row-title">${h.name} ${lvl > 0 ? `<span class="pill">working at ${Math.round(rate * 100)}%</span>` : ''}</div>
        <div class="shop-row-desc">${h.flavor} ${lvl === 0 ? '— hire to train this skill passively, even while you do other things.' : ''}</div>
      </div>
      <div class="shop-row-level">${lvl}/${h.maxLevel}</div>
      ${maxed
        ? '<span class="pill">MAX</span>'
        : `<button class="btn btn-sm ${state.gold >= cost ? 'btn-gold' : ''}" data-act="buy-hireling" data-id="${h.id}" ${state.gold < cost ? 'disabled' : ''}>
             <span class="cost ${state.gold < cost ? 'unaffordable' : ''}">🪙 ${fmt(cost)}</span></button>`}
    </div>`;
}

// ---------------- Combat panel ----------------
export function combatPanel(ui) {
  const inCombat = state.activity?.type === 'combat';
  const c = state.combat;
  const cl = combatLevel();
  const selectedZone = ui.selectedZone ? getZone(ui.selectedZone) : null;
  const rift = c.dungeonId ? getDungeon(c.dungeonId) : null;

  let arena = '';
  if (inCombat && (rift || (c.zoneId && c.monsterId))) {
    const monster = currentMonster();
    const mhp = Math.max(0, c.monsterHp);
    const php = Math.max(0, c.playerHp);
    const cap = maxHp();
    const riftBanner = rift ? `
      <div class="stat-points-banner" style="display:flex;justify-content:space-between;align-items:center">
        <span>🌀 ${rift.name} — WAVE ${(c.wave || 0) + 1} / ${totalWaves(rift)}</span>
        <span style="display:flex;gap:4px">${Array.from({ length: totalWaves(rift) }, (_, i) =>
          `<span style="width:14px;height:8px;border-radius:3px;background:${i < (c.wave || 0) ? 'var(--xp)' : i === (c.wave || 0) ? 'var(--sys-blue)' : 'var(--bg-card)'}"></span>`).join('')}</span>
      </div>` : '';
    arena = `
      ${riftBanner}
      <div class="combat-arena">
        <div class="combatant player-side" id="player-box">
          <div class="combatant-name">🧙 You</div>
          <div class="combatant-level">Combat Lv. ${cl}</div>
          <div class="combatant-icon">🧙</div>
          <div class="hp-bar-outer">
            <div class="hp-bar-inner" id="player-hp-bar" style="width:${php / cap * 100}%"></div>
            <div class="hp-bar-text" id="player-hp-text">${Math.ceil(php)} / ${cap}</div>
          </div>
          <div class="attack-timer-outer"><div class="attack-timer-inner" id="player-atk-timer"></div></div>
        </div>
        <div class="vs-divider">VS</div>
        <div class="combatant enemy-side" id="monster-box">
          <div class="combatant-name">${monster.name}${monster.boss ? ' 👑' : ''}</div>
          <div class="combatant-level">${monster.level ? `Lv. ${monster.level}` : (rift ? 'Rift-spawn' : '')}</div>
          <div class="combatant-icon">${monster.icon}</div>
          <div class="hp-bar-outer">
            <div class="hp-bar-inner" id="monster-hp-bar" style="width:${mhp / monster.hp * 100}%"></div>
            <div class="hp-bar-text" id="monster-hp-text">${Math.ceil(mhp)} / ${monster.hp}</div>
          </div>
          <div class="attack-timer-outer"><div class="attack-timer-inner" id="monster-atk-timer"></div></div>
        </div>
      </div>`;
  }

  const foods = Object.entries(state.inventory)
    .map(([id, qty]) => ({ item: getItem(id), qty }))
    .filter(x => x.item?.type === 'food');
  const foodOptions = ['<option value="">— no food —</option>']
    .concat(foods.map(f => `<option value="${f.item.id}" ${c.foodItem === f.item.id ? 'selected' : ''}>${f.item.name} ×${f.qty} (heals ${f.item.heal})</option>`))
    .join('');

  const styles = ['attack', 'strength', 'defense'].map(s => `
    <button class="btn btn-sm style-btn ${c.style === s ? 'selected' : ''}" data-act="set-style" data-style="${s}">
      ${SKILLS[s].icon} ${SKILLS[s].name} <span class="muted">Lv.${skillLevel(s)}</span>
    </button>`).join('');

  const zonePills = ZONES.map(z => {
    const unlocked = cl >= z.level;
    const sel = ui.selectedZone === z.id;
    return `<button class="btn btn-sm ${sel ? 'btn-primary' : ''}" data-act="select-zone" data-zone="${z.id}" ${unlocked ? '' : 'disabled'}>
      ${z.icon} ${z.name} ${unlocked ? '' : `<span class="lock-req">Lv.${z.level}</span>`}</button>`;
  }).join(' ');

  const monsterCards = selectedZone ? selectedZone.monsters.map(m => {
    const fighting = inCombat && c.zoneId === selectedZone.id && c.monsterId === m.id;
    return `
      <div class="card clickable ${fighting ? 'active-card' : ''}" data-act="${fighting ? 'stop-combat' : 'fight'}" data-zone="${selectedZone.id}" data-monster="${m.id}">
        <div class="card-title"><span class="card-icon">${m.icon}</span> ${m.name}${m.boss ? ' 👑' : ''}</div>
        <div class="card-sub">Lv. ${m.level} · ${m.hp} HP · hits up to ${m.maxHit}</div>
        <div class="card-yield">
          <span class="yield-gold">🪙 ${m.gold[0]}–${m.gold[1]}</span>
          <span>${m.loot.length ? '🎁 ' + m.loot.length + ' drop' + (m.loot.length > 1 ? 's' : '') : ''}</span>
        </div>
        ${fighting ? '<div class="working-dot"></div>' : ''}
      </div>`;
  }).join('') : '';

  return `
    <div class="panel-header">
      <div class="panel-title">⚔️ Combat</div>
      <div class="panel-subtitle">Combat Lv. ${cl} · Max hit ${playerMaxHit()} · ${Math.round(damageReduction() * 100)}% DR</div>
    </div>
    <div class="panel-desc">Choose a hunting ground. Your hero fights automatically — keep food equipped or the System will be writing your obituary.</div>
    ${arena}
    <div class="combat-controls">
      ${styles}
      <div class="food-slot">🍖 Auto-eat: <select id="food-select">${foodOptions}</select></div>
      ${inCombat ? '<button class="btn btn-danger btn-sm" data-act="stop-combat">🏳️ Retreat</button>' : ''}
    </div>
    <div class="section-title">🗺 Hunting Grounds</div>
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px">${zonePills}</div>
    ${selectedZone ? `<div class="panel-desc">${selectedZone.desc}</div><div class="zone-monster-list">${monsterCards}</div>` : '<div class="muted">Select a zone above.</div>'}
    <div class="section-title">⚒ Combat Improvements</div>
    ${UPGRADES.filter(u => u.skill === 'combat').map(shopRowUpgrade).join('')}
  `;
}

// ---------------- Inventory ----------------
export function inventoryPanel() {
  const entries = Object.entries(state.inventory)
    .map(([id, qty]) => ({ item: getItem(id), qty }))
    .filter(x => x.item)
    .sort((a, b) => (b.item.sell * b.qty) - (a.item.sell * a.qty));

  const totalValue = entries.reduce((s, e) => s + e.item.sell * e.qty, 0);

  const slots = entries.map(e => `
    <div class="inv-slot ${borderCls(e.item)}" data-act="item-menu" data-item="${e.item.id}" title="${e.item.name} — sells for ${fmt(e.item.sell)} each">
      <div class="inv-qty">${fmt(e.qty)}</div>
      <div class="inv-icon">${e.item.icon}</div>
      <div class="inv-name ${rarityCls(e.item)}">${e.item.name}</div>
    </div>`).join('');

  return `
    <div class="panel-header">
      <div class="panel-title">🎒 Inventory</div>
      <div class="panel-subtitle">Bank value ≈ <span class="yield-gold">🪙 ${fmt(totalValue)}</span></div>
    </div>
    <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap">
      <button class="btn btn-sm btn-gold" data-act="sell-resources">Sell all resources</button>
      <span class="muted" style="align-self:center">Keeps food & gear. Click an item for options.</span>
    </div>
    ${entries.length ? `<div class="inv-grid">${slots}</div>` : '<div class="muted">Empty. Go hit a tree or something.</div>'}
  `;
}

// ---------------- Equipment ----------------
export function equipmentPanel() {
  const gear = gearStats();
  const slotEls = EQUIP_SLOTS.map(slot => {
    const itemId = state.equipment[slot];
    const item = itemId ? getItem(itemId) : null;
    const ench = itemId ? (state.enchants?.[itemId] || 0) : 0;
    return `
      <div class="equip-slot ${item ? borderCls(item) : ''}" ${item ? `data-act="unequip" data-slot="${slot}" title="Click to unequip"` : ''}>
        <div class="slot-label">${slot}</div>
        ${item ? `<div class="inv-icon">${item.icon}</div><div class="inv-name ${rarityCls(item)}">${item.name}${ench ? ` <b style="color:var(--shard)">+${ench}</b>` : ''}</div>`
               : '<div class="muted" style="font-size:18px">—</div>'}
      </div>`;
  }).join('');

  // ---- Enchanting (equipped items only) ----
  const enchantRows = EQUIP_SLOTS.map(slot => {
    const itemId = state.equipment[slot];
    if (!itemId) return '';
    const item = getItem(itemId);
    const lvl = state.enchants?.[itemId] || 0;
    const cost = enchantCost(itemId);
    const maxed = !cost;
    const rune = cost ? getItem(cost.rune) : null;
    const haveRunes = cost ? (state.inventory[cost.rune] || 0) : 0;
    return `
      <div class="shop-row">
        <div style="font-size:20px">${item.icon}</div>
        <div class="shop-row-info">
          <div class="shop-row-title ${rarityCls(item)}">${item.name} ${lvl ? `<b style="color:var(--shard)">+${lvl}</b>` : ''}</div>
          <div class="shop-row-desc">${maxed ? 'Fully enchanted — it hums when nobody is listening.'
            : `Next: +${cost.next} (+${cost.next * 10}% stats) — ${rune.icon} ${cost.runeQty} ${rune.name} (${fmt(haveRunes)}) · 🪙 ${fmt(cost.gold)}`}</div>
        </div>
        <div class="shop-row-level">${lvl}/${MAX_ENCHANT}</div>
        ${maxed ? '<span class="pill">MAX</span>'
          : `<button class="btn btn-sm ${canEnchant(itemId) ? 'btn-primary' : ''}" data-act="enchant" data-item="${itemId}" ${canEnchant(itemId) ? '' : 'disabled'}>✨ Enchant</button>`}
      </div>`;
  }).join('');
  const anyEquipped = EQUIP_SLOTS.some(s => state.equipment[s]);

  const equipables = Object.entries(state.inventory)
    .map(([id, qty]) => ({ item: getItem(id), qty }))
    .filter(x => x.item?.type === 'equipment');

  const equipList = equipables.length ? equipables.map(e => `
    <div class="shop-row">
      <div style="font-size:20px">${e.item.icon}</div>
      <div class="shop-row-info">
        <div class="shop-row-title ${rarityCls(e.item)}">${e.item.name} ${e.qty > 1 ? '×' + e.qty : ''}</div>
        <div class="shop-row-desc">${statLine(e.item.stats)} · ${e.item.slot}</div>
      </div>
      <button class="btn btn-sm btn-primary" data-act="equip-item" data-item="${e.item.id}">Equip</button>
    </div>`).join('') : '<div class="muted">No equipment in your bags. Forge some at the smithy, or take it from something\'s corpse.</div>';

  return `
    <div class="panel-header"><div class="panel-title">🛡️ Equipment</div></div>
    <div class="equip-layout">
      <div class="equip-slots">${slotEls}</div>
      <div class="gear-stats-box">
        <div class="char-sheet">
          <div class="char-sheet-header"><span>GEAR TOTALS</span></div>
          <div class="stat-row"><span class="stat-name">ATK</span><span class="stat-value">+${gear.atk}</span><span class="stat-desc">accuracy bonus</span></div>
          <div class="stat-row"><span class="stat-name">STR</span><span class="stat-value">+${gear.str}</span><span class="stat-desc">damage bonus</span></div>
          <div class="stat-row"><span class="stat-name">DEF</span><span class="stat-value">+${gear.def}</span><span class="stat-desc">defense bonus</span></div>
          <div class="stat-row"><span class="stat-name">HP</span><span class="stat-value">+${gear.hp}</span><span class="stat-desc">bonus hitpoints</span></div>
        </div>
      </div>
    </div>
    <div class="section-title">✨ Enchanting</div>
    <div class="panel-desc">Runes from the Rifts push equipped gear to +5 — each rank adds 10% to the item's stats. Enchants stick to the item even if you unequip it.</div>
    ${anyEquipped ? enchantRows : '<div class="muted">Equip something first — the runes need a surface to bite into.</div>'}
    <div class="section-title">🎒 Equipable items</div>
    ${equipList}
  `;
}

function statLine(stats) {
  if (!stats) return '';
  return Object.entries(stats).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' · ');
}

// ---------------- Character sheet ----------------
export function characterPanel() {
  const pts = statPointsAvailable();
  const statRows = Object.keys(STAT_INFO).map(key => `
    <div class="stat-row">
      <span class="stat-name">${key}</span>
      <span class="stat-value">${state.charStats[key]}</span>
      <span class="stat-desc">${STAT_INFO[key].desc}</span>
      ${pts > 0 ? `<button class="btn btn-sm btn-primary" data-act="alloc-stat" data-stat="${key}">+</button>` : ''}
    </div>`).join('');

  const skillRows = [...TRAINABLE_SKILLS, ...COMBAT_SKILLS].map(id => {
    const s = SKILLS[id];
    const pct = levelProgress(state.skills[id].xp) * 100;
    return `
      <div class="stat-row">
        <span style="width:24px">${s.icon}</span>
        <span style="width:110px">${s.name}</span>
        <span class="stat-value">Lv.${skillLevel(id)}</span>
        <span style="flex:1"><span class="xp-bar-outer" style="display:block"><span class="xp-bar-inner" style="display:block;width:${pct}%"></span></span></span>
      </div>`;
  }).join('');

  const st = state.stats;
  return `
    <div class="panel-header"><div class="panel-title">📜 Character Sheet</div></div>
    <div class="char-sheet" style="max-width:760px">
      <div class="char-sheet-header">
        <span>ADVENTURER — ${state.ascensions > 0 ? `ASCENDED ×${state.ascensions}` : 'MORTAL'}</span>
        <span>CHARACTER LV. ${charLevel()}</span>
      </div>
      ${titlePicker()}
      ${pts > 0 ? `<div class="stat-points-banner">◈ ${pts} UNSPENT STAT POINT${pts > 1 ? 'S' : ''} — the System awaits your choice</div>` : ''}
      ${statRows}
      <div class="char-sheet-header" style="margin-top:18px"><span>DERIVED</span></div>
      <div class="stat-row"><span class="stat-name">HP</span><span class="stat-value">${maxHp()}</span><span class="stat-desc">maximum hitpoints</span></div>
      <div class="stat-row"><span class="stat-name">HIT</span><span class="stat-value">${playerMaxHit()}</span><span class="stat-desc">max hit</span></div>
      <div class="stat-row"><span class="stat-name">ACC</span><span class="stat-value">${playerAccuracy()}</span><span class="stat-desc">accuracy rating</span></div>
      <div class="stat-row"><span class="stat-name">DEF</span><span class="stat-value">${playerDefenseRating()}</span><span class="stat-desc">defense rating (${Math.round(damageReduction() * 100)}% reduction)</span></div>
      <div class="stat-row"><span class="stat-name">XP×</span><span class="stat-value">${xpMultiplier().toFixed(2)}</span><span class="stat-desc">global XP multiplier</span></div>
      <div class="stat-row"><span class="stat-name">🪙×</span><span class="stat-value">${goldMultiplier().toFixed(2)}</span><span class="stat-desc">global gold multiplier</span></div>
      <div class="char-sheet-header" style="margin-top:18px"><span>SKILLS — TOTAL ${totalSkillLevel()}</span></div>
      ${skillRows}
      <div class="char-sheet-header" style="margin-top:18px"><span>CHRONICLE</span></div>
      <div class="stat-row"><span class="stat-desc">Kills: <b>${fmtInt(st.kills)}</b> · Boss kills: <b>${fmtInt(st.bossKills)}</b> · Deaths: <b>${fmtInt(st.deaths)}</b> · Highest hit: <b>${st.highestDamage}</b></span></div>
      <div class="stat-row"><span class="stat-desc">Actions performed: <b>${fmtInt(st.actions)}</b> · Items sold: <b>${fmtInt(st.itemsSold)}</b> · Lifetime gold: <b>🪙 ${fmt(state.lifetimeGold)}</b></span></div>
    </div>
  `;
}

function titlePicker() {
  const titles = unlockedTitles();
  const current = state.activeTitle;
  if (!titles.length) {
    return `<div class="muted" style="margin-bottom:10px">No titles earned yet — achievements grant them. The leaderboard shows your title beside your name.</div>`;
  }
  const options = ['<option value="">— no title —</option>']
    .concat(titles.map(t => `<option value="${t}" ${current === t ? 'selected' : ''}>${t}</option>`))
    .join('');
  return `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;font-family:var(--font-ui)">
      <span class="muted">Title:</span>
      ${current ? `<span class="rarity-legendary">"${current}"</span>` : '<span class="muted">none</span>'}
      <select id="title-select" style="background:var(--bg-deep);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:4px 8px">${options}</select>
    </div>`;
}

// ---------------- Ascension ----------------
export function ascensionPanel() {
  const shards = pendingShards();
  const total = totalSkillLevel();
  const ready = total >= ASCEND_MIN_TOTAL_LEVEL && shards > 0;

  const perkRows = PERKS.map(p => {
    const lvl = state.perks[p.id] || 0;
    const maxed = lvl >= p.maxLevel;
    const cost = perkCost(p, lvl);
    return `
      <div class="shop-row">
        <div style="font-size:22px">${p.icon}</div>
        <div class="shop-row-info">
          <div class="shop-row-title">${p.name}</div>
          <div class="shop-row-desc">${p.desc}</div>
        </div>
        <div class="shop-row-level">${lvl}/${p.maxLevel}</div>
        ${maxed ? '<span class="pill">MAX</span>'
          : `<button class="btn btn-sm ${state.shards >= cost ? 'btn-primary' : ''}" data-act="buy-perk" data-id="${p.id}" ${state.shards < cost ? 'disabled' : ''}>
               <span class="cost-shard">💠 ${cost}</span></button>`}
      </div>`;
  }).join('');

  const cycleNote = state.ending === 'broken'
    ? 'The loop is open now. Ascending is a choice, not a harvest — the System asks politely these days.'
    : state.ascensions > 0
      ? `This will be Cycle ${state.ascensions + 2}. You will remember. The world won't.`
      : 'The System calls this "a fresh start with benefits." It seems eager. Almost hungry.';

  return `
    <div class="panel-header"><div class="panel-title">💠 Ascension</div></div>
    <div class="panel-desc">Offer your progress back to the System and be reborn stronger. Skills, gold, items, gear, upgrades and hirelings reset — Fate Shards and Perks are forever. Each shard grants a permanent +2% XP and +2% gold.<br><i style="color:var(--sys-blue)">${cycleNote}</i></div>
    <div class="ascend-hero">
      <div class="muted" style="letter-spacing:2px">ASCENDING NOW YIELDS</div>
      <div class="ascend-shards-preview">💠 ${shards}</div>
      <div class="muted">Total skill level: ${total} ${total < ASCEND_MIN_TOTAL_LEVEL ? `— need ${ASCEND_MIN_TOTAL_LEVEL}` : ''} · Lifetime gold: 🪙 ${fmt(state.lifetimeGold)}</div>
      <div style="margin-top:16px">
        <button class="btn btn-danger" data-act="ascend" ${ready ? '' : 'disabled'}>☄️ ASCEND</button>
      </div>
      ${state.ascensions > 0 ? `<div class="muted" style="margin-top:10px">Ascensions so far: ${state.ascensions} · Shards held: 💠 ${state.shards}</div>` : ''}
    </div>
    <div class="section-title">◈ Fate Perks</div>
    ${perkRows}
  `;
}

// ---------------- Settings ----------------
function accountSection() {
  if (cloud.status === 'unavailable') {
    return `
      <div class="card">
        <div class="card-title">☁️ Cloud sync unavailable</div>
        <div class="card-sub">No backend is reachable, so progress stays in this browser only.
        Run <code>vercel dev</code> locally, or deploy to Vercel with OAuth + a database configured,
        to sync saves and join the leaderboards.</div>
      </div>`;
  }

  if (cloud.status === 'signed-in' && cloud.user) {
    const u = cloud.user;
    const avatar = u.avatar
      ? `<img src="${u.avatar}" alt="" width="42" height="42" style="border-radius:50%;border:1px solid var(--border-bright)">`
      : '<div style="font-size:30px">🧙</div>';
    const synced = cloud.lastSync
      ? `Last synced ${new Date(cloud.lastSync).toLocaleTimeString()}`
      : 'Not synced yet this session';
    return `
      <div class="shop-row" style="border-color:var(--sys-blue)">
        ${avatar}
        <div class="shop-row-info">
          <div class="shop-row-title">${u.name} <span class="pill">${u.provider}</span></div>
          <div class="shop-row-desc">${synced}${cloud.lastError ? ` · <span style="color:var(--danger)">${cloud.lastError}</span>` : ''}</div>
        </div>
        <button class="btn btn-sm btn-primary" data-act="cloud-sync">⟳ Sync now</button>
        <button class="btn btn-sm" data-act="cloud-signout">Sign out</button>
      </div>
      <div class="muted" style="margin-top:8px">Your save uploads every 60 seconds and when you leave the tab.</div>`;
  }

  const buttons = cloud.providers.map(p => {
    const label = p === 'github' ? '🐙 Sign in with GitHub'
                : p === 'google' ? '🔵 Sign in with Google'
                : `Sign in with ${p}`;
    return `<button class="btn btn-primary" data-act="cloud-signin" data-provider="${p}">${label}</button>`;
  }).join(' ');

  return `
    <div class="card">
      <div class="card-title">☁️ Cloud saves & leaderboards</div>
      <div class="card-sub">Sign in to carry your progress between devices and appear in the global rankings.
      Your local save is never deleted by signing in — if the two differ, you get to choose.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${buttons || `
        <span class="muted">The backend is reachable, but no sign-in provider is configured yet.
        Set <code>GITHUB_CLIENT_ID</code>/<code>GITHUB_CLIENT_SECRET</code> or the Google pair in your
        Vercel environment variables, then redeploy.</span>`}</div>
    </div>`;
}

export function settingsPanel() {
  return `
    <div class="panel-header"><div class="panel-title">⚙️ Settings</div></div>
    <div class="section-title">Account</div>
    ${accountSection()}
    <div class="section-title">Save management</div>
    <div class="panel-desc">The game autosaves every 10 seconds and on close. Offline progress accrues for up to ${offlineCapHours()}h.</div>
    <div style="display:flex; gap:8px; margin-bottom:10px">
      <button class="btn btn-sm" data-act="export-save">📤 Export save</button>
      <button class="btn btn-sm" data-act="import-save">📥 Import save</button>
      <button class="btn btn-sm btn-danger" data-act="hard-reset">💀 Hard reset</button>
    </div>
    <textarea class="save-io" id="save-io" placeholder="Exported saves appear here. Paste a save string here, then press Import."></textarea>
    <div class="section-title">About</div>
    <div class="panel-desc">
      RUNEBOUND — an idle LitRPG. Train skills, slay monsters, hoard gear, ascend, repeat.<br>
      Inspired by Melvor Idle's skill grind, AdVenture Capitalist's escalating buys, and every
      "I woke up with a blue status screen" novel ever written.
    </div>
  `;
}
