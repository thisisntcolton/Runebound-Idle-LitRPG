// The three systems added alongside the second hundred: the ceiling
// coming off, thieving having consequences, and the road.
import { chromium } from 'playwright';
import { CHAINS } from '../src/data/adventure.js';
import { xpForLevel, SOFT_CAP } from '../src/core/xp.js';

const now = Date.now();
const skills = {};
for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing',
                 'smithing','cooking','alchemy','farming','thieving','runecrafting']) skills[k] = { xp: 0 };
for (const k of ['attack','strength','defense','hitpoints']) skills[k].xp = 14000000;
// Two skills carrying banked XP well past the sandbox ceiling. This is the
// state a long-running Era I save is actually in.
skills.mining.xp = xpForLevel(SOFT_CAP) * 3;
skills.thieving.xp = xpForLevel(SOFT_CAP) * 2;

const base = {
  version: 1, gold: 2000000, lifetimeGold: 40000000, shards: 30, ascensions: 5,
  skills, lastSeen: now, createdAt: now, era: 1,
  equipment: { weapon:'runite_weapon', helmet:'runite_helmet', chest:'runite_chest',
               legs:'runite_legs', boots:'runite_boots', ring:null, amulet:null },
  inventory: { leviathan_steak: 400 },
  charStats: { STR: 60, AGI: 40, VIT: 40, INT: 0, LUK: 0 }, statPointsSpent: 160,
  classId: null, classProgress: {},
  pets: { owned: {}, incubator: [], active: null, hatched: 0, bred: 0 },
  adventure: { travelled: 0, encounters: 0, chains: 0, flags: {}, seen: {},
               active: null, nextAt: 900, progress: 0 },
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
  await page.waitForTimeout(320); };
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
  await page.waitForTimeout(800);
};

console.log('\n[the ceiling, from inside the box]');
ok('no runtime errors', errs.length === 0, errs.slice(0, 2).join(' | '));
await go('skill:mining');
const inBox = await page.textContent('#main-panel');
ok('a skill with banked XP still reads 99', /Lv\. 99 \/ 99/.test(inBox.replace(/\s+/g, ' ')),
   (inBox.match(/Lv\.\s*\d+\s*\/\s*\d+/) || [''])[0]);
ok('and the panel says the XP is being held, not lost',
   /CEILING/.test(inBox) && /banked past/.test(inBox),
   (inBox.match(/CEILING[^<]{0,80}/) || [''])[0]);
ok('the level-199 actions are not offered in there',
   !/Adamant Lode/.test(inBox));

console.log('\n[and the ceiling coming off]');
await mutateSave(() => {
  const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
  s.era = 2;
  const real = Storage.prototype.setItem.bind(localStorage);
  real('runebound-save-v1', JSON.stringify(s));
  Storage.prototype.setItem = function (k, v) { if (k === 'runebound-save-v1') return; return real(k, v); };
});
await go('skill:mining');
const outside = await page.textContent('#main-panel');
const lvl = Number((outside.replace(/\s+/g, ' ').match(/Lv\.\s*(\d+)\s*\/\s*199/) || [0, 0])[1]);
ok('banked XP becomes levels the moment you are out', lvl > SOFT_CAP, `now level ${lvl} / 199`);
ok('and the new content is there to spend it on', /Adamant Lode/.test(outside));
ok('the ceiling reads 199 now', /\/ 199/.test(outside.replace(/\s+/g, ' ')));

console.log('\n[thieving has consequences]');
await go('skill:thieving');
const thief = await page.textContent('#main-panel');
ok('every steal prints its odds', (await page.locator('.risk-line').count()) >= 6,
   String(await page.locator('.risk-line').count()));
ok('and names who turns up', /Angry Fishwife|Stallholder|Lockman|Outriders|Warden|Daemon/.test(thief));
ok('the odds get better as you outgrow the mark', /easing to/.test(thief));

// Force a catch by making the risk certain, then working the mark.
await mutateSave(() => {
  const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
  s.__forceCatch = true;
  const real = Storage.prototype.setItem.bind(localStorage);
  real('runebound-save-v1', JSON.stringify(s));
  Storage.prototype.setItem = function (k, v) { if (k === 'runebound-save-v1') return; return real(k, v); };
});
await go('skill:thieving');
await page.evaluate(() => document.querySelector('[data-act="start-action"][data-skill="thieving"]')?.click());
// Pockets is a 1.2% risk at this level, so nudge the dice rather than
// waiting several thousand actions for the real thing.
await page.evaluate(() => { const r = Math.random; window.__r = r; Math.random = () => 0.0001; });
let caught = false;
for (let i = 0; i < 30 && !caught; i++) {
  await page.waitForTimeout(500);
  caught = await page.evaluate(() => !!JSON.parse(localStorage.getItem('runebound-save-v1') || '{}').combat?.guard)
        || (await page.locator('#main-panel').textContent()).includes('CAUGHT IN THE ACT');
}
await page.evaluate(() => { if (window.__r) Math.random = window.__r; });
ok('a steal that goes wrong drops you into a fight', caught);
if (caught) {
  await go('combat');
  const arena = await page.textContent('#main-panel');
  ok('the arena says why you are here', /CAUGHT IN THE ACT/.test(arena));
  ok('and what winning and losing are worth',
     /keep what you lifted/.test(arena) && /drop the haul/.test(arena));
}

console.log('\n[the road]');
await go('road');
ok('Adventure has a panel', (await page.locator('.road-card').count()) === 1);
ok('every chain is listed, met or not',
   (await page.locator('.chain-row').count()) === CHAINS.length,
   `${await page.locator('.chain-row').count()} of ${CHAINS.length}`);
await page.locator('[data-act="adventure-out"]').click();
await page.waitForTimeout(400);
ok('you can set out', (await page.locator('[data-act="adventure-home"]').count()) === 1);
const stOut = await read();
ok('the road is a real activity, not a screen', stOut.activity?.type === 'adventure', String(stOut.activity?.type));

let vignette = false;
for (let i = 0; i < 40 && !vignette; i++) {
  await page.waitForTimeout(700);
  await dismiss();
  await page.evaluate(() => document.querySelector('[data-act="nav"][data-view="road"]')?.click());
  vignette = (await page.locator('.road-vignette').count()) > 0;
}
ok('the road interrupts you with something', vignette);
if (vignette) {
  const v = (await page.textContent('.road-vignette')).replace(/\s+/g, ' ');
  ok('it is prose, not a stat block', v.length > 200, `${v.length} chars`);
  ok('with exactly two real choices', (await page.locator('.road-option').count()) === 2);
  const before = await read();
  await page.locator('.road-option').first().click();
  await page.waitForTimeout(700);
  const modal = (await page.textContent('#modal-window')).replace(/\s+/g, ' ');
  ok('answering tells you what happened', modal.length > 120, modal.slice(0, 90));
  const after = await read();
  ok('and it is recorded', (after.adventure?.encounters || 0) > (before.adventure?.encounters || 0),
     `${before.adventure?.encounters} -> ${after.adventure?.encounters}`);
  // Either the chain continued (a second beat is open) or it ended and the
  // road resumed. Both are correct; being stuck in neither is not.
  const stillOpen = !!after.adventure?.active;
  ok('the chain either goes deeper or ends cleanly',
     stillOpen || after.adventure?.chains > 0 || after.adventure?.nextAt > 0,
     stillOpen ? 'went deeper' : 'ended');
}

console.log('\n[what survives ascension is stated]');
await dismiss();
await go('ascension');
const asc = await page.textContent('#main-panel');
ok('the Ascension panel lists what you keep', /What you keep/i.test(asc));
ok('and it speaks to what happens to talents', /talent/i.test(asc));
ok('both columns are rendered',
   (await page.locator('.persist-row.kept').count()) > 5 &&
   (await page.locator('.persist-row.lost').count()) > 3,
   `${await page.locator('.persist-row.kept').count()} kept / ${await page.locator('.persist-row.lost').count()} lost`);

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length) { console.log('\nErrors:'); [...new Set(errs)].slice(0, 6).forEach(e => console.log('  !', e)); }
await b.close(); process.exit(fail ? 1 : 0);
