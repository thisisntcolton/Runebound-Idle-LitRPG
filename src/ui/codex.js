// ============================================================
// THE CODEX PANEL — everything you have worked out about this place
// ============================================================
import { state } from '../core/state.js';
import { CODEX, CATEGORY_LIST, CATEGORIES, getEntry } from '../data/codex.js';
import { codex, entryText, hiddenDepth, progress } from '../systems/codex.js';
import { fmtDuration } from '../core/format.js';

export const codexUI = { cat: 'world', open: null };

function unlockHint(when) {
  if (!when) return 'Unknown';
  if (when.skill) return `Reach ${when.skill.id} level ${when.skill.level}`;
  if (when.charLevel !== undefined) return `Reach character level ${when.charLevel}`;
  if (when.kills !== undefined) return `Defeat ${when.kills.toLocaleString()} monsters`;
  if (when.killsOf) return `Defeat many of a particular creature`;
  if (when.stat) return 'Keep going';
  if (when.cycle !== undefined) return `Ascend ${when.cycle} time${when.cycle === 1 ? '' : 's'}`;
  if (when.item) return 'Obtain a certain item';
  if (when.flag) return 'Something has to happen first';
  if (when.pets !== undefined) return 'Hatch a pet';
  if (when.townLevel !== undefined) return `Grow Hearthwick to level ${when.townLevel}`;
  if (when.population !== undefined) return `Hearthwick needs ${when.population} residents`;
  if (when.townBuilding) return 'Build the right thing';
  return 'Unknown';
}

function entryCard(entry, found) {
  const cat = CATEGORIES[entry.cat];
  if (!found) {
    return `
      <div class="codex-card locked">
        <div class="codex-card-title">🔒 <span class="muted">Undiscovered</span></div>
        <div class="card-sub">${unlockHint(entry.when)}</div>
      </div>`;
  }
  const open = codexUI.open === entry.id;
  const depth = hiddenDepth(entry);
  const parts = entryText(entry);
  return `
    <div class="codex-card ${open ? 'open' : ''}" data-act="codex-open" data-entry="${entry.id}">
      <div class="codex-card-title">${cat?.icon || '📖'} ${entry.title}
        ${parts.length > 1 ? `<span class="pill" title="This entry has grown since you first found it">+${parts.length - 1} more</span>` : ''}
      </div>
      ${open ? `
        <div class="codex-body">
          ${parts.map((p, i) => `
            <div class="codex-pass ${i > 0 ? 'later' : ''}">
              ${i > 0 ? `<div class="codex-pass-tag">Cycle ${(entry.deeper[i - 1].cycle) + 1} — you know more now</div>` : ''}
              <p>${p}</p>
            </div>`).join('')}
          ${depth > 0 ? `<div class="codex-more">There is more here. Ascend again and re-read it.</div>` : ''}
        </div>`
        : `<div class="card-sub">${stripTags(parts[parts.length - 1]).slice(0, 110)}…</div>`}
    </div>`;
}

function stripTags(html) {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function codexPanel() {
  const seen = codex().seen;
  const p = progress();
  const cat = codexUI.cat;
  const list = CODEX.filter(e => e.cat === cat);
  const foundHere = list.filter(e => seen[e.id]).length;

  const tabs = CATEGORY_LIST.map(c => {
    const inCat = CODEX.filter(e => e.cat === c.id);
    const got = inCat.filter(e => seen[e.id]).length;
    return `<button class="btn btn-sm ${cat === c.id ? 'btn-primary' : ''}"
                    data-act="codex-cat" data-cat="${c.id}">
              ${c.icon} ${c.name} <span class="muted">${got}/${inCat.length}</span>
            </button>`;
  }).join('');

  const cycles = state.ascensions || 0;
  return `
    <div class="panel-header">
      <div class="panel-title">📖 The Codex</div>
      <div class="panel-subtitle">${p.found} of ${p.total} discovered${cycles > 0 ? ` · Cycle ${cycles + 1}` : ''}</div>
    </div>
    <div class="panel-desc">
      Things you have noticed and cannot un-notice. Nothing here was handed to you — every entry
      unlocked because of something you actually did.
      ${cycles > 0
        ? `Some of them have <b>more to say now</b> than when you first found them.`
        : `Some of them will have more to say after you have been round once.`}
    </div>

    <div class="xp-bar-outer" style="margin-bottom:6px">
      <div class="xp-bar-inner" style="width:${p.total ? (p.found / p.total) * 100 : 0}%"></div>
    </div>
    <div class="xp-bar-label">${p.found} / ${p.total} entries</div>

    <div class="combat-controls" style="margin-top:14px">${tabs}</div>
    <div class="muted" style="margin-bottom:10px">${CATEGORIES[cat]?.blurb || ''} · ${foundHere}/${list.length} found</div>

    <div class="codex-grid">
      ${list.map(e => entryCard(e, !!seen[e.id])).join('')}
    </div>`;
}
