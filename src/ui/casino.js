// ============================================================
// THE GILDED SNAKE — the felt, the dice, and the books
//
// The panel deliberately shows your lifetime net at the top, in the
// colour it actually is. No feature in this game is more inclined to
// flatter the player, so this one does the opposite: it states what the
// house has taken and does not editorialise about it.
// ============================================================
import { state } from '../core/state.js';
import { CASINO, handValue, HOUSE_LINES } from '../data/casino.js';
import { casinoView } from '../systems/casino.js';
import { fmt, fmtInt } from '../core/format.js';

export const casinoUI = { table: 'blackjack', bet: null };

function card(c, hidden = false) {
  if (hidden) return `<div class="pcard back"><span>◈</span></div>`;
  const red = c.s === '♥' || c.s === '♦';
  return `
    <div class="pcard ${red ? 'red' : ''}">
      <span class="pcard-r">${c.r}</span>
      <span class="pcard-s">${c.s}</span>
    </div>`;
}

function hand(cards, { hideSecond = false } = {}) {
  return `<div class="pcard-row">${cards.map((c, i) => card(c, hideSecond && i === 1)).join('')}</div>`;
}

function betControls(v) {
  const bet = casinoUI.bet ?? v.lastBet;
  const steps = [
    ['min', v.minBet],
    ['×2', Math.min(v.maxBet, bet * 2)],
    ['½', Math.max(v.minBet, Math.floor(bet / 2))],
    ['max', v.maxBet],
  ];
  return `
    <div class="bet-row">
      <label class="muted">Stake</label>
      <input id="casino-bet" class="bet-input" type="number" value="${bet}"
             min="${v.minBet}" max="${v.maxBet}" step="${v.minBet}" />
      ${steps.map(([l, n]) => `<button class="btn btn-sm" data-act="casino-bet" data-bet="${n}">${l}</button>`).join('')}
      <span class="muted">table limit 🪙 ${fmt(v.maxBet)}</span>
    </div>`;
}

// ---------------- Blackjack ----------------

function blackjackTable(v) {
  const h = v.hand;
  if (!h) {
    return `
      ${betControls(v)}
      <div class="felt empty">
        <div class="muted">The dealer waits. He is in no hurry whatsoever.</div>
        <button class="btn btn-gold" data-act="casino-deal">Deal</button>
      </div>
      ${rulesBlock()}`;
  }

  const p = handValue(h.player);
  const d = handValue(h.dealer);
  const over = h.done;

  return `
    <div class="felt">
      <div class="felt-side">
        <div class="felt-label">Dealer ${over ? `— <b>${d.total}${d.bust ? ' bust' : ''}</b>` : ''}</div>
        ${hand(h.dealer, { hideSecond: !over })}
      </div>
      <div class="felt-side">
        <div class="felt-label">You — <b>${p.total}${p.soft ? ' soft' : ''}${p.bust ? ' bust' : ''}</b>
          · staked 🪙 ${fmt(h.bet)}${h.doubled ? ' (doubled)' : ''}</div>
        ${hand(h.player)}
      </div>

      ${over
        ? `<div class="felt-result ${h.result === 'lose' ? 'lost' : h.result === 'push' ? 'push' : 'won'}">
             ${h.line}
           </div>
           <button class="btn btn-gold" data-act="casino-clear">Again</button>`
        : `<div class="felt-actions">
             <button class="btn btn-primary" data-act="casino-hit">Hit</button>
             <button class="btn" data-act="casino-stand">Stand</button>
             ${h.player.length === 2 && state.gold >= h.bet
               ? `<button class="btn" data-act="casino-double">Double</button>` : ''}
           </div>`}
    </div>`;
}

// ---------------- Hazard ----------------

function pip(n) {
  return `<div class="die">${['','⚀','⚁','⚂','⚃','⚄','⚅'][n]}</div>`;
}

function hazardTable(v) {
  const g = v.hazard;
  if (!g) {
    return `
      ${betControls(v)}
      <div class="felt empty">
        <div class="muted">Two dice, worn smooth. The dealer does not touch them.</div>
        <button class="btn btn-gold" data-act="casino-hazard">Roll</button>
      </div>
      ${rulesBlock()}`;
  }
  const last = g.last;
  return `
    <div class="felt">
      <div class="dice-row">${pip(last.a)}${pip(last.b)}<div class="dice-total">${last.total}</div></div>
      <div class="felt-label">
        ${g.point ? `Your point is <b>${g.point}</b>. Roll it again before a seven.` : 'Come out roll.'}
        · staked 🪙 ${fmt(g.bet)} · ${g.rolls.length} roll${g.rolls.length === 1 ? '' : 's'}
      </div>
      ${g.done
        ? `<div class="felt-result ${g.result === 'lose' ? 'lost' : 'won'}">${g.line}</div>
           <button class="btn btn-gold" data-act="casino-hazard-clear">Again</button>`
        : `<button class="btn btn-primary" data-act="casino-hazard-roll">Roll again</button>`}
    </div>`;
}

// ---------------- Rules, stated plainly ----------------

function rulesBlock() {
  if (casinoUI.table === 'hazard') {
    return `
      <div class="rules">
        <b>Hazard.</b> Two dice. <b>7</b> or <b>11</b> wins at once; <b>2</b>, <b>3</b> or <b>12</b>
        loses at once. Anything else becomes your <b>point</b> — roll it again before a seven and
        you win. A win pays ${(CASINO.HAZARD_PAYOUT * 100).toFixed(0)}% of your stake, which is
        slightly less than even money. That is not a mistake.
      </div>`;
  }
  return `
    <div class="rules">
      <b>Blackjack.</b> Get closer to 21 than the dealer without going over. Aces are 11 or 1.
      The dealer draws to ${CASINO.DEALER_STANDS_ON} and stands on it, every time, with no
      discretion at all. Blackjack pays <b>3:2</b>. You may double on your first two cards.
      Six decks, reshuffled long before the shoe runs out.
    </div>`;
}

// ---------------- Panel ----------------

export function casinoPanel() {
  const v = casinoView();

  if (!v.open) {
    return `
      <div class="panel-header"><div class="panel-title">🎲 The Gilded Snake</div>
        <div class="panel-subtitle">Closed to you</div></div>
      <div class="panel-desc">
        There is a door on the far side of the square with no sign on it. It was here before you
        bought your first parcel.<br><br>
        <span class="lock-req">🔒 They start taking strangers once Hearthwick reaches
        town level ${v.unlockAt}.</span>
      </div>`;
  }

  const L = v.ledger;
  const netClass = L.net > 0 ? 'won' : L.net < 0 ? 'lost' : '';
  const line = HOUSE_LINES[(L.hands || 0) % HOUSE_LINES.length];

  return `
    <div class="panel-header">
      <div class="panel-title">🎲 The Gilded Snake</div>
      <div class="panel-subtitle">You do not own this one</div>
    </div>
    <div class="panel-desc">${line}</div>

    <div class="house-books">
      <div><div class="muted">WAGERED</div><div class="shop-row-title">🪙 ${fmt(L.wagered)}</div></div>
      <div><div class="muted">HANDS</div><div class="shop-row-title">${fmtInt(L.hands)}</div></div>
      <div><div class="muted">BEST WIN</div><div class="shop-row-title" style="color:var(--xp)">🪙 ${fmt(L.bestWin)}</div></div>
      <div><div class="muted">WORST LOSS</div><div class="shop-row-title" style="color:var(--danger)">🪙 ${fmt(L.worstLoss)}</div></div>
      <div><div class="muted">NET</div>
        <div class="shop-row-title felt-result-inline ${netClass}">${L.net >= 0 ? '+' : '−'}🪙 ${fmt(Math.abs(L.net))}</div></div>
    </div>

    <div class="tab-row">
      <button class="btn btn-sm ${casinoUI.table === 'blackjack' ? 'btn-primary' : ''}"
              data-act="casino-table" data-table="blackjack">🂡 Blackjack</button>
      <button class="btn btn-sm ${casinoUI.table === 'hazard' ? 'btn-primary' : ''}"
              data-act="casino-table" data-table="hazard">🎲 Hazard</button>
    </div>

    ${casinoUI.table === 'blackjack' ? blackjackTable(v) : hazardTable(v)}
  `;
}
