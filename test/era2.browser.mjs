// Era II: salvage, the Ledger's garnish, and the Repo Men taking something
// and giving it back. Also a runtime check that the circular imports
// between quests, ledger and repo actually resolve in the browser.
import { chromium } from 'playwright';
const now = Date.now();
const skills = {};
for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing','smithing','cooking','alchemy','farming','thieving','runecrafting']) skills[k]={xp:0};
skills.hitpoints.xp = 1154;
// High enough in the gating skills to open most dig sites.
for (const k of ['mining','thieving','runecrafting','smithing']) skills[k].xp = 6000000;   // ~lv 75
for (const k of ['attack','strength','defense','hitpoints']) skills[k].xp = 14000000;

const plots = Array.from({length:9},(_,i)=> i<3
  ? { owned:true, building:['lumber_yard','market_stall','cafe'][i], level:4, stock:{oak_log:200}, progress:0 }
  : { owned:false, building:null, level:0, stock:{}, progress:0 });
const staff={}; for(let i=0;i<3;i++) staff['s'+i]={id:'s'+i,name:'W'+i,icon:'🧑‍🌾',trait:'diligent',skill:5,wage:70,assigned:i};

const save = { version:1, gold: 5000000, lifetimeGold: 60000000, shards: 30, ascensions: 5,
  skills, lastSeen: now, createdAt: now, era: 2, ending: 'broken', endingOfferedCycle: 4,
  equipment: { weapon:'runite_weapon', helmet:'runite_helmet', chest:'runite_chest',
               legs:'runite_legs', boots:'runite_boots', ring:null, amulet:null },
  inventory: { leviathan_steak: 300 },
  charStats: { STR: 60, AGI: 40, VIT: 40, INT: 0, LUK: 20 }, statPointsSpent: 160,
  upgrades: { whetstone: 20, polish: 20 },
  enchants: { runite_weapon: 3 },
  town: { unlocked:true, name:'Hearthwick', plots, staff, applicants:[], applicantsAt:0,
    lifetimeRevenue:800000, cycles:400, unpaid:0, metNotables:{marrow:1}, extraPopulation:4,
    visitor:null, nextVisitorAt: now+9e9, timesRazed:4, lifetimeRevenueAllCycles:2000000 },
  pets:{ owned:{
      p1:{id:'p1',species:'dog',name:'Socks',trait:'clever',xp:2200,stage:'adult',hunger:90,happy:95,careAt:now,bornAt:now,lastPlayAt:0,lastBredAt:0,parents:null},
      p2:{id:'p2',species:'cat',name:'Biscuit',trait:'greedy',xp:1800,stage:'adult',hunger:90,happy:95,careAt:now,bornAt:now,lastPlayAt:0,lastBredAt:0,parents:null},
    }, incubator:[], active:'p1', hatched:2, bred:0 },
  encounters:{ nextAt: now+9e9, offer:null, history:{}, resolved:0 },
  ledger:{ assessed:0, balance:0, paid:0, settled:false, openedAt:0 },
  repo:{ nextAt: now+9e9, notice:null, camps:[], seized:0, recovered:0, repelled:0 },
  salvage:{ sites:[], active:null, nextSiteAt:0, digs:0, hauls:{} },
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
await page.waitForTimeout(800);
let pass=0,fail=0; const ok=(n,c,x='')=>{c?(pass++,console.log('  ✓',n)):(fail++,console.log('  ✗',n,x));};
const modalOpen = () => page.evaluate(()=>!document.getElementById('modal-overlay')?.classList.contains('hidden'));
const dismiss = async()=>{ for(let i=0;i<10;i++){ if(!await modalOpen())return;
  await page.evaluate(()=>document.querySelector('#modal-window [data-act]')?.click()); await page.waitForTimeout(160);}
  await page.evaluate(()=>document.getElementById('modal-overlay')?.classList.add('hidden')); };
const go = async v=>{ await dismiss();
  await page.evaluate(v=>document.querySelector(`[data-act="nav"][data-view="${v}"]`)?.click(), v);
  await page.waitForTimeout(300); };
/**
 * Force a save, mutate the saved state, write it back, and block the game
 * from overwriting it before the reload.
 *
 * Doing this by hand is a trap that has caught this harness three times:
 * autosave runs every ten seconds, so a bare read-modify-write usually
 * operates on stale state and silently discards whatever you were trying
 * to set up. `fn` receives the freshly-saved object and mutates in place.
 */
const mutateSave = async fn => {
  await read();                       // flush live state to localStorage first
  await page.evaluate(`(${fn.toString()})()`);   // note the call
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
};

const read = async()=>{ await page.evaluate(()=>{
  Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});
  document.dispatchEvent(new Event('visibilitychange'));
  Object.defineProperty(document,'visibilityState',{get:()=>'visible',configurable:true}); });
  await page.waitForTimeout(120);
  return page.evaluate(()=>JSON.parse(localStorage.getItem('runebound-save-v1'))); };

console.log('\n[boot]');
ok('no module errors from the circular imports', errs.length === 0, errs.slice(0,2).join(' | '));
ok('The Wastes appears in the nav', (await page.locator('[data-act="nav"][data-view="wastes"]').count()) === 1);

console.log('\n[salvage]');
await go('wastes');
const wastes = await page.textContent('#main-panel');
ok('the Wastes panel renders', /Scrap Wastes/.test(wastes));
ok('dig sites are on offer', (await page.locator('.dig-card').count()) > 0,
   String(await page.locator('.dig-card').count()));
ok('sites show their skill locks', (await page.locator('.dig-req').count()) > 0);
ok('some sites are diggable with these skills', (await page.locator('[data-act="start-dig"]').count()) > 0);
const invBefore = (await read()).inventory;
await page.locator('[data-act="start-dig"]').first().click();
await page.waitForTimeout(500);
ok('a dig starts', (await page.locator('.dig-active').count()) === 1);
ok('the dig can be abandoned', (await page.locator('[data-act="cancel-dig"]').count()) === 1);

console.log('\n[the ledger]');
const st1 = await read();
ok('the Ledger was assessed on arrival', st1.ledger.assessed > 0, String(st1.ledger.assessed));
ok('the bill scales with what you took out', st1.ledger.assessed > 1000000, String(st1.ledger.assessed));
const goldBefore = st1.gold;
const balBefore = st1.ledger.balance;
// Earn something and confirm the garnish bites.
await page.evaluate(()=>document.querySelector('[data-act="nav"][data-view="combat"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(()=>document.querySelector('[data-act="select-zone"][data-zone="meadow"]')?.click());
await page.waitForTimeout(200);
await page.evaluate(()=>document.querySelector('[data-act="fight"]')?.click());
await page.waitForTimeout(6000);
const st2 = await read();
ok('gold is being garnished at source', st2.ledger.balance < balBefore,
   `${Math.round(balBefore)} -> ${Math.round(st2.ledger.balance)}`);
ok('you still keep most of it', st2.gold > goldBefore, `${goldBefore} -> ${st2.gold}`);
ok('lifetime gold counts the gross', st2.lifetimeGold > st1.lifetimeGold);

await go('wastes');
await page.evaluate(()=>document.querySelector('[data-act="ledger-pay"]')?.click());
await page.waitForTimeout(600);
const st3 = await read();
ok('the Ledger can be settled outright', st3.ledger.settled === true);
ok('settling pays the permanent bonus', st3.ledger.settled && st3.gold < st2.gold);
await dismiss();

console.log('\n[the repo men]');
// Arm a notice immediately and let the tick serve it.
await mutateSave(() => {
  const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
  s.repo.nextAt = Date.now() - 1000;
  const real = Storage.prototype.setItem.bind(localStorage);
  real('runebound-save-v1', JSON.stringify(s));
  Storage.prototype.setItem = function(k,v){ if(k==='runebound-save-v1') return; return real(k,v); };
});
await dismiss();
await go('wastes');
let served = false;
for (let i=0;i<20 && !served;i++){ await page.waitForTimeout(600); await dismiss();
  served = (await page.locator('[data-act="repo-contest"]').count()) > 0;
  if (!served) await go('wastes'); }
ok('a notice of repossession is served', served);

if (served) {
  const target = await page.textContent('.repo-card');
  ok('the notice names what they want', /here for/.test(target), target.slice(0,100));
  ok('you can refuse or settle', (await page.locator('[data-act="repo-settle"]').count()) === 1);
  // Let it lapse into a seizure so the recovery loop can be tested.
  await mutateSave(() => {
    const s = JSON.parse(localStorage.getItem('runebound-save-v1'));
    if (s.repo.notice) s.repo.notice.expiresAt = Date.now() - 5000;
    const real = Storage.prototype.setItem.bind(localStorage);
    real('runebound-save-v1', JSON.stringify(s));
    Storage.prototype.setItem = function(k,v){ if(k==='runebound-save-v1') return; return real(k,v); };
  });
  let seized = false;
  for (let i=0;i<15 && !seized;i++){
    // read() forces a save first; a bare localStorage read sees stale state
    // because autosave only runs every ten seconds.
    const st = await read();
    seized = (st.repo?.camps || []).length > 0;
    if (!seized) await page.waitForTimeout(700);
  }
  ok('an unanswered notice results in a seizure', seized);
  if (seized) {
    await dismiss();
    const st = await read();
    ok('the seized item is HELD, not destroyed', !!st.repo.camps[0].held);
    ok('the camp has a clear target', st.repo.camps[0].needed > 0);
    await go('wastes');
    ok('custody is shown in the Wastes', /Syndicate Custody/i.test(await page.textContent('#main-panel')));
    ok('the camp zone becomes reachable', (await page.locator('[data-act="raid-camp"]').count()) === 1);
    // Fight the camp and confirm kills credit the recovery.
    await page.locator('[data-act="raid-camp"]').click();
    await page.waitForTimeout(400);
    await page.evaluate(()=>document.querySelector('[data-act="fight"]')?.click());
    await page.waitForTimeout(9000);
    const st4 = await read();
    const camp = (st4.repo?.camps || [])[0];
    ok('killing Repo Men credits the camp', !camp || camp.cleared > 0,
       camp ? `${camp.cleared}/${camp.needed}` : 'camp already cleared');
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length){console.log('\nErrors:');[...new Set(errs)].slice(0,8).forEach(e=>console.log('  !',e));}
await b.close(); process.exit(fail?1:0);
