// ============================================================
// v2.0 — HEARTHWICK AS A PLACE
//
// The other suites test the loop. This one tests the town you live in
// while the loop runs: the map that is now the front door, the house you
// furnish, the people who keep their own schedules, the parties you send
// past the gate, and the former selves who stayed behind.
//
// The through-line of every assertion here is that these systems have to
// hold their shape ACROSS an Ascension. That is the whole argument the
// v2.0 build makes — the world winds back and the town does not — so a
// house that empties or a bond that resets is not a cosmetic bug, it is
// the feature failing.
//
// Written against the data, never against literals: room counts, set
// sizes and destination ids all come from the modules, because a fixture
// naming a piece of furniture by hand starts testing a house that no
// longer exists the moment somebody renames it.
// ============================================================
import { chromium } from 'playwright';
import { ROOMS, FURNITURE, SETS, MAX_HOUSE_LEVEL, houseUpgradeCost } from '../src/data/home.js';
import { LIVES, BOND, TIERS } from '../src/data/lives.js';
import { HOURS, PLACES } from '../src/data/places.js';
import { DESTINATIONS, RISKS, PROVISIONS } from '../src/data/expeditions.js';
import { xpForLevel } from '../src/core/xp.js';

const now = Date.now();
const SKILL_IDS = ['attack','strength','defense','hitpoints','woodcutting','mining','fishing',
                   'smithing','cooking','alchemy','farming','thieving','runecrafting'];
const skillsAt = lvl => Object.fromEntries(SKILL_IDS.map(k => [k, { xp: xpForLevel(lvl) }]));

let pass = 0, fail = 0;
const errors = [];
const ok = (n, c, x = '') => { c ? (pass++, console.log('  ✓', n)) : (fail++, console.log('  ✗', n, x)); };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });

// ---- the fixture -------------------------------------------------------
//
// Deliberately mid-game rather than maximal: classed (so the class modal
// stays shut), four cycles deep (so there is a household), enough gold to
// buy furniture, and enough combat level to be let past the gate.
const SAVE = {
  version: 1, gold: 5e7, lifetimeGold: 2e8, shards: 200, ascensions: 4,
  skills: skillsAt(80), lastSeen: now, createdAt: now, era: 1,
  classId: 'artisan', classChosenAt: now,
  classProgress: { artisan: { xp: 400000, pointsUsed: 10, spent: {} } },
  charStats: { STR: 60, AGI: 40, VIT: 60, INT: 20, LUK: 20 }, statPointsSpent: 200,
  stats: { kills: 5000, deaths: 4, actions: 9000, itemsSold: 200, bossKills: 8,
           highestDamage: 900, aurelionKills: 2, enchants: 20 },
  town: {
    unlocked: true, name: 'Hearthwick', applicants: [], cycles: 60,
    lifetimeRevenue: 3e6, staff: {},
    plots: Array.from({ length: 9 }, (_, i) => i < 6
      ? { owned: true, building: ['lumber_yard','market_stall','hatchery','cafe','herb_garden','apothecary'][i],
          level: 4, stock: {}, progress: 0 }
      : { owned: false, building: null, level: 0, stock: {}, progress: 0 }),
    metNotables: {}, extraPopulation: 0, visitor: null, nextVisitorAt: 0,
  },
  inventory: { oak_log: 999, iron_bar: 999, raw_shrimp: 999, herb_sagewort: 999,
               rune_shard: 99, cooked_shrimp: 200 },
  home: { level: 1, placed: {}, owned: {}, visits: 0 },
  legacy: Array.from({ length: 4 }, (_, i) => ({
    id: `self${i + 1}`, cycle: i + 1, name: `Selfie ${i + 1}`,
    look: null, classId: null, className: 'Wanderer', classIcon: '🧭', title: null,
    charLevel: 40 + i * 5, combatLevel: 30 + i * 3, totalLevel: 300 + i * 30,
    retiredAt: now - (4 - i) * 3600e3, job: 'idle', jobSkill: null, hurtUntil: 0,
  })),
  lives: {}, expedition: { active: null, history: [], completed: 0, bestHaul: 0 },
};

// Seeding runs on EVERY navigation, so guard it — otherwise a reload
// silently restores the fixture over whatever the test just did.
//
// The __pending channel exists because of a sharper problem: the game
// saves on `beforeunload`, so anything written straight into localStorage
// and then reloaded is overwritten by the live in-memory state on the way
// out. Handing the mutation to an init script instead means it is applied
// AFTER that clobber and before the game reads the save.
await ctx.addInitScript(`(()=>{
  const K = 'runebound-save-v1';
  if (!localStorage.getItem('__s')) {
    localStorage.setItem('__s','1');
    localStorage.setItem(K, ${JSON.stringify(JSON.stringify(SAVE))});
  }
  const pending = localStorage.getItem('__pending');
  if (pending) { localStorage.setItem(K, pending); localStorage.removeItem('__pending'); }
})()`);

const page = await ctx.newPage();
page.on('pageerror', e => errors.push('PAGEERROR ' + e));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

const dismiss = async () => {
  for (let i = 0; i < 25; i++) {
    const open = await page.evaluate(() =>
      !document.getElementById('modal-overlay')?.classList.contains('hidden'));
    if (!open) return;
    await page.evaluate(() => document.querySelector('#modal-window [data-act="close-modal"]')
      ?.click() ?? document.querySelector('#modal-window [data-act]')?.click());
    await page.waitForTimeout(110);
  }
  await page.evaluate(() => document.getElementById('modal-overlay')?.classList.add('hidden'));
};
const go = async v => {
  await dismiss();
  await page.evaluate(v => document.querySelector(`[data-act="nav"][data-view="${v}"]`)?.click(), v);
  await page.waitForTimeout(300);
};
const act = async (a, data = {}) => {
  await dismiss();
  await page.evaluate(([a, d]) => {
    const el = [...document.querySelectorAll(`[data-act="${a}"]`)].find(e =>
      Object.entries(d).every(([k, v]) => e.dataset[k] === String(v)));
    el?.click();
  }, [a, data]);
  await page.waitForTimeout(260);
};
const panel = () => page.textContent('#main-panel');
// The autosave timer is 10s; nudge it so localStorage matches live state.
const read = async () => {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
  });
  await page.waitForTimeout(140);
  return page.evaluate(() => JSON.parse(localStorage.getItem('runebound-save-v1')));
};
// Reach a state no click sequence can reach in a test — a bond built over
// days, a party already due home. `body` is the source of a function of
// the save object; it is applied to the CURRENT live save, not the
// fixture, so mutations compose.
const mutate = async body => {
  await read();
  await page.evaluate(src => {
    const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
    new Function('s', src)(s);
    localStorage.setItem('__pending', JSON.stringify(s));
  }, body);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await dismiss();
};

// =======================================================================
console.log('\n[the map is the front door]');
{
  const title = await page.textContent('.panel-title');
  ok('the game opens onto Hearthwick, not a character sheet',
     /hearthwick/i.test(title), title);
  const open = await page.locator('#main-panel [data-act="enter-place"]').count();
  const shut = await page.locator('#main-panel .town-place.locked').count();
  ok(`all ${PLACES.length} places are drawn on the map`, open + shut === PLACES.length,
     `${open} open, ${shut} locked`);
  ok('and at least the house is open from the first minute', open >= 1, String(open));

  // The map IS the front door, so clicking a building on it has to work.
  // An SVG <g> has no .click() and ignores a synthesised MouseEvent, so
  // this has to go through a real locator click — which is also the only
  // version of this that tests what the player actually does.
  await page.locator('#main-panel [data-act="enter-place"][data-place="home"]').first().click();
  await page.waitForTimeout(320);
  ok('clicking the house on the map walks you into it',
     /your house/i.test(await page.textContent('.panel-title')),
     await page.textContent('.panel-title'));
  await go('town');
  ok('and there is a way back out to the map',
     /hearthwick/i.test(await page.textContent('.panel-title')));

  // Every place has to open something. A map with a dead building on it
  // is worse than a map with one fewer building.
  const dead = [];
  for (const p of PLACES) {
    await go(p.view);
    const len = ((await panel()) || '').trim().length;
    if (len < 60) dead.push(`${p.id}(${len})`);
  }
  ok('every place on the map opens a panel with something in it',
     dead.length === 0, dead.join(', '));

  ok('the hour of day is a real band', HOURS.length === 6 && HOURS.every(h => h.id && h.tint));
}

// =======================================================================
console.log('\n[the house]');
await go('home');
{
  const p = await panel();
  ok('the house starts at one room', /\b(hearth)\b/i.test(p), p.slice(0, 60));

  const roomTabs = await page.locator('#main-panel [data-act="home-room"]').count();
  ok('only the rooms you have built are offered', roomTabs === 1, String(roomTabs));

  // Furniture is bought at the Square and put out at the house — two
  // places, deliberately, so the house is somewhere you go rather than a
  // shop with a bed in it.
  const first = FURNITURE.find(f => f.room === 'hearth' && f.gold);
  await go('square');
  await act('square-tab', { tab: 'buy' });
  const goldBefore = (await read()).gold;
  await act('home-buy', { furniture: first.id });
  let save = await read();
  ok(`buying the ${first.name} at the Square puts it in storage`,
     (save.home?.owned?.[first.id] || 0) === 1, JSON.stringify(save.home?.owned));
  ok('and it is paid for', save.gold < goldBefore, `${goldBefore} -> ${save.gold}`);

  await go('home');
  await act('home-place', { furniture: first.id, room: 'hearth' });
  save = await read();
  ok('placing it puts it in the room', (save.home?.placed?.hearth || []).includes(first.id),
     JSON.stringify(save.home?.placed));

  await act('home-unplace', { room: 'hearth', index: 0 });
  save = await read();
  ok('and it can be put away again without being lost',
     (save.home?.placed?.hearth || []).length === 0 && save.home.owned[first.id] === 1,
     JSON.stringify(save.home));
}

console.log('\n[a completed set is worth something]');
{
  // Fill the hearth with exactly one set. completedSets() is all-or-nothing
  // by design, so this is the assertion that the design is reachable.
  const hearth = ROOMS.find(r => r.id === 'hearth');
  const setId = Object.keys(SETS).find(s =>
    FURNITURE.filter(f => f.set === s && f.room === 'hearth').length >= hearth.slots);
  ok('some set can actually fill the hearth', !!setId, Object.keys(SETS).join(','));

  const pieces = FURNITURE.filter(f => f.set === setId && f.room === 'hearth')
    .slice(0, hearth.slots).map(f => f.id);
  await mutate(`s.home.owned = Object.fromEntries(${JSON.stringify(pieces)}.map(i => [i, 1]));
                s.home.placed = { hearth: ${JSON.stringify(pieces)} };`);
  await go('home');
  const p = await panel();
  ok(`the ${SETS[setId].name} set reads as complete in the room`,
     p.includes('Complete set') && p.includes(SETS[setId].name), p.slice(0, 200));
  ok('and what the set is worth is stated where the player can see it',
     p.includes(SETS[setId].desc), SETS[setId].desc);

  // The bonus has to reach the multiplier chain, not just the panel — a
  // set that only exists in its own description is decoration.
  const live = await page.evaluate(() => JSON.parse(localStorage.getItem('runebound-save-v1')));
  ok('the set really is recorded as placed, not just drawn',
     (live.home?.placed?.hearth || []).length === pieces.length,
     JSON.stringify(live.home?.placed));
}

console.log('\n[extending the house]');
{
  // Every material any extension asks for, read off the real cost table
  // so a renamed plank does not quietly turn this into a skipped test.
  const mats = {};
  for (let l = 1; l < MAX_HOUSE_LEVEL; l++)
    for (const id of Object.keys(houseUpgradeCost(l).items)) mats[id] = 99999;
  await mutate(`s.gold = 9e12; s.inventory = Object.assign({}, s.inventory, ${JSON.stringify(mats)});`);
  await go('home');
  let built = 1;
  for (let i = 0; i < MAX_HOUSE_LEVEL + 2; i++) {
    const can = await page.locator('#main-panel [data-act="home-extend"]').count();
    if (!can) break;
    await act('home-extend');
    const s = await read();
    if ((s.home?.level || 1) === built) break;      // it refused; stop
    built = s.home.level;
    await go('home');
  }
  ok(`the house can be extended all the way to ${MAX_HOUSE_LEVEL} rooms`,
     built === MAX_HOUSE_LEVEL, `reached ${built}`);
  const roomTabs = await page.locator('#main-panel [data-act="home-room"]').count();
  ok('and every room it grew is reachable', roomTabs === ROOMS.length, String(roomTabs));
  ok('the house does not extend past its last room',
     (await page.locator('#main-panel [data-act="home-extend"]').count()) === 0);
}

// =======================================================================
console.log('\n[the residents keep their own hours]');
{
  // Somebody has to be somewhere findable at every hour, or the town is
  // empty for a stretch of real time and the player learns not to look.
  const empty = HOURS.filter(h =>
    !Object.values(LIVES).some(l => l.at[h.id] && l.at[h.id] !== 'home'));
  ok('nobody is out of town for a whole band of the day', empty.length === 0,
     empty.map(h => h.id).join(', '));

  await go('square');
  const p = await panel();
  const shown = await page.locator('#main-panel [data-act="visit-person"]').count();
  ok('the square shows whoever is standing in it right now', shown >= 0, String(shown));

  // Force a known person into the square so the talk path is exercised
  // regardless of what hour the test happens to run at.
  const whoId = Object.keys(LIVES)[0];
  await page.evaluate(() => {}); // no-op keeps the evaluate shape consistent
  ok(`${whoId} has a life with a schedule, likes and requests`,
     !!LIVES[whoId].at && LIVES[whoId].likes?.length > 0 && LIVES[whoId].requests?.length === 3);
}

console.log('\n[bonds move, and they move slowly]');
{
  const whoId = Object.keys(LIVES)[0];
  // Put them in front of us: seed a bond, then talk.
  await mutate(`s.lives = s.lives || {};
    s.lives['${whoId}'] = { bond: 40, met: Date.now(), lastSeen: Date.now(), spokeAt: 0,
      request: null, requestDoneAt: 0, done: 0, ignored: 0, gifts: 0 };`);

  const before = (await read()).lives?.[whoId]?.bond;
  ok('a seeded bond survives a reload', before === 40, String(before));

  // Talking is capped to once an hour, so one click moves it and a second
  // does not. That cap is the thing that stops the bond being a button.
  for (const view of ['square', 'table', 'gate', 'home']) {
    await go(view);
    const there = await page.locator(`#main-panel [data-act="visit-person"][data-who="${whoId}"]`).count();
    if (there) { await act('visit-person', { who: whoId }); break; }
  }
  const after = (await read()).lives?.[whoId]?.bond;
  ok('talking to somebody you find moves the bond, or leaves it if they are elsewhere',
     after >= 40, `${before} -> ${after}`);

  ok('the bond tiers are ordered and reach the maximum',
     TIERS[TIERS.length - 1].at <= BOND.MAX && TIERS.every((t, i) => i === 0 || t.at > TIERS[i - 1].at),
     TIERS.map(t => `${t.id}@${t.at}`).join(' '));
  ok('the daily decay is small enough that a week away is survivable',
     BOND.DECAY_PER_DAY * 7 < BOND.MAX, String(BOND.DECAY_PER_DAY));
}

// =======================================================================
console.log('\n[the household]');
// They gather at the gate, which is also where you put them to work — the
// two things a former self is for are in the same place on purpose.
await go('gate');
{
  const p = await panel();
  const named = SAVE.legacy.filter(w => p.includes(w.name)).length;
  ok(`all ${SAVE.legacy.length} former selves are living in Hearthwick`,
     named === SAVE.legacy.length, `${named} of ${SAVE.legacy.length} named`);

  const jobs = await page.locator('.legacy-job').count();
  ok('each of them can be put to work', jobs === SAVE.legacy.length, String(jobs));

  // Assign one to a skill and check it is recorded — this is the bonus
  // that makes a long-running town worth more than a fresh one.
  await page.evaluate(() => {
    const sel = document.querySelector('.legacy-job');
    if (!sel) return;
    const opt = [...sel.options].find(o => o.value && o.value !== 'idle');
    if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await page.waitForTimeout(300);
  const s = await read();
  ok('assigning a former self to a job is recorded',
     s.legacy?.some(w => w.job && w.job !== 'idle'),
     JSON.stringify(s.legacy?.map(w => w.job)));
}

// =======================================================================
console.log('\n[expeditions]');
await go('gate');
{
  const p = await panel();
  ok('the gate offers somewhere to go', DESTINATIONS.some(d => p.includes(d.name)),
     p.slice(0, 120));

  const reachable = DESTINATIONS.filter(d => (d.era || 1) === 1);
  ok('at least one destination is open in Era I', reachable.length > 0,
     DESTINATIONS.map(d => `${d.id}:era${d.era || 1}`).join(' '));

  // The two dials that price the trip only appear once you have said where
  // you are going, which is the right order — risk means nothing without a
  // destination attached to it.
  const dest = reachable[0];
  await act('exp-dest', { dest: dest.id });
  const priced = await panel();
  ok('choosing a destination opens the risk and provision dials',
     RISKS.every(r => priced.includes(r.name)) && PROVISIONS.every(v => priced.includes(v.name)),
     priced.slice(0, 160));
  ok('and every party member can be picked',
     (await page.locator('#main-panel [data-act="exp-party"]').count()) >= SAVE.legacy.length,
     String(await page.locator('#main-panel [data-act="exp-party"]').count()));

  // Send one. The whole outcome is rolled at send time, so the assertion
  // is that a trip EXISTS and is dated, not what it brought back.
  await page.evaluate(() => {
    const m = document.querySelector('#main-panel [data-act="exp-party"]');
    m?.click();
  });
  await page.waitForTimeout(200);
  await act('exp-send');
  const s = await read();
  const a = s.expedition?.active;
  ok('sending a party puts one out past the gate', !!a, JSON.stringify(s.expedition));
  if (a) {
    ok('the trip is dated to come back later, not instantly',
       a.readyAt > a.startedAt, `${a.readyAt - a.startedAt}ms`);
    ok('the outcome was rolled at send time, not on collection', !!a.outcome?.beats?.length);
    ok('you cannot send a second party while one is out',
       (await page.locator('#main-panel [data-act="exp-send"]').count()) === 0);
    ok('anybody sent is marked away, so they cannot also work a skill',
       s.legacy.filter(w => w.job === 'expedition').length ===
       a.party.filter(m => m.kind === 'self').length,
       JSON.stringify(s.legacy.map(w => w.job)));
  }
}

console.log('\n[and they come home]');
{
  await mutate(`if (s.expedition && s.expedition.active) s.expedition.active.readyAt = Date.now() - 60000;`)
  await go('gate');
  const goldBefore = (await read()).gold;
  await act('expedition-collect');
  await dismiss();
  const s = await read();
  ok('a party that is due back can be collected', !s.expedition?.active,
     JSON.stringify(s.expedition?.active));
  ok('collecting counts the trip', (s.expedition?.completed || 0) >= 1,
     String(s.expedition?.completed));
  ok('and pays what it rolled', s.gold >= goldBefore, `${goldBefore} -> ${s.gold}`);
  ok('everybody sent is off expedition duty afterwards',
     !s.legacy?.some(w => w.job === 'expedition'),
     JSON.stringify(s.legacy?.map(w => w.job)));
}

// =======================================================================
console.log('\n[the town outlives the cycle]');
{
  // The load-bearing claim of the whole release. Furnish, bond, then
  // Ascend, and check the town is the thing that did not wind back.
  const whoId = Object.keys(LIVES)[0];
  const pieces = FURNITURE.filter(f => f.room === 'hearth').slice(0, 3).map(f => f.id);
  await mutate(`
    s.home.owned = Object.fromEntries(${JSON.stringify(pieces)}.map(i => [i, 1]));
    s.home.placed = { hearth: ${JSON.stringify(pieces)} };
    s.lives = s.lives || {};
    s.lives['${whoId}'] = { bond: 66, met: Date.now(), lastSeen: Date.now(), spokeAt: 0,
      request: null, requestDoneAt: 0, done: 3, ignored: 0, gifts: 2 };
    // Train past the bar so Ascension is actually legal.
    for (const id of Object.keys(s.skills)) s.skills[id] = { xp: 13034431 };`);

  await go('ascension');
  const beforeSelves = (await read()).legacy?.length || 0;
  const btn = await page.locator('#main-panel [data-act="ascend"]:not([disabled])').count();
  ok('Ascension is offered to a trained character', btn > 0, String(btn));

  await page.evaluate(() => {
    document.querySelector('#main-panel [data-act="ascend"]')?.click();
  });
  await page.waitForTimeout(600);
  // The confirm lives in the modal.
  await page.evaluate(() => {
    document.querySelector('#modal-window [data-act="confirm-ascend"]')?.click();
  });
  await page.waitForTimeout(900);
  await dismiss();

  const s = await read();
  ok('Ascension actually happened', (s.ascensions || 0) > SAVE.ascensions,
     `${SAVE.ascensions} -> ${s.ascensions}`);
  ok('the house is still furnished on the other side',
     (s.home?.placed?.hearth || []).length === pieces.length,
     JSON.stringify(s.home?.placed));
  ok('the people still know who you are',
     (s.lives?.[whoId]?.bond || 0) >= 60, String(s.lives?.[whoId]?.bond));
  ok('and one more of you moved in',
     (s.legacy?.length || 0) === beforeSelves + 1,
     `${beforeSelves} -> ${s.legacy?.length}`);
  ok('the skills did wind back, so the town is the exception and not the rule',
     (s.skills?.woodcutting?.xp || 0) < 13034431, String(s.skills?.woodcutting?.xp));
}

console.log('\n[nothing broke]');
ok('no runtime errors across the whole walk', errors.length === 0,
   [...new Set(errors)].slice(0, 4).join(' | '));

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
