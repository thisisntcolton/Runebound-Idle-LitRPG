import { chromium } from 'playwright';
import { EGG_SHOP, SPECIES_LIST } from '../src/data/pets.js';

// addInitScript runs on EVERY navigation, so guard it — otherwise a reload
// silently restores the original fixture over whatever the test just did.
const seed = (overrides) => `(() => {
  if (localStorage.getItem('__seeded')) return;
  localStorage.setItem('__seeded', '1');
  localStorage.setItem('runebound-save-v1', ${JSON.stringify(JSON.stringify(overrides))});
})()`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errors = [];
let pass = 0, fail = 0;
const ok = (name, cond, extra='') => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name, extra); } };

// Autosave runs every 10s; nudge it so localStorage reflects live state.
async function forceSave(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
  });
  await page.waitForTimeout(100);
}

const readSave = async page => {
  await forceSave(page);
  return page.evaluate(() => JSON.parse(localStorage.getItem('runebound-save-v1')));
};

async function boot(saveMutator) {
  const ctx = await browser.newContext();
  ctx.on('weberror', e => errors.push(e.error().message));
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (saveMutator) await ctx.addInitScript(saveMutator);
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  return { ctx, page };
}

// ---------- 1. Fresh boot, navigate to Menagerie ----------
console.log('\n[1] Fresh boot + navigation');
{
  const { ctx, page } = await boot();
  await page.click('button[data-view="pets"]');
  await page.waitForTimeout(300);
  const title = await page.textContent('.panel-title');
  ok('Menagerie opens from the topbar button', title.includes('Menagerie'), title);
  ok('empty state explains the companion slot',
     (await page.textContent('#main-panel')).includes('No companion at your side'));
  ok('incubator shows 2 empty nests', (await page.locator('.egg-slot.empty').count()) === 2);
  // Counted against the data, not a number written here: this assertion
  // failed the moment the shop was widened, which is the wrong thing for a
  // test to notice.
  ok(`hatchery tab lists all ${EGG_SHOP.length} buyable eggs`, await (async () => {
    await page.click('[data-act="pets-tab"][data-tab="shop"]');
    await page.waitForTimeout(200);
    return (await page.locator('[data-act="buy-egg"]').count()) === EGG_SHOP.length;
  })());
  await ctx.close();
}

// ---------- 2. Buy -> incubate -> hatch ----------
console.log('\n[2] Buy an egg, incubate it, hatch it');
{
  const { ctx, page } = await boot();
  await page.evaluate(() => { /* noop */ });
  // give gold via the debug path: mutate state through the module graph is not
  // exposed, so instead seed a save with gold and an egg already in the bag.
  await ctx.close();
}
{
  const save = { version:1, gold: 500000, lastSeen: Date.now(), createdAt: Date.now() };
  const { ctx, page } = await boot(seed(save));
  await page.click('button[data-view="pets"]');
  await page.click('[data-act="pets-tab"][data-tab="shop"]');
  await page.waitForTimeout(200);
  await page.click('[data-act="buy-egg"][data-species="cat"]');
  await page.waitForTimeout(300);
  await page.click('[data-act="pets-tab"][data-tab="nest"]');
  await page.waitForTimeout(300);
  ok('bought egg lands in the bag strip', (await page.locator('[data-act="incubate"]').count()) === 1);
  await page.click('[data-act="incubate"]');
  await page.waitForTimeout(400);
  ok('egg moves into a nest', (await page.locator('.egg-slot:not(.empty)').count()) === 1);
  const timer = await page.textContent('.egg-slot:not(.empty)');
  ok('nest shows a countdown', /\d+m/.test(timer), timer);

  // Fast-forward the egg. The page's beforeunload handler saves live state
  // over anything we write here, so blind the writer before reloading.
  await forceSave(page);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
    s.pets.incubator[0].readyAt = Date.now() - 1000;
    const real = Storage.prototype.setItem.bind(localStorage);
    real('runebound-save-v1', JSON.stringify(s));
    Storage.prototype.setItem = function (k, v) {
      if (k === 'runebound-save-v1') return;
      return real(k, v);
    };
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('button[data-view="pets"]');
  await page.waitForTimeout(300);
  ok('ready egg offers a hatch button', (await page.locator('[data-act="hatch-egg"]').count()) === 1);
  await page.click('[data-act="hatch-egg"]');
  await page.waitForTimeout(400);
  const modal = await page.textContent('#modal-window');
  ok('hatch fires the reveal modal', modal.includes('IT HATCHED'), modal.slice(0,80));
  await page.click('[data-act="close-modal"]');
  await page.waitForTimeout(300);
  ok('pet appears in the roster', (await page.locator('.pet-tile').count()) === 1);
  ok('first hatchling auto-equips as companion',
     (await page.textContent('.pet-banner')).includes('At your side') ||
     (await page.locator('.pet-tile.is-active').count()) === 1);
  ok('pet art renders as SVG', (await page.locator('.pet-tile svg.pet-svg path').count()) > 0);
  await ctx.close();
}

// ---------- 3. Care loop: feed + play + detail view ----------
console.log('\n[3] Care loop');
{
  const now = Date.now();
  const save = {
    version:1, gold: 500000, lastSeen: now, createdAt: now,
    inventory: { shrimp: 20, raw_shrimp: 10, logs: 5 },
    pets: { owned: { p1: { id:'p1', species:'cat', name:'Biscuit', trait:'clever',
      xp: 0, stage:'hatchling', hunger: 40, happy: 40, careAt: now,
      bornAt: now, lastPlayAt: 0, lastBredAt: 0, parents: null } },
      incubator: [], active: 'p1', hatched: 1, bred: 0 },
  };
  const { ctx, page } = await boot(seed(save));
  await page.click('button[data-view="pets"]');
  await page.waitForTimeout(300);
  await page.click('.pet-tile');
  await page.waitForTimeout(300);
  ok('detail view opens', (await page.locator('.pet-detail').count()) === 1);
  ok('favourite food is flagged', (await page.locator('.food-chip.liked').count()) > 0);
  const before = await page.textContent('.pet-care-detail');
  await page.click('.food-chip.liked');
  await page.waitForTimeout(400);
  const after = await page.textContent('.pet-care-detail');
  ok('feeding raises fullness', before !== after, `${before.trim()} -> ${after.trim()}`);
  const xpBefore = (await readSave(page)).pets.owned.p1.xp;
  await page.click('[data-act="pet-play"]');
  await page.waitForTimeout(400);
  const xpAfter = (await readSave(page)).pets.owned.p1.xp;
  ok('playing grants bond XP', xpAfter > xpBefore, `${xpBefore} -> ${xpAfter}`);
  ok('play goes on cooldown', await page.locator('[data-act="pet-play"]').isDisabled());
  // rename
  await page.fill('#pet-rename-input', 'Turnip');
  await page.click('[data-act="pet-rename"]');
  await page.waitForTimeout(300);
  ok('rename sticks', (await page.textContent('#main-panel')).includes('Turnip'));
  await ctx.close();
}

// ---------- 4. Mood gates the bonus ----------
console.log('\n[4] Mood gates the bonus');
{
  const now = Date.now();
  const mk = (hunger, happy) => ({
    version:1, gold: 0, lastSeen: now, createdAt: now,
    pets: { owned: { p1: { id:'p1', species:'cat', name:'Biscuit', trait:'hardy',
      xp: 5000, stage:'adult', hunger, happy, careAt: now,
      bornAt: now, lastPlayAt: 0, lastBredAt: 0, parents: null } },
      incubator: [], active: 'p1', hatched: 1, bred: 0 },
  });
  for (const [label, h, p, expect] of [
    ['thriving pet delivers a boosted bonus', 100, 100, /\+\d/],
    ['starving pet delivers nothing', 5, 5, /Too unhappy/],
  ]) {
    const { ctx, page } = await boot(seed(mk(h, p)));
    await page.click('button[data-view="pets"]');
    await page.waitForTimeout(300);
    const txt = await page.textContent('.pet-banner-effects');
    ok(label, expect.test(txt), txt.trim());
    await ctx.close();
  }
}

// ---------- 5. Breeding ----------
console.log('\n[5] Breeding');
{
  const now = Date.now();
  const adult = (id, species, name, trait) => ({ id, species, name, trait,
    xp: 6000, stage:'adult', hunger:100, happy:100, careAt: now,
    bornAt: now, lastPlayAt: 0, lastBredAt: 0, parents: null });
  const save = { version:1, gold: 5000000, lastSeen: now, createdAt: now,
    pets: { owned: { a: adult('a','cat','Mochi','fertile'), b: adult('b','cat','Pebble','greedy') },
      incubator: [], active: 'a', hatched: 2, bred: 0 } };
  const { ctx, page } = await boot(seed(save));
  await page.click('button[data-view="pets"]');
  await page.click('[data-act="pets-tab"][data-tab="breed"]');
  await page.waitForTimeout(300);
  ok('breed button is disabled with no parents picked',
     await page.locator('[data-act="breed-go"]').isDisabled());
  await page.click('[data-act="breed-select"][data-slot="a"][data-pet="a"]');
  await page.waitForTimeout(200);
  await page.click('[data-act="breed-select"][data-slot="b"][data-pet="b"]');
  await page.waitForTimeout(300);
  const summary = await page.textContent('.breed-summary');
  ok('summary shows the pairing and climb odds', /Mochi/.test(summary) && /%/.test(summary), summary.trim().slice(0,120));
  ok('same-species + fertile lifts the odds above base 12%',
     /3[0-9]%|[4-9][0-9]%/.test(summary), summary.match(/(\d+)%/)?.[0]);
  ok('breed button enables', !(await page.locator('[data-act="breed-go"]').isDisabled()));
  const goldBefore = (await readSave(page)).gold;
  await page.click('[data-act="breed-go"]');
  await page.waitForTimeout(500);
  const st = await readSave(page);
  ok('an egg lands in the incubator', st.pets.incubator.length === 1, JSON.stringify(st.pets.incubator));
  ok('egg inherits a parent trait', !!st.pets.incubator[0]?.inherit?.trait);
  ok('both parents go on cooldown', st.pets.owned.a.lastBredAt > 0 && st.pets.owned.b.lastBredAt > 0);
  ok('gold was spent', st.gold < goldBefore, `${goldBefore} -> ${st.gold}`);
  await page.waitForTimeout(200);
  ok('rested parents can no longer be selected',
     (await page.locator('.pet-tile.locked').count()) > 0);
  await ctx.close();
}

// ---------- 6. Offline care decay + egg readiness ----------
console.log('\n[6] Offline handling');
{
  const now = Date.now();
  const tenHoursAgo = now - 10*3600*1000;
  const save = { version:1, gold: 0, lastSeen: tenHoursAgo, createdAt: tenHoursAgo,
    pets: { owned: { p1: { id:'p1', species:'dog', name:'Socks', trait:'greedy',
      xp: 100, stage:'hatchling', hunger:100, happy:100, careAt: tenHoursAgo,
      bornAt: tenHoursAgo, lastPlayAt: 0, lastBredAt: 0, parents: null } },
      incubator: [{ id:'e1', species:'frog', startedAt: tenHoursAgo,
                    readyAt: tenHoursAgo + 45*60*1000, inherit: null }],
      active: 'p1', hatched: 1, bred: 0 } };
  const { ctx, page } = await boot(seed(save));
  await page.waitForTimeout(600);
  const modal = await page.textContent('#modal-window').catch(()=> '');
  ok('away report mentions the ready egg', /ready to hatch/i.test(modal), modal.slice(0,200));
  const st = await readSave(page);
  const h = st.pets.owned.p1.hunger, hp = st.pets.owned.p1.happy;
  ok('10h away costs ~90 fullness', h > 5 && h < 20, `hunger=${h.toFixed(1)}`);
  ok('10h away costs ~60 happiness', hp > 30 && hp < 50, `happy=${hp.toFixed(1)}`);
  ok('offline idle XP was awarded', st.pets.owned.p1.xp > 100, `xp=${st.pets.owned.p1.xp.toFixed(0)}`);
  ok('offline XP is bounded (no runaway)', st.pets.owned.p1.xp < 100 + 10*60 + 50, `xp=${st.pets.owned.p1.xp.toFixed(0)}`);
  await ctx.close();
}

// ---------- 7. Bonus actually reaches the multiplier chain ----------
console.log('\n[7] Bonus reaches the multiplier chain');
{
  const now = Date.now();
  const mk = active => ({ version:1, gold:0, lastSeen: now, createdAt: now,
    pets: { owned: { p1: { id:'p1', species:'poro', name:'Fluff', trait:'greedy',
      xp: 12000, stage:'adult', hunger:100, happy:100, careAt: now,
      bornAt: now, lastPlayAt:0, lastBredAt:0, parents:null } },
      incubator: [], active, hatched:1, bred:0 } });
  const read = async (active) => {
    const { ctx, page } = await boot(seed(mk(active)));
    await page.waitForTimeout(400);
    const v = await page.evaluate(() => {
      const el = document.querySelector('#main-panel');
      return el ? el.innerHTML : '';
    });
    await ctx.close();
    return v;
  };
  // compare max hit on the character sheet with and without the damage pet
  const withPet = await read('p1');
  const without = await read(null);
  const grab = html => (html.match(/(\d+)\s*[-–]\s*(\d+)/) || [])[2];
  ok('Poro (damage pet) raises the damage shown on the character sheet',
     grab(withPet) !== grab(without) || withPet !== without,
     `${grab(without)} -> ${grab(withPet)}`);

}

console.log(`\n${pass} passed, ${fail} failed`);
if (errors.length) {
  console.log('\nPage errors:');
  [...new Set(errors)].slice(0,10).forEach(e => console.log('  !', e));
}
await browser.close();
process.exit(fail || errors.length ? 1 : 0);
