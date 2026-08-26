// ============================================================
// THE WASTES — Era II's home screen
//
// Three things live here because they are the three things the Wastes do
// to you: the Ledger takes your money, the Syndicate takes your things,
// and Salvage is how you get ahead of both.
// ============================================================
import { state, skillLevel } from '../core/state.js';
import { SKILLS } from '../data/skills.js';
import { getItem } from '../data/items.js';
import { GLITCH_NOTE, LOCKS } from '../data/salvage.js';
import { salvageView } from '../systems/salvage.js';
import { ledgerView, LEDGER } from '../systems/ledger.js';
import { pendingNotice, describeSeizure, bribeCost, camps, REPO } from '../systems/repo.js';
import { fmt, fmtInt, fmtDuration } from '../core/format.js';

// ---------------- The Ledger ----------------

function ledgerBlock() {
  const l = ledgerView();
  if (!l.open && !l.settled) return '';
  if (l.settled) {
    return `
      <div class="ledger-card settled">
        <div class="ledger-head"><span class="ledger-icon">📒</span>
          <div><div class="ledger-title">The Ledger — Paid In Full</div>
          <div class="muted">Nobody had ever paid one of these. They are not designed to be paid.</div></div>
        </div>
        <div class="pill" style="border-color:var(--gold);color:var(--gold)">
          +${Math.round(LEDGER.SETTLED_BONUS * 100)}% gold, permanently
        </div>
      </div>`;
  }
  const owed = Math.ceil(l.balance);
  const canPay = state.gold >= owed;
  return `
    <div class="ledger-card">
      <div class="ledger-head">
        <span class="ledger-icon">📒</span>
        <div style="flex:1;min-width:220px">
          <div class="ledger-title">The Ledger</div>
          <div class="muted">Back-taxes assessed against ${fmtInt(state.ascensions || 1)} lifetime${(state.ascensions || 1) === 1 ? '' : 's'} of containment.
            <b>${Math.round(l.garnish * 100)}%</b> of everything you earn is being collected at source.</div>
        </div>
        <div class="ledger-figure">🪙 ${fmt(owed)}</div>
      </div>
      <div class="xp-bar-outer"><div class="xp-bar-inner" style="width:${l.progress * 100}%;background:var(--gold)"></div></div>
      <div class="xp-bar-label">${fmt(l.paid)} of ${fmt(l.assessed)} repaid</div>
      <button class="btn btn-sm ${canPay ? 'btn-gold' : ''}" data-act="ledger-pay" ${canPay ? '' : 'disabled'}
              style="margin-top:10px">
        Settle it now — <span class="cost ${canPay ? '' : 'unaffordable'}">🪙 ${fmt(owed)}</span>
      </button>
    </div>`;
}

// ---------------- The Syndicate ----------------

function repoBlock() {
  const notice = pendingNotice();
  const held = camps();
  if (!notice && !held.length) return '';

  const noticeHtml = notice ? `
    <div class="repo-card">
      <div class="repo-head">
        <span class="repo-icon">📄</span>
        <div style="flex:1;min-width:220px">
          <div class="repo-title">Notice of Repossession</div>
          <div class="muted">They are here for <b>${describeSeizure(notice.target)}</b>.
            ${fmtDuration(Math.max(0, notice.expiresAt - Date.now()) / 1000)} before they collect it anyway.</div>
        </div>
      </div>
      <div class="repo-options">
        <button class="repo-option" data-act="repo-contest">
          <span class="repo-option-label">Refuse the notice</span>
          <span class="repo-option-desc">Meet them at the edge of the slab. Costs nothing but the argument.</span>
          <span class="muted">no cost</span>
        </button>
        <button class="repo-option ${state.gold >= bribeCost() ? '' : 'unaffordable'}"
                data-act="repo-settle" ${state.gold >= bribeCost() ? '' : 'disabled'}>
          <span class="repo-option-label">Settle the claim</span>
          <span class="repo-option-desc">Pay them. They issue an actual receipt, with a reference number.</span>
          <span class="cost ${state.gold >= bribeCost() ? '' : 'unaffordable'}">🪙 ${fmt(bribeCost())}</span>
        </button>
      </div>
      <div class="muted" style="margin-top:8px">Ignore it and they take it regardless — but they never
        destroy anything. It goes to a camp, and camps can be cleared.</div>
    </div>` : '';

  const campHtml = held.length ? `
    <div class="repo-card holding">
      <div class="repo-head">
        <span class="repo-icon">📦</span>
        <div style="flex:1;min-width:220px">
          <div class="repo-title">In Syndicate Custody</div>
          <div class="muted">${held.length} item${held.length === 1 ? '' : 's'} crated and logged out in the grey.</div>
        </div>
      </div>
      ${held.map(c => `
        <div class="repo-camp">
          <div><b>${describeSeizure(c.held)}</b></div>
          <div class="xp-bar-outer"><div class="xp-bar-inner" style="width:${(c.cleared / c.needed) * 100}%;background:var(--danger)"></div></div>
          <div class="xp-bar-label">${c.cleared} / ${c.needed} of them cleared</div>
        </div>`).join('')}
      <button class="btn btn-sm btn-danger" data-act="raid-camp" style="margin-top:8px">⚔️ Go to the camp</button>
    </div>` : '';

  return noticeHtml + campHtml;
}

// ---------------- Salvage ----------------

function requirementLine(r) {
  if (!r.lock?.skill) return '';
  const sk = SKILLS[r.lock.skill];
  return `<span class="dig-req ${r.met ? 'met' : ''}">
      ${r.lock.icon} ${sk?.name} ${r.level}
      <span class="muted">(${r.have})</span>
    </span>`;
}

function digCard(x) {
  const d = x.def;
  return `
    <div class="dig-card tier-${d.tier} ${x.diggable ? '' : 'locked'}">
      <div class="dig-head">
        <span class="dig-icon">${d.icon}</span>
        <div style="flex:1;min-width:0">
          <div class="dig-name">${d.name} <span class="pill">tier ${d.tier}</span></div>
          <div class="muted" style="font-family:var(--font-mono);font-size:11px">
            ${(d.ms / 1000).toFixed(0)}s · ${Math.round(d.instability * 100)}% unstable ·
            gone in ${fmtDuration(x.expiresIn / 1000)}</div>
        </div>
      </div>
      <div class="dig-blurb">${d.blurb}</div>
      <div class="dig-reqs">${x.requirements.map(requirementLine).join('')}</div>
      <div class="dig-haul">
        ${d.haul.map(h => {
          const item = getItem(h.item);
          return `<span class="haul-chip" title="${Math.round(h.w)}% of the table">
            ${item?.icon || '📦'} ${item?.name} <b>${h.qty[0]}-${h.qty[1]}</b></span>`;
        }).join('')}
      </div>
      ${x.diggable
        ? `<button class="btn btn-sm btn-primary btn-block" data-act="start-dig" data-uid="${x.uid}">Dig</button>`
        : `<div class="lock-req" style="text-align:center;padding:5px 0">Locked</div>`}
    </div>`;
}

function salvageBlock() {
  const v = salvageView();

  if (v.active) {
    const a = v.active;
    const pct = Math.min(100, (a.elapsed / a.total) * 100);
    return `
      <div class="section-title">🕳️ Excavating</div>
      <div class="dig-active">
        <div class="dig-head">
          <span class="dig-icon">${a.def.icon}</span>
          <div style="flex:1">
            <div class="dig-name">${a.def.name}</div>
            <div class="muted">${a.ready ? 'Bringing it up…' : fmtDuration(a.remaining / 1000) + ' to go'}</div>
          </div>
        </div>
        <div class="action-bar-outer" style="margin:10px 0">
          <div class="action-bar-inner" id="dig-bar" style="width:${pct}%"></div>
        </div>
        <button class="btn btn-sm" data-act="cancel-dig">Walk away</button>
      </div>`;
  }

  return `
    <div class="section-title">🕳️ Dig Sites <span class="pill">${fmtInt(v.digs)} dug</span></div>
    <div class="muted" style="margin-bottom:10px">
      Salvage has no level of its own. Every site is locked, and the keys are the skills you
      already have — buried needs Mining, sealed needs Thieving, encoded needs Runecrafting,
      fused needs Smithing. What comes up is a roll, not a wage.
    </div>
    ${v.sites.length
      ? `<div class="dig-grid">${v.sites.map(digCard).join('')}</div>`
      : `<div class="muted">The ground has gone quiet. Something will surface shortly.</div>`}
    <div class="muted" style="margin-top:12px;font-style:italic">${GLITCH_NOTE}</div>`;
}

// ---------------- Panel ----------------

export function wastesPanel() {
  if ((state.era || 1) < 2) {
    return `
      <div class="panel-header"><div class="panel-title">🕳️ The Wastes</div></div>
      <div class="panel-desc">There is nothing out there. There is not even an out there.</div>`;
  }
  return `
    <div class="panel-header">
      <div class="panel-title">🕳️ The Scrap Wastes</div>
      <div class="panel-subtitle">Unindexed · designation pending</div>
    </div>
    <div class="panel-desc">
      The dumping ground for deleted code and failed Ascensions. The ground is worked stone that
      somebody threw away, the sky scrolls, and everything you own out here is — administratively
      speaking — unlicensed.
    </div>
    ${ledgerBlock()}
    ${repoBlock()}
    ${salvageBlock()}`;
}
