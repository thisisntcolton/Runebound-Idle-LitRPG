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
import { GLITCH_NOTE, LOCKS, LOCK_LIST, SITES } from '../data/salvage.js';
import { salvageView } from '../systems/salvage.js';
import { ledgerView, LEDGER } from '../systems/ledger.js';
import { pendingNotice, describeSeizure, bribeCost, camps, REPO } from '../systems/repo.js';
import { deepView } from '../systems/deep.js';
import { bossView } from '../systems/worldboss.js';
import { MAX_PREP } from '../data/worldboss.js';
import { DEEP } from '../data/deep.js';
import { fmt, fmtInt, fmtDuration } from '../core/format.js';

// ---------------- The Ledger ----------------

function ledgerBlock() {
  const l = ledgerView();

  // The grace period. Shown, not hidden: a countdown you cannot read the
  // meaning of is better dread than silence, and it makes the bill land as
  // a thing that was always coming rather than a thing that came from
  // nowhere.
  if (l.pending) {
    return `
      <div class="ledger-card pending">
        <div class="ledger-head">
          <span class="ledger-icon">📄</span>
          <div style="flex:1;min-width:220px">
            <div class="ledger-title">Reconciliation In Progress</div>
            <div class="muted">Something is counting. It is not finished counting.
              Nobody in the Wastes will tell you what happens when it is, and Marrow's
              theory is that they genuinely do not know.</div>
          </div>
        </div>
        <div class="xp-bar-outer neutral"><div class="xp-bar-inner" style="width:${l.graceProgress * 100}%;background:var(--text-faint)"></div></div>
        <div class="xp-bar-label">query running · ${fmtDuration(l.graceLeft / 1000)} of processing left</div>
      </div>`;
  }

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
      <div class="xp-bar-outer neutral"><div class="xp-bar-inner" style="width:${l.progress * 100}%;background:var(--gold)"></div></div>
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
          <div class="xp-bar-outer neutral"><div class="xp-bar-inner" style="width:${(c.cleared / c.needed) * 100}%;background:var(--danger)"></div></div>
          <div class="xp-bar-label">${c.cleared} / ${c.needed} of them cleared</div>
        </div>`).join('')}
      <button class="btn btn-sm btn-danger" data-act="raid-camp" style="margin-top:8px">⚔️ Go to the camp</button>
    </div>` : '';

  return noticeHtml + campHtml;
}

// ---------------- The Vigil ----------------
//
// The preparation checklist is the point of this block, so it gets the
// space. A player who reads nothing else should still be able to look at
// this and know exactly what to go and do before they come back.

function bossBlock() {
  const v = bossView();
  if (!v.unlocked) return '';

  if (!v.up) {
    if (!v.everSeen) return '';       // the first one should be a surprise
    return `
      <div class="boss-card down">
        <div class="boss-head">
          <span class="boss-icon">${v.def.icon}</span>
          <div style="flex:1;min-width:220px">
            <div class="boss-title">${v.def.name} — below</div>
            <div class="muted">${v.felled
              ? `${v.felled} switched off so far. Another will come up; they always do.`
              : 'It went back down. What you took off it is still off it.'}</div>
          </div>
          ${v.hp > 0 && v.maxHp ? `<div class="boss-figure">${Math.round((1 - v.pct) * 100)}% down</div>` : ''}
        </div>
        ${v.felled ? `<div class="pill" style="border-color:var(--gold);color:var(--gold)">
          Trophies: +${Math.round(v.trophy.damage * 100)}% damage ·
          +${Math.round(v.trophy.maxhp * 100)}% health ·
          +${Math.round(v.trophy.gold * 100)}% gold, permanently</div>` : ''}
      </div>`;
  }

  const inIt = state.combat?.worldBoss && state.activity?.type === 'combat';
  const p = v.prep;
  const checklist = p.lines.map(l => `
    <div class="prep-row ${l.met ? 'met' : ''}">
      <span class="prep-mark">${l.met ? '✓' : '○'}</span>
      <span class="prep-icon">${l.icon}</span>
      <div style="flex:1;min-width:0">
        <div class="prep-label">${l.label}</div>
        <div class="muted">${l.detail}</div>
      </div>
      <span class="prep-bonus ${l.met ? 'met' : ''}">+${Math.round(l.bonus * 100)}%</span>
    </div>`).join('');

  return `
    <div class="boss-card up ${inIt ? 'engaged' : ''}">
      <div class="boss-head">
        <span class="boss-icon">${v.def.icon}</span>
        <div style="flex:1;min-width:220px">
          <div class="boss-title">${v.def.name} <span class="pill">${v.def.title}</span></div>
          <div class="muted">${v.def.blurb}</div>
        </div>
        <div class="boss-figure">${fmtDuration(v.timeLeft / 1000)} up</div>
      </div>

      <div class="hp-bar-outer" style="height:20px">
        <div class="hp-bar-inner" style="width:${v.pct * 100}%"></div>
        <div class="hp-bar-text">${fmt(Math.ceil(v.hp))} / ${fmt(v.maxHp)}</div>
      </div>
      <div class="xp-bar-label">${v.dealt > 0
        ? `${fmt(Math.round(v.dealt))} taken off it this time it has been up.`
        : 'Nothing off it yet.'} <b>Everything you land is kept.</b></div>

      <div class="section-title" style="margin-top:14px">Are you ready</div>
      <div class="muted" style="margin-bottom:8px">
        This is the only fight in the game that checks. Preparation is locked in the moment
        you engage — it multiplies everything you deal and it divides everything the aura
        does to you. Walk in cold at <b>×1.00</b>; walk in ready at <b>×${(1 + MAX_PREP).toFixed(2)}</b>.
      </div>
      <div class="prep-list">${checklist}</div>
      <div class="prep-total">
        <div>Right now you would engage at</div>
        <div class="prep-mult ${p.fraction > 0.7 ? 'good' : p.fraction > 0.35 ? 'ok' : 'bad'}">
          ×${p.multiplier.toFixed(2)}</div>
      </div>

      ${inIt ? `
        <div class="muted" style="margin-top:8px">
          Locked at <b>×${(1 + p.locked).toFixed(2)}</b> for this round.
          In contact <b>${Math.round(v.contact)}s</b> — the aura is compounding, and it wins eventually.
          Back out before it does; the damage stays done.
        </div>` : `
        <div class="muted" style="margin-top:8px">
          ${v.recovered
            ? 'Rested. The aura starts from nothing on your next round.'
            : 'Still carrying the last round — the aura resumes where it left off for another few seconds.'}
        </div>`}

      <button class="btn btn-sm ${inIt ? '' : 'btn-danger'}" style="margin-top:10px"
              data-act="${inIt ? 'stop-combat' : 'fight-boss'}">
        ${inIt ? 'Back out of its shadow' : `${v.def.icon} Walk into its shadow`}
      </button>
    </div>`;
}

// ---------------- The Descent ----------------

function deepBlock() {
  const v = deepView();
  const inIt = state.combat?.deep && state.activity?.type === 'combat';
  const m = v.monster;

  const floors = [];
  // A window of floors around where you are, so the ladder is visible
  // without printing two hundred buttons.
  const from = Math.max(1, v.depth - 3);
  const to = Math.min(v.maxSelectable, Math.max(v.depth + 3, from + 6));
  for (let i = from; i <= to; i++) {
    const warden = i % DEEP.WARDEN_EVERY === 0;
    floors.push(`
      <button class="floor-pill ${i === v.depth ? 'on' : ''} ${warden ? 'warden' : ''} ${i > v.best ? 'fresh' : ''}"
              data-act="set-depth" data-depth="${i}">
        ${warden ? '👑' : ''}${i}
      </button>`);
  }

  return `
    <div class="section-title">⬇️ The Descent
      <span class="pill">deepest reach ${fmtInt(v.best)} / ${fmtInt(v.cap)}</span></div>
    <div class="muted" style="margin-bottom:10px">
      The Wastes are other places stacked on each other, so there is a down. Hold a floor by
      putting down ${DEEP.CLEARS_PER_DEPTH} of what lives on it — every ${DEEP.WARDEN_EVERY}th floor
      is held by one thing instead — and the next one opens. <b>Nothing here needs a skill and
      nothing here needs to be robbed first.</b> It is the fighter's road, and how deep you have
      ever been is permanent.
    </div>

    <div class="deep-card ${inIt ? 'active' : ''}">
      <div class="deep-head">
        <div>
          <div class="deep-floor">Floor ${v.depth}${v.warden ? ' — Warden' : ''}</div>
          <div class="deep-stratum">${v.stratum.name} <span class="muted">· ${v.stratum.desc}</span></div>
        </div>
        <div class="deep-bonus">
          <div class="muted">standing bonus</div>
          <div>⚔️ +${(v.bonus.damage * 100).toFixed(0)}% · 🪙 +${(v.bonus.gold * 100).toFixed(0)}% ·
            🎁 +${(v.bonus.drop_rate * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div class="deep-monster">
        <span class="dig-icon">${m.icon}</span>
        <div style="flex:1;min-width:0">
          <div class="dig-name">${m.name}${m.boss ? ' 👑' : ''} <span class="pill">Lv. ${m.level}</span></div>
          <div class="muted" style="font-style:italic">${m.line}</div>
          <div class="muted" style="font-family:var(--font-mono);font-size:11px">
            ${fmt(m.hp)} HP · 🛡 ${m.defense} def · hits up to ${m.maxHit} · 🪙 ${fmt(m.gold[0])}–${fmt(m.gold[1])}</div>
        </div>
      </div>

      <div class="xp-bar-outer neutral"><div class="xp-bar-inner"
        style="width:${(v.clears / v.need) * 100}%;background:var(--danger)"></div></div>
      <div class="xp-bar-label">${v.clears} / ${v.need} held on this floor${
        v.depth <= v.best ? ' · already open below' : ''}</div>

      <div class="floor-row">${floors.join('')}</div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn btn-sm ${inIt ? '' : 'btn-danger'}" data-act="${inIt ? 'stop-combat' : 'start-descent'}">
          ${inIt ? 'Climb back out' : '⚔️ Go down'}</button>
        ${v.best >= v.depth && v.depth < v.maxSelectable
          ? `<button class="btn btn-sm" data-act="set-depth" data-depth="${v.depth + 1}">Go one deeper ⬇️</button>`
          : ''}
      </div>

      ${v.atCap ? `
        <div class="muted" style="margin-top:8px;border-top:1px dashed rgba(43,58,94,0.7);padding-top:8px">
          <b style="color:var(--sys-blue)">[ SYSTEM ] Descent authorisation exhausted at floor ${v.cap}.</b>
          Clearance is issued per completed cycle: <b>Ascend and ${DEEP.CAP_PER_CYCLE} more floors open.</b>
          The town stays. Only the ceiling moves.
        </div>` : ''}
    </div>`;
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

// ---------------- The keyring ----------------
//
// The single most important block on this screen, and it was missing.
//
// Salvage is gated entirely on four OLD skills, which is the good idea at
// the centre of Era II — but a player who reached the Wastes by fighting
// had no way to see that, because the only thing a locked site said was
// "Locked". They read the whole system as closed to them and left. This
// block answers the one question they were actually asking: which number
// do I raise, and what opens when I do.

function keyring(v) {
  const rows = LOCK_LIST.filter(l => l.skill).map(lock => {
    const sk = SKILLS[lock.skill];
    const have = skillLevel(lock.skill);

    // Every threshold this lock guards anywhere in the tier list.
    const gates = SITES
      .filter(s => s.requires[lock.id] !== undefined)
      .map(s => ({ level: s.requires[lock.id], site: s }))
      .sort((a, b) => a.level - b.level);

    const next = gates.find(g => g.level > have);
    const open = gates.filter(g => g.level <= have).length;
    const pct = next
      ? Math.min(100, (have / next.level) * 100)
      : 100;

    return `
      <div class="key-row ${next ? '' : 'complete'}">
        <span class="key-icon">${lock.icon}</span>
        <div style="flex:1;min-width:0">
          <div class="key-name">${sk?.name || lock.skill}
            <span class="pill">${lock.label}</span>
            <span class="muted">level ${have}</span></div>
          <div class="key-next">${next
            ? `<b>${sk?.name} ${next.level} opens ${next.site.icon} ${next.site.name}</b>
               <span class="muted">— ${next.level - have} level${next.level - have === 1 ? '' : 's'} to go</span>`
            : `<b>Every ${lock.label.toLowerCase()} door in the Wastes is open to you.</b>`}</div>
          <div class="xp-bar-outer neutral" style="height:8px;margin-top:5px">
            <div class="xp-bar-inner" style="width:${pct}%;${next ? '' : 'background:var(--gold)'}"></div>
          </div>
        </div>
        <div class="key-count">${open}<span class="muted">/${gates.length}</span></div>
      </div>`;
  }).join('');

  return `
    <div class="section-title">🗝️ Your Keys</div>
    <div class="muted" style="margin-bottom:10px">
      <b>Nothing out here is opened by fighting, and nothing out here needs a new skill.</b>
      Every door in the Wastes is locked by a skill you already have, at a level you may
      already be past. Raising an old number is how you get further in, and it is the only way.
    </div>
    <div class="key-list">${rows}</div>`;
}

function digCard(x) {
  const d = x.def;
  // The one unmet requirement to put in front of the player. Multi-lock
  // sites name the furthest-away skill, because that is the real wall.
  const blocking = x.requirements
    .filter(r => !r.met)
    .sort((a, b) => (b.level - b.have) - (a.level - a.have))[0];

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
        : blocking
          ? `<div class="dig-gate">
               <div class="dig-gate-line">${blocking.lock.icon}
                 <b>${SKILLS[blocking.lock.skill]?.name || blocking.lock.skill} ${blocking.level}</b> opens this</div>
               <div class="xp-bar-outer neutral" style="height:8px">
                 <div class="xp-bar-inner" style="width:${Math.min(100, (blocking.have / blocking.level) * 100)}%;background:var(--danger)"></div>
               </div>
               <div class="xp-bar-label">you are ${blocking.have} — ${blocking.level - blocking.have} to go${
                 x.requirements.filter(r => !r.met).length > 1
                   ? `, and ${x.requirements.filter(r => !r.met).length - 1} other lock${x.requirements.filter(r => !r.met).length > 2 ? 's' : ''}`
                   : ''}</div>
             </div>`
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
    ${keyring(v)}
    <div class="section-title">🕳️ Dig Sites <span class="pill">${fmtInt(v.digs)} dug</span></div>
    <div class="muted" style="margin-bottom:10px">
      Salvage has no level of its own and never will. What comes up is a roll, not a wage.
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
    ${bossBlock()}
    ${ledgerBlock()}
    ${repoBlock()}
    ${deepBlock()}
    ${salvageBlock()}`;
}
