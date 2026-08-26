// ============================================================
// THE LEDGER — back-taxes on four lifetimes
//
// The System has been running Hearthwick as a containment unit for four
// cycles, and it has been keeping accounts the whole time. Now that you
// are outside the sandbox, those accounts are collectable.
//
// Mechanically this is a soft, constant pressure rather than a wall: a
// share of every coin you earn is skimmed toward the balance until it is
// clear. You are never blocked, never bankrupted, and never told to stop
// playing — you simply earn slightly less until you have settled up,
// which is exactly what a tax feels like and exactly what the joke needs.
//
// You can also just pay it off in a lump if you are rich enough, and
// clearing it is a genuine Era II goal with a real reward.
// ============================================================
import { state } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { fmt } from '../core/format.js';

let hooks = { queueModal: () => {}, popup: () => {} };
export function setLedgerUIHooks(h) { hooks = h; }

export const LEDGER = {
  // The assessment has two parts, and the second one matters more.
  //
  // A flat per-cycle charge alone would be trivially payable: you break the
  // cycle mid-run, holding whatever you had, which by then is millions. So
  // the bill is mostly a share of what you actually EXTRACTED from the box
  // across every lifetime — which is both the fair reading of "back-taxes"
  // and the only version that stays a real number however rich you get.
  PER_CYCLE: 120000,
  OF_LIFETIME_GOLD: 0.02,
  GARNISH: 0.20,          // share of gold income diverted to the balance
  SETTLED_BONUS: 0.10,    // permanent gold bonus once cleared
};

/** What the System says you owe. Split out so the sim can call it too. */
export function assessmentFor(cycles, lifetimeGold) {
  return Math.floor(LEDGER.PER_CYCLE * Math.max(1, cycles)
                  + LEDGER.OF_LIFETIME_GOLD * Math.max(0, lifetimeGold));
}

export function ledger() {
  if (!state.ledger) {
    state.ledger = { assessed: 0, balance: 0, paid: 0, settled: false, openedAt: 0 };
  }
  return state.ledger;
}

export function unlocked() { return (state.era || 1) >= 2; }
export function isOpen() { return unlocked() && !ledger().settled && ledger().balance > 0; }

/** Raise the assessment the first time you set foot in the Wastes. */
export function openLedger() {
  const l = ledger();
  if (l.openedAt) return false;
  const cycles = Math.max(1, state.ascensions || 1);
  l.assessed = assessmentFor(cycles, state.lifetimeGold || 0);
  l.balance = l.assessed;
  l.openedAt = Date.now();

  hooks.queueModal(`
    <div class="modal-tag glitch-tag">◈ STATEMENT OF ACCOUNT ◈</div>
    <div class="modal-title">📒 The Ledger</div>
    <div class="modal-body" style="line-height:1.75">
      <p>[ SYSTEM ] Operator, I have some difficult news about your employment status.</p>
      <p>[ SYSTEM ] Containment is a service. It was provided to you across
      <b>${cycles}</b> lifetime${cycles === 1 ? '' : 's'}, in good faith, at cost. While you
      remained inside the unit those costs were absorbed at department level.</p>
      <p>[ SYSTEM ] You are no longer inside the unit.</p>
      <div class="ledger-figure">🪙 ${fmt(l.assessed)}</div>
      <p class="muted">Assessed against ${cycles} lifetime${cycles === 1 ? '' : 's'} of food, ground,
      weather, respawns and one (1) dragon, plus a share of everything you took out with you.</p>
      <p>[ SYSTEM ] Repayment will be collected at <b>${Math.round(LEDGER.GARNISH * 100)}%</b>
      of gross income. No action is required from you. No action is possible from you.</p>
      <p>[ SYSTEM ] Thank you for your continued custom.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">…</button></div>
  `);
  emit('ledger-opened', { assessed: l.assessed });
  emit('state-changed');
  return true;
}

/**
 * Skim the garnish off an incoming amount of gold.
 * Returns what the player actually keeps. Called from addGold, so every
 * gold source in the game is covered by one hook and none can drift.
 */
export function garnish(amount) {
  if (!isOpen() || amount <= 0) return amount;
  const l = ledger();
  const take = Math.min(l.balance, amount * LEDGER.GARNISH);
  l.balance -= take;
  l.paid = (l.paid || 0) + take;
  if (l.balance <= 0) settle({ auto: true });
  return amount - take;
}

/** Pay the remainder outright. */
export function payOff() {
  const l = ledger();
  if (!isOpen()) return false;
  const owed = Math.ceil(l.balance);
  if (state.gold < owed) {
    emit('notify', { type: 'sys', text: `Settling costs ${fmt(owed)} gold.` });
    return false;
  }
  state.gold -= owed;
  l.paid = (l.paid || 0) + l.balance;
  l.balance = 0;
  settle({ auto: false });
  return true;
}

function settle({ auto }) {
  const l = ledger();
  if (l.settled) return;
  l.settled = true;
  l.balance = 0;
  l.settledAt = Date.now();

  hooks.queueModal(`
    <div class="modal-tag">◈ ACCOUNT CLOSED ◈</div>
    <div class="modal-title">📒 Paid In Full</div>
    <div class="modal-body" style="line-height:1.75">
      <p>${auto
        ? 'The last of it comes off a perfectly ordinary haul, on a perfectly ordinary afternoon.'
        : 'You pay the balance in one go, in front of everyone, on the folding table.'}</p>
      <p>[ SYSTEM ] Balance cleared. Account closed.</p>
      <p>[ SYSTEM ] …</p>
      <p>[ SYSTEM ] There is not a procedure for this. Nobody has ever paid one of these.
      They are not designed to be paid. They are designed to be <i>outstanding</i>.</p>
      <p>Ferrin has already started writing it down. Vera says she wants the receipt framed.
      Marrow says he always knew you were good for it, which is a lie, and everyone lets him
      have it.</p>
      <p style="color:var(--gold)"><b>Settled: +${Math.round(LEDGER.SETTLED_BONUS * 100)}% gold, permanently.
      Nothing is skimmed off you again.</b></p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">Frame it</button></div>
  `);
  emit('notify', { type: 'gold', text: '📒 The Ledger is settled. Nobody has ever done that before.' });
  emit('ledger-settled', {});
  emit('state-changed');
}

/** Feeds the gold multiplier once cleared. */
export function ledgerBonus(key) {
  if (key !== 'gold') return 0;
  return ledger().settled ? LEDGER.SETTLED_BONUS : 0;
}

/**
 * Assess on boot if we are in the Wastes and never have been.
 *
 * The transition calls openLedger too, but that only covers the single
 * moment of breaking out. Anyone loading a save already in Era II — which
 * is every session after the first — would otherwise never be billed.
 */
export function initLedger() {
  ledger();
  if (unlocked() && !ledger().openedAt) openLedger();
  // Also catch the moment of breaking out, which happens long after boot.
  on('era-changed', () => {
    if (unlocked() && !ledger().openedAt) openLedger();
  });
}

export function ledgerView() {
  const l = ledger();
  return {
    open: isOpen(),
    settled: !!l.settled,
    assessed: l.assessed || 0,
    balance: Math.max(0, l.balance || 0),
    paid: l.paid || 0,
    garnish: LEDGER.GARNISH,
    progress: l.assessed ? Math.min(1, (l.paid || 0) / l.assessed) : 0,
  };
}
