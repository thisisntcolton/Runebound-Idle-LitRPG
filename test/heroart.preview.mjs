// Contact sheet: every hairstyle, face shape, and feature combination,
// so a broken SVG path is visible rather than hiding behind one preset.
import { chromium } from 'playwright';
import { HAIR_STYLES, FACE_SHAPES, MARKS, FACIAL_HAIR, EYE_SHAPES, defaultLook } from '../src/data/appearance.js';
import { heroPortrait } from '../src/ui/heroart.js';

const cells = [];
const add = (label, look) => cells.push(`<figure><div>${heroPortrait(look, 120)}</div><figcaption>${label}</figcaption></figure>`);
HAIR_STYLES.forEach((h,i)=>add('hair: '+h.name, {...defaultLook(), hair:i, hairCol:i%12, cloth:i%12}));
FACE_SHAPES.forEach((f,i)=>add('face: '+f.name, {...defaultLook(), face:i, hair:2, skin:i+2, hairCol:3}));
MARKS.forEach((m,i)=>add('mark: '+m.name, {...defaultLook(), mark:i, hair:1, skin:4, cloth:i%12}));
FACIAL_HAIR.forEach((f,i)=>add('beard: '+f.name, {...defaultLook(), beard:i, hair:0, skin:3, hairCol:2}));
EYE_SHAPES.forEach((e,i)=>add('eyes: '+e.name, {...defaultLook(), eyes:i, eyeCol:i, hair:5, skin:2}));
for (let i=0;i<6;i++) add('random '+(i+1), (()=>{const l=defaultLook();
  l.face=i%5;l.skin=(i*3)%12;l.hair=(i*2)%10;l.hairCol=(i*5)%12;l.eyes=i%6;l.eyeCol=i%10;
  l.brows=i%5;l.mouth=i%5;l.beard=i%5;l.mark=i%6;l.build=i%3;l.cloth=(i*4)%12;return l;})());

const html = `<style>
  body{background:#0d1220;color:#d9e2f5;font-family:system-ui;margin:0;padding:20px}
  .grid{display:grid;grid-template-columns:repeat(8,1fr);gap:10px}
  figure{margin:0;background:#141b2e;border:1px solid #2b3a5e;border-radius:10px;padding:8px;text-align:center}
  figcaption{font-size:10px;color:#8fa0c4;margin-top:4px}
  svg{margin:0 auto}
</style><div class="grid">${cells.join('')}</div>`;

const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const page = await (await b.newContext({viewport:{width:1400,height:1200},deviceScaleFactor:2})).newPage();
await page.setContent(html);
await page.waitForTimeout(300);
await page.screenshot({path:'/tmp/hero-grid.png', fullPage:true});
await b.close();
console.log(`rendered ${cells.length} variants`);
