// The four things a player found that every existing test missed.
//
// Every one of these is a legibility bug rather than a logic bug, which is
// exactly why the suite sailed past them: the code did what it said, and
// the game never said it to the player. So these assert on what is on
// screen in a specific save state, because that is where the failures were.
import { chromium } from 'playwright';
import { ABILITY_LIST } from '../src/data/abilities.js';
import { SPECIES_LIST } from '../src/data/pets.js';

const now = Date.now();
const skills = {};
for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing',
                 'smithing','cooking','alchemy','farming','thieving','runecrafting']) skills[k] = { xp: 0 };

// The save the player was actually in: four cycles deep, freshly reset, so
// character level is below the class gate and nothing is chosen.
const base = {
  version: 1, gold: 50000, lifetimeGold: 40000000, shards: 30, ascensions: 4,
  skills, lastSeen: now, createdAt: now, era: 1,
  equipment: { weapon: null, helmet: null, chest: null, legs: null, boots: null, ring: null, amulet: null },
  inventory: {},
  charStats: { STR: 0, AGI: 0, VIT: 0, INT: 0, LUK: 0 }, statPointsSpent: 0,
  classId: null,
  // A capped Artisan tree from a previous cycle — the exact thing that
  // read as stolen.
  classProgress: { artisan: { xp: 250000, pointsUsed: 30,
    spent: { art_hands: 3, art_haggle: 3, art_foreman: 1 } } },
  pets: { owned: {}, incubator: [], active: null, hatched: 0, bred: 0, seen: {} },
  town: { unlocked: true },
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

console.log('\n[can a player find out the abilities exist, and where]');
await go('abilities');
const ab = await page.textContent('#main-panel');
ok('every ability is listed, known or not',
   (await page.locator('.card-grid .card').count()) >= ABILITY_LIST.length,
   `${await page.locator('.card-grid .card').count()} cards vs ${ABILITY_LIST.length} abilities`);
ok('and each unlearned one says where to look',
   (await page.locator('text=📍').count()) >= ABILITY_LIST.length - 2,
   String(await page.locator('text=📍').count()));
ok('the new abilities are named', /Sunder/.test(ab) && /Thornmail/.test(ab) && /Ledger of Debts/.test(ab));
ok('a named monster is given for the seeded ones', /Drops from/.test(ab));
ok('and the generic answer for the rest', /Sealing Unstable Rifts/.test(ab));

console.log('\n[the menagerie admits what exists]');
await go('pets');
// The compendium lives on the Hatchery tab, with the egg shop.
await page.evaluate(() => document.querySelector('[data-act="pets-tab"][data-tab="shop"]')?.click());
await page.waitForTimeout(320);
const petsTxt = await page.textContent('#main-panel');
ok('there is a compendium', /Compendium/.test(petsTxt));
ok('it counts every species', new RegExp(`/ ${SPECIES_LIST.length} discovered`).test(petsTxt),
   (petsTxt.match(/\d+ \/ \d+ discovered/) || [''])[0]);
ok('undiscovered species are shown, not hidden',
   (await page.locator('text=Undiscovered').count()) > 6,
   String(await page.locator('text=Undiscovered').count()));
ok('and each rarity says where it comes from',
   /boss kills|Boss kills/.test(petsTxt) && /Rift/.test(petsTxt));
ok('the shop stocks more than the original three',
   (await page.locator('[data-act="buy-egg"]').count()) > 3,
   String(await page.locator('[data-act="buy-egg"]').count()));

console.log('\n[the way out of the loop is stated]');
await go('ascension');
const asc = await page.textContent('#main-panel');
ok('four cycles in, the game says there is a way onward', /way out of the loop/i.test(asc));
ok('and names the boss', /Aurelion/.test(asc));
ok('and says which choice is the one that continues', /[Bb]reaking the cycle/.test(asc));
ok('and warns that feeding the flame keeps the ceiling', /ceiling/i.test(asc));
ok('the sidebar shows a sealed door', (await page.locator('.nav-sealed').count()) === 1);

console.log('\n[a reset does not read as theft]');
await go('class');
const path = await page.textContent('#main-panel');
ok('the Path panel is not silent below the class gate', /talent rank/i.test(path));
ok('it counts the ranks still banked', /7 talent ranks still yours/.test(path),
   (path.match(/\d+ talent ranks? still yours/) || [''])[0]);
ok('it names the class they belong to', /Artisan/.test(path));
ok('and says the class is what resets, not the tree', /clears your .*class.*never your/i.test(path.replace(/\s+/g, ' ')));

console.log('\n[the skill ceiling says what lifts it]');
await go('skill:mining');
const mining = await page.textContent('#main-panel');
ok('a level-1 skill shows the sandbox ceiling', /\/ 99/.test(mining.replace(/\s+/g, ' ')));

console.log('\n[nothing broke]');
ok('no runtime errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length) { console.log('\nErrors:'); [...new Set(errs)].slice(0, 6).forEach(e => console.log('  !', e)); }
await b.close(); process.exit(fail ? 1 : 0);
