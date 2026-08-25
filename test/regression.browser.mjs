// Full regression: every view, every new system, no console errors.
import { chromium } from 'playwright';
const now = Date.now();
const skills = {};
for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing','smithing','cooking','alchemy']) skills[k]={xp:0};
skills.hitpoints.xp = 1154;
for (const k of ['attack','strength','defense','woodcutting','mining','fishing','smithing','cooking']) skills[k].xp = 300000;

const plots = Array.from({length:9},(_,i)=> i<4
  ? { owned:true, building:['lumber_yard','market_stall','cafe','smithy'][i], level:3,
      stock:{ oak_log: 200, mythril_ore: 60, shrimp: 60, iron_bar: 80 }, progress:0 }
  : { owned:false, building:null, level:0, stock:{}, progress:0 });
const staff = {};
for (let i=0;i<6;i++) staff['s'+i]={ id:'s'+i, name:'Worker '+i, icon:'🧑‍🌾', trait:'diligent', skill:5, wage:70, assigned:i%4 };

const save = { version:1, gold: 3000000, lifetimeGold: 20000000, shards: 12, ascensions: 2,
  skills, lastSeen: now, createdAt: now,
  inventory: { oak_log:500, mythril_ore:200, shrimp:100, trout:50, iron_bar:200, egg_cat:1 },
  classId: 'rogue',
  look: { face:2, skin:5, hair:3, hairCol:7, eyes:1, eyeCol:4, brows:2, mouth:1, beard:2, mark:1, build:2, cloth:6, name:'Vesper' },
  town: { unlocked:true, name:'Hearthwick', plots, staff, applicants:[], applicantsAt:0,
    lifetimeRevenue: 900000, cycles: 400, unpaid:0, metNotables:{marrow:1,pell:1},
    extraPopulation:5, visitor:null, nextVisitorAt: now+9e9, timesRazed:1, lifetimeRevenueAllCycles:2000000 },
  pets: { owned:{ p1:{id:'p1',species:'poro',name:'Mochi',trait:'greedy',xp:5000,stage:'adult',
    hunger:90,happy:90,careAt:now,bornAt:now,lastPlayAt:0,lastBredAt:0,parents:null} },
    incubator:[], active:'p1', hatched:1, bred:0 },
  encounters: { nextAt: now - 1000, offer:null, history:{}, resolved:0 },  // armed to fire immediately
};

const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({viewport:{width:1500,height:1000}});
const errs=[];
await ctx.addInitScript(`(()=>{if(localStorage.getItem('__s'))return;localStorage.setItem('__s','1');
  localStorage.setItem('runebound-save-v1', ${JSON.stringify(JSON.stringify(save))});})()`);
const page = await ctx.newPage();
page.on('pageerror',e=>errs.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await page.goto('http://localhost:4173/',{waitUntil:'networkidle'});
await page.evaluate(()=>document.querySelector('#modal-overlay')?.classList.add('hidden'));
await page.waitForTimeout(600);
let pass=0,fail=0; const ok=(n,c,x='')=>{c?(pass++,console.log('  ✓',n)):(fail++,console.log('  ✗',n,x));};
// Story beats, codex discoveries and quest offers all queue modals while
// the suite runs. Clear any open one before touching the page.
const dismiss = async () => {
  for (let i = 0; i < 6; i++) {
    const open = await page.evaluate(() => !document.getElementById('modal-overlay')?.classList.contains('hidden'));
    if (!open) return;
    await page.evaluate(() => document.querySelector('#modal-window [data-act="close-modal"]')?.click()
      ?? document.getElementById('modal-overlay')?.classList.add('hidden'));
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => document.getElementById('modal-overlay')?.classList.add('hidden'));
};
const go = async v => { await dismiss();
  await page.evaluate(v=>document.querySelector(`[data-act="nav"][data-view="${v}"]`)?.click(), v);
  await page.waitForTimeout(220); };

console.log('\n[views]');
for (const v of ['character','journal','codex','look','class','achievements','inventory','equipment',
                 'combat','rifts','abilities','skill:woodcutting','skill:mining','skill:fishing',
                 'skill:smithing','skill:cooking','skill:alchemy','skill:farming','skill:thieving',
                 'skill:runecrafting','town','pets','ascension','leaderboard','settings']) {
  await go(v);
  const html = await page.innerHTML('#main-panel');
  ok(`${v}`, html.length > 150, `len=${html.length}`);
}

console.log('\n[appearance]');
await go('look');
ok('hero renders as SVG', (await page.locator('.look-stage svg path').count()) > 3);
await dismiss();
await page.evaluate(()=>document.querySelector('[data-act="look-random"]')?.click());
await page.waitForTimeout(250);
ok('randomise redraws without error', (await page.locator('.look-stage svg').count()) === 1);
await page.evaluate(()=>document.querySelector('[data-act="look-set"][data-key="hair"][data-index="9"]')?.click());
await page.waitForTimeout(250);
ok('hooded style renders', (await page.locator('.look-stage svg').count()) === 1);

console.log('\n[codex]');
await go('codex');
const codexTxt = await page.textContent('#main-panel');
ok('codex shows discovered entries', /discovered/i.test(codexTxt));
ok('cycle-aware copy appears at cycle 3', /more to say now/i.test(codexTxt), codexTxt.slice(0,200));
const cards = await page.locator('.codex-card:not(.locked)').count();
ok('entries have unlocked from the fixture state', cards > 0, `${cards} unlocked`);
if (cards > 0) {
  await dismiss();
  await page.locator('.codex-card:not(.locked)').first().click();
  await page.waitForTimeout(250);
  ok('an entry opens', (await page.locator('.codex-card.open').count()) === 1);
  ok('deeper passes are shown', (await page.locator('.codex-pass').count()) >= 1);
}

console.log('\n[class]');
await go('class');
const clsTxt = await page.textContent('#main-panel');
ok('shows the active class', /Rogue/.test(clsTxt));
ok('shows its signature', /Backstab/.test(clsTxt));

console.log('\n[encounters]');
// force one immediately
await page.evaluate(()=>{
  const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
  return true;
});
await go('town');
// drive the tick until an encounter offer appears
let offered = false;
for (let i=0;i<40 && !offered;i++) {
  await page.evaluate(()=>{ /* nudge */ });
  await page.waitForTimeout(300);
  offered = (await page.locator('.encounter-card').count()) > 0;
}
ok('an encounter appears in town', offered);
if (offered) {
  const encTxt = await page.textContent('.encounter-card');
  ok('encounter offers multiple choices', (await page.locator('[data-act="encounter-choose"]').count()) >= 2, encTxt.slice(0,80));
  const goldBefore = await page.evaluate(()=>{
    Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document,'visibilityState',{get:()=>'visible',configurable:true});
    return JSON.parse(localStorage.getItem('runebound-save-v1')).gold; });
  await dismiss();
  await page.locator('[data-act="encounter-choose"]:not([disabled])').first().click();
  await page.waitForTimeout(500);
  const resolution = await page.textContent('#modal-window').catch(()=> '');
  ok('resolution modal explains what happened', resolution.length > 60, resolution.slice(0,90));
  await page.evaluate(()=>document.querySelector('[data-act="close-modal"]')?.click());
  await page.waitForTimeout(300);
  ok('encounter clears after resolving', (await page.locator('.encounter-card').count()) === 0);
}

console.log('\n[new skills]');
for (const [v, needle] of [['skill:farming','Wheat Field'],['skill:thieving','Pick Pockets'],['skill:runecrafting','Grind Shards']]) {
  await go(v);
  const html = await page.textContent('#main-panel');
  ok(`${v} lists its actions`, html.includes(needle), html.slice(0,80));
  ok(`${v} offers a hireling`, /hire to train this skill passively|working at/.test(html));
}

console.log('\n[town economy]');
await go('town');
const townTxt = await page.textContent('#main-panel');
ok('town panel renders', townTxt.length > 400);

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length){console.log('\nErrors:');[...new Set(errs)].slice(0,10).forEach(e=>console.log('  !',e));}
await b.close(); process.exit(fail||errs.length?1:0);
