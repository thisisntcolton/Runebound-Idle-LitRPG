// ============================================================
// THE BUG RUN
//
// The other suites each assert something specific. This one asserts
// nothing in particular and instead tries to break the game: it loads
// five very different saves, walks every view in the sidebar, opens every
// tab inside them, lets the loop tick, and fails on any uncaught error or
// console error at all.
//
// It exists because most of what has actually gone wrong in this project
// went wrong in a state no targeted test happened to construct — a
// classless character below the class gate, a finished blackjack hand
// blocking the dice, a level-1 save four cycles deep. Breadth catches
// those; depth does not.
// ============================================================
import { chromium } from 'playwright';
import { SPECIES_LIST } from '../src/data/pets.js';
import { ABILITY_LIST } from '../src/data/abilities.js';
import { CLASS_LIST } from '../src/data/classes.js';
import { xpForLevel } from '../src/core/xp.js';

const now = Date.now();
const SKILL_IDS = ['attack','strength','defense','hitpoints','woodcutting','mining','fishing',
                   'smithing','cooking','alchemy','farming','thieving','runecrafting'];

const skillsAt = lvl => Object.fromEntries(SKILL_IDS.map(k => [k, { xp: xpForLevel(lvl) }]));

const plots = built => Array.from({ length: 9 }, (_, i) => i < built
  ? { owned: true, building: ['lumber_yard','market_stall','hatchery','cafe','herb_garden',
                              'apothecary','smithy','quarry','inn'][i],
      level: 3, stock: {}, progress: 0 }
  : { owned: false, building: null, level: 0, stock: {}, progress: 0 });

const town = built => ({
  unlocked: built > 0, name: 'Hearthwick', applicants: [], cycles: 100, lifetimeRevenue: 900000,
  staff: built ? { w1: { id: 'w1', name: 'Perrin Vane', icon: '🧑‍🌾', trait: 'diligent',
                         skill: 4, wage: 58, assigned: 0 } } : {},
  plots: plots(built), metNotables: {}, extraPopulation: 0, visitor: null, nextVisitorAt: 0,
});

const SAVES = [
  {
    name: 'brand new',
    save: { version: 1, gold: 0, lifetimeGold: 0, shards: 0, ascensions: 0,
            skills: skillsAt(1), lastSeen: now, createdAt: now, era: 1 },
  },
  {
    name: 'mid, classed, town running',
    save: { version: 1, gold: 900000, lifetimeGold: 4000000, shards: 30, ascensions: 1,
            skills: skillsAt(55), lastSeen: now, createdAt: now, era: 1,
            classId: 'artisan', classChosenAt: now,
            classProgress: { artisan: { xp: 60000, pointsUsed: 6, spent: { art_hands: 3 } } },
            town: town(9), inventory: { oak_log: 500, raw_shrimp: 200, herb_sagewort: 200, iron_bar: 200 },
            charStats: { STR: 20, AGI: 20, VIT: 20, INT: 0, LUK: 10 }, statPointsSpent: 70 },
  },
  {
    // The save that produced the report: deep into the cycle, no class,
    // below the class gate, Aurelion long dead, offer already consumed.
    name: 'five cycles deep, freshly reset',
    save: { version: 1, gold: 40000, lifetimeGold: 9e7, shards: 120, ascensions: 6,
            skills: skillsAt(1), lastSeen: now, createdAt: now, era: 1,
            ending: 'fed', endingOfferedCycle: 6,
            stats: { kills: 9000, deaths: 20, actions: 20000, itemsSold: 400, bossKills: 30,
                     highestDamage: 1200, offlineEarnings: 0, aurelionKills: 4, flamesFed: 3,
                     dungeonRuns: 20, dungeonClears: {}, potionsDrunk: 40, enchants: 12,
                     riftsSealed: 6, theftsFought: 3, tomesLearned: 8, errands: 2 },
            classId: null, classProgress: { rogue: { xp: 200000, pointsUsed: 20, spent: { rog_edge: 3 } } },
            pets: { owned: { p1: { id: 'p1', name: 'Biscuit', species: 'cat', trait: 'greedy',
                                   stage: 'elder', xp: 9000000, hunger: 100, happy: 100, careAt: now } },
                    incubator: [], active: null, hatched: 9, bred: 3,
                    seen: Object.fromEntries(SPECIES_LIST.map(s => [s.id, now])) },
            town: town(4) },
  },
  {
    name: 'Era II, everything open',
    save: { version: 1, gold: 5e8, lifetimeGold: 9e9, shards: 900, ascensions: 9,
            skills: skillsAt(120), lastSeen: now, createdAt: now, era: 2, ending: 'broken',
            eraEnteredAt: now - 9e6, endingOfferedCycle: 9,
            classId: 'mage', classChosenAt: now,
            classProgress: Object.fromEntries(CLASS_LIST.map(c => [c.id, { xp: 900000, pointsUsed: 30, spent: {} }])),
            abilities: { known: Object.fromEntries(ABILITY_LIST.map(a => [a.id, now])),
                         equipped: { strike: 'cleave', guard: 'parry', utility: 'firebomb' }, cooldowns: {} },
            deep: { best: 22, depth: 12, clears: 300, kills: 2000, wardens: 40 },
            worldBoss: { felled: 3, dealt: 0 },
            town: town(9),
            inventory: { leviathan_steak: 900, runite_bar: 400 },
            charStats: { STR: 99, AGI: 60, VIT: 80, INT: 40, LUK: 40 }, statPointsSpent: 319 },
  },
  {
    name: 'capped Era II, every perk bought',
    save: { version: 1, gold: 9e9, lifetimeGold: 9e10, shards: 5000, ascensions: 20,
            skills: skillsAt(199), lastSeen: now, createdAt: now, era: 2, ending: 'broken',
            classId: 'wanderer', classChosenAt: now, classProgress: {},
            perks: { swift_learner: 10, golden_touch: 10, timekeeper: 4, warrior_soul: 8,
                     ironhide: 8, fortunes_favor: 5, haste: 5, compound_interest: 5,
                     second_shadow: 4, unspent_hours: 3, keen_edge: 5, the_long_memory: 3 },
            town: town(9), charStats: { STR: 99, AGI: 99, VIT: 99, INT: 99, LUK: 99 }, statPointsSpent: 495 },
  },
];

const VIEWS = ['character','journal','codex','look','class','achievements','inventory','equipment',
               'combat','rifts','road','abilities','town','casino','pets','ascension',
               'leaderboard','settings','wastes',
               ...['woodcutting','mining','fishing','smithing','cooking','alchemy','farming',
                   'thieving','runecrafting'].map(s => 'skill:' + s)];


let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log('  ✓', n)) : (fail++, console.log('  ✗', n, x)); };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const { name, save } of SAVES) {
  console.log(`\n[${name}]`);
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
  const errs = [];
  await ctx.addInitScript(`(()=>{if(localStorage.getItem('__s'))return;localStorage.setItem('__s','1');
    localStorage.setItem('runebound-save-v1', ${JSON.stringify(JSON.stringify(save))});})()`);
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('PAGEERROR ' + e));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  ok('loads without error', errs.length === 0, errs.slice(0, 2).join(' | '));

  const dismiss = async () => {
    for (let i = 0; i < 25; i++) {
      const open = await page.evaluate(() => !document.getElementById('modal-overlay')?.classList.contains('hidden'));
      if (!open) return;
      await page.evaluate(() => document.querySelector('#modal-window [data-act="close-modal"]')
        ?.click() ?? document.querySelector('#modal-window [data-act]')?.click());
      await page.waitForTimeout(110);
    }
    await page.evaluate(() => document.getElementById('modal-overlay')?.classList.add('hidden'));
  };
  await dismiss();

  // Every view in turn. A view that is not offered in this save is skipped
  // rather than failed — gating is the point of several of them.
  let visited = 0, blank = [];
  for (const v of VIEWS) {
    const present = await page.evaluate(v => !!document.querySelector(`[data-act="nav"][data-view="${v}"]`), v);
    if (!present) continue;
    await dismiss();
    await page.evaluate(v => document.querySelector(`[data-act="nav"][data-view="${v}"]`)?.click(), v);
    await page.waitForTimeout(150);
    visited++;
    const len = await page.evaluate(() => (document.getElementById('main-panel')?.textContent || '').trim().length);
    if (len < 40) blank.push(v);
  }
  ok(`walked every offered view (${visited})`, visited >= 15, String(visited));
  ok('no view renders blank', blank.length === 0, blank.join(', '));

  // Every tab control inside those views.
  //
  // These have to be swept per view, not once at the end: a tab button
  // only exists in the DOM while you are standing on the panel that owns
  // it. The first version collected them after walking everything, which
  // meant it was searching a skill panel for the casino's tabs and
  // cheerfully reporting "0 tabs, all fine".
  const TAB_VIEWS = [
    ['pets', 'pets-tab'],
    ['casino', 'casino-table'],
    ['codex', 'codex-cat'],
  ];
  let tabbed = 0;
  for (const [view, act] of TAB_VIEWS) {
    const present = await page.evaluate(v => !!document.querySelector(`[data-act="nav"][data-view="${v}"]`), view);
    if (!present) continue;
    await dismiss();
    await page.evaluate(v => document.querySelector(`[data-act="nav"][data-view="${v}"]`)?.click(), view);
    await page.waitForTimeout(200);
    const vals = await page.evaluate(a => [...document.querySelectorAll(`#main-panel [data-act="${a}"]`)]
      .map(e => e.dataset.tab || e.dataset.table || e.dataset.cat).filter(Boolean), act);
    for (const val of vals) {
      await dismiss();
      await page.evaluate(([a, v]) => {
        const el = [...document.querySelectorAll(`#main-panel [data-act="${a}"]`)]
          .find(e => (e.dataset.tab || e.dataset.table || e.dataset.cat) === v);
        el?.click();
      }, [act, val]);
      await page.waitForTimeout(140);
      const len = await page.evaluate(() => (document.getElementById('main-panel')?.textContent || '').trim().length);
      if (len < 40) blank.push(`${view}:${val}`);
      tabbed++;
    }
  }
  ok(`opened every tab in every view that has them (${tabbed})`, tabbed >= 3, String(tabbed));
  ok('no tab renders blank either', blank.length === 0, blank.join(', '));

  // Let the loop actually run, so ticking systems get a turn.
  await dismiss();
  await page.waitForTimeout(4000);
  await dismiss();

  ok('no runtime errors anywhere in the sweep', errs.length === 0,
     [...new Set(errs)].slice(0, 3).join(' | '));

  // The save must still be readable and sane afterwards.
  const after = await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    return JSON.parse(localStorage.getItem('runebound-save-v1') || 'null');
  });
  ok('the save survives the sweep', !!after && typeof after.gold === 'number');
  ok('gold did not go negative or NaN',
     Number.isFinite(after?.gold) && after.gold >= 0, String(after?.gold));

  await ctx.close();
}

// ---------------- The reported bug ----------------
console.log('\n[the way out of the loop is actually reachable]');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
  const errs = [];
  const stuck = SAVES[2].save;   // five cycles deep, offer already consumed
  await ctx.addInitScript(`(()=>{if(localStorage.getItem('__s'))return;localStorage.setItem('__s','1');
    localStorage.setItem('runebound-save-v1', ${JSON.stringify(JSON.stringify(SAVES[2].save))});})()`);
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.evaluate(() => document.getElementById('modal-overlay')?.classList.add('hidden'));
  await page.evaluate(() => document.querySelector('[data-act="nav"][data-view="ascension"]')?.click());
  await page.waitForTimeout(400);

  const txt = await page.textContent('#main-panel');
  ok('a player six cycles in is told there is a way out', /way out of the loop/i.test(txt));
  ok('and that Aurelion is already behind them', /already beaten/i.test(txt));
  ok('the choice is offered on demand, not gated behind another 95-level grind',
     (await page.locator('[data-act="ending-offer"]').count()) === 1);

  await page.locator('[data-act="ending-offer"]').click();
  await page.waitForTimeout(500);
  ok('taking it opens THE CHOICE', /THE CHOICE/i.test(await page.textContent('#modal-window')));
  ok('with Break the Cycle on it', (await page.locator('[data-act="ending-break"]').count()) === 1);

  await page.evaluate(() => document.querySelector('[data-act="ending-break"]')?.click());
  await page.waitForTimeout(600);
  for (let i = 0; i < 12; i++) {
    const w = await page.textContent('#modal-window').catch(() => '');
    if (/Pick up a stone/.test(w)) {
      await page.evaluate(() => document.querySelector('[data-act="enter-wastes"]')?.click());
      await page.waitForTimeout(600);
      break;
    }
    await page.evaluate(() => document.querySelector('#modal-window [data-act]')?.click());
    await page.waitForTimeout(300);
  }
  const s = await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    return JSON.parse(localStorage.getItem('runebound-save-v1'));
  });
  ok('and breaking it actually opens Era II', s.era === 2 && s.ending === 'broken',
     `era ${s.era}, ending ${s.ending}`);
  ok('no errors on the way through', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
