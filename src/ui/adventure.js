// ============================================================
// THE ROAD — Adventure's panel
//
// Two states and they look nothing alike, on purpose. Travelling is calm:
// a bar, a distance, a note about what the road is worth to you. An open
// vignette takes over the screen entirely, because it is the only moment
// in this game that is actually asking you something.
// ============================================================
import { state } from '../core/state.js';
import { adventureView } from '../systems/adventure.js';
import { CHAINS } from '../data/adventure.js';
import { currentClass } from '../systems/classes.js';
import { fmt, fmtDuration } from '../core/format.js';

function optionCard(o) {
  return `
    <button class="road-option" data-act="adventure-choose" data-option="${o.id}">
      <span class="road-option-icon">${o.icon || '•'}</span>
      <span class="road-option-body">
        <span class="road-option-label">${o.label}</span>
        <span class="road-option-desc">${o.desc || ''}</span>
      </span>
    </button>`;
}

function vignette(open) {
  return `
    <div class="road-vignette">
      <div class="road-vignette-head">
        <span class="road-icon">${open.chain.icon}</span>
        <div>
          <div class="road-title">${open.chain.title}</div>
          <div class="muted">The road is waiting. ${open.secondsLeft}s before it decides for you —
            and it will pick the quiet one.</div>
        </div>
      </div>
      <div class="road-text">${open.beat.text}</div>
      <div class="road-options">${open.beat.options.map(optionCard).join('')}</div>
    </div>`;
}

export function adventurePanel() {
  const v = adventureView();
  const cls = currentClass();

  const header = `
    <div class="panel-header">
      <div class="panel-title">🧭 The Road</div>
      <div class="panel-subtitle">${v.travelling ? 'Under way' : 'Not currently out'}</div>
    </div>`;

  if (v.open) {
    return header + vignette(v.open);
  }

  const wandererNote = cls?.id === 'wanderer'
    ? `<div class="pill" style="border-color:var(--xp);color:var(--xp)">
         🧭 Wanderer — encounters ×${v.speed.toFixed(2)} sooner, ×${v.reward.toFixed(2)} richer${
           v.luck > 0 ? `, ${Math.round(v.luck * 100)}% kinder` : ''}</div>`
    : '';

  return header + `
    <div class="panel-desc">
      Set out and keep walking. There is nothing to click and nothing to optimise: every
      half-minute or so something happens, and when it does you answer it. What you answer
      changes what happens next, and what you did is remembered — by the road, and by the
      people on it, across every cycle you will ever live.
    </div>

    <div class="road-card ${v.travelling ? 'moving' : ''}">
      <div class="road-status">
        <div>
          <div class="road-status-title">${v.travelling ? 'On the road' : 'At home'}</div>
          <div class="muted">${v.travelling
            ? 'Something will find you shortly. It usually does.'
            : 'Nothing finds you in Hearthwick. That is what Hearthwick is for.'}</div>
        </div>
        ${wandererNote}
      </div>

      ${v.travelling ? `
        <div class="action-bar-outer" style="margin:12px 0 6px">
          <div class="action-bar-inner" id="road-bar" style="width:${v.progress * 100}%"></div>
        </div>
        <div class="xp-bar-label">${fmtDuration(v.nextIn / 1000)} of quiet road left</div>` : ''}

      <button class="btn btn-sm ${v.travelling ? '' : 'btn-primary'}" style="margin-top:10px"
              data-act="${v.travelling ? 'adventure-home' : 'adventure-out'}">
        ${v.travelling ? 'Turn back' : '🧭 Set out'}
      </button>
    </div>

    <div class="section-title">📖 What the road knows about you</div>
    <div class="road-stats">
      <div><div class="muted">TIME ON THE ROAD</div><div class="road-stat">${fmtDuration(v.travelled / 1000)}</div></div>
      <div><div class="muted">ANSWERED</div><div class="road-stat">${fmt(v.encounters)}</div></div>
      <div><div class="muted">SEEN THROUGH</div><div class="road-stat">${fmt(v.chains)}</div></div>
      <div><div class="muted">REMEMBERED</div><div class="road-stat">${fmt(v.flags)}</div></div>
    </div>

    <div class="section-title">🗺️ The chains</div>
    <div class="muted" style="margin-bottom:10px">
      Everything you have met at least once. A chain you have finished can still find you
      again — and the further in you have been, the further in it starts.
    </div>
    <div class="chain-list">
      ${CHAINS.map(c => {
        const n = v.seen[c.id] || 0;
        return `
          <div class="chain-row ${n ? 'met' : ''}">
            <span class="chain-icon">${n ? c.icon : '❔'}</span>
            <div style="flex:1;min-width:0">
              <div class="chain-name">${n ? c.title : 'Not yet met'}</div>
              <div class="muted">${n ? `Seen through ${n} time${n === 1 ? '' : 's'}` : 'The road has not brought this to you.'}</div>
            </div>
          </div>`;
      }).join('')}
    </div>
    <div class="muted" style="margin-top:8px">${v.discovered} of ${v.total} chains met.</div>`;
}
