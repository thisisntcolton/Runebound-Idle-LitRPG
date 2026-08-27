// Does Ascension actually close the instant-rebuy hole?
import { chromium } from 'playwright';
const now = Date.now();
// A player at the ascension threshold with a fully built, staffed town
const plots = Array.from({length:9}, (_,i) => i < 4
  ? { owned:true, building:['lumber_yard','market_stall','cafe','smithy'][i], level:4, stock:{}, progress:0 }
  : { owned:false, building:null, level:0, stock:{}, progress:0 });
const staff = {};
for (let i=0;i<6;i++) staff['s'+i] = { id:'s'+i, name:'W'+i, trait:'diligent', skill:6, wage:82, assigned: i%4 };
const skills = {};
for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing','smithing','cooking','alchemy'])
  skills[k] = { xp: 1000000 };
const save = { version:1, gold: 5000000, lifetimeGold: 90000000, shards: 40, ascensions: 3,
  skills, hirelings: { h_wood:5, h_mine:5, h_fish:5, h_smith:3, h_cook:3, h_alch:2 },
  upgrades: { axe:20, pick:20 }, lastSeen: now, createdAt: now,
  town: { unlocked:true, name:'Hearthwick', plots, staff, applicants:[], applicantsAt:0,
          lifetimeRevenue: 4000000, cycles: 900, unpaid:0, metNotables:{ baldric:1, mirella:1 },
          extraPopulation: 4, visitor:null, nextVisitorAt:0 },
  classId: 'rogue',
  classProgress: { rogue: { xp: 2500000, spent: { r_edge: 5, r_quick: 3 }, pointsUsed: 8 },
                   mage:  { xp: 400000,  spent: { m_ward: 2 },              pointsUsed: 2 } },
  look: { face:1, skin:3, hair:2, hairCol:5, eyes:0, eyeCol:2, brows:1, mouth:1, beard:0, mark:0, build:1, cloth:4, name:'Vesper' },
  pets: { owned: { p1:{ id:'p1', species:'cat', name:'Biscuit', trait:'greedy', xp:3000,
    stage:'adult', hunger:100, happy:100, careAt:now, bornAt:now, lastPlayAt:0, lastBredAt:0, parents:null } },
    incubator:[], active:'p1', hatched:1, bred:0 },
};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext();
const errs=[]; 
await ctx.addInitScript(`(()=>{ if(localStorage.getItem('__s'))return; localStorage.setItem('__s','1');
  localStorage.setItem('runebound-save-v1', ${JSON.stringify(JSON.stringify(save))}); })()`);
const page = await ctx.newPage();
page.on('pageerror', e=>errs.push(String(e)));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
await page.goto('http://localhost:4173/', { waitUntil:'networkidle' });
await page.evaluate(()=>document.querySelector('#modal-overlay')?.classList.add('hidden'));
await page.waitForTimeout(500);
let pass=0,fail=0; const ok=(n,c,x='')=>{c?(pass++,console.log('  ✓',n)):(fail++,console.log('  ✗',n,x));};

const read = async () => { await page.evaluate(()=>{ 
  Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});
  document.dispatchEvent(new Event('visibilitychange'));
  Object.defineProperty(document,'visibilityState',{get:()=>'visible',configurable:true}); });
  await page.waitForTimeout(120);
  return page.evaluate(()=>JSON.parse(localStorage.getItem('runebound-save-v1'))); };

const before = await read();
ok('fixture starts with a built town', before.town.plots.filter(p=>p.building).length === 4);
ok('fixture starts with staff', Object.keys(before.town.staff).length === 6);

await page.evaluate(()=>document.querySelector('[data-act="nav"][data-view="ascension"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(()=>document.querySelector('[data-act="ascend"]')?.click());
await page.waitForTimeout(300);
const confirmHtml = await page.textContent('#modal-window');
ok('confirm warns the town falls', /Hearthwick falls/i.test(confirmHtml), confirmHtml.slice(0,160));
await page.evaluate(()=>document.querySelector('[data-act="confirm-ascend"]')?.click());
await page.waitForTimeout(800);

const after = await read();
ok('all buildings razed', after.town.plots.filter(p=>p.building).length === 0,
   String(after.town.plots.filter(p=>p.building).length));
ok('all plots un-owned', after.town.plots.filter(p=>p.owned).length === 0);
ok('all staff gone', Object.keys(after.town.staff).length === 0);
ok('town relocked', after.town.unlocked === false);
ok('gold reset', after.gold === 0, String(after.gold));
ok('hirelings wiped', Object.keys(after.hirelings || {}).length === 0, JSON.stringify(after.hirelings));
ok('shards gained', after.shards > before.shards, `${before.shards} -> ${after.shards}`);
ok('pets survived', Object.keys(after.pets.owned).length === 1);
ok('pet kept its level', after.pets.owned.p1.xp >= 3000);
ok('people you met are remembered', Object.keys(after.town.metNotables).length === 2);
ok('raze counted', after.town.timesRazed === 1, String(after.town.timesRazed));
// Talent trees used to survive Ascension in full, which is precisely why
// a cycle-seven player walked back in already finished and the late
// cycles took minutes. They reset now, and what survives instead is the
// Mastery — see the block below.
ok('talent points do NOT survive Ascension',
   !(after.classProgress?.rogue?.pointsUsed > 0),
   JSON.stringify(after.classProgress?.rogue));
ok('spent talent ranks are gone too', !after.classProgress?.rogue?.spent?.r_edge);
ok('class XP resets with them', !(after.classProgress?.rogue?.xp > 0),
   String(after.classProgress?.rogue?.xp));
ok('no class keeps its progress', Object.keys(after.classProgress || {}).length === 0,
   JSON.stringify(after.classProgress));
// A tree that was never capped earns no Mastery, so this fixture keeps
// nothing — which is the honest outcome and worth asserting.
ok('and an uncapped tree leaves no Mastery behind',
   Object.keys(after.masteries || {}).length === 0, JSON.stringify(after.masteries));
ok('the class itself is cleared for a fresh choice', !after.classId, String(after.classId));
ok('your appearance survives', after.look?.name === 'Vesper');
ok('lifetime revenue rolled up', after.town.lifetimeRevenueAllCycles === 4000000,
   String(after.town.lifetimeRevenueAllCycles));

// The actual exploit: can the town instantly refund a hireling roster?
await page.waitForTimeout(3000);
const later = await read();
ok('no gold is being generated post-ascension', later.gold < 1000, `gold=${later.gold}`);

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length) { console.log('Errors:'); [...new Set(errs)].slice(0,6).forEach(e=>console.log('  !',e)); }
await b.close();
process.exit(fail||errs.length?1:0);
