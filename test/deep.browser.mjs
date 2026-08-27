// The Descent: the ladder, the cap, the permanent bonus, and the two
// fallback seizures the Syndicate reaches for when there is nothing left
// to crate. Also the Ascendant tier and Masteries, since all three are the
// same promise — progress that Ascension cannot take back.
import { chromium } from 'playwright';
import { xpForLevel } from '../src/core/xp.js';
import { MASTERIES } from '../src/data/talents.js';

const now = Date.now();
const skills = {};
for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing',
                 'smithing','cooking','alchemy','farming','thieving','runecrafting']) skills[k] = { xp: 0 };
for (const k of ['attack','strength','defense','hitpoints']) skills[k].xp = 14000000;
for (const k of ['mining','thieving','runecrafting','smithing']) skills[k].xp = 6000000;
// The Ascend bar rises every cycle and at six ascensions it is the 850
// plateau. A fixture below it cannot Ascend, which silently skips every
// assertion in this file that is about Ascension.
for (const k of ['woodcutting','fishing','cooking','alchemy','farming']) skills[k].xp = xpForLevel(90);

/** A player deep in Era II, with a capped Artisan tree and no class picked. */
const save = {
  version: 1, gold: 5000000, lifetimeGold: 60000000, shards: 40, ascensions: 6,
  skills, lastSeen: now, createdAt: now, era: 2, ending: 'broken', endingOfferedCycle: 4,
  equipment: { weapon:'runite_weapon', helmet:'runite_helmet', chest:'runite_chest',
               legs:'runite_legs', boots:'runite_boots', ring:null, amulet:null },
  inventory: { leviathan_steak: 400, glitched_ore: 900 },
  charStats: { STR: 60, AGI: 40, VIT: 40, INT: 0, LUK: 20 }, statPointsSpent: 160,
  upgrades: { whetstone: 20, polish: 20 },
  // Capped Artisan tree, and NO active class — exactly the state the bug
  // report described: "I maxed out artisan and after the reset my
  // marketplace still only allows 1 staff member."
  classId: null, classChosenAt: 0,
  classProgress: { artisan: { xp: 900000000, spent: { a_capstone: 1 }, pointsUsed: 8 } },
  // Masteries are no longer derived from classProgress — the trees reset
  // now, so a permanent bonus could not live inside them. They are a
  // stacking count on state, kept by name through Ascension.
  masteries: { artisan: 1 },
  town: { unlocked: true, name: 'Hearthwick',
    plots: Array.from({ length: 9 }, (_, i) => i < 2
      ? { owned: true, building: ['market_stall','lumber_yard'][i], level: 3, stock: { oak_log: 200 }, progress: 0 }
      : { owned: false, building: null, level: 0, stock: {}, progress: 0 }),
    staff: {}, applicants: [], applicantsAt: 0, lifetimeRevenue: 500000, cycles: 300,
    unpaid: 0, metNotables: {}, extraPopulation: 4, visitor: null, nextVisitorAt: now + 9e9,
    timesRazed: 5, lifetimeRevenueAllCycles: 2000000 },
  pets: { owned: {}, incubator: [], active: null, hatched: 0, bred: 0 },
  encounters: { nextAt: now + 9e9, offer: null, history: {}, resolved: 0 },
  ledger: { assessed: 0, balance: 0, paid: 0, settled: true, openedAt: now, graceMs: 9e9 },
  repo: { nextAt: now + 9e9, notice: null, camps: [], seized: 0, recovered: 0, repelled: 0 },
  salvage: { sites: [], active: null, nextSiteAt: 0, digs: 0, hauls: {} },
  deep: { best: 0, depth: 1, clears: 0, kills: 0, wardens: 0 },
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
const modalOpen = () => page.evaluate(() => !document.getElementById('modal-overlay')?.classList.contains('hidden'));
const dismiss = async () => {
  for (let i = 0; i < 10; i++) { if (!await modalOpen()) return;
    await page.evaluate(() => document.querySelector('#modal-window [data-act]')?.click());
    await page.waitForTimeout(160); }
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

console.log('\n[boot]');
ok('no runtime errors', errs.length === 0, errs.slice(0, 2).join(' | '));

// ------------------------------------------------------------
console.log('\n[the artisan capstone bug]');
await go('town');
// Plot 0 is a Market Stall: one staff slot of its own, and the Artisan
// Mastery's permanent slot on top of it = 2. Before the fix this read
// "0 / 1 positions filled" because classBonus short-circuits on a null
// class, which is exactly what Ascension leaves behind.
const openPlot = async n => {
  // The parcel is an SVG <g>; go through Playwright rather than a raw
  // dispatch so it is scrolled into view and hit properly.
  await page.locator(`[data-act="select-plot"][data-plot="${n}"]`).click();
  await page.waitForTimeout(350);
  return (await page.textContent('#main-panel')).replace(/\s+/g, ' ');
};
const plotText = await openPlot(0);
ok('a capped tree still grants its staff slot with NO class active',
   /STAFF ?0\/2\b/.test(plotText), (plotText.match(/STAFF ?\d+\/\d+/g) || []).join(', '));

await go('class');
const pathText = await page.textContent('#main-panel');
ok('the Mastery is listed as earned', /The Valley Remembers/.test(pathText));
ok('and shown as active', (await page.locator('.mastery-row.earned').count()) >= 1,
   String(await page.locator('.mastery-row.earned').count()));
// Counted against the data: adding a class adds a Mastery, and this
// should not be a red test every time somebody does that.
ok('every class has a Mastery on the board',
   (await page.locator('.mastery-row').count()) === Object.keys(MASTERIES).length,
   `${await page.locator('.mastery-row').count()} of ${Object.keys(MASTERIES).length}`);

// ------------------------------------------------------------
console.log('\n[the ascendant tier]');
await mutateSave(() => {
  const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
  s.classId = 'artisan';
  s.era = 1;                              // back in the box
  const real = Storage.prototype.setItem.bind(localStorage);
  real('runebound-save-v1', JSON.stringify(s));
  Storage.prototype.setItem = function (k, v) { if (k === 'runebound-save-v1') return; return real(k, v); };
});
await go('class');
const era1Tree = await page.textContent('#main-panel');
ok('the Ascendant tier is visible from inside the sandbox', /Ascendant/.test(era1Tree));
ok('but it is sealed there', /Sealed/.test(era1Tree) || /does not resolve/.test(era1Tree));
ok('and its node cannot be bought',
   (await page.locator('[data-act="buy-talent"][data-node="a_ascend"]').count()) === 0);

await mutateSave(() => {
  const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
  s.era = 2;
  const real = Storage.prototype.setItem.bind(localStorage);
  real('runebound-save-v1', JSON.stringify(s));
  Storage.prototype.setItem = function (k, v) { if (k === 'runebound-save-v1') return; return real(k, v); };
});
await go('class');
const era2Tree = await page.textContent('#main-panel');
ok('out in the Wastes it opens', /Company Town/.test(era2Tree));
ok('and is now buyable',
   (await page.locator('[data-act="buy-talent"][data-node="a_ascend"]').count()) === 1);
await page.locator('[data-act="buy-talent"][data-node="a_ascend"]').click();
await page.waitForTimeout(400);
const stA = await read();
ok('buying it records the rank', (stA.classProgress?.artisan?.spent?.a_ascend || 0) === 1);
await go('town');
// Artisan active: the building's 1 + the class passive 1 + the capstone 1
// + the Ascendant node's 1 = 4. (The Mastery does not stack on top of the
// class it came from — while you walk that path you have the whole tree.)
const plotText2 = await openPlot(0);
ok('and it pays another staff slot', /STAFF ?0\/4\b/.test(plotText2),
   (plotText2.match(/STAFF ?\d+\/\d+/g) || []).join(', '));

// ------------------------------------------------------------
console.log('\n[the descent]');
await go('wastes');
const w = await page.textContent('#main-panel');
ok('the Descent has its own block', /The Descent/.test(w));
ok('it names the floor and the stratum', /Floor 1/.test(w) && /Overburden/.test(w));
ok('the cap is stated', /deepest reach 0 \/ 26/.test(w), (w.match(/deepest reach [^<]*/) || [''])[0]);
ok('you can go down without being robbed first',
   (await page.locator('[data-act="start-descent"]').count()) === 1);
ok('only the next floor is selectable',
   (await page.locator('.floor-pill').count()) === 1,
   String(await page.locator('.floor-pill').count()));

await page.locator('[data-act="start-descent"]').click();
await page.waitForTimeout(500);
await go('combat');
ok('the arena renders for a Descent fight', (await page.locator('.combat-arena').count()) === 1);
ok('the floor banner is shown', /THE DESCENT/.test(await page.textContent('#main-panel')));

// Fight long enough to hold the floor and open the next.
for (let i = 0; i < 70; i++) {
  await page.waitForTimeout(900);
  await dismiss();
  const st = await read();
  if ((st.deep?.best || 0) >= 1) break;
}
await dismiss();
const st2 = await read();
ok('kills credit the floor', (st2.deep?.kills || 0) > 0, String(st2.deep?.kills));
ok('holding the floor opens the next', (st2.deep?.best || 0) >= 1, `best ${st2.deep?.best}`);

await go('wastes');
ok('the deepest reach pays a standing bonus',
   /⚔️ \+[1-9]/.test(await page.textContent('#main-panel')),
   (await page.textContent('#main-panel')).match(/standing bonus[\s\S]{0,60}/)?.[0]);
ok('and a second floor is now selectable',
   (await page.locator('.floor-pill').count()) >= 2,
   String(await page.locator('.floor-pill').count()));

// Depth must survive the thing that resets everything else.
await mutateSave(() => {
  const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
  s.deep.best = 12;
  const real = Storage.prototype.setItem.bind(localStorage);
  real('runebound-save-v1', JSON.stringify(s));
  Storage.prototype.setItem = function (k, v) { if (k === 'runebound-save-v1') return; return real(k, v); };
});
const capBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('runebound-save-v1')).ascensions);
// The class-choice modal re-offers itself constantly once classId is null,
// and it will sit on top of the ascend confirmation. Clear, click, clear.
let ascended = false;
for (let i = 0; i < 8 && !ascended; i++) {
  await go('ascension');
  await dismiss();
  await page.evaluate(() => document.querySelector('[data-act="ascend"]')?.click());
  await page.waitForTimeout(500);
  if ((await page.locator('[data-act="confirm-ascend"]').count()) > 0) {
    await page.locator('[data-act="confirm-ascend"]').click();
    await page.waitForTimeout(1200);
    ascended = true;
  }
  await dismiss();
}
const st3 = await read();
// The Descent used to survive Ascension on the argument that depth was
// "the one number that only goes up". In practice it meant a returning
// player skipped the whole ramp, which was a real part of why the late
// cycles were over before they started. It resets with everything else;
// what carries is the Mastery.
ok('Ascension now resets your depth too', (st3.deep?.best || 0) === 0, String(st3.deep?.best));
ok('but it does raise the ceiling', (st3.ascensions || 0) === capBefore + 1);
await go('wastes');
// Depth back to zero, ceiling raised by the Ascension — the panel has to
// show both halves or the reset reads as pure loss.
ok('and the panel shows the reset depth against the higher ceiling',
   /deepest reach 0 \/ 29/.test(await page.textContent('#main-panel')),
   (await page.textContent('#main-panel')).match(/deepest reach [^\n]*/)?.[0]);

// ------------------------------------------------------------
console.log('\n[the syndicate always finds something]');
// A player with nothing crateable: no pets, no enchants, every building at
// level 1. Before the fallbacks this served no notice at all, ever.
await mutateSave(() => {
  const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
  s.enchants = {};
  s.pets = { owned: {}, incubator: [], active: null, hatched: 0, bred: 0 };
  for (const p of s.town.plots) if (p.building) p.level = 1;
  s.inventory = { glitched_ore: 900, leviathan_steak: 400 };
  s.repo = { nextAt: Date.now() - 1000, notice: null, camps: [], seized: 0, recovered: 0, repelled: 0 };
  const real = Storage.prototype.setItem.bind(localStorage);
  real('runebound-save-v1', JSON.stringify(s));
  Storage.prototype.setItem = function (k, v) { if (k === 'runebound-save-v1') return; return real(k, v); };
});
await dismiss();
await go('wastes');
let served = false;
for (let i = 0; i < 20 && !served; i++) {
  await page.waitForTimeout(600); await dismiss();
  served = (await page.locator('[data-act="repo-contest"]').count()) > 0;
  if (!served) await go('wastes');
}
ok('a notice is served even with nothing conventional to take', served);
if (served) {
  const notice = await page.textContent('.repo-card');
  ok('and it names a fallback: materials, a levy, or a lien',
     /\d+×|as a levy|a lien on/.test(notice), notice.replace(/\s+/g, ' ').slice(0, 140));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length) { console.log('\nErrors:'); [...new Set(errs)].slice(0, 8).forEach(e => console.log('  !', e)); }
await b.close(); process.exit(fail ? 1 : 0);
