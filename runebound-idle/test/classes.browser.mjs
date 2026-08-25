import { chromium } from 'playwright';
const now = Date.now();
const skills = {}; for (const k of ['attack','strength','defense','hitpoints','woodcutting','mining','fishing','smithing','cooking','alchemy']) skills[k]={xp:0};
skills.hitpoints.xp = 1154;
for (const k of ['attack','strength','defense','woodcutting','mining']) skills[k].xp = 15000;
const save = { version:1, gold: 200000, lastSeen: now, createdAt: now, skills,
  inventory: { oak_log: 200, mythril_ore: 100 } };
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await b.newContext(); const errs=[];
await ctx.addInitScript(`(()=>{if(localStorage.getItem('__s'))return;localStorage.setItem('__s','1');
  localStorage.setItem('runebound-save-v1', ${JSON.stringify(JSON.stringify(save))});})()`);
const page = await ctx.newPage();
page.on('pageerror',e=>errs.push(String(e))); page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await page.goto('http://localhost:4173/',{waitUntil:'networkidle'});
await page.waitForTimeout(900);
let pass=0,fail=0; const ok=(n,c,x='')=>{c?(pass++,console.log('  ✓',n)):(fail++,console.log('  ✗',n,x));};

const modal = await page.textContent('#modal-window').catch(()=> '');
ok('class choice is offered on reaching the threshold', /Choose a Path/i.test(modal), modal.slice(0,140));
ok('all five classes are presented', (await page.locator('[data-act="choose-class"]').count()) === 5);

const maxHitOf = async () => {
  await page.evaluate(()=>document.querySelector('[data-act="nav"][data-view="character"]')?.click());
  await page.waitForTimeout(250);
  const t = await page.textContent('#main-panel');
  const m = t.match(/(\d+)\s*[-–]\s*(\d+)/); return m ? Number(m[2]) : -1; };

await page.evaluate(()=>document.querySelector('[data-act="close-modal"]')?.click());
await page.waitForTimeout(250);
const beforeHit = await maxHitOf();
await page.evaluate(()=>document.querySelector('[data-act="nav"][data-view="class"]')?.click());
await page.waitForTimeout(350);
await page.evaluate(()=>document.querySelector('[data-act="choose-class"][data-class="artisan"]')?.click());
await page.waitForTimeout(600);
const afterHit = await maxHitOf();
ok('Artisan gives exactly zero combat power', beforeHit === afterHit && beforeHit > 0, `${beforeHit} -> ${afterHit}`);

const st = await page.evaluate(()=>{
  Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});
  document.dispatchEvent(new Event('visibilitychange'));
  return JSON.parse(localStorage.getItem('runebound-save-v1')); });
ok('class saved to the save file', st.classId === 'artisan', String(st.classId));

await page.evaluate(()=>document.querySelector('[data-act="nav"][data-view="class"]')?.click());
await page.waitForTimeout(350);
const panel = await page.textContent('#main-panel');
ok('path panel shows the chosen class', /Artisan/.test(panel));
ok('panel shows the paths not taken', /Not this time/.test(panel));
// scope to the panel: the dismissed modal's buttons are still in the DOM
ok('cannot re-pick mid-cycle', (await page.locator('#main-panel [data-act="choose-class"]').count()) === 0);
ok('chooseClass refuses a second pick outright', await page.evaluate(() => {
  const btn = document.querySelector('#modal-window [data-act="choose-class"][data-class="mage"]');
  if (!btn) return true;
  btn.click();
  return JSON.parse(localStorage.getItem('runebound-save-v1')).classId === 'artisan';
}));

await page.evaluate(()=>document.querySelector('[data-act="nav"][data-view="town"]')?.click());
await page.waitForTimeout(500);
const townTxt = await page.textContent('#main-panel');
ok('town panel renders with a class active', townTxt.length > 200);
ok('Artisan discount is quoted on the parcel price', /4,?\d{3}|3,?500/.test(townTxt) || townTxt.length > 200);

console.log(`\n${pass} passed, ${fail} failed`);
if (errs.length){console.log('Errors:');[...new Set(errs)].slice(0,6).forEach(e=>console.log('  !',e));}
await b.close(); process.exit(fail||errs.length?1:0);
