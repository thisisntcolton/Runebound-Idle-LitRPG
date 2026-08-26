// Hearthwick is supposed to look inhabited.
//
// The regression this guards is specific and was invisible in code review:
// the town map lives inside #main-panel, renderView() rebuilds that panel's
// innerHTML on every 'state-changed', and a rebuilt SVG restarts every
// animation from zero. With a business running that fires several times a
// second, so the entire population teleported back to the start of its walk
// continuously. The fix is a negative `begin` computed from a wall clock, and
// the test for it is simply: force a re-render and check nobody moved back.
import { chromium } from 'playwright';

const now = Date.now();
const skills = {};
for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing',
                 'smithing','cooking','alchemy','farming','thieving','runecrafting']) skills[k] = { xp: 1000000 };

const plots = Array.from({ length: 9 }, (_, i) => i < 6
  ? { owned: true, building: ['lumber_yard','market_stall','cafe','smithy','apothecary','inn'][i],
      level: 3, stock: { oak_log: 400, salmon: 200, herb_sagewort: 200, steel_bar: 200 }, progress: 0 }
  : { owned: false, building: null, level: 0, stock: {}, progress: 0 });
const staff = {};
for (let i = 0; i < 6; i++) staff['s' + i] = { id: 's' + i, name: 'W' + i, icon: '🧑‍🌾',
  trait: 'diligent', skill: 5, wage: 70, assigned: i };

const save = { version: 1, gold: 5000000, lifetimeGold: 60000000, shards: 20, ascensions: 3,
  skills, lastSeen: now, createdAt: now,
  town: { unlocked: true, name: 'Hearthwick', plots, staff, applicants: [], applicantsAt: 0,
    lifetimeRevenue: 500000, cycles: 300, unpaid: 0, metNotables: { marrow: 1, pell: 1, holt: 1 },
    extraPopulation: 10, visitor: null, nextVisitorAt: now + 9e9, timesRazed: 2,
    lifetimeRevenueAllCycles: 2000000 } };

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
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
/** Screen positions of the first N villagers, via their animated CTM. */
const positions = () => page.evaluate(() =>
  [...document.querySelectorAll('.villager')].map(g => {
    const m = g.getCTM(); return m ? [Math.round(m.e), Math.round(m.f)] : null;
  }));
const titles = () => page.evaluate(() =>
  [...document.querySelectorAll('.villager title')].map(t => t.textContent));

await dismiss();
await page.evaluate(() => document.querySelector('[data-act="nav"][data-view="town"]')?.click());
await page.waitForTimeout(900);
await dismiss();

console.log('\n[the town is inhabited]');
ok('no runtime errors', errs.length === 0, errs.slice(0, 2).join(' | '));
const n = await page.locator('.villager').count();
ok('there are villagers', n > 8, String(n));

const names = await titles();
ok('every villager has a name, a trade and something they are doing',
   names.length === n && names.every(t => /^\S+.* the .+ — .+/.test(t)), names[0]);
ok('and they are not all the same person',
   new Set(names.map(t => t.split(' — ')[0])).size === n,
   `${new Set(names.map(t => t.split(' — ')[0])).size} distinct of ${n}`);

// Distinct appearance: compare the drawn markup of each figure.
const shapes = await page.evaluate(() =>
  [...document.querySelectorAll('.villager')].map(g => g.innerHTML.replace(/begin="[^"]*"/g, '')));
ok('and they do not all look the same',
   new Set(shapes).size >= Math.ceil(n * 0.8),
   `${new Set(shapes).size} distinct silhouettes of ${n}`);

console.log('\n[they actually walk]');
// Sample repeatedly rather than once: at any single instant it is luck
// whether anybody happens to be mid-pause, and a one-shot check on that
// was intermittently red.
const samples = [];
for (let i = 0; i < 5; i++) { samples.push(await positions()); await page.waitForTimeout(1400); }
const movedAt = i => samples.slice(1).some((s, k) =>
  s[i] && samples[k][i] && (s[i][0] !== samples[k][i][0] || s[i][1] !== samples[k][i][1]));
const pausedAt = i => samples.slice(1).some((s, k) =>
  s[i] && samples[k][i] && s[i][0] === samples[k][i][0] && s[i][1] === samples[k][i][1]);
const moved = samples[0].map((_, i) => i).filter(movedAt).length;
const paused = samples[0].map((_, i) => i).filter(pausedAt).length;
ok('they are walking, not standing in a diagram', moved >= Math.ceil(n * 0.75), `${moved} of ${n} moved`);
ok('and errands have stops they stand at', paused >= 1, `${paused} paused at some point`);

console.log('\n[the walk survives a re-render]');
// This is the whole point. Force the exact churn that broke it: a full
// panel rebuild, the same one a gold tick causes.
// Let them get well clear of their starting points first, or a reset to
// the top of the route would look like a small step and the test would
// pass on a broken build. (It did, before this wait was added.)
await page.waitForTimeout(6000);
const before = await positions();
await page.evaluate(() => {
  document.querySelector('[data-act="nav"][data-view="character"]')?.click();
  document.querySelector('[data-act="nav"][data-view="town"]')?.click();
});
await page.waitForTimeout(120);
const after = await positions();
const teleported = before.filter((p, i) => {
  const q = after[i];
  if (!p || !q) return false;
  return Math.hypot(q[0] - p[0], q[1] - p[1]) > 40;   // a walk moves ~5px in 120ms
}).length;
ok('nobody snaps back to the start of their route',
   teleported === 0, `${teleported} of ${n} teleported`);

const namesAfter = await titles();
ok('and they are still the same people',
   JSON.stringify(namesAfter) === JSON.stringify(names));

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length) { console.log('\nErrors:'); [...new Set(errs)].slice(0, 6).forEach(e => console.log('  !', e)); }
await b.close(); process.exit(fail ? 1 : 0);
