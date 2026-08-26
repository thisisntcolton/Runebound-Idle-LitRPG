// ============================================================
// PANEL BUILDERS — return HTML strings for each view
// ============================================================
import { state, skillLevel, actionTime, doubleChance, hirelingRate,
         charLevel, totalSkillLevel, combatLevel, statPointsAvailable,
         gearStats, maxHp, playerAccuracy, playerMaxHit, playerMinHit, playerDefenseRating,
         damageReduction, xpMultiplier, goldMultiplier, pendingShards,
         ASCEND_MIN_TOTAL_LEVEL, offlineCapHours,
         hitChanceVs, expectedDps, timeToKill, attackInterval, BALANCE } from '../core/state.js';
import { SKILLS, TRAINABLE_SKILLS, COMBAT_SKILLS, getAction } from '../data/skills.js';
import { ZONES, getZone, getMonster } from '../data/monsters.js';
import { deepView } from '../systems/deep.js';
import { bossView } from '../systems/worldboss.js';
import { getDungeon, totalWaves } from '../data/dungeons.js';
import { displayOdds, ROLLS_PER_PROFILE } from '../data/loot.js';
import { dropRateMultiplier, levelCap } from '../core/state.js';
import { abilityStatus } from '../systems/abilities.js';
import { currentMonster } from '../systems/combat.js';
import { activeRun as unstableRun, UNSTABLE } from '../systems/unstable.js';
import { heroBust } from './heroart.js';
import { currentClass } from '../systems/classes.js';
import { persistenceBlock } from './classes.js';
import { activeCamp } from '../systems/repo.js';
import { enchantCost, canEnchant, MAX_ENCHANT } from '../systems/enchant.js';
import { unlockedTitles } from '../systems/achievements.js';
import { ITEMS, getItem, EQUIP_SLOTS } from '../data/items.js';
import { UPGRADES, HIRELINGS, PERKS, upgradeCost, perkCost } from '../data/upgrades.js';
import { STAT_INFO } from '../systems/character.js';
import { hirelingProgress, hirelingTask, stealRisk } from '../systems/skills.js';
import { cloud } from '../core/cloud.js';
import { levelForXp, xpForLevel, levelProgress, MAX_LEVEL, SOFT_CAP } from '../core/xp.js';
import { fmt, fmtInt, fmtDuration } from '../core/format.js';

const rarityCls = item => `rarity-${item.rarity}`;
const borderCls = item => `border-${item.rarity}`;

function xpBarBlock(skillId) {
  const xp = state.skills[skillId].xp;
  const trueLvl = levelForXp(xp);
  const cap = levelCap();
  const lvl = Math.min(trueLvl, cap);
  // Held at the sandbox ceiling: the XP is still going in, it is simply
  // not being allowed to become levels yet. Say so — silent loss is the
  // one thing this must not look like.
  const held = trueLvl > cap;
  const pct = held ? 100 : levelProgress(xp) * 100;
  // Saying the XP is held was already true; it was not useful. A player
  // who cannot act on a message reads it as a bug report about their own
  // save. So the ceiling now names the thing that lifts it.
  const label = held
    ? `CEILING — ${fmtInt(xp - xpForLevel(cap))} XP banked past Lv. ${cap}. It is being counted. It is not being applied. `
      + `<span class="ceiling-key">The ceiling belongs to this place, not to you. Break the cycle and it comes off.</span>`
    : lvl >= MAX_LEVEL
      ? `MAX LEVEL — ${fmtInt(xp)} XP`
      : `${fmtInt(xp - xpForLevel(lvl))} / ${fmtInt(xpForLevel(lvl + 1) - xpForLevel(lvl))} XP to Lv. ${lvl + 1}`;
  return `
    <div class="xp-bar-outer ${held ? 'held' : ''}"><div class="xp-bar-inner" id="panel-xp-bar" style="width:${pct}%"></div></div>
    <div class="xp-bar-label" id="panel-xp-label">${label}</div>`;
}

// ---------------- Skill panel ----------------
export function skillPanel(skillId) {
  const skill = SKILLS[skillId];
  const lvl = skillLevel(skillId);
  const act = state.activity;

  // Actions past the sandbox ceiling do not exist in there. Showing them
  // greyed out with "Requires Lv. 105" would answer the question the
  // whole second band is built to ask, months before it is asked.
  const visibleActions = skill.actions.filter(a => a.level <= levelCap());
  const cards = visibleActions.map(a => {
    const unlocked = lvl >= a.level;
    const isActive = act?.type === 'skill' && act.skillId === skillId && act.actionId === a.id;
    const time = actionTime(skillId, a);
    // (skill actions below)
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

    // Thieving prints its odds. A hidden risk that occasionally eats your
    // session reads as the game cheating; the same risk on the card reads
    // as a decision you made.
    const risk = skillId === 'thieving' ? stealRisk(a.id) : null;
    const riskLine = risk ? `
      <div class="card-sub risk-line">
        <span class="${risk.chance > 0.12 ? 'risk-high' : risk.chance > 0.06 ? 'risk-mid' : 'risk-low'}">
          ⚠ ${(risk.chance * 100).toFixed(1)}% caught</span>
        <span class="muted">— ${risk.guard.icon} ${risk.guard.name}${
          risk.chance > risk.floor + 0.0005
            ? `, easing to ${(risk.floor * 100).toFixed(1)}% as you improve`
            : ', and this is as quiet as you will ever be'}</span>
      </div>` : '';

    return `
      <div class="card clickable ${unlocked ? '' : 'locked'} ${isActive ? 'active-card' : ''}"
           ${unlocked ? `data-act="${isActive ? 'stop-activity' : 'start-action'}" data-skill="${skillId}" data-action="${a.id}"` : ''}>
        <div class="card-title"><span class="card-icon">${a.icon}</span> ${a.name}</div>
        <div class="card-sub">${unlocked ? `${(time / 1000).toFixed(1)}s per action` : `<span class="lock-req">Requires Lv. ${a.level}</span>`}</div>
        ${inputs ? `<div class="card-sub">${inputs}</div>` : ''}
        ${riskLine}
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
        <div class="skill-level-big">Lv. ${lvl} / ${levelCap()}${
          lvl > SOFT_CAP ? ' <span class="pill" style="border-color:var(--shard);color:var(--shard)">past the ceiling</span>' : ''}</div>
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
  const skill = SKILLS[h.skill];
  const prog = lvl > 0 ? hirelingProgress(h.skill) : null;
  const currentTask = hirelingTask(h.skill);

  // Task picker — only actions the skill level allows
  const taskOptions = skill.actions.filter(a => a.level <= levelCap()).map(a => {
    const locked = skillLevel(h.skill) < a.level;
    return `<option value="${a.id}" ${a.id === currentTask ? 'selected' : ''} ${locked ? 'disabled' : ''}>
      ${a.icon} ${a.name}${locked ? ` (Lv.${a.level})` : ''}</option>`;
  }).join('');

  return `
    <div class="shop-row" style="border-color: rgba(245,197,66,0.35); flex-wrap:wrap">
      <div style="font-size:22px">${h.icon}</div>
      <div class="shop-row-info">
        <div class="shop-row-title">${h.name} ${lvl > 0 ? `<span class="pill">working at ${Math.round(rate * 100)}%</span>` : ''}</div>
        <div class="shop-row-desc">${h.flavor} ${lvl === 0 ? '— hire to train this skill passively, even while you do other things.' : ''}</div>
        ${lvl > 0 ? `
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">
            <span class="muted">Farming:</span>
            <select class="hireling-task" data-skill="${h.skill}"
                    style="background:var(--bg-deep);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:3px 8px">
              ${taskOptions}
            </select>
            ${prog ? `<span class="muted">one every ${(prog.effectiveMs / 1000).toFixed(0)}s</span>` : ''}
          </div>
          ${prog ? `
            <div class="action-bar-outer" style="margin-top:8px">
              <div class="action-bar-inner hireling-bar" data-skill="${h.skill}" style="width:${prog.pct * 100}%;background:linear-gradient(90deg,#b8912c,var(--gold))"></div>
            </div>
            <div class="muted" style="font-size:11px;margin-top:3px">${prog.action.icon} ${prog.action.name} — working…</div>`
           : '<div class="lock-req" style="margin-top:6px">Your level is too low for the selected task.</div>'}
        ` : ''}
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
  if (inCombat && (rift || c.unstable || c.deep || c.worldBoss || c.guard || (c.zoneId && c.monsterId))) {
    const monster = currentMonster();
    const mhp = Math.max(0, c.monsterHp);
    const php = Math.max(0, c.playerHp);
    const cap = maxHp();
    // An Unstable Rift has no dungeon record: its waves are generated, the
    // clock is the threat, and the panel needs to say all of that.
    const run = c.unstable ? unstableRun() : null;
    const unstableBanner = run ? `
      <div class="stat-points-banner unstable-card" style="display:block">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <span>🌀 UNSTABLE RIFT — WAVE ${run.waves + 1} / ${UNSTABLE.SEAL_WAVES}</span>
          <span style="display:flex;gap:4px">${Array.from({ length: UNSTABLE.SEAL_WAVES }, (_, i) =>
            `<span style="width:12px;height:8px;border-radius:3px;background:${i < run.waves ? 'var(--xp)' : i === run.waves ? 'var(--danger)' : 'var(--bg-card)'}"></span>`).join('')}</span>
          <span style="font-family:var(--font-mono)">${Math.ceil(run.remaining / 1000)}s left</span>
        </div>
        <div class="action-bar-outer" style="margin-top:8px">
          <div class="action-bar-inner" id="unstable-timer"
               style="width:${Math.max(0, run.remaining / UNSTABLE.DURATION_MS * 100)}%;background:var(--danger)"></div>
        </div>
        <div class="muted" style="margin-top:6px">Seal it by clearing ${UNSTABLE.SEAL_WAVES} waves before the clock runs out.
          Flee or fail and Hearthwick takes the raid.</div>
      </div>` : '';
    const guardBanner = c.guard ? `
      <div class="stat-points-banner" style="display:block;border-color:var(--gold)">
        <div><b>🗝️ CAUGHT IN THE ACT</b> — ${c.guard.icon} ${c.guard.name}</div>
        <div class="muted" style="margin-top:6px;font-style:italic">${c.guard.line || ''}</div>
        <div class="muted" style="margin-top:4px">Win and you keep what you lifted and take their purse.
          Lose and you drop the haul and walk away wounded — no gold, no XP, nothing else.
          ${c.guardResume ? 'Either way you go straight back to work.' : ''}</div>
      </div>` : '';
    const bv = c.worldBoss ? bossView() : null;
    const bossBanner = bv ? `
      <div class="stat-points-banner" style="display:block;border-color:var(--hp)">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <span>${bv.def.icon} ${bv.def.name.toUpperCase()} — PREPARATION LOCKED AT ×${(1 + bv.prep.locked).toFixed(2)}</span>
          <span style="font-family:var(--font-mono)">in contact ${Math.round(bv.contact)}s · ${fmt(Math.ceil(bv.hp))} left</span>
        </div>
        <div class="action-bar-outer" style="margin-top:8px">
          <div class="action-bar-inner" style="width:${bv.pct * 100}%;background:var(--hp)"></div>
        </div>
        <div class="muted" style="margin-top:6px">The aura compounds for as long as you hold contact and
          it wins eventually. Back out when it starts to bite — every point you have landed is banked
          in the save and will still be off it when you come back.</div>
      </div>` : '';
    const dv = c.deep ? deepView() : null;
    const deepBanner = dv ? `
      <div class="stat-points-banner" style="display:block;border-color:var(--danger)">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <span>⬇️ THE DESCENT — FLOOR ${dv.depth}${dv.warden ? ' · WARDEN' : ''} · ${dv.stratum.name}</span>
          <span style="font-family:var(--font-mono)">${dv.clears} / ${dv.need} held</span>
        </div>
        <div class="action-bar-outer" style="margin-top:8px">
          <div class="action-bar-inner" style="width:${(dv.clears / dv.need) * 100}%;background:var(--danger)"></div>
        </div>
        <div class="muted" style="margin-top:6px">${dv.depth > dv.best
          ? 'Hold this floor and the next one opens. Deepest reach so far: ' + dv.best + '.'
          : 'This floor is already held. You are here for the pay.'}</div>
      </div>` : '';
    const riftBanner = rift ? `
      <div class="stat-points-banner" style="display:flex;justify-content:space-between;align-items:center">
        <span>🌀 ${rift.name} — WAVE ${(c.wave || 0) + 1} / ${totalWaves(rift)}</span>
        <span style="display:flex;gap:4px">${Array.from({ length: totalWaves(rift) }, (_, i) =>
          `<span style="width:14px;height:8px;border-radius:3px;background:${i < (c.wave || 0) ? 'var(--xp)' : i === (c.wave || 0) ? 'var(--sys-blue)' : 'var(--bg-card)'}"></span>`).join('')}</span>
      </div>` : '';
    arena = monster ? `
      ${unstableBanner}
      ${guardBanner}
      ${bossBanner}
      ${deepBanner}
      ${riftBanner}
      <div class="combat-arena">
        <div class="combatant player-side" id="player-box">
          <div class="combatant-name">${state.look?.name || 'You'}</div>
          <div class="combatant-level">Combat Lv. ${cl}${currentClass() ? ` · ${currentClass().icon} ${currentClass().name}` : ''}</div>
          <div class="combatant-icon">${heroBust(state.look, 66)}</div>
          <div class="hp-bar-outer">
            <div class="hp-bar-inner" id="player-hp-bar" style="width:${php / cap * 100}%"></div>
            <div class="hp-bar-text" id="player-hp-text">${Math.ceil(php)} / ${cap}</div>
          </div>
          <div class="attack-timer-outer"><div class="attack-timer-inner" id="player-atk-timer"></div></div>
        </div>
        <div class="vs-divider">VS</div>
        <div class="combatant enemy-side" id="monster-box">
          <div class="combatant-name">${monster.name}${monster.boss ? ' 👑' : ''}</div>
          <div class="combatant-level">${monster.level ? `Lv. ${monster.level}` : (run ? `Rift-spawn · wave ${run.waves + 1}` : rift ? 'Rift-spawn' : '')}</div>
          <div class="combatant-icon">${monster.icon}</div>
          <div class="hp-bar-outer">
            <div class="hp-bar-inner" id="monster-hp-bar" style="width:${mhp / monster.hp * 100}%"></div>
            <div class="hp-bar-text" id="monster-hp-text">${Math.ceil(mhp)} / ${monster.hp}</div>
          </div>
          <div class="attack-timer-outer"><div class="attack-timer-inner" id="monster-atk-timer"></div></div>
        </div>
      </div>` : '';
  }

  const foods = Object.entries(state.inventory)
    .map(([id, qty]) => ({ item: getItem(id), qty }))
    .filter(x => x.item?.type === 'food');
  const foodOptions = ['<option value="">— no food —</option>']
    .concat(foods.map(f => `<option value="${f.item.id}" ${c.foodItem === f.item.id ? 'selected' : ''}>${f.item.name} ×${f.qty} (heals ${f.item.heal})</option>`))
    .join('');

  // Ability loadout bar — cooldowns tick live, Strike can be fired manually
  const abilBar = abilityStatus().filter(s => s.unlocked && s.ability).map(s => {
    const pct = s.ability.cooldown ? (1 - s.cooldown / s.ability.cooldown) * 100 : 100;
    return `
      <div class="ability-chip ${s.ready ? 'ready' : ''}" ${s.slot.id === 'strike' && s.ready ? 'data-act="fire-ability"' : ''}
           title="${s.ability.name} — ${s.ability.desc}">
        <span>${s.ability.icon}</span>
        <span>${s.ability.name}</span>
        <span class="ability-cd"><span class="ability-cd-fill" style="width:${pct}%"></span></span>
        ${s.slot.id === 'strike' && s.ready ? '<span class="muted" style="font-size:10px">click</span>' : ''}
      </div>`;
  }).join('');

  const styles = ['attack', 'strength', 'defense'].map(s => `
    <button class="btn btn-sm style-btn ${c.style === s ? 'selected' : ''}" data-act="set-style" data-style="${s}">
      ${SKILLS[s].icon} ${SKILLS[s].name} <span class="muted">Lv.${skillLevel(s)}</span>
    </button>`).join('');

  // The Syndicate camp is not a place on the map. It exists only while they
  // are holding something of yours, and it disappears the moment you have
  // it back, so it never sits in the zone list as dead content.
  const visibleZones = ZONES.filter(z => z.id !== 'repo_camp' || activeCamp());
  const zonePills = visibleZones.map(z => {
    const unlocked = cl >= z.level;
    const sel = ui.selectedZone === z.id;
    return `<button class="btn btn-sm ${sel ? 'btn-primary' : ''}" data-act="select-zone" data-zone="${z.id}" ${unlocked ? '' : 'disabled'}>
      ${z.icon} ${z.name} ${unlocked ? '' : `<span class="lock-req">Lv.${z.level}</span>`}</button>`;
  }).join(' ');

  const monsterCards = selectedZone ? selectedZone.monsters.map(m => {
    const fighting = inCombat && c.zoneId === selectedZone.id && c.monsterId === m.id;
    const hc = hitChanceVs(m.defense) * 100;
    const ttk = timeToKill(m.hp, m.defense);
    // colour the hit chance so bad matchups are obvious at a glance
    const hcColor = hc >= 75 ? 'var(--xp)' : hc >= 55 ? 'var(--gold)' : 'var(--danger)';
    // Rarity odds AFTER luck is applied — this is what LUK actually moves.
    const odds = displayOdds(m.lootProfile || 'trash', dropRateMultiplier() - 1);
    const oddsStr = odds
      .filter(o => o.pct >= 0.005 && (m.loot?.[o.tier]?.length || o.tier === 'common'))
      .map(o => `<span class="rarity-${o.tier}">${o.pct >= 1 ? o.pct.toFixed(0) : o.pct.toFixed(2)}%</span>`)
      .join(' / ');
    const rolls = ROLLS_PER_PROFILE[m.lootProfile || 'trash'] || 1;
    return `
      <div class="card clickable ${fighting ? 'active-card' : ''}" data-act="${fighting ? 'stop-combat' : 'fight'}" data-zone="${selectedZone.id}" data-monster="${m.id}">
        <div class="card-title"><span class="card-icon">${m.icon}</span> ${m.name}${m.boss ? ' 👑' : ''}</div>
        <div class="card-sub">Lv. ${m.level} · ${fmt(m.hp)} HP · 🛡 ${m.defense} def · hits up to ${m.maxHit}</div>
        <div class="card-sub">
          <span style="color:${hcColor}">🎯 you hit ${hc.toFixed(0)}%</span> ·
          ⏱ ~${ttk < 1 ? '<1' : ttk.toFixed(0)}s to kill
        </div>
        <div class="card-sub" title="Common / Uncommon / Rare / Epic / Legendary — shifts with your Luck">
          🎁 ${oddsStr}${rolls > 1 ? ` <span class="muted">×${rolls} rolls</span>` : ''}
        </div>
        <div class="card-yield">
          <span class="yield-gold">🪙 ${m.gold[0]}–${m.gold[1]}</span>
          <span class="muted">${m.lootProfile || 'trash'}</span>
        </div>
        ${fighting ? '<div class="working-dot"></div>' : ''}
      </div>`;
  }).join('') : '';

  // Your own combat readout — the numbers that were previously invisible
  const refDef = selectedZone ? selectedZone.monsters[0].defense : 0;
  const statBar = `
    <div class="shop-row" style="border-color:var(--border-bright);gap:22px;flex-wrap:wrap">
      <div><div class="muted">DAMAGE</div><div class="shop-row-title">${playerMinHit()}–${playerMaxHit()}</div></div>
      <div><div class="muted">ACCURACY</div><div class="shop-row-title">${playerAccuracy()}</div></div>
      <div><div class="muted">SPEED</div><div class="shop-row-title">${(attackInterval() / 1000).toFixed(1)}s</div></div>
      <div><div class="muted">DPS vs ${selectedZone ? selectedZone.monsters[0].name : 'target'}</div>
           <div class="shop-row-title" style="color:var(--gold)">${expectedDps(refDef).toFixed(1)}</div></div>
      <div><div class="muted">MAX HP</div><div class="shop-row-title">${maxHp()}</div></div>
      <div><div class="muted">DMG REDUCTION</div><div class="shop-row-title">${Math.round(damageReduction() * 100)}%</div></div>
    </div>`;

  return `
    <div class="panel-header">
      <div class="panel-title">⚔️ Combat</div>
      <div class="panel-subtitle">Combat Lv. ${cl}</div>
    </div>
    <div class="panel-desc">Choose a hunting ground. Your hero fights automatically — keep food equipped or the System will be writing your obituary.</div>
    ${statBar}
    ${abilBar ? `<div class="ability-bar">${abilBar}</div>` : ''}
    <div class="section-title" style="margin:14px 0 6px">🎁 Recent drops</div>
    <div class="drop-feed" id="drop-feed"></div>
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
      <button class="btn btn-sm btn-gold" data-act="sell-resources">Sell all resources &amp; spoils</button>
      <span class="muted" style="align-self:center">Keeps food, gear, runes in progress and eggs. Click an item for options.</span>
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
        <div class="shop-row-desc">${statLine(e.item.stats)} · ${e.item.slot}${e.item.stats?.str
          ? ` · <span style="color:var(--gold)">+${Math.floor(e.item.stats.str * BALANCE.MAXHIT_PER_GEAR_STR)} max hit</span>` : ''}</div>
      </div>
      <button class="btn btn-sm btn-primary" data-act="equip-item" data-item="${e.item.id}">Equip</button>
    </div>`).join('') : '<div class="muted">No equipment in your bags. Forge some at the smithy, or take it from something\'s corpse.</div>';

  return `
    <div class="panel-header"><div class="panel-title">🛡️ Equipment</div></div>
    <div class="equip-layout">
      <div class="equip-slots">${slotEls}</div>
      <div class="gear-stats-box">
        <div class="char-sheet">
          <div class="char-sheet-header"><span>GEAR TOTALS</span><span>WHAT IT ACTUALLY DOES</span></div>
          <div class="stat-row"><span class="stat-name">ATK</span><span class="stat-value">+${gear.atk}</span>
            <span class="stat-desc">accuracy ${playerAccuracy() - gear.atk} → <b>${playerAccuracy()}</b></span></div>
          <div class="stat-row"><span class="stat-name">STR</span><span class="stat-value">+${gear.str}</span>
            <span class="stat-desc">+${Math.floor(gear.str * BALANCE.MAXHIT_PER_GEAR_STR)} max hit (${BALANCE.MAXHIT_PER_GEAR_STR} per point)</span></div>
          <div class="stat-row"><span class="stat-name">DEF</span><span class="stat-value">+${gear.def}</span>
            <span class="stat-desc">defense rating ${playerDefenseRating()} → ${Math.round(damageReduction() * 100)}% reduction</span></div>
          <div class="stat-row"><span class="stat-name">HP</span><span class="stat-value">+${gear.hp}</span>
            <span class="stat-desc">max HP <b>${maxHp()}</b></span></div>
          <div class="stat-row"><span class="stat-name">DMG</span><span class="stat-value">${playerMinHit()}–${playerMaxHit()}</span>
            <span class="stat-desc">your current damage range</span></div>
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
    const pct = levelForXp(state.skills[id].xp) > levelCap() ? 100 : levelProgress(state.skills[id].xp) * 100;
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
    <div class="panel-header">
      <div class="panel-title">📜 ${state.look?.name || 'Character Sheet'}</div>
      <div class="panel-subtitle">${currentClass() ? `${currentClass().icon} ${currentClass().name}` : 'No path chosen'}</div>
    </div>
    <div class="char-hero-row">
      <div class="char-hero-art">${heroBust(state.look, 120)}</div>
      <div class="muted" style="flex:1;min-width:200px">
        ${currentClass()
          ? `<b>${currentClass().signature.icon} ${currentClass().signature.name}</b> — ${currentClass().signature.desc}`
          : 'Reach character level 10 to choose a path.'}
        <div style="margin-top:8px"><button class="btn btn-sm" data-act="nav" data-view="look">🪞 Change appearance</button></div>
      </div>
    </div>
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
      <div class="stat-row"><span class="stat-name">DMG</span><span class="stat-value">${playerMinHit()}–${playerMaxHit()}</span><span class="stat-desc">damage range per landed hit (every swing rolls in here)</span></div>
      <div class="stat-row"><span class="stat-name">ACC</span><span class="stat-value">${playerAccuracy()}</span><span class="stat-desc">accuracy — vs 10 defense you land ${Math.round(hitChanceVs(10) * 100)}% of swings</span></div>
      <div class="stat-row"><span class="stat-name">SPD</span><span class="stat-value">${(attackInterval() / 1000).toFixed(1)}s</span><span class="stat-desc">seconds between swings</span></div>
      <div class="stat-row"><span class="stat-name">DEF</span><span class="stat-value">${playerDefenseRating()}</span><span class="stat-desc">defense rating (${Math.round(damageReduction() * 100)}% damage reduction)</span></div>
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
/**
 * The way onward.
 *
 * The single most important transition in the game sat behind an unmarked
 * boss kill and a modal you could decline without knowing what you had
 * declined — and the offer only returns once per cycle, so declining it
 * once cost you a whole run's worth of not knowing. A player four cycles
 * deep, staring at a level cap they cannot move and content they cannot
 * see, was given nothing to act on anywhere in the game.
 *
 * This says it, and only once it is true: it appears at the cycle count
 * where the choice actually becomes available. Before that it would be a
 * spoiler; after that, withholding it is just cruelty.
 */
function wayOnwardBlock() {
  if ((state.era || 1) >= 2) return '';
  if ((state.ascensions || 0) < 4) return '';
  const takenThisCycle = state.endingOfferedCycle === state.ascensions;
  return `
    <div class="way-onward">
      <div class="way-onward-title">◈ There is a way out of the loop</div>
      <div class="way-onward-body">
        You have gone round four times. That was the requirement, though nothing said so.
        <b>Defeat Aurelion, the Last Flame</b> in the Dragonspire and the System will put a
        choice in front of you: renew the seal, or break it.
        <br><br>
        <b>Feeding the flame</b> pays five Fate Shards and keeps everything exactly as it is —
        including the ceiling on every one of your skills, and the content behind it.
        <b>Breaking the cycle</b> is the way forward. It is the only way forward.
        ${takenThisCycle
          ? `<br><br><span class="way-onward-warn">⚠ You have already been offered the choice this cycle.
             If you fed the flame, the offer returns after your next Ascension.</span>`
          : ''}
      </div>
    </div>`;
}

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
    ${wayOnwardBlock()}
    <div class="section-title">💠 What you keep</div>
    <div class="muted" style="margin-bottom:12px">
      Ascension is a reset, not a deletion. Everything on the left comes with you — including,
      in full, every talent point and rank in every class tree you have ever touched.
    </div>
    ${persistenceBlock({ compact: true })}

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
