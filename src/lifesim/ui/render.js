import {pathType,requirement} from '../data/progression.js';
import {PATHS} from '../data/paths.js';
import {paths,districts,netWorth} from '../systems/paths.js';
import { SAGAS } from '../data/sagas.js';
import { journal, eligible, startSaga, openSaga } from '../systems/sagas.js';
import { picture } from './art.js';
import { ambition, level, SKILLS, CARS, PROPERTIES, BUSINESSES, PROJECTS, LIFESTYLES, extraFinance } from '../systems/ambition.js';
import { startEncounter, chooseEncounter, dueThread, openThread } from '../systems/dialogue.js';
import { encounterHTML } from './encounter.js';
import { homeScene } from './home.js';
let homeRoom='bedroom', homeObject='bed';
import { townMap, locationScene, avatar } from './town.js';
import { initLife, lifeOptions, finance, housingCosts } from '../systems/life.js';
import { performLifeOption, traitPassives } from '../systems/lifecycle.js';
import { HOMES, CONDITIONS } from '../data/life.js';
let lifeTab='map';
// ============================================================
// LINEAGE — DOM Renderer & Event Delegation (3-Beat Energy System)
// ============================================================
import { state, stageForAge } from '../core/state.js';
import { exportSaveString, importSaveString, resetAllData } from '../core/save.js';
import { getBackground, getTrait } from '../data/traits.js';
import { PRESET_ROUTINES, getActionById } from '../data/actions.js';
import {
  ensureDraft,
  rerollDraft,
  startLifeFromDraft,
  finishYearAndAgeUp,
  performEnergyAction,
  canPerformAction,
  runActionRoutine,
  saveCurrentAsRoutine,
  deleteCustomRoutine,
  getActionsForCharacter,
  strainOutlook,
  computeYearEnergyPool,
  getActiveEvent,
  resolveChoice,
  yearlyCashDelta,
  continueAsHeir,
  beginNewDynasty,
} from '../systems/lifecycle.js';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function fmtMoney(n) {
  const num = Math.round(Number(n) || 0);
  return num < 0 ? `-$${Math.abs(num).toLocaleString()}` : `$${num.toLocaleString()}`;
}

function renderTraitChip(tr) {
  if (!tr) return '';
  return `
    <span class="trait-chip has-tip" tabindex="0">
      ${esc(tr.name)}
      <span class="tip-card">
        <div class="tip-title">${esc(tr.name)}</div>
        <div class="tip-desc">${esc(tr.desc)}</div>
        <div class="tip-effects">${esc(tr.effectsSummary || '')}</div>
      </span>
    </span>
  `;
}

export function showDeltas(deltas = {}) {
  const layer = document.getElementById('ls-toast-layer');
  if (!layer) return;
  const labels = {
    health: 'Health',
    happiness: 'Happiness',
    smarts: 'Smarts',
    looks: 'Looks',
    money: 'Cash',
  };
  for (const [k, v] of Object.entries(deltas)) {
    if (!v) continue;
    const chip = document.createElement('div');
    chip.className = `ls-toast ${v > 0 ? 'pos' : 'neg'}`;
    const txt = k === 'money'
      ? `${v > 0 ? '+' : ''}${fmtMoney(v)}`
      : `${v > 0 ? '+' : ''}${v} ${labels[k] || k}`;
    chip.textContent = txt;
    layer.appendChild(chip);
    setTimeout(() => chip.remove(), 1850);
  }
}

export function renderAll() {
  renderTopbar();
  renderSidebar();
  renderStage();
  renderLog();
  if(state.character?.encounter){const bd=document.getElementById('ls-modal-backdrop');document.getElementById('ls-modal-box').innerHTML=encounterHTML(state.character,esc);bd.classList.remove('hidden');}
}

function renderTopbar() {
  const el = document.getElementById('ls-header-summary');
  if (!el) return;
  const gen = state.dynasty?.generation || 1;
  const c = state.character;
  if (!c) {
    el.innerHTML = `<span class="ls-pill gen">Generation ${gen}</span><span class="ls-dim-tag">Creating Character…</span>`;
    return;
  }
  el.innerHTML = `
    <span class="ls-pill gen">Gen ${gen} · ${esc(c.lastName)} Family</span>
    <span class="ls-pill">📅 ${c.year} · Age ${c.age} (${esc(c.stage)})</span>
    <span class="ls-pill energy-header-pill" aria-label="Energy remaining">⚡ <strong>${c.energy ?? 0}/${c.energyMax ?? 0}</strong> Energy</span>
    <span class="ls-pill money">💵 ${fmtMoney(c.money)}</span>
  `;
}

function renderSidebar() {
  const sb = document.getElementById('ls-sidebar');
  if (!sb) return;

  const c = state.character;
  if (!c) {
    sb.innerHTML = `
      <div class="ls-panel-header"><span>👤 CHARACTER</span></div>
      <p style="font-size:13.5px;color:var(--text-dim);line-height:1.55;">
        Roll or customize your founder in the center panel to begin Generation 1.
        Hover any trait or family background to inspect how it affects your stats, yearly Energy pool, and Strain recovery.
      </p>
    `;
    return;
  }

  const bg = getBackground(c.backgroundId);
  const cashDelta = yearlyCashDelta(c);
  const outlook = strainOutlook(c);
  const bars = [
    { key: 'health', label: '❤️ Health', val: c.stats.health, tip: 'Low Health shrinks your yearly Energy pool; 0% is fatal.' },
    { key: 'happiness', label: '😊 Happiness', val: c.stats.happiness, tip: 'Drifts gently toward your personal baseline (~64% ± traits & milestones).' },
    { key: 'smarts', label: '🧠 Smarts', val: c.stats.smarts, tip: 'Boosts adult income & exam odds. Diminishing returns above 75%; exceptional scores require yearly maintenance.' },
    { key: 'looks', label: '✨ Looks', val: c.stats.looks, tip: 'Exceptional scores require yearly maintenance; aging adds further decline.' },
  ];

  const promos = c.progress?.promotions || 0;
  const activeFlags = [];
  if (promos > 0) activeFlags.push(`🏆 Promoted ×${promos}`);
  if (c.flags.honor_scholar) activeFlags.push('🎖️ Honor Scholar');
  if (c.flags.degree) activeFlags.push('🎓 University Grad');
  if (c.flags.trade_cert) activeFlags.push('🔧 Certified Tradesperson');
  if (c.flags.strong_circle) activeFlags.push('🤝 Close Circle');
  if (c.flags.has_partner) activeFlags.push('💍 Partnered');
  if (c.flags.homeowner) activeFlags.push('🏡 Homeowner');
  if (c.flags.business_founder) activeFlags.push('🚀 Founder');
  if (c.flags.gentry_network) activeFlags.push('🥂 Founders’ Network');
  if (c.flags.family_deli) activeFlags.push('🏪 Family Deli');
  if (c.flags.shop_dividend) activeFlags.push('🔩 Garage Partner');
  if (c.flags.indie_royalties) activeFlags.push('🎵 Vinyl Royalties');
  if (c.children?.length) activeFlags.push(`👶 ${c.children.length} Child${c.children.length > 1 ? 'ren' : ''}`);

  sb.innerHTML = `
    <div class="ls-panel-header">
      <span>👤 PROFILE</span>
      <span class="strain-badge ${outlook.tone} has-tip" tabindex="0">
        ${esc(outlook.label)}
        <span class="tip-card">
          <div class="tip-title">Pace &amp; Hidden Strain</div>
          <div class="tip-desc">${esc(outlook.tip)}</div>
        </span>
      </span>
    </div>
    <div class="char-header">${avatar(c.age,c.appearance)}
      <div class="char-name">${esc(c.firstName)} ${esc(c.lastName)}</div>
      <div class="char-meta">Born ${c.birthYear} · Age ${c.age}</div>
      <span class="stage-badge">${esc(c.stage)}</span>
    </div>

    <div class="money-card">
      <div>
        <div class="money-label">Bank Balance</div>
        <div style="font-size:11px;color:var(--text-faint);">
          ${c.age >= 18 ? `Est. ${cashDelta >= 0 ? '+' : ''}${fmtMoney(cashDelta)} / yr` : 'Financially dependent'}
        </div>
      </div>
      <div class="money-val ${c.money < 0 ? 'neg' : ''}">${fmtMoney(c.money)}</div>
    </div>

    <div class="stat-list">
      ${bars.map(b => `
        <div title="${esc(b.tip)}">
          <div class="stat-row-top">
            <span>${b.label}</span>
            <b>${b.val}%</b>
          </div>
          <div class="stat-track">
            <div class="stat-fill ${b.key}" style="width:${b.val}%"></div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="trait-section-title">Starting Traits <span style="font-weight:400;text-transform:none;">(hover)</span></div>
    <div class="trait-chips">
      ${(c.traits || []).map(tid => renderTraitChip(getTrait(tid))).join('')}
    </div>

    ${activeFlags.length ? `
      <div class="trait-section-title">Life Milestones</div>
      <div class="trait-chips">
        ${activeFlags.map(f => `<span class="trait-chip">${esc(f)}</span>`).join('')}
      </div>
    ` : ''}

    <div class="trait-section-title">Family Background <span style="font-weight:400;text-transform:none;">(hover)</span></div>
    <div class="bg-blurb has-tip" tabindex="0">
      <b style="color:var(--text);display:block;margin-bottom:3px;">${esc(bg.name)}</b>
      ${esc(bg.blurb)}
      <span class="tip-card">
        <div class="tip-title">${esc(bg.name)}</div>
        <div class="tip-effects" style="border-top:none;padding-top:0;">${esc(bg.effectsSummary || '')}</div>
      </span>
    </div>
  `;
}

function formatBreakdown(bd) {
  if (!bd) return '';
  const parts = [`Age base ${bd.ageBase}`];
  if (bd.traitMod) parts.push(`${bd.traitMod > 0 ? '+' : ''}${bd.traitMod} Traits`);
  if (bd.healthMod) parts.push(`${bd.healthMod} Low Health`);
  if (bd.strainMod) parts.push(`${bd.strainMod} Strain wear`);
  if (bd.recoveryMod) parts.push(`+${bd.recoveryMod} Recovery bonus`);
  return parts.join(' · ');
}

function renderStage() {
  const st = document.getElementById('ls-stage');
  if (!st) return;

  // -------------------- CHARACTER CREATION --------------------
  if (state.mode === 'create' || !state.character) {
    const d = ensureDraft();
    const bg = getBackground(d.backgroundId);
    const traits = (d.traits || []).map(getTrait).filter(Boolean);

    st.innerHTML = `
      <div class="event-card">
        <div class="event-kicker">
          <span>🌱 NEW LIFE · GENERATION ${state.dynasty?.generation || 1}</span>
          <span>ENERGY &amp; STRAIN UPDATE</span>
        </div>
        <div class="story-scene" aria-hidden="true">☁️ <span>🌳 🏡 🌳</span> ☀️</div><h2 class="event-title">Begin Your Story</h2>
        <p class="event-prompt" style="margin-bottom:16px;">
          Choose a name and birth year, or reroll your starting background and traits. Each year now plays in three beats: resolve start-of-year events, spend your yearly ⚡ Energy pool (watch out for burnout!), and wrap up the year.
        </p>

        <div class="form-grid">
          <div class="form-field">
            <label for="inp-first">First Name</label>
            <input id="inp-first" type="text" maxlength="24" value="${esc(d.firstName)}" />
          </div>
          <div class="form-field">
            <label for="inp-last">Last Name</label>
            <input id="inp-last" type="text" maxlength="24" value="${esc(d.lastName)}" />
          </div>
          <div class="form-field">
            <label for="inp-year">Birth Year</label>
            <input id="inp-year" type="number" min="1900" max="2025" value="${Number(d.birthYear) || 1995}" />
          </div>
        </div>

        <div class="appearance-editor">${avatar(25,d.appearance)}<div>${[['skin','Skin tone',['#f3c69e','#e8bb91','#ad7751','#805238','#57392b']],['hair','Hair color',['#76513c','#292725','#e5c779','#ae5438']],['eyes','Eye color',['#41566a','#627f49','#76513b']],['shirt','Clothing',['#6599c6','#c97878','#7da76b','#987bb7']],['style','Hair style',['classic','spiky','bald']]].map(([k,label,values])=>`<label>${label}<select data-appearance="${k}">${values.map(v=>`<option value="${v}" ${d.appearance?.[k]===v?'selected':''}>${v.startsWith('#')?['Option '+(values.indexOf(v)+1)][0]:v}</option>`).join('')}</select></label>`).join('')}</div></div>
        <div class="rolled-preview">
          <div>
            <div class="trait-section-title" style="margin-top:0;">Rolled Family Background</div>
            <div><b>${esc(bg.name)}</b> <span style="color:var(--accent);font-size:12.5px;">(${esc(bg.effectsSummary)})</span></div>
            <div style="font-size:13px;color:var(--text-dim);margin-top:2px;">${esc(bg.blurb)}</div>
          </div>
          <div>
            <div class="trait-section-title" style="margin-top:4px;">Rolled Starting Traits</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${traits.map(t => `
                <div class="trait-chip" style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                  <span><b>${esc(t.name)}</b> — <span style="color:var(--text-dim)">${esc(t.desc)}</span></span>
                  <span style="color:var(--accent);font-size:11.5px;font-weight:600;">${esc(t.effectsSummary)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="ls-btn-row">
          <button class="ls-btn ls-btn-primary" data-act="begin-life">👶 Be Born &amp; Start Life</button>
          <button class="ls-btn ls-btn-ghost" data-act="reroll-traits">🎲 Reroll Traits &amp; Background</button>
          <button class="ls-btn ls-btn-ghost" data-act="reroll-all">🔀 Randomize Everything</button>
        </div>
      </div>
    `;
    return;
  }

  const c = state.character;

  // -------------------- DEATH / EPITAPH --------------------
  if (state.mode === 'dead' || !c.alive) {
    const hasHeirs = (c.children?.length || 0) > 0;
    st.innerHTML = `
      <div class="event-card">
        <div class="event-kicker">
          <span>🪦 END OF LIFE SUMMARY</span>
          <span>${c.birthYear} – ${c.year}</span>
        </div>
        <div class="story-scene" aria-hidden="true">☁️ <span>🌳 🏡 🌳</span> ☀️</div><h2 class="event-title">Here Lies ${esc(c.firstName)} ${esc(c.lastName)}</h2>
        <p class="event-prompt" style="margin-bottom:12px;">
          ${esc(c.causeOfDeath || 'Passed away.')}
        </p>

        <div class="epitaph-grid">
          <div class="epitaph-stat">
            <div class="money-label">Years Lived</div>
            <div style="font-size:18px;font-weight:800;">${c.age} years</div>
          </div>
          <div class="epitaph-stat">
            <div class="money-label">Final / Peak Estate</div>
            <div style="font-size:18px;font-weight:800;color:var(--accent);">${fmtMoney(c.money)} <span style="font-size:12px;color:var(--text-faint)">(Peak ${fmtMoney(c.peakMoney)})</span></div>
          </div>
          <div class="epitaph-stat">
            <div class="money-label">Generation</div>
            <div style="font-size:18px;font-weight:800;color:var(--gold);">Gen ${state.dynasty.generation}</div>
          </div>
          <div class="epitaph-stat">
            <div class="money-label">Children / Heirs</div>
            <div style="font-size:18px;font-weight:800;">${c.children?.length || 0}</div>
          </div>
        </div>

        ${hasHeirs ? `
          <div style="margin: 14px 0;">
            <div class="trait-section-title">Continue the Family Line (Generation ${state.dynasty.generation + 1})</div>
            <div class="choice-list">
              ${c.children.map((ch, idx) => `
                <button class="choice-btn" data-act="pick-heir" data-idx="${idx}">
                  <span class="choice-label">🌳 Continue as ${esc(ch.firstName)} ${esc(ch.lastName)}</span>
                  <span class="choice-hint">Inherit estate &amp; family home →</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : `
          <p style="font-size:13.5px;color:var(--text-dim);margin-bottom:16px;">
            ${esc(c.firstName)} left no direct children behind, bringing this branch of the ${esc(c.lastName)} line to a close.
          </p>
        `}

        <div class="ls-btn-row" style="margin-top:14px;">
          <button class="ls-btn ls-btn-primary" data-act="new-dynasty">🌱 Start a Fresh Dynasty (Gen 1)</button>
          <button class="ls-btn ls-btn-ghost" data-act="open-tree">🧬 View Family Tree</button>
        </div>
      </div>
    `;
    return;
  }

  // -------------------- BEAT 1: START-OF-YEAR EVENT CARD --------------------
  const ev = getActiveEvent();
  if (ev) {
    const isBgEvent = Boolean(ev.bgId);
    const bgName = isBgEvent ? getBackground(ev.bgId)?.name : '';
    st.innerHTML = `
      <div class="event-card">
        <div class="event-kicker">
          <span>⚡ BEAT 1 · START OF YEAR ${c.year} (AGE ${c.age})</span>
          ${isBgEvent
            ? `<span class="event-bg-tag">🏛️ ${esc(bgName)}</span>`
            : `<span>${state.pendingEvents.length > 1 ? `Event 1 of ${state.pendingEvents.length}` : 'Start-of-Year Event'}</span>`}
        </div>
        <div class="story-scene" aria-hidden="true">☁️ <span>🌳 🏡 🌳</span> ☀️</div><h2 class="event-title">${esc(ev.title)}</h2>
        <p class="event-prompt">${esc(ev.prompt)}</p>
        <div class="choice-list">
          ${ev.choices.map((ch, i) => `
            <button class="choice-btn" data-act="choose" data-idx="${i}">
              <span class="choice-label">${i + 1}. ${esc(ch.label)}</span>
              ${ch.hint ? `<span class="choice-hint">${esc(ch.hint)}</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    return;
  }

  // -------------------- BEAT 2 & BEAT 3: SPEND ENERGY & FINISH YEAR --------------------
  const maxE = c.energyMax ?? computeYearEnergyPool(c).total;
  const curE = c.energy ?? maxE;
  const bd = c.energyBreakdown || computeYearEnergyPool(c);
  const outlook = strainOutlook(c);
  const actions = getActionsForCharacter(c);
  const presets = PRESET_ROUTINES[c.stage] || [];
  const customForStage = (state.customRoutines || []).filter(r => r.stage === c.stage);
  const canRepeatLast = c.lastRoutine?.length > 0 && c.lastRoutineStage === c.stage && curE > 0;

  const pipsHtml = Array.from({ length: maxE }, (_, idx) =>
    `<span class="energy-pip ${idx < curE ? 'filled' : ''}"></span>`
  ).join('');

  const chosenSummary = (c.yearActions || []).length
    ? (() => {
        const counts = {};
        for (const id of c.yearActions) counts[id] = (counts[id] || 0) + 1;
        return Object.entries(counts)
          .map(([id, n]) => {
            const a = getActionById(id);
            return a ? `${a.icon} ${a.name}${n > 1 ? ` ×${n}` : ''}` : id;
          })
          .join(' · ');
      })()
    : 'None yet — pick actions below, run a routine, or finish early to auto-rest!';

  st.innerHTML = `
    <details class="life-panel"><summary>Life journal · ${journal(c).history.length} memories</summary>${SAGAS.filter(s=>eligible(c,s)).map(s=>{const a=journal(c).arcs[s[0]];return `<p><b>${esc(s[1])}</b> · ${a?`${a.step}/${s[4].length} chapters`: 'Undiscovered'} ${!a||a.step<s[4].length&&a.due<=c.year?`<button class="ls-btn ls-btn-ghost" data-act="${a?'saga-open':'saga-start'}" data-id="${s[0]}">${a?'Continue':'Discover'}</button>`:a.step<s[4].length?` · Next chapter ${a.due}`:' · Complete'}</p>`}).join('')}${journal(c).history.slice().reverse().map(m=>`<p>${m.year} · ${esc(m.title)} — ${esc(m.result)}</p>`).join('')}</details>
    ${dueThread(c)?`<section class="life-panel"><h3>Ongoing chapters</h3><p>${esc(dueThread(c).title)} — someone is waiting to hear from you.</p><button class="ls-btn ls-btn-primary" data-act="open-thread">Continue story</button></section>`:''}
    <div class="energy-banner energy-${curE === 0 ? 'empty' : curE / Math.max(1,maxE) <= .25 ? 'low' : curE / Math.max(1,maxE) <= .5 ? 'medium' : 'high'}">
      <div class="energy-top-row">
        <div>
          <div class="energy-heading">⚡ Your Energy to Spend</div>
          <div class="energy-subheading">Available this year · Age ${c.age} · ${c.year}</div>
        </div>
        <div class="energy-count">${curE}<span> / ${maxE}</span></div>
      </div>
      <div class="energy-pips" role="meter" aria-label="Energy remaining" aria-valuemin="0" aria-valuemax="${maxE}" aria-valuenow="${curE}" title="${curE} of ${maxE} Energy available">${pipsHtml}</div>
      <div class="energy-message">${curE === 0 ? 'All Energy spent this year.' : curE / Math.max(1,maxE) <= .25 ? 'Low Energy — choose your remaining activities carefully.' : `${curE} Energy remaining for activities.`}</div>
      <div class="energy-detail">Pool: ${esc(formatBreakdown(bd))}</div>
      <div class="energy-outlook energy-outlook-${esc(outlook.tone)}"><strong>${esc(outlook.label)}</strong> · ${esc(outlook.tip)}</div>
      ${curE > 0 ? '<div class="energy-detail">Unspent Energy becomes rest when you finish the year.</div>' : ''}

      ${(canRepeatLast || presets.length > 0 || customForStage.length > 0) ? `
        <div class="routine-bar">
          <span style="font-size:11px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">Quick Routines:</span>
          ${canRepeatLast ? `
            <button class="routine-chip repeat" data-act="repeat-last" title="Replay last year's action sequence">
              🔁 Repeat Last Year
            </button>
          ` : ''}
          ${presets.map(rt => `
            <button class="routine-chip" data-act="run-preset" data-id="${esc(rt.id)}" title="${esc(rt.desc)}" ${curE <= 0 ? 'disabled' : ''}>
              ${esc(rt.name)}
            </button>
          `).join('')}
          ${customForStage.map(rt => `
            <span style="display:inline-flex;align-items:center;gap:2px;">
              <button class="routine-chip" data-act="run-custom" data-id="${esc(rt.id)}" ${curE <= 0 ? 'disabled' : ''}>
                ⭐ ${esc(rt.name)}
              </button>
              <button class="ls-btn-sm" data-act="del-custom" data-id="${esc(rt.id)}" title="Delete saved routine" style="color:var(--text-faint);padding:2px 5px;">✕</button>
            </span>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <div class="spent-strip">
      <div><b style="color:var(--text-dim);">This Year:</b> <span>${esc(chosenSummary)}</span></div>
      ${(c.yearActions || []).length >= 2 ? `
        <button class="ls-btn ls-btn-ghost ls-btn-sm" data-act="save-routine">💾 Save as Routine</button>
      ` : ''}
    </div>

    ${lifeTab==='map'?`<section class="life-panel"><h3>Explore more of WebShire</h3><div class="district-grid">${Object.entries(districts).map(([id,n])=>`<button class="ls-btn ls-btn-ghost" data-act="life-tab" data-id="${id}">${esc(n)}</button>`).join('')}</div></section>`:''}
    ${lifeTab==='map'?townMap(lifeTab,esc,townAvailability(c,actions)):lifeTab==='year'?homeScene(homeRoom,homeObject,actions,a=>canPerformAction(c,a),esc,c.life.home):districts[lifeTab]?`<section class="life-panel"><h2>${esc(districts[lifeTab])}</h2><button class="ls-btn ls-btn-ghost" data-act="life-tab" data-id="map">← Town map</button></section>`:locationScene(lifeTab,esc,townAvailability(c,actions))}
    ${lifeTab==='year'?`<details class="home-all"><summary>All available activities</summary><div class="action-grid">
      ${actions.map(act => {
        const chk = canPerformAction(c, act);
        return `
          <button class="action-card" data-act="spend-energy" data-id="${esc(act.id)}" ${chk.ok ? '' : 'disabled'}>
            <div class="action-card-top">
              <span class="action-name">${esc(act.icon)} ${esc(act.name)}</span>
              <span class="action-cost">${chk.ok ? `${act.cost} ⚡` : esc(chk.reason)}</span>
            </div>
            <div class="action-tag">${esc(act.tag)}</div>
            <div class="action-desc">${esc(act.desc)}</div>
          </button>
        `;
      }).join('')}
    </div>

    </details>`:lifeTab==='map'?'':renderLifePanel(c)}
    <div class="finish-year-bar">
      <div>
        <div style="font-weight:700;font-size:14px;">
          ${curE > 0
            ? `🛋️ ${curE} unspent Energy will automatically count as Rest (-Strain, +Happiness)`
            : `✅ All Energy spent for Year ${c.year} (${esc(outlook.label)})`}
        </div>
        <div style="font-size:12px;color:var(--text-faint);margin-top:2px;">
          Shortcut: Press <b>Space</b> to finish the year &amp; advance to Age ${c.age + 1} (or <b>R</b> to repeat last routine)
        </div>
      </div>
      <button class="age-up-btn" style="padding:12px 28px;font-size:16px;" data-act="age-up">
        ${curE > 0 ? `⏭️ Rest (${curE}⚡) &amp; Next Year` : `⏭️ Finish Year &amp; Age Up`}
      </button>
    </div>
  `;
}

function renderLog() {
  const list = document.getElementById('ls-log-list');
  const count = document.getElementById('ls-log-count');
  if (!list) return;

  const entries = (state.log || []).filter(
    item => !String(item.text || '').startsWith('Entered a new chapter of life:')
  );
  if (count) count.textContent = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;

  if (!entries.length) {
    list.innerHTML = `<div style="color:var(--text-faint);font-size:13px;">Your life story will unfold here year by year…</div>`;
    return;
  }

  const stageIcons = { Baby: '🍼', Child: '🎒', Teen: '⚡', Adult: '💼', Elder: '🌿' };
  const htmlParts = [];

  for (let i = 0; i < entries.length; i++) {
    const cur = entries[i];
    const curStage = cur.stage || stageForAge(cur.age || 0);
    const prevNewer = i > 0 ? (entries[i - 1].stage || stageForAge(entries[i - 1].age || 0)) : null;

    if (i === 0 || curStage !== prevNewer) {
      htmlParts.push(
        `<div class="log-divider">${stageIcons[curStage] || '◈'} ${esc(curStage)} Years</div>`
      );
    }

    htmlParts.push(`
      <div class="log-item ${esc(cur.tone || 'neutral')}">
        <span class="log-age">Age ${cur.age} (${cur.year}):</span>
        <span>${esc(cur.text)}</span>
      </div>
    `);
  }

  list.innerHTML = htmlParts.join('');
}

function openTreeModal() {
  const bd = document.getElementById('ls-modal-backdrop');
  const box = document.getElementById('ls-modal-box');
  const ancestors = state.dynasty?.ancestors || [];
  const c = state.character;

  box.innerHTML = `
    <div class="ls-panel-header">
      <span>🧬 DYNASTY FAMILY TREE</span>
      <button class="ls-btn ls-btn-ghost ls-btn-sm" data-act="close-modal">✕</button>
    </div>
    ${!ancestors.length && !c ? `<p style="color:var(--text-dim);font-size:14px;">No generations recorded yet.</p>` : ''}
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${ancestors.map(a => `
        <div class="epitaph-stat">
          <div style="display:flex;justify-content:space-between;">
            <b>Gen ${a.generation}: ${esc(a.name)}</b>
            <span style="color:var(--text-dim);font-size:12.5px;">${a.birthYear}–${a.deathYear} (Age ${a.age})</span>
          </div>
          <div style="font-size:12.5px;color:var(--text-dim);margin-top:4px;">
            Estate: <span style="color:var(--accent)">${fmtMoney(a.money)}</span> · Heirs: ${a.childrenCount} · ${esc(a.cause)}
          </div>
        </div>
      `).join('')}
      ${c && c.alive ? `
        <div class="epitaph-stat" style="border-color:var(--accent);">
          <div style="display:flex;justify-content:space-between;">
            <b>Gen ${state.dynasty.generation}: ${esc(c.firstName)} ${esc(c.lastName)} (Current)</b>
            <span style="color:var(--accent);font-size:12.5px;">Age ${c.age}</span>
          </div>
          <div style="font-size:12.5px;color:var(--text-dim);margin-top:4px;">
            Balance: ${fmtMoney(c.money)} · Children: ${c.children?.length || 0}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  bd.classList.remove('hidden');
}

function openSettingsModal() {
  const bd = document.getElementById('ls-modal-backdrop');
  const box = document.getElementById('ls-modal-box');
  const exported = exportSaveString();

  box.innerHTML = `
    <div class="ls-panel-header">
      <span>⚙️ SAVE &amp; EXPORT</span>
      <button class="ls-btn ls-btn-ghost ls-btn-sm" data-act="close-modal">✕</button>
    </div>
    <p style="font-size:13px;color:var(--text-dim);margin-bottom:10px;">
      WebShire autosaves after every action and year to <code>lifesim-save-v1</code>. Copy the string below to back up your dynasty, or wipe to roll a fresh character.
    </p>
    <textarea id="ls-save-box" rows="4" style="width:100%;background:#0c111c;border:1px solid var(--border);border-radius:8px;padding:8px;font-family:var(--font-mono);font-size:11.5px;margin-bottom:12px;">${esc(exported)}</textarea>
    <div class="ls-btn-row">
      <button class="ls-btn ls-btn-ghost ls-btn-sm" data-act="import-save">📥 Import From Box</button>
      <button class="ls-btn ls-btn-danger ls-btn-sm" data-act="hard-reset">🗑️ Wipe Save &amp; Restart</button>
    </div>
  `;
  bd.classList.remove('hidden');
}

export function bindEvents() {
  document.addEventListener('change',e=>{const k=e.target.dataset.appearance;if(!k||state.mode!=='create')return;const d=ensureDraft();for(const [key,id] of [['firstName','inp-first'],['lastName','inp-last'],['birthYear','inp-year']])d[key]=document.getElementById(id).value;d.appearance={...d.appearance,[k]:e.target.value};renderAll();});
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) {
      if (e.target.id === 'ls-modal-backdrop' && !state.character?.encounter) {
        e.target.classList.add('hidden');
      }
      return;
    }

    const act = btn.dataset.act;

    if(state.character?.encounter && act!=='dialogue-choice')return; if(state.character?.paths?.sentence&&['spend-energy','run-routine'].includes(act))return; if(act==='dialogue-choice'){chooseEncounter(Number(btn.dataset.idx));if(!state.character?.encounter)document.getElementById('ls-modal-backdrop').classList.add('hidden');renderAll();}else if(act==='saga-start'||act==='saga-open'){(act==='saga-start'?startSaga:openSaga)(btn.dataset.id);renderAll();}else if(act==='open-thread'){openThread();renderAll();}else if(act==='home-room'){homeRoom=btn.dataset.id;homeObject='';renderAll();} else if(act==='home-object'){homeObject=btn.dataset.id;renderAll();} else if (act === 'life-tab') { lifeTab=btn.dataset.id; renderAll(); } else if(act==='life-option'){if(!startEncounter(btn.dataset.id))performLifeOption(btn.dataset.id);renderAll();} else if (act === 'reroll-traits' || act === 'reroll-all') {
      const firstName = document.getElementById('inp-first')?.value;
      const lastName = document.getElementById('inp-last')?.value;
      const birthYear = Number(document.getElementById('inp-year')?.value) || 1995;
      if (state.draft) {
        state.draft.firstName = firstName || state.draft.firstName;
        state.draft.lastName = lastName || state.draft.lastName;
        state.draft.birthYear = birthYear;
      }
      rerollDraft(act === 'reroll-traits');
      renderAll();
    } else if (act === 'begin-life') {
      const firstName = document.getElementById('inp-first')?.value?.trim() || 'Alex';
      const lastName = document.getElementById('inp-last')?.value?.trim() || 'Mercer';
      const birthYear = Math.max(1900, Math.min(2025, Number(document.getElementById('inp-year')?.value) || 1995));
      startLifeFromDraft({ firstName, lastName, birthYear });
      renderAll();
    } else if (act === 'spend-energy') {
      const res = performEnergyAction(btn.dataset.id);
      if (res?.deltas) showDeltas(res.deltas);
      renderAll();
    } else if (act === 'repeat-last') {
      const c = state.character;
      if (c?.lastRoutine?.length) {
        const res = runActionRoutine(c.lastRoutine);
        if (res?.deltas) showDeltas(res.deltas);
        renderAll();
      }
    } else if (act === 'run-preset') {
      const c = state.character;
      const rt = (PRESET_ROUTINES[c?.stage] || []).find(r => r.id === btn.dataset.id);
      if (rt) {
        const res = runActionRoutine(rt.seq);
        if (res?.deltas) showDeltas(res.deltas);
        renderAll();
      }
    } else if (act === 'run-custom') {
      const rt = (state.customRoutines || []).find(r => r.id === btn.dataset.id);
      if (rt) {
        const res = runActionRoutine(rt.seq);
        if (res?.deltas) showDeltas(res.deltas);
        renderAll();
      }
    } else if (act === 'save-routine') {
      const name = prompt('Name this routine (e.g. "My Balanced Grind"):', 'My Routine');
      if (name !== null) {
        saveCurrentAsRoutine(name);
        renderAll();
      }
    } else if (act === 'del-custom') {
      deleteCustomRoutine(btn.dataset.id);
      renderAll();
    } else if (act === 'age-up') {
      const res = finishYearAndAgeUp();
      if (res?.deltas) showDeltas(res.deltas);
      renderAll();
    } else if (act === 'choose') {
      const idx = Number(btn.dataset.idx);
      const res = resolveChoice(idx);
      if (res?.deltas) showDeltas(res.deltas);
      renderAll();
    } else if (act === 'pick-heir') {
      const idx = Number(btn.dataset.idx) || 0;
      continueAsHeir(idx);
      renderAll();
    } else if (act === 'new-dynasty') {
      beginNewDynasty();
      renderAll();
    } else if (act === 'open-tree') {
      openTreeModal();
    } else if (act === 'open-settings') {
      openSettingsModal();
    } else if (act === 'close-modal') {
      document.getElementById('ls-modal-backdrop')?.classList.add('hidden');
    } else if (act === 'import-save') {
      const val = document.getElementById('ls-save-box')?.value || '';
      if (importSaveString(val)) {
        document.getElementById('ls-modal-backdrop')?.classList.add('hidden');
        renderAll();
      } else {
        alert('Invalid save string.');
      }
    } else if (act === 'hard-reset') {
      if (confirm('Erase your current WebShire family tree and start fresh?')) {
        resetAllData();
        document.getElementById('ls-modal-backdrop')?.classList.add('hidden');
        renderAll();
      }
    }
  });

  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (!document.getElementById('ls-modal-backdrop')?.classList.contains('hidden')) return;

    if (state.mode === 'live' && state.character?.alive) {
      const ev = getActiveEvent();
      if (!ev && e.code === 'Space') {
        e.preventDefault();
        const res = finishYearAndAgeUp();
        if (res?.deltas) showDeltas(res.deltas);
        renderAll();
      } else if (!ev && (e.key === 'r' || e.key === 'R')) {
        const c = state.character;
        if (c?.lastRoutine?.length && c.lastRoutineStage === c.stage && c.energy > 0) {
          e.preventDefault();
          const res = runActionRoutine(c.lastRoutine);
          if (res?.deltas) showDeltas(res.deltas);
          renderAll();
        }
      } else if (ev && ['1', '2', '3'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (ev.choices[idx]) {
          e.preventDefault();
          const res = resolveChoice(idx);
          if (res?.deltas) showDeltas(res.deltas);
          renderAll();
        }
      }
    }
  });
}

function townAvailability(c, actions) {
  const options = lifeOptions(c);
  const available = actions.filter(a => canPerformAction(c,a).ok);
  const select = ids => available.filter(a => ids.includes(a.id));
  const opts = re => options.filter(a => a.ok && re.test(a.id));
  const schoolLabel = c.age < 5 ? 'WebShire Academy' : c.age < 13 ? 'Elementary School' : c.age < 18 ? 'High School' : c.age < 23 ? 'WebShire College' : 'Continuing Education';
  const groups = {
    year: [available, false],
    school: [[...select(['child_study','teen_study','study']), ...opts(/^course:/)], c.age < 5, schoolLabel, 'Opens at age 5'],
    career: [[...select(['work_overtime']), ...opts(/^(job:|retire$)/)], c.age < 18, 'ByteWorks', 'Opens at age 18'],
    people: [opts(/^(friend$|time:|talk:|gift:|argue:|date:|marry:|divorce:|baby:)/), false],
    clinic: [opts(/^clinic:/), false],
    assets: [opts(/^(home:|vehicle:|property:|business:|skill:|project:|post$|develop:|upgrade:|invest$|withdraw$)/), c.age < 5, 'Marketplace & Creator Studio', 'Opens at age 5']
  };
  return Object.fromEntries(Object.entries(groups).map(([id,[items,locked,label,reason]]) => [id,{count:items.length,min:items.length?Math.min(...items.map(a=>a.cost)):0,locked,label,reason,alert:id==='clinic'&&Object.keys(c.life.conditions).length>0}]));
}
function renderLifePanel(c){const l=initLife(c),e=l.education;const options=lifeOptions(c);const buttons=xs=>xs.map(a=>`<button class="ls-btn ls-btn-ghost" data-act="life-option" data-id="${esc(a.id)}" ${a.ok?'':'disabled'}>${esc(a.label)} · ${a.cost}⚡ ${a.cash?esc(fmtMoney(a.cash)):''}</button>`).join(' ');const actions=ids=>getActionsForCharacter(c).filter(a=>ids.includes(a.id)).map(a=>`<button class="ls-btn ls-btn-ghost" data-act="spend-energy" data-id="${esc(a.id)}" ${canPerformAction(c,a).ok?'':'disabled'}>${esc(a.name)} · ${a.cost}⚡</button>`).join(' ');
const p=paths(c);const pathRows=cat=>PATHS.filter(d=>d.category===cat).map(d=>{const r=p.active[d.id];const opts=options.filter(o=>o.id==='path-start:'+d.id||o.id.startsWith('path-act:'+d.id+':'));return `<details><summary>${esc(d.name)} ${r?' · Rank '+r.rank:''}</summary>${buttons(opts)}${!opts.length?esc(requirement(d)):''}</details>`}).join('');
const districtPatterns={realty:/^(home:|property:|sellproperty:)/,auto:/^(vehicle:|sellvehicle)/,bank:/^(invest$|withdraw$)/,business:/^(business:|upgrade:|sellbusiness:)/,creative:/^(project:|develop:|publish-independent:|submit-novel:|accept-novel:)/,social:/^media:/,fitness:/^gym:/,crime:/^(crime:|prison:)/,love:/^(romance:|date:|marry:|divorce:)/,family:/^(baby:|time:|talk:)/,lifestyle:/^lifestyle:/,assets:/^(lifestyle:|skill:)/,education:/^(course:|skill:)/};
if(p.sentence)return `<section class="life-panel"><h3>Prison · ${p.sentence} years remaining</h3>${buttons(options)}</section>`;
if(lifeTab==='paths')return `<section class="life-panel"><h3>${Object.keys(p.discovered).length}/500 discovered</h3><p>Net worth ${fmtMoney(netWorth(c))}</p>${PATHS.map(d=>`<p>${p.discovered[d.id]!==undefined?'✓':'○'} ${d.id}. ${esc(d.name)} · ${esc(pathType(d))} · ${esc(requirement(d))}</p>`).join('')}</section>`;
if(districts[lifeTab]||lifeTab==='assets'){const re=districtPatterns[lifeTab];return `<section class="life-panel"><h3>${esc(districts[lifeTab]||'Marketplace')}</h3>${lifeTab==='crime'?`<p>Organization ${esc(p.organization?.name||"Independent")} · Rank ${p.organization?["Associate","Member","Enforcer","Lieutenant","Underboss","Boss","Crime lord"][p.organization.rank]:"None"} · Members ${p.organization?.members||0} · Loyalty ${p.organization?.loyalty||0} · Influence ${p.organization?.influence||0} · Prison years ${p.sentence} · Police attention ${p.heat}/100 · Criminal XP ${p.crimeXP} · Convictions ${p.convictions} · Criminal earnings ${fmtMoney(p.crimeCash)}</p>`:''}${lifeTab==='fitness'?`<p>Strength ${p.strength} · Endurance ${p.endurance}</p>`:''}${lifeTab==='bank'||lifeTab==='wealth'?`<p>Net worth ${fmtMoney(netWorth(c))}</p>${Object.entries(finance(c,traitPassives(c))).map(([k,v])=>`<p>${esc(k)}: ${fmtMoney(v)}</p>`).join('')}`:''}${lifeTab==='creative'?ambition(c).projects.map(p=>`<p>${esc(PROJECTS[p.id][0])} · ${p.progress}% · ${p.copies||0} copies</p>`).join(''):''}${lifeTab==='social'?`<p>${ambition(c).followers} followers · ${ambition(c).views} views</p>`:''}${re?buttons(options.filter(o=>re.test(o.id))):''}${pathRows(lifeTab)}${lifeTab==='crime'?p.record.slice(-15).map(r=>`<p>${esc(r.text)}</p>`).join(''):''}</section>`;}
if(lifeTab==='career')return `<section class="life-panel"><h3>${esc(l.job?.name||'Unemployed')}</h3><p>${l.job?fmtMoney(l.job.salary)+'/year · Performance '+l.job.performance:''}</p>${buttons(options.filter(o=>o.id==='retire'))}${pathRows('career')}</section>`;
if(lifeTab==='school'||lifeTab==='career')return `<section class="life-panel">${lifeTab==='school'?`<h3>Education</h3><p>Grade: ${e.grade}/100 · Credentials: ${esc(e.credentials.join(', ')||'None')} · ${esc(e.course||'Not enrolled')} (${e.years} years)</p>${actions(['child_study','teen_study','study'])}<div>${buttons(options.filter(a=>a.id.startsWith('course:')))}</div>`:`<h3>Career</h3><p>${l.job?esc(`${l.job.name} · ${fmtMoney(l.job.salary)}/yr · Performance ${l.job.performance}/100 · ${l.job.years} years`):l.retired?'Retired':'Unemployed'}</p>${actions(['work_overtime'])}<h4>Job Board</h4>${buttons(options.filter(a=>a.id.startsWith('job:')||a.id==='retire'))}`}</section>`;
if(lifeTab==='people')return `<section class="life-panel"><h3>Relationships</h3>${buttons(options.filter(a=>a.id==='friend'))}${l.people.map(n=>`<article><b>${esc(n.name)} · ${esc(n.role)}</b> — Age ${c.year-n.birthYear} · ${esc(n.status)}<div><progress max="100" value="${n.score}"></progress> ${n.score}/100</div>${buttons(options.filter(a=>a.id.endsWith(':'+n.id)))}</article>`).join('')}</section>`;
if(lifeTab==='clinic')return `<section class="life-panel"><h3>Welcome to the clinic</h3><p>${esc(Object.keys(l.conditions).map(k=>CONDITIONS[k][0]).join(', ')||'No diagnosed conditions')}</p>${buttons(options.filter(a=>a.id.startsWith('clinic:')))}</section>`;
const hc=housingCosts(l), f=finance(c,traitPassives(c)), a=ambition(c), x=extraFinance(c); const cards=(title,rows)=>`<details open class="market-section"><summary>${title}</summary><div class="market-grid">${rows.map(([id,name,price,art,desc])=>{const o=options.find(v=>v.id===id);return `<article class="market-card">${art?picture(art):''}<div><h4>${esc(name)}</h4><strong>${fmtMoney(price)}</strong><p>${esc(desc)}</p>${o?buttons([o]):'<small>Unavailable</small>'}</div></article>`}).join('')}</div></details>`; const group=(title,re)=>`<details open><summary>${title}</summary><div class="ambition-actions">${buttons(options.filter(o=>re.test(o.id)))}</div></details>`;return `<section class="life-panel"><h3>Projected annual finances</h3>${Object.entries(f).map(([k,v])=>`<div>${esc(k)}: ${esc(fmtMoney(v))}</div>`).join('')}<p>Housing breakdown: ${fmtMoney(hc.mortgage.payment)} mortgage · ${fmtMoney(hc.upkeep)} rent/upkeep · ${fmtMoney(hc.propertyTax)} property tax · ${fmtMoney(hc.insurance)} insurance / year</p><h3>Assets</h3><p>${esc(HOMES.find(h=>h[0]===l.home)?.[1])} · Mortgage ${esc(fmtMoney(l.mortgage))} · Student debt ${esc(fmtMoney(l.loan))} · Investments ${esc(fmtMoney(l.investment))} · Car: ${l.car?'Owned':'None'}</p><p>Net worth: ${fmtMoney(netWorth(c))}</p><p>Rental income ${fmtMoney(x.rentals)} · Business profit ${fmtMoney(x.business)} · Royalties ${fmtMoney(x.royalties)} · Creator income ${fmtMoney(x.creator)}</p><p>Vehicle: ${a.vehicle?esc(CARS[a.vehicle.id][0]):'None'} · Lifestyle: ${esc(LIFESTYLES[a.lifestyle][0])}</p>${cards('Shire Realty — homes',HOMES.filter(h=>h[0]!=='family').map(([id,n,p,cost])=>['home:'+id,n,p,id==='rent'?null:id,p?fmtMoney(p*.2)+' down · '+fmtMoney(housingCosts({home:id,mortgage:p*.8}).total)+'/yr total housing':fmtMoney(cost)+'/yr rent']))}${cards('Investment properties',PROPERTIES.map(([n,p,r],i)=>['property:'+i,n,p,i===0?'starter':null,fmtMoney(r*.65)+'/yr initial net rent']))}${group('Banking & property sales',/^(invest$|withdraw$|sellproperty:)/)}${cards('AutoShire dealership',CARS.map(([n,p,cost],i)=>['vehicle:'+i,n,p,['beater','sedan'][i],fmtMoney(cost)+'/yr running costs']))}${group('Sell vehicle',/^sellvehicle$/)}${group('Lifestyle',/^lifestyle:/)}<h3>Business park</h3>${a.businesses.map(b=>`<p>${esc(BUSINESSES[b.id][0])} · Rank ${b.rank}/10</p>`).join('')}${cards('Start a business',BUSINESSES.map(([n,p],i)=>['business:'+i,n,p,i===5?'cafe':null,'Business skill '+Math.max(0,i*4-4)+' required']))}${group('Manage businesses',/^(upgrade:|sellbusiness:)/)}<h3>Creator studio</h3><p>${a.followers.toLocaleString()} followers · ${a.views.toLocaleString()} views · ${a.posts} posts · ${a.viral} viral hits</p>${group('Social media',/^post$/)}${a.projects.map(p=>`<p>${esc(PROJECTS[p.id][0])} · ${p.done?'Published · '+fmtMoney(p.royalty)+'/yr':p.progress+'%'}</p>`).join('')}${group('Personal projects',/^(project:|develop:)/)}${group('Train skills — XP requirements increase with level',/^skill:/)}</section>`;}
