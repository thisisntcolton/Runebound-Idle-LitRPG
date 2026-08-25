// ============================================================
// APPEARANCE EDITOR — the Mii-style character builder
//
// Live preview on the left, one row of swatches or named chips per
// feature on the right. Every control is a single click that mutates one
// integer, so there is no "apply" step and nothing to get wrong.
// ============================================================
import { state } from '../core/state.js';
import { OPTIONS, normalizeLook, SKIN, HAIR_COLOR } from '../data/appearance.js';
import { heroPortrait } from './heroart.js';
import { currentClass } from '../systems/classes.js';

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function swatchRow(opt, look) {
  const cur = look[opt.key];
  return opt.list.map((c, i) => `
    <button class="look-swatch ${i === cur ? 'sel' : ''}"
            style="background:${c}"
            data-act="look-set" data-key="${opt.key}" data-index="${i}"
            title="${opt.label} ${i + 1}"></button>`).join('');
}

function chipRow(opt, look) {
  const cur = look[opt.key];
  return opt.list.map((o, i) => `
    <button class="look-chip ${i === cur ? 'sel' : ''}"
            data-act="look-set" data-key="${opt.key}" data-index="${i}">${o.name}</button>`).join('');
}

export function appearancePanel() {
  const look = normalizeLook(state.look);
  const cls = currentClass();
  const name = state.look?.name || '';

  const rows = OPTIONS.map(opt => `
    <div class="look-row">
      <div class="look-row-label">${opt.label}</div>
      <div class="look-row-options ${opt.kind}">
        ${opt.kind === 'color' ? swatchRow(opt, look) : chipRow(opt, look)}
      </div>
    </div>`).join('');

  return `
    <div class="panel-header">
      <div class="panel-title">🪞 Appearance</div>
      <div class="panel-subtitle">However you like. It follows you through every cycle.</div>
    </div>
    <div class="panel-desc">
      The one thing the System does not get a say in. Your look survives Ascension along with your
      pets and your Codex — the world is remade, and you walk back into it as yourself.
    </div>

    <div class="look-layout">
      <div class="look-preview">
        <div class="look-stage">${heroPortrait(look, 200)}</div>
        <div class="look-name-row">
          <input class="pet-name-input" id="hero-name-input" maxlength="20"
                 placeholder="Adventurer" value="${esc(name)}" />
          <button class="btn btn-sm" data-act="look-name">Set name</button>
        </div>
        ${cls ? `<div class="pill" style="border-color:var(--sys-blue);color:var(--sys-blue)">${cls.icon} ${cls.name}</div>` : ''}
        <div class="look-actions">
          <button class="btn btn-sm" data-act="look-random">🎲 Surprise me</button>
          <button class="btn btn-sm" data-act="look-reset">Reset</button>
        </div>
      </div>

      <div class="look-controls">${rows}</div>
    </div>`;
}
