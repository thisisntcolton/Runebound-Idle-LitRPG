// ============================================================
// PATH PANEL — your class, what it does, and what it costs you
// ============================================================
import { state, charLevel } from '../core/state.js';
import { CLASS_LIST, SCHOOLS, CLASS_UNLOCK_LEVEL } from '../data/classes.js';
import { currentClass, classUnlocked, classPending } from '../systems/classes.js';

function classCard(c, { chosen = false, selectable = false } = {}) {
  return `
    <div class="class-card ${c.school} ${chosen ? 'chosen' : ''}">
      <div class="class-card-head">
        <span class="class-icon">${c.icon}</span>
        <div>
          <div class="class-name">${c.name}
            ${chosen ? '<span class="pill" style="border-color:var(--sys-blue);color:var(--sys-blue)">Your path</span>' : ''}
            <span class="pill">${SCHOOLS[c.school]?.icon} ${SCHOOLS[c.school]?.name}</span>
          </div>
          <div class="class-tagline">${c.tagline}</div>
        </div>
      </div>
      <div class="class-blurb">${c.blurb}</div>
      <div class="class-sig">${c.signature.icon} <b>${c.signature.name}</b> — ${c.signature.desc}</div>
      <ul class="class-effects">${c.effects.map(e => `<li>${e}</li>`).join('')}</ul>
      <div class="class-penalty">⚠ ${c.penalty}</div>
      ${selectable
        ? `<button class="btn btn-sm btn-primary btn-block" data-act="choose-class" data-class="${c.id}">Walk this path</button>`
        : ''}
    </div>`;
}

export function classPanel() {
  const cls = currentClass();
  const cycles = state.ascensions || 0;

  if (!classUnlocked()) {
    const need = CLASS_UNLOCK_LEVEL - charLevel();
    return `
      <div class="panel-header">
        <div class="panel-title">🎭 Path</div>
        <div class="panel-subtitle">Locked</div>
      </div>
      <div class="panel-desc">
        [ SYSTEM ] Aptitude insufficient for classification. Continue as you are.<br><br>
        You may specialise at <b>character level ${CLASS_UNLOCK_LEVEL}</b> — ${need} to go.
        Until then, here is what will be on offer.
      </div>
      <div class="class-grid">${CLASS_LIST.map(c => classCard(c)).join('')}</div>`;
  }

  if (classPending()) {
    return `
      <div class="panel-header">
        <div class="panel-title">🎭 Choose a Path</div>
        <div class="panel-subtitle">One per cycle</div>
      </div>
      <div class="panel-desc">
        This holds for the rest of the cycle and cannot be changed. Ascend, and you choose again —
        the world will not remember what you were, and neither will your stats.
      </div>
      <div class="class-grid">${CLASS_LIST.map(c => classCard(c, { selectable: true })).join('')}</div>`;
  }

  const others = CLASS_LIST.filter(c => c.id !== cls.id);
  return `
    <div class="panel-header">
      <div class="panel-title">${cls.icon} ${cls.name}</div>
      <div class="panel-subtitle">${SCHOOLS[cls.school]?.name} · locked in for cycle ${cycles + 1}</div>
    </div>
    <div class="panel-desc">${cls.tagline}</div>

    <div class="class-grid">${classCard(cls, { chosen: true })}</div>

    <div class="section-title">Not this time</div>
    <div class="muted" style="margin-bottom:10px">
      Your path resets when you Ascend. These are what you could be next cycle.
    </div>
    <div class="class-grid dim">${others.map(c => classCard(c)).join('')}</div>`;
}
