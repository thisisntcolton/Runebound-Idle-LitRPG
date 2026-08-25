// ============================================================
// PATH PANEL — your class, what it does, and what it costs you
// ============================================================
import { state, charLevel } from '../core/state.js';
import { CLASS_LIST, SCHOOLS, CLASS_UNLOCK_LEVEL } from '../data/classes.js';
import { TIERS, treeFor, tierInfo, MAX_CLASS_LEVEL, MAX_POINTS, totalCost } from '../data/talents.js';
import { currentClass, classUnlocked, classPending, classLevel,
         classLevelProgress, talentPoints, rankOf, tierUnlocked,
         canBuy, classProgress } from '../systems/classes.js';
import { fmtInt } from '../core/format.js';

function classCard(c, { chosen = false, selectable = false, showProgress = false } = {}) {
  const prog = showProgress ? classProgress(c.id) : null;
  const lvl = prog ? classLevel(c.id) : 0;
  return `
    <div class="class-card ${c.school} ${chosen ? 'chosen' : ''}">
      <div class="class-card-head">
        <span class="class-icon">${c.icon}</span>
        <div>
          <div class="class-name">${c.name}
            ${chosen ? '<span class="pill" style="border-color:var(--sys-blue);color:var(--sys-blue)">Your path</span>' : ''}
            <span class="pill">${SCHOOLS[c.school]?.icon} ${SCHOOLS[c.school]?.name}</span>
            ${prog && prog.xp > 0
              ? `<span class="pill" style="border-color:var(--shard);color:var(--shard)">Lv.${lvl} · ${prog.pointsUsed || 0}pts spent</span>`
              : ''}
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

// ---------------- Talent tree ----------------

function talentNode(classId, node, spendable) {
  const rank = rankOf(node.id, classId);
  const maxed = rank >= node.max;
  const unlocked = tierUnlocked(node.tier, classId);
  const check = canBuy(node.id, classId);
  const buyable = spendable && check.ok;
  const isCapstone = node.tier === 5;

  return `
    <div class="talent-node ${maxed ? 'maxed' : ''} ${unlocked ? '' : 'locked'} ${isCapstone ? 'capstone' : ''}">
      <div class="talent-head">
        <span class="talent-icon">${node.icon}</span>
        <div style="flex:1;min-width:0">
          <div class="talent-name">${node.name}</div>
          <div class="talent-rank">${maxed ? 'MAX' : `${rank} / ${node.max}`}
            <span class="muted">· ${node.cost}pt${node.cost === 1 ? '' : 's'}</span></div>
        </div>
      </div>
      <div class="talent-desc">${node.desc}</div>
      <div class="talent-pips">
        ${Array.from({ length: node.max }, (_, i) =>
          `<span class="talent-pip ${i < rank ? 'on' : ''}"></span>`).join('')}
      </div>
      ${maxed
        ? `<div class="talent-note done">Learned${node.max > 1 ? ' in full' : ''}</div>`
        : buyable
          ? `<button class="btn btn-sm btn-primary btn-block" data-act="buy-talent" data-node="${node.id}">
               Learn (${node.cost}pt${node.cost === 1 ? '' : 's'})</button>`
          : `<div class="talent-note">${check.why}</div>`}
    </div>`;
}

function talentTree(classId) {
  const pts = talentPoints(classId);
  const lvl = classLevel(classId);
  const spendable = pts.free > 0;
  const tree = treeFor(classId);

  const tiers = TIERS.map(t => {
    const nodes = tree.filter(n => n.tier === t.tier);
    if (!nodes.length) return '';
    const open = lvl >= t.atClassLevel;
    return `
      <div class="talent-tier ${open ? '' : 'locked'}">
        <div class="talent-tier-head">
          <span class="talent-tier-label">${t.label}</span>
          <span class="muted">${open ? `Class level ${t.atClassLevel}` : `🔒 Unlocks at class level ${t.atClassLevel}`}</span>
        </div>
        <div class="talent-row">${nodes.map(n => talentNode(classId, n, spendable)).join('')}</div>
      </div>`;
  }).join('');

  return `
    <div class="section-title">🌳 Talents
      <span class="pill">${pts.used} of ${MAX_POINTS} points spent</span></div>
    <div class="talent-banner ${spendable ? 'has-points' : ''}">
      <div>
        <div class="talent-banner-title">Class level ${lvl} / ${MAX_CLASS_LEVEL}</div>
        <div class="muted">Every scrap of XP you earn while walking this path levels it.
          One talent point per class level.</div>
        <div class="xp-bar-outer" style="margin-top:8px;max-width:420px">
          <div class="xp-bar-inner" style="width:${classLevelProgress(classId) * 100}%"></div>
        </div>
        <div class="xp-bar-label">${fmtInt(classProgress(classId)?.xp || 0)} class XP</div>
      </div>
      <div class="talent-points ${spendable ? 'glow' : ''}">
        <div class="talent-points-n">${pts.free}</div>
        <div class="muted">point${pts.free === 1 ? '' : 's'} to spend</div>
      </div>
    </div>
    <div class="muted" style="margin-bottom:14px">
      <b>Talents are permanent.</b> Points and everything you spend them on are stored per class and
      survive Ascension forever. The world resets; your training does not.<br>
      A maxed class has <b>${MAX_POINTS}</b> points and the full tree costs <b>${totalCost(classId)}</b> —
      you are choosing a build, not filling in a form.
    </div>
    ${tiers}`;
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
  const pts = talentPoints(cls.id);
  return `
    <div class="panel-header">
      <div class="panel-title">${cls.icon} ${cls.name}</div>
      <div class="panel-subtitle">${SCHOOLS[cls.school]?.name} · class level ${classLevel(cls.id)} ·
        locked in for cycle ${cycles + 1}${pts.free > 0 ? ` · <b style="color:var(--gold)">${pts.free} talent point${pts.free === 1 ? '' : 's'} unspent</b>` : ''}</div>
    </div>
    <div class="panel-desc">${cls.tagline}</div>

    <div class="class-grid">${classCard(cls, { chosen: true })}</div>

    ${talentTree(cls.id)}

    <div class="section-title">Not this time</div>
    <div class="muted" style="margin-bottom:10px">
      Your path resets when you Ascend; these are what you could be next cycle. Any talents you
      have already bought for them are still there, waiting.
    </div>
    <div class="class-grid dim">${others.map(c => classCard(c, { showProgress: true })).join('')}</div>`;
}
