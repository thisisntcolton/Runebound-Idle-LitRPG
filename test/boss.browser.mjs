// The Vigil: preparation as a stat, a health pool that outlives the
// session, and an aura that ends a round on its own.
import { chromium } from 'playwright';

const now = Date.now();
const skills = {};
for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing',
                 'smithing','cooking','alchemy','farming','thieving','runecrafting']) skills[k] = { xp: 0 };
for (const k of ['attack','strength','defense','hitpoints']) skills[k].xp = 14000000;
for (const k of ['mining','thieving','runecrafting','smithing','alchemy']) skills[k].xp = 6000000;

/** Deliberately UNPREPARED: no class, no pet, no potion, nothing stocked. */
const save = {
  version: 1, gold: 5000000, lifetimeGold: 60000000, shards: 40, ascensions: 6,
  skills, lastSeen: now, createdAt: now, era: 2, ending: 'broken', endingOfferedCycle: 4,
  equipment: { weapon:'runite_weapon', helmet:'runite_helmet', chest:'runite_chest',
               legs:'runite_legs', boots:'runite_boots', ring:null, amulet:null },
  inventory: { leviathan_steak: 20 },
  charStats: { STR: 60, AGI: 40, VIT: 40, INT: 0, LUK: 20 }, statPointsSpent: 160,
  upgrades: { whetstone: 20, polish: 20 },
  classId: null, classProgress: {},
  town: { unlocked: true, name: 'Hearthwick',
    plots: Array.from({ length: 9 }, () => ({ owned: false, building: null, level: 0, stock: {}, progress: 0 })),
    staff: {}, applicants: [], applicantsAt: 0, lifetimeRevenue: 0, cycles: 0, unpaid: 0,
    metNotables: {}, extraPopulation: 0, visitor: null, nextVisitorAt: now + 9e9,
    timesRazed: 5, lifetimeRevenueAllCycles: 0 },
  pets: { owned: {}, incubator: [], active: null, hatched: 0, bred: 0 },
  encounters: { nextAt: now + 9e9, offer: null, history: {}, resolved: 0 },
  ledger: { assessed: 0, balance: 0, paid: 0, settled: true, openedAt: now, graceMs: 9e9 },
  repo: { nextAt: now + 9e9, notice: null, camps: [], seized: 0, recovered: 0, repelled: 0 },
  salvage: { sites: [], active: null, nextSiteAt: 0, digs: 0, hauls: {} },
  deep: { best: 0, depth: 1, clears: 0, kills: 0, wardens: 0 },
  // Already up, with plenty of window left.
  worldBoss: { nextAt: 3600000, playMs: 0, up: true, hp: 400000, maxHp: 400000,
               surfacedAt: now, expiresAt: now + 36 * 3600000, felled: 0,
               dealt: 0, contactMs: 0, lastContactAt: 0, prep: 0 },
};

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1400, height: 950 } });
const errs = [];
await ctx.addInitScript(`(()=>{if(localStorage.getItem('__s'))return;localStorage.setItem('__s','1');
  localStorage.setItem('runebound-save-v1', ${JSON.stringify(JSON.stringify(save))});})()`);
const page = await ctx.newPage();
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log('  ✓', n)) : (fail++, console.log('  ✗', n, x)); };
const dismiss = async () => {
  for (let i = 0; i < 12; i++) {
    const open = await page.evaluate(() => !document.getElementById('modal-overlay')?.classList.contains('hidden'));
    if (!open) return;
    await page.evaluate(() => document.querySelector('#modal-window [data-act]')?.click());
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => document.getElementById('modal-overlay')?.classList.add('hidden'));
};
const go = async v => { await dismiss();
  await page.evaluate(v => document.querySelector(`[data-act="nav"][data-view="${v}"]`)?.click(), v);
  await page.waitForTimeout(300); };
const read = async () => { await page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
  Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true }); });
  await page.waitForTimeout(120);
  return page.evaluate(() => JSON.parse(localStorage.getItem('runebound-save-v1'))); };
const mutateSave = async fn => {
  await read();
  await page.evaluate(`(${fn.toString()})()`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
};

console.log('\n[it is standing there]');
ok('no runtime errors', errs.length === 0, errs.slice(0, 2).join(' | '));
await go('wastes');
const panel = await page.textContent('#main-panel');
ok('the Vigil has a block in the Wastes', /The Vigil/.test(panel));
ok('it states its health pool', /400,?000|400K/i.test(panel.replace(/\s+/g, ' ')),
   (panel.match(/[\d,\.]+K? \/ [\d,\.]+K?/) || [''])[0]);
ok('you can engage it directly', (await page.locator('[data-act="fight-boss"]').count()) === 1);

console.log('\n[preparation is a stat, and it is printed]');
ok('every preparation line is listed', (await page.locator('.prep-row').count()) === 7,
   String(await page.locator('.prep-row').count()));
// Not zero lines: the game hands you a class choice on load and you start
// at full health, so "whole" and possibly "a path walked" tick themselves.
// What matters is that the great majority are unmet and the number is low.
const coldMet = await page.locator('.prep-row.met').count();
ok('an unprepared player meets almost none of them', coldMet <= 2, `${coldMet} of 7`);
const coldMult = (await page.textContent('.prep-mult')).trim();
const coldValue = Number(coldMult.replace('×', ''));
ok('so the quoted multiplier is near the floor', coldValue <= 1.35, coldMult);

// Give them everything the checklist asks for and confirm it moves.
await mutateSave(() => {
  const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
  const t = Date.now();
  s.classId = 'ranger';
  s.deep.best = 14;
  s.inventory.leviathan_steak = 400;
  s.combat = { ...(s.combat || {}), foodItem: 'leviathan_steak' };
  s.buffs = { ...(s.buffs || {}), elixir: { expiresAt: t + 9e6, effects: { damage: 0.2 }, name: 'Elixir', icon: '⚗️' } };
  s.pets = { owned: { p1: { id: 'p1', species: 'dog', name: 'Socks', trait: 'clever', xp: 5000,
    stage: 'adult', hunger: 100, happy: 100, careAt: t, bornAt: t, lastPlayAt: 0, lastBredAt: 0, parents: null } },
    incubator: [], active: 'p1', hatched: 1, bred: 0 };
  s.town.plots[0] = { owned: true, building: 'lumber_yard', level: 3, stock: { oak_log: 400 }, progress: 0 };
  s.town.plots[1] = { owned: true, building: 'market_stall', level: 3, stock: { oak_log: 400 }, progress: 0 };
  s.town.staff = { a: { id: 'a', name: 'A', icon: '🧑', trait: 'diligent', skill: 5, wage: 60, assigned: 0 },
                   b: { id: 'b', name: 'B', icon: '🧑', trait: 'diligent', skill: 5, wage: 60, assigned: 1 } };
  const real = Storage.prototype.setItem.bind(localStorage);
  real('runebound-save-v1', JSON.stringify(s));
  Storage.prototype.setItem = function (k, v) { if (k === 'runebound-save-v1') return; return real(k, v); };
});
await go('wastes');
const metNow = await page.locator('.prep-row.met').count();
ok('bringing the right things ticks the lines', metNow >= 6, `${metNow} of 7`);
const readyMult = (await page.textContent('.prep-mult')).trim();
const readyValue = Number(readyMult.replace('×', ''));
ok('and the multiplier follows, well clear of the cold one',
   readyValue >= coldValue + 0.6, `${coldMult} -> ${readyMult}`);

console.log('\n[the fight]');
const hp0 = (await read()).worldBoss.hp;
await page.locator('[data-act="fight-boss"]').click();
await page.waitForTimeout(600);
ok('engaging opens the arena', (await page.locator('.combat-arena').count()) === 1);
ok('and the banner names it', /THE VIGIL/i.test(await page.textContent('#main-panel')));
const locked = await read();
ok('preparation is locked in for the round', (locked.worldBoss.prep || 0) > 0,
   `×${(1 + (locked.worldBoss.prep || 0)).toFixed(2)}`);

await page.waitForTimeout(9000);
const st = await read();
ok('damage lands on the persistent pool, not just the bar',
   st.worldBoss.hp < hp0, `${Math.round(hp0)} -> ${Math.round(st.worldBoss.hp)}`);
ok('and it is banked as progress for this surfacing',
   (st.worldBoss.dealt || 0) > 0, String(Math.round(st.worldBoss.dealt || 0)));
ok('the aura is counting your time in contact',
   (st.worldBoss.contactMs || 0) > 0, `${Math.round((st.worldBoss.contactMs || 0) / 1000)}s`);

console.log('\n[the pool outlives the session]');
const hpBeforeReload = st.worldBoss.hp;
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await dismiss();
const after = await read();
ok('reloading does not heal it',
   Math.abs(after.worldBoss.hp - hpBeforeReload) < 1000,
   `${Math.round(hpBeforeReload)} -> ${Math.round(after.worldBoss.hp)}`);
ok('and it is still up', after.worldBoss.up === true);

console.log('\n[backing out costs nothing but the walk]');
await go('wastes');
const goldBefore = (await read()).gold;
if ((await page.locator('[data-act="stop-combat"]').count()) > 0) {
  await page.locator('[data-act="stop-combat"]').first().click();
  await page.waitForTimeout(400);
}
const out = await read();
ok('disengaging keeps every point you landed', out.worldBoss.hp <= hpBeforeReload + 1);
ok('and does not take your gold', out.gold >= goldBefore);

console.log('\n[it can actually be killed]');
await mutateSave(() => {
  const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
  s.worldBoss.hp = 40;                 // one swing from done
  const real = Storage.prototype.setItem.bind(localStorage);
  real('runebound-save-v1', JSON.stringify(s));
  Storage.prototype.setItem = function (k, v) { if (k === 'runebound-save-v1') return; return real(k, v); };
});
await go('wastes');
await page.locator('[data-act="fight-boss"]').click();
await page.waitForTimeout(5000);
await dismiss();
const dead = await read();
ok('the last hit fells it', (dead.worldBoss.felled || 0) === 1, String(dead.worldBoss.felled));
ok('it goes back down', dead.worldBoss.up === false);
ok('and the trophy is permanent', (dead.worldBoss.felled || 0) > 0);
await go('wastes');
ok('the Wastes report the trophy',
   /Trophies:/.test(await page.textContent('#main-panel')),
   (await page.textContent('#main-panel')).match(/Trophies:[^\n]{0,80}/)?.[0]);

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length) { console.log('\nErrors:'); [...new Set(errs)].slice(0, 6).forEach(e => console.log('  !', e)); }
await b.close(); process.exit(fail ? 1 : 0);
