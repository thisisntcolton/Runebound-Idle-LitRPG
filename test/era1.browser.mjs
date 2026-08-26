// The Era 1 -> Era 2 transition: the four-beat reveal, the townsfolk,
// the world state change, and the town surviving Ascension afterwards.
import { chromium } from 'playwright';
const now = Date.now();
const skills = {};
for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing','smithing','cooking','alchemy','farming','thieving','runecrafting']) skills[k]={xp:0};
skills.hitpoints.xp = 1154;
for (const k of ['attack','strength','defense','woodcutting','mining','fishing','smithing','cooking']) skills[k].xp = 900000;
// Aurelion is 3200hp / 350def and gates the ending. Max the combat skills and
// hand over runite so the fight resolves inside the test's patience.
for (const k of ['attack','strength','defense','hitpoints']) skills[k].xp = 14000000;

const plots = Array.from({length:9},(_,i)=> i<3
  ? { owned:true, building:['lumber_yard','market_stall','cafe'][i], level:3, stock:{oak_log:150}, progress:0 }
  : { owned:false, building:null, level:0, stock:{}, progress:0 });
const staff = {};
for (let i=0;i<4;i++) staff['s'+i]={id:'s'+i,name:'W'+i,icon:'🧑‍🌾',trait:'diligent',skill:5,wage:70,assigned:i%3};

// Four ascensions in, at the moment the choice is offered.
const save = { version:1, gold: 4000000, lifetimeGold: 60000000, shards: 30, ascensions: 4,
  skills, lastSeen: now, createdAt: now, era: 1, ending: null, endingOfferedCycle: -1,
  hirelings: { h_wood:4, h_mine:4 },
  equipment: { weapon:'runite_weapon', helmet:'runite_helmet', chest:'runite_chest',
               legs:'runite_legs', boots:'runite_boots', ring:null, amulet:null },
  inventory: { leviathan_steak: 200, runite_weapon:1 },
  charStats: { STR: 60, AGI: 40, VIT: 40, INT: 0, LUK: 20 }, statPointsSpent: 160,
  upgrades: { whetstone: 20, polish: 20 },
  town: { unlocked:true, name:'Hearthwick', plots, staff, applicants:[], applicantsAt:0,
    lifetimeRevenue: 500000, cycles:300, unpaid:0, metNotables:{marrow:1,pell:1},
    extraPopulation:4, visitor:null, nextVisitorAt: now+9e9, timesRazed:3, lifetimeRevenueAllCycles:900000 },
  pets:{ owned:{}, incubator:[], active:null, hatched:0, bred:0 },
  encounters:{ nextAt: now+9e9, offer:null, history:{}, resolved:0 },
};

const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:1400,height:950} });
const errs=[];
await ctx.addInitScript(`(()=>{if(localStorage.getItem('__s'))return;localStorage.setItem('__s','1');
  localStorage.setItem('runebound-save-v1', ${JSON.stringify(JSON.stringify(save))});})()`);
const page = await ctx.newPage();
page.on('pageerror',e=>errs.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await page.goto('http://localhost:4173/',{waitUntil:'networkidle'});
await page.waitForTimeout(600);
let pass=0,fail=0; const ok=(n,c,x='')=>{c?(pass++,console.log('  ✓',n)):(fail++,console.log('  ✗',n,x));};
// The modal window keeps its last content in the DOM after being closed,
// so visibility has to come from the overlay, not from innerHTML.
const modalText = async () => {
  const open = await page.evaluate(() =>
    !document.getElementById('modal-overlay')?.classList.contains('hidden'));
  if (!open) return '';
  return page.textContent('#modal-window').catch(() => '');
};
const advance = async label => {
  const btn = await page.locator(`#modal-window [data-act]`).first();
  await btn.click(); await page.waitForTimeout(350);
};
const save_ = async () => { await page.evaluate(()=>{ 
  Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});
  document.dispatchEvent(new Event('visibilitychange'));
  Object.defineProperty(document,'visibilityState',{get:()=>'visible',configurable:true}); });
  await page.waitForTimeout(120);
  return page.evaluate(()=>JSON.parse(localStorage.getItem('runebound-save-v1'))); };

console.log('\n[the choice]');
// Clear whatever is queued, then actually go and kill Aurelion — the offer
// is triggered by that kill, so faking it would skip the code under test.
for (let i=0;i<8;i++){ const t=await modalText(); if(!t) break; await advance(); }
await page.evaluate(()=>document.querySelector('[data-act="nav"][data-view="combat"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(()=>document.querySelector('[data-act="select-zone"][data-zone="dragonspire"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(()=>document.querySelector('[data-act="fight"][data-monster="aurelion"]')?.click());
await page.waitForTimeout(400);

let found = false;
for (let i=0;i<90 && !found;i++) {
  const t = await modalText();
  if (/LAST FLAME GUTTERS|Break the cycle/i.test(t)) { found = true; break; }
  if (t) { await advance(); } else { await page.waitForTimeout(500); }
}
ok('the ending choice is offered at cycle 5', found, (await modalText()).slice(0,90));
ok('both options are present', (await page.locator('[data-act="ending-break"]').count()) === 1
   && (await page.locator('[data-act="ending-feed"]').count()) === 1);

console.log('\n[the reveal, four beats]');
await page.locator('[data-act="ending-break"]').click();
await page.waitForTimeout(400);
const beat1 = await modalText();
ok('beat 1 is still the hopeful ending', /There is|morning/i.test(beat1), beat1.slice(0,80));
ok('beat 1 does NOT mention containment', !/containment|sandbox/i.test(beat1));
await advance();
const beat2 = await modalText();
ok('beat 2 shows the loop stuttering', /does not end. It beg/i.test(beat2), beat2.slice(0,90));
await advance();
const beat3 = await modalText();
ok('beat 3 is the containment notice', /HEARTHWICK_SANDBOX_04|CONTAINMENT/i.test(beat3), beat3.slice(0,90));
ok('the System keeps its composure', !/idiot|stupid|lol/i.test(beat3));
await advance();
const beat4 = await modalText();
ok('beat 4 lands in the Wastes', /Scrap Wastes|bruised purple/i.test(beat4), beat4.slice(0,90));

const beforeEra = (await save_()).era;
ok('era is still 1 until the player accepts', beforeEra === 1, String(beforeEra));

console.log('\n[the townsfolk]');
await page.locator('[data-act="enter-wastes"]').click();
await page.waitForTimeout(450);
const seen = [];
for (let i=0;i<10;i++) {
  const t = await modalText();
  if (!t) break;
  seen.push(t);
  if (/Nothing Resets/i.test(t)) { await advance(); break; }
  await advance();
}
const all = seen.join(' | ');
ok('Marrow lays a stone', /Marrow/.test(all));
ok('Pell says she told you', /told\b.*\bseam|Pell/i.test(all));
ok('Vera reads the ground', /Vera/.test(all));
ok('the closing beat explains the new rule', /Nothing Resets|survives Ascension/i.test(all));

console.log('\n[the world changed]');
const st = await save_();
ok('era advanced to 2', st.era === 2, String(st.era));
ok('ending recorded as broken', st.ending === 'broken');
ok('body carries the era class', await page.evaluate(()=>document.body.classList.contains('era-wastes')));
ok('the topbar is marked unindexed', await page.evaluate(()=>{
  const el = document.querySelector('.topbar-sub');
  return el ? getComputedStyle(el,'::after').content.includes('unindexed') : false;
}));

console.log('\n[the town no longer burns]');
await page.evaluate(()=>document.querySelector('[data-act="nav"][data-view="ascension"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(()=>document.querySelector('[data-act="ascend"]')?.click());
await page.waitForTimeout(300);
const confirm = await modalText();
ok('confirm no longer threatens the town', !/Hearthwick falls/i.test(confirm), confirm.slice(0,120));
await page.evaluate(()=>document.querySelector('[data-act="confirm-ascend"]')?.click());
await page.waitForTimeout(700);
for (let i=0;i<6;i++){ const t=await modalText(); if(!t)break; await advance(); }
const after = await save_();
ok('buildings survived Ascension', after.town.plots.filter(p=>p.building).length === 3,
   String(after.town.plots.filter(p=>p.building).length));
ok('staff survived Ascension', Object.keys(after.town.staff).length === 4);
ok('the town is still unlocked', after.town.unlocked === true);
ok('gold still reset', after.gold < 1000, String(after.gold));
ok('hirelings still reset', Object.keys(after.hirelings||{}).length === 0);
ok('era survived Ascension', after.era === 2);

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length){console.log('\nErrors:');[...new Set(errs)].slice(0,8).forEach(e=>console.log('  !',e));}
await b.close(); process.exit(fail||errs.length?1:0);
