// The v1.7 batch, in a browser: the casino, pet errands, the town's new
// payroll, and the new content actually appearing where a player looks.
import { chromium } from 'playwright';
import { EGG_SHOP } from '../src/data/pets.js';
import { DEEDS } from '../src/data/quests.js';
import { PERKS } from '../src/data/upgrades.js';
import { ABILITY_LIST } from '../src/data/abilities.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';

const now = Date.now();
const skills = {};
for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing',
                 'smithing','cooking','alchemy','farming','thieving','runecrafting']) skills[k] = { xp: 0 };
for (const k of ['attack','strength','defense','hitpoints']) skills[k].xp = 1200000;

// A pet that has finished: level 60 and thriving, which is the errand gate.
const pet = {
  id: 'p1', name: 'Biscuit', species: 'cat', trait: 'greedy', stage: 'elder',
  xp: 9000000, hunger: 100, happy: 100, careAt: now, born: now,
};

const base = {
  version: 1, gold: 8000000, lifetimeGold: 40000000, shards: 400, ascensions: 3,
  skills, lastSeen: now, createdAt: now, era: 1,
  equipment: { weapon: null, helmet: null, chest: null, legs: null, boots: null, ring: null, amulet: null },
  // The larder needs something in it, and one plain meal plus one that
  // carries a buff, so both branches of canEat are exercised.
  inventory: { trout: 20, hearth_pie: 3 },
  charStats: { STR: 20, AGI: 10, VIT: 10, INT: 0, LUK: 0 }, statPointsSpent: 40,
  // A chosen class, so the class-choice modal does not re-offer over
  // every button in the suite.
  classId: 'artisan', classChosenAt: now, classProgress: {},
  pets: { owned: { p1: pet }, incubator: [], active: null, hatched: 4, bred: 1, seen: { cat: now } },
  town: {
    unlocked: true, name: 'Hearthwick', applicants: [],
    // Commission is a share of goods moved, so it only exists once
    // somebody is actually moving them. A plot with no staff has none.
    staff: { w1: { id: 'w1', name: 'Perrin Vane', icon: '🧑‍🌾', trait: 'diligent',
                   skill: 4, wage: 58, assigned: 0 } },
    cycles: 40, lifetimeRevenue: 500000,
    // Plot 0 built (for the payroll checks), plot 1 owned but EMPTY so the
    // build menu is reachable — an unowned parcel offers a purchase prompt,
    // not a list of buildings.
    plots: Array.from({ length: 9 }, (_, i) =>
      i === 0 ? { owned: true, building: 'market_stall', level: 4, stock: { runite_bar: 40 }, progress: 0 }
    : i === 1 ? { owned: true, building: null, level: 0, stock: {}, progress: 0 }
    :           { owned: false, building: null, level: 0, stock: {}, progress: 0 }),
  },
};

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1400, height: 950 } });
const errs = [];
await ctx.addInitScript(`(()=>{if(localStorage.getItem('__s'))return;localStorage.setItem('__s','1');
  localStorage.setItem('runebound-save-v1', ${JSON.stringify(JSON.stringify(base))});})()`);
const page = await ctx.newPage();
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log('  ✓', n)) : (fail++, console.log('  ✗', n, x)); };
const dismiss = async () => {
  for (let i = 0; i < 20; i++) {
    const open = await page.evaluate(() => !document.getElementById('modal-overlay')?.classList.contains('hidden'));
    if (!open) return;
    await page.evaluate(() => document.querySelector('#modal-window [data-act="close-modal"]')
      ?.click() ?? document.querySelector('#modal-window [data-act]')?.click());
    await page.waitForTimeout(130);
  }
  await page.evaluate(() => document.getElementById('modal-overlay')?.classList.add('hidden'));
};
const go = async v => { await dismiss();
  await page.evaluate(v => document.querySelector(`[data-act="nav"][data-view="${v}"]`)?.click(), v);
  await page.waitForTimeout(340); };
const forceSave = async () => { await page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
  Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true }); });
  await page.waitForTimeout(140); };

console.log('\n[the casino exists and is not yours]');
await go('casino');
const cas = await page.textContent('#main-panel');
ok('the Gilded Snake has a panel', /Gilded Snake/.test(cas));
ok('and says plainly you do not own it', /do not own this one/i.test(cas));
ok('the books are on show', /WAGERED/.test(cas) && /NET/.test(cas));
ok('both games are offered',
   (await page.locator('[data-act="casino-table"]').count()) === 2);

console.log('\n[blackjack deals and settles]');
await forceSave();
const wageredBefore = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('runebound-save-v1') || '{}').casino?.wagered || 0);
await page.evaluate(() => document.querySelector('[data-act="casino-deal"]')?.click());
await page.waitForTimeout(350);
ok('four cards hit the felt', (await page.locator('.pcard').count()) === 4);
// A natural resolves the hand on the deal, and a resolved hand shows the
// dealer's whole hand — so only assert the hole card while play continues.
const stillPlaying = (await page.locator('[data-act="casino-hit"]').count()) > 0;
ok('the dealer keeps one face down while the hand is live',
   !stillPlaying || (await page.locator('.pcard.back').count()) === 1,
   stillPlaying ? 'live hand' : 'resolved on the deal');
await forceSave();
// Asserted against the wager rather than the purse: a natural blackjack
// pays out on the deal, so the purse can legitimately be HIGHER a moment
// later. The turnover only ever goes up.
const wageredAfter = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('runebound-save-v1') || '{}').casino?.wagered || 0);
ok('the stake is taken and booked', wageredAfter > wageredBefore, `${wageredBefore} -> ${wageredAfter}`);
for (let i = 0; i < 8 && !(await page.locator('[data-act="casino-clear"]').count()); i++) {
  await page.evaluate(() => document.querySelector('[data-act="casino-stand"]')
    ?.click() ?? document.querySelector('[data-act="casino-hit"]')?.click());
  await page.waitForTimeout(220);
}
ok('the hand resolves and says what happened',
   (await page.locator('.felt-result').count()) === 1,
   (await page.textContent('.felt-result').catch(() => ''))?.slice(0, 50));
ok('the dealer\'s hand is revealed at the end', (await page.locator('.pcard.back').count()) === 0);

console.log('\n[the dice are reachable without clearing the table by hand]');
await page.evaluate(() => document.querySelector('[data-act="casino-table"][data-table="hazard"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('[data-act="casino-hazard"]')?.click());
await page.waitForTimeout(300);
ok('two dice are rolled', (await page.locator('.die').count()) === 2);
const hz = await page.textContent('#main-panel');
ok('and it says where you stand', /come out roll|point is/i.test(hz));

console.log('\n[a finished pet can be sent to work]');
await go('pets');
await page.evaluate(() => document.querySelector('[data-act="select-pet"]')
  ?.click() ?? document.querySelector('.pet-tile')?.click());
await page.waitForTimeout(350);
const petTxt = await page.textContent('#main-panel');
ok('the errand board is on the pet', /Errands/.test(petTxt));
ok('it says what the work costs them', /faster while they work|7×/.test(petTxt.replace(/\s+/g, ' ')));
ok('and that it is not indefinite', /10 minutes/.test(petTxt));
const sendable = await page.locator('[data-act="pet-errand"]').count();
ok('a maxed, thriving pet can actually be sent', sendable >= 6, String(sendable));
if (sendable) {
  // The class-choice modal re-offers constantly while classId is null and
  // will sit on top of the button, so dismiss it and click through the DOM
  // rather than through a locator that waits for a clear pointer path.
  await dismiss();
  await page.evaluate(() => document.querySelector('[data-act="pet-errand"]')?.click());
  await page.waitForTimeout(400);
  ok('sending it puts it out of reach', /Out on an errand/.test(await page.textContent('#main-panel')));
}

console.log('\n[the town pays its people properly]');
await go('town');
// The plot is an SVG <g>, which has no .click() method at all — it has to
// go through Playwright's locator, which dispatches a real pointer event.
await page.locator('[data-act="select-plot"][data-plot="0"]').click();
await page.waitForTimeout(350);
const town = await page.textContent('#main-panel');
ok('wages are broken out', /WAGES \/ SHIFT/.test(town));
ok('and the commission is named', /commission/i.test(town), town.match(/[\d,]+ wages \+ [\d,]+ commission/)?.[0] || '');

console.log('\n[the new content is where a player looks]');
await go('ascension');
const asc = await page.textContent('#main-panel');
ok('every Fate Perk is listed', (await page.locator('[data-act="buy-perk"]').count())
   + (await page.locator('text=MAX').count()) >= PERKS.length, String(PERKS.length));
ok('the expensive ones are there', /Compound Interest/.test(asc) && /The Long Memory/.test(asc));
ok('and they cost far more', /120/.test(asc));

await go('abilities');
const ab = await page.textContent('#main-panel');
ok('all abilities are listed', new RegExp(`/ ${ABILITY_LIST.length} learned`).test(ab),
   (ab.match(/\d+ \/ \d+ learned/) || [''])[0]);
ok('the new ones are named', /Riposte/.test(ab) && /Last Word/.test(ab) && /Hollow Point/.test(ab));

await go('achievements');
const ach = await page.textContent('#main-panel');
ok('the achievement count includes the new ones',
   new RegExp(`/\\s*${ACHIEVEMENTS.length}`).test(ach.replace(/\s+/g, ' ')),
   (ach.match(/\d+\s*\/\s*\d+/) || [''])[0]);

await go('journal');
const jr = await page.textContent('#main-panel');
ok('deeds show up in the Journal', /DEED|Deed/.test(jr) || /road|Menagerie|dealer/.test(jr));


console.log('\n[a class knows a skill]');
await go('class');
const cls = await page.textContent('#main-panel');
ok('class cards state their specialty', /simply for walking this path/.test(cls));
ok('and name the skill and the amount', /\+20 Smithing|\+20 Thieving|\+20 Alchemy/.test(cls), (cls.match(/\+20 \w+/) || [''])[0]);
// The fixture is an Artisan, whose skill is Smithing.
await go('skill:smithing');
const smi = await page.textContent('#main-panel');
ok('the skill panel shows where the free levels came from', /\+20 Artisan/.test(smi),
   (smi.match(/Lv\.\s*\d+\s*\/\s*\d+[^<]{0,30}/) || [''])[0]);
const lvl = Number((smi.replace(/\s+/g,' ').match(/Lv\. (\d+) \//) || [0,0])[1]);
ok('and the level actually reflects it', lvl >= 20, `smithing reads ${lvl}`);
await go('skill:mining');
ok('a skill the class does not know is untouched',
   !/\+20 Artisan/.test(await page.textContent('#main-panel')));

console.log('\n[the town can feed itself]');
await go('town');
// Plots are SVG <g> elements, which have no .click() and do not respond
// to a synthesised MouseEvent the way an HTML button does.
await page.locator('[data-act="select-plot"][data-plot="1"]').click();
await page.waitForTimeout(350);
const buildable = await page.evaluate(() =>
  [...document.querySelectorAll('#main-panel')].map(e => e.textContent).join(' '));
ok('the generation buildings are offered',
   /Fish Hatchery/.test(buildable) || /Walled Garden/.test(buildable) || /Shale Quarry/.test(buildable),
   'none named');

console.log('\n[you can eat outside a fight]');
await go('character');
const chr = await page.textContent('#main-panel');
ok('there is a larder', /Larder/.test(chr));
ok('Charisma is on the sheet', /CHA/.test(chr));
ok('and says what it does', /sale price/i.test(chr));
const eatable = await page.locator('[data-act="eat"]').count();
ok('food in the bag is offered', eatable >= 1, String(eatable));
if (eatable) {
  // Hurt first, or eating a plain meal is correctly refused at full health.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
    s.combat = { ...(s.combat || {}), playerHp: 5 };
    const real = Storage.prototype.setItem.bind(localStorage);
    real('runebound-save-v1', JSON.stringify(s));
    Storage.prototype.setItem = function (k, v) { if (k === 'runebound-save-v1') return; return real(k, v); };
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await dismiss();
  await go('character');
  const hpBefore = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('runebound-save-v1')).combat?.playerHp);
  await page.evaluate(() => document.querySelector('[data-act="eat"]')?.click());
  await page.waitForTimeout(350);
  await forceSave();
  const hpAfter = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('runebound-save-v1')).combat?.playerHp);
  ok('eating restores health out of combat', hpAfter > hpBefore, `${hpBefore} -> ${hpAfter}`);
}

console.log('\n[the cycle asks more each time]');
await go('ascension');
const asc2 = await page.textContent('#main-panel');
ok('the bar for this cycle is stated', /need \d+/.test(asc2.replace(/\s+/g, ' ')),
   (asc2.replace(/\s+/g,' ').match(/need \d+/) || [''])[0]);
ok('and that it rises', /The bar rises every cycle/.test(asc2));
ok('and where it stops', /It stops climbing/.test(asc2));

console.log('\n[nothing broke]');
ok('no runtime errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length) { console.log('\nErrors:'); [...new Set(errs)].slice(0, 6).forEach(e => console.log('  !', e)); }
await b.close(); process.exit(fail ? 1 : 0);
