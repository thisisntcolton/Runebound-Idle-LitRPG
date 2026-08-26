// ============================================================
// THE MENAGERIE — incubator, roster, care, breeding, egg shop
// ============================================================
import { state } from '../core/state.js';
import { getItem } from '../data/items.js';
import { getSpecies, getTrait, CARE, STAGES, stageFor, MAX_PET_LEVEL,
         BREEDING, EGG_SHOP, SPECIES_LIST, EGG_SOURCES, EGG_RARITY_ODDS,
         ERRANDS } from '../data/pets.js';
import { hunger, happiness, mood, petLevel, petLevelProgress,
         xpForPetLevel, incubatorSlots, eggReady, playCooldownLeft,
         canBreed, breedCooldownLeft, petBonusFor,
         activePetSummary, feedXpFor, hasSeen, errandView } from '../systems/pets.js';
import { petPortrait, eggPortrait, petArt } from './petart.js';
import { fmt, fmtInt, fmtDuration } from '../core/format.js';

export const petsUI = { tab: 'nest', selected: null, breedA: null, breedB: null };

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function pets() { return Object.values(state.pets?.owned || {}); }
function eggs() { return state.pets?.incubator || []; }

function bar(pct, color, height = 8) {
  return `<div class="care-bar" style="height:${height}px">
    <div class="care-bar-fill" style="width:${Math.max(0, Math.min(100, pct))}%;background:${color}"></div>
  </div>`;
}

function careColor(v) {
  return v < 30 ? 'var(--danger)' : v < 70 ? 'var(--gold)' : 'var(--xp)';
}

// ---------------- Active companion banner ----------------

/**
 * What the companion slot actually does.
 *
 * This was previously implied by the banner and nowhere else, so a player
 * could raise five pets without ever learning that only one of them is
 * doing anything, or that mood gates the whole bonus.
 */
function companionExplainer() {
  return `
    <div class="pet-explainer">
      <div class="pet-explainer-title">🐾 What taking a pet along does</div>
      <ul>
        <li><b>One pet at a time.</b> Only your active companion gives a bonus. The others
          stay in the Menagerie, still get hungry, and still grow — just more slowly.</li>
        <li><b>The bonus scales with its level</b> — a Lv.40 Cat is worth ten times a Lv.4 one —
          and with its <b>mood</b>. A thriving pet gives <b>115%</b> of its bonus; a hungry or
          lonely one drops to <b>35%</b>; a miserable one gives <b>nothing at all</b>.</li>
        <li><b>It bonds far faster while it walks with you.</b> Your kills and completed skill
          actions feed its bond XP directly. A pet left at home only earns the slow idle trickle,
          so the companion slot is also the fastest way to raise one.</li>
        <li><b>Better food, better bond.</b> Feeding scales with what you feed it: cooked beats
          raw, expensive beats cheap, and a species' favourite food is worth double.</li>
      </ul>
    </div>`;
}

function companionBanner() {
  const summary = activePetSummary();
  if (!summary) {
    return `
      <div class="pet-banner empty">
        <div class="pet-banner-art muted" style="font-size:44px">🐾</div>
        <div>
          <div class="pet-banner-name">No companion at your side</div>
          <div class="muted">Hatch an egg below, then send one along with you. Only the active pet
          gives a bonus, and it bonds far faster than one left at home.</div>
        </div>
      </div>`;
  }
  const { pet, species, mood: m, level, effects } = summary;
  const h = hunger(pet), p = happiness(pet);
  return `
    <div class="pet-banner">
      <div class="pet-banner-art">${petPortrait(pet, m.id, 110)}</div>
      <div class="pet-banner-info">
        <div class="pet-banner-name">
          ${species.icon} ${esc(pet.name)}
          <span class="pill rarity-${species.rarity}">${species.rarity}</span>
          <span class="pill">${getTrait(pet.trait)?.icon} ${getTrait(pet.trait)?.name}</span>
        </div>
        <div class="muted">${stageFor(level).name} ${species.name} · Level ${level}/${MAX_PET_LEVEL} · ${m.icon} ${m.label}</div>
        <div class="pet-banner-effects">
          ${effects.length
            ? effects.map(e => `<span class="pet-effect">${e}</span>`).join('')
            : `<span class="pet-effect off">Too unhappy to help right now</span>`}
        </div>
        <div class="pet-care-row">
          <span class="care-label">🍖 ${Math.round(h)}</span>${bar(h, careColor(h))}
          <span class="care-label">💚 ${Math.round(p)}</span>${bar(p, careColor(p))}
        </div>
      </div>
      <div class="pet-banner-actions">
        <button class="btn btn-sm btn-primary" data-act="select-pet" data-pet="${pet.id}">Open</button>
      </div>
    </div>`;
}

// ---------------- Incubator ----------------

function eggSlot(egg) {
  const sp = getSpecies(egg.species);
  const total = egg.readyAt - egg.startedAt;
  const left = Math.max(0, egg.readyAt - Date.now());
  const pct = total > 0 ? 1 - left / total : 1;
  const ready = eggReady(egg);
  return `
    <div class="egg-slot ${ready ? 'ready' : ''}">
      <div class="egg-art">${eggPortrait(egg.species, pct, 86)}</div>
      <div class="egg-name rarity-${sp.rarity}">${sp.eggName}</div>
      ${egg.inherit?.parents
        ? `<div class="muted" style="font-size:10.5px">${esc(egg.inherit.parents.join(' × '))}</div>` : ''}
      ${ready
        ? `<button class="btn btn-sm btn-gold btn-block" data-act="hatch-egg" data-egg="${egg.id}">✦ It's hatching!</button>`
        : `${bar(pct * 100, 'var(--sys-blue)', 6)}
           <div class="muted" style="font-size:11px;font-family:var(--font-mono)">${fmtDuration(left / 1000)}</div>`}
    </div>`;
}

function emptyEggSlot(n) {
  return `
    <div class="egg-slot empty">
      <div class="egg-art" style="font-size:34px;opacity:0.35;line-height:86px">🪹</div>
      <div class="muted">Empty nest ${n}</div>
    </div>`;
}

function ownedEggs() {
  return Object.entries(state.inventory || {})
    .filter(([id, qty]) => qty > 0 && getItem(id)?.type === 'egg')
    .map(([id, qty]) => ({ item: getItem(id), qty }));
}

function incubatorSection() {
  const slots = incubatorSlots();
  const list = eggs();
  const cells = [];
  for (let i = 0; i < slots; i++) {
    cells.push(list[i] ? eggSlot(list[i]) : emptyEggSlot(i + 1));
  }
  const inBag = ownedEggs();
  const room = list.length < slots;

  return `
    <div class="section-title">🥚 Incubator <span class="pill">${list.length}/${slots} nests</span></div>
    <div class="muted" style="margin-bottom:10px">Eggs warm on a real clock — they keep incubating while the game is closed.
    Every 5 hatchlings earns you another nest.</div>
    <div class="egg-grid">${cells.join('')}</div>

    <div class="section-title">Eggs in your bag</div>
    ${inBag.length ? `
      <div class="pet-food-strip">
        ${inBag.map(({ item, qty }) => `
          <button class="food-chip rarity-${item.rarity}" data-act="incubate" data-item="${item.id}"
                  ${room ? '' : 'disabled'} title="${room ? 'Place in the incubator' : 'The incubator is full'}">
            <span style="font-size:19px">${item.icon}</span>
            <span>${item.name}</span>
            <b>×${qty}</b>
          </button>`).join('')}
      </div>`
      : `<div class="muted">No eggs on hand. Buy one from the Hatchery, or find the rarer sorts out in the world.</div>`}
  `;
}

// ---------------- Roster ----------------

function petTile(pet) {
  const sp = getSpecies(pet.species);
  const m = mood(pet);
  const lvl = petLevel(pet);
  const isActive = state.pets.active === pet.id;
  const sel = petsUI.selected === pet.id;
  const h = hunger(pet), p = happiness(pet);
  return `
    <div class="pet-tile ${sel ? 'sel' : ''} ${isActive ? 'is-active' : ''} border-${sp.rarity}"
         data-act="select-pet" data-pet="${pet.id}">
      ${isActive ? '<div class="pet-tile-badge">AT YOUR SIDE</div>' : ''}
      <div class="pet-tile-art">${petPortrait(pet, m.id, 92)}</div>
      <div class="pet-tile-name">${esc(pet.name)}</div>
      <div class="muted" style="font-size:11px">${sp.icon} ${stageFor(lvl).name} · Lv.${lvl}</div>
      <div class="pet-tile-mood">${m.icon} ${m.label}</div>
      <div class="pet-care-row tiny">
        ${bar(h, careColor(h), 5)}${bar(p, careColor(p), 5)}
      </div>
    </div>`;
}

function rosterSection() {
  const list = pets();
  if (!list.length) {
    return `<div class="section-title">🐾 Your pets</div>
      <div class="muted">Nothing hatched yet. The Hatchery tab sells eggs.</div>`;
  }
  const sorted = list.slice().sort((a, b) => petLevel(b) - petLevel(a));
  return `
    <div class="section-title">🐾 Your pets <span class="pill">${list.length}</span></div>
    <div class="pet-grid">${sorted.map(petTile).join('')}</div>
    ${companionExplainer()}`;
}

// ---------------- Detail ----------------

function feedableItems(pet) {
  const sp = getSpecies(pet.species);
  const out = [];
  for (const [id, qty] of Object.entries(state.inventory || {})) {
    if (qty <= 0) continue;
    const item = getItem(id);
    if (!item) continue;
    const liked = sp.likes.includes(id);
    if (item.type !== 'food' && !liked) continue;
    out.push({ item, qty, liked });
  }
  out.sort((a, b) => (b.liked - a.liked) || ((b.item.sell || 0) - (a.item.sell || 0)));
  return out.slice(0, 14);
}


// ---------------- Errands ----------------
//
// The thing a finished pet does. Shown to every pet rather than only to
// eligible ones, because "there is something here you have not unlocked"
// is information, and hiding it is how ten abilities ended up invisible.

function errandSection(pet) {
  const v = errandView(pet);
  if (!v) return '';
  const mins = Math.round(v.durationMs / 60000);

  if (v.out) {
    const left = v.timeLeft;
    return `
      <div class="section-title">${v.current.icon} Out on an errand</div>
      <div class="errand-active">
        <div><b>${v.current.name}</b> — ${v.current.blurb}</div>
        ${v.ready
          ? `<button class="btn btn-sm btn-gold btn-block" data-act="pet-errand-collect" data-pet="${pet.id}">
               ✦ ${esc(pet.name)} is back — see what it brought</button>`
          : `<div class="muted" style="margin-top:6px;font-family:var(--font-mono)">Home in ${fmtDuration(left / 1000)}</div>`}
      </div>`;
  }

  const locked = !v.can.ok;
  return `
    <div class="section-title">📮 Errands ${locked ? '<span class="pill">locked</span>' : ''}</div>
    <div class="muted" style="margin-bottom:9px">
      A fully grown, thriving pet can be sent to work on its own for <b>${mins} minutes</b>.
      It is hard on them: fullness and happiness fall <b>${ERRANDS.DRAIN_MULT}×</b> faster while
      they work, and they come home tired. Nothing here runs forever, and a pet cannot be sent
      out again for ${Math.round(ERRANDS.COOLDOWN_MS / 60000)} minutes.
      ${locked ? `<br><span class="lock-req">🔒 ${v.can.why}</span>` : ''}
    </div>
    <div class="card-grid">
      ${v.list.map(e => `
        <div class="card ${locked ? 'locked' : ''}">
          <div class="card-title"><span class="card-icon">${e.icon}</span> ${e.name}</div>
          <div class="card-sub" style="font-style:italic;opacity:0.8">${e.blurb}</div>
          <div class="card-sub" style="color:var(--gold)">Pays about ${e.payout.toFixed(1)}× a minute of fighting${
            e.items ? ' · brings back goods' : ''}${e.xp ? ' · a little ' + Object.keys(e.xp)[0] + ' XP' : ''}</div>
          ${locked ? '' : `<button class="btn btn-sm btn-primary btn-block" data-act="pet-errand"
                  data-pet="${pet.id}" data-errand="${e.id}">Send</button>`}
        </div>`).join('')}
    </div>`;
}

function petDetail(pet) {
  const sp = getSpecies(pet.species);
  const m = mood(pet);
  const lvl = petLevel(pet);
  const st = stageFor(lvl);
  const trait = getTrait(pet.trait);
  const h = hunger(pet), p = happiness(pet);
  const cd = playCooldownLeft(pet);
  const isActive = state.pets.active === pet.id;
  const food = feedableItems(pet);

  const nextStage = STAGES.find(s => s.atLevel > lvl);
  const bonusLines = [];
  const pushBonus = b => {
    const v = petBonusFor(pet, b.key);
    const potential = b.perLevel * lvl;
    bonusLines.push(`
      <div class="pet-bonus-line">
        <span>${b.label}</span>
        <b style="color:${v > 0 ? 'var(--xp)' : 'var(--danger)'}">+${(v * 100).toFixed(1)}%</b>
        <span class="muted">of +${(potential * 100).toFixed(1)}% at full mood</span>
      </div>`);
  };
  pushBonus(sp.bonus);
  if (sp.bonus.second) pushBonus(sp.bonus.second);

  return `
    <div class="pet-detail">
      <div class="pet-detail-left">
        <svg viewBox="0 0 120 120" width="200" height="200" class="pet-svg big">${petArt(pet, m.id)}</svg>
        <div class="pet-mood-tag">${m.icon} ${m.label}</div>
        ${isActive
          ? `<div class="pill" style="border-color:var(--sys-blue);color:var(--sys-blue)">At your side</div>`
          : `<button class="btn btn-sm btn-primary" data-act="pet-active" data-pet="${pet.id}">Take along</button>`}
      </div>

      <div class="pet-detail-right">
        <div class="pet-detail-head">
          <input class="pet-name-input" id="pet-rename-input" value="${esc(pet.name)}" maxlength="18" />
          <button class="btn btn-sm" data-act="pet-rename" data-pet="${pet.id}">Rename</button>
        </div>
        <div class="muted">${sp.icon} ${st.name} ${sp.name} ·
          <span class="rarity-${sp.rarity}">${sp.rarity}</span> ·
          ${trait?.icon} <b>${trait?.name}</b> — ${trait?.desc}</div>
        <div class="muted" style="font-style:italic;margin-top:6px">${sp.desc}</div>
        ${pet.parents ? `<div class="muted" style="margin-top:4px">Born of ${esc(pet.parents.join(' and '))}.</div>` : ''}

        <div class="section-title" style="margin-top:16px">Bond</div>
        <div class="xp-bar-outer"><div class="xp-bar-inner" style="width:${petLevelProgress(pet) * 100}%"></div></div>
        <div class="xp-bar-label">Level ${lvl}/${MAX_PET_LEVEL} · ${fmtInt(pet.xp)} / ${fmtInt(xpForPetLevel(Math.min(MAX_PET_LEVEL, lvl + 1)))} bond XP${
          nextStage ? ` · becomes a ${nextStage.name} at Lv.${nextStage.atLevel}` : ' · fully grown'}</div>

        <div class="section-title">Care</div>
        <div class="pet-care-detail">
          <div><span class="care-label">🍖 Fullness ${Math.round(h)}%</span>${bar(h, careColor(h), 10)}</div>
          <div><span class="care-label">💚 Happiness ${Math.round(p)}%</span>${bar(p, careColor(p), 10)}</div>
        </div>
        <div class="muted" style="margin-top:6px">
          Fullness falls ${CARE.HUNGER_DECAY_PER_HOUR}/hr, happiness ${CARE.HAPPY_DECAY_PER_HOUR}/hr${
            trait?.hungerSlow || trait?.happySlow ? ` (slowed by ${trait.name})` : ''}.
          Below ${CARE.HUNGRY_AT} the bonus mostly stops; above ${CARE.WELL_KEPT_AT} on both it's boosted.
        </div>

        <div class="pet-actions">
          <button class="btn btn-sm ${cd > 0 ? '' : 'btn-primary'}" data-act="pet-play" data-pet="${pet.id}" ${cd > 0 ? 'disabled' : ''}>
            🧶 Play ${cd > 0 ? `(${fmtDuration(cd / 1000)})` : `(+${CARE.PLAY_HAPPY} happy)`}
          </button>
          <button class="btn btn-sm btn-danger" data-act="pet-release" data-pet="${pet.id}">Release</button>
        </div>

        ${errandSection(pet)}

        <div class="section-title">Feed</div>
        ${food.length ? `
          <div class="pet-food-strip">
            ${food.map(({ item, qty, liked }) => `
              <button class="food-chip ${liked ? 'liked' : ''}" data-act="pet-feed" data-pet="${pet.id}" data-item="${item.id}"
                      title="${liked ? 'A favourite: 60% more nourishing and double bond XP' : 'Better food bonds harder. Cooked beats raw.'}">
                <span style="font-size:19px">${item.icon}</span>
                <span>${item.name}</span>
                <b>×${fmt(qty)}</b>
                <span class="food-bond">+${Math.round(feedXpFor(item, liked))}</span>
                ${liked ? '<span class="heart">♥</span>' : ''}
              </button>`).join('')}
          </div>`
          : `<div class="muted">Nothing edible in the bag. Cook something, or catch it a fish.</div>`}
        <div class="muted" style="margin-top:6px">
          The green number is bond XP. Cooked food is worth 50% more than raw, and a favourite
          doubles it.<br>Favourites: ${sp.likes.map(id => getItem(id)?.name).filter(Boolean).join(', ') || '—'}</div>

        <div class="section-title">What it does for you</div>
        ${bonusLines.join('')}
      </div>
    </div>
    <button class="btn btn-sm" data-act="pets-tab" data-tab="nest" style="margin-top:16px">← Back to the menagerie</button>`;
}

// ---------------- Breeding ----------------

function breedCandidate(pet, slot) {
  const sp = getSpecies(pet.species);
  const ok = canBreed(pet);
  const chosen = (slot === 'a' ? petsUI.breedA : petsUI.breedB) === pet.id;
  const cd = breedCooldownLeft(pet);
  return `
    <div class="pet-tile small ${chosen ? 'sel' : ''} ${ok ? '' : 'locked'}"
         ${ok ? `data-act="breed-select" data-pet="${pet.id}" data-slot="${slot}"` : ''}>
      <div class="pet-tile-art">${petPortrait(pet, mood(pet).id, 64)}</div>
      <div class="pet-tile-name">${esc(pet.name)}</div>
      <div class="muted" style="font-size:10.5px">${sp.icon} Lv.${petLevel(pet)} ${getTrait(pet.trait)?.icon}</div>
      ${!ok ? `<div class="lock-req" style="font-size:10px">${
        cd > 0 ? `Resting ${fmtDuration(cd / 1000)}` : 'Not fully grown'}</div>` : ''}
    </div>`;
}

function breedingSection() {
  const list = pets();
  const grown = list.filter(p => p.stage === 'adult' || p.stage === 'elder');
  const a = petsUI.breedA ? state.pets.owned[petsUI.breedA] : null;
  const b = petsUI.breedB ? state.pets.owned[petsUI.breedB] : null;
  const ready = a && b && a.id !== b.id && canBreed(a) && canBreed(b);
  const room = eggs().length < incubatorSlots();
  const afford = state.gold >= BREEDING.COST_GOLD;

  let odds = null;
  if (a && b) {
    const spA = getSpecies(a.species), spB = getSpecies(b.species);
    const luck = BREEDING.BASE_UPGRADE_CHANCE
      + (a.species === b.species ? BREEDING.SAME_SPECIES_BONUS : 0)
      + (getTrait(a.trait)?.breedLuck || 0)
      + (getTrait(b.trait)?.breedLuck || 0);
    odds = { luck, baseSpecies: [spA, spB] };
  }

  return `
    <div class="section-title">💞 The Breeding Pen</div>
    <div class="muted" style="margin-bottom:12px">
      Two fully grown pets can produce an egg. The child takes after the rarer parent, inherits one of their traits
      (with a small chance of something new), and has a shot at climbing a rarity tier —
      better odds when the parents are the same species, or when either is 🍀 Fertile.
      Costs 🪙 ${fmtInt(BREEDING.COST_GOLD)} and rests both parents for ${BREEDING.COOLDOWN_MS / 3600000}h.
    </div>
    ${grown.length < 2
      ? `<div class="muted">You need two Adults (level ${STAGES.find(s => s.id === 'adult').atLevel}+) before anything can be bred.
         You have ${grown.length}.</div>`
      : `
      <div class="breed-lanes">
        <div>
          <div class="muted" style="margin-bottom:6px">Parent A</div>
          <div class="pet-grid small">${list.map(p => breedCandidate(p, 'a')).join('')}</div>
        </div>
        <div>
          <div class="muted" style="margin-bottom:6px">Parent B</div>
          <div class="pet-grid small">${list.map(p => breedCandidate(p, 'b')).join('')}</div>
        </div>
      </div>
      <div class="breed-summary">
        ${a && b && a.id !== b.id ? `
          <div><b>${esc(a.name)}</b> × <b>${esc(b.name)}</b></div>
          <div class="muted">Rarity climb chance: <b style="color:var(--r-epic)">${(odds.luck * 100).toFixed(0)}%</b>
            ${a.species === b.species ? '· same species bonus applied' : ''}</div>
          <div class="muted">Cost: <span class="cost ${afford ? '' : 'unaffordable'}">🪙 ${fmtInt(BREEDING.COST_GOLD)}</span>
            ${room ? '' : '· <span style="color:var(--danger)">no free nest</span>'}</div>
        ` : `<div class="muted">Pick one pet on each side.</div>`}
        <button class="btn ${ready && room && afford ? 'btn-primary' : ''}" data-act="breed-go"
                ${ready && room && afford ? '' : 'disabled'}>💞 Breed</button>
      </div>`}
  `;
}

// ---------------- Hatchery (shop) ----------------

function shopSection() {
  return `
    <div class="section-title">🏪 The Hatchery</div>
    <div class="muted" style="margin-bottom:12px">Old Merric keeps a back room full of things that are, allegedly, eggs.</div>
    <div class="card-grid">
      ${EGG_SHOP.map(entry => {
        const sp = getSpecies(entry.species);
        const afford = state.gold >= entry.gold;
        const bonus = [sp.bonus, sp.bonus.second].filter(Boolean)
          .map(b => `+${(b.perLevel * 100).toFixed(1)}% ${b.label} per level`).join(' · ');
        return `
          <div class="card">
            <div class="card-title"><span class="card-icon">${sp.eggIcon}</span> ${sp.eggName}
              <span class="pill rarity-${sp.rarity}">${sp.rarity}</span></div>
            <div class="card-sub">${entry.label}</div>
            <div class="card-sub" style="font-style:italic;opacity:0.75">${sp.blurb}</div>
            <div class="card-sub">Hatches into a <b>${sp.name}</b> · ${fmtDuration(sp.hatchMs / 1000)} to incubate</div>
            <div class="card-sub" style="color:var(--xp)">${bonus}</div>
            <div class="card-yield"><span class="cost ${afford ? '' : 'unaffordable'}">🪙 ${fmtInt(entry.gold)}</span></div>
            <button class="btn btn-sm ${afford ? 'btn-gold' : ''} btn-block" data-act="buy-egg"
                    data-species="${sp.id}" ${afford ? '' : 'disabled'}>Buy egg</button>
          </div>`;
      }).join('')}
    </div>

    ${compendium()}
  `;
}

// ---------------- The compendium ----------------
//
// Every species, whether you have met it or not, grouped by rarity and
// told where it comes from. This replaces a two-entry "Not for sale" list
// that had been correct in v1.2 and silently wrong ever since: ten species
// were added and the list did not know about any of them, so the game
// offered no way to find out they existed.
//
// It reads SPECIES_LIST directly, so it cannot go stale again.

function compendium() {
  const shopIds = new Set(EGG_SHOP.map(e => e.species));
  const order = ['common', 'rare', 'epic', 'legendary'];
  const found = SPECIES_LIST.filter(sp => hasSeen(sp.id)).length;

  const groups = order.map(rarity => {
    const list = SPECIES_LIST.filter(sp => sp.rarity === rarity);
    if (!list.length) return '';
    const cards = list.map(sp => {
      const seen = hasSeen(sp.id);
      const bonus = [sp.bonus, sp.bonus.second].filter(Boolean)
        .map(b => `+${(b.perLevel * 100).toFixed(1)}% ${b.label} per level`).join(' · ');
      return `
        <div class="card ${seen ? '' : 'locked'}">
          <div class="card-title">
            <span class="card-icon">${seen ? sp.eggIcon : '🥚'}</span>
            ${seen ? sp.eggName : '<span class="muted">Undiscovered</span>'}
            <span class="pill rarity-${sp.rarity}">${sp.rarity}</span>
          </div>
          <div class="card-sub">${seen ? sp.blurb : 'You have never held one of these.'}</div>
          <div class="card-sub">${seen
            ? `Hatches into a <b>${sp.name}</b>`
            : `${shopIds.has(sp.id) ? 'Sold in town.' : ''} ${EGG_SOURCES[sp.rarity]}`}</div>
          <div class="card-sub" style="color:var(--xp)">${seen ? bonus : '???'}</div>
        </div>`;
    }).join('');
    return `
      <div class="section-title" style="margin-top:14px">
        <span class="rarity-${rarity}">${rarity}</span>
        <span class="muted" style="font-weight:normal;font-size:11px"> · ${EGG_RARITY_ODDS[rarity]} of any egg that drops</span>
      </div>
      <div class="card-grid">${cards}</div>`;
  }).join('');

  return `
    <div class="section-title">📖 Compendium — ${found} / ${SPECIES_LIST.length} discovered</div>
    <div class="panel-desc">Every creature that exists, and where it comes from. Eggs drop from
    <b>boss kills</b> and <b>sealed Unstable Rifts</b> in this era; the Descent and the Vigil are
    more generous, when you get there. Rarity is rolled first and the species picked from that
    tier, so a common is common no matter how many you already own.</div>
    ${groups}
  `;
}

// ---------------- Panel ----------------

function tabBtn(id, label) {
  return `<button class="btn btn-sm ${petsUI.tab === id ? 'btn-primary' : ''}"
                  data-act="pets-tab" data-tab="${id}">${label}</button>`;
}

export function petsPanel() {
  // A pet that was selected then released shouldn't strand the view
  if (petsUI.selected && !state.pets?.owned?.[petsUI.selected]) petsUI.selected = null;

  const header = `
    <div class="panel-header">
      <div class="panel-title">🐾 The Menagerie</div>
      <div class="panel-subtitle">${pets().length} pet${pets().length === 1 ? '' : 's'} ·
        ${eggs().length} egg${eggs().length === 1 ? '' : 's'} warming ·
        ${fmtInt(state.pets?.hatched || 0)} hatched all told</div>
    </div>
    <div class="panel-desc">Creatures you raise. They get hungry whether or not you're watching, and a
    happy one makes the whole grind go faster. Nothing here can die — a neglected pet just sulks until you make it up to them.</div>
    ${companionBanner()}
    ${activePetSummary() ? '' : companionExplainer()}
    <div class="combat-controls" style="margin-top:14px">
      ${tabBtn('nest', '🥚 Nest')}
      ${tabBtn('breed', '💞 Breeding')}
      ${tabBtn('shop', '🏪 Hatchery')}
    </div>`;

  if (petsUI.selected) {
    const pet = state.pets.owned[petsUI.selected];
    return header + petDetail(pet);
  }

  if (petsUI.tab === 'breed') return header + breedingSection();
  if (petsUI.tab === 'shop') return header + shopSection();
  return header + incubatorSection() + rosterSection();
}
